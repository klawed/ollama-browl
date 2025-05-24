#!/usr/bin/env python3
"""
Test scenarios for Ollama Browser Tool

This script provides comprehensive testing scenarios to validate
the functionality of the browser automation tool.
"""

import requests
import time
import json
from typing import Dict, Any, List
from python_client import OllamaBrowserClient

class TestScenarios:
    def __init__(self):
        self.client = OllamaBrowserClient()
        self.test_results = []
    
    def run_test(self, test_name: str, test_func):
        """Run a single test and record the result"""
        print(f"\n🧪 Running test: {test_name}")
        try:
            result = test_func()
            if result:
                print(f"✅ PASS: {test_name}")
                self.test_results.append({"name": test_name, "status": "PASS"})
            else:
                print(f"❌ FAIL: {test_name}")
                self.test_results.append({"name": test_name, "status": "FAIL"})
        except Exception as e:
            print(f"💥 ERROR: {test_name} - {str(e)}")
            self.test_results.append({"name": test_name, "status": "ERROR", "error": str(e)})
    
    def test_health_check(self) -> bool:
        """Test bridge server health check"""
        health = self.client.health_check()
        return health.get("status") == "ok"
    
    def test_extension_connection(self) -> bool:
        """Test if extension is connected"""
        health = self.client.health_check()
        return health.get("extensionConnected", False)
    
    def test_invalid_selector(self) -> bool:
        """Test handling of invalid CSS selectors"""
        result = self.client.read_element("invalid>>selector")
        return not result.get("success", True)  # Should fail
    
    def test_nonexistent_element(self) -> bool:
        """Test handling of non-existent elements"""
        result = self.client.read_element("#this-element-does-not-exist-12345")
        return not result.get("success", True)  # Should fail
    
    def test_multiple_actions_sequence(self) -> bool:
        """Test a sequence of actions"""
        # This test requires a test page to be open
        print("  ℹ️  This test requires a test page. Creating one...")
        
        # Create a simple test page
        test_html = self.create_test_page()
        print(f"  📄 Open this page in your browser: data:text/html,{test_html}")
        input("  ⏳ Press Enter when the test page is loaded...")
        
        # Test sequence
        steps = [
            ("write", "#test-input", "Hello World"),
            ("read", "#test-input", None),
            ("click", "#test-button", None),
            ("read", "#test-output", None)
        ]
        
        for action, selector, value in steps:
            if action == "write":
                result = self.client.write_element(selector, value)
            elif action == "read":
                result = self.client.read_element(selector)
            elif action == "click":
                result = self.client.click_element(selector)
            
            if not result.get("success"):
                print(f"  ❌ Failed at step: {action} {selector}")
                return False
            
            time.sleep(0.5)  # Small delay between actions
        
        return True
    
    def test_form_interaction(self) -> bool:
        """Test form interactions"""
        # This would test common form scenarios
        print("  ℹ️  Navigate to a page with a form for this test")
        print("  ℹ️  Or use the test page from the previous test")
        
        # Test common form selectors
        selectors_to_test = [
            "input[type='text']",
            "input[type='email']",
            "textarea",
            "select",
            "button[type='submit']"
        ]
        
        found_elements = 0
        for selector in selectors_to_test:
            result = self.client.read_element(selector)
            if result.get("success"):
                found_elements += 1
                print(f"  ✓ Found element: {selector}")
        
        return found_elements > 0
    
    def test_error_handling(self) -> bool:
        """Test various error conditions"""
        error_tests = [
            {"action": "read", "selector": ""},  # Empty selector
            {"action": "read", "selector": "#nonexistent"},  # Non-existent element
            {"action": "write", "selector": "#nonexistent", "value": "test"},  # Write to non-existent
            {"action": "click", "selector": "#nonexistent"},  # Click non-existent
        ]
        
        all_handled_correctly = True
        for test_case in error_tests:
            if test_case["action"] == "read":
                result = self.client.read_element(test_case["selector"])
            elif test_case["action"] == "write":
                result = self.client.write_element(test_case["selector"], test_case["value"])
            elif test_case["action"] == "click":
                result = self.client.click_element(test_case["selector"])
            
            # All these should fail gracefully
            if result.get("success", False):
                print(f"  ❌ Expected failure but got success for: {test_case}")
                all_handled_correctly = False
            else:
                print(f"  ✓ Correctly handled error: {test_case['action']} {test_case.get('selector', 'N/A')}")
        
        return all_handled_correctly
    
    def create_test_page(self) -> str:
        """Create a simple HTML test page"""
        html = """
<!DOCTYPE html>
<html>
<head>
    <title>Ollama Browser Tool Test Page</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .container { max-width: 600px; }
        input, textarea, button { margin: 10px 0; padding: 8px; }
        button { background: #007cba; color: white; border: none; cursor: pointer; }
        #test-output { background: #f0f0f0; padding: 10px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Ollama Browser Tool Test Page</h1>
        <div>
            <label>Test Input:</label><br>
            <input type="text" id="test-input" placeholder="Enter text here">
        </div>
        <div>
            <label>Test Textarea:</label><br>
            <textarea id="test-textarea" placeholder="Enter longer text here"></textarea>
        </div>
        <div>
            <button id="test-button" onclick="handleClick()">Test Button</button>
        </div>
        <div>
            <label>Output:</label>
            <div id="test-output">Click the button to see output</div>
        </div>
    </div>
    
    <script>
        function handleClick() {
            const input = document.getElementById('test-input').value;
            const textarea = document.getElementById('test-textarea').value;
            const output = document.getElementById('test-output');
            output.textContent = `Input: ${input || 'empty'}, Textarea: ${textarea || 'empty'}`;
        }
    </script>
</body>
</html>
        """.strip()
        
        # URL encode for data URI
        import urllib.parse
        return urllib.parse.quote(html)
    
    def run_all_tests(self):
        """Run all test scenarios"""
        print("🚀 Starting Ollama Browser Tool Test Suite")
        print("=" * 50)
        
        # Basic connectivity tests
        self.run_test("Bridge Server Health Check", self.test_health_check)
        self.run_test("Extension Connection", self.test_extension_connection)
        
        # Error handling tests
        self.run_test("Invalid Selector Handling", self.test_invalid_selector)
        self.run_test("Non-existent Element Handling", self.test_nonexistent_element)
        self.run_test("Error Handling", self.test_error_handling)
        
        # Interactive tests
        self.run_test("Form Interaction", self.test_form_interaction)
        self.run_test("Multiple Actions Sequence", self.test_multiple_actions_sequence)
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test results summary"""
        print("\n" + "=" * 50)
        print("📊 Test Results Summary")
        print("=" * 50)
        
        passed = sum(1 for result in self.test_results if result["status"] == "PASS")
        failed = sum(1 for result in self.test_results if result["status"] == "FAIL")
        errors = sum(1 for result in self.test_results if result["status"] == "ERROR")
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"💥 Errors: {errors}")
        
        if failed > 0 or errors > 0:
            print("\n🔍 Failed/Error Details:")
            for result in self.test_results:
                if result["status"] in ["FAIL", "ERROR"]:
                    print(f"  - {result['name']}: {result['status']}")
                    if "error" in result:
                        print(f"    Error: {result['error']}")
        
        success_rate = (passed / total * 100) if total > 0 else 0
        print(f"\n🎯 Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 80:
            print("🎉 Great! The browser tool is working well.")
        elif success_rate >= 60:
            print("⚠️  Some issues detected. Check the failed tests.")
        else:
            print("🚨 Multiple issues detected. Please review the setup.")

def main():
    """Run the test suite"""
    tester = TestScenarios()
    tester.run_all_tests()

if __name__ == "__main__":
    main()
