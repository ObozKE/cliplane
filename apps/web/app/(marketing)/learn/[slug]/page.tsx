import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight, Clock, ShieldCheck, ArrowLeft } from "lucide-react";
import { getAllTutorials, getTutorialBySlug } from "@/lib/tutorials";
import { TutorialMarkdownRenderer } from "@/components/tutorials/TutorialMarkdownRenderer";
import { TutorialCompletionButton } from "@/components/tutorials/TutorialCompletionButton";
import { getTutorialProgressAction } from "../actions";

interface LessonPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const tutorials = getAllTutorials();
  return tutorials.map((t) => ({
    slug: t.slug,
  }));
}

export async function generateMetadata({ params }: LessonPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tutorial = getTutorialBySlug(slug);
  if (!tutorial) {
    return { title: "Lesson Not Found — ClipName" };
  }

  return {
    title: `${tutorial.title} — ClipName Tutorials`,
    description: tutorial.summary,
  };
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { slug } = await params;
  const tutorial = getTutorialBySlug(slug);

  if (!tutorial) {
    notFound();
  }

  const progressResult = await getTutorialProgressAction();
  const completedSlugs = new Set(progressResult.success ? progressResult.data.completedSlugs : []);
  const isCompleted = completedSlugs.has(tutorial.slug);

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-10">
      {/* Back to Learn Navigation */}
      <div>
        <Link
          href="/learn"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Tutorials</span>
        </Link>
      </div>

      {/* Lesson Meta Header */}
      <div className="space-y-4 pb-6 border-b border-border">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="px-2.5 py-0.5 rounded-md font-mono font-semibold bg-[var(--accent-default)]/15 text-[var(--accent-default)]">
            Lesson {tutorial.order} of 6
          </span>
          <span className="px-2.5 py-0.5 rounded-md font-medium text-muted-foreground bg-muted">
            {tutorial.category}
          </span>
          <span className="flex items-center gap-1 text-muted-foreground font-mono">
            <Clock className="w-3.5 h-3.5" />
            {tutorial.readTime} min read
          </span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          {tutorial.title}
        </h1>

        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
          {tutorial.summary}
        </p>

        {/* Completion Action */}
        <div className="pt-2">
          <TutorialCompletionButton
            slug={tutorial.slug}
            initialCompleted={isCompleted}
            isAuthenticated={progressResult.success}
          />
        </div>
      </div>

      {/* Lesson Content */}
      <div className="py-2">
        <TutorialMarkdownRenderer content={tutorial.content} />
      </div>

      {/* Completion Action at Bottom */}
      <div className="p-6 rounded-2xl border border-border bg-card/60 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-foreground">Finished this lesson?</h2>
          <p className="text-xs text-muted-foreground">Keep track of your learning progress across modules.</p>
        </div>
        <TutorialCompletionButton
          slug={tutorial.slug}
          initialCompleted={isCompleted}
          isAuthenticated={progressResult.success}
        />
      </div>

      {/* Prev / Next Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border">
        {tutorial.prev ? (
          <Link
            href={`/learn/${tutorial.prev.slug}`}
            className="group flex flex-col gap-1 p-4 rounded-xl border border-border bg-card hover:border-[var(--accent-default)]/40 transition-colors"
          >
            <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
              <ChevronLeft className="w-3.5 h-3.5" /> Previous Lesson
            </span>
            <span className="text-sm font-semibold text-foreground group-hover:text-[var(--accent-default)] transition-colors line-clamp-1">
              {tutorial.prev.title}
            </span>
          </Link>
        ) : (
          <div />
        )}

        {tutorial.next ? (
          <Link
            href={`/learn/${tutorial.next.slug}`}
            className="group flex flex-col gap-1 p-4 rounded-xl border border-border bg-card hover:border-[var(--accent-default)]/40 transition-colors sm:text-right"
          >
            <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1 sm:justify-end">
              Next Lesson <ChevronRight className="w-3.5 h-3.5" />
            </span>
            <span className="text-sm font-semibold text-foreground group-hover:text-[var(--accent-default)] transition-colors line-clamp-1">
              {tutorial.next.title}
            </span>
          </Link>
        ) : (
          <div />
        )}
      </div>

      {/* Mandatory Disclaimer */}
      <div className="p-6 rounded-2xl border border-border/80 bg-muted/20 space-y-2 text-xs text-muted-foreground leading-relaxed">
        <div className="flex items-center gap-2 font-semibold text-foreground uppercase tracking-wider text-[11px]">
          <ShieldCheck className="w-4 h-4 text-[var(--accent-default)]" />
          <span>Notice & Disclaimers</span>
        </div>
        <p>
          Results vary. ClipName is a clipping tool and does not guarantee views, followers, or earnings. Game publishers and platforms set their own rules on game footage and monetization — check them before you post.
        </p>
        <p className="text-[11px] text-muted-foreground/80">
          Not affiliated with or endorsed by Rockstar Games or Take-Two Interactive.
        </p>
      </div>
    </div>
  );
}
