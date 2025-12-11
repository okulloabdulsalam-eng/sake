// Frontend Integration Code for script.js
// Replace the existing handleSignup and handleLogin functions with these API-based versions

// Configuration
const API_BASE_URL = 'http://localhost:3000'; // Change to your server URL in production

// Updated handleSignup function - Replace the existing one in script.js
window.handleSignup = async function(e) {
    e.preventDefault();
    
    const firstName = document.getElementById('signupFirstName').value.trim();
    const lastName = document.getElementById('signupLastName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const whatsapp = document.getElementById('signupWhatsApp').value.trim();
    const password = document.getElementById('signupPassword').value;
    const gender = document.getElementById('signupGender').value;

    if (!firstName || !lastName || !email || !whatsapp || !password || !gender) {
        alert('Please fill in all fields.');
        return;
    }

    if (password.length < 6) {
        alert('Password must be at least 6 characters long.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                password: password,
                firstName: firstName,
                lastName: lastName,
                whatsapp: whatsapp,
                gender: gender
            })
        });

        const data = await response.json();

        if (data.success) {
            // Store user data in localStorage for frontend use
            const userData = {
                id: data.user.id,
                firstName: data.user.firstName,
                lastName: data.user.lastName,
                name: data.user.name,
                email: data.user.email,
                whatsapp: data.user.whatsapp,
                gender: data.user.gender,
                createdAt: data.user.createdAt
            };

            currentUser = userData;
            localStorage.setItem('userData', JSON.stringify(userData));
            
            updateUserDisplay();
            window.closeAccountModal();
            
            // Show success modal with WhatsApp join option
            if (typeof showRegistrationSuccessModal === 'function') {
                showRegistrationSuccessModal(firstName, whatsapp);
            } else {
                alert('Account created successfully! Welcome, ' + firstName + '!\n\nTo receive WhatsApp notifications, join our WhatsApp sandbox by sending "join planning-job" to +14155238886');
            }
            
            document.getElementById('signupFormElement')?.reset();
        } else {
            alert(data.message || 'Registration failed. Please try again.');
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert('Error connecting to server. Please check your connection and try again.');
    }
};

// Updated handleLogin function - Replace the existing one in script.js
window.handleLogin = async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        alert('Please enter email and password.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        const data = await response.json();

        if (data.success) {
            // Store user data in localStorage for frontend use
            const userData = {
                id: data.user.id,
                firstName: data.user.firstName,
                lastName: data.user.lastName,
                name: data.user.name,
                email: data.user.email,
                whatsapp: data.user.whatsapp,
                gender: data.user.gender,
                createdAt: data.user.createdAt
            };

            currentUser = userData;
            localStorage.setItem('userData', JSON.stringify(userData));
            
            updateUserDisplay();
            window.closeAccountModal();
            alert('Welcome back, ' + (data.user.firstName || data.user.name || 'User') + '!');
        } else {
            alert(data.message || 'Invalid email or password. Please try again.');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Error connecting to server. Please check your connection and try again.');
    }
};

// Optional: Function to check server connection
async function checkServerConnection() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        const data = await response.json();
        if (data.success) {
            console.log('Server is connected');
            return true;
        }
    } catch (error) {
        console.warn('Server is not available, falling back to localStorage:', error);
        return false;
    }
}

// Check server on page load
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', function() {
        checkServerConnection();
    });
}

