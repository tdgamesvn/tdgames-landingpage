import { NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import { writeFile, mkdir, rm } from "fs/promises";
import path from "path";
import os from "os";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const execFileAsync = promisify(execFile);

// ---------------------------------------------------------------------------
// Auth helper
// ---------------------------------------------------------------------------
function requireAdmin(req: Request) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret)
    return NextResponse.json({ error: "ADMIN_SECRET is required" }, { status: 500 });
  if (req.headers.get("x-admin-key") !== secret)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type SpineCharacter = {
  id: string;
  name: string;
  slug: string;
  json_url: string | null;
  atlas_url: string | null;
  animations: string[];
  skin: string | null;
  scale: number;
  offset_x: number;
  offset_y: number;
  premultiplied_alpha: boolean;
  itchio_game_id: string | null;
  itchio_embed_url: string | null;
  [key: string]: unknown;
};

type RequestBody = {
  bgColor?: string;
  bgType?: "none" | "color";
};

// ---------------------------------------------------------------------------
// HTML generator
// ---------------------------------------------------------------------------
function buildHtml(
  char: SpineCharacter,
  bgType: "none" | "color" = "none",
  bgColor = "000000"
): string {
  const animations = char.animations && char.animations.length > 0
    ? char.animations
    : ["idle"];

  const anims = JSON.stringify(animations);

  const animScript = `
    var anims = ${anims};
    var state = player.animationState;
    if (anims.length === 1) {
      state.setAnimation(0, anims[0], true);
    } else {
      state.setAnimation(0, anims[0], false);
      for (var i = 1; i < anims.length; i++) {
        state.addAnimation(0, anims[i], false, 0);
      }
      state.addListener({
        complete: function(entry) {
          if (entry.trackIndex === 0 && entry.next === null) {
            state.setAnimation(0, anims[0], false);
            for (var i = 1; i < anims.length; i++) {
              state.addAnimation(0, anims[i], false, 0);
            }
          }
        }
      });
    }
  `.trim();

  const skinProp = char.skin
    ? `skin: ${JSON.stringify(char.skin)},`
    : "";

  const bgStyle =
    bgType === "color"
      ? `background: #${bgColor.replace(/^#/, "")};`
      : "background: transparent;";

  const transformParts: string[] = [];
  if (char.offset_x !== 0 || char.offset_y !== 0)
    transformParts.push(`translate(${char.offset_x}px, ${char.offset_y}px)`);
  if (char.scale !== 1)
    transformParts.push(`scale(${char.scale})`);
  const transform = transformParts.length > 0 ? transformParts.join(" ") : "";
  const playerTransform = transform ? `transform: ${transform}; transform-origin: center center;` : "";

  const SPINE_CDN = "https://unpkg.com/@esotericsoftware/spine-player@4.2/dist";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${char.name}</title>
  <link rel="stylesheet" href="${SPINE_CDN}/spine-player.css" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      ${bgStyle}
    }
    #player {
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100%;
      ${playerTransform}
    }
  </style>
