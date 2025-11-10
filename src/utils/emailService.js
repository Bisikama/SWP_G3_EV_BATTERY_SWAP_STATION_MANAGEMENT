// const nodemailer = require('nodemailer');

// Note: Resend will be loaded dynamically when needed (see sendVerificationEmail function)

// create transporter
// function createTransporter() {
//   const config = {
//     host: process.env.EMAIL_HOST,
//     port: parseInt(process.env.EMAIL_PORT || '587'),
//     secure: false,
//     requireTLS: true,
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASS
//     }
//   };
  
//   console.log('📧 Email transporter config:', {
//     host: config.host,
//     port: config.port,
//     user: config.auth.user,
//     pass: config.auth.pass ? '***' : 'NOT SET'
//   });

//   return nodemailer.createTransport(config);
// }

// //Hàm random sắp xếp mảng
// function shuffle(array) {
//   let currentIndex = array.length, randomIndex;

//   // While there remain elements to shuffle
//   while (currentIndex !== 0) {
//     // Pick a remaining element
//     randomIndex = Math.floor(Math.random() * currentIndex);
//     currentIndex--;

//     // And swap it with the current element
//     [array[currentIndex], array[randomIndex]] = [
//       array[randomIndex], array[currentIndex]
//     ];
//   }

//   return array;
// }


// /**
//  * Send password reset email with 6-digit code
//  * @param {string} toEmail - recipient email
//  * @param {string} code - 6-digit reset code
//  * @returns {Promise<boolean>} - true if sent successfully
//  */
// async function sendPasswordResetEmail(toEmail, code) {
//   try {
//     if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER) {
//       console.error('❌ EMAIL_HOST or EMAIL_USER not configured in .env');
//       return false;
//     }

//     const transporter = createTransporter();
    
//     // verify connection first
//     await transporter.verify();
//     console.log('✅ SMTP connection verified');
    
//     const mailOptions = {
//       from: `"VinStation Support" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
//       to: toEmail,
//       subject: '🔐 Mã xác thực đặt lại mật khẩu - VinStation',
//       text: `Bạn đã yêu cầu đặt lại mật khẩu.\n\nMã xác thực của bạn là: ${code}\n\nVui lòng nhập mã này vào trang web để tiếp tục đặt lại mật khẩu.\n\nMã có hiệu lực trong 10 phút.\n\nNếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.`,
//       html: `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
//           <div style="text-align: center; margin-bottom: 20px;">
//             <h1 style="color: #2563eb; margin: 0;">🔋 VinStation</h1>
//             <p style="color: #666; margin: 5px 0;">EV Battery Swap Station Management</p>
//           </div>
          
//           <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
//             <h2 style="color: #92400e; margin: 0 0 5px 0;">🔐 Đặt lại mật khẩu</h2>
//             <p style="margin: 0; color: #92400e;">Xác nhận danh tính của bạn</p>
//           </div>
          
//           <p style="color: #555; line-height: 1.6;">
//             Chào bạn,<br><br>
//             Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại VinStation.
//           </p>
          
//           <p style="color: #555; line-height: 1.6;">
//             Để tiếp tục, vui lòng nhập mã xác thực sau vào trang web:
//           </p>
          
//           <div style="background-color: #f9fafb; padding: 30px; margin: 25px 0; border-radius: 8px; border: 2px solid #ef4444;">
//             <p style="text-align: center; color: #64748b; margin: 0 0 15px 0; font-size: 14px;">
//               🔑 <strong>MÃ XÁC THỰC ĐẶT LẠI MẬT KHẨU</strong>
//             </p>
            
//             <div style="text-align: center; margin: 20px 0;">
//               <div style="display: inline-block; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 20px 40px; border-radius: 12px; box-shadow: 0 4px 15px rgba(245, 87, 108, 0.4);">
//                 <span style="font-size: 36px; font-weight: bold; color: white; letter-spacing: 8px; font-family: 'Courier New', monospace;">
//                   ${code}
//                 </span>
//               </div>
//             </div>
//           </div>
          
