const nodemailer = require('nodemailer');

// create transporter
function createTransporter() {
  const config = {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  };
  
  console.log('📧 Email transporter config:', {
    host: config.host,
    port: config.port,
    user: config.auth.user,
    pass: config.auth.pass ? '***' : 'NOT SET'
  });

  return nodemailer.createTransport(config);
}

async function sendPasswordResetEmail(toEmail, resetToken) {
  try {
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER) {
      console.error('❌ EMAIL_HOST or EMAIL_USER not configured in .env');
      return false;
    }

    const transporter = createTransporter();
    
    // verify connection first
    await transporter.verify();
    console.log('✅ SMTP connection verified');

    const resetLink = `http://yourfrontend.com/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: toEmail,
      subject: 'Password Reset Request',
      text: `Click this link to reset your password: ${resetLink}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>You requested to reset your password. Click the button below to proceed:</p>
          <a href="${resetLink}" 
             style="display: inline-block; padding: 12px 24px; background-color: #007bff; 
                    color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">
            Reset Password
          </a>
          <p>Or copy this link: ${resetLink}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent:', info.messageId);
    console.log('📬 Preview URL:', nodemailer.getTestMessageUrl(info));
    return true;
  } catch (err) {
    console.error('❌ Error sending password reset email:', err);
    console.error('Error details:', {
      message: err.message,
      code: err.code,
      command: err.command
    });
    return false;
  }
}

async function sendPasswordChangeConfirmation(toEmail) {
  try {
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER) {
      console.error('❌ EMAIL_HOST or EMAIL_USER not configured');
      return false;
    }

    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: toEmail,
      subject: 'Password Changed Successfully',
      text: 'Your password has been changed successfully. If you did not make this change, please contact support immediately.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Changed</h2>
          <p>Your password has been changed successfully.</p>
          <p>If you did not make this change, please contact support immediately.</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password change confirmation sent:', info.messageId);
    console.log('📬 Preview URL:', nodemailer.getTestMessageUrl(info));
    return true;
  } catch (err) {
    console.error('❌ Error sending confirmation email:', err);
    return false;
  }
}

module.exports = { sendPasswordResetEmail, sendPasswordChangeConfirmation };