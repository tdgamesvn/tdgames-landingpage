"use client";

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
      />
    </div>
  );
}
