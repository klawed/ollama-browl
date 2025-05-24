// Background script for Ollama Browser Tool
// Handles WebSocket connection to bridge server and tab management

class OllamaBrowserBackground {
  constructor() {
    this.websocket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 2000;
    this.bridgeUrl = 'ws://localhost:6790'; // WebSocket port
    
    this.init();
  }

  init() {
    console.log('Ollama Browser Tool - Background script initialized');
    this.connectToBridge();
    this.setupMessageHandlers();
  }

  connectToBridge() {
    try {
      console.log('Connecting to bridge server...');
      this.websocket = new WebSocket(this.bridgeUrl);
      
      this.websocket.onopen = () => {
        console.log('Connected to bridge server');
        this.isConnected = true;
        this.reconnectAttempts = 0;
      };

      this.websocket.onmessage = (event) => {
        this.handleBridgeMessage(event.data);
      };

      this.websocket.onclose = () => {
        console.log('Disconnected from bridge server');
        this.isConnected = false;
        this.scheduleReconnect();
      };

      this.websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to connect to bridge:', error);
      this.scheduleReconnect();
    }
  }

  scheduleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting in ${this.reconnectDelay}ms (attempt ${this.reconnectAttempts})`);
      setTimeout(() => this.connectToBridge(), this.reconnectDelay);
      this.reconnectDelay *= 1.5; // Exponential backoff
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  async handleBridgeMessage(data) {
    try {
      const message = JSON.parse(data);
      console.log('Received command from bridge:', message);

      const result = await this.executeCommand(message);
      this.sendToBridge(result);
    } catch (error) {
      console.error('Error handling bridge message:', error);
      this.sendToBridge({
        id: message.id,
        success: false,
        error: error.message
      });
    }
  }

  async executeCommand(command) {
    const { id, action, selector, value, url } = command;

    try {
      // Find the appropriate tab
      const tab = await this.findTargetTab(url);
      if (!tab) {
        return {
          id,
          success: false,
          error: 'No suitable tab found'
        };
      }

      // Send command to content script
      const result = await this.sendToContentScript(tab.id, {
        action,
        selector,
        value
      });

      return {
        id,
        success: result.success,
        data: result.data,
        error: result.error
      };
    } catch (error) {
      return {
        id,
        success: false,
        error: error.message
      };
    }
  }

  async findTargetTab(targetUrl) {
    const tabs = await chrome.tabs.query({});
    
    if (targetUrl) {
      // Find tab matching the target URL
      const matchingTab = tabs.find(tab => 
        tab.url && tab.url.includes(targetUrl)
      );
      if (matchingTab) return matchingTab;
    }

    // Fall back to active tab
    const activeTabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return activeTabs[0] || null;
  }

  async sendToContentScript(tabId, message) {
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tabId, message, (response) => {
        if (chrome.runtime.lastError) {
          resolve({
            success: false,
            error: chrome.runtime.lastError.message
          });
        } else {
          resolve(response || { success: false, error: 'No response from content script' });
        }
      });
    });
  }

  sendToBridge(message) {
    if (this.websocket && this.isConnected) {
      try {
        this.websocket.send(JSON.stringify(message));
      } catch (error) {
        console.error('Failed to send message to bridge:', error);
      }
    }
  }

  setupMessageHandlers() {
    // Handle extension popup messages
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'getStatus') {
        sendResponse({
          connected: this.isConnected,
          bridgeUrl: this.bridgeUrl
        });
      }
      return true;
    });
  }
}

// Initialize background script
const ollamaBg = new OllamaBrowserBackground();
