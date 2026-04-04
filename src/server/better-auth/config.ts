import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { env } from "~/env";
import { db } from "~/server/db";

export const auth = betterAuth({
  baseURL: env.NEXT_PUBLIC_BASE_URL,
  database: drizzleAdapter(db, {
    provider: "pg", // or "pg" or "mysql"
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    sendResetPassword: async ({ user, url }) => {
      try {
        const result = await import("~/server/email");
        await result.sendPasswordResetEmail(user.email, {
          resetUrl: url,
          userName: user.name,
        });
      } catch (error) {
        console.error("Failed to send password reset email:", error);
      }
    },
    onPasswordReset: async ({ user }) => {
      console.log(`Password for user ${user.email} has been reset.`);
    },
  },
  socialProviders: {},
});

export type Session = typeof auth.$Infer.Session;
