/**
 * Logger Utility
 * 
 * Simple logging utility for the application
 */

const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    NONE: 4
};

let currentLogLevel = LOG_LEVELS.INFO;

/**
 * Set log level
 * @param {string} level - Log level (debug, info, warn, error, none)
 */
function setLogLevel(level) {
    const levelMap = {
        'debug': LOG_LEVELS.DEBUG,
        'info': LOG_LEVELS.INFO,
        'warn': LOG_LEVELS.WARN,
        'error': LOG_LEVELS.ERROR,
        'none': LOG_LEVELS.NONE
    };
    
    currentLogLevel = levelMap[level.toLowerCase()] || LOG_LEVELS.INFO;
}

/**
 * Log debug message
 */
function debug(message, ...args) {
    if (currentLogLevel <= LOG_LEVELS.DEBUG) {
        console.debug('[DEBUG]', message, ...args);
    }
}

/**
 * Log info message
 */
function info(message, ...args) {
    if (currentLogLevel <= LOG_LEVELS.INFO) {
        console.info('[INFO]', message, ...args);
    }
}

/**
 * Log warning message
 */
function warn(message, ...args) {
    if (currentLogLevel <= LOG_LEVELS.WARN) {
        console.warn('[WARN]', message, ...args);
    }
}

/**
 * Log error message
 */
function error(message, ...args) {
    if (currentLogLevel <= LOG_LEVELS.ERROR) {
        console.error('[ERROR]', message, ...args);
    }
}

/**
 * Unified log function
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {...any} args - Additional arguments
 */
function log(level, message, ...args) {
    switch (level.toLowerCase()) {
        case 'debug':
            debug(message, ...args);
            break;
        case 'info':
            info(message, ...args);
            break;
        case 'warn':
            warn(message, ...args);
            break;
        case 'error':
            error(message, ...args);
            break;
        default:
            info(message, ...args);
    }
}

// ES6 export
export { debug, info, warn, error, log, setLogLevel, LOG_LEVELS };

// Also export for window/CommonJS compatibility
if (typeof window !== 'undefined') {
    window.logger = {
        debug,
        info,
        warn,
        error,
        log,
        setLogLevel
    };
    // Also export as log for convenience
    window.log = log;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        debug,
        info,
        warn,
        error,
        log,
        setLogLevel,
        LOG_LEVELS
    };
}

