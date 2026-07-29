import nodemailer from "nodemailer";

// Generic SMTP transport, per the project's chosen email provider
// (see context/progress-tracker.md). Swap the transport here if
// that ever changes — nothing else in the app should import
// nodemailer directly.
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
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