</head>
<body>
  <div id="player"></div>
  <script src="${SPINE_CDN}/spine-player.js"></script>
  <script>
    new spine.SpinePlayer("player", {
      jsonUrl: ${JSON.stringify(char.json_url)},
      atlasUrl: ${JSON.stringify(char.atlas_url)},
      ${skinProp}
      alpha: true,
      backgroundColor: "#00000000",
      premultipliedAlpha: ${char.premultiplied_alpha},
      preserveDrawingBuffer: false,
      showControls: false,
      showLoading: false,
      success: function(player) {
        ${animScript}
      },
      error: function(player, msg) {
        console.error("[SpinePlayer] error:", msg);
      }
    });
  </script>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Auth
  const authError = requireAdmin(request);
  if (authError) return authError;

  const { id } = await params;

  // Parse optional body
  let body: RequestBody = {};
  try {
    const text = await request.text();
    if (text.trim()) body = JSON.parse(text) as RequestBody;
  } catch {
    // Empty or non-JSON body is fine
  }

  const bgType = body.bgType ?? "none";
  const bgColor = (body.bgColor ?? "000000").replace(/^#/, "");

  // 2. Validate env
  const apiKey = process.env.ITCHIO_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ITCHIO_API_KEY is not set" }, { status: 500 });
  }

  // 3. Fetch character from DB
  const supabase = getSupabaseAdmin();
  const { data: char, error: dbError } = await supabase
    .from("spine_characters")
    .select("*")
    .eq("id", id)
    .single<SpineCharacter>();

  if (dbError || !char) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  if (!char.itchio_game_id) {
    return NextResponse.json(
      { error: "itchio_game_id is not set. Set it in Admin → Spine → Edit character first." },
      { status: 400 }
    );
  }

  // 4. Get itch.io username (for embed URL construction)
  const meRes = await fetch(`https://itch.io/api/1/${apiKey}/me`);
  if (!meRes.ok) {
    return NextResponse.json(
      { error: `itch.io auth failed (HTTP ${meRes.status}). Check ITCHIO_API_KEY.` },
      { status: 502 }
    );
  }
  const meJson = await meRes.json() as { errors?: string[]; user?: { username: string } };
  if (meJson.errors?.length) {
    return NextResponse.json({ error: `itch.io API: ${meJson.errors.join(", ")}` }, { status: 502 });
  }
  const username = meJson.user?.username ?? "";

  // 5. Get game slug to construct embed URL
  const gameRes = await fetch(`https://itch.io/api/1/${apiKey}/game/${char.itchio_game_id}`);
  if (!gameRes.ok) {
    return NextResponse.json(
      { error: `Game ${char.itchio_game_id} not found on itch.io. Check itchio_game_id.` },
      { status: 400 }
    );
  }
  const gameJson = await gameRes.json() as {
    errors?: string[];
    game?: { url: string; title: string };
  };
  if (gameJson.errors?.length) {
    return NextResponse.json({ error: `itch.io: ${gameJson.errors.join(", ")}` }, { status: 502 });
  }

  // Derive slug from game URL: "https://tdgamesvn.itch.io/tdgames-spine-character" → "tdgames-spine-character"
  const gameUrl = gameJson.game?.url ?? `https://${username}.itch.io/${char.slug}`;
  const gameSlug = gameUrl.split("/").filter(Boolean).pop() ?? char.slug;

  // 6. Generate HTML
  const htmlContent = buildHtml(char, bgType, bgColor);

  // 7. Write to temp dir & butler push
  const tmpDir = path.join(os.tmpdir(), `spine-publish-${id}-${Date.now()}`);
  try {
    await mkdir(tmpDir, { recursive: true });
    await writeFile(path.join(tmpDir, "index.html"), htmlContent, "utf-8");

    // butler push <dir> <user>/<game>:<channel>
    // Auth via BUTLER_API_KEY env var (--api-key flag removed in butler v15+)
    const butlerTarget = `${username}/${gameSlug}:html5`;
    const { stdout, stderr } = await execFileAsync(
      "butler",
      ["push", tmpDir, butlerTarget],
      {
        timeout: 120_000,                  // 2 min max
        env: { ...process.env, HOME: "/root", BUTLER_API_KEY: apiKey },
      }
    );

    console.log("[butler push] stdout:", stdout);
    if (stderr) console.warn("[butler push] stderr:", stderr);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `butler push failed: ${msg}` },
      { status: 500 }
    );
  } finally {
    await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }

  // 8. Build embed URL (itch.io embed iframe format)
  const embedUrl = `https://itch.io/embed/${char.itchio_game_id}`;

  // 9. Save embed URL to DB
  await supabase
    .from("spine_characters")
    .update({ itchio_embed_url: embedUrl, updated_at: new Date().toISOString() })
    .eq("id", id);

  // 10. Return success
  return NextResponse.json({
    success: true,
    embed_url: embedUrl,
    game_url: gameUrl,
    butler_target: `${username}/${gameSlug}:html5`,
  });
}
