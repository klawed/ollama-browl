const express = require('express');
const WebSocket = require('ws');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

class BridgeServer {
  constructor(port = 6789) {
    this.port = port;
    this.app = express();
    this.pendingRequests = new Map();
    this.extensionSocket = null;
    
    this.setupExpress();
    this.setupWebSocket();
  }

  setupExpress() {
    this.app.use(cors());
    this.app.use(express.json());

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        extensionConnected: this.extensionSocket !== null,
        timestamp: new Date().toISOString()
      });
    });

    // Main execution endpoint
    this.app.post('/execute', async (req, res) => {
      try {
        const result = await this.executeCommand(req.body);
        res.json(result);
      } catch (error) {
        console.error('Execute error:', error);
        res.status(500).json({ 
          success: false, 
          error: error.message 
        });
      }
    });

    // Status endpoint
    this.app.get('/status', (req, res) => {
      res.json({
        server: 'running',
        extensionConnected: this.extensionSocket !== null,
        pendingRequests: this.pendingRequests.size,
        uptime: process.uptime()
      });
    });
  }

  setupWebSocket() {
    this.wss = new WebSocket.Server({ port: this.port + 1 });
    
    this.wss.on('connection', (ws) => {
      console.log('Extension connected via WebSocket');
      this.extensionSocket = ws;

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleExtensionMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        console.log('Extension disconnected');
        this.extensionSocket = null;
        // Reject all pending requests
        this.pendingRequests.forEach((resolve, id) => {
          resolve({ success: false, error: 'Extension disconnected' });
        });
        this.pendingRequests.clear();
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });
  }

  async executeCommand(command) {
    return new Promise((resolve, reject) => {
      if (!this.extensionSocket) {
        resolve({ success: false, error: 'Extension not connected' });
        return;
      }

      const id = uuidv4();
      const message = {
        id,
        ...command
      };

      // Store the resolver
      this.pendingRequests.set(id, resolve);

      // Set timeout
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          resolve({ success: false, error: 'Request timeout' });
        }
      }, 30000); // 30 second timeout

      // Send to extension
      try {
        this.extensionSocket.send(JSON.stringify(message));
      } catch (error) {
        this.pendingRequests.delete(id);
        resolve({ success: false, error: 'Failed to send to extension' });
      }
    });
  }

  handleExtensionMessage(message) {
    const { id } = message;
    if (this.pendingRequests.has(id)) {
      const resolve = this.pendingRequests.get(id);
      this.pendingRequests.delete(id);
      resolve(message);
    }
  }

  start() {
    this.server = this.app.listen(this.port, () => {
      console.log(`Bridge server listening on port ${this.port}`);
      console.log(`WebSocket server listening on port ${this.port + 1}`);
      console.log(`Health check: http://localhost:${this.port}/health`);
    });
  }

  stop() {
    if (this.server) {
      this.server.close();
    }
    if (this.wss) {
      this.wss.close();
    }
  }
}

// Add uuid function for older Node versions
if (!require('crypto').randomUUID) {
  const { v4: uuidv4 } = { v4: () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }};
} else {
  const { v4: uuidv4 } = { v4: require('crypto').randomUUID };
}

// Start server if run directly
if (require.main === module) {
  const server = new BridgeServer();
  server.start();

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nShutting down bridge server...');
    server.stop();
    process.exit(0);
  });
}

module.exports = BridgeServer;
