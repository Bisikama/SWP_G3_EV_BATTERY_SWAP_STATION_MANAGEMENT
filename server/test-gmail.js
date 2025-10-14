const { createTransport } = require('nodemailer');
require('dotenv').config();

async function testGmail() {
  console.log('='.repeat(60));
  console.log('📧 TESTING GMAIL CONFIGURATION');
  console.log('='.repeat(60));
  console.log('HOST:', process.env.EMAIL_HOST);
  console.log('PORT:', process.env.EMAIL_PORT);
  console.log('USER:', process.env.EMAIL_USER);
  console.log('PASS:', process.env.EMAIL_PASS ? '***' : 'NOT SET');
  console.log('FROM:', process.env.EMAIL_FROM);
  console.log('='.repeat(60));

  const transporter = createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  try {
    // Verify connection
    console.log('\n🔄 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!\n');

    // Ask for recipient email
    console.log('📬 Sending test password reset email...');
    console.log('📧 Recipient: Enter email or press Enter to send to yourself');
    
    // For demo, send to self
    const recipientEmail = process.env.EMAIL_USER;
    
    // Generate realistic test data
    const testToken = 'abc123def456ghi789jkl012mno345pqr678stu901vwx234';
    const resetLink = `http://localhost:3001/reset-password?token=${testToken}`;
    
    const info = await transporter.sendMail({
      from: `"VinStation Support" <${process.env.EMAIL_FROM}>`,
      to: recipientEmail,
      subject: '🔐 Yêu cầu đặt lại mật khẩu - VinStation',
      text: `Bạn đã yêu cầu đặt lại mật khẩu. Click vào link sau để tiếp tục: ${resetLink}\n\nLink này sẽ hết hạn sau 1 giờ.`,
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
          
          <div style="background-color: #f3f4f6; padding: 10px; margin-top: 20px; border-radius: 4px;">
            <p style="margin: 0; color: #6b7280; font-size: 11px;">
              <strong>Token for testing:</strong> ${testToken}
            </p>
          </div>
        </div>
      `
    });

    console.log('\n' + '='.repeat(60));
    console.log('✅ EMAIL SENT SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('📧 From:', process.env.EMAIL_FROM);
    console.log('📧 To:', recipientEmail);
    console.log('📬 Message ID:', info.messageId);
    console.log('🔗 Reset Token:', testToken);
    console.log('='.repeat(60));
    console.log('\n🎉 Check your inbox at:', recipientEmail);
    console.log('💡 Tip: Check spam/junk folder if you don\'t see it');
    console.log('💡 Gmail sometimes takes 10-30 seconds to arrive\n');
  } catch (err) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ ERROR OCCURRED');
    console.error('='.repeat(60));
    console.error('Message:', err.message);
    console.error('Code:', err.code);
    
    if (err.code === 'EAUTH') {
      console.error('\n⚠️  AUTHENTICATION FAILED');
      console.error('Please check:');
      console.error('   1. EMAIL_USER is correct Gmail address');
      console.error('   2. EMAIL_PASS is App Password (16 chars, NOT regular password)');
      console.error('   3. 2-Step Verification is enabled on your Gmail');
      console.error('   4. App Password is generated from: https://myaccount.google.com/apppasswords');
    } else if (err.code === 'ECONNECTION') {
      console.error('\n⚠️  CONNECTION FAILED');
      console.error('Please check:');
      console.error('   1. Internet connection is stable');
      console.error('   2. EMAIL_HOST is correct: smtp.gmail.com');
      console.error('   3. EMAIL_PORT is correct: 587');
    }
    console.error('='.repeat(60) + '\n');
  }
}

testGmail();
