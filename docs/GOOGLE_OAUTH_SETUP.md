# Google OAuth Configuration Guide

## 🔧 Required Changes in Google Cloud Console

Since you're deploying with different domains, you need to update your Google OAuth configuration.

---

## 📝 Current Setup (Development)
- ✅ `http://localhost:3000/api/auth/google/callback` (if already added)
- ✅ `http://localhost:8000/api/auth/google/callback` ✅ **ALREADY CONFIGURED**

---

## 🚀 Production Setup (NEW - TO BE ADDED)

### Authorized Redirect URIs to Add:

1. **Production Backend Callback** (PRIMARY):
   ```
   https://api-synthatext.itsyash.space/api/auth/google/callback
   ```

### Optional (for testing):
2. **Localhost Variants** (keep for local development):
   ```
   http://localhost:8000/api/auth/google/callback
   http://localhost:3000/api/auth/google/callback
   ```

---

## 📋 Step-by-Step Instructions

### 1. Go to Google Cloud Console
Navigate to: https://console.cloud.google.com

### 2. Select Your Project
Click on the project dropdown at the top

### 3. Navigate to Credentials
- Click **APIs & Services** in the left menu
- Click **Credentials**

### 4. Find Your OAuth 2.0 Client ID
- Look for your existing client (should have localhost:8000 already)
- Click on the client name to edit

### 5. Add Production Redirect URI
Under **Authorized redirect URIs**, click **+ ADD URI** and add:
```
https://api-synthatext.itsyash.space/api/auth/google/callback
```

### 6. Save Changes
Click **SAVE** at the bottom

---

## ✅ Final Redirect URIs List

Your Google OAuth client should have these URIs:

**Development:**
- ✅ `http://localhost:8000/api/auth/google/callback`

**Production:**
- ✅ `https://api-synthatext.itsyash.space/api/auth/google/callback`

---

## 🧪 Testing

### Development
1. Start backend: `cd backend && uvicorn app.main:app --port 8000`
2. Visit: `http://localhost:3000/login`
3. Click "Sign in with Google"
4. Should redirect to Google OAuth
5. After auth, should redirect to `http://localhost:3001/dashboard`

### Production
1. Visit: `https://synthatext.itsyash.space/login`
2. Click "Sign in with Google"
3. Should redirect to Google OAuth
4. After auth, should redirect to `https://app-synthatext.itsyash.space/dashboard`

---

## 🔐 Environment Variables

### Backend (.env)
```bash
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_REDIRECT_URI=https://api-synthatext.itsyash.space/api/auth/google/callback
FRONTEND_URL=https://app-synthatext.itsyash.space
```

### Landing Page (.env.local)
```bash
NEXT_PUBLIC_BACKEND_API_URL=https://api-synthatext.itsyash.space
NEXT_PUBLIC_APP_URL=https://app-synthatext.itsyash.space
```

---

## ⚠️ Important Notes

1. **Callback URL Must Match Exactly**
   - The URI in Google Console must match the one in your backend `.env`
   - Include `https://` for production, `http://` for localhost
   - No trailing slashes

2. **Domain Must Be Accessible**
   - Ensure `api-synthatext.itsyash.space` is publicly accessible
   - SSL certificate must be valid
   - DNS must be properly configured

3. **Testing Locally First**
   - Always test with `localhost:8000` callback first
   - Then add production callback
   - Keep both for easier debugging

---

## 🎯 Quick Checklist

Before deploying to production:

- [ ] Google OAuth redirect URI added: `https://api-synthatext.itsyash.space/api/auth/google/callback`
- [ ] DNS configured for all three domains
- [ ] SSL certificates obtained
- [ ] Backend `.env` updated with production GOOGLE_REDIRECT_URI
- [ ] Frontend `.env` files updated with production URLs
- [ ] Test OAuth flow on localhost first
- [ ] Deploy and test on production

---

*Last Updated: January 25, 2026*
