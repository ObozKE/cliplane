import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, CheckCircle2, Clock, ChevronRight, ShieldCheck, Sparkles } from "lucide-react";
import { getAllTutorials } from "@/lib/tutorials";
import { getTutorialProgressAction } from "./actions";

export const metadata: Metadata = {
  title: "Creator Tutorials & Video Guidelines — ClipLane",
  description: "Learn how the clipping pipeline works, recording clean gameplay in OBS, pacing high-retention vertical clips, and game publisher copyright policies.",
};

export default async function LearnIndexPage() {
  const tutorials = getAllTutorials();
  const progressResult = await getTutorialProgressAction();
  const completedSlugs = new Set(progressResult.success ? progressResult.data.completedSlugs : []);

  const totalLessons = tutorials.length;
  const completedCount = tutorials.filter((t) => completedSlugs.has(t.slug)).length;
  const completionPercentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  return (
    <div className="space-y-12 max-w-4xl mx-auto py-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-default)]/10 text-[var(--accent-default)] text-xs font-mono font-semibold tracking-wide">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Creator Curriculum</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
          Gameplay Clipping Tutorials
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg max-w-2xl leading-relaxed">
          Master the technical pipeline, capture settings, pacing dynamics, and game-publisher policies required to build authentic, high-retention gameplay content.
        </p>

        {/* Progress Tracker */}
        <div className="p-5 rounded-2xl border border-border bg-card/60 backdrop-blur-sm space-y-3 mt-6 shadow-sm">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--accent-default)]" />
              Your Progress
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              {completedCount} of {totalLessons} completed ({completionPercentage}%)
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-[var(--accent-default)] transition-all duration-500 rounded-full"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Lesson List */}
      <div className="space-y-4">
        {tutorials.map((tutorial) => {
          const isCompleted = completedSlugs.has(tutorial.slug);

          return (
            <Link
              key={tutorial.slug}
              href={`/learn/${tutorial.slug}`}
              className="group block p-6 rounded-2xl border border-border bg-card hover:border-[var(--accent-default)]/50 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="px-2.5 py-0.5 rounded-md font-mono font-semibold bg-muted text-foreground">
                      Lesson {tutorial.order}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md font-medium text-muted-foreground bg-muted/50">
                      {tutorial.category}
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      {tutorial.readTime} min read
                    </span>
                  </div>

                  <h2 className="text-lg sm:text-xl font-bold text-foreground group-hover:text-[var(--accent-default)] transition-colors">
                    {tutorial.title}
                  </h2>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {tutorial.summary}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-center">
                  {isCompleted ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Completed
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-muted-foreground hidden sm:inline">
                      Start Lesson
                    </span>
                  )}
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Mandatory Regulatory & Legal Disclaimers */}
      <div className="p-6 rounded-2xl border border-border/80 bg-muted/20 space-y-3 text-xs text-muted-foreground leading-relaxed">
        <div className="flex items-center gap-2 font-semibold text-foreground uppercase tracking-wider text-[11px]">
          <ShieldCheck className="w-4 h-4 text-[var(--accent-default)]" />
          <span>Product & Publisher Disclaimers</span>
        </div>
        <p>
          Results vary. ClipLane is a clipping tool and does not guarantee views, followers, or earnings. Game publishers and platforms set their own rules on game footage and monetization — check them before you post.
        </p>
        <p className="text-[11px] text-muted-foreground/80">
          Not affiliated with or endorsed by Rockstar Games or Take-Two Interactive. All trademarks, service marks, and company names are the property of their respective owners.
        </p>
      </div>
    </div>
  );
}
