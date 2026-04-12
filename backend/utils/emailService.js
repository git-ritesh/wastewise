const nodemailer = require('nodemailer');

const isProduction = process.env.NODE_ENV === 'production';

const parseIntEnv = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const createTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseIntEnv(process.env.SMTP_PORT, 587);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    connectionTimeout: parseIntEnv(process.env.SMTP_CONNECTION_TIMEOUT, 10000),
    greetingTimeout: parseIntEnv(process.env.SMTP_GREETING_TIMEOUT, 10000),
    socketTimeout: parseIntEnv(process.env.SMTP_SOCKET_TIMEOUT, 15000),
    tls: {
      rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED === 'true'
    }
  });
};

const sendOTPEmail = async (email, otp, type = 'verification') => {
  const subject = type === 'verification' 
    ? 'WasteWise - Verify Your Email' 
    : 'WasteWise - Reset Your Password';

  const mailOptions = {
    from: `"WasteWise 🌿" <${process.env.SMTP_USER}>`,
    to: email,
    subject: subject,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
          .container { max-width: 500px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; }
          .header h1 { color: #fff; margin: 0; font-size: 28px; }
          .content { padding: 40px 30px; text-align: center; }
          .otp-box { background: linear-gradient(135deg, #f0fdf4, #dcfce7); border: 2px dashed #10b981; border-radius: 12px; padding: 20px; margin: 25px 0; }
          .otp-code { font-size: 40px; font-weight: bold; color: #059669; letter-spacing: 12px; margin: 10px 0; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌿 WasteWise</h1>
          </div>
          <div class="content">
            <h2 style="color: #1f2937; margin-bottom: 10px;">${type === 'verification' ? 'Verify Your Email' : 'Reset Your Password'}</h2>
            <p style="color: #6b7280; margin-bottom: 20px;">
              Use the OTP below to ${type === 'verification' ? 'verify your account' : 'reset your password'}:
            </p>
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
              <p style="color: #059669; margin: 0; font-size: 14px;">Valid for 10 minutes</p>
            </div>
            <p style="color: #9ca3af; font-size: 14px;">If you didn't request this, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>© 2024 WasteWise. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error('SMTP credentials are missing. Set SMTP_USER and SMTP_PASS.');
    }

    const transporter = createTransporter();
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent to ${email} | MessageId: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Email send error:', error.message);

    if (!isProduction) {
      console.log(`\n========================================`);
      console.log(`📧 [DEV FALLBACK] OTP for ${email}: ${otp}`);
      console.log(`========================================\n`);
      return false;
    }

    throw new Error('Unable to deliver OTP email at the moment. Please try again shortly.');
  }
};

const sendEmail = async ({ email, subject, message }) => {
  const mailOptions = {
    from: `"WasteWise 🌿" <${process.env.SMTP_USER}>`,
    to: email,
    subject: subject,
    html: message
  };

  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error('SMTP credentials are missing. Set SMTP_USER and SMTP_PASS.');
    }

    const transporter = createTransporter();
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Email send error:', error.message);

    if (isProduction) {
      throw new Error('Unable to send email right now. Please try again later.');
    }

    return false;
  }
};

const sendCollectorCredentialsEmail = async (email, name, password) => {
  const mailOptions = {
    from: `"WasteWise 🌿" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'WasteWise - Your Collector Account Credentials',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
          .container { max-width: 500px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; }
          .header h1 { color: #fff; margin: 0; font-size: 28px; }
          .content { padding: 40px 30px; text-align: center; }
          .credentials-box { background: linear-gradient(135deg, #f0fdf4, #dcfce7); border: 2px solid #10b981; border-radius: 12px; padding: 25px; margin: 25px 0; text-align: left; }
          .credential-item { margin: 12px 0; }
          .credential-label { font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
          .credential-value { font-size: 18px; font-weight: bold; color: #059669; word-break: break-all; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
          .warning { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 12px; margin-top: 20px; font-size: 13px; color: #92400e; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌿 WasteWise</h1>
          </div>
          <div class="content">
            <h2 style="color: #1f2937; margin-bottom: 10px;">Welcome to the Team, ${name}! 🎉</h2>
            <p style="color: #6b7280; margin-bottom: 20px;">
              You have been registered as a <strong>Waste Collector</strong> on WasteWise. 
              Use the credentials below to log in to your account.
            </p>
            <div class="credentials-box">
              <div class="credential-item">
                <div class="credential-label">Email</div>
                <div class="credential-value">${email}</div>
              </div>
              <div class="credential-item">
                <div class="credential-label">Password</div>
                <div class="credential-value">${password}</div>
              </div>
            </div>
            <div class="warning">
              ⚠️ For security, please change your password after your first login using the "Forgot Password" option.
            </div>
          </div>
          <div class="footer">
            <p>© 2024 WasteWise. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error('SMTP credentials are missing. Set SMTP_USER and SMTP_PASS.');
    }

    const transporter = createTransporter();
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Collector credentials email sent to ${email} | MessageId: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Collector credentials email error:', error.message);

    if (!isProduction) {
      console.log(`\n========================================`);
      console.log(`📧 [DEV FALLBACK] Collector credentials for ${email}:`);
      console.log(`   Password: ${password}`);
      console.log(`========================================\n`);
      return false;
    }

    throw new Error('Unable to send collector credentials email at the moment.');
  }
};

module.exports = { sendOTPEmail, sendEmail, sendCollectorCredentialsEmail };
