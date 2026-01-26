# Frontend-Backend Integration Guide

This guide explains how the frontend integrates with both the Node.js and Python backends in the DevKit.

## Quick Start

### 1. Start Your Backend

**Option A: Node.js Backend (Bun + Elysia)**
```bash
cd devkit-nodejs-bun-elysia
make start
# Backend runs on http://localhost:3000
```

**Option B: Python Backend (FastAPI)**
```bash
cd devkit-python-fastapi
make start
# Backend runs on http://localhost:8000
```

### 2. Start the Frontend

```bash
cd frontend-shared
cp .env.local.example .env.local

# Edit .env.local to point to your backend
# For Node.js: NEXT_PUBLIC_API_URL=http://localhost:3000
# For Python:  NEXT_PUBLIC_API_URL=http://localhost:8000

bun install
bun dev
# Frontend runs on http://localhost:3001
```

## API Integration Details

### Authentication Flow

#### 1. **Signup** (`POST /auth/signup`)

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "emailVerified": false,
    "twoFactorEnabled": false,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

#### 2. **Login** (`POST /auth/login`)

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (Success):**
```json
{
  "user": { /* user object */ },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

**Response (2FA Required):**
```json
{
  "requiresTwoFactor": true
}
```

#### 3. **Token Refresh** (`POST /auth/refresh`)

**Request:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

#### 4. **Get Current User** (`GET /auth/me`)

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "emailVerified": true,
  "twoFactorEnabled": false,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### OAuth Flow

#### 1. **Initiate OAuth** (Frontend redirects to)

```
GET /auth/oauth/{provider}
```

Where `{provider}` is one of: `google`, `github`, `apple`, `microsoft`, `twitter`

#### 2. **OAuth Callback** (Provider redirects to)

```
GET /auth/oauth/callback?code={code}&state={state}
```

The backend handles the OAuth flow and returns tokens via redirect or response.

### Email Verification

#### 1. **Verify Email** (`POST /auth/verify-email`)

**Request:**
```json
{
  "token": "verification-token-from-email"
}
```

#### 2. **Resend Verification** (`POST /auth/resend-verification`)

**Headers:**
```
Authorization: Bearer {accessToken}
```

### Password Reset

#### 1. **Request Reset** (`POST /auth/forgot-password`)

**Request:**
```json
{
  "email": "user@example.com"
}
```

#### 2. **Reset Password** (`POST /auth/reset-password`)

**Request:**
```json
{
  "token": "reset-token-from-email",
  "password": "NewSecurePass123!"
}
```

### Two-Factor Authentication

#### 1. **Setup 2FA** (`POST /auth/2fa/setup`)

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCode": "data:image/png;base64,...",
  "recoveryCodes": [
    "ABCD-1234",
    "EFGH-5678",
    "IJKL-9012",
    "MNOP-3456",
    "QRST-7890"
  ]
}
```

#### 2. **Verify 2FA** (`POST /auth/2fa/verify`)

**Request:**
```json
{
  "code": "123456",
  "trustDevice": false
}
```

**Response:**
```json
{
  "user": { /* user object */ },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

#### 3. **Disable 2FA** (`POST /auth/2fa/disable`)

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "password": "CurrentPassword123!"
}
```

### User Profile Management

#### 1. **Get Profile** (`GET /users/profile`)

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "avatar": "https://...",
  "bio": "Software Developer",
  "phone": "+1234567890",
  "emailVerified": true,
  "twoFactorEnabled": false,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

#### 2. **Update Profile** (`PATCH /users/profile`)

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "name": "John Smith",
  "bio": "Senior Software Developer",
  "avatar": "https://..."
}
```

#### 3. **Change Password** (`POST /users/change-password`)

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass123!"
}
```

#### 4. **Change Email** (`POST /users/change-email`)

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "newEmail": "newemail@example.com",
  "password": "CurrentPass123!"
}
```

#### 5. **Delete Account** (`DELETE /users/account`)

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "password": "CurrentPass123!"
}
```

## Token Management

### Storage
- Tokens are stored in secure HTTP-only cookies
- Cookie names: `access_token`, `refresh_token`
- Cookies are set with `secure: true` and `sameSite: 'strict'`

### Automatic Refresh
The frontend automatically refreshes tokens when:
1. A request returns 401 Unauthorized
2. The access token has expired
3. Uses request queuing to prevent multiple refresh calls

### Flow
```
1. Request fails with 401
2. Frontend checks for refresh token
3. Calls POST /auth/refresh
4. Updates tokens in cookies
5. Retries original request
6. If refresh fails → redirect to login
```

## CORS Configuration

Your backend must allow:

```javascript
// Node.js (Elysia)
app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Python (FastAPI)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)
```

## Error Handling

### Standard Error Response Format

```json
{
  "error": "ErrorType",
  "message": "Human-readable error message"
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (e.g., email already exists)
- `422` - Unprocessable Entity (validation errors)
- `429` - Too Many Requests (rate limit)
- `500` - Internal Server Error

## Testing the Integration

### 1. Health Check

Test your backend is running:
```bash
curl http://localhost:3000/health  # Node.js
curl http://localhost:8000/health  # Python
```

### 2. Test Signup
```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Test User"}'
```

### 3. Test Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

### 4. Test Protected Endpoint
```bash
curl http://localhost:3000/auth/me \
  -H "Authorization: Bearer {your_access_token}"
```

## Switching Backends

To switch between backends, simply update `.env.local`:

```bash
# Switch to Node.js backend
echo "NEXT_PUBLIC_API_URL=http://localhost:3000" > .env.local

# Switch to Python backend
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Restart the frontend
bun dev
```

## Production Considerations

### 1. Environment Variables
```env
NEXT_PUBLIC_API_URL=https://api.yourapp.com
```

### 2. HTTPS
- Always use HTTPS in production
- Update cookie settings if needed

### 3. CORS
- Update allowed origins to production domain
- Never use `*` in production

### 4. Token Expiry
- Align token expiry between frontend and backend
- Recommended: Access token 15 minutes, Refresh token 7 days

### 5. Rate Limiting
- Implement on backend
- Handle 429 responses gracefully in frontend

## Troubleshooting

### Issue: CORS errors
**Solution:** Check backend CORS configuration and ensure credentials are allowed

### Issue: Token refresh loop
**Solution:** Check token expiry times match between frontend and backend

### Issue: 401 on protected routes
**Solution:** Verify token is being sent in Authorization header

### Issue: Login works but user state not persisting
**Solution:** Check cookie settings (secure, sameSite, httpOnly)

### Issue: OAuth callback fails
**Solution:** Verify redirect URI matches in OAuth provider settings

## Need Help?

- Check backend logs for API errors
- Use browser DevTools Network tab to inspect requests
- Check console for frontend errors
- Verify environment variables are loaded correctly

