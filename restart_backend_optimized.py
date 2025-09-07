#!/usr/bin/env python3
"""
Script to restart the backend with optimizations
"""

import subprocess
import sys
import time
import os
from pathlib import Path

def restart_backend():
    """Restart the backend service with optimizations"""
    backend_dir = Path(__file__).parent / 'backend'
    
    print("🔄 Restarting backend with optimizations...")
    
    # Kill any existing backend processes
    try:
        subprocess.run(['pkill', '-f', 'python.*app.py'], check=False)
        subprocess.run(['pkill', '-f', 'flask'], check=False)
        time.sleep(2)
        print("✅ Stopped existing backend processes")
    except Exception as e:
        print(f"⚠️ Could not stop existing processes: {e}")
    
    # Start the backend
    try:
        os.chdir(backend_dir)
        print(f"📁 Changed to directory: {backend_dir}")
        
        # Start the backend in the background
        process = subprocess.Popen([
            sys.executable, 'app.py'
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        print("🚀 Backend started with optimizations:")
        print("   - Audio duration limited to 10 seconds for neural models")
        print("   - CUDA optimizations enabled")
        print("   - 30-second timeout protection")
        print("   - In-memory caching for faster repeated requests")
        print("   - Better error handling and user feedback")
        print(f"   - Process ID: {process.pid}")
        
        # Wait a moment and check if it's running
        time.sleep(3)
        if process.poll() is None:
            print("✅ Backend is running successfully!")
            print("🌐 Backend URL: http://localhost:5000")
            print("🔍 Health check: http://localhost:5000/health")
        else:
            stdout, stderr = process.communicate()
            print(f"❌ Backend failed to start:")
            print(f"STDOUT: {stdout.decode()}")
            print(f"STDERR: {stderr.decode()}")
            
    except Exception as e:
        print(f"❌ Error starting backend: {e}")

if __name__ == '__main__':
    restart_backend()
