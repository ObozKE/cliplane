"use server";

import { z } from "zod";
import {
  logBusinessEvent,
  successResult,
  errorResult,
  type ActionResult,
} from "@cliplane/shared";
import { getAuthenticatedUser, createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

const slugSchema = z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, "Invalid slug format");

export interface TutorialProgressResult {
  completedSlugs: string[];
}

export interface ToggleTutorialResult {
  completed: boolean;
  slug: string;
}

/**
 * Fetches the list of completed tutorial slugs for the authenticated user.
 * Returns an empty array if the user is not authenticated.
 */
export async function getTutorialProgressAction(): Promise<ActionResult<TutorialProgressResult>> {
  try {
    const user = await getAuthenticatedUser();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("tutorial_progress")
      .select("tutorial_slug")
      .eq("user_id", user.id);

    if (error) {
      return errorResult("Failed to fetch tutorial progress", "INTERNAL_ERROR");
    }

    const completedSlugs = (data || []).map((row) => row.tutorial_slug);
    return successResult({ completedSlugs });
  } catch {
    // Return empty array for anonymous guests
    return successResult({ completedSlugs: [] });
  }
}

/**
 * Toggles tutorial completion status for the current user.
 * Strict IDOR / Authentication: only operates on the authenticated user's ID.
 */
export async function toggleTutorialProgressAction(
  rawSlug: string,
): Promise<ActionResult<ToggleTutorialResult>> {
  try {
    const user = await getAuthenticatedUser();
    const supabase = await createClient();

    // 1. Rate limiting
    const rateLimit = await checkRateLimit("apiDefault", user.id);
    if (!rateLimit.success) {
      return errorResult("Too many requests. Please slow down.", "RATE_LIMITED");
    }

    // 2. Validate slug
    const parsed = slugSchema.safeParse(rawSlug);
    if (!parsed.success) {
      return errorResult(parsed.error.issues[0]?.message || "Invalid tutorial slug", "VALIDATION_FAILED");
    }
    const slug = parsed.data;

    // 3. Check existing progress
    const { data: existing, error: checkError } = await supabase
      .from("tutorial_progress")
      .select("id")
      .eq("user_id", user.id)
      .eq("tutorial_slug", slug)
      .maybeSingle();

    if (checkError) {
      return errorResult("Failed to query tutorial progress", "INTERNAL_ERROR");
    }

    if (existing) {
      // Delete existing completion
      const { error: deleteError } = await supabase
        .from("tutorial_progress")
        .delete()
        .eq("user_id", user.id)
        .eq("tutorial_slug", slug);

      if (deleteError) {
        return errorResult("Failed to update progress", "INTERNAL_ERROR");
      }

      logBusinessEvent({
        event: "tutorial_uncompleted" as any,
        userId: user.id,
        details: { slug },
      });

      return successResult({ completed: false, slug });
    }

    // Insert new completion
    const { error: insertError } = await supabase
      .from("tutorial_progress")
      .insert({
        user_id: user.id,
        tutorial_slug: slug,
        completed_at: new Date().toISOString(),
      });

    if (insertError) {
      return errorResult("Failed to record tutorial completion", "INTERNAL_ERROR");
    }

    logBusinessEvent({
      event: "tutorial_completed" as any,
      userId: user.id,
      details: { slug },
    });

    return successResult({ completed: true, slug });
  } catch {
    return errorResult("Authentication required to save tutorial progress.", "UNAUTHORIZED");
  }
}
