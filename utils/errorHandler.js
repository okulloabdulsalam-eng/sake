/**
 * Error Handler Utilities
 * 
 * Centralized error handling and user-friendly error messages
 */

/**
 * Handle and format errors for user display
 * @param {Error} error - Error object
 * @param {string} defaultMessage - Default message if error can't be parsed
 * @returns {Error} Formatted error
 */
function handleError(error, defaultMessage = 'An error occurred') {
    // If already a formatted error, return it
    if (error instanceof Error && error.userMessage) {
        return error;
    }

    // Create new error with user-friendly message
    const userError = new Error(defaultMessage);
    userError.originalError = error;
    userError.userMessage = defaultMessage;
    userError.code = error.code || error.name || 'UNKNOWN_ERROR';

    // Map common error codes to user-friendly messages
    const errorMessages = {
        'PGRST116': 'Item not found',
        'PGRST301': 'Duplicate entry',
        '23505': 'Duplicate entry',
        '23503': 'Referenced item does not exist',
        '42501': 'Permission denied',
        'NetworkError': 'Network error. Please check your connection.',
        'TimeoutError': 'Request timed out. Please try again.',
        'QuotaExceededError': 'Storage quota exceeded. Please free up space.',
    };

    // Check if we have a specific message for this error
    if (error.code && errorMessages[error.code]) {
        userError.userMessage = errorMessages[error.code];
    } else if (error.message && error.message.includes('timeout')) {
        userError.userMessage = 'Request timed out. Please try again.';
    } else if (error.message && error.message.includes('network')) {
        userError.userMessage = 'Network error. Please check your connection.';
    }

    return userError;
}

/**
 * Show error to user (alert or console)
 * @param {Error} error - Error to display
 * @param {boolean} showAlert - Whether to show alert dialog
 */
function showError(error, showAlert = true) {
    const message = error.userMessage || error.message || 'An error occurred';
    
    if (showAlert && typeof window !== 'undefined') {
        alert(message);
    }
    
    console.error('Error:', message, error.originalError || error);
}

// ES6 export
export { handleError, showError };

// Also export for window/CommonJS compatibility
if (typeof window !== 'undefined') {
    window.handleError = handleError;
    window.showError = showError;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        handleError,
        showError
    };
}

