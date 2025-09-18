const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Get public key from environment variable
const FASTEN_PUBLIC_KEY = process.env.FASTEN_PUBLIC_KEY || 'public_test_84adydvuspk28kawj499s3f4bmemmcwf1ad54wtagihn0';

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.fastenhealth.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.fastenhealth.com"],
      connectSrc: ["'self'", "https://api.connect.fastenhealth.com", "https://*.fastenhealth.com"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https:", "data:"],
      frameSrc: ["'self'", "https://*.fastenhealth.com"],
      workerSrc: ["'self'", "blob:"],
      childSrc: ["'self'", "blob:"]
    }
  }
}));

app.use(cors({
  origin: ['capacitor://localhost', 'ionic://localhost', 'http://localhost', 'http://localhost:*', 'https://localhost', 'https://localhost:*'],
  credentials: true
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'fasten-stitch-page',
    publicKey: FASTEN_PUBLIC_KEY ? 'configured' : 'not configured'
  });
});

// Main Fasten Connect page
app.get('/fasten/connect', (req, res) => {
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Fasten Connect</title>
    <link href="https://cdn.fastenhealth.com/connect/v3/fasten-stitch-element.css" rel="stylesheet">
    <script src="https://cdn.fastenhealth.com/connect/v3/fasten-stitch-element.js" type="module"></script>
    <style>
      body {
        margin: 0;
        padding: 20px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background-color: #f5f5f7;
      }
      
      .container {
        max-width: 800px;
        margin: 0 auto;
        background: white;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
      }
      
      h1 {
        color: #1d1d1f;
        text-align: center;
        margin-bottom: 30px;
        font-size: 28px;
        font-weight: 600;
      }
      
      .info {
        background: #f0f9ff;
        border: 1px solid #0ea5e9;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 20px;
        font-size: 14px;
        color: #0369a1;
      }
      
      .debug-info {
        background: #f3f4f6;
        border-radius: 8px;
        padding: 12px;
        margin-top: 20px;
        font-family: monospace;
        font-size: 12px;
        color: #6b7280;
      }
      
      fasten-stitch-element {
        display: block;
        width: 100%;
        min-height: 400px;
      }
      
      .status {
        margin-top: 20px;
        padding: 12px;
        background: #f9fafb;
        border-radius: 8px;
        border-left: 4px solid #10b981;
      }
      
      .status h3 {
        margin: 0 0 8px 0;
        color: #065f46;
        font-size: 16px;
      }
      
      .status p {
        margin: 0;
        color: #047857;
        font-size: 14px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Connect Your Health Records</h1>
      
      <div class="info">
        <strong>Atlas Care</strong> uses Fasten Connect to securely retrieve your medical records from healthcare providers.
        Select your healthcare provider below to get started.
      </div>
      
      <fasten-stitch-element public-id="${FASTEN_PUBLIC_KEY}">
        Connect My Health Records
      </fasten-stitch-element>
      
      <div class="status" id="status" style="display: none;">
        <h3>Connection Status</h3>
        <p id="status-message">Initializing...</p>
      </div>
      
      <div class="debug-info">
        <strong>Debug Info:</strong><br>
        Public Key: ${FASTEN_PUBLIC_KEY}<br>
        Timestamp: ${new Date().toISOString()}<br>
        Environment: ${process.env.NODE_ENV || 'development'}
      </div>
    </div>

    <script>
      const el = document.querySelector('fasten-stitch-element');
      const statusDiv = document.getElementById('status');
      const statusMessage = document.getElementById('status-message');
      
      function updateStatus(message, type = 'info') {
        statusDiv.style.display = 'block';
        statusMessage.textContent = message;
        console.log('Fasten Connect Status:', message);
      }
      
      function postMessageToiOS(data) {
        // Post message to iOS WebView
        if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.fastenConnect) {
          window.webkit.messageHandlers.fastenConnect.postMessage(data);
        }
        
        // Also post to parent window (for testing)
        if (window.parent !== window) {
          window.parent.postMessage(data, '*');
        }
      }
      
      el.addEventListener('eventBus', (event) => {
        try {
          // Log the raw event detail (as per documentation)
          console.log('Fasten Stitch Event:', event.detail);
          
          // The event.detail should contain the full event object
          const eventData = event.detail;
          
          // Update status based on event type
          switch(eventData.event_type) {
            case 'patient.connection_pending':
              updateStatus('Connection in progress...', 'info');
              break;
            case 'patient.connection_success':
              updateStatus('Successfully connected to healthcare provider!', 'success');
              break;
            case 'patient.connection_failed':
              updateStatus('Connection failed. Please try again.', 'error');
              break;
            case 'widget.complete':
              updateStatus('Widget completed successfully!', 'success');
              break;
            case 'search.query':
              updateStatus(\`Search query: \${eventData.data?.query || 'N/A'}\`, 'info');
              break;
            default:
              updateStatus(\`Event received: \${eventData.event_type}\`, 'info');
          }
          
          // Send event data to iOS app
          postMessageToiOS({
            type: 'fastenEvent',
            data: eventData,
            timestamp: new Date().toISOString()
          });
          
        } catch (error) {
          console.error('Error processing Fasten event:', error);
          updateStatus('Error processing connection event', 'error');
        }
      });
      
      // Initialize
      updateStatus('Ready to connect to healthcare provider');
      
      // Let iOS know the page is ready
      postMessageToiOS({
        type: 'pageReady',
        timestamp: new Date().toISOString()
      });
    </script>
  </body>
</html>`;

  res.send(html);
});

// Alternative endpoint for testing
app.get('/connect', (req, res) => {
  res.redirect('/fasten/connect');
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Fasten Stitch Page',
    endpoints: {
      connect: '/fasten/connect',
      health: '/health'
    },
    publicKey: FASTEN_PUBLIC_KEY ? 'configured' : 'not configured',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    path: req.path,
    availableEndpoints: ['/fasten/connect', '/health', '/'],
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Fasten Stitch Page Service running on port ${PORT}`);
  console.log(`📱 iOS Connect URL: /fasten/connect`);
  console.log(`🔑 Public Key: ${FASTEN_PUBLIC_KEY}`);
  console.log(`🔍 Health check: /health`);
  console.log(`⏰ Started at: ${new Date().toISOString()}\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});