//           <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0;">
//             <p style="margin: 0; color: #92400e;">
//               ⏰ Mã xác thực có hiệu lực trong <strong>10 phút</strong>
//             </p>
//           </div>
          
//           <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 12px; margin: 20px 0;">
//             <p style="margin: 0; color: #991b1b;">
//               ⚠️ <strong>BẢO MẬT:</strong> Không chia sẻ mã này với bất kỳ ai. Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này và liên hệ hỗ trợ ngay.
//             </p>
//           </div>
          
//           <p style="color: #555; line-height: 1.6;">
//             Nếu bạn không yêu cầu đặt lại mật khẩu, tài khoản của bạn vẫn an toàn. Vui lòng bỏ qua email này.
//           </p>
          
//           <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
          
//           <p style="color: #999; font-size: 12px; text-align: center;">
//             © 2025 VinStation - EV Battery Swap Station Management<br>
//             Email này được gửi tự động, vui lòng không trả lời.
//           </p>
//         </div>
//       `
//     };

//     const info = await transporter.sendMail(mailOptions);
//     console.log('✅ Password reset email sent:', info.messageId);
//     console.log('📬 Preview URL:', nodemailer.getTestMessageUrl(info));
//     return true;
//   } catch (err) {
//     console.error('❌ Error sending password reset email:', err);
//     console.error('Error details:', {
//       message: err.message,
//       code: err.code,
//       command: err.command
//     });
//     return false;
//   }
// }

// async function sendPasswordChangeConfirmation(toEmail) {
//   try {
//     if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER) {
//       console.error('❌ EMAIL_HOST or EMAIL_USER not configured');
//       return false;
//     }

//     const transporter = createTransporter();
    
//     const mailOptions = {
//       from: `"VinStation Support" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
//       to: toEmail,
//       subject: '✅ Mật khẩu đã được thay đổi - VinStation',
//       text: 'Mật khẩu của bạn đã được thay đổi thành công.\n\nThời gian: ' + new Date().toLocaleString('vi-VN') + '\n\nNếu bạn không thực hiện thay đổi này, vui lòng liên hệ với bộ phận hỗ trợ ngay lập tức.',
//       html: `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
//           <div style="text-align: center; margin-bottom: 20px;">
//             <h1 style="color: #2563eb; margin: 0;">🔋 VinStation</h1>
//             <p style="color: #666; margin: 5px 0;">EV Battery Swap Station Management</p>
//           </div>
          
//           <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
//             <h2 style="color: #065f46; margin: 0 0 5px 0;">✅ Mật khẩu đã được thay đổi</h2>
//             <p style="margin: 0; color: #047857;">Tài khoản của bạn đã được cập nhật thành công</p>
//           </div>
          
//           <p style="color: #555; line-height: 1.6;">
//             Chào bạn,<br><br>
//             Mật khẩu của bạn đã được thay đổi thành công vào lúc <strong>${new Date().toLocaleString('vi-VN')}</strong>.
//           </p>
          
//           <div style="background-color: #f3f4f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
//             <p style="margin: 0; color: #374151;">
//               <strong>📍 Thông tin:</strong><br>
//               🕒 Thời gian: ${new Date().toLocaleString('vi-VN')}<br>
//               📧 Email: ${toEmail}
//             </p>
//           </div>
          
//           <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 12px; margin: 20px 0;">
//             <p style="margin: 0; color: #991b1b;">
//               ⚠️ <strong>Nếu bạn KHÔNG thực hiện thay đổi này:</strong><br>
//               Vui lòng liên hệ với bộ phận hỗ trợ ngay lập tức để bảo vệ tài khoản của bạn.
//             </p>
//           </div>
          
//           <p style="color: #555; line-height: 1.6;">
//             Nếu bạn đã thực hiện thay đổi này, bạn có thể bỏ qua email này.
//           </p>
          
//           <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
          
