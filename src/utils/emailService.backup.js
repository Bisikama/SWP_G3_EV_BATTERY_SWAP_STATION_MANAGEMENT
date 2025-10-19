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

    // Use FRONTEND_URL from env or default
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: `"VinStation Support" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: '🔐 Yêu cầu đặt lại mật khẩu - VinStation',
      text: `Bạn đã yêu cầu đặt lại mật khẩu. Click vào link sau để tiếp tục: ${resetLink}\n\nLink này sẽ hết hạn sau 1 giờ.\n\nNếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #2563eb; margin: 0;">🔋 VinStation</h1>
            <p style="color: #666; margin: 5px 0;">EV Battery Swap Station Management</p>
          </div>
          
          <h2 style="color: #333;">Đặt lại mật khẩu</h2>
          <p style="color: #555; line-height: 1.6;">
            Chào bạn,<br><br>
            Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại VinStation.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="display: inline-block; padding: 14px 32px; background-color: #2563eb; 
                      color: white; text-decoration: none; border-radius: 6px; font-weight: bold;
                      box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              🔐 Đặt lại mật khẩu
            </a>
          </div>
          
          <p style="color: #555; line-height: 1.6;">
            Hoặc copy link sau vào trình duyệt:<br>
            <a href="${resetLink}" style="color: #2563eb; word-break: break-all; font-size: 12px;">${resetLink}</a>
          </p>
          
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e;">
              ⏰ Link này sẽ hết hạn sau <strong>1 giờ</strong>
            </p>
          </div>
          
          <p style="color: #555; line-height: 1.6;">
            Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này. 
            Tài khoản của bạn vẫn an toàn.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            © 2025 VinStation - EV Battery Swap Station Management<br>
            Email này được gửi tự động, vui lòng không trả lời.
          </p>
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
      from: `"VinStation Support" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: '✅ Mật khẩu đã được thay đổi - VinStation',
      text: 'Mật khẩu của bạn đã được thay đổi thành công.\n\nThời gian: ' + new Date().toLocaleString('vi-VN') + '\n\nNếu bạn không thực hiện thay đổi này, vui lòng liên hệ với bộ phận hỗ trợ ngay lập tức.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #2563eb; margin: 0;">🔋 VinStation</h1>
            <p style="color: #666; margin: 5px 0;">EV Battery Swap Station Management</p>
          </div>
          
          <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
            <h2 style="color: #065f46; margin: 0 0 5px 0;">✅ Mật khẩu đã được thay đổi</h2>
            <p style="margin: 0; color: #047857;">Tài khoản của bạn đã được cập nhật thành công</p>
          </div>
          
          <p style="color: #555; line-height: 1.6;">
            Chào bạn,<br><br>
            Mật khẩu của bạn đã được thay đổi thành công vào lúc <strong>${new Date().toLocaleString('vi-VN')}</strong>.
          </p>
          
          <div style="background-color: #f3f4f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #374151;">
              <strong>📍 Thông tin:</strong><br>
              🕒 Thời gian: ${new Date().toLocaleString('vi-VN')}<br>
              📧 Email: ${toEmail}
            </p>
          </div>
          
          <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 12px; margin: 20px 0;">
            <p style="margin: 0; color: #991b1b;">
              ⚠️ <strong>Nếu bạn KHÔNG thực hiện thay đổi này:</strong><br>
              Vui lòng liên hệ với bộ phận hỗ trợ ngay lập tức để bảo vệ tài khoản của bạn.
            </p>
          </div>
          
          <p style="color: #555; line-height: 1.6;">
            Nếu bạn đã thực hiện thay đổi này, bạn có thể bỏ qua email này.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            © 2025 VinStation - EV Battery Swap Station Management<br>
            Email này được gửi tự động, vui lòng không trả lời.
          </p>
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