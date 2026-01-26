# Authentication Flow Update

## ✅ Fixed: Landing Page → Backend → Main App Flow

### Previous Issue
- Landing page was redirecting back to itself after login
- Backend was sending users to `/oauth/callback` on the landing page
- Session cookies weren't being properly shared with main app

### New Flow

```
1. User visits Landing Page (localhost:3000)
   └─> Clicks "Login" or "Sign Up"

2. Landing Page
   ├─> Email/Password Login
   │   └─> Calls: POST localhost:8000/auth/login
   │       └─> Backend sets session cookie
   │       └─> Frontend redirects to: localhost:3001/dashboard
   │
   ├─> Email/Password Signup
   │   └─> Calls: POST localhost:8000/auth/signup
   │       └─> Shows verification email message
   │       └─> After verification, user goes to login
   │
   └─> Google OAuth
       └─> Redirects to: GET localhost:8000/auth/oauth/google
           └─> Google OAuth flow
           └─> Callback: GET localhost:8000/api/auth/google/callback
               └─> Backend sets session cookie
               └─> Backend redirects to: localhost:3001/dashboard

3. Main App (localhost:3001/dashboard)
   └─> Has session cookie from backend
   └─> Can make authenticated API calls
   └─> Session lasts 6 hours
```

### Production Flow

```
synthatext.itsyash.space (Landing)
         ↓ Login/Signup
api-synthatext.itsyash.space (Backend Auth)
         ↓ Session Cookie + Redirect
app-synthatext.itsyash.space/dashboard (Main App)
```

---

## Changed Files

### Frontend - Landing Page

#### `components/auth/login-form.tsx`
**Before:**
- Used old auth context
- Redirected to `"/"` after login

**After:**
```typescript
import { authService } from "@/lib/auth-service";

const handleSubmit = async (e: React.FormEvent) => {
  const response = await authService.login({ email, password });
  toast.success("Logged in successfully!");
  authService.redirectToApp(); // → localhost:3001/dashboard
};
```

#### `components/auth/signup-form.tsx`
**Before:**
- Used old `useSignup` hook
- Managed state locally

**After:**
```typescript
import { authService } from "@/lib/auth-service";

const handleSubmit = async (e: React.FormEvent) => {
  await authService.signup({ email, password, name });
  setSuccess(true); // Shows verification message
};
```

#### `components/auth/google-button.tsx`
**Before:**
- Used auth context `googleSignIn()`
- Complex flow with loading states

**After:**
```typescript
import { API_ENDPOINTS } from "@/lib/config";

const handleGoogleSignIn = () => {
  window.location.href = API_ENDPOINTS.AUTH.GOOGLE_OAUTH;
};
```

### Backend

#### `app/api/auth_routes.py`
**Before:**
```python
def oauth_callback_handler(...):
    tokens = AuthService.handle_google_oauth_callback(db, code)
    return RedirectResponse(
        f"{settings.frontend_url}/oauth/callback?access_token=...",
        status_code=status.HTTP_302_FOUND,
    )
```

**After:**
```python
def oauth_callback_handler(..., response: Response = None):
    tokens = AuthService.handle_google_oauth_callback(db, code)
    
    # Redirect to MAIN APP dashboard
    redirect_response = RedirectResponse(
        f"{settings.frontend_url}/dashboard",  # → localhost:3001/dashboard
        status_code=status.HTTP_302_FOUND,
    )
    
    # Set session cookie
    redirect_response.set_cookie(
        key="session",
        value=tokens['refreshToken'],
        httponly=True,
        secure=settings.frontend_url.startswith("https"),
        samesite="lax",
        max_age=settings.session_expire_hours * 3600,  # 6 hours
        path="/"
    )
    
    return redirect_response
```

---

## Session Cookie Configuration

### Cookie Properties
- **Name:** `session`
- **Value:** Refresh token from backend
- **HttpOnly:** `true` (JavaScript can't access it)
- **Secure:** `true` in production (HTTPS only)
- **SameSite:** `lax` (allows cookies on top-level navigation)
- **Max-Age:** 21,600 seconds (6 hours)
- **Path:** `/` (available for all routes)

### Cookie Sharing Between Landing & Main App

#### Development (localhost)
**Problem:** Browsers treat different ports as different origins
- `localhost:3000` (landing)
- `localhost:3001` (main app)

**Solution:** Backend sets cookie, both apps can read it because:
1. Both are on `localhost` domain
2. Cookie path is `/` (root)
3. SameSite is `lax` (allows navigation)

#### Production (subdomains)
**Setup:**
- `synthatext.itsyash.space` (landing)
- `app-synthatext.itsyash.space` (main app)
- `api-synthatext.itsyash.space` (backend)

**Solution:** Backend sets cookie with:
- Domain: `.itsyash.space` (shared root domain)
- This allows all subdomains to access the cookie

---

## Testing the Flow

### Local Development

1. **Start all services:**
   ```bash
   # Backend (Terminal 1)
   cd backend
   conda activate ppt
   uvicorn app.main:app --reload --port 8000
   
   # Landing (Terminal 2)
   cd frontend/web/synthatext-fe-landing
   npm run dev  # Port 3000
   
   # Main App (Terminal 3)
   cd frontend/frontend-shared
   npm run dev  # Port 3001
   ```

2. **Test Email/Password Login:**
   - Go to `http://localhost:3000`
   - Click "Login"
   - Enter credentials
   - Should redirect to `http://localhost:3001/dashboard`
   - Check browser cookies: should have `session` cookie

3. **Test Google OAuth:**
   - Go to `http://localhost:3000`
   - Click "Login"
   - Click "Continue with Google"
   - Complete Google auth
   - Should redirect to `http://localhost:3001/dashboard`
   - Check browser cookies: should have `session` cookie

4. **Test Main App:**
   - Visit `http://localhost:3001/dashboard`
   - Should see PPT generation form
   - Create a presentation
   - All API calls should work (authenticated via session cookie)

### Verify Session Cookie

**Chrome DevTools:**
1. Open DevTools (F12)
2. Go to Application tab
3. Click "Cookies" → "http://localhost:3001"
4. Look for `session` cookie
5. Should see:
   - Value: Long refresh token string
   - HttpOnly: ✓
   - Path: /
   - Max-Age: 21600

---

## Environment Variables

### Backend (`.env`)
```env
FRONTEND_URL=http://localhost:3001  # Main app URL
SESSION_EXPIRE_HOURS=6
```

### Landing (`.env.local`)
```env
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_LANDING_URL=http://localhost:3000
```

### Main App (`.env`)
```env
NEXT_PUBLIC_AUTH_API_URL=http://localhost:8000
NEXT_PUBLIC_PPT_API_URL=http://localhost:8000
```

---

## Troubleshooting

### Issue: Redirects to landing page instead of main app
**Solution:** Check `FRONTEND_URL` in backend `.env` - should be `http://localhost:3001`

### Issue: Session cookie not set
**Solution:** Check browser Network tab → Response Headers → `Set-Cookie`

### Issue: Main app says "Unauthorized"
**Solution:**
1. Check cookies are being sent with requests
2. Verify `credentials: 'include'` in fetch calls
3. Check CORS allows credentials

### Issue: Google OAuth redirect URI mismatch
**Solution:** Ensure Google Console has `http://localhost:8000/api/auth/google/callback`

---

*Last Updated: January 25, 2026*
