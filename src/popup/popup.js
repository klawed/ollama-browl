// Popup script for Ollama Browser Tool

class OllamaPopup {
  constructor() {
    this.init();
  }

  async init() {
    await this.updateStatus();
    this.setupEventListeners();
    
    // Update status every 2 seconds
    setInterval(() => this.updateStatus(), 2000);
  }

  async updateStatus() {
    try {
      const response = await this.sendMessageToBackground({ type: 'getStatus' });
      this.displayStatus(response.connected, response.bridgeUrl);
    } catch (error) {
      console.error('Failed to get status:', error);
      this.displayStatus(false, 'ws://localhost:6790');
    }
  }

  displayStatus(connected, bridgeUrl) {
    const statusElement = document.getElementById('status');
    const statusText = document.getElementById('status-text');
    const bridgeUrlElement = document.getElementById('bridge-url');

    if (connected) {
      statusElement.className = 'status connected';
      statusText.textContent = 'Connected to bridge server';
    } else {
      statusElement.className = 'status disconnected';
      statusText.textContent = 'Bridge server disconnected';
    }

    bridgeUrlElement.textContent = bridgeUrl;
  }

  setupEventListeners() {
    // Reconnect button
    document.getElementById('reconnect-btn').addEventListener('click', () => {
      this.reconnect();
    });

    // Test connection button
    document.getElementById('test-btn').addEventListener('click', () => {
      this.testConnection();
    });
  }

  async reconnect() {
    try {
      await this.sendMessageToBackground({ type: 'reconnect' });
      setTimeout(() => this.updateStatus(), 1000);
    } catch (error) {
      console.error('Reconnect failed:', error);
    }
  }

  async testConnection() {
    const button = document.getElementById('test-btn');
    const originalText = button.textContent;
    
    button.textContent = 'Testing...';
    button.disabled = true;

    try {
      const response = await fetch('http://localhost:6789/health');
      const data = await response.json();
      
      if (data.status === 'ok') {
        button.textContent = 'Test Passed ✓';
        setTimeout(() => {
          button.textContent = originalText;
          button.disabled = false;
        }, 2000);
      } else {
        throw new Error('Health check failed');
      }
    } catch (error) {
      console.error('Test failed:', error);
      button.textContent = 'Test Failed ✗';
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
      }, 2000);
    }
  }

  sendMessageToBackground(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new OllamaPopup();
});
