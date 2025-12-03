import { WelcomeEmail } from "./templates/welcome";
import { renderEmailTemplate } from "./render";
import { sendEmail } from "./transporter";

export async function sendWelcomeEmail(email: string, firstName?: string) {
  const html = await renderEmailTemplate(
    <WelcomeEmail userFirstName={firstName} />,
  );

  return sendEmail({
    to: email,
    subject: "Welcome to Pitch Perfect!",
    html,
  });
}

export async function sendBookingConfirmation(
  email: string,
  options: {
    bookingId: string;
    customerName: string;
    date: string;
    time: string;
    service: string;
  },
) {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Booking Confirmation</h2>
      <p>Hi ${options.customerName},</p>
      <p>Your booking has been confirmed!</p>
      <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Booking ID:</strong> ${options.bookingId}</p>
        <p><strong>Service:</strong> ${options.service}</p>
        <p><strong>Date:</strong> ${options.date}</p>
        <p><strong>Time:</strong> ${options.time}</p>
      </div>
      <p>If you need to make any changes, please contact us.</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: "Your Booking is Confirmed",
    html,
  });
}
