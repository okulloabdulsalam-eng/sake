<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Join KIUMA - Recruitment Form</title>
    <link rel="stylesheet" href="../styles.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>
    <div class="container">
        <main class="main-content">
            <section class="page-header">
                <h2 class="page-title">Join KIUMA</h2>
            </section>

            <section class="page-content">
                <div class="info-card" style="margin-bottom: 20px;">
                    <h3><i class="fas fa-info-circle"></i> Join Our Community</h3>
                    <p>Fill out the form below to become a member of KIUMA. We'll review your application and get back to you soon.</p>
                </div>

                <form id="joinForm" class="form-container">
                    <div class="form-group">
                        <label class="form-label">Full Name *</label>
                        <input type="text" class="form-input" id="fullname" name="fullname" placeholder="Enter your full name" required>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Email *</label>
                        <input type="email" class="form-input" id="email" name="email" placeholder="Enter your email" required>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Phone Number *</label>
                        <input type="tel" class="form-input" id="phone" name="phone" placeholder="Enter your phone number" required>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Role/Position (Optional)</label>
                        <input type="text" class="form-input" id="role" name="role" placeholder="e.g., Student, Member, Volunteer">
                    </div>

                    <div id="formMessage" style="display: none; padding: 15px; margin: 20px 0; border-radius: 8px;"></div>

                    <button type="submit" class="btn btn-primary" id="submitBtn">
                        <i class="fas fa-user-plus"></i> Join Now
                    </button>
                </form>
            </section>
        </main>
    </div>

    <script>
        document.getElementById('joinForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = document.getElementById('submitBtn');
            const messageDiv = document.getElementById('formMessage');
            const formData = new FormData(this);
            
            // Disable submit button
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
            messageDiv.style.display = 'none';
            
            try {
                const response = await fetch('api/submit_recruit.php', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                
                if (data.success) {
                    messageDiv.style.display = 'block';
                    messageDiv.style.backgroundColor = '#E8F5E9';
                    messageDiv.style.color = '#2E7D32';
                    messageDiv.style.border = '1px solid #4CAF50';
                    messageDiv.innerHTML = '<i class="fas fa-check-circle"></i> ' + data.message;
                    
                    // Reset form
                    this.reset();
                    
                    // Redirect after 3 seconds
                    setTimeout(() => {
                        window.location.href = '../index.html';
                    }, 3000);
                } else {
                    messageDiv.style.display = 'block';
                    messageDiv.style.backgroundColor = '#FFEBEE';
                    messageDiv.style.color = '#C62828';
                    messageDiv.style.border = '1px solid #F44336';
                    messageDiv.innerHTML = '<i class="fas fa-exclamation-circle"></i> ' + (data.message || 'An error occurred. Please try again.');
                }
            } catch (error) {
                console.error('Error:', error);
                messageDiv.style.display = 'block';
                messageDiv.style.backgroundColor = '#FFEBEE';
                messageDiv.style.color = '#C62828';
                messageDiv.style.border = '1px solid #F44336';
                messageDiv.innerHTML = '<i class="fas fa-exclamation-circle"></i> Network error. Please check your connection and try again.';
            } finally {
                // Re-enable submit button
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> Join Now';
            }
        });
    </script>
</body>
</html>

