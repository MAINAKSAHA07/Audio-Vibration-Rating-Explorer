#!/usr/bin/env python3
"""
Startup script for the Audio-Vibration Backend Service
"""

import subprocess
import sys
import os
from pathlib import Path

def install_requirements():
    """Install required packages"""
    print("📦 Installing required packages...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ Requirements installed successfully")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install requirements: {e}")
        return False
    return True

def start_service():
    """Start the Flask service"""
    print("🚀 Starting Audio-Vibration Backend Service...")
    try:
        # Start the Flask app
        subprocess.run([sys.executable, "app.py"])
    except KeyboardInterrupt:
        print("\n🛑 Service stopped by user")
    except Exception as e:
        print(f"❌ Error starting service: {e}")

if __name__ == "__main__":
    # Change to backend directory
    backend_dir = Path(__file__).parent
    os.chdir(backend_dir)
    
    print("🎵 Audio-Vibration Backend Service")
    print("=" * 40)
    
    # Install requirements if needed
    if install_requirements():
        start_service()
    else:
        print("❌ Failed to start service due to missing requirements")
        sys.exit(1)
