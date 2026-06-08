import { NextResponse } from "next/server";
import { spawn } from "node:child_process";
import path from "node:path";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const SCRIPT_PATH = path.join(/* turbopackIgnore: true */ process.cwd(), "scripts", "replace-media-urls.mjs");

function requireAdmin(req: Request) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return NextResponse.json({ error: "ADMIN_SECRET is required" }, { status: 500 });
  if (req.headers.get("x-admin-key") !== secret) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

type Mode = "dry-run" | "apply" | "rollback";

// Use the same Node.js binary running the server — avoids PATH issues on VPS/NVM
const NODE_BIN = process.execPath;

function commandForMode(mode: Mode) {
  if (mode === "dry-run") return [NODE_BIN, [SCRIPT_PATH]] as const;
  if (mode === "apply") return [NODE_BIN, [SCRIPT_PATH, "--apply"]] as const;
  return [NODE_BIN, [SCRIPT_PATH, "--rollback"]] as const;
}

export async function POST(request: Request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  const body = await request.json().catch(() => null);
  const mode = body?.mode as Mode | undefined;

  if (!mode || !["dry-run", "apply", "rollback"].includes(mode)) {
    return NextResponse.json({ error: "mode must be one of: dry-run, apply, rollback" }, { status: 400 });
  }

  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) return NextResponse.json({ error: "ADMIN_SECRET is required" }, { status: 500 });

  // Fetch mapping directly from Supabase — avoids the fragile HTTP self-call in the child process
  let mappingJson: string;
  if (mode !== "rollback") {
    const supabase = getSupabaseAdmin();
    const { data, error: dbErr } = await supabase
      .from("media_assets")
      .select("id,original_url,current_url")
      .eq("status", "active");
    if (dbErr) return NextResponse.json({ error: `DB error: ${dbErr.message}` }, { status: 500 });
    const mapping = (data ?? []).map((r) => ({ from: r.original_url, to: r.current_url }));
    mappingJson = JSON.stringify(mapping);
  } else {
    mappingJson = "[]";
  }

  const [command, args] = commandForMode(mode);

  const output = await new Promise<{ code: number | null; stdout: string; stderr: string }>((resolve) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: {
        ...process.env,
        ADMIN_KEY: adminSecret,
        MAPPING_JSON: mappingJson, // injected — no HTTP self-call needed
      },
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("close", (code) => {
      resolve({ code, stdout, stderr });
    });
  });

  if (output.code !== 0) {
    return NextResponse.json(
      {
        error: "replace-media-urls command failed",
        mode,
        exitCode: output.code,
        stderr: output.stderr,
        stdout: output.stdout,
      },
      { status: 500 },
    );
  }

  let parsed: unknown = null;
  try {
    parsed = JSON.parse(output.stdout);
  } catch {
    return NextResponse.json({ error: "Invalid script output", mode, stdout: output.stdout }, { status: 500 });
  }

  return NextResponse.json({ mode, result: parsed, stderr: output.stderr });
}
