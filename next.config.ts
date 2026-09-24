import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@react-pdf/renderer"],
  outputFileTracingIncludes: {
    "/api/export/pdf/[id]": [
      "./node_modules/pdfkit/js/standard-fonts/**/*",
    ],
  },
};

export default nextConfig;
