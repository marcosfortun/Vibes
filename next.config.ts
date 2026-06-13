import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Permite aislar el directorio de build (p. ej. para levantar una segunda
  // instancia de `next dev` sin colisionar con el `.next` de otra ya activa).
  distDir: process.env.NEXT_DIST_DIR || '.next',
};

export default withNextIntl(nextConfig);
