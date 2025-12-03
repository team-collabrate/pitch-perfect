# Email Service Setup

This directory contains the email service configuration using Nodemailer and React Email.

## Configuration

The email service uses the following environment variables:

- `EMAIL_FROM`: The sender email address
- `SMTP_USER`: SMTP username for authentication
- `SMTP_PASS`: SMTP password for authentication
- `SMTP_HOST`: SMTP server host
- `SMTP_PORT`: SMTP server port (usually 465 for SSL or 587 for TLS)

These are already configured in your `.env` file.

## Usage

### Send Welcome Email

```typescript
import { sendWelcomeEmail } from "~/server/email";

await sendWelcomeEmail("customer@example.com", "John");
```

### Send Booking Confirmation

```typescript
import { sendBookingConfirmation } from "~/server/email";

await sendBookingConfirmation("customer@example.com", {
  bookingId: "BOOK-123",
  customerName: "John Doe",
  date: "2024-12-25",
  time: "10:00 AM",
  service: "Premium Service",
});
```

### Send Custom Email

```typescript
import { sendEmail } from "~/server/email";

await sendEmail({
  to: "customer@example.com",
  subject: "Custom Subject",
  html: "<h1>Your custom HTML</h1>",
  text: "Your plain text version", // optional
});
```

### Create Custom Templates

Create a new file in `templates/` using React Email components:

```typescript
import { Html, Body, Head, Hr, Container, Section, Text } from "@react-email/components";

export const MyTemplate = () => (
  <Html>
    <Head />
    <Body>
      <Container>
        <Text>Your email content here</Text>
      </Container>
    </Body>
  </Html>
);
```

Then use it with `renderEmailTemplate` and `sendEmail`.

## File Structure

- `transporter.ts` - Nodemailer configuration and sendEmail function
- `render.ts` - React Email template rendering utility
- `service.tsx` - High-level email sending functions
- `templates/` - Email template components
- `index.ts` - Export all utilities