//           <p style="color: #999; font-size: 12px; text-align: center;">
//             © 2025 VinStation - EV Battery Swap Station Management<br>
//             Email này được gửi tự động, vui lòng không trả lời.
//           </p>
//         </div>
//       `
//     };

//     const info = await transporter.sendMail(mailOptions);
//     console.log('✅ Password change confirmation sent:', info.messageId);
//     console.log('📬 Preview URL:', nodemailer.getTestMessageUrl(info));
//     return true;
//   } catch (err) {
//     console.error('❌ Error sending confirmation email:', err);
//     return false;
//   }
// }

/**
 * Generate a single 6-digit verification code
 * Returns: string (6 digits)
 */
function generateVerificationCode() {
  // Generate 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  return code;
}

/**
 * Send email verification with single 6-digit code
 * @param {string} toEmail - recipient email
 * @param {string} code - 6-digit verification code
 * @returns {Promise<boolean>} - true if sent successfully
 */
async function sendVerificationEmail(toEmail, code) {
  try {
    // Dynamically import Resend (ES module) in CommonJS context
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    console.log('✅ Resend initialized');
    
    // Normalize RESEND_FROM: remove smart quotes and trim
    let fromAddress = (process.env.RESEND_FROM || 'VinStation Support <noreply@stationvinswap.xyz>').trim();
    fromAddress = fromAddress.replace(/[""]/g, '"'); // Replace smart quotes
    
    console.log('📧 Using FROM address:', fromAddress);
    
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: toEmail,
      subject: '🔐 Mã xác thực đăng ký tài khoản - VinStation',
      text: `Chào mừng bạn đến với VinStation!\n\nMã xác thực của bạn là: ${code}\n\nVui lòng nhập mã này vào trang web để hoàn tất đăng ký.\n\nMã xác thực có hiệu lực trong 10 phút.\n\nNếu bạn không yêu cầu đăng ký, vui lòng bỏ qua email này.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #2563eb; margin: 0;">🔋 VinStation</h1>
            <p style="color: #666; margin: 5px 0;">EV Battery Swap Station Management</p>
          </div>
          
          <div style="background-color: #dbeafe; border-left: 4px solid #2563eb; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
            <h2 style="color: #1e40af; margin: 0 0 5px 0;">🎉 Chào mừng bạn đến với VinStation!</h2>
            <p style="margin: 0; color: #1e40af;">Xác thực email để hoàn tất đăng ký</p>
          </div>
          
          <p style="color: #555; line-height: 1.6;">
            Để hoàn tất đăng ký tài khoản, vui lòng nhập mã xác thực sau vào trang web:
          </p>
          
          <div style="background-color: #f9fafb; padding: 30px; margin: 25px 0; border-radius: 8px; border: 2px solid #2563eb;">
            <p style="text-align: center; color: #64748b; margin: 0 0 15px 0; font-size: 14px;">
              🔑 <strong>MÃ XÁC THỰC CỦA BẠN</strong>
            </p>
            
            <div style="text-align: center; margin: 20px 0;">
              <div style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px 40px; border-radius: 12px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                <span style="font-size: 36px; font-weight: bold; color: white; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                  ${code}
                </span>
              </div>
            </div>
          </div>
          
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e;">
              ⏰ Mã xác thực có hiệu lực trong <strong>10 phút</strong>
            </p>
          </div>
          
          <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 12px; margin: 20px 0;">
            <p style="margin: 0; color: #991b1b;">
              ⚠️ <strong>BẢO MẬT:</strong> Không chia sẻ mã này với bất kỳ ai. VinStation sẽ không bao giờ yêu cầu mã xác thực qua điện thoại.
            </p>
          </div>
          
          <p style="color: #555; line-height: 1.6;">
            Nếu bạn không yêu cầu đăng ký tài khoản tại VinStation, vui lòng bỏ qua email này.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            © 2025 VinStation - EV Battery Swap Station Management<br>
            Email này được gửi tự động, vui lòng không trả lời.
          </p>
        </div>
      `
    });

    if (error) {
      console.error('❌ Resend error:', error);
      return false;
    }

    console.log('✅ Verification email sent via Resend:', data.id);
    return true;
  } catch (err) {
    console.error('❌ Error sending verification email:', err);
    console.error('Error details:', {
      message: err.message,
      code: err.code,
      command: err.command
    });
    return false;
  }
}

