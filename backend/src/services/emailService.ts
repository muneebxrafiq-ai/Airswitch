
import nodemailer from 'nodemailer';

// Create a transporter using environment variables
// For development, we can use a generic SMTP transport
// The user will need to provide: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // false for 587
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export const sendEmail = async (to: string, subject: string, html: string) => {
    try {
        const info = await transporter.sendMail({
            from: `"Airswitch" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html,
        });

        console.log('Message sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

export const sendOTPEmail = async (email: string, otp: string) => {
    const subject = 'Your Airswitch Verification Code';
    const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Welcome to Airswitch!</h2>
            <p>Your verification code is:</p>
            <h1 style="color: #4CAF50; letter-spacing: 5px;">${otp}</h1>
            <p>This code will expire in 10 minutes.</p>
            <p>If you did not request this code, please ignore this email.</p>
        </div>
    `;
    // Log OTP for development/verification purposes FIRST
    console.log('================================================');
    console.log(`[OTP DELIVERY] Sending OTP to ${email}`);
    console.log(`[OTP] ${otp}`);
    console.log('================================================');

    try {
        const result = await sendEmail(email, subject, html);
        console.log(`[OTP DELIVERY SUCCESS] Email sent to ${email}`);
        return result;
    } catch (emailError) {
        console.log(`[OTP DELIVERY WARNING] Could not send email to ${email} (SMTP may not be configured)`);
        console.log(`[OTP DELIVERY WARNING] User should use OTP from console: ${otp}`);
        throw emailError;
    }
};

export const sendPasswordResetEmail = async (email: string, otp: string) => {
    const subject = 'Reset Your Airswitch Password';
    const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Password Reset</h2>
            <p>You requested a password reset. Use the code below to proceed:</p>
            <h1 style="color: #FF5722; letter-spacing: 5px;">${otp}</h1>
            <p>This code will expire in 10 minutes.</p>
            <p>If you did not request this, please ignore this email.</p>
        </div>
    `;
    return sendEmail(email, subject, html);
};
