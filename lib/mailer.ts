import nodemailer from "nodemailer";

// Generic SMTP transport, per the project's chosen email provider
// (see context/progress-tracker.md). Swap the transport here if
// that ever changes — nothing else in the app should import
// nodemailer directly.
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === "true",
  // Local catchers like Mailpit don't require (or support) auth — passing
  // an auth object with an empty user still makes nodemailer attempt
  // AUTH LOGIN and fail. Only authenticate when a user is configured.
  auth: process.env.SMTP_USER
    ? {
        user: process.env.SMTP_USER,
        // Gmail app passwords are displayed as four space-separated groups
        // ("abcd efgh ijkl mnop") for readability, but the real credential
        // is the 16 characters with no spaces — pasting the displayed form
        // into .env as-is makes SMTP auth fail silently (caught in
        // request-otp.ts, never surfaced to the user), so strip whitespace
        // defensively here.
        pass: process.env.SMTP_PASSWORD?.replace(/\s+/g, ""),
      }
    : undefined,
});

export async function sendOtpEmail(email: string, code: string) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Your Binoregn sign-in code",
    text: `Your sign-in code is ${code}. It expires in 10 minutes.`,
  });
}

export async function sendOrderTrackingEmail(email: string, trackingUrl: string) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Your Binoregn order tracking link",
    text: `Track your order progress here: ${trackingUrl}`,
  });
}

// Sent to every ADMIN user (there's no separate super-admin role — see
// Role enum in schema.prisma) whenever a new order is placed.
export async function sendNewOrderAdminEmail(
  adminEmails: string[],
  order: {
    id: string;
    buyerName: string;
    productName: string;
    priceBirr: number;
    quantity: number;
  },
) {
  if (adminEmails.length === 0) return;
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: adminEmails,
    subject: `New order: ${order.productName}`,
    text: `${order.buyerName} placed an order for ${order.quantity} x ${order.productName} (${order.priceBirr} ETB each).\n\nOrder ID: ${order.id}`,
  });
}
