import { readdir } from "node:fs/promises";
import path from "node:path";

const IMAGES_DIR = path.join(process.cwd(), "public", "images");
const ALLOWED_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);

async function listImages(dir: string, prefix = ""): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        return listImages(fullPath, relativePath);
      }

      if (!entry.isFile() || !ALLOWED_EXT.has(path.extname(entry.name).toLowerCase())) {
        return [];
      }

      return [relativePath.split(path.sep).join("/")];
    }),
  );

  return nested.flat();
}

export async function GET() {
  try {
    const files = (await listImages(IMAGES_DIR))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    return Response.json(
      {
        images: files.map((name) =>
          `/images/${name.split("/").map(encodeURIComponent).join("/")}`,
        ),
      },
      { status: 200 },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to list images";
    return Response.json({ error: message, images: [] }, { status: 200 });
  }
}

