// dotenv yalnızca yerel CLI çağrılarında .env yüklemek için. Hosted ortamlarda
// (Vercel vb.) env değişkenleri zaten enjekte edildiği için import opsiyoneldir
// ve eksikse build'i kıramaz.
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("dotenv/config");
} catch {
  // dotenv yoksa sessizce geç
}

import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url:
      process.env.POSTGRES_PRISMA_URL ||
      process.env.DATABASE_URL ||
      "postgres://localhost:5432/unused",
  },
});
