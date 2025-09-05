#!/usr/bin/env python3
"""
Startup script for the complete Audio-Vibration Rating Explorer system
Launches both the Python backend and React frontend
"""

import subprocess
import sys
import os
import time
import webbrowser
from pathlib import Path

def check_python_dependencies():
    """Check if required Python packages are installed"""
    required_packages = ['flask', 'librosa', 'torch', 'soundfile']
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package)
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        print(f"❌ Missing Python packages: {', '.join(missing_packages)}")
        print("Please install them first:")
        print(f"pip install {' '.join(missing_packages)}")
        return False
    
    print("✅ All Python dependencies are available")
    return True

def check_node_dependencies():
    """Check if Node.js and npm are available"""
    try:
        subprocess.run(['node', '--version'], check=True, capture_output=True)
        subprocess.run(['npm', '--version'], check=True, capture_output=True)
        print("✅ Node.js and npm are available")
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ Node.js or npm not found")
        print("Please install Node.js from https://nodejs.org/")
        return False

def install_backend_dependencies():
    """Install backend Python dependencies"""
    backend_dir = Path(__file__).parent / 'backend'
    requirements_file = backend_dir / 'requirements.txt'
    
    if not requirements_file.exists():
        print("❌ Backend requirements.txt not found")
        return False
    
    print("📦 Installing backend dependencies...")
    try:
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', '-r', str(requirements_file)])
        print("✅ Backend dependencies installed")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install backend dependencies: {e}")
        return False

def start_backend():
    """Start the Python backend service"""
    backend_dir = Path(__file__).parent / 'backend'
    
    print("🚀 Starting Python backend service...")
    try:
        # Start backend in background
        backend_process = subprocess.Popen(
            [sys.executable, 'app.py'],
            cwd=backend_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        # Wait a bit for backend to start
        time.sleep(3)
        
        # Check if backend is responding
        try:
            import requests
            response = requests.get('http://localhost:5000/health', timeout=5)
            if response.status_code == 200:
                print("✅ Backend service started successfully on http://localhost:5000")
                return backend_process
            else:
                print("❌ Backend service not responding properly")
                backend_process.terminate()
                return None
        except ImportError:
            # requests not available, assume backend started
            print("✅ Backend service started (health check skipped)")
            return backend_process
        except Exception as e:
            print(f"❌ Backend health check failed: {e}")
            backend_process.terminate()
            return None
            
    except Exception as e:
        print(f"❌ Failed to start backend: {e}")
        return None

def start_frontend():
    """Start the React frontend"""
    print("🚀 Starting React frontend...")
    try:
        # Check if node_modules exists
        if not (Path(__file__).parent / 'node_modules').exists():
            print("📦 Installing frontend dependencies...")
            subprocess.check_call(['npm', 'install'], cwd=Path(__file__).parent)
        
        # Start frontend
        frontend_process = subprocess.Popen(
            ['npm', 'start'],
            cwd=Path(__file__).parent,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        # Wait for frontend to start
        time.sleep(5)
        print("✅ Frontend service started on http://localhost:3000")
        return frontend_process
        
    except Exception as e:
        print(f"❌ Failed to start frontend: {e}")
        return None

def main():
    """Main startup function"""
    print("🎵 Audio-Vibration Rating Explorer")
    print("=" * 50)
    
    # Check dependencies
    if not check_python_dependencies():
        print("\nPlease install missing Python packages and try again.")
        return
    
    if not check_node_dependencies():
        print("\nPlease install Node.js and try again.")
        return
    
    # Install backend dependencies
    if not install_backend_dependencies():
        print("\nFailed to install backend dependencies.")
        return
    
    # Start backend
    backend_process = start_backend()
    if not backend_process:
        print("\nFailed to start backend service.")
        return
    
    # Start frontend
    frontend_process = start_frontend()
    if not frontend_process:
        print("\nFailed to start frontend service.")
        backend_process.terminate()
        return
    
    print("\n🎉 System started successfully!")
    print("📱 Frontend: http://localhost:3000")
    print("🐍 Backend: http://localhost:5000")
    print("\nPress Ctrl+C to stop all services...")
    
    # Open browser
    try:
        webbrowser.open('http://localhost:3000')
    except:
        pass
    
    try:
        # Wait for user to stop
        while True:
            time.sleep(1)
            # Check if processes are still running
            if backend_process.poll() is not None:
                print("❌ Backend service stopped unexpectedly")
                break
            if frontend_process.poll() is not None:
                print("❌ Frontend service stopped unexpectedly")
                break
    except KeyboardInterrupt:
        print("\n🛑 Stopping services...")
    
    # Cleanup
    if backend_process:
        backend_process.terminate()
        print("✅ Backend service stopped")
    
    if frontend_process:
        frontend_process.terminate()
        print("✅ Frontend service stopped")
    
    print("👋 Goodbye!")

if __name__ == "__main__":
    main()
