// Content script for Ollama Browser Tool
// Handles DOM manipulation within web pages

class OllamaContentScript {
  constructor() {
    this.init();
  }

  init() {
    console.log('Ollama Browser Tool - Content script loaded');
    this.setupMessageHandler();
  }

  setupMessageHandler() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message)
        .then(response => sendResponse(response))
        .catch(error => {
          console.error('Content script error:', error);
          sendResponse({
            success: false,
            error: error.message
          });
        });
      
      return true; // Keep message channel open for async response
    });
  }

  async handleMessage(message) {
    const { action, selector, value } = message;

    try {
      switch (action) {
        case 'read':
          return await this.readElement(selector);
        case 'write':
          return await this.writeElement(selector, value);
        case 'click':
          return await this.clickElement(selector);
        default:
          throw new Error(`Unknown action: ${action}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async readElement(selector) {
    const element = this.findElement(selector);
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }

    let data;
    if (element.tagName.toLowerCase() === 'input' || element.tagName.toLowerCase() === 'textarea') {
      data = element.value;
    } else {
      data = element.innerText || element.textContent;
    }

    return {
      success: true,
      data: data,
      elementType: element.tagName.toLowerCase()
    };
  }

  async writeElement(selector, value) {
    const element = this.findElement(selector);
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }

    const tagName = element.tagName.toLowerCase();
    
    if (tagName === 'input' || tagName === 'textarea') {
      // Clear existing value and set new one
      element.value = '';
      element.focus();
      
      // Simulate typing for better compatibility
      await this.simulateTyping(element, value);
      
      // Trigger events
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      // For other elements, set text content
      element.textContent = value;
    }

    return {
      success: true,
      data: `Written to ${tagName}: ${value.substring(0, 50)}${value.length > 50 ? '...' : ''}`
    };
  }

  async clickElement(selector) {
    const element = this.findElement(selector);
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }

    // Scroll element into view
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Wait a bit for scroll to complete
    await this.sleep(100);

    // Ensure element is clickable
    if (element.disabled) {
      throw new Error('Element is disabled');
    }

    // Click the element
    element.click();

    return {
      success: true,
      data: `Clicked ${element.tagName.toLowerCase()}${element.id ? ' #' + element.id : ''}${element.className ? ' .' + element.className.split(' ')[0] : ''}`
    };
  }

  findElement(selector) {
    try {
      return document.querySelector(selector);
    } catch (error) {
      throw new Error(`Invalid selector: ${selector}`);
    }
  }

  async simulateTyping(element, text) {
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      element.value += char;
      
      // Trigger input event for each character
      element.dispatchEvent(new InputEvent('input', {
        bubbles: true,
        data: char,
        inputType: 'insertText'
      }));
      
      // Small delay to simulate human typing
      if (i % 10 === 0) {
        await this.sleep(10);
      }
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Helper method to get element info for debugging
  getElementInfo(element) {
    return {
      tagName: element.tagName,
      id: element.id,
      className: element.className,
      textContent: element.textContent?.substring(0, 100),
      value: element.value?.substring(0, 100)
    };
  }
}

// Initialize content script
const ollamaCS = new OllamaContentScript();
