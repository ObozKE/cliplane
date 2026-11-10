import React from "react";
import Link from "next/link";
import { Info, AlertTriangle, Lightbulb } from "lucide-react";

interface TutorialMarkdownRendererProps {
  content: string;
}

/**
 * Pure React Server Component rendering standard Markdown with Carefront styling,
 * GitHub-style alerts ([!NOTE], [!TIP], [!IMPORTANT]), tables, and clean typography.
 */
export function TutorialMarkdownRenderer({ content }: TutorialMarkdownRendererProps) {
  const sections = content.split(/\r?\n\r?\n/);

  return (
    <article className="prose prose-invert max-w-none space-y-6 text-foreground/90 leading-relaxed font-sans">
      {sections.map((section, idx) => {
        const trimmed = section.trim();
        if (!trimmed) return null;

        // 1. Headers
        if (trimmed.startsWith("# ")) {
          return (
            <h1 key={idx} className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground pt-4 pb-2 border-b border-border">
              {trimmed.replace(/^#\s+/, "")}
            </h1>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <h2 key={idx} className="text-xl sm:text-2xl font-bold tracking-tight text-foreground pt-6 pb-1">
              {trimmed.replace(/^##\s+/, "")}
            </h2>
          );
        }
        if (trimmed.startsWith("### ")) {
          return (
            <h3 key={idx} className="text-lg font-semibold tracking-tight text-foreground pt-3">
              {trimmed.replace(/^###\s+/, "")}
            </h3>
          );
        }

        // 2. Horizontal Rules
        if (trimmed === "---") {
          return <hr key={idx} className="border-border my-6" />;
        }

        // 3. Alerts (> [!NOTE], > [!TIP], > [!IMPORTANT])
        if (trimmed.startsWith("> [!NOTE]")) {
          const body = trimmed.replace(/^>\s*\[!NOTE\]\s*/, "").replace(/^>\s?/gm, "");
          return (
            <div key={idx} className="flex gap-3 rounded-xl border border-sky-500/20 bg-sky-500/10 p-4 text-sm text-sky-200">
              <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
              <div className="space-y-1">{renderFormattedText(body)}</div>
            </div>
          );
        }
        if (trimmed.startsWith("> [!TIP]")) {
          const body = trimmed.replace(/^>\s*\[!TIP\]\s*/, "").replace(/^>\s?/gm, "");
          return (
            <div key={idx} className="flex gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
              <Lightbulb className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1">{renderFormattedText(body)}</div>
            </div>
          );
        }
        if (trimmed.startsWith("> [!IMPORTANT]") || trimmed.startsWith("> [!WARNING]")) {
          const body = trimmed.replace(/^>\s*\[!(?:IMPORTANT|WARNING)\]\s*/, "").replace(/^>\s?/gm, "");
          return (
            <div key={idx} className="flex gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">{renderFormattedText(body)}</div>
            </div>
          );
        }

        // 4. Standard Blockquotes
        if (trimmed.startsWith("> ")) {
          const body = trimmed.replace(/^>\s?/gm, "");
          return (
            <blockquote key={idx} className="border-l-4 border-[var(--accent-default)] pl-4 italic text-muted-foreground my-4">
              {renderFormattedText(body)}
            </blockquote>
          );
        }

        // 5. Code Blocks
        if (trimmed.startsWith("```")) {
          const lines = trimmed.split(/\r?\n/);
          const lang = lines[0]?.replace(/^```/, "").trim() || "";
          const code = lines.slice(1, -1).join("\n");
          return (
            <div key={idx} className="rounded-xl border border-border bg-card/80 overflow-hidden font-mono text-xs my-4 shadow-sm">
              {lang && (
                <div className="bg-muted/50 px-4 py-1.5 border-b border-border text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                  {lang}
                </div>
              )}
              <pre className="p-4 overflow-x-auto text-emerald-400 leading-relaxed font-mono">
                <code>{code}</code>
              </pre>
            </div>
          );
        }

        // 6. Tables
        if (trimmed.includes("|") && trimmed.includes("\n|")) {
          return renderTable(trimmed, idx);
        }

        // 7. Unordered Lists
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          const items = trimmed.split(/\r?\n/).map((line) => line.replace(/^[-*]\s+/, ""));
          return (
            <ul key={idx} className="space-y-2 list-disc list-inside text-foreground/80 pl-2">
              {items.map((item, itemIdx) => (
                <li key={itemIdx} className="leading-relaxed">
                  {renderFormattedText(item)}
                </li>
              ))}
            </ul>
          );
        }

        // 8. Ordered Lists
        if (/^\d+\.\s/.test(trimmed)) {
          const items = trimmed.split(/\r?\n/).map((line) => line.replace(/^\d+\.\s+/, ""));
          return (
            <ol key={idx} className="space-y-2 list-decimal list-inside text-foreground/80 pl-2">
              {items.map((item, itemIdx) => (
                <li key={itemIdx} className="leading-relaxed">
                  {renderFormattedText(item)}
                </li>
              ))}
            </ol>
          );
        }

        // 9. Standard Paragraph
        return (
          <p key={idx} className="text-foreground/85 leading-relaxed text-sm sm:text-base">
            {renderFormattedText(trimmed)}
          </p>
        );
      })}
    </article>
  );
}

/**
 * Parses inline formatting: bold (**), italic (*), inline code (`), and links ([text](url)).
 */
function renderFormattedText(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`|\[.*?\]\(.*?\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(<strong key={match.index} className="font-semibold text-foreground">{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("*") && token.endsWith("*")) {
      parts.push(<em key={match.index} className="italic text-foreground/90">{token.slice(1, -1)}</em>);
    } else if (token.startsWith("`") && token.endsWith("`")) {
      parts.push(
        <code key={match.index} className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-[var(--accent-default)]">
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("[") && token.includes("](") && token.endsWith(")")) {
      const linkMatch = token.match(/^\[(.*?)\]\((.*?)\)$/);
      if (linkMatch && linkMatch[1] && linkMatch[2]) {
        const linkText = linkMatch[1];
        const linkUrl = linkMatch[2];
        const isExternal = linkUrl.startsWith("http");
        parts.push(
          <Link
            key={match.index}
            href={linkUrl}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
            className="text-[var(--accent-default)] hover:underline underline-offset-4 font-medium"
          >
            {linkText}
          </Link>
        );
      }
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

/**
 * Formats markdown tables into responsive HTML tables.
 */
function renderTable(tableText: string, key: number): React.ReactNode {
  const lines = tableText.split(/\r?\n/).filter((l) => l.trim().startsWith("|"));
  if (lines.length < 2) return null;

  const firstLine = lines[0] || "";
  const headerCells = firstLine
    .split("|")
    .map((c) => c.trim())
    .filter((_, i, arr) => i > 0 && i < arr.length - 1);

  const rowLines = lines.slice(2); // Skip separator row

  return (
    <div key={key} className="overflow-x-auto my-6 rounded-xl border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted/50 border-b border-border">
          <tr>
            {headerCells.map((h, i) => (
              <th key={i} className="px-4 py-3 font-semibold text-foreground">
                {renderFormattedText(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rowLines.map((row, rIdx) => {
            const cells = row
              .split("|")
              .map((c) => c.trim())
              .filter((_, i, arr) => i > 0 && i < arr.length - 1);
            return (
              <tr key={rIdx} className="hover:bg-muted/20 transition-colors">
                {cells.map((cell, cIdx) => (
                  <td key={cIdx} className="px-4 py-3 text-foreground/85">
                    {renderFormattedText(cell)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
