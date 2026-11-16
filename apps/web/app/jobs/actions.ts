"use server";

import { headers } from "next/headers";
import {
  takedownRequestSchema,
  socialPublishSchema,
  type SocialPlatform,
  isSafePublicUrl,
  logBusinessEvent,
  successResult,
  errorResult,
  type ActionResult,
} from "@cliplane/shared";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

export interface ClipSignedUrls {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  duration: number;
  score: number;
  storagePath: string;
  thumbnailPath: string | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  createdAt: string;
}

/**
 * Retrieves signed URLs for all clips belonging to a job.
 * IDOR Protection: strictly verifies authenticated user owns the job.
 */
export async function getClipSignedUrlsAction(
  jobId: string,
): Promise<ActionResult<ClipSignedUrls[]>> {
  try {
    const user = await getAuthenticatedUser();
    const supabase = await createClient();

    // Verify ownership of the job
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, user_id")
      .eq("id", jobId)
      .eq("user_id", user.id)
      .single();

    if (jobError || !job) {
      return errorResult("Job not found or access denied.", "NOT_FOUND");
    }

    // Query clips for this job
    const { data: clips, error: clipsError } = await supabase
      .from("clips")
      .select("id, title, start_time, end_time, duration, score, storage_path, thumbnail_path, created_at")
      .eq("job_id", job.id)
      .order("score", { ascending: false });

    if (clipsError) {
      return errorResult("Failed to retrieve clips for this job.", "INTERNAL_ERROR");
    }

    if (!clips || clips.length === 0) {
      return successResult([]);
    }

    // Generate signed URLs (1 hour TTL) for private storage files
    const clipsWithUrls: ClipSignedUrls[] = await Promise.all(
      clips.map(async (clip) => {
        let videoUrl: string | null = null;
        let thumbnailUrl: string | null = null;

        if (clip.storage_path) {
          const { data: vData } = await supabase.storage
            .from("clips")
            .createSignedUrl(clip.storage_path, 3600);
          videoUrl = vData?.signedUrl || null;
        }

        if (clip.thumbnail_path) {
          const { data: tData } = await supabase.storage
            .from("clips")
            .createSignedUrl(clip.thumbnail_path, 3600);
          thumbnailUrl = tData?.signedUrl || null;
        }

        return {
          id: clip.id,
          title: clip.title,
          startTime: Number(clip.start_time),
          endTime: Number(clip.end_time),
          duration: Number(clip.duration),
          score: Number(clip.score),
          storagePath: clip.storage_path,
          thumbnailPath: clip.thumbnail_path,
          videoUrl,
          thumbnailUrl,
          createdAt: clip.created_at,
        };
      }),
    );

    return successResult(clipsWithUrls);
  } catch {
    return errorResult("An error occurred loading clip media.", "INTERNAL_ERROR");
  }
}

export type ClipDownloadFormat = "9:16" | "1:1" | "16:9" | "4:5" | "audio";

/**
 * Generates a short-lived (5 min) signed download URL for a clip across formats.
 * IDOR Protection: verifies that the requesting user owns the job associated with this clip.
 */
export async function getClipDownloadUrlAction(
  clipId: string,
  format: ClipDownloadFormat = "9:16",
): Promise<ActionResult<{ downloadUrl: string; filename: string; format: ClipDownloadFormat }>> {
  try {
    const user = await getAuthenticatedUser();
    const supabase = await createClient();

    // Query clip and join job to verify ownership
    const { data: clip, error: clipError } = await supabase
      .from("clips")
      .select("id, storage_path, job_id, jobs!inner(id, user_id)")
      .eq("id", clipId)
      .single();

    if (clipError || !clip) {
      return errorResult("Clip not found or access denied.", "NOT_FOUND");
    }

    const job = clip.jobs as unknown as { id: string; user_id: string } | null;
    if (!job || job.user_id !== user.id) {
      return errorResult("You do not have permission to download this clip.", "FORBIDDEN");
    }

    let filename = `cliplane_highlight_${clip.id.slice(0, 8)}.mp4`;
    if (format === "1:1") {
      filename = `cliplane_highlight_${clip.id.slice(0, 8)}_1x1_square.mp4`;
    } else if (format === "16:9") {
      filename = `cliplane_highlight_${clip.id.slice(0, 8)}_16x9_landscape.mp4`;
    } else if (format === "4:5") {
      filename = `cliplane_highlight_${clip.id.slice(0, 8)}_4x5_portrait.mp4`;
    } else if (format === "audio") {
      filename = `cliplane_highlight_${clip.id.slice(0, 8)}_audio.mp3`;
    }

    const { data, error: signError } = await supabase.storage
      .from("clips")
      .createSignedUrl(clip.storage_path, 300, {
        download: filename,
      });

    if (signError || !data?.signedUrl) {
      return errorResult("Failed to generate secure download link.", "INTERNAL_ERROR");
    }

    return successResult({
      downloadUrl: data.signedUrl,
      filename,
      format,
    });
  } catch {
    return errorResult("Unable to prepare clip download.", "INTERNAL_ERROR");
  }
}

