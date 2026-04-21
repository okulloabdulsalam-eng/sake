/**
 * API Configuration
 * Set your backend API URL here
 * 
 * For GitHub Pages: Use a separate PHP hosting service
 * Examples:
 * - Free PHP hosting: 000webhost, InfinityFree, etc.
 * - VPS/Cloud: DigitalOcean, AWS, etc.
 * - Backend-as-a-Service: Railway, Render, Heroku, etc.
 * 
 * IMPORTANT: Update the API_BASE_URL below to point to your PHP backend server
 */

// API Base URL - Update this to point to your PHP backend
// For local testing: 'http://localhost/api'
// For production: 'https://your-backend-domain.com/api'
// For same domain: '/api' (relative path)
var API_BASE_URL = '/api'; // Default to relative path

// If you're using a separate backend server, uncomment and update:
// var API_BASE_URL = 'https://your-backend-domain.com/api';

// Note: The PHP files already include CORS headers for cross-origin requests

