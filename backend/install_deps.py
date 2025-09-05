#!/usr/bin/env python3
"""
Install missing dependencies for the audio-vibration backend
"""

import subprocess
import sys

def install_dependencies():
    """Install the missing dependencies"""
    print("📦 Installing missing dependencies...")
    
    missing_packages = [
        'resampy>=0.4.0',
        'audioread>=3.0.0'
    ]
    
    for package in missing_packages:
        print(f"Installing {package}...")
        try:
            subprocess.check_call([sys.executable, '-m', 'pip', 'install', package])
            print(f"✅ {package} installed successfully")
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to install {package}: {e}")
            return False
    
    print("\n🎉 All dependencies installed successfully!")
    print("You can now restart the backend service.")
    return True

if __name__ == "__main__":
    install_dependencies()
