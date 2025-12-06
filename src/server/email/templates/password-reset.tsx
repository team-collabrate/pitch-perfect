import {
  Html,
  Body,
  Head,
  Hr,
  Container,
  Section,
  Text,
  Link,
  Button,
} from "@react-email/components";

interface PasswordResetEmailProps {
  userName?: string;
  resetUrl: string;
}

export const PasswordResetEmail = ({
  userName = "User",
  resetUrl,
}: PasswordResetEmailProps) => (
  <Html>
    <Head />
    <Body
      style={{ fontFamily: "Arial, sans-serif", backgroundColor: "#f9f9f9" }}
    >
      <Container
        style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}
      >
        <Section
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "8px",
            padding: "32px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <Text
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              margin: "0 0 24px 0",
              color: "#333",
            }}
          >
            Reset Your Password
          </Text>

          <Text
            style={{ fontSize: "16px", color: "#666", marginBottom: "16px" }}
          >
            Hi {userName},
          </Text>

          <Text
            style={{ fontSize: "16px", color: "#666", marginBottom: "16px" }}
          >
            We received a request to reset your password. Click the button below
            to create a new password:
          </Text>

          <Section style={{ marginBottom: "32px", textAlign: "center" }}>
            <Button
              href={resetUrl}
              style={{
                backgroundColor: "#000",
                color: "#fff",
                padding: "12px 24px",
                borderRadius: "6px",
                textDecoration: "none",
                fontWeight: "bold",
                display: "inline-block",
              }}
            >
              Reset Password
            </Button>
          </Section>

          <Text
            style={{ fontSize: "14px", color: "#999", marginBottom: "16px" }}
          >
            Or copy and paste this link in your browser:
          </Text>
          <Text
            style={{
              fontSize: "12px",
              color: "#0066cc",
              marginBottom: "24px",
              wordBreak: "break-all",
            }}
          >
            <Link href={resetUrl} style={{ color: "#0066cc" }}>
              {resetUrl}
            </Link>
          </Text>

          <Hr style={{ borderColor: "#e0e0e0", margin: "24px 0" }} />

          <Text style={{ fontSize: "12px", color: "#999" }}>
            This link will expire in 24 hours. If you did not request a password
            reset, please ignore this email.
          </Text>

          <Text style={{ fontSize: "12px", color: "#999", marginTop: "16px" }}>
            If you have any questions, please contact our support team.
          </Text>
        </Section>

        <Section style={{ marginTop: "24px", textAlign: "center" }}>
          <Text style={{ fontSize: "12px", color: "#999" }}>
            © 2024 Pitch Perfect. All rights reserved.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);