/**
 * Send password reset email with 6-digit code
 * @param {string} toEmail - recipient email
 * @param {string} code - 6-digit reset code
 * @returns {Promise<boolean>} - true if sent successfully
 */
async function sendPasswordResetEmail(toEmail, code) {
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    console.log('✅ Resend initialized');
    
    // Normalize RESEND_FROM: remove smart quotes and trim
    let fromAddress = (process.env.RESEND_FROM || 'VinStation Support <noreply@stationvinswap.xyz>').trim();
    fromAddress = fromAddress.replace(/[""]/g, '"');
    
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: toEmail,
      subject: '🔐 Mã xác thực đặt lại mật khẩu - VinStation',
      text: `Bạn đã yêu cầu đặt lại mật khẩu.\n\nMã xác thực của bạn là: ${code}\n\nVui lòng nhập mã này vào trang web để tiếp tục đặt lại mật khẩu.\n\nMã có hiệu lực trong 10 phút.\n\nNếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #2563eb; margin: 0;">🔋 VinStation</h1>
            <p style="color: #666; margin: 5px 0;">EV Battery Swap Station Management</p>
          </div>
          
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
            <h2 style="color: #92400e; margin: 0 0 5px 0;">🔐 Đặt lại mật khẩu</h2>
            <p style="margin: 0; color: #92400e;">Xác nhận danh tính của bạn</p>
          </div>
          
          <p style="color: #555; line-height: 1.6;">
            Chào bạn,<br><br>
            Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại VinStation.
          </p>
          
          <p style="color: #555; line-height: 1.6;">
            Để tiếp tục, vui lòng nhập mã xác thực sau vào trang web:
          </p>
          
          <div style="background-color: #f9fafb; padding: 30px; margin: 25px 0; border-radius: 8px; border: 2px solid #ef4444;">
            <p style="text-align: center; color: #64748b; margin: 0 0 15px 0; font-size: 14px;">
              🔑 <strong>MÃ XÁC THỰC ĐẶT LẠI MẬT KHẨU</strong>
            </p>
            
            <div style="text-align: center; margin: 20px 0;">
              <div style="display: inline-block; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 20px 40px; border-radius: 12px; box-shadow: 0 4px 15px rgba(245, 87, 108, 0.4);">
                <span style="font-size: 36px; font-weight: bold; color: white; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                  ${code}
                </span>
              </div>
            </div>
          </div>
          
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e;">
              ⏰ Mã xác thực có hiệu lực trong <strong>10 phút</strong>
            </p>
          </div>
          
          <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 12px; margin: 20px 0;">
            <p style="margin: 0; color: #991b1b;">
              ⚠️ <strong>BẢO MẬT:</strong> Không chia sẻ mã này với bất kỳ ai. Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này và liên hệ hỗ trợ ngay.
            </p>
          </div>
          
          <p style="color: #555; line-height: 1.6;">
            Nếu bạn không yêu cầu đặt lại mật khẩu, tài khoản của bạn vẫn an toàn. Vui lòng bỏ qua email này.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            © 2025 VinStation - EV Battery Swap Station Management<br>
            Email này được gửi tự động, vui lòng không trả lời.
          </p>
        </div>
      `
    });
    if (error) {
      console.error('❌ Resend error:', error);
      return false;
    }

    console.log('✅ Verification email sent via Resend:', data.id);
 
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
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    console.log('✅ Resend initialized');
    
    // Normalize RESEND_FROM: remove smart quotes and trim
    let fromAddress = (process.env.RESEND_FROM || 'VinStation Support <noreply@stationvinswap.xyz>').trim();
    fromAddress = fromAddress.replace(/[""]/g, '"');
    
    const { data, error } = await resend.emails.send({
      from: fromAddress,
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
    });

    if (error) {
      console.error('❌ Error sending password change confirmation email:', error);
      return false;
    }

    console.log('✅ Password change confirmation sent:', data.id);
    return true;
  } catch (err) {
    console.error('❌ Error sending confirmation email:', err);
    return false;
  }
}

