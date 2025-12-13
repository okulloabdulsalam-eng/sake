# Remaining Setup Tasks

This document outlines what you still need to do to complete the setup for both systems.

## System 1: PHP/MySQL Recruitment Backend (SETUP_INSTRUCTIONS.md)

This is for the recruitment form (`join-us.html`). Here's what's left:

### ✅ Already Done:
- Database schema created (`database/schema.sql`)
- PHP files created (`api/submit_recruit.php`, `api/join_us_form.php`)
- Configuration file structure (`config/database.php`)

### ❌ Still Need To Do:

#### 1. Database Setup
- [ ] Create MySQL database: `kiuma_recruitment`
- [ ] Import schema: `mysql -u root -p kiuma_recruitment < database/schema.sql`
- [ ] Or import via phpMyAdmin

#### 2. Configure Database Connection
- [ ] Edit `config/database.php`
- [ ] Update `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME` with your MySQL credentials

#### 3. Configure Email Notifications
Choose one option:

**Option A: Simple PHP mail()**
- [ ] Edit `config/database.php`
- [ ] Set `EMAIL_TO` and `EMAIL_FROM` constants

**Option B: SMTP (Recommended)**
- [ ] Install PHPMailer: `composer require phpmailer/phpmailer`
- [ ] Get Gmail App Password (or other email provider credentials)
- [ ] Edit `config/database.php`
- [ ] Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_ENCRYPTION`

#### 4. Configure WhatsApp (Twilio)
- [ ] Create Twilio account at https://www.twilio.com/try-twilio
- [ ] Get Account SID and Auth Token from Twilio Console
- [ ] Set up WhatsApp Sandbox (for testing)
- [ ] Edit `config/database.php`
- [ ] Set `WHATSAPP_TO`, `WHATSAPP_FROM`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`

#### 5. File Permissions
- [ ] Set permissions: `chmod 644 config/database.php`
- [ ] Create `.htaccess` in `config/` directory to protect sensitive files

#### 6. Test
- [ ] Test database connection: Access `test_db.php` in browser
- [ ] Test form submission: Submit recruitment form and verify:
  - Data saved to database
  - Email notification received
  - WhatsApp notification received

---

## System 2: Node.js Notification System (NOTIFICATION_SETUP.md)

This is for automatic fasting reminder notifications. Here's what's left:

### ✅ Already Done:
- Frontend notification functions created (`script.js`)
- Backend API endpoints created (`server.js`)
- Database schema updated (includes `whatsapp` field)
- Integration with white days and fasting reminders

### ❌ Still Need To Do:

#### 1. Install Node.js Dependencies
- [ ] Install email service (choose one):
  ```bash
  npm install nodemailer
  # OR
  npm install @sendgrid/mail
  # OR
  npm install mailgun-js
  ```

#### 2. Implement WhatsApp API Integration
- [ ] Choose WhatsApp service:
  - **Option A:** Twilio WhatsApp API
    - Create Twilio account
    - Get Account SID and Auth Token
    - Install: `npm install twilio`
  - **Option B:** Meta WhatsApp Business API
    - Create Meta Developer account
    - Set up WhatsApp Business Account
    - Get API credentials
  - **Option C:** Other WhatsApp service

- [ ] Edit `server.js` → `/api/send-whatsapp` endpoint
- [ ] Replace the placeholder code with actual WhatsApp API calls
- [ ] Add your API credentials (use environment variables for security)

#### 3. Implement Email Service Integration
- [ ] Edit `server.js` → `/api/send-email` endpoint
- [ ] Uncomment and configure the email sending code
- [ ] Add your email service credentials:
  - For Nodemailer: SMTP settings
  - For SendGrid: API key
  - For Mailgun: API key and domain
  - For AWS SES: AWS credentials

#### 4. Set Up Environment Variables (Recommended)
- [ ] Create `.env` file in project root:
  ```
  # WhatsApp (Twilio example)
  TWILIO_ACCOUNT_SID=your_account_sid
  TWILIO_AUTH_TOKEN=your_auth_token
  TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
  
  # Email (Nodemailer example)
  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=587
  SMTP_USER=your-email@gmail.com
  SMTP_PASS=your-app-password
  
  # Database
  DB_PATH=./kiuma_users.db
  ```

- [ ] Install dotenv: `npm install dotenv`
- [ ] Add to `server.js`: `require('dotenv').config();`
- [ ] Update code to use `process.env.VARIABLE_NAME`

#### 5. Start the Backend Server
- [ ] Run: `node server.js`
- [ ] Verify server starts on port 3000 (or your configured port)
- [ ] Test health endpoint: `http://localhost:3000/health`

#### 6. Configure Frontend API URL (if needed)
- [ ] If backend is not at `http://localhost:3000`, update in `script.js`:
  ```javascript
  window.API_BASE_URL = 'https://your-backend-url.com';
  ```

#### 7. Test Notifications
- [ ] Create test user accounts with WhatsApp numbers and emails
- [ ] Wait for white days reminder (10th-12th of Hijri month) OR
- [ ] Manually trigger fasting reminder (Sunday/Wednesday at 2pm, 6pm, or 7:40pm)
- [ ] Check console logs for notification status
- [ ] Verify notifications are received:
  - Check WhatsApp messages
  - Check email inbox

#### 8. Production Deployment
- [ ] Set up production server (VPS, cloud service, etc.)
- [ ] Install Node.js and dependencies
- [ ] Set up process manager (PM2): `npm install -g pm2`
- [ ] Configure environment variables on server
- [ ] Set up SSL/HTTPS
- [ ] Configure domain name
- [ ] Set up automatic server restart
- [ ] Set up monitoring/logging

---

## Quick Start Checklist

### For PHP Recruitment Backend:
1. [ ] MySQL database created
2. [ ] `config/database.php` configured
3. [ ] Email service configured
4. [ ] Twilio WhatsApp configured
5. [ ] Test form submission

### For Node.js Notification System:
1. [ ] `npm install` dependencies
2. [ ] WhatsApp API integrated in `server.js`
3. [ ] Email service integrated in `server.js`
4. [ ] Environment variables configured
5. [ ] Server running and tested
6. [ ] Notifications working

---

## Important Notes

1. **Security**: Never commit API keys, passwords, or credentials to Git
2. **Environment Variables**: Use `.env` file and add it to `.gitignore`
3. **Testing**: Test in development before deploying to production
4. **Rate Limits**: Be aware of API rate limits for WhatsApp and email services
5. **Costs**: Some services have free tiers, but production use may incur costs

---

## Need Help?

- Check the respective setup documentation:
  - `SETUP_INSTRUCTIONS.md` for PHP backend
  - `NOTIFICATION_SETUP.md` for Node.js notifications
- Review service documentation:
  - Twilio: https://www.twilio.com/docs/whatsapp
  - SendGrid: https://sendgrid.com/docs/
  - Nodemailer: https://nodemailer.com/about/

