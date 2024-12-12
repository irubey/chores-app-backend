import nodemailer from 'nodemailer';
import { EmailOptions } from '../types/index';
import crypto from 'crypto';
import logger from '../utils/logger';

// Configure the email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Sends an email using the configured transporter
 * @param options EmailOptions object containing to, subject, and text/html
 * @returns Promise<boolean> indicating whether the email was sent successfully
 */
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    logger.info('Attempting to send email', {
      to: options.to,
      subject: options.subject,
      smtpHost: process.env.SMTP_HOST,
      smtpPort: process.env.SMTP_PORT,
      smtpUser: process.env.SMTP_USER,
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    logger.info('Email sent successfully', { to: options.to });
    return true;
  } catch (error) {
    logger.error('Failed to send email', {
      error: error instanceof Error ? error.message : String(error),
      to: options.to,
      smtpHost: process.env.SMTP_HOST,
      smtpPort: process.env.SMTP_PORT,
    });
    return false;
  }
};

/**
 * Generates an HTML email template for household invitations
 * @param inviterName Name of the user sending the invitation
 * @param householdName Name of the household
 * @param invitationLink URL for accepting the invitation
 * @returns HTML string for the email body
 */
export const generateInvitationEmailTemplate = (
  inviterName: string,
  householdName: string,
  invitationLink: string
): string => {
  return `
    <html>
      <body>
        <h1>You've been invited to join a household!</h1>
        <p>${inviterName} has invited you to join the "${householdName}" household on ChoresApp.</p>
        <p>Click the link below to accept the invitation:</p>
        <a href="${invitationLink}">Accept Invitation</a>
        <p>If you didn't expect this invitation, you can safely ignore this email.</p>
      </body>
    </html>
  `;
};

/**
 * Generates an HTML email template for chore reminders
 * @param userName Name of the user receiving the reminder
 * @param choreName Name of the chore
 * @param dueDate Due date of the chore
 * @param choreLink URL to view the chore details
 * @returns HTML string for the email body
 */
export const generateChoreReminderEmailTemplate = (
  userName: string,
  choreName: string,
  dueDate: string,
  choreLink: string
): string => {
  return `
    <html>
      <body>
        <h1>Chore Reminder</h1>
        <p>Hi ${userName},</p>
        <p>This is a friendly reminder that your chore "${choreName}" is due on ${dueDate}.</p>
        <p>Click the link below to view the chore details:</p>
        <a href="${choreLink}">View Chore</a>
        <p>Thank you for keeping your household running smoothly!</p>
      </body>
    </html>
  `;
};

/**
 * Validates an email address format
 * @param email Email address to validate
 * @returns boolean indicating whether the email format is valid
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Generates a secure token for invitations
 * @returns string A random token for invitation links
 */
export const generateInviteToken = (): string => {
  const token = crypto.randomBytes(32).toString('hex');
  return `invite_${token}`;
};
