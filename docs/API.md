# Ollama Browser Tool API Documentation

## Overview

The Ollama Browser Tool provides a simple HTTP API for browser automation. The system consists of:

1. **Bridge Server** - HTTP/WebSocket server running on `localhost:6789`
2. **Browser Extension** - Chrome/Safari extension that executes commands
3. **Client Libraries** - Python/JavaScript clients for easy integration

## HTTP API

### Base URL
```
http://localhost:6789
```

### Authentication
No authentication required (local development only).

### Endpoints

#### GET /health
Check if the bridge server and extension are running.

**Response:**
```json
{
  "status": "ok",
  "extensionConnected": true,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

#### GET /status
Get detailed status information.

**Response:**
```json
{
  "server": "running",
  "extensionConnected": true,
  "pendingRequests": 0,
  "uptime": 3600
}
```

#### POST /execute
Execute a browser automation command.

**Request Body:**
```json
{
  "action": "read|write|click",
  "selector": "CSS selector string",
  "value": "text to write (write action only)",
  "url": "optional target URL"
}
```

**Parameters:**
- `action` (required): Action to perform
  - `read` - Extract text from element
  - `write` - Write text to input element
  - `click` - Click an element
- `selector` (required): CSS selector for target element
- `value` (optional): Text value for write actions
- `url` (optional): Target URL to find tab (uses active tab if not specified)

**Response:**
```json
{
  "success": true,
  "data": "extracted text or action result",
  "error": "error message if success is false",
  "elementType": "input|textarea|button|etc"
}
```

## Actions

### Read Action
Extracts text content from a DOM element.

**Example:**
```json
{
  "action": "read",
  "selector": "#search-input"
}
```

**Behavior:**
- For `input` and `textarea` elements: returns `.value`
- For other elements: returns `.innerText` or `.textContent`

### Write Action
Writes text to an input element with realistic typing simulation.

**Example:**
```json
{
  "action": "write",
  "selector": "#message-field",
  "value": "Hello, world!"
}
```

**Behavior:**
- Clears existing content
- Focuses the element
- Simulates typing character by character
- Triggers `input` and `change` events
- Works with `input`, `textarea`, and contenteditable elements

### Click Action
Clicks a DOM element with proper event handling.

**Example:**
```json
{
  "action": "click",
  "selector": "#submit-button"
}
```

**Behavior:**
- Scrolls element into view
- Checks if element is clickable (not disabled)
- Triggers click event
- Works with buttons, links, and any clickable element

## CSS Selectors

The tool supports standard CSS selectors:

### Basic Selectors
```css
#id              /* Element with specific ID */
.class           /* Elements with specific class */
tagname          /* Elements by tag name */
[attribute]      /* Elements with attribute */
[attr="value"]   /* Elements with specific attribute value */
```

### Combination Selectors
```css
div.class        /* Div with specific class */
#id .class       /* Descendant selector */
.parent > .child /* Direct child selector */
input[type="text"] /* Input with specific type */
```

### Pseudo-selectors
```css
:first-child     /* First child element */
:last-child      /* Last child element */
:nth-child(n)    /* Nth child element */
:not(.class)     /* Elements without class */
```

## Error Handling

All API responses include error information when operations fail:

### Common Error Scenarios

1. **Extension Not Connected**
```json
{
  "success": false,
  "error": "Extension not connected"
}
```

2. **Element Not Found**
```json
{
  "success": false,
  "error": "Element not found: #nonexistent-element"
}
```

3. **Invalid Selector**
```json
{
  "success": false,
  "error": "Invalid selector: invalid>>selector"
}
```

4. **Request Timeout**
```json
{
  "success": false,
  "error": "Request timeout"
}
```

5. **Element Not Clickable**
```json
{
  "success": false,
  "error": "Element is disabled"
}
```

## Client Libraries

### Python Client

```python
from ollama_browser import OllamaBrowserClient

client = OllamaBrowserClient()

# Read from element
result = client.read_element("#search-input")
if result["success"]:
    print(f"Read: {result['data']}")

# Write to element
result = client.write_element("#message", "Hello!")

# Click element
result = client.click_element("#submit-btn")
```

### JavaScript Client

```javascript
const client = new OllamaBrowserClient();

// Read from element
const result = await client.readElement("#search-input");
if (result.success) {
    console.log(`Read: ${result.data}`);
}

// Write to element
await client.writeElement("#message", "Hello!");

// Click element
await client.clickElement("#submit-btn");
```

## WebSocket Protocol (Internal)

The bridge server and browser extension communicate via WebSocket. This is handled automatically by the client libraries.

### Message Format

**Server to Extension:**
```json
{
  "id": "unique-request-id",
  "action": "read|write|click",
  "selector": "CSS selector",
  "value": "text value (for write)",
  "url": "target URL (optional)"
}
```

**Extension to Server:**
```json
{
  "id": "unique-request-id",
  "success": true,
  "data": "result data",
  "error": "error message if failed",
  "elementType": "element tag name"
}
```

## Rate Limiting

No explicit rate limiting is implemented, but consider:
- Allow small delays between actions for page loading
- Handle async operations properly
- Use timeouts for long-running operations

## Best Practices

### Selector Strategy
1. **Prefer IDs**: `#unique-id` (most reliable)
2. **Use semantic selectors**: `[data-testid="submit"]`
3. **Avoid fragile selectors**: Complex CSS paths that break easily
4. **Test selectors**: Verify in browser console first

### Error Handling
```python
try:
    result = client.read_element("#search-input")
    if not result["success"]:
        print(f"Error: {result['error']}")
        return
    
    # Process successful result
    data = result["data"]
except Exception as e:
    print(f"Request failed: {e}")
```

### Timing
```python
import time

# Write text
client.write_element("#search", "query")

# Wait for any dynamic updates
time.sleep(0.5)

# Click submit
client.click_element("#submit")

# Wait for page load
time.sleep(2)

# Read results
result = client.read_element(".result-title")
```

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Ensure bridge server is running: `npm run server`
   - Check port 6789 is not blocked

2. **Extension Not Connected**
   - Verify extension is installed and active
   - Check extension popup for connection status
   - Restart browser if needed

3. **Element Not Found**
   - Verify selector in browser console
   - Wait for dynamic content to load
   - Check if element is in iframe

4. **Actions Not Working**
   - Ensure page has finished loading
   - Check for JavaScript errors
   - Verify element is visible and enabled

### Debug Commands

```bash
# Test bridge server
curl http://localhost:6789/health

# Test with verbose output
python3 -v examples/python_client.py

# Run comprehensive tests
python3 examples/test_scenarios.py
```

## Security Considerations

⚠️ **Development Only**: This tool is designed for local development and testing only.

- Bridge server binds to localhost only
- No authentication or encryption
- Browser extension has broad permissions
- Not suitable for production environments
- Use in trusted development environments only
