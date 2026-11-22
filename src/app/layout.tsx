import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Saathi",
  description: "Voice-first family chat for elders in Indian languages, built on the Nexconn Chat SDK.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f3eadc",
};

const fontHref = "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,560;9..144,700&family=Nunito:wght@500;700;800&family=Noto+Sans+Bengali:wght@500;700&family=Noto+Sans+Devanagari:wght@500;700&family=Noto+Sans+Kannada:wght@500;700&family=Noto+Sans+Tamil:wght@500;700&family=Noto+Sans+Telugu:wght@500;700&display=swap";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href={fontHref} rel="stylesheet" />
        <meta name="saathi-rev" content="2" />
      </head>
      <body>{children}</body>
    </html>
  );
}
