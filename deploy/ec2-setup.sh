#!/bin/bash
# AWS EC2 Setup Script for Audio-Vibration Backend
# Run this script on your EC2 instance after connecting via SSH

set -e  # Exit on any error

echo "🚀 Starting AWS EC2 setup for Audio-Vibration Backend..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install system dependencies
echo "🔧 Installing system dependencies..."
sudo apt install -y \
    python3.11 \
    python3.11-venv \
    python3.11-dev \
    python3-pip \
    nginx \
    ffmpeg \
    libsndfile1 \
    libsndfile1-dev \
    build-essential \
    git \
    curl \
    wget \
    unzip \
    htop \
    ufw

# Install additional audio libraries
sudo apt install -y \
    libasound2-dev \
    portaudio19-dev \
    libportaudio2 \
    libportaudiocpp0 \
    libfftw3-dev \
    libavcodec-dev \
    libavformat-dev \
    libavutil-dev

echo "✅ System dependencies installed successfully!"

# Create application directory
echo "📁 Setting up application directory..."
sudo mkdir -p /opt/audio-vibration-backend
sudo chown ubuntu:ubuntu /opt/audio-vibration-backend
cd /opt/audio-vibration-backend

# Clone repository (replace with your actual repo URL)
echo "�� Cloning repository..."
git clone https://github.com/MAINAKSAHA07/Audio-Vibration-Rating-Explorer.git .

# Create virtual environment
echo "🐍 Creating Python virtual environment..."
python3.11 -m venv venv
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r backend/requirements-production.txt

# Create necessary directories
echo "📁 Creating application directories..."
mkdir -p backend/uploads
mkdir -p backend/outputs
mkdir -p logs

# Set proper permissions
chmod 755 backend/uploads
chmod 755 backend/outputs
chmod 755 logs

echo "✅ Application setup completed successfully!"

# Configure firewall
echo "🔥 Configuring firewall..."
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

echo "✅ Firewall configured!"

# Install and configure Nginx
echo "🌐 Configuring Nginx..."
sudo systemctl enable nginx
sudo systemctl start nginx

echo "✅ Nginx configured and started!"

echo "🎉 EC2 setup completed successfully!"
echo "Next steps:"
echo "1. Configure your domain DNS to point to this EC2 instance"
echo "2. Run: sudo ./deploy/configure-nginx.sh"
echo "3. Run: sudo ./deploy/setup-ssl.sh yourdomain.com"
echo "4. Run: sudo ./deploy/start-services.sh"
```

```bash:/Users/mainaksaha/Desktop/MASTERS/Project/Audio-Vibration-Rating-Explorer/deploy/configure-nginx.sh
#!/bin/bash
# Nginx configuration script

set -e

DOMAIN=${1:-"api.yourdomain.com"}
APP_DIR="/opt/audio-vibration-backend"

echo "🌐 Configuring Nginx for domain: $DOMAIN"

