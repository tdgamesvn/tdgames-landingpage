/**
 * Discord webhook helper — grouped by business domain.
 *
 * Lookup order per channel:
 *   1. Channel-specific env var (e.g. DISCORD_WEBHOOK_HR)
 *   2. Fallback: DISCORD_WEBHOOK_URL
 *
 * If neither is set the call is silently skipped (no error).
 */

const CHANNEL_ENV = {
  hr: "DISCORD_WEBHOOK_HR",
  sales: "DISCORD_WEBHOOK_SALES",
  // future: system, ...
} as const;

export type DiscordChannel = keyof typeof CHANNEL_ENV;

export interface DiscordPayload {
  content?: string;
  embeds?: Array<{
    title?: string;
    description?: string;
    color?: number;
    fields?: Array<{ name: string; value: string; inline?: boolean }>;
    timestamp?: string;
    footer?: { text: string };
  }>;
}

/**
 * Send a Discord webhook message to the given channel.
 * Returns `true` if sent, `false` if skipped (no URL), throws on fetch error.
 */
export async function discordNotify(
  channel: DiscordChannel,
  payload: DiscordPayload,
): Promise<boolean> {
  const url =
    process.env[CHANNEL_ENV[channel]] ?? process.env.DISCORD_WEBHOOK_URL;

  if (!url) return false;

  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return true;
}

/**
 * Resolve the webhook URL for a channel (useful when the caller needs
 * to check availability before building an expensive payload).
 */
export function getDiscordUrl(channel: DiscordChannel): string | undefined {
  return process.env[CHANNEL_ENV[channel]] ?? process.env.DISCORD_WEBHOOK_URL;
}
