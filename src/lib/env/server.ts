import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().regex(/^(file:).+/, {
      message:
        "Invalid DATABASE_URL format. Must start with 'sqlite://' or 'file:'.",
    }),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    BETTER_AUTH_SECRET: z.string(),
    BETTER_AUTH_URL: z.url(),
    
    // Price service configuration
    PRICE_PROVIDER: z.enum(["mock", "alpha_vantage", "yahoo_finance"]).default("mock"),
    ALPHA_VANTAGE_API_KEY: z.string().optional(),
    YAHOO_FINANCE_RATE_LIMIT: z.string().default("100").transform(Number),
    PRICE_CACHE_TTL_MINUTES: z.string().default("15").transform(Number),
    PRICE_CACHE_MAX_ENTRIES: z.string().default("1000").transform(Number),
  },

  runtimeEnvStrict: {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    
    // Price service environment variables
    PRICE_PROVIDER: process.env.PRICE_PROVIDER,
    ALPHA_VANTAGE_API_KEY: process.env.ALPHA_VANTAGE_API_KEY,
    YAHOO_FINANCE_RATE_LIMIT: process.env.YAHOO_FINANCE_RATE_LIMIT,
    PRICE_CACHE_TTL_MINUTES: process.env.PRICE_CACHE_TTL_MINUTES,
    PRICE_CACHE_MAX_ENTRIES: process.env.PRICE_CACHE_MAX_ENTRIES,
  },

  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
