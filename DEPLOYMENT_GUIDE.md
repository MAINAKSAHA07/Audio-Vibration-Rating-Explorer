# 🚀 Netlify + Backend Deployment Guide

## The Problem
Your React app is deployed on Netlify (HTTPS) but your backend is running on HTTP, causing **mixed content policy violations**.

## Solution: Deploy Backend with HTTPS

### Step 1: Get a Domain (5 minutes)
1. Get a free domain from [Freenom](https://freenom.com) or [Namecheap](https://namecheap.com)
2. Or use a subdomain like `api.yourdomain.com`

### Step 2: Deploy Backend with HTTPS (15 minutes)

#### Option A: Use Your Existing EC2 Setup
```bash
# 1. Connect to your EC2 instance
ssh -i your-key.pem ubuntu@3.144.145.168

# 2. Clone your repo (if not already there)
git clone https://github.com/MAINAKSAHA07/Audio-Vibration-Rating-Explorer.git
cd Audio-Vibration-Rating-Explorer

# 3. Make scripts executable
chmod +x deploy/*.sh

# 4. Run the complete deployment (replace with your domain)
sudo ./deploy/complete-deployment.sh api.yourdomain.com
```

#### Option B: Quick Manual Setup
```bash
# 1. Install Nginx and Certbot
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx -y

# 2. Configure Nginx for your domain
sudo nano /etc/nginx/sites-available/audio-backend
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# 3. Enable the site
sudo ln -s /etc/nginx/sites-available/audio-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 4. Get SSL certificate
sudo certbot --nginx -d api.yourdomain.com

# 5. Start your backend
cd /path/to/your/backend
python3 app.py
```

### Step 3: Update Frontend Configuration

1. **Update the backend config** (already done):
   ```typescript
   // In src/config/backend.ts
   return 'https://api.yourdomain.com'; // Replace with your actual domain
   ```

2. **Set environment variable in Netlify**:
   - Go to your Netlify dashboard
   - Site settings → Environment variables
   - Add: `REACT_APP_BACKEND_URL` = `https://api.yourdomain.com`

### Step 4: Test the Connection

1. **Test backend health**:
   ```bash
   curl https://api.yourdomain.com/health
   ```

2. **Redeploy your Netlify site**:
   - Push changes to trigger a new build
   - Or manually trigger a deploy

## Alternative: Use Netlify Functions (Serverless)

If you prefer not to manage a server, you can convert your backend to Netlify Functions:

### Step 1: Create Netlify Functions
```bash
mkdir netlify/functions
```

### Step 2: Convert Flask endpoints to serverless functions
```javascript
// netlify/functions/generate-vibrations.js
exports.handler = async (event, context) => {
  // Your vibration generation logic here
  // Note: This requires rewriting your Python algorithms in JavaScript
  // or using a Python runtime like Pyodide
};
```

### Step 3: Update netlify.toml
```toml
[build]
  command = "npm run build"
  functions = "netlify/functions"
  publish = "build"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

## Quick Fix for Testing (Temporary)

If you just want to test quickly, you can temporarily disable HTTPS on Netlify:

1. Go to Netlify dashboard
2. Site settings → Domain management
3. Disable "Force HTTPS" (not recommended for production)

## Recommended Approach

**Use Option A (EC2 with HTTPS)** because:
- ✅ Your Python algorithms work as-is
- ✅ Better performance for audio processing
- ✅ More control over the environment
- ✅ Can handle larger files
- ✅ Easier to debug

## Cost Estimate

- **EC2 t3.small**: ~$15/month
- **Domain**: ~$10-15/year
- **Total**: ~$16-17/month

## Need Help?

If you run into issues:
1. Check the deployment logs: `sudo journalctl -u audio-backend -f`
2. Test backend health: `curl https://api.yourdomain.com/health`
3. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`

Your deployment scripts are already excellent - you just need to run them with a proper domain!
