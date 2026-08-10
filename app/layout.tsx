import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const description = "A persistent artificial ecosystem in which abandoned electronics ferment into new life.";

  return {
    metadataBase: new URL(origin),
    title: "ENSIL — Electronic Ensilage",
    description,
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
    openGraph: {
      title: "ENSIL — Electronic Ensilage",
      description,
      type: "website",
      images: [{ url: `${origin}/og.png`, width: 1536, height: 1024, alt: "ENSIL translucent electronic organism" }],
    },
    twitter: { card: "summary_large_image", title: "ENSIL — Electronic Ensilage", description, images: [`${origin}/og.png`] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
