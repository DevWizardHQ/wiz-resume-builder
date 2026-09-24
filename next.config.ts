import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@react-pdf/renderer", "pdfkit"],
  outputFileTracingIncludes: {
    "/api/export/pdf/[id]/route": [
      "./node_modules/pdfkit/js/standard-fonts/**",
      "./node_modules/.pnpm/pdfkit@*/node_modules/pdfkit/js/standard-fonts/**",
    ],
  },
};

export default nextConfig;
