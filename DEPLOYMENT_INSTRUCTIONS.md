# 🚀 Audio-Vibration Deployment Instructions

## Current Status
✅ **Backend Working**: Your EC2 backend at `3.144.145.168:5000` is healthy and running all algorithms  
✅ **Frontend Ready**: Netlify app is configured and ready to deploy  
⚠️ **HTTPS Needed**: Need to set up HTTPS to avoid mixed content issues  

## Option 1: Quick Test (Immediate)

### 1. Test Current Setup
```bash
# Test backend health
curl http://3.144.145.168:5000/health

# Should return:
# {"algorithms":["freqshift","hapticgen","percept","pitch","model1","model2"],"status":"healthy"}
```

### 2. Update Frontend for Testing
Temporarily use the test configuration:

```typescript
// In your React components, import:
import { BACKEND_CONFIG_TEST } from './config/backend-test';

// Use BACKEND_CONFIG_TEST instead of BACKEND_CONFIG
```

### 3. Deploy and Test
```bash
git add .
git commit -m "Add test backend configuration"
git push origin main
```

## Option 2: Production Setup (Recommended)

### 1. Get a Domain
- Get a domain like `api.audiovibration.com` or `backend.audiovibration.com`
- Point it to your EC2 IP: `3.144.145.168`

### 2. Set Up HTTPS on EC2
```bash
# SSH into your EC2 instance
ssh -i your-key.pem ubuntu@3.144.145.168

# Run the HTTPS setup script
chmod +x setup-https-backend.sh
sudo ./setup-https-backend.sh api.audiovibration.com
```

### 3. Update Frontend Configuration
The main `backend.ts` is already configured to use `https://api.audiovibration.com`

### 4. Deploy
```bash
git add .
git commit -m "Configure HTTPS backend"
git push origin main
```

## Option 3: Use Netlify Functions (Alternative)

If you want everything on Netlify:

### 1. Create Netlify Functions
```bash
mkdir netlify/functions
```

### 2. Convert Python to JavaScript
- Use Pyodide to run Python in the browser
- Or rewrite algorithms in JavaScript
- This is more complex but keeps everything on Netlify

## 🎯 Recommended Approach

**Use Option 2** because:
- ✅ Your Python algorithms work as-is
- ✅ Better performance for audio processing
- ✅ No code rewriting needed
- ✅ Professional setup with HTTPS

## 🔧 Troubleshooting

### Backend Not Responding
```bash
# Check if Flask is running
sudo systemctl status audio-backend

# Restart if needed
sudo systemctl restart audio-backend

# Check logs
sudo journalctl -u audio-backend -f
```

### Mixed Content Errors
- Make sure backend uses HTTPS
- Check browser console for specific errors
- Verify CORS settings in Flask app

### Domain Not Working
```bash
# Test DNS resolution
nslookup api.audiovibration.com

# Test HTTPS
curl https://api.audiovibration.com/health
```

## 📊 Current Architecture

```
Development:
├── Frontend: http://localhost:3000 (React)
└── Backend:  http://localhost:8000 (Flask)

Production:
├── Frontend: https://audiovibration.netlify.app (Netlify)
└── Backend:  https://api.audiovibration.com (EC2 with HTTPS)
```

## 🚀 Next Steps

1. **Choose your approach** (Option 1 for quick test, Option 2 for production)
2. **Follow the steps** for your chosen option
3. **Test the connection** from your Netlify app
4. **Monitor the logs** for any issues

Your backend is working perfectly - you just need to set up the HTTPS connection! 🎵
