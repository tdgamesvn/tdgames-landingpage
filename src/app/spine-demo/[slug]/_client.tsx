"use client";

import { useState } from "react";
import { SpineCharacter } from "@/components/spine-character";

export type DemoConfig = {
  // Character data
  jsonUrl?: string;
  binaryUrl?: string;
  atlasUrl: string;
  animations: string[];
  skin?: string;
  premultipliedAlpha: boolean;
  // Character positioning (from URL params, fallback to DB values)
  scale: number;
  offsetX: number;
  offsetY: number;
  // Background
  bgType: "none" | "color" | "image";
  bgColor: string;       // hex without # e.g. "141414"
  bgImageUrl: string;    // full URL
  bgSize: string;        // "cover" | "contain" | "auto" | "100% 100%"
  bgPosition: string;    // "center" | "top center" | etc.
};

export function SpineDemoClient({ config }: { config: DemoConfig }) {
  const {
    jsonUrl, binaryUrl, atlasUrl, animations, skin, premultipliedAlpha,
    scale, offsetX, offsetY,
    bgType, bgColor, bgImageUrl, bgSize, bgPosition,
  } = config;

  const [status, setStatus] = useState<"loading" | "ok" | "error">(
    jsonUrl || binaryUrl ? "loading" : "error"
  );
  const [errorMsg, setErrorMsg] = useState<string>(
    !jsonUrl && !binaryUrl ? "Character chưa có file JSON/SKEL. Upload trong Admin → Spine tab." : ""
  );

  // Build background style
  let backgroundStyle: React.CSSProperties = { background: "transparent" };
  if (bgType === "color") {
    backgroundStyle = { background: `#${bgColor}` };
  } else if (bgType === "image" && bgImageUrl) {
    backgroundStyle = {
      backgroundImage: `url(${bgImageUrl})`,
      backgroundSize: bgSize || "cover",
      backgroundPosition: bgPosition || "center",
      backgroundRepeat: "no-repeat",
    };
  }

  const noFiles = !jsonUrl && !binaryUrl;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        ...backgroundStyle,
      }}
    >
      {/* Loading indicator */}
      {status === "loading" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            zIndex: 10,
          }}
        >
          <div style={{
            width: 32,
            height: 32,
            border: "3px solid rgba(255,255,255,0.15)",
            borderTopColor: "#f59e0b",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Error state */}
      {status === "error" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            color: "rgba(255,255,255,0.5)",
            fontFamily: "monospace",
            fontSize: 13,
            padding: 24,
            textAlign: "center",
          }}
        >
          <span style={{ fontSize: 28 }}>⚠️</span>
          <span style={{ color: "#f87171", fontWeight: 600 }}>Không thể load character</span>
          {errorMsg && (
            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, maxWidth: 320 }}>
              {errorMsg}
            </span>
          )}
        </div>
      )}

      {/* Spine character — chỉ render khi có file */}
      {!noFiles && (
        <SpineCharacter
          jsonUrl={jsonUrl}
          binaryUrl={binaryUrl}
          atlasUrl={atlasUrl}
          animations={animations}
          skin={skin}
          premultipliedAlpha={premultipliedAlpha}
          scale={scale}
          offsetX={offsetX}
          offsetY={offsetY}
          className="h-full w-full"
          onSuccess={() => setStatus("ok")}
          onError={(msg) => {
            setStatus("error");
            setErrorMsg(msg);
          }}
        />
      )}
    </div>
  );
}
