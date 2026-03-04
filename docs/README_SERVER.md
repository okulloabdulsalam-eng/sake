# KIUMA Server - Authentication API

Node.js Express server for handling user authentication for the KIUMA website.

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Server

```bash
# Production mode
npm start

# Development mode (with auto-restart)
npm run dev
```

The server will start on `http://localhost:3000` by default.

## API Endpoints

### POST /register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "gender": "male"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Account created successfully!",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "name": "John Doe",
    "gender": "male"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "This email is already registered. Please login instead."
}
```

### POST /login
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Login successful!",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "name": "John Doe",
    "gender": "male",
    "createdAt": "2024-01-01 12:00:00"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Invalid email or password. Please try again."
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "success": true,
  "message": "KIUMA Server is running",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Database

The server uses SQLite database (`kiuma_users.db`) which is automatically created on first run.

**Users Table Schema:**
- `id` - INTEGER PRIMARY KEY
- `email` - TEXT UNIQUE NOT NULL
- `password` - TEXT NOT NULL (bcrypt hashed)
- `firstName` - TEXT
- `lastName` - TEXT
- `name` - TEXT
- `gender` - TEXT
- `createdAt` - DATETIME
- `updatedAt` - DATETIME

## Security Features

- Passwords are hashed using bcrypt (10 salt rounds)
- Passwords are never returned in API responses
- Email validation
- Password length validation (minimum 6 characters)
- SQL injection protection through parameterized queries

## Frontend Integration

To integrate with the existing frontend, update the `handleSignup` and `handleLogin` functions in `script.js` to make API calls to this server instead of using localStorage.

Example:
```javascript
// In handleSignup function
const response = await fetch('http://localhost:3000/register', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        email: email,
        password: password,
        firstName: firstName,
        lastName: lastName,
        gender: gender
    })
});

const data = await response.json();
if (data.success) {
    // Handle successful registration
}
```

