import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import ts from "typescript";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PORTFOLIO_DIR = path.join(process.cwd(), "src", "app", "portfolio");

function requireAdmin(req: Request) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return NextResponse.json({ error: "ADMIN_SECRET is required" }, { status: 500 });
  if (req.headers.get("x-admin-key") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

function isSafeSlug(slug: string) {
  return /^[a-z0-9][a-z0-9-]*$/.test(slug);
}

async function listSlugs(): Promise<string[]> {
  const entries = await fs.readdir(PORTFOLIO_DIR, { withFileTypes: true });
  const slugs: string[] = [];
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const filePath = path.join(PORTFOLIO_DIR, e.name, "project-data.ts");
    try {
      await fs.access(filePath);
      slugs.push(e.name);
    } catch {
      /* skip dirs without project-data.ts */
    }
  }
  return slugs.sort();
}

type Slot = {
  source: "cover" | "module";
  moduleId?: string;
  moduleVariant?: string;
  srcIndex?: number;
  url: string;
  kind: "image" | "video" | "vimeo" | "other";
};

const VIDEO_EXT = /\.(mp4|webm|mov|m4v)(\?.*)?$/i;
const IMAGE_EXT = /\.(png|jpe?g|webp|gif|avif|svg)(\?.*)?$/i;
function detectKind(url: string, variant?: string): Slot["kind"] {
  if (variant === "vimeo") return "vimeo";
  if (VIDEO_EXT.test(url)) return "video";
  if (IMAGE_EXT.test(url)) return "image";
  return "other";
}

/**
 * Walk the AST of a `project-data.ts` file and extract every URL slot we
 * consider replaceable. Strict but tolerant: we only look for the patterns
 * actually used by these files (object literals with id/variant/src/srcs/
 * embedSrc) — no eval, no module loading.
 */
function extractSlots(content: string): { coverImage: string | null; modules: Slot[] } {
  const sf = ts.createSourceFile("project-data.ts", content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

  let coverImage: string | null = null;
  const modules: Slot[] = [];

  function readString(node: ts.Node | undefined): string | null {
    if (!node) return null;
    let n: ts.Node = node;
    while (ts.isAsExpression(n) || ts.isParenthesizedExpression(n)) {
      n = n.expression;
    }
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) return n.text;
    return null;
  }

  function readProp(obj: ts.ObjectLiteralExpression, name: string): ts.Expression | undefined {
    for (const p of obj.properties) {
      if (
        ts.isPropertyAssignment(p) &&
        ((ts.isIdentifier(p.name) && p.name.text === name) ||
          (ts.isStringLiteral(p.name) && p.name.text === name))
      ) {
        return p.initializer;
      }
    }
    return undefined;
  }

  function visit(node: ts.Node) {
    // export const projectMeta: ProjectMeta = { coverImage: "..." }
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
      const name = node.name.text;
      let init: ts.Expression | undefined = node.initializer;
      // Unwrap `[...] as readonly ShowcaseModule[]`, `(...)` etc.
      while (init && (ts.isAsExpression(init) || ts.isParenthesizedExpression(init))) {
        init = init.expression;
      }
      if (!init) {
        ts.forEachChild(node, visit);
        return;
      }
      if (name === "projectMeta" && ts.isObjectLiteralExpression(init)) {
        const v = readProp(init, "coverImage");
        const s = readString(v);
        if (s) coverImage = s;
      }
      if (name === "showcaseModules" && ts.isArrayLiteralExpression(init)) {
        for (const el of init.elements) {
          if (!ts.isObjectLiteralExpression(el)) continue;
          const idVal = readString(readProp(el, "id"));
          const variantVal = readString(readProp(el, "variant"));
          if (!idVal || !variantVal) continue;

          const single = readString(readProp(el, "src"));
          if (single) {
            modules.push({
              source: "module",
              moduleId: idVal,
              moduleVariant: variantVal,
              url: single,
              kind: detectKind(single, variantVal),
            });
            continue;
          }
          const embed = readString(readProp(el, "embedSrc"));
          if (embed) {
            modules.push({
              source: "module",
              moduleId: idVal,
              moduleVariant: variantVal,
              url: embed,
              kind: detectKind(embed, variantVal),
            });
            continue;
          }
          const srcsExpr = readProp(el, "srcs");
          if (srcsExpr && ts.isArrayLiteralExpression(srcsExpr)) {
            srcsExpr.elements.forEach((sub, i) => {
              const url = readString(sub);
              if (!url) return;
              modules.push({
                source: "module",
                moduleId: idVal,
                moduleVariant: variantVal,
                srcIndex: i,
                url,
                kind: detectKind(url, variantVal),
              });
            });
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sf);
  return { coverImage, modules };
}

export async function GET(request: Request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    const slugs = await listSlugs();
    return NextResponse.json({ slugs });
  }
  if (!isSafeSlug(slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }
  const filePath = path.join(PORTFOLIO_DIR, slug, "project-data.ts");
  try {
    const content = await fs.readFile(filePath, "utf8");
    const { coverImage, modules } = extractSlots(content);
    return NextResponse.json({
      slug,
      filePath: path.relative(process.cwd(), filePath),
      coverImage,
      modules,
    });
  } catch (e) {
    return NextResponse.json(
      { error: `Cannot read ${slug}: ${e instanceof Error ? e.message : String(e)}` },
      { status: 404 },
    );
  }
}