/**
 * Submits a DMCA / copyright takedown or content report.
 * Rate-limited to prevent abuse.
 */
export async function reportClipAction(
  formData: unknown,
): Promise<ActionResult<{ reportId: string }>> {
  // Rate limit by IP
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  const rateLimit = await checkRateLimit("takedown", ip);

  if (!rateLimit.success) {
    return errorResult("Too many requests. Please try again later.", "RATE_LIMITED");
  }

  // Validate hostile input via Zod
  const parsed = takedownRequestSchema.safeParse(formData);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || "Validation failed";
    return errorResult(firstError, "VALIDATION_FAILED");
  }

  const { reporterName, reporterEmail, contentUrl, clipId, description } = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("takedown_requests")
    .insert({
      reporter_name: reporterName,
      reporter_email: reporterEmail,
      content_url: contentUrl,
      clip_id: clipId || null,
      description,
      ip_address: ip,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !data) {
    return errorResult("Failed to record report. Please contact copyright@cliplane.tech directly.", "INTERNAL_ERROR");
  }

  logBusinessEvent({
    event: "takedown_received",
    requestId: data.id,
    details: {
      reporterEmail,
      contentUrl,
      clipId,
    },
  });

  return successResult({ reportId: data.id });
}

export interface PublishClipToSocialParams {
  clipId: string;
  platform: SocialPlatform;
  customCaption?: string;
  customHashtags?: string[];
  format?: ClipDownloadFormat;
  webhookUrl?: string;
}

export interface PublishClipToSocialResult {
  platform: SocialPlatform;
  clipTitle: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  caption: string;
  hashtags: string[];
  fullPostText: string;
  studioUrl: string;
  deepLinkUrl: string;
  webhookDelivered?: boolean;
  webhookStatusCode?: number;
}

/**
 * Prepares direct social upload, generates platform deep-links,
 * formats viral captions/hashtags, and delivers webhook dispatches.
 * IDOR Protection: strictly verifies user owns the clip's job.
 */