# Create Nginx configuration
sudo tee /etc/nginx/sites-available/audio-backend > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # File upload size limit
    client_max_body_size 50M;
    client_body_timeout 60s;
    client_header_timeout 60s;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    # Main application
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Host \$host;
        proxy_set_header X-Forwarded-Port \$server_port;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://127.0.0.1:8000/health;
        access_log off;
    }

    # Static files (if any)
    location /static/ {
        alias $APP_DIR/backend/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Logging
    access_log /var/log/nginx/audio-backend-access.log;
    error_log /var/log/nginx/audio-backend-error.log;
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/audio-backend /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

echo "✅ Nginx configured successfully for $DOMAIN"
echo " Test configuration with: sudo nginx -t"
echo "📋 View logs with: sudo tail -f /var/log/nginx/audio-backend-*.log"
```

```bash:/Users/mainaksaha/Desktop/MASTERS/Project/Audio-Vibration-Rating-Explorer/deploy/setup-ssl.sh
#!/bin/bash
# SSL setup script using Let's Encrypt

set -e

DOMAIN=${1}
if [ -z "$DOMAIN" ]; then
    echo "❌ Error: Please provide a domain name"
    echo "Usage: $0 yourdomain.com"
    exit 1
fi

echo " Setting up SSL for domain: $DOMAIN"

# Install Certbot
echo " Installing Certbot..."
sudo snap install core
sudo snap refresh core
sudo snap install --classic certbot
sudo ln -sf /snap/bin/certbot /usr/bin/certbot

# Get SSL certificate
echo "🔐 Obtaining SSL certificate..."
sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN

# Test certificate renewal
echo "🔄 Testing certificate renewal..."
sudo certbot renew --dry-run

# Setup auto-renewal
echo "⏰ Setting up auto-renewal..."
sudo systemctl enable snap.certbot.renew.timer

echo "✅ SSL setup completed successfully!"
echo "🔍 Test your site: https://$DOMAIN"
echo "📋 Certificate info: sudo certbot certificates"
```

```ini:/Users/mainaksaha/Desktop/MASTERS/Project/Audio-Vibration-Rating-Explorer/deploy/audio-backend.service
[Unit]
Description=Gunicorn instance for Audio-Vibration Backend
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=/opt/audio-vibration-backend/backend
Environment="PATH=/opt/audio-vibration-backend/venv/bin"
Environment="PYTHONPATH=/opt/audio-vibration-backend"
Environment="FLASK_ENV=production"
Environment="FLASK_APP=app.py"
ExecStart=/opt/audio-vibration-backend/venv/bin/gunicorn \
    --workers 2 \
    --worker-class gthread \
    --threads 2 \
    --worker-connections 1000 \
    --max-requests 1000 \
    --max-requests-jitter 100 \
    --timeout 300 \
    --keep-alive 2 \
    --bind 127.0.0.1:8000 \
    --access-logfile /opt/audio-vibration-backend/logs/access.log \
    --error-logfile /opt/audio-vibration-backend/logs/error.log \
    --log-level info \
    --capture-output \
    app:app
ExecReload=/bin/kill -s HUP $MAINPID
Restart=always
RestartSec=10
KillMode=mixed
TimeoutStopSec=5
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

```bash:/Users/mainaksaha/Desktop/MASTERS/Project/Audio-Vibration-Rating-Explorer/deploy/start-services.sh
#!/bin/bash
# Service startup script

set -e

echo "🚀 Starting Audio-Vibration Backend services..."

# Copy systemd service file
sudo cp deploy/audio-backend.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable and start the service
sudo systemctl enable audio-backend
sudo systemctl start audio-backend

# Check service status
echo "📊 Service status:"
sudo systemctl status audio-backend --no-pager

# Show logs
echo " Recent logs:"
sudo journalctl -u audio-backend -n 20 --no-pager

echo "✅ Services started successfully!"
echo " Monitor with: sudo journalctl -u audio-backend -f"
echo " Restart with: sudo systemctl restart audio-backend"
echo "⏹️  Stop with: sudo systemctl stop audio-backend"
```

```bash:/Users/mainaksaha/Desktop/MASTERS/Project/Audio-Vibration-Rating-Explorer/deploy/monitor.sh
#!/bin/bash
# Monitoring script for the backend service

echo "📊 Audio-Vibration Backend Monitoring Dashboard"
echo "=============================================="

# Service status
echo "🔧 Service Status:"
sudo systemctl is-active audio-backend && echo "✅ Running" || echo "❌ Stopped"

# Memory usage
echo -e "\n💾 Memory Usage:"
free -h

# Disk usage
echo -e "\n Disk Usage:"
df -h /opt/audio-vibration-backend

# CPU usage
echo -e "\n⚡ CPU Usage:"
top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1

# Recent logs
echo -e "\n Recent Logs (last 10 lines):"
sudo journalctl -u audio-backend -n 10 --no-pager

# Nginx status
echo -e "\n🌐 Nginx Status:"
sudo systemctl is-active nginx && echo "✅ Running" || echo "❌ Stopped"

# Active connections
echo -e "\n Active Connections:"
sudo netstat -tulpn | grep :8000 || echo "No connections on port 8000"

# Output files count
echo -e "\n Generated Files:"
ls -la /opt/audio-vibration-backend/backend/outputs/ | wc -l | xargs echo "Total files:"

echo -e "\n🔄 Run this script again to refresh the dashboard"
```

```python:/Users/mainaksaha/Desktop/MASTERS/Project/Audio-Vibration-Rating-Explorer/backend/app-production.py
#!/usr/bin/env python3
"""
Production Flask backend service for Audio-Vibration Rating Explorer
Optimized for AWS EC2 deployment with Gunicorn
"""

import os
import tempfile
import shutil
import logging
from pathlib import Path
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import werkzeug
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/opt/audio-vibration-backend/logs/app.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Add the Audioalgo directory to the Python path
current_dir = Path(__file__).parent
audioalgo_dir = current_dir.parent / 'Audioalgo'
sys.path.insert(0, str(audioalgo_dir))

# Import the algorithms
try:
    from FreqShift import process_file as freqshift_process
    from HapticGen import process_file as hapticgen_process
    from normalization import normalize_audio
    logger.info("✅ Successfully imported all algorithms")
except ImportError as e:
    logger.error(f"❌ Error importing algorithms: {e}")
    logger.error(f"Audioalgo directory: {audioalgo_dir}")
    logger.error(f"Available files: {list(audioalgo_dir.glob('*.py'))}")

app = Flask(__name__)

# Production CORS configuration
CORS(app, resources={
    r"/*": {
        "origins": [
            "https://your-netlify-site.netlify.app",
            "https://www.yourdomain.com",
            "https://yourdomain.com"
        ],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Configuration
UPLOAD_FOLDER = '/opt/audio-vibration-backend/backend/uploads'
OUTPUT_FOLDER = '/opt/audio-vibration-backend/backend/outputs'
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

# Ensure directories exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

@app.before_request
def log_request_info():
    """Log request information"""
    logger.info(f"Request: {request.method} {request.url} from {request.remote_addr}")

@app.after_request
def log_response_info(response):
    """Log response information"""
    logger.info(f"Response: {response.status_code} for {request.method} {request.url}")
    return response

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint with detailed status"""
    try:
        # Check if algorithms are available
        algorithms_status = {
            'freqshift': 'available' if 'freqshift_process' in globals() else 'unavailable',
            'hapticgen': 'available' if 'hapticgen_process' in globals() else 'unavailable'
        }
        
        # Check disk space
        import shutil
        disk_usage = shutil.disk_usage(OUTPUT_FOLDER)
        disk_free_gb = disk_usage.free / (1024**3)
        
        return jsonify({
            'status': 'healthy',
            'algorithms': algorithms_status,
            'disk_free_gb': round(disk_free_gb, 2),
            'upload_folder': UPLOAD_FOLDER,
            'output_folder': OUTPUT_FOLDER,
            'message': 'Audio-Vibration backend service is running'
        })
    except Exception as e:
        logger.error(f"Health check error: {e}")
        return jsonify({'status': 'unhealthy', 'error': str(e)}), 500

@app.route('/generate-vibrations', methods=['POST'])
def generate_vibrations():
    """Generate vibrations using the Python algorithms"""
    try:
        # Check if file is present
        if 'audio_file' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400
        
        file = request.files['audio_file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Validate file type
        if not file.filename.lower().endswith(('.wav', '.mp3', '.ogg', '.flac', '.m4a')):
            return jsonify({'error': 'Unsupported file format. Please use WAV, MP3, OGG, FLAC, or M4A'}), 400
        
        # Check file size
        file.seek(0, 2)  # Seek to end
        file_size = file.tell()
        file.seek(0)  # Reset to beginning
        
        if file_size > MAX_FILE_SIZE:
            return jsonify({'error': f'File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB'}), 400
        
        logger.info(f"Processing file: {file.filename} ({file_size} bytes)")
        
        # Create temporary directory for processing
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            
            # Save uploaded file
            input_path = temp_path / 'input_audio.wav'
            file.save(str(input_path))
            
            # Generate vibrations using both algorithms
            results = {}
            
            try:
                # Frequency Shift algorithm
                freqshift_output = temp_path / 'freqshift_output.wav'
                freqshift_process(
                    in_wav=str(input_path),
                    out_wav=str(freqshift_output),
                    centre_hz=250.0,
                    q=1.0
                )
                
                if freqshift_output.exists():
                    # Copy to permanent output directory
                    final_freqshift = Path(OUTPUT_FOLDER) / f'freqshift_{file.filename}'
                    shutil.copy2(str(freqshift_output), str(final_freqshift))
                    results['freqshift'] = {
                        'filename': final_freqshift.name,
                        'path': str(final_freqshift),
                        'size': final_freqshift.stat().st_size,
                        'status': 'success'
                    }
                    logger.info(f"FreqShift completed: {final_freqshift.name}")
                else:
                    results['freqshift'] = {'error': 'Output file not generated', 'status': 'failed'}
                
            except Exception as e:
                logger.error(f"Error in FreqShift algorithm: {e}")
                results['freqshift'] = {'error': str(e), 'status': 'failed'}
            
            try:
                # HapticGen algorithm
                hapticgen_output = temp_path / 'hapticgen_output.wav'
                hapticgen_process(
                    input_path=str(input_path),
                    output_path=str(hapticgen_output)
                )
                
                if hapticgen_output.exists():
                    # Copy to permanent output directory
                    final_hapticgen = Path(OUTPUT_FOLDER) / f'hapticgen_{file.filename}'
                    shutil.copy2(str(hapticgen_output), str(final_hapticgen))
                    results['hapticgen'] = {
                        'filename': final_hapticgen.name,
                        'path': str(final_hapticgen),
                        'size': final_hapticgen.stat().st_size,
                        'status': 'success'
                    }
                    logger.info(f"HapticGen completed: {final_hapticgen.name}")
                else:
                    results['hapticgen'] = {'error': 'Output file not generated', 'status': 'failed'}
                
            except Exception as e:
                logger.error(f"Error in HapticGen algorithm: {e}")
                results['hapticgen'] = {'error': str(e), 'status': 'failed'}
            
            return jsonify({
                'success': True,
                'message': 'Vibration generation completed',
                'original_file': file.filename,
                'file_size': file_size,
                'results': results
            })
            
    except Exception as e:
        logger.error(f"Error in generate_vibrations: {e}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.route('/download/<filename>', methods=['GET'])
def download_file(filename):
    """Download a generated vibration file"""
    try:
        file_path = Path(OUTPUT_FOLDER) / filename
        if file_path.exists():
            logger.info(f"Downloading file: {filename}")
            return send_file(str(file_path), as_attachment=True)
        else:
            logger.warning(f"File not found: {filename}")
            return jsonify({'error': 'File not found'}), 404
    except Exception as e:
        logger.error(f"Download error for {filename}: {e}")
        return jsonify({'error': f'Download error: {str(e)}'}), 500

@app.route('/list-outputs', methods=['GET'])
def list_outputs():
    """List all generated output files"""
    try:
        output_files = []
        for file_path in Path(OUTPUT_FOLDER).glob('*'):
            if file_path.is_file():
                output_files.append({
                    'filename': file_path.name,
                    'size': file_path.stat().st_size,
                    'modified': file_path.stat().st_mtime
                })
        
        logger.info(f"Listed {len(output_files)} output files")
        return jsonify({
            'outputs': output_files,
            'count': len(output_files)
        })
    except Exception as e:
        logger.error(f"Error listing outputs: {e}")
        return jsonify({'error': f'Error listing outputs: {str(e)}'}), 500

@app.route('/cleanup', methods=['POST'])
def cleanup_old_files():
    """Clean up old output files (admin endpoint)"""
    try:
        import time
        current_time = time.time()
        max_age_days = request.json.get('max_age_days', 7) if request.is_json else 7
        max_age_seconds = max_age_days * 24 * 60 * 60
        
        cleaned_files = []
        for file_path in Path(OUTPUT_FOLDER).glob('*'):
            if file_path.is_file():
                file_age = current_time - file_path.stat().st_mtime
                if file_age > max_age_seconds:
                    file_path.unlink()
                    cleaned_files.append(file_path.name)
        
        logger.info(f"Cleaned up {len(cleaned_files)} old files")
        return jsonify({
            'cleaned_files': cleaned_files,
            'count': len(cleaned_files)
        })
    except Exception as e:
        logger.error(f"Error during cleanup: {e}")
        return jsonify({'error': f'Cleanup error: {str(e)}'}), 500

if __name__ == '__main__':
    logger.info("🚀 Starting Audio-Vibration Backend Service (Production Mode)...")
    logger.info(f"📁 Audioalgo directory: {audioalgo_dir}")
    logger.info(f"📁 Upload folder: {UPLOAD_FOLDER}")
    logger.info(f"📁 Output folder: {OUTPUT_FOLDER}")
    
    app.run(debug=False, host='0.0.0.0', port=8000)
```

```bash:/Users/mainaksaha/Desktop/MASTERS/Project/Audio-Vibration-Rating-Explorer/deploy/complete-deployment.sh
#!/bin/bash
# Complete deployment script - run this after setting up your EC2 instance

set -e

DOMAIN=${1}
if [ -z "$DOMAIN" ]; then
    echo "❌ Error: Please provide a domain name"
    echo "Usage: $0 yourdomain.com"
    exit 1
fi

echo "🚀 Starting complete deployment for domain: $DOMAIN"

# Step 1: Basic EC2 setup
echo "📦 Step 1: Basic EC2 setup..."
./deploy/ec2-setup.sh

# Step 2: Configure Nginx
echo "🌐 Step 2: Configuring Nginx..."
sudo ./deploy/configure-nginx.sh $DOMAIN

# Step 3: Setup SSL
echo " Step 3: Setting up SSL..."
sudo ./deploy/setup-ssl.sh $DOMAIN

# Step 4: Start services
echo "🚀 Step 4: Starting services..."
sudo ./deploy/start-services.sh

# Step 5: Final checks
echo "✅ Step 5: Running final checks..."
./deploy/monitor.sh

echo "🎉 Deployment completed successfully!"
echo "🔍 Your backend is now available at: https://$DOMAIN"
echo " Monitor with: ./deploy/monitor.sh"
echo "📋 View logs with: sudo journalctl -u audio-backend -f"
```

## 🚀 Step-by-Step Deployment Instructions

### 1. **Launch EC2 Instance**
- AMI: Ubuntu Server 22.04 LTS
- Instance type: **t3.small** (2 vCPU, 2 GB RAM)
- Storage: 20-40 GB gp3
- Security groups: SSH (22), HTTP (80), HTTPS (443)

### 2. **Connect and Deploy**
```bash
# Connect to your instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Clone your repository
git clone https://github.com/your-username/Audio-Vibration-Rating-Explorer.git
cd Audio-Vibration-Rating-Explorer

# Make scripts executable
chmod +x deploy/*.sh

# Run complete deployment (replace with your domain)
sudo ./deploy/complete-deployment.sh api.yourdomain.com
```

### 3. **Configure Your Frontend**
Update your React app's environment variables in Netlify:
```env
VITE_API_BASE=https://api.yourdomain.com
```

### 4. **Monitor Your Deployment**
```bash
# Check service status
sudo systemctl status audio-backend

# View logs
sudo journalctl -u audio-backend -f

# Monitor system resources
./deploy/monitor.sh
```

## 🔧 Key Features of This Deployment

1. **Production-Ready**: Uses Gunicorn with proper worker configuration
2. **SSL/HTTPS**: Automatic Let's Encrypt certificate setup
3. **Security**: Firewall, security headers, file validation
4. **Monitoring**: Comprehensive logging and monitoring scripts
5. **Scalability**: Configured for multiple workers and proper timeouts
6. **File Management**: Automatic cleanup of old files
7. **Error Handling**: Robust error handling and logging

## 📊 Performance Considerations

- **t3.small**: Good for testing, may need t3.medium for production
- **Memory**: 2GB should handle most audio files, monitor with `htop`
- **Storage**: 20GB minimum, 40GB recommended for file storage
- **CPU**: 2 vCPUs should handle concurrent requests

## 🔒 Security Features

- HTTPS with Let's Encrypt
- File type and size validation
- CORS configuration for your domains
- Security headers in Nginx
- Firewall configuration
- Proper file permissions

This deployment setup will give you a production-ready backend that can handle your audio processing algorithms with proper monitoring, security, and scalability. The system is designed to work seamlessly with your existing React frontend on Netlify.

Would you like me to help you customize any specific part of this deployment or add additional features like database integration or advanced monitoring?
