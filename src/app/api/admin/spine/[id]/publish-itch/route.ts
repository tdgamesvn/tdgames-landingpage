import { NextResponse } from "next/server";
import { zipSync } from "fflate";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  // Build animation sequence JS — mirrors spine-character.tsx logic
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

  // CSS transform — mirrors spine-character.tsx transform logic
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
    // Empty or non-JSON body is fine — all fields optional
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
      { error: "itchio_game_id is not set for this character. Set it in Admin → Spine first." },
      { status: 400 }
    );
  }

  // 4. Get current itch.io user
  const meRes = await fetch(`https://itch.io/api/1/${apiKey}/me`);
  if (!meRes.ok) {
    const text = await meRes.text().catch(() => meRes.statusText);
    return NextResponse.json({ error: `itch.io API error: ${text}` }, { status: 502 });
  }
  const meJson = await meRes.json() as { errors?: string[]; user?: { username: string; url?: string } };
  if (meJson.errors?.length) {
    return NextResponse.json({ error: `itch.io API error: ${meJson.errors.join(", ")}` }, { status: 502 });
  }
  const username = meJson.user?.username ?? "";

  // 5. Verify game exists on itch.io
  const gameRes = await fetch(`https://itch.io/api/1/${apiKey}/game/${char.itchio_game_id}`);
  if (gameRes.status === 404) {
    return NextResponse.json(
      { error: "Game not found on itch.io. Check itchio_game_id." },
      { status: 400 }
    );
  }
  if (!gameRes.ok) {
    const text = await gameRes.text().catch(() => gameRes.statusText);
    return NextResponse.json({ error: `itch.io game API error: ${text}` }, { status: 502 });
  }
  const gameJson = await gameRes.json() as {
    errors?: string[];
    game?: { id: number; url: string; title: string; slug?: string };
  };
  if (gameJson.errors?.length) {
    return NextResponse.json({ error: `itch.io game API error: ${gameJson.errors.join(", ")}` }, { status: 502 });
  }

  // Extract game URL — prefer explicit url field, fallback to constructed URL
  const gameUrl: string =
    gameJson.game?.url ||
    `https://${username}.itch.io/${char.slug}`;

  // 6. Generate HTML
  const htmlContent = buildHtml(char, bgType, bgColor);

  // 7. Create ZIP using fflate
  const encoded = new TextEncoder().encode(htmlContent);
  const zipBuffer = zipSync({ "index.html": encoded });

  // 8. Upload to itch.io
  const form = new FormData();
  form.append(
    "uploadFile",
    new Blob([zipBuffer], { type: "application/zip" }),
    "game.zip"
  );
  form.append("channel_name", "html5");
  form.append("user_version", String(Date.now()));

  const uploadRes = await fetch(
    `https://itch.io/api/1/${apiKey}/game/${char.itchio_game_id}/upload`,
    { method: "POST", body: form }
  );

  let uploadJson: Record<string, unknown>;
  try {
    uploadJson = await uploadRes.json() as Record<string, unknown>;
  } catch {
    const text = await uploadRes.text().catch(() => uploadRes.statusText);
    return NextResponse.json({ error: `itch.io upload response parse error: ${text}` }, { status: 502 });
  }

  if (!uploadRes.ok || (uploadJson.errors as string[] | undefined)?.length) {
    const errMsg = Array.isArray(uploadJson.errors)
      ? (uploadJson.errors as string[]).join(", ")
      : uploadRes.statusText;
    return NextResponse.json({ error: `itch.io upload failed: ${errMsg}` }, { status: 502 });
  }

  // 9. Derive embed URL
  // itch.io embed URL pattern: https://{username}.itch.io/{game-slug}
  // The embed URL for iframe use is typically the game URL itself.
  const embedUrl = gameUrl;

  // 10. Update DB with embed URL
  await supabase
    .from("spine_characters")
    .update({ itchio_embed_url: embedUrl, updated_at: new Date().toISOString() })
    .eq("id", id);

  // 11. Return success
  return NextResponse.json({
    success: true,
    embed_url: embedUrl,
    game_url: gameUrl,
    upload: uploadJson,
  });
}
