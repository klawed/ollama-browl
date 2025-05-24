#!/usr/bin/env python3
"""
Setup script for Ollama Browser Tool development environment

This script sets up the development environment, installs dependencies,
and provides helpful information for getting started.
"""

import os
import sys
import subprocess
import json
from pathlib import Path

def run_command(cmd, check=True):
    """Run a shell command"""
    print(f"Running: {cmd}")
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if check and result.returncode != 0:
        print(f"Error running command: {cmd}")
        print(f"STDOUT: {result.stdout}")
        print(f"STDERR: {result.stderr}")
        sys.exit(1)
    return result

def check_prerequisites():
    """Check if required tools are installed"""
    print("🔍 Checking prerequisites...")
    
    # Check Node.js
    result = run_command("node --version", check=False)
    if result.returncode != 0:
        print("❌ Node.js is not installed. Please install Node.js 16+ first.")
        print("   Download from: https://nodejs.org/")
        return False
    else:
        print(f"✅ Node.js: {result.stdout.strip()}")
    
    # Check npm
    result = run_command("npm --version", check=False)
    if result.returncode != 0:
        print("❌ npm is not installed. Please install npm first.")
        return False
    else:
        print(f"✅ npm: {result.stdout.strip()}")
    
    # Check Python
    print(f"✅ Python: {sys.version.split()[0]}")
    
    return True

def install_dependencies():
    """Install Node.js dependencies"""
    print("\n📦 Installing dependencies...")
    
    # Install root dependencies
    if os.path.exists("package.json"):
        run_command("npm install")
        print("✅ Root dependencies installed")
    
    # Install bridge server dependencies
    bridge_dir = Path("bridge_server")
    if bridge_dir.exists() and (bridge_dir / "package.json").exists():
        os.chdir(bridge_dir)
        run_command("npm install")
        os.chdir("..")
        print("✅ Bridge server dependencies installed")

def create_development_config():
    """Create development configuration files"""
    print("\n⚙️  Creating development configuration...")
    
    # Create .env file for development
    env_content = """
# Development Configuration
BRIDGE_PORT=6789
WEBSOCKET_PORT=6790
DEBUG=true
LOG_LEVEL=info
""".strip()
    
    with open(".env", "w") as f:
        f.write(env_content)
    print("✅ Created .env file")
    
    # Create launch configuration for VS Code
    vscode_dir = Path(".vscode")
    vscode_dir.mkdir(exist_ok=True)
    
    launch_config = {
        "version": "0.2.0",
        "configurations": [
            {
                "name": "Launch Bridge Server",
                "type": "node",
                "request": "launch",
                "program": "${workspaceFolder}/bridge_server/server.js",
                "console": "integratedTerminal",
                "env": {
                    "DEBUG": "true"
                }
            },
            {
                "name": "Python Test Client",
                "type": "python",
                "request": "launch",
                "program": "${workspaceFolder}/examples/python_client.py",
                "console": "integratedTerminal"
            }
        ]
    }
    
    with open(vscode_dir / "launch.json", "w") as f:
        json.dump(launch_config, f, indent=2)
    print("✅ Created VS Code launch configuration")

def build_extension():
    """Build the browser extension"""
    print("\n🔨 Building browser extension...")
    run_command("npm run build")
    print("✅ Extension built successfully")

def print_getting_started():
    """Print getting started instructions"""
    print("\n" + "="*60)
    print("🚀 SETUP COMPLETE! Getting Started:")
    print("="*60)
    
    print("\n1️⃣  Start the bridge server:")
    print("   npm run server")
    print("   # or: node bridge_server/server.js")
    
    print("\n2️⃣  Install the browser extension:")
    print("   Chrome:")
    print("   • Go to chrome://extensions/")
    print("   • Enable 'Developer mode'")
    print("   • Click 'Load unpacked'")
    print("   • Select the 'dist/chrome' folder")
    
    print("\n   Safari:")
    print("   • Open Safari")
    print("   • Go to Safari > Preferences > Advanced")
    print("   • Enable 'Show Develop menu'")
    print("   • Go to Develop > Allow Unsigned Extensions")
    print("   • Load the extension from 'dist/safari'")
    
    print("\n3️⃣  Test the setup:")
    print("   python3 examples/python_client.py")
    print("   # or: python3 examples/test_scenarios.py")
    
    print("\n4️⃣  Development commands:")
    print("   npm run build          # Build for all platforms")
    print("   npm run build:chrome   # Build Chrome extension only")
    print("   npm run build:safari   # Build Safari extension only")
    print("   npm run dev            # Build with file watching")
    
    print("\n📚 Documentation:")
    print("   • README.md - Architecture and API documentation")
    print("   • examples/ - Python client examples")
    print("   • src/ - Extension source code")
    print("   • bridge_server/ - Local bridge server")
    
    print("\n🔧 Troubleshooting:")
    print("   • Check bridge server: http://localhost:6789/health")
    print("   • View extension popup for connection status")
    print("   • Check browser console for errors")
    print("   • Run test scenarios: python3 examples/test_scenarios.py")
    
    print("\n" + "="*60)
    print("Happy automating! 🤖")
    print("="*60)

def main():
    """Main setup function"""
    print("🔧 Ollama Browser Tool - Development Setup")
    print("=" * 50)
    
    if not check_prerequisites():
        sys.exit(1)
    
    install_dependencies()
    create_development_config()
    build_extension()
    print_getting_started()

if __name__ == "__main__":
    main()
