#!/usr/bin/env python3
"""
Script to restart the backend with static file serving capabilities
"""

import subprocess
import sys
import time
import requests
from pathlib import Path

def check_backend_health():
    """Check if the backend is healthy"""
    try:
        response = requests.get('http://3.138.192.243:5000/health', timeout=10)
        if response.status_code == 200:
            data = response.json()
            return data.get('status') == 'healthy'
    except:
        pass
    return False

def restart_backend():
    """Restart the backend service"""
    print("🔄 Restarting backend service...")
    
    # Kill existing backend processes
    try:
        subprocess.run(['pkill', '-f', 'python.*app.py'], check=False)
        subprocess.run(['pkill', '-f', 'gunicorn'], check=False)
        print("✅ Killed existing backend processes")
    except:
        print("⚠️ No existing backend processes found")
    
    # Wait a moment
    time.sleep(2)
    
    # Start the backend
    backend_dir = Path(__file__).parent / 'backend'
    os.chdir(backend_dir)
    
    print("🚀 Starting backend with static file serving...")
    try:
        # Start with gunicorn for production
        subprocess.Popen([
            'gunicorn', 
            '--bind', '0.0.0.0:5000',
            '--workers', '4',
            '--timeout', '120',
            '--keep-alive', '2',
            '--max-requests', '1000',
            '--max-requests-jitter', '100',
            'app:app'
        ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        print("✅ Backend started with gunicorn")
        
        # Wait for backend to be ready
        print("⏳ Waiting for backend to be ready...")
        for i in range(30):  # Wait up to 30 seconds
            if check_backend_health():
                print("✅ Backend is healthy and ready!")
                return True
            time.sleep(1)
            print(f"   Waiting... ({i+1}/30)")
        
        print("❌ Backend failed to start properly")
        return False
        
    except Exception as e:
        print(f"❌ Error starting backend: {e}")
        return False

def test_static_file_serving():
    """Test if static file serving is working"""
    print("\n🧪 Testing static file serving...")
    
    # Test health endpoint for file serving info
    try:
        response = requests.get('http://3.138.192.243:5000/health', timeout=10)
        if response.status_code == 200:
            data = response.json()
            if 'file_serving' in data:
                file_info = data['file_serving']
                print(f"✅ File serving info available:")
                print(f"   Audio directory exists: {file_info.get('audio_directory_exists', False)}")
                print(f"   Vibration directory exists: {file_info.get('vibration_directory_exists', False)}")
                print(f"   Audio files count: {file_info.get('audio_files_count', 0)}")
                print(f"   Vibration files count: {file_info.get('vibration_files_count', 0)}")
            else:
                print("⚠️ File serving info not available in health endpoint")
    except Exception as e:
        print(f"❌ Error checking health endpoint: {e}")
    
    # Test audio file serving
    try:
        response = requests.head('http://3.138.192.243:5000/audio/1-100038-A-14.wav', timeout=10)
        if response.status_code == 200:
            print("✅ Audio file serving is working!")
        else:
            print(f"⚠️ Audio file serving returned status: {response.status_code}")
    except Exception as e:
        print(f"❌ Error testing audio file serving: {e}")
    
    # Test vibration file serving
    try:
        response = requests.head('http://3.138.192.243:5000/vibration/1-100038-A-14-vib-freqshift.wav', timeout=10)
        if response.status_code == 200:
            print("✅ Vibration file serving is working!")
        else:
            print(f"⚠️ Vibration file serving returned status: {response.status_code}")
    except Exception as e:
        print(f"❌ Error testing vibration file serving: {e}")

if __name__ == '__main__':
    import os
    
    print("🎯 Backend Restart with Static File Serving")
    print("=" * 50)
    
    if restart_backend():
        test_static_file_serving()
        print("\n🎉 Backend restart completed!")
        print("The backend now supports static file serving for audio and vibration files.")
    else:
        print("\n❌ Backend restart failed!")
        sys.exit(1)
