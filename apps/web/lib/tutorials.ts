import fs from "node:fs";
import path from "node:path";

export interface TutorialMeta {
  title: string;
  slug: string;
  order: number;
  category: string;
  readTime: number;
  summary: string;
}

export interface Tutorial extends TutorialMeta {
  content: string;
  prev?: { slug: string; title: string };
  next?: { slug: string; title: string };
}

function getTutorialsDirectory(): string {
  // Check local apps/web/content/tutorials first, then workspace root content/tutorials
  const localDir = path.join(process.cwd(), "content", "tutorials");
  if (fs.existsSync(localDir)) {
    return localDir;
  }
  const rootDir = path.join(process.cwd(), "..", "..", "content", "tutorials");
  if (fs.existsSync(rootDir)) {
    return rootDir;
  }
  return localDir;
}

function parseFrontmatter(fileContent: string): { meta: TutorialMeta; body: string } {
  const match = fileContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return {
      meta: {
        title: "Untitled Lesson",
        slug: "untitled",
        order: 99,
        category: "General",
        readTime: 5,
        summary: "",
      },
      body: fileContent,
    };
  }

  const rawMeta = match[1] || "";
  const body = match[2] || "";

  const meta: Partial<TutorialMeta> = {};
  for (const line of rawMeta.split(/\r?\n/)) {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;
    const key = line.slice(0, colonIndex).trim();
    let val = line.slice(colonIndex + 1).trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.slice(1, -1);
    }

    if (key === "title") meta.title = val;
    if (key === "slug") meta.slug = val;
    if (key === "order") meta.order = Number.parseInt(val, 10);
    if (key === "category") meta.category = val;
    if (key === "readTime") meta.readTime = Number.parseInt(val, 10);
    if (key === "summary") meta.summary = val;
  }

  return {
    meta: {
      title: meta.title || "Untitled",
      slug: meta.slug || "lesson",
      order: meta.order || 99,
      category: meta.category || "General",
      readTime: meta.readTime || 5,
      summary: meta.summary || "",
    },
    body,
  };
}

/**
 * Returns all tutorials ordered by lesson order.
 */
export function getAllTutorials(): TutorialMeta[] {
  const dir = getTutorialsDirectory();
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md") || f.endsWith(".mdx"));
  const tutorials: TutorialMeta[] = [];

  for (const file of files) {
    const raw = fs.readFileSync(path.join(dir, file), "utf-8");
    const { meta } = parseFrontmatter(raw);
    tutorials.push(meta);
  }

  return tutorials.sort((a, b) => a.order - b.order);
}

/**
 * Returns a specific tutorial by slug, including adjacent navigation.
 */
export function getTutorialBySlug(slug: string): Tutorial | null {
  const all = getAllTutorials();
  const index = all.findIndex((t) => t.slug === slug);
  if (index === -1) return null;

  const dir = getTutorialsDirectory();
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md") || f.endsWith(".mdx"));

  for (const file of files) {
    const raw = fs.readFileSync(path.join(dir, file), "utf-8");
    const { meta, body } = parseFrontmatter(raw);
    if (meta.slug === slug) {
      const prevMeta = index > 0 ? all[index - 1] : undefined;
      const nextMeta = index < all.length - 1 ? all[index + 1] : undefined;

      return {
        ...meta,
        content: body,
        prev: prevMeta ? { slug: prevMeta.slug, title: prevMeta.title } : undefined,
        next: nextMeta ? { slug: nextMeta.slug, title: nextMeta.title } : undefined,
      };
    }
  }

  return null;
}
