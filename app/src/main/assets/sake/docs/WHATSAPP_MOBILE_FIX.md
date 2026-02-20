# WhatsApp Links Mobile Fix

## Problem
WhatsApp links using `window.open(whatsappLink, '_blank')` don't work on mobile phones because:
- Mobile browsers block popups
- `window.open()` requires user interaction but may be blocked
- Mobile browsers prefer direct navigation

## Solution
Create a helper function that:
1. Detects mobile devices
2. Uses `window.location.href` on mobile (direct navigation)
3. Uses `window.open()` on desktop (opens in new tab)
4. Falls back to creating a temporary anchor element if needed

## Implementation
Add this helper function to `script.js` or create a new `whatsapp-helper.js`:

```javascript
// Helper function to open WhatsApp links (mobile-friendly)
function openWhatsApp(phoneNumber, message = '') {
    // Clean phone number (remove spaces, dashes, etc.)
    const cleanNumber = phoneNumber.replace(/[^\d]/g, '');
    
    // Build WhatsApp URL
    let whatsappUrl = `https://wa.me/${cleanNumber}`;
    if (message) {
        const encodedMessage = encodeURIComponent(message);
        whatsappUrl += `?text=${encodedMessage}`;
    }
    
    // Detect mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                     (window.innerWidth <= 768);
    
    if (isMobile) {
        // On mobile, use direct navigation (works better)
        window.location.href = whatsappUrl;
    } else {
        // On desktop, try window.open first
        const newWindow = window.open(whatsappUrl, '_blank');
        
        // If blocked, fall back to direct navigation
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
            // Popup blocked, use direct navigation
            window.location.href = whatsappUrl;
        }
    }
}
```

## Files to Update
1. `pay.html` - Replace `window.open(whatsappLink, '_blank')` with `openWhatsApp()`
2. `ask-question.html` - Replace `window.open(whatsappUrl, '_blank')` with `openWhatsApp()`
3. All other files with WhatsApp links

