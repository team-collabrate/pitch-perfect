import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { db } from "~/server/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg", // or "pg" or "mysql"
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    sendResetPassword: async ({ user, url }) => {
      try {
        const result = await import("~/server/email");
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
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
  socialProviders: {
  },
});

export type Session = typeof auth.$Infer.Session;
