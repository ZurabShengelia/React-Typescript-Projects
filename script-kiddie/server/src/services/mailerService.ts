import { env } from "../config/env";
import { logger } from "../utils/logger";

const isConfigured = Boolean(env.brevoApiKey && env.emailUser);

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!isConfigured) {
    logger.warn(`[email not configured — logging instead] To: ${to} | Subject: ${subject}`);
    logger.debug(html);
    return;
  }

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": env.brevoApiKey,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: "Script Kiddie", email: env.emailUser },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    logger.error("Failed to send email", { to, subject, status: res.status, detail });
    throw new Error(`Email API responded ${res.status}`);
  }
}

function codeEmailHtml(heading: string, code: string, bodyLine: string): string {
  return `
    <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #0A0E16;">${heading}</h2>
      <p style="color: #333; font-size: 15px; line-height: 1.5;">${bodyLine}</p>
      <p style="font-size: 32px; font-weight: 600; letter-spacing: 6px; text-align: center; padding: 16px; background: #f2f4f7; border-radius: 8px; margin: 20px 0;">
        ${code}
      </p>
      <p style="color: #666; font-size: 13px;">This code expires in 15 minutes. If you didn't request this, you can safely ignore this email.</p>
    </div>
  `;
}

export async function sendVerificationCodeEmail(to: string, code: string): Promise<void> {
  await sendEmail(
    to,
    "Verify your Script Kiddie account",
    codeEmailHtml("Verify your email", code, "Enter this code to finish creating your Script Kiddie account.")
  );
}

export async function sendPasswordChangeCodeEmail(to: string, code: string): Promise<void> {
  await sendEmail(
    to,
    "Confirm your password change",
    codeEmailHtml(
      "Confirm your password change",
      code,
      "Enter this code to confirm the password change you just requested on Script Kiddie."
    )
  );
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  await sendEmail(
    to,
    "Reset your Script Kiddie password",
    `
      <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #0A0E16;">Reset your password</h2>
        <p style="color: #333; font-size: 15px; line-height: 1.5;">We received a request to reset the password for your Script Kiddie account.</p>
        <p style="margin: 24px 0; text-align: center;">
          <a href="${resetUrl}" style="display: inline-block; background: #16A34A; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 600;">
            Reset password
          </a>
        </p>
        <p style="color: #666; font-size: 13px;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
      </div>
    `
  );
}

export async function sendAccountDeletionCodeEmail(to: string, code: string): Promise<void> {
  await sendEmail(
    to,
    "Confirm account deletion",
    codeEmailHtml(
      "Confirm account deletion",
      code,
      "Enter this code to permanently delete your Script Kiddie account and all of your assessment history. This cannot be undone."
    )
  );
}

export async function sendEmailChangeCodeEmail(to: string, code: string): Promise<void> {
  await sendEmail(
    to,
    "Confirm your new Script Kiddie email",
    codeEmailHtml(
      "Confirm your new email",
      code,
      "Enter this code in Script Kiddie to finish moving your account to this address."
    )
  );
}

export async function sendEmailChangedNoticeEmail(to: string, newEmail: string): Promise<void> {
  await sendEmail(
    to,
    "Your Script Kiddie account email was changed",
    `
      <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #0A0E16;">Your account email was changed</h2>
        <p style="color: #333; font-size: 15px; line-height: 1.5;">
          The email address on your Script Kiddie account was changed to
          <strong>${newEmail}</strong>. You are receiving this notice at your previous address.
        </p>
        <p style="color: #666; font-size: 13px;">
          If you made this change, nothing further is needed. If you did not, reset your password
          immediately and contact support.
        </p>
      </div>
    `
  );
}
