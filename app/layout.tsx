import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wiz Resume Builder - AI-Powered ATS Resume Builder",
  description: "Build ATS-compliant resumes with real-time preview, AI bullet optimization, and multi-format exports.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
