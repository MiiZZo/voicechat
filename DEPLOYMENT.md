# 🚀 Deployment Guide

## XHR Poll Error - Troubleshooting

### Common Causes and Solutions:

#### 1. **CORS Configuration Issues**
```javascript
// ❌ Wrong - too permissive
cors: { origin: "*" }

// ✅ Correct - specific origins
cors: {
  origin: [
    "https://your-domain.vercel.app",
    "https://your-domain.netlify.app"
  ],
  credentials: true
}
```

#### 2. **Environment Variables**
Create these environment variables in your hosting platform:

**Vercel:**
```bash
NODE_ENV=production
CLIENT_URL=https://your-app.vercel.app
NEXT_PUBLIC_SOCKET_URL=https://your-app.vercel.app
```

**Netlify:**
```bash
NODE_ENV=production
CLIENT_URL=https://your-app.netlify.app
NEXT_PUBLIC_SOCKET_URL=https://your-app.netlify.app
```

#### 3. **Platform-Specific Issues**

**Vercel:**
- ✅ Works out of the box
- ✅ Automatic HTTPS
- ✅ Edge functions support

**Netlify:**
- ⚠️ May need `_redirects` file:
```
/api/socketio/* /api/socketio 200
```

**Railway/Render:**
- ⚠️ May need custom port configuration
- ⚠️ Check if WebSocket upgrade is supported

#### 4. **Network/Firewall Issues**
- Corporate firewalls often block WebSocket connections
- Use polling transport as fallback
- Check if port 443 (HTTPS) is accessible

#### 5. **SSL/HTTPS Issues**
- Socket.io requires HTTPS in production
- Ensure SSL certificate is valid
- Check for mixed content warnings

### Debugging Steps:

1. **Check Browser Console:**
```javascript
// Add to your app for debugging
console.log('Socket connection state:', socket.connected)
console.log('Socket transport:', socket.io.engine.transport.name)
```

2. **Test Connection:**
```bash
# Test if your API endpoint is accessible
curl -I https://your-domain.com/api/socketio/
```

3. **Check Network Tab:**
- Look for failed XHR requests
- Check response headers
- Verify CORS headers are present

### Production Configuration:

#### Server-side (src/lib/socket.ts):
```javascript
const io = new ServerIO(res.socket.server, {
  path: '/api/socketio',
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true
  },
  transports: ['polling', 'websocket'],
  upgrade: true,
  rememberUpgrade: true
})
```

#### Client-side (src/hooks/useVoiceChat.ts):
```javascript
const socket = io({
  path: '/api/socketio',
  transports: ['polling', 'websocket'],
  withCredentials: true,
  upgrade: true,
  rememberUpgrade: true
})
```

### Platform-Specific Deployment:

#### Vercel:
1. Connect your GitHub repo
2. Set environment variables in dashboard
3. Deploy automatically

#### Netlify:
1. Connect your GitHub repo
2. Set environment variables
3. Add `_redirects` file if needed
4. Deploy

#### Railway:
1. Connect GitHub repo
2. Set environment variables
3. Ensure WebSocket support is enabled

### Testing After Deployment:

1. **Open browser console**
2. **Check for connection logs**
3. **Test with multiple users**
4. **Verify audio works**

### Common Error Messages:

- `xhr poll error` → CORS or network issue
- `websocket error` → WebSocket blocked, fallback to polling
- `connection timeout` → Server not responding
- `CORS error` → Origin not allowed

### Quick Fixes:

1. **Force polling only:**
```javascript
transports: ['polling']
```

2. **Disable credentials:**
```javascript
withCredentials: false
```

3. **Increase timeout:**
```javascript
timeout: 30000
```

### Support:

If issues persist:
1. Check hosting platform documentation
2. Test with different browsers
3. Try different network (mobile hotspot)
4. Check server logs for errors
