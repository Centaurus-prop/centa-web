import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Route segment config: Next.js serves this as the og:image (1200x630 PNG).
export const alt = "Centa Propiedades - Decisiones inmobiliarias pensadas a largo plazo";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Brand tokens kept literal here because this file renders outside the Tailwind pipeline.
const CENTA_GREEN_1 = "#003A2A";

async function getIconSrc() {
  const icon = await readFile(join(process.cwd(), "public/assets/Centa-icon.png"));
  return `data:image/png;base64,${Buffer.from(icon).toString("base64")}`;
}

export default async function OpenGraphImage() {
  const iconSrc = await getIconSrc();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: CENTA_GREEN_1,
          padding: "80px",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={iconSrc} alt="CENTA" width={360} height={363} />
      </div>
    ),
    { ...size },
  );
}
