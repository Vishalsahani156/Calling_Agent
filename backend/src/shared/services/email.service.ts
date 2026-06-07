import nodemailer from 'nodemailer';
import pino from 'pino';
import { env } from '../../config/env';

const logger = pino({ name: 'email-service' });

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

function isSmtpConfigured(): boolean {
  return Boolean(env.SMTP_HOST && env.EMAIL_FROM);
}

function isResendConfigured(): boolean {
  return Boolean(env.RESEND_API_KEY && env.EMAIL_FROM);
}

async function sendViaResend(input: SendEmailInput): Promise<void> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend API error (${response.status}): ${body}`);
  }
}

async function sendViaSmtp(input: SendEmailInput): Promise<void> {
  const transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT ?? 587,
    secure: env.SMTP_SECURE ?? false,
    auth:
      env.SMTP_USER && env.SMTP_PASS
        ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
        : undefined,
  });

  await transport.sendMail({
    from: env.EMAIL_FROM,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });
}

export class EmailService {
  async send(input: SendEmailInput): Promise<{ delivered: boolean; provider: string }> {
    if (isResendConfigured()) {
      await sendViaResend(input);
      return { delivered: true, provider: 'resend' };
    }

    if (isSmtpConfigured()) {
      await sendViaSmtp(input);
      return { delivered: true, provider: 'smtp' };
    }

    if (env.NODE_ENV === 'development') {
      logger.info(
        { to: input.to, subject: input.subject, text: input.text ?? input.html },
        'Email not configured — logged for development',
      );
      return { delivered: false, provider: 'console' };
    }

    throw new Error(
      'Email delivery is not configured. Set RESEND_API_KEY or SMTP_HOST and EMAIL_FROM.',
    );
  }

  async sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
    await this.send({
      to,
      subject: 'Reset your password',
      html: `<p>Click the link below to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 1 hour.</p>`,
      text: `Reset your password: ${resetUrl}\nThis link expires in 1 hour.`,
    });
  }

  async sendUserInviteEmail(to: string, firstName: string, inviteUrl: string): Promise<void> {
    await this.send({
      to,
      subject: 'You have been invited to the platform',
      html: `<p>Hi ${firstName},</p><p>You have been invited to join the AI Voice Calling platform.</p><p><a href="${inviteUrl}">Accept invitation and set your password</a></p><p>This link expires in 72 hours.</p>`,
      text: `Hi ${firstName},\nAccept your invitation: ${inviteUrl}\nThis link expires in 72 hours.`,
    });
  }
}

export const emailService = new EmailService();
