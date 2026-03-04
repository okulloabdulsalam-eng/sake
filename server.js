const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const admin = require('firebase-admin');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const ADMIN_API_KEY = process.env.ADMIN_API_KEY || '';

function isAdminRequest(req) {
    if (!ADMIN_API_KEY) return true;
    const provided = req.headers['x-admin-key'];
    return typeof provided === 'string' && provided === ADMIN_API_KEY;
}

function initializeFirebaseAdmin() {
    if (admin.apps.length > 0) return true;

    try {
        // Preferred: set GOOGLE_APPLICATION_CREDENTIALS to your service account json file path.
        if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
            admin.initializeApp({
                credential: admin.credential.applicationDefault()
            });
            return true;
        }

        // Optional fallback: inline service account JSON via env var.
        if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            return true;
        }
    } catch (error) {
        console.error('Firebase Admin initialization failed:', error.message);
        return false;
    }

    console.warn('Firebase Admin credentials missing. Push send endpoint will be unavailable.');
    return false;
}

function chunkArray(items, size) {
    const chunks = [];
    for (let i = 0; i < items.length; i += size) {
        chunks.push(items.slice(i, i + size));
    }
    return chunks;
}

const firebaseReady = initializeFirebaseAdmin();

function isInvalidPushTokenCode(code) {
    return code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/invalid-registration-token';
}

function removeInvalidTokens(tokens) {
    if (!Array.isArray(tokens) || tokens.length === 0) return;
    const uniqueTokens = Array.from(new Set(tokens.filter(Boolean)));
    if (uniqueTokens.length === 0) return;
    const placeholders = uniqueTokens.map(() => '?').join(',');
    db.run(
        `DELETE FROM push_tokens WHERE token IN (${placeholders})`,
        uniqueTokens,
        (deleteErr) => {
            if (deleteErr) {
                console.error('Failed to clean invalid tokens:', deleteErr.message);
            }
        }
    );
}

