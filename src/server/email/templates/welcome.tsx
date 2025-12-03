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

interface WelcomeEmailProps {
  userFirstName?: string;
}

export const WelcomeEmail = ({
  userFirstName = "Customer",
}: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to Pitch Perfect!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={box}>
          <Text style={heading}>Welcome to Pitch Perfect! 🎉</Text>
          <Hr style={hr} />
          <Text style={paragraph}>Hi {userFirstName},</Text>
          <Text style={paragraph}>
            Thank you for joining Pitch Perfect. We are excited to have you on
            board!
          </Text>
          <Text style={paragraph}>
            You can now book appointments, manage your bookings, and explore all
            our services.
          </Text>
          <Section style={buttonContainer}>
            <Link style={button} href="https://pitch-perfect.com">
              Get Started
            </Link>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            If you have any questions, feel free to reach out to us.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default WelcomeEmail;

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

const heading = {
  color: "#1f2937",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "16px 0",
  padding: "0",
};

const footer = {
  color: "#999999",
  fontSize: "12px",
  lineHeight: "15px",
};
