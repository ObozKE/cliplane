"use client";

import { useState } from "react";
import { Check, CheckCircle2, Loader2 } from "lucide-react";
import { toggleTutorialProgressAction } from "@/app/(marketing)/learn/actions";

interface TutorialCompletionButtonProps {
  slug: string;
  initialCompleted: boolean;
  isAuthenticated: boolean;
}

export function TutorialCompletionButton({
  slug,
  initialCompleted,
  isAuthenticated,
}: TutorialCompletionButtonProps) {
  const [isCompleted, setIsCompleted] = useState(initialCompleted);
  const [isPending, setIsPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleToggle() {
    if (!isAuthenticated) {
      setNotice("Sign in to save your learning progress across devices.");
      setTimeout(() => setNotice(null), 4000);
      return;
    }

    setIsPending(true);
    const result = await toggleTutorialProgressAction(slug);
    setIsPending(false);

    if (result.success) {
      setIsCompleted(result.data.completed);
      setNotice(result.data.completed ? "Lesson marked as completed!" : "Progress reset for this lesson.");
      setTimeout(() => setNotice(null), 3000);
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3">
      <button
        onClick={handleToggle}
        disabled={isPending}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm ${
          isCompleted
            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25"
            : "bg-muted text-foreground hover:bg-muted/80 border border-border"
        }`}
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        ) : isCompleted ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        ) : (
          <Check className="w-4 h-4 text-muted-foreground" />
        )}
        <span>{isCompleted ? "Completed ✓" : "Mark as Complete"}</span>
      </button>

      {notice && (
        <span className="text-xs text-muted-foreground animate-fade-in font-medium">
          {notice}
        </span>
      )}
    </div>
  );
}
