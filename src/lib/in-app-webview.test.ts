// node --test src/lib/in-app-webview.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { isInAppWebView } from "./in-app-webview.ts";

test("nhận diện WebView trong app", () => {
  for (const ua of [
    "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36 Zalo/24.09.01",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605.1.15 [FBAN/FBIOS;FBAV/440.0]",
    "Mozilla/5.0 (Linux; Android 13) Chrome/120 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/440.0]",
    "Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 Instagram 300.0.0.29.110",
    "Mozilla/5.0 (Linux; Android 12) Chrome/120 Safari/537.36 BytedanceWebview/d8a21c6",
    "Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 Line/13.5.0",
  ]) {
    assert.equal(isInAppWebView(ua), true, ua);
  }
});

test("không đụng browser thường", () => {
  for (const ua of [
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605.1.15 Version/17.0 Mobile Safari/604.1",
    "Mozilla/5.0 (Linux; Android 13; SM-S911B) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    // "Airline/…", "Outline/…" — đừng để \bLine\b bắt nhầm mấy UA có chữ line
    "Mozilla/5.0 (Windows NT 10.0) Chrome/120 Safari/537.36 Streamline/2.0",
    undefined,
  ]) {
    assert.equal(isInAppWebView(ua), false, String(ua));
  }
});
