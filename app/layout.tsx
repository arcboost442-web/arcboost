import type { Metadata } from "next";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "ArcBoost",
  description: "Permissionless token launchpad on Arc",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: "#0a0a0a" }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}