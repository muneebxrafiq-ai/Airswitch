import { defineConfig } from "prisma/config";
import "dotenv/config";

export default defineConfig({
    schema: "prisma/schema.prisma",
    datasource: {
        // Use DIRECT_URL to bypass pgbouncer and RLS connection pooling issues
        url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
});
