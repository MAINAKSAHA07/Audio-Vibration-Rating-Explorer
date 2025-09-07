# AWS Backend Configuration

## Environment Variables for Production

Create a `.env.local` file in your project root with the following variables:

```bash
# Backend Configuration
REACT_APP_BACKEND_URL=http://3.138.192.243:5000

# AWS Configuration (if using S3 for audio files)
REACT_APP_AWS_ENABLED=false
REACT_APP_AWS_BUCKET_NAME=aduiovibrations
REACT_APP_AWS_REGION=us-east-2
REACT_APP_AWS_ACCESS_KEY_ID=
REACT_APP_AWS_SECRET_ACCESS_KEY=

# Feature Flags
REACT_APP_FALLBACK_TO_LOCAL=true
REACT_APP_PRELOAD_AUDIO=false
```

## For Netlify Deployment

The app is configured to automatically use Netlify's proxy in production to avoid mixed content issues. No additional environment variables are needed for the backend connection.

If you need to override the backend URL, add these environment variables in your Netlify dashboard:

1. Go to Site Settings → Environment Variables
2. Add the following variables (optional):

```
REACT_APP_BACKEND_URL = http://3.138.192.243:5000
REACT_APP_AWS_ENABLED = false
REACT_APP_FALLBACK_TO_LOCAL = true
REACT_APP_PRELOAD_AUDIO = false
```

**Note:** The app automatically uses `/api` proxy in production, which routes to your EC2 backend through Netlify's secure proxy.

## Testing the Connection

1. **Local Development:**
   ```bash
   npm start
   # Open http://localhost:3000
   # Check browser console for backend connection logs
   ```

2. **Test Backend Health:**
   ```bash
   curl http://3.138.192.243:5000/health
   ```

3. **Expected Response:**
   ```json
   {
     "status": "healthy",
     "algorithms": ["freqshift", "hapticgen", "percept", "pitch", "model1", "model2"],
     "message": "Audio-Vibration backend service is running"
   }
   ```

## Troubleshooting

### Mixed Content Issues
If you get mixed content errors (HTTPS frontend trying to access HTTP backend):

1. **For Development:** Allow mixed content in your browser
2. **For Production:** The app now uses Netlify's proxy feature to route API calls through HTTPS, avoiding mixed content issues

### CORS Issues
Make sure your backend has CORS enabled for your frontend domain.

### Connection Issues
1. Check if your EC2 instance is running
2. Verify security groups allow port 5000
3. Check if your backend service is running on the EC2 instance
