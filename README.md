# Ollama Browser Interaction Tool: Extension Architecture

## Architecture Overview

```mermaid
graph TB
    subgraph "Ollama Agent System"
        OA[Ollama Agent's<br/>Controlling Application<br/>(Python/Go Script)]
    end
    
    subgraph "Local Bridge Server"
        LBS[Local HTTP/WebSocket Server<br/>(Node.js/Express)<br/>Port: 6789]
    end
    
    subgraph "Browser Extension"
        BS[Background Script<br/>(Service Worker)]
        CS[Content Script<br/>(Injected into web pages)]
        POP[Popup UI<br/>(Optional Configuration)]
    end
    
    subgraph "Web Page"
        DOM[DOM Elements<br/>(Input/Output/Submit)]
    end
    
    OA -->|HTTP POST Request<br/>Tool Commands| LBS
    LBS -->|HTTP Response<br/>Results/Status| OA
    LBS <-->|WebSocket Connection<br/>Bidirectional| BS
    BS <-->|Extension Messaging<br/>Commands/Results| CS
    CS <-->|DOM Manipulation<br/>Read/Write/Click| DOM
    BS -.->|Configuration| POP
    
    classDef ollama fill:#e1f5fe
    classDef bridge fill:#f3e5f5
    classDef extension fill:#e8f5e8
    classDef web fill:#fff3e0
    
    class OA ollama
    class LBS bridge
    class BS,CS,POP extension
    class DOM web
```

## 1. Overview

This document outlines the architecture, directory structure, development environment, and build scripts for a browser extension (Chrome & Safari) designed to act as a "tool" for a local Ollama agent. The extension will allow an external process (the Ollama agent's controlling application) to:

1.  Read text content from a DOM element specified by a CSS selector.
2.  Write text content to a DOM element specified by a CSS selector.
3.  Trigger a click event on a DOM element specified by a CSS selector.

The interaction will be mediated by a lightweight local HTTP server acting as a bridge, which the Ollama agent's application will call, and the extension will communicate with.

## 2. Architecture

The system comprises three main components:

1.  **Ollama Agent's Controlling Application (e.g., Python Script):**
    *   Decides when to use the "browser tool."
    *   Formats a request containing the target URL (optional, if not already on the page), input selector, output selector, and submit selector.
    *   Sends this request via HTTP POST to the Local Bridge Server.
    *   Waits for a response (e.g., the extracted text or a success/failure status).

2.  **Local Bridge Server (e.g., Node.js/Express or Python/Flask):**
    *   A simple HTTP server running on `localhost` on a predefined port.
    *   Listens for HTTP POST requests from the Ollama Controlling Application.
    *   Maintains a WebSocket connection with the Browser Extension's background script.
    *   Forwards requests from the Ollama app to the extension via WebSocket.
    *   Relays responses/results from the extension back to the Ollama app as an HTTP response.

3.  **Browser Extension (Chrome & Safari):**
    *   **Background Script:**
        *   Establishes and maintains a WebSocket connection to the Local Bridge Server.
        *   Listens for messages (tool commands) from the Bridge Server.
        *   When a command is received, it identifies the active tab (or a tab matching a target URL if provided).
        *   Sends a message to the Content Script in the appropriate tab with the selectors and action.
        *   Receives results/status back from the Content Script.
        *   Sends these results/status back to the Bridge Server via WebSocket.
    *   **Content Script:**
        *   Injected into web pages.
        *   Listens for messages from the Background Script.
        *   Executes DOM manipulations:
            *   Reads from `document.querySelector(inputSelector).value` or `.innerText`.
            *   Writes to `document.querySelector(outputSelector).value = ...` or `.innerText = ...`.
            *   Triggers `document.querySelector(submitSelector).click()`.
        *   Sends the result (e.g., extracted text) or a success/failure status back to the Background Script.
    *   **(Optional) Popup UI:**
        *   Could be used for initial configuration (e.g., Bridge Server port), status display, or manual connection/disconnection.

### Communication Flow:
```
+-----------------------+ HTTP POST +---------------------+ WebSocket +---------------------+
| Ollama Agent's        | -----------------> | Local Bridge Server | <---------------> | Extension           |
| Controlling App       |                    | (e.g., Node.js on   |                   | (Background Script) |
| (e.g., Python script) | <----------------- | localhost:PORT)     |                   |                     |
+-----------------------+ HTTP Response +---------------------+                   +----------+----------+
                                                                                           |
                                                                        (Extension Messaging) |
                                                                                           |
                                                                                +----------V----------+
                                                                                | Extension           |
                                                                                | (Content Script in  |
                                                                                | active browser tab) |
                                                                                +---------------------+
                                                                                           |          |
                                                                                           V          V
                                                                                        Browser DOM
```

## 3. Directory Structure (Unified for Development)

We'll aim for a common structure and use build scripts to package for each platform.

```
ollama-browser-tool/
├── src/                              # Source files common to both extensions
│   ├── background/
│   │   └── main.js                   # Background script logic
│   ├── content_scripts/
│   │   └── interactor.js             # Content script for DOM manipulation
│   ├── icons/                        # Extension icons
│   │   ├── icon16.png
│   │   ├── icon48.png
│   │   └── icon128.png
│   ├── lib/                          # Shared utility functions (if any)
│   │   └── utils.js
│   ├── popup/                        # (Optional) Popup UI
│   │   ├── popup.html
│   │   └── popup.js
│   └── _locales/                     # For internationalization (good practice)
│       └── en/
│           └── messages.json
├── bridge_server/                    # Lightweight local HTTP/WebSocket bridge server
│   ├── server.js                     # Example: Node.js Express + ws server
│   └── package.json
├── platform_specific/
│   ├── chrome/
│   │   └── manifest.json             # Chrome-specific manifest
│   └── safari/
│       └── manifest.json             # Safari-specific manifest template (will be converted)
│       └── OllamaBrowserTool.xcodeproj/ # Xcode project (generated)
├── dist/                             # Build output directory
│   ├── chrome/                       # Packaged Chrome extension
│   └── safari/                       # Packaged Safari extension
├── package.json                      # For Node.js-based build tools (Webpack, ESLint, etc.)
├── webpack.config.js                 # Webpack configuration for bundling
└── README.md
```

## 4. Getting Started

To set up the project structure and begin development, run the setup script:

```bash
go run setup.go
```

This will create the complete directory structure and generate a development checklist.
