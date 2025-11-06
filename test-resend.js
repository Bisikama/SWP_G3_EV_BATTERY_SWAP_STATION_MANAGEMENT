/**
 * Test Resend Email Service
 * Run: node test-resend.js
 */

require('dotenv').config();

// Check if running as ES module or CommonJS
async function testResend() {
  try {
    console.log('🔄 Starting Resend Email Test...\n');

    // Step 1: Check environment variables
    console.log('📋 Step 1: Checking environment variables...');
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY not found in .env file');
      console.log('\n💡 Please add to your .env file:');
      console.log('RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx');
      process.exit(1);
    }
    
    console.log('✅ RESEND_API_KEY found:', process.env.RESEND_API_KEY.substring(0, 10) + '...');
    console.log('✅ RESEND_FROM:', process.env.RESEND_FROM || 'onboarding@resend.dev');
    console.log('');

    // Step 2: Import Resend
    console.log('📦 Step 2: Importing Resend library...');
    const { Resend } = await import('resend');
    console.log('✅ Resend imported successfully\n');

    // Step 3: Initialize Resend client
    console.log('🔧 Step 3: Initializing Resend client...');
    const resend = new Resend(process.env.RESEND_API_KEY);
    console.log('✅ Resend client initialized\n');

    // Step 4: Prepare test email
    console.log('📧 Step 4: Preparing test email...');
    const testCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('✅ Generated test code:', testCode);
    
    const testEmail = {
      from: 'VinStation Support <onboarding@resend.dev>',
      to:  'nguyenminhbao28032000@gmail.com', // Change this to your test email
      subject: '🧪 Test Email from Resend - VinStation',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #2563eb; margin: 0;">🔋 VinStation</h1>
            <p style="color: #666; margin: 5px 0;">EV Battery Swap Station Management</p>
          </div>
          
          <div style="background-color: #dbeafe; border-left: 4px solid #2563eb; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
            <h2 style="color: #1e40af; margin: 0 0 5px 0;">🧪 Test Email - Resend Integration</h2>
            <p style="margin: 0; color: #1e40af;">This is a test email to verify Resend configuration</p>
          </div>
          
          <p style="color: #555; line-height: 1.6;">
            <strong>Test Details:</strong><br>
            📅 Date: ${new Date().toLocaleString('vi-VN')}<br>
            🔑 Test Code: <strong>${testCode}</strong><br>
            📧 Sent via: Resend API
          </p>
          
          <div style="background-color: #f9fafb; padding: 30px; margin: 25px 0; border-radius: 8px; border: 2px solid #2563eb;">
            <p style="text-align: center; color: #64748b; margin: 0 0 15px 0; font-size: 14px;">
              🔑 <strong>VERIFICATION CODE</strong>
            </p>
            
            <div style="text-align: center; margin: 20px 0;">
              <div style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px 40px; border-radius: 12px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                <span style="font-size: 36px; font-weight: bold; color: white; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                  ${testCode}
                </span>
              </div>
            </div>
          </div>
          
          <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 12px; margin: 20px 0;">
            <p style="margin: 0; color: #065f46;">
              ✅ If you received this email, Resend is configured correctly!
            </p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            © 2025 VinStation - EV Battery Swap Station Management<br>
            Test email sent via Resend API
          </p>
        </div>
      `,
      text: `VinStation Test Email\n\nTest Code: ${testCode}\n\nDate: ${new Date().toLocaleString('vi-VN')}\n\nIf you received this email, Resend is configured correctly!`
    };

    console.log('');
    console.log('📬 Email details:');
    console.log('   From:', testEmail.from);
    console.log('   To:', testEmail.to);
    console.log('   Subject:', testEmail.subject);
    console.log('');

    // Step 5: Send email
    console.log('🚀 Step 5: Sending test email via Resend...');
    console.log('⏳ Please wait...\n');

    const { data, error } = await resend.emails.send(testEmail);

    if (error) {
      console.error('❌ Failed to send email via Resend');
      console.error('Error details:', error);
      process.exit(1);
    }

    // Step 6: Success
    console.log('✅ ========================================');
    console.log('✅ EMAIL SENT SUCCESSFULLY! 🎉');
    console.log('✅ ========================================');
    console.log('');
    console.log('📨 Response from Resend:');
    console.log('   Email ID:', data.id);
    console.log('   Status: Sent');
    console.log('');
    console.log('📧 Check your inbox at:', testEmail.to);
    console.log('');
    console.log('💡 Tips:');
    console.log('   - Check spam folder if not in inbox');
    console.log('   - Verify email in Resend dashboard: https://resend.com/emails');
    console.log('   - Check delivery status and logs');
    console.log('');
    console.log('✅ Resend configuration is working correctly!');

  } catch (error) {
    console.error('\n❌ ========================================');
    console.error('❌ TEST FAILED');
    console.error('❌ ========================================\n');
    console.error('Error:', error.message);
    console.error('\nFull error details:', error);
    
    console.log('\n🔧 Troubleshooting:');
    console.log('');
    console.log('1. Check RESEND_API_KEY in .env file:');
    console.log('   - Get your API key from: https://resend.com/api-keys');
    console.log('   - Format: RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx');
    console.log('');
    console.log('2. Verify domain setup (for production):');
    console.log('   - Add and verify your domain at: https://resend.com/domains');
    console.log('   - For testing, you can use: onboarding@resend.dev');
    console.log('');
    console.log('3. Check rate limits:');
    console.log('   - Free tier: 100 emails/day');
    console.log('   - Check usage at: https://resend.com/overview');
    console.log('');
    console.log('4. Install resend package:');
    console.log('   npm install resend');
    console.log('');

    process.exit(1);
  }
}

// Run the test
testResend();