// Initialize SQLite database
const dbPath = path.join(__dirname, 'kiuma_users.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database');
        // Create users table if it doesn't exist
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            firstName TEXT,
            lastName TEXT,
            name TEXT,
            whatsapp TEXT,
            gender TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                console.error('Error creating users table:', err.message);
            } else {
                console.log('Users table ready');
                // Add whatsapp column if it doesn't exist (for existing databases)
                db.run(`ALTER TABLE users ADD COLUMN whatsapp TEXT`, (alterErr) => {
                    // Ignore error if column already exists
                });
            }
        });

        // Create push tokens table (for Android FCM registration)
        db.run(`CREATE TABLE IF NOT EXISTS push_tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            token TEXT UNIQUE NOT NULL,
            platform TEXT DEFAULT 'android',
            packageName TEXT,
            userId TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (tokenTableErr) => {
            if (tokenTableErr) {
                console.error('Error creating push_tokens table:', tokenTableErr.message);
            } else {
                console.log('Push tokens table ready');
            }
        });
    }
});

// POST /register - Register a new user
app.post('/register', async (req, res) => {
    try {
        const { email, password, firstName, lastName, whatsapp, gender } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }

        // Check if email already exists
        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, row) => {
            if (err) {
                console.error('Database error:', err.message);
                return res.status(500).json({
                    success: false,
                    message: 'Database error occurred'
                });
            }

            if (row) {
                return res.status(400).json({
                    success: false,
                    message: 'This email is already registered. Please login instead.'
                });
            }

            // Hash password
            const saltRounds = 10;
            try {
                const hashedPassword = await bcrypt.hash(password, saltRounds);

                // Construct full name
                const fullName = firstName && lastName ? `${firstName} ${lastName}` : (firstName || lastName || '');

                // Insert new user
                db.run(
                    `INSERT INTO users (email, password, firstName, lastName, name, whatsapp, gender) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [email, hashedPassword, firstName || null, lastName || null, fullName || null, whatsapp || null, gender || null],
                    function(err) {
                        if (err) {
                            console.error('Error inserting user:', err.message);
                            return res.status(500).json({
                                success: false,
                                message: 'Error creating account. Please try again.'
                            });
                        }

                        // Return success with user data (without password)
                        res.status(201).json({
                            success: true,
                            message: 'Account created successfully!',
                            user: {
                                id: this.lastID,
                                email: email,
                                firstName: firstName || null,
                                lastName: lastName || null,
                                name: fullName || null,
                                whatsapp: whatsapp || null,
                                gender: gender || null
                            }
                        });
                    }
                );
            } catch (hashError) {
                console.error('Error hashing password:', hashError);
                return res.status(500).json({
                    success: false,
                    message: 'Error processing password'
                });
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// POST /login - Login user
app.post('/login', (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Find user by email
        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, row) => {
            if (err) {
                console.error('Database error:', err.message);
                return res.status(500).json({
                    success: false,
                    message: 'Database error occurred'
                });
            }

            if (!row) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password. Please try again.'
                });
            }

            // Compare password with stored hash
            try {
                const passwordMatch = await bcrypt.compare(password, row.password);

                if (!passwordMatch) {
                    return res.status(401).json({
                        success: false,
                        message: 'Invalid email or password. Please try again.'
                    });
                }

                // Update last login time (optional)
                db.run('UPDATE users SET updatedAt = CURRENT_TIMESTAMP WHERE id = ?', [row.id]);

                // Return success with user data (without password)
                res.json({
                    success: true,
                    message: 'Login successful!',
                    user: {
                        id: row.id,
                        email: row.email,
                        firstName: row.firstName,
                        lastName: row.lastName,
                        name: row.name,
                        whatsapp: row.whatsapp,
                        gender: row.gender,
                        createdAt: row.createdAt
                    }
                });
            } catch (compareError) {
                console.error('Error comparing password:', compareError);
                return res.status(500).json({
                    success: false,
                    message: 'Error verifying password'
                });
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// POST /api/send-whatsapp - Send WhatsApp notification
app.post('/api/send-whatsapp', (req, res) => {
    try {
        const { number, message } = req.body;

        if (!number || !message) {
            return res.status(400).json({
                success: false,
                message: 'WhatsApp number and message are required'
            });
        }

        // Clean the WhatsApp number
        const cleanNumber = number.replace(/[^\d]/g, '');
        
        // Encode the message for URL
        const encodedMessage = encodeURIComponent(message);
        
        // Create WhatsApp link
        const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
        
        // TODO: Integrate with WhatsApp Business API or Twilio here
        // For now, we'll log it and return success
        console.log('WhatsApp notification prepared:', whatsappUrl);
        
        // In production, use a service like:
        // - WhatsApp Business API
        // - Twilio WhatsApp API
        // - Other WhatsApp messaging services
        
        res.json({
            success: true,
            message: 'WhatsApp notification prepared',
            whatsappUrl: whatsappUrl
        });
    } catch (error) {
        console.error('Error sending WhatsApp notification:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// POST /api/send-email - Send email notification
app.post('/api/send-email', (req, res) => {
    try {
        const { email, subject, message } = req.body;

        if (!email || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: 'Email, subject, and message are required'
            });
        }

        // TODO: Integrate with email service here
        // Options:
        // - Nodemailer with SMTP
        // - SendGrid
        // - Mailgun
        // - AWS SES
        // - Other email services
        
        console.log('Email notification prepared:', { email, subject, message });
        
        // Example with nodemailer (uncomment and configure):
        /*
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
            // Configure your email service
        });
        
        transporter.sendMail({
            from: 'noreply@kiuma.kiu.ac.ug',
            to: email,
            subject: subject,
            text: message,
            html: `<p>${message.replace(/\n/g, '<br>')}</p>`
        }, (error, info) => {
            if (error) {
                return res.status(500).json({
                    success: false,
                    message: 'Error sending email'
                });
            }
            res.json({
                success: true,
                message: 'Email sent successfully'
            });
        });
        */
        
        res.json({
            success: true,
            message: 'Email notification prepared',
            // In production, remove this and use actual email sending
        });
    } catch (error) {
        console.error('Error sending email notification:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// POST /api/send-notifications - Send notifications to all users
app.post('/api/send-notifications', (req, res) => {
    try {
        const { subject, message } = req.body;

        if (!subject || !message) {
            return res.status(400).json({
                success: false,
                message: 'Subject and message are required'
            });
        }

        // Get all users from database
        db.all('SELECT id, email, whatsapp, firstName, lastName FROM users', async (err, rows) => {
            if (err) {
                console.error('Database error:', err.message);
                return res.status(500).json({
                    success: false,
                    message: 'Database error occurred'
                });
            }

            let successCount = 0;
            let failCount = 0;
            const results = [];

            // Send notifications to each user
            for (const user of rows) {
                try {
                    // Send WhatsApp if available
                    if (user.whatsapp) {
                        // Call WhatsApp API endpoint
                        // This would be handled by your WhatsApp service
                        successCount++;
                    }
                    
                    // Send Email if available
                    if (user.email) {
                        // Call Email API endpoint
                        // This would be handled by your email service
                        successCount++;
                    }
                    
                    results.push({
                        userId: user.id,
                        email: user.email,
                        whatsapp: user.whatsapp ? 'sent' : 'not available',
                        emailSent: user.email ? 'sent' : 'not available'
                    });
                } catch (userError) {
                    failCount++;
                    console.error(`Error sending notification to user ${user.id}:`, userError);
                }
            }

            res.json({
                success: true,
                message: `Notifications processed`,
                totalUsers: rows.length,
                successCount: successCount,
                failCount: failCount,
                results: results
            });
        });
    } catch (error) {
        console.error('Error sending notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// POST /api/push/register-token - Register or refresh an FCM device token
app.post('/api/push/register-token', (req, res) => {
    try {
        const { token, platform, packageName, userId } = req.body || {};

        if (!token || typeof token !== 'string' || token.trim().length < 20) {
            return res.status(400).json({
                success: false,
                message: 'Valid token is required'
            });
        }

        const safeToken = token.trim();
        const safePlatform = (platform || 'android').toString().trim().toLowerCase() || 'android';
        const safePackageName = packageName ? packageName.toString().trim() : null;
        const safeUserId = userId ? userId.toString().trim() : null;

        db.get('SELECT id FROM push_tokens WHERE token = ?', [safeToken], (selectErr, row) => {
            if (selectErr) {
                console.error('Error checking push token:', selectErr.message);
                return res.status(500).json({
                    success: false,
                    message: 'Database error occurred'
                });
            }

            if (row) {
                db.run(
                    `UPDATE push_tokens
                     SET platform = ?, packageName = ?, userId = ?, updatedAt = CURRENT_TIMESTAMP
                     WHERE token = ?`,
                    [safePlatform, safePackageName, safeUserId, safeToken],
                    (updateErr) => {
                        if (updateErr) {
                            console.error('Error updating push token:', updateErr.message);
                            return res.status(500).json({
                                success: false,
                                message: 'Failed to update push token'
                            });
                        }

                        return res.json({
                            success: true,
                            message: 'Push token updated',
                            action: 'updated'
                        });
                    }
                );
                return;
            }

            db.run(
                `INSERT INTO push_tokens (token, platform, packageName, userId)
                 VALUES (?, ?, ?, ?)`,
                [safeToken, safePlatform, safePackageName, safeUserId],
                function(insertErr) {
                    if (insertErr) {
                        console.error('Error inserting push token:', insertErr.message);
                        return res.status(500).json({
                            success: false,
                            message: 'Failed to register push token'
                        });
                    }

                    return res.status(201).json({
                        success: true,
                        message: 'Push token registered',
                        action: 'created',
                        id: this.lastID
                    });
                }
            );
        });
    } catch (error) {
        console.error('Error in /api/push/register-token:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// GET /api/push/tokens - Admin endpoint to inspect active push tokens
app.get('/api/push/tokens', (req, res) => {
    if (!isAdminRequest(req)) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const limitRaw = parseInt(req.query.limit, 10);
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(limitRaw, 500)) : 200;

    db.all(
        `SELECT id, token, platform, packageName, userId, createdAt, updatedAt
         FROM push_tokens
         ORDER BY updatedAt DESC
         LIMIT ?`,
        [limit],
        (err, rows) => {
            if (err) {
                console.error('Error listing push tokens:', err.message);
                return res.status(500).json({
                    success: false,
                    message: 'Database error occurred'
                });
            }

            return res.json({
                success: true,
                count: rows.length,
                tokens: rows
            });
        }
    );
});

// POST /api/push/send-broadcast - Send FCM push to registered devices and clean invalid tokens
app.post('/api/push/send-broadcast', async (req, res) => {
    if (!isAdminRequest(req)) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    if (!firebaseReady || admin.apps.length === 0) {
        return res.status(503).json({
            success: false,
            message: 'Firebase Admin is not configured. Set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_JSON.'
        });
    }

    const {
        title,
        body,
        targetPath,
        conversationTitle,
        threadId,
        senderName,
        userId
    } = req.body || {};

    if (!title || !body) {
        return res.status(400).json({
            success: false,
            message: 'title and body are required'
        });
    }

    const safeTargetPath = (targetPath || 'notifications.html').toString();
    const safeSenderName = (senderName || 'KIUMA').toString();
    const safeConversationTitle = conversationTitle ? conversationTitle.toString() : '';
    const safeThreadId = threadId ? threadId.toString() : '';
    const notificationId = Date.now().toString();

    const tokenSql = userId
        ? 'SELECT token FROM push_tokens WHERE userId = ?'
        : 'SELECT token FROM push_tokens';
    const tokenArgs = userId ? [String(userId)] : [];

    db.all(tokenSql, tokenArgs, async (err, rows) => {
        if (err) {
            console.error('Error loading tokens:', err.message);
            return res.status(500).json({
                success: false,
                message: 'Database error occurred'
            });
        }

        const tokens = rows.map(r => r.token).filter(Boolean);
        if (tokens.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No registered push tokens found'
            });
        }

        let successCount = 0;
        let failureCount = 0;
        const invalidTokens = [];
        const errors = [];

        try {
            const chunks = chunkArray(tokens, 500);
            for (const batch of chunks) {
                const response = await admin.messaging().sendEachForMulticast({
                    tokens: batch,
                    android: {
                        priority: 'high',
                        notification: {
                            channelId: 'notifications_channel',
                            sound: 'default'
                        }
                    },
                    data: {
                        title: String(title),
                        body: String(body),
                        target_path: safeTargetPath,
                        notification_id: notificationId,
                        sender_name: safeSenderName,
                        conversation_title: safeConversationTitle,
                        thread_id: safeThreadId
                    }
                });

                successCount += response.successCount;
                failureCount += response.failureCount;

                response.responses.forEach((result, index) => {
                    if (result.success) return;
                    const failedToken = batch[index];
                    const code = result.error?.code || 'unknown';
                    if (isInvalidPushTokenCode(code)) {
                        invalidTokens.push(failedToken);
                    } else {
                        errors.push({ token: failedToken, code });
                    }
                });
            }

            const uniqueInvalidTokens = Array.from(new Set(invalidTokens));
            removeInvalidTokens(uniqueInvalidTokens);

            return res.json({
                success: true,
                message: 'Push broadcast processed',
                totalTokens: tokens.length,
                successCount,
                failureCount,
                invalidTokensRemoved: uniqueInvalidTokens.length,
                errors
            });
        } catch (sendError) {
            console.error('Error sending FCM broadcast:', sendError);
            return res.status(500).json({
                success: false,
                message: 'Failed to send push broadcast',
                error: sendError.message
            });
        }
    });
});

// POST /api/push/send-test - Send push to a single token and clean it if invalid
app.post('/api/push/send-test', async (req, res) => {
    if (!isAdminRequest(req)) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    if (!firebaseReady || admin.apps.length === 0) {
        return res.status(503).json({
            success: false,
            message: 'Firebase Admin is not configured. Set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_JSON.'
        });
    }

    const {
        token,
        title,
        body,
        targetPath,
        conversationTitle,
        threadId,
        senderName
    } = req.body || {};

    if (!token || typeof token !== 'string' || token.trim().length < 20) {
        return res.status(400).json({
            success: false,
            message: 'Valid token is required'
        });
    }
    if (!title || !body) {
        return res.status(400).json({
            success: false,
            message: 'title and body are required'
        });
    }

    const safeToken = token.trim();
    const notificationId = Date.now().toString();
    const safeTargetPath = (targetPath || 'notifications.html').toString();
    const safeSenderName = (senderName || 'KIUMA').toString();
    const safeConversationTitle = conversationTitle ? conversationTitle.toString() : '';
    const safeThreadId = threadId ? threadId.toString() : '';

    try {
        await admin.messaging().send({
            token: safeToken,
            android: {
                priority: 'high',
                notification: {
                    channelId: 'notifications_channel',
                    sound: 'default'
                }
            },
            data: {
                title: String(title),
                body: String(body),
                target_path: safeTargetPath,
                notification_id: notificationId,
                sender_name: safeSenderName,
                conversation_title: safeConversationTitle,
                thread_id: safeThreadId
            }
        });

        return res.json({
            success: true,
            message: 'Test push sent',
            notificationId
        });
    } catch (error) {
        const code = error?.code || 'unknown';
        if (isInvalidPushTokenCode(code)) {
            removeInvalidTokens([safeToken]);
        }
        return res.status(500).json({
            success: false,
            message: 'Failed to send test push',
            error: code
        });
    }
});

// GET /users/:email - Get user by email (optional utility endpoint)
app.get('/users/:email', (req, res) => {
    const { email } = req.params;

    db.get('SELECT id, email, firstName, lastName, name, whatsapp, gender, createdAt FROM users WHERE email = ?', [email], (err, row) => {
        if (err) {
            console.error('Database error:', err.message);
            return res.status(500).json({
                success: false,
                message: 'Database error occurred'
            });
        }

        if (!row) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user: row
        });
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'KIUMA Server is running',
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`KIUMA Server is running on http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('Database connection closed');
        }
        process.exit(0);
    });
});

