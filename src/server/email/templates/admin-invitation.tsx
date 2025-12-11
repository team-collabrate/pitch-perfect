import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";
import { env } from "~/env";

interface AdminInvitationEmailProps {
  adminName?: string;
  email: string;
  password?: string;
  loginUrl?: string;
  role: "admin" | "superAdmin";
  resetPasswordUrl?: string;
}

export const AdminInvitationEmail = ({
  adminName = "Admin",
  email,
  password,
  loginUrl = `${env.NEXT_PUBLIC_BASE_URL}/admin/forgot-password`,
  role,
  resetPasswordUrl,
}: AdminInvitationEmailProps) => (
  <Html>
    <Head />
    <Preview>You are invited to Pitch Perfect Admin Panel</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={box}>
          <Text style={heading}>Welcome to Pitch Perfect Admin Panel! 🎯</Text>
          <Hr style={hr} />
          <Text style={paragraph}>Hi {adminName},</Text>
          <Text style={paragraph}>
            You have been invited to join the Pitch Perfect admin team as a{" "}
            <strong>{role === "superAdmin" ? "Super Admin" : "Admin"}</strong>.
          </Text>
          {password ? (
            <>
              <Text style={paragraph}>
                Use the credentials below to log in:
              </Text>
              <Section style={credentialsBox}>
                <Text style={credentialLabel}>Email:</Text>
                <Text style={credentialValue}>{email}</Text>
                <Text style={credentialLabel}>Password:</Text>
                <Text style={credentialValue}>{password}</Text>
              </Section>
              <Text style={warningText}>
                ⚠️ Please change your password immediately after your first
                login for security.
              </Text>
              <Section style={buttonContainer}>
                <Link style={button} href={loginUrl}>
                  Login to Admin Panel
                </Link>
              </Section>
            </>
          ) : (
            <>
              <Text style={paragraph}>
                To get started, please set your password by clicking the button
                below:
              </Text>
              <Section style={buttonContainer}>
                <Link style={button} href={resetPasswordUrl ?? loginUrl}>
                  Set Your Password
                </Link>
              </Section>
              <Text style={paragraph}>
                Or copy and paste this link in your browser:
              </Text>
              <Text
                style={{
                  ...paragraph,
                  wordBreak: "break-all",
                  color: "#0066cc",
                }}
              >
                {resetPasswordUrl ?? loginUrl}
              </Text>
            </>
          )}
          <Hr style={hr} />
          <Text style={footer}>
            If you did not expect this invitation or have any questions, please
            contact the super admin.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default AdminInvitationEmail;

const main = {
  backgroundColor: "#f3f3f5",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI","Roboto","Oxygen","Ubuntu","Cantarell","Fira Sans","Droid Sans","Helvetica Neue",sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
};

const box = {
  padding: "0 48px",
};

const hr = {
  borderColor: "#e7e7e7",
  margin: "20px 0",
};

const paragraph = {
  color: "#525f7f",
  fontSize: "16px",
  lineHeight: "24px",
  textAlign: "left" as const,
};

const heading = {
  color: "#1f2937",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "16px 0",
  padding: "0",
};

const credentialsBox = {
  backgroundColor: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "16px",
  marginBottom: "20px",
};

const credentialLabel = {
  color: "#6b7280",
  fontSize: "12px",
  fontWeight: "bold",
  textTransform: "uppercase" as const,
  marginBottom: "4px",
};

const credentialValue = {
  color: "#1f2937",
  fontSize: "16px",
  fontWeight: "600",
  fontFamily: "monospace",
  marginBottom: "12px",
  wordBreak: "break-all" as const,
};

const warningText = {
  color: "#d97706",
  fontSize: "14px",
  lineHeight: "20px",
  marginBottom: "20px",
  padding: "12px",
  backgroundColor: "#fef3c7",
  borderRadius: "6px",
  borderLeft: "4px solid #d97706",
};

const buttonContainer = {
  textAlign: "center" as const,
  paddingBottom: "10px",
};

const button = {
  backgroundColor: "#5469d4",
  borderRadius: "4px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px 20px",
};

const footer = {
  color: "#999999",
  fontSize: "12px",
  lineHeight: "15px",
};
