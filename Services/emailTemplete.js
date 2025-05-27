
export function generateVerificationEmail(data) {
    const {
        userName,
        verificationLink,
        logoUrl = "https://res.cloudinary.com/dfdmgqhwa/image/upload/v1746978997/trendix.jpg",
        supportEmail = "trendix909@gmail.com",
    } = data;

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Trendix Account</title>
      <style>
        body {
          font-family: 'Helvetica Neue', Arial, sans-serif;
          background-color: #f5f5f5;
          margin: 0;
          padding: 0;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
        .header {
          padding: 30px 20px;
          text-align: center;
          background: #ffffff;
          border-bottom: 1px solid #eeeeee;
        }
        .logo {
          max-width: 180px;
          height: auto;
        }
        .content {
          padding: 30px 40px;
          text-align: center;
        }
        h1 {
          font-size: 24px;
          color: #000000;
          margin-bottom: 20px;
          font-weight: 600;
        }
        p {
          font-size: 16px;
          line-height: 1.6;
          color: #555555;
          margin-bottom: 20px;
        }
        .verify-btn {
          display: inline-block;
          padding: 14px 28px;
          background: #000000;
          color: #ffffff !important;
          text-decoration: none;
          border-radius: 4px;
          font-weight: 600;
          font-size: 16px;
          margin: 20px 0;
        }
        .footer {
          padding: 20px;
          text-align: center;
          background: #f9f9f9;
          font-size: 14px;
          color: #777777;
        }
        .social-links a {
          margin: 0 10px;
          text-decoration: none;
        }
        .social-links img {
          width: 24px;
          height: 24px;
        }
        .divider {
          height: 1px;
          background: #eeeeee;
          margin: 20px 0;
        }
        .link {
          color: #000000;
          text-decoration: underline;
          font-weight: 500;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${logoUrl}" alt="Trendix Logo" class="logo">
        </div>
        
        <div class="content">
          <h1>Verify Your Email Address</h1>
          <p>Hi ${userName},</p>
          <p>Welcome to <strong>Trendix</strong> – your destination for the latest fashion trends!</p>
          <p>To complete your registration, please verify your email by clicking the button below:</p>
          
          <a href="${verificationLink}" class="verify-btn">VERIFY MY EMAIL</a>
          
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p><a href="${verificationLink}" class="link">${verificationLink}</a></p>
          
          <div class="divider"></div>
          
          <p><strong>Why verify?</strong><br>
          ✔ Secure your Trendix account<br>
          ✔ Enjoy seamless shopping & exclusive offers<br>
          ✔ Get updates on new arrivals & promotions</p>
          
          <p>If you didn’t create an account with us, please ignore this email.</p>
        </div>
        
        <div class="footer">
          <p>© 2024 Trendix. All rights reserved.</p>
          <div class="social-links">
            <a href="#"><img src="https://via.placeholder.com/24" alt="Instagram"></a>
            <a href="#"><img src="https://via.placeholder.com/24" alt="Facebook"></a>
            <a href="#"><img src="https://via.placeholder.com/24" alt="Twitter"></a>
          </div>
          <p>Need help? <a href="mailto:${supportEmail}" class="link">Contact Support</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}