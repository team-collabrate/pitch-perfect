import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    BETTER_AUTH_SECRET:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
    BETTER_AUTH_URL: z.string(),
    DATABASE_URL: z.string(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    EMAIL_FROM: z.string(),
    SMTP_USER: z.string(),
    SMTP_PASS: z.string(),
    SMTP_HOST: z.string(),
    SMTP_PORT: z.coerce.number(),
    CLOUDINARY_CLOUD_NAME: z.string(),
    CLOUDINARY_API_KEY: z.string(),
    CLOUDINARY_API_SECRET: z.string(),
    CRON_SECRET:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
    PAYTM_MODE: z
      .enum(["prod", "test"])
      .default(process.env.NODE_ENV === "production" ? "prod" : "test"),
    PAYTM_MID: z.string(),
    PAYTM_MERCHANT_KEY: z.string(),
    PAYTM_WEBSITE: z.string(),
    PAYTM_CALLBACK_URL: z.string(),
    PAYTM_HOSTNAME: z.string(),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    // NEXT_PUBLIC_CLIENTVAR: z.string(),
    NEXT_PUBLIC_BASE_URL: z.string(),
    NEXT_PUBLIC_POSTHOG_KEY: z.string(),
    NEXT_PUBLIC_POSTHOG_HOST: z.string(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.NEXT_PUBLIC_BASE_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    EMAIL_FROM: process.env.EMAIL_FROM,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    CRON_SECRET: process.env.CRON_SECRET,
    PAYTM_MODE: process.env.PAYTM_MODE,
    PAYTM_MID:
      process.env.PAYTM_MODE === "prod"
        ? process.env.PAYTM_MID
        : process.env.TEST_PAYTM_MID,
    PAYTM_MERCHANT_KEY:
      process.env.PAYTM_MODE === "prod"
        ? process.env.PAYTM_MERCHANT_KEY
        : process.env.TEST_PAYTM_MERCHANT_KEY,
    PAYTM_WEBSITE:
      process.env.PAYTM_MODE === "prod"
        ? process.env.PAYTM_WEBSITE
        : process.env.TEST_PAYTM_WEBSITE,
    PAYTM_CALLBACK_URL:
      process.env.PAYTM_MODE === "prod"
        ? process.env.PAYTM_CALLBACK_URL
        : process.env.TEST_PAYTM_CALLBACK_URL,
    PAYTM_HOSTNAME:
      process.env.PAYTM_MODE === "prod"
        ? process.env.PAYTM_HOSTNAME
        : process.env.TEST_PAYTM_HOSTNAME,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