/**
 * Helper function: Gửi email nhắc nhở gia hạn gói
 */
async function sendSubscriptionExpiryEmail(toEmail, driverName, planName, licensePlate, endDate, planPrice) {
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    console.log('✅ Resend initialized for subscription expiry email');
    
    // Normalize RESEND_FROM: remove smart quotes and trim
    let fromAddress = (process.env.RESEND_FROM || 'VinStation Support <noreply@stationvinswap.xyz>').trim();
    fromAddress = fromAddress.replace(/[""]/g, '"');
    
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: toEmail,
      subject: '⚠️ Gói đăng ký của bạn đã hết hạn - Gia hạn ngay!',
      text: `Xin chào ${driverName},\n\nGói đăng ký của bạn đã hết hạn.\n\nThông tin gói:\n- Tên gói: ${planName}\n- Biển số xe: ${licensePlate}\n- Ngày hết hạn: ${new Date(endDate).toLocaleDateString('vi-VN')}\n- Giá gia hạn: ${planPrice?.toLocaleString('vi-VN')} VNĐ\n\nVui lòng gia hạn để tiếp tục sử dụng dịch vụ đổi pin.\n\nTrân trọng,\nEV Battery Swap Station Team`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #667eea; border-radius: 5px; }
            .warning-box { background: #fff3cd; padding: 15px; margin: 20px 0; border-left: 4px solid #ffc107; border-radius: 5px; }
            .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Thông Báo Hết Hạn Gói</h1>
            </div>
            <div class="content">
              <p>Xin chào <strong>${driverName}</strong>,</p>
              
              <p>Gói đăng ký của bạn đã <strong style="color: #dc3545;">hết hạn</strong>. Vui lòng gia hạn để tiếp tục sử dụng dịch vụ đổi pin.</p>
              
              <div class="info-box">
                <h3>📋 Thông Tin Gói Đã Hết Hạn</h3>
                <p><strong>Tên gói:</strong> ${planName}</p>
                <p><strong>Biển số xe:</strong> ${licensePlate}</p>
                <p><strong>Ngày hết hạn:</strong> ${new Date(endDate).toLocaleDateString('vi-VN')}</p>
                <p><strong>Giá gia hạn:</strong> ${planPrice?.toLocaleString('vi-VN')} VNĐ</p>
              </div>
              
              <div class="warning-box">
                <strong>⚠️ Lưu ý:</strong> Bạn sẽ không thể đổi pin khi gói đã hết hạn. Vui lòng gia hạn ngay để tiếp tục sử dụng dịch vụ.
              </div>
              
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL_SUBSCRIPTION || 'http://localhost:5173/subscriptionManagement'}" class="button">
                  🔄 Gia Hạn Ngay
                </a>
              </div>
              
              <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi qua email hoặc hotline.</p>
              
              <div class="footer">
                <p>Trân trọng,<br><strong>EV Battery Swap Station Team</strong></p>
                <p style="font-size: 12px; color: #999;">© 2025 VinStation - Email này được gửi tự động, vui lòng không trả lời.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    });

    if (error) {
      console.error('❌ Resend error (subscription expiry):', error);
      return false;
    }

    console.log('✅ Subscription expiry email sent via Resend:', data.id);
    return true;
    
  } catch (error) {
    console.error('❌ Error sending subscription expiry email:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code
    });
    return false;
  }
}

module.exports = { sendPasswordResetEmail, sendPasswordChangeConfirmation, generateVerificationCode, sendVerificationEmail, sendSubscriptionExpiryEmail };