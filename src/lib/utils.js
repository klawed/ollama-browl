// Utility functions shared across the extension

class OllamaUtils {
  // Generate a unique ID for tracking requests
  static generateId() {
    return 'ollama_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Validate CSS selector
  static isValidSelector(selector) {
    try {
      document.querySelector(selector);
      return true;
    } catch (e) {
      return false;
    }
  }

  // Wait for element to be available
  static waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver((mutations, obs) => {
        const element = document.querySelector(selector);
        if (element) {
          obs.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element not found within ${timeout}ms: ${selector}`));
      }, timeout);
    });
  }

  // Safely execute function with error handling
  static async safeExecute(fn, fallback = null) {
    try {
      return await fn();
    } catch (error) {
      console.error('Safe execute error:', error);
      return fallback;
    }
  }

  // Debounce function
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Format error message for user display
  static formatError(error) {
    if (typeof error === 'string') {
      return error;
    }
    return error.message || 'An unknown error occurred';
  }

  // Check if URL matches pattern
  static urlMatches(url, pattern) {
    if (!pattern) return false;
    if (typeof pattern === 'string') {
      return url.includes(pattern);
    }
    if (pattern instanceof RegExp) {
      return pattern.test(url);
    }
    return false;
  }

  // Log with timestamp
  static log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    switch (level) {
      case 'error':
        console.error(logMessage, data);
        break;
      case 'warn':
        console.warn(logMessage, data);
        break;
      case 'info':
        console.info(logMessage, data);
        break;
      default:
        console.log(logMessage, data);
    }
  }
}

// Export for both CommonJS and ES modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OllamaUtils;
} else if (typeof window !== 'undefined') {
  window.OllamaUtils = OllamaUtils;
}
