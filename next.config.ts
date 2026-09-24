import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@react-pdf/renderer", "pdfkit"],
  outputFileTracingIncludes: {
    "/api/**/*": [
      "./node_modules/pdfkit/**/*",
      "./node_modules/@react-pdf/**/*",
      "./node_modules/.pnpm/pdfkit@*/**/*",
      "./node_modules/.pnpm/@react-pdf*/**/*",
    ],
    "/**": [
      "./node_modules/pdfkit/**/*",
      "./node_modules/@react-pdf/**/*",
      "./node_modules/.pnpm/pdfkit@*/**/*",
      "./node_modules/.pnpm/@react-pdf*/**/*",
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
