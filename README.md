# Fasten Connect Stitch Page

A hosted page service for integrating Fasten Connect with iOS apps. This service hosts the Fasten Stitch element that your iOS app can load in a WebView to enable healthcare provider connections.

## Overview

This service provides:
- **Fasten Stitch Integration**: Hosts the Fasten Connect widget (Stitch v3)
- **iOS WebView Support**: Optimized for iOS WebView integration with message passing
- **Event Handling**: Captures and forwards Fasten Connect events to your iOS app
- **Security**: Proper CSP headers and CORS configuration for iOS apps

## Endpoints

- `GET /fasten/connect` - Main Fasten Connect page with Stitch element
- `GET /connect` - Redirect to `/fasten/connect`
- `GET /health` - Health check endpoint
- `GET /` - Service information

## Environment Variables

- `FASTEN_PUBLIC_KEY` - Your Fasten Connect public key (required)
  - Format: `public_test_xxxx` for test mode
  - Format: `public_live_xxxx` for production mode
- `PORT` - Port to run the service on (default: 8080)
- `NODE_ENV` - Environment (development, production)

## iOS Integration

### 1. Configure Your iOS App

Add to your `Info.plist`:
```xml
<key>FASTEN_WIDGET_URL</key>
<string>https://your-service.onrender.com/fasten/connect</string>
```

Or via `.xcconfig` files:
```
// Debug.xcconfig
FASTEN_WIDGET_URL = https://your-service.onrender.com/fasten/connect

// Release.xcconfig  
FASTEN_WIDGET_URL = https://your-service.onrender.com/fasten/connect
```

### 2. WebView Integration

```swift
import WebKit

class FastenConnectViewController: UIViewController, WKScriptMessageHandler {
    private var webView: WKWebView!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupWebView()
        loadFastenConnect()
    }
    
    private func setupWebView() {
        let config = WKWebViewConfiguration()
        config.userContentController.add(self, name: "fastenConnect")
        
        webView = WKWebView(frame: view.bounds, configuration: config)
        webView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.addSubview(webView)
    }
    
    private func loadFastenConnect() {
        guard let urlString = Bundle.main.object(forInfoDictionaryKey: "FASTEN_WIDGET_URL") as? String,
              let url = URL(string: urlString) else {
            print("FASTEN_WIDGET_URL not configured")
            return
        }
        
        let request = URLRequest(url: url)
        webView.load(request)
    }
    
    // Handle messages from the web page
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == "fastenConnect",
              let messageBody = message.body as? [String: Any] else { return }
        
        print("Fasten Connect Event: \\(messageBody)")
        
        // Handle different event types
        if let eventType = messageBody["type"] as? String {
            switch eventType {
            case "pageReady":
                print("Fasten Connect page is ready")
            case "fastenEvent":
                if let data = messageBody["data"] as? [String: Any] {
                    handleFastenEvent(data)
                }
            default:
                print("Unknown event type: \\(eventType)")
            }
        }
    }
    
    private func handleFastenEvent(_ eventData: [String: Any]) {
        // Handle Fasten Connect events (connection success, data export, etc.)
        print("Fasten Event Data: \\(eventData)")
        
        // Example: Handle successful connection
        if let type = eventData["type"] as? String,
           type == "patient.connection_success" {
            // Update UI, save connection info, etc.
        }
    }
}
```

## Event Types

The service handles and forwards these Fasten Connect events:

- `patient.connection_success` - Patient successfully connected to healthcare provider
- `patient.connection_failed` - Connection attempt failed
- `patient.ehi_export_success` - Medical records retrieved successfully
- `patient.ehi_export_failed` - Failed to retrieve medical records
- `patient.authorization_revoked` - Patient authorization was revoked

## Security Features

- **Content Security Policy**: Restricts resource loading to trusted domains
- **CORS Configuration**: Allows iOS WebView origins
- **Input Validation**: Sanitizes and validates all inputs
- **Environment Isolation**: Separate configurations for test/production

## Development

```bash
# Install dependencies
npm install

# Set your Fasten public key
export FASTEN_PUBLIC_KEY=public_test_your_key_here

# Start the service
npm start
```

## Production Deployment

1. Deploy to Render with your Fasten public key as an environment variable
2. Configure your iOS app with the deployed URL
3. Test the integration with Fasten's test mode
4. Switch to production keys when ready

## Monitoring

- Check `/health` endpoint for service status
- Monitor logs for Fasten Connect events
- Verify public key configuration in health response

## Troubleshooting

### Common Issues

1. **"Public key not configured"**: Set `FASTEN_PUBLIC_KEY` environment variable
2. **WebView not loading**: Check CORS configuration and CSP headers
3. **Events not received**: Verify message handler setup in iOS app
4. **Connection failures**: Check Fasten public key and network connectivity

### Debug Information

The service includes debug information on the connect page showing:
- Current public key (masked for security)
- Timestamp and environment
- Event logs in browser console
