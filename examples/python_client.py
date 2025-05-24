#!/usr/bin/env python3
"""
Example Python client for Ollama Browser Tool

This script demonstrates how to interact with the browser extension
from a Python application or Ollama agent.
"""

import requests
import json
import time
from typing import Dict, Any, Optional

class OllamaBrowserClient:
    def __init__(self, base_url: str = "http://localhost:6789"):
        self.base_url = base_url
        self.session = requests.Session()
    
    def health_check(self) -> Dict[str, Any]:
        """Check if the bridge server is running"""
        try:
            response = self.session.get(f"{self.base_url}/health")
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            return {"status": "error", "error": str(e)}
    
    def read_element(self, selector: str, url: Optional[str] = None) -> Dict[str, Any]:
        """Read text content from a DOM element"""
        return self._execute_command({
            "action": "read",
            "selector": selector,
            "url": url
        })
    
    def write_element(self, selector: str, value: str, url: Optional[str] = None) -> Dict[str, Any]:
        """Write text content to a DOM element"""
        return self._execute_command({
            "action": "write",
            "selector": selector,
            "value": value,
            "url": url
        })
    
    def click_element(self, selector: str, url: Optional[str] = None) -> Dict[str, Any]:
        """Click a DOM element"""
        return self._execute_command({
            "action": "click",
            "selector": selector,
            "url": url
        })
    
    def _execute_command(self, command: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a command via the bridge server"""
        try:
            response = self.session.post(
                f"{self.base_url}/execute",
                json=command,
                timeout=30
            )
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            return {"success": False, "error": str(e)}

def main():
    """Example usage of the Ollama Browser Client"""
    client = OllamaBrowserClient()
    
    # Check if bridge server is running
    print("Checking bridge server health...")
    health = client.health_check()
    print(f"Health check: {health}")
    
    if health.get("status") != "ok":
        print("Bridge server is not running. Please start it first.")
        return
    
    if not health.get("extensionConnected"):
        print("Extension is not connected. Please install and enable the browser extension.")
        return
    
    print("\n=== Browser Automation Examples ===")
    
    # Example 1: Read from a search input
    print("\n1. Reading from a search input...")
    result = client.read_element("input[type='search'], input[name='q'], #search")
    print(f"Read result: {result}")
    
    # Example 2: Write to a text input
    print("\n2. Writing to a text input...")
    result = client.write_element(
        "input[type='text'], input[type='search'], textarea", 
        "Hello from Ollama!"
    )
    print(f"Write result: {result}")
    
    # Example 3: Click a button
    print("\n3. Clicking a submit button...")
    result = client.click_element("button[type='submit'], input[type='submit'], .submit-btn")
    print(f"Click result: {result}")
    
    # Example 4: Chain operations
    print("\n4. Chaining operations (search workflow)...")
    
    # Navigate to a search page (you would need to open this manually)
    print("Please navigate to a search page (like Google) in your browser")
    input("Press Enter when ready...")
    
    # Search for something
    search_query = "Ollama AI models"
    
    # Clear and write to search input
    result = client.write_element("input[name='q'], #search-input, [role='searchbox']", search_query)
    if result.get("success"):
        print(f"Successfully entered search query: {search_query}")
        
        # Wait a moment
        time.sleep(1)
        
        # Click search button
        result = client.click_element("button[type='submit'], input[type='submit'], .search-btn")
        if result.get("success"):
            print("Successfully clicked search button")
            
            # Wait for results to load
            time.sleep(3)
            
            # Read first result title
            result = client.read_element("h1, h2, h3, .result-title, [data-testid='result-title-a']")
            if result.get("success"):
                print(f"First result title: {result.get('data', 'Not found')}")
    
    print("\n=== Examples Complete ===")

if __name__ == "__main__":
    main()
