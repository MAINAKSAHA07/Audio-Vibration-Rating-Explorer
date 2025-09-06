#!/bin/bash
# HTTPS Setup Script for Audio-Vibration Backend
# Run this script on your EC2 instance to set up HTTPS

set -e

echo "🔐 Setting up HTTPS for Audio-Vibration Backend..."

# Check if domain is provided
if [ -z "$1" ]; then
    echo "❌ Error: Please provide a domain name"
    echo "Usage: $0 api.yourdomain.com"
    echo "Example: $0 api.audiovibration.com"
    exit 1
fi

DOMAIN=$1
echo "🌐 Setting up HTTPS for domain: $DOMAIN"

# Update system
echo "📦 Updating system packages..."
sudo apt update

# Install Nginx and Certbot
echo "🔧 Installing Nginx and Certbot..."
sudo apt install -y nginx certbot python3-certbot-nginx

# Create Nginx configuration
echo "⚙️ Creating Nginx configuration..."
sudo tee /etc/nginx/sites-available/audio-backend > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

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

    # Main application - proxy to Flask on port 5000
    location / {
        proxy_pass http://127.0.0.1:5000;
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
        proxy_pass http://127.0.0.1:5000/health;
        access_log off;
    }

    # Logging
    access_log /var/log/nginx/audio-backend-access.log;
    error_log /var/log/nginx/audio-backend-error.log;
}
EOF

# Enable the site
echo "🔗 Enabling Nginx site..."
sudo ln -sf /etc/nginx/sites-available/audio-backend /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
echo "🧪 Testing Nginx configuration..."
sudo nginx -t

# Start and enable Nginx
echo "🚀 Starting Nginx..."
sudo systemctl enable nginx
sudo systemctl start nginx
sudo systemctl reload nginx

# Get SSL certificate
echo "🔐 Obtaining SSL certificate..."
sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN

# Test certificate renewal
echo "🔄 Testing certificate renewal..."
sudo certbot renew --dry-run

# Setup auto-renewal
echo "⏰ Setting up auto-renewal..."
sudo systemctl enable snap.certbot.renew.timer

echo "✅ HTTPS setup completed successfully!"
echo "🔍 Your backend is now available at: https://$DOMAIN"
echo "📋 Test with: curl https://$DOMAIN/health"
echo "📋 View logs: sudo tail -f /var/log/nginx/audio-backend-*.log"
echo ""
echo "🎯 Next steps:"
echo "1. Update your DNS to point $DOMAIN to this server's IP"
echo "2. Update your frontend config to use: https://$DOMAIN"
echo "3. Test the connection from your Netlify app"
