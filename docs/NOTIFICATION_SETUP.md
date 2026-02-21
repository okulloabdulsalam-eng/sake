# Notification System Setup Guide

## Overview

The notification system automatically sends WhatsApp and email notifications to all registered users for:
- **White Days Fasting Reminders** (13th, 14th, 15th of each Hijri month)
- **Thursday and Monday Fasting Reminders** (sent on Sunday and Wednesday at 2pm, 6pm, and 7:40pm)

## How It Works

### Frontend (script.js)

1. **White Days Notifications**: When the Hijri date is between the 10th-12th, a notification is created and sent to all users.
2. **Fasting Reminders**: On Sundays and Wednesdays at specific times (2pm, 6pm, 7:40pm), reminders are sent for fasting the next day (Monday/Thursday).

### Notification Functions

- `getAllRegisteredUsers()`: Retrieves all users from localStorage (excluding passwords)
- `sendWhatsAppNotification(number, message)`: Sends WhatsApp notification to a single user
- `sendEmailNotification(email, subject, message)`: Sends email notification to a single user
- `sendNotificationsToAllUsers(subject, message)`: Sends notifications to all registered users

## Backend Setup (server.js)

The backend includes API endpoints for sending notifications:

### Endpoints

1. **POST /api/send-whatsapp**
   - Body: `{ "number": "+256703268522", "message": "Your message" }`
   - Sends WhatsApp notification

2. **POST /api/send-email**
   - Body: `{ "email": "user@example.com", "subject": "Subject", "message": "Your message" }`
   - Sends email notification

3. **POST /api/send-notifications**
   - Body: `{ "subject": "Subject", "message": "Your message" }`
   - Sends notifications to all users in the database

## Integration with Messaging Services

### WhatsApp Integration

To actually send WhatsApp messages, you need to integrate with one of these services:

1. **WhatsApp Business API** (Official)
   - Requires Meta Business Account
   - Best for production use
   - Documentation: https://developers.facebook.com/docs/whatsapp

2. **Twilio WhatsApp API**
   - Easy to set up
   - Pay-per-message pricing
   - Documentation: https://www.twilio.com/docs/whatsapp

3. **Other WhatsApp Services**
   - Many third-party services available
   - Research and choose based on your needs

### Email Integration

To actually send emails, integrate with one of these services:

1. **Nodemailer with SMTP**
   ```javascript
   const nodemailer = require('nodemailer');
   const transporter = nodemailer.createTransport({
       host: 'smtp.gmail.com',
       port: 587,
       secure: false,
       auth: {
           user: 'your-email@gmail.com',
           pass: 'your-app-password'
       }
   });
   ```

2. **SendGrid**
   - Popular email service
   - Free tier available
   - Documentation: https://sendgrid.com/docs/

3. **Mailgun**
   - Reliable email service
   - Free tier available
   - Documentation: https://documentation.mailgun.com/

4. **AWS SES**
   - Amazon's email service
   - Very cost-effective
   - Documentation: https://aws.amazon.com/ses/

## Setup Instructions

### 1. Update Database Schema

The database now includes a `whatsapp` field. If you have an existing database, the migration will run automatically when you start the server.

### 2. Configure Backend API

1. Install required packages (if using email):
   ```bash
   npm install nodemailer
   # or
   npm install @sendgrid/mail
   ```

2. Update `server.js` to integrate with your chosen service:
   - Uncomment and configure the email sending code in `/api/send-email`
   - Add WhatsApp API integration in `/api/send-whatsapp`

### 3. Configure Frontend

The frontend automatically tries to connect to the backend API at `http://localhost:3000`. If your backend is at a different URL, set it:

```javascript
window.API_BASE_URL = 'https://your-backend-url.com';
```

### 4. Test Notifications

1. Create test user accounts with WhatsApp numbers and emails
2. Wait for a white days reminder (10th-12th of Hijri month) or fasting reminder time
3. Check console logs for notification status
4. Verify notifications are received

## Fallback Behavior

If the backend API is not available:
- Notifications are stored in localStorage queues:
  - `whatsappNotificationQueue`: Stores WhatsApp notifications
  - `emailNotificationQueue`: Stores email notifications
- These can be processed later when the backend is available
- Or manually sent using the stored data

## User Data Structure

Users are stored with the following structure:
```javascript
{
    id: "unique-id",
    firstName: "John",
    lastName: "Doe",
    name: "John Doe",
    email: "john@example.com",
    whatsapp: "+256703268522",
    gender: "Male",
    createdAt: "2024-01-01T00:00:00.000Z"
}
```

## Troubleshooting

### Notifications not sending
1. Check browser console for errors
2. Verify backend server is running
3. Check API endpoint URLs are correct
4. Verify user accounts have WhatsApp numbers and emails

### Backend errors
1. Check server logs
2. Verify database connection
3. Check API service credentials (for WhatsApp/Email services)
4. Verify rate limits aren't exceeded

## Security Notes

- Never expose API keys in frontend code
- Use environment variables for sensitive credentials
- Implement rate limiting to prevent abuse
- Validate user input before sending notifications
- Consider implementing opt-in/opt-out for notifications