export async function publishClipToSocialAction(
  params: PublishClipToSocialParams,
): Promise<ActionResult<PublishClipToSocialResult>> {
  try {
    const parsed = socialPublishSchema.safeParse({
      clipId: params.clipId,
      platform: params.platform,
      caption: params.customCaption,
      hashtags: params.customHashtags,
      format: params.format || "9:16",
      webhookUrl: params.webhookUrl,
    });

    if (!parsed.success) {
      const issue = parsed.error.issues[0]?.message || "Invalid social publishing parameters";
      return errorResult(issue, "VALIDATION_FAILED");
    }

    const user = await getAuthenticatedUser();
    const supabase = await createClient();

    // Verify clip ownership via job join
    const { data: clip, error: clipError } = await supabase
      .from("clips")
      .select("id, title, storage_path, thumbnail_path, score, duration, jobs!inner(id, user_id)")
      .eq("id", params.clipId)
      .single();

    if (clipError || !clip) {
      return errorResult("Clip not found or access denied.", "NOT_FOUND");
    }

    const job = clip.jobs as unknown as { id: string; user_id: string } | null;
    if (!job || job.user_id !== user.id) {
      return errorResult("You do not have permission to publish this clip.", "FORBIDDEN");
    }

    // Generate signed download URL (24 hours TTL for social upload ingestion)
    const { data: vData, error: signError } = await supabase.storage
      .from("clips")
      .createSignedUrl(clip.storage_path, 86400);

    if (signError || !vData?.signedUrl) {
      return errorResult("Failed to generate secure video link for social upload.", "INTERNAL_ERROR");
    }

    const videoUrl = vData.signedUrl;

    let thumbnailUrl: string | null = null;
    if (clip.thumbnail_path) {
      const { data: tData } = await supabase.storage
        .from("clips")
        .createSignedUrl(clip.thumbnail_path, 86400);
      thumbnailUrl = tData?.signedUrl || null;
    }

    const scorePct = Math.round(Number(clip.score || 0) * 100);
    const defaultCaption =
      params.customCaption?.trim() ||
      `${clip.title} 🔥 Unbelievable highlight moment clipped with @ClipLane! (${scorePct}% peak score)`;

    let hashtags = params.customHashtags && params.customHashtags.length > 0
      ? params.customHashtags
      : ["#ClipLane", "#Shorts", "#Viral", "#Gaming"];

    if (params.platform === "tiktok") {
      hashtags = params.customHashtags || ["#ClipLane", "#FYP", "#ForYou", "#ViralClips", "#Shorts"];
    } else if (params.platform === "youtube_shorts") {
      hashtags = params.customHashtags || ["#Shorts", "#YouTubeShorts", "#ClipLane", "#ViralHighlight"];
    } else if (params.platform === "instagram_reels") {
      hashtags = params.customHashtags || ["#Reels", "#ExplorePage", "#ReelsInstagram", "#ClipLane"];
    } else if (params.platform === "x_twitter") {
      hashtags = params.customHashtags || ["#ClipLane", "#Highlights"];
    } else if (params.platform === "linkedin") {
      hashtags = params.customHashtags || ["#VideoContent", "#ContentCreation", "#AI", "#ClipLane"];
    } else if (params.platform === "facebook") {
      hashtags = params.customHashtags || ["#Reels", "#FacebookReels", "#ClipLane"];
    }

    const fullPostText = `${defaultCaption}\n\n${hashtags.join(" ")}`;

    // Resolve platform Studio upload URLs and mobile deep-links
    let studioUrl = "https://www.youtube.com/upload";
    let deepLinkUrl = "vnd.youtube://";

    if (params.platform === "tiktok") {
      studioUrl = "https://www.tiktok.com/creator-center/upload";
      deepLinkUrl = "snssdk1233://";
    } else if (params.platform === "youtube_shorts") {
      studioUrl = "https://www.youtube.com/upload";
      deepLinkUrl = "vnd.youtube://";
    } else if (params.platform === "instagram_reels") {
      studioUrl = "https://www.instagram.com/reels/create/";
      deepLinkUrl = "instagram://share";
    } else if (params.platform === "x_twitter") {
      studioUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(fullPostText)}`;
      deepLinkUrl = `twitter://post?message=${encodeURIComponent(fullPostText)}`;
    } else if (params.platform === "linkedin") {
      studioUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(fullPostText)}`;
      deepLinkUrl = "linkedin://";
    } else if (params.platform === "facebook") {
      studioUrl = "https://www.facebook.com/reels/create";
      deepLinkUrl = "fb://";
    }

    let webhookDelivered = false;
    let webhookStatusCode: number | undefined;

    // Webhook dispatch if requested
    if (params.webhookUrl) {
      if (!isSafePublicUrl(params.webhookUrl)) {
        return errorResult("Webhook URL cannot target private or local networks.", "SSRF_DETECTED");
      }

      try {

        const webhookPayload = {
          event: "clip.social.publish",
          clipId: clip.id,
          title: clip.title,
          caption: defaultCaption,
          hashtags,
          fullPostText,
          videoUrl,
          thumbnailUrl,
          format: params.format || "9:16",
          score: Number(clip.score),
          duration: Number(clip.duration),
          platform: params.platform,
          publishedAt: new Date().toISOString(),
        };

        const res = await fetch(params.webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "ClipLane-SocialPublisher/1.0",
          },
          body: JSON.stringify(webhookPayload),
          signal: AbortSignal.timeout(6000),
        });

        webhookDelivered = res.ok;
        webhookStatusCode = res.status;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return errorResult(`Failed to deliver webhook payload: ${msg}`, "WEBHOOK_FAILED");
      }
    }

    logBusinessEvent({
      event: "clip_social_published",
      clipId: clip.id,
      userId: user.id,
      platform: params.platform,
      format: params.format || "9:16",
      webhookDelivered,
    });

    return successResult({
      platform: params.platform,
      clipTitle: clip.title,
      videoUrl,
      thumbnailUrl,
      caption: defaultCaption,
      hashtags,
      fullPostText,
      studioUrl,
      deepLinkUrl,
      webhookDelivered,
      webhookStatusCode,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return errorResult(`Social publish error: ${msg}`, "INTERNAL_ERROR");
  }
}
