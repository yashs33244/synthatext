# DevKit - Shared Frontend

A production-ready Next.js frontend with complete authentication flows that works seamlessly with both Node.js (Bun + Elysia) and Python (FastAPI) backends.

## Features

### 🔐 Complete Authentication System
- **Email/Password Authentication**: Secure signup and login
- **OAuth2 Providers**: Google, GitHub, Apple, Microsoft, Twitter/X
- **Email Verification**: Complete verification flow
- **Password Reset**: Forgot password and reset functionality
- **Two-Factor Authentication (2FA)**: TOTP-based setup and verification
- **Protected Routes**: Automatic authentication checks

### 🎨 Modern UI Components
- Built with **shadcn/ui** components
- Fully responsive design
- Dark mode support
- Beautiful animations with **Tailwind CSS**
- Accessible components following best practices

### 📱 Pages Included
- Login / Signup
- Email Verification
- Password Reset / Forgot Password
- 2FA Setup / Verification
- Dashboard (protected)
- Profile Management (protected)
- Settings (protected)

## Getting Started

### Prerequisites
- Node.js 18+ or Bun
- Backend service running (Node.js on port 3000 or Python on port 8000)

### Installation

1. **Install dependencies:**
   ```bash
   # Using npm
   npm install

   # Using bun (recommended)
   bun install

   # Using pnpm
   pnpm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env.local
   ```

3. **Update `.env.local` with your backend URL:**
   ```env
   # For Node.js backend (default)
   NEXT_PUBLIC_API_URL=http://localhost:3000

   # OR for Python backend
   # NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   # or
   bun dev
   # or
   pnpm dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3001](http://localhost:3001)

## Backend Integration

### API Endpoints Expected

The frontend expects the following API endpoints from your backend:

#### Authentication
- `POST /auth/signup` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user
- `POST /auth/refresh` - Refresh access token
- `POST /auth/verify-email` - Verify email with token
- `POST /auth/resend-verification` - Resend verification email
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password with token

#### Two-Factor Authentication
- `POST /auth/2fa/setup` - Setup 2FA
- `POST /auth/2fa/verify` - Verify 2FA code
- `POST /auth/2fa/disable` - Disable 2FA

#### OAuth
- `GET /auth/oauth/{provider}` - Initiate OAuth flow
- `GET /auth/oauth/callback` - OAuth callback handler

#### User Management
- `GET /users/profile` - Get user profile
- `PATCH /users/profile` - Update user profile
- `POST /users/change-password` - Change password
- `POST /users/change-email` - Change email
- `DELETE /users/account` - Delete account

### Response Format

All API responses should follow this structure:

```typescript
// Success response
{
  user: {
    id: string
    email: string
    name?: string
    avatar?: string
    emailVerified: boolean
    twoFactorEnabled: boolean
    createdAt: string
    updatedAt: string
  },
  accessToken: string
  refreshToken: string
}

// Error response
{
  error: string
  message: string
}
```

## Project Structure

```
frontend-shared/
├── app/                      # Next.js app directory
│   ├── (auth)/              # Auth routes group
│   │   ├── login/
│   │   ├── signup/
│   │   ├── forgot-password/
│   │   ├── reset-password/
│   │   ├── verify-email/
│   │   ├── 2fa/
│   │   └── oauth/
│   ├── (protected)/         # Protected routes group
│   │   ├── dashboard/
│   │   ├── profile/
│   │   └── settings/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/              # React components
│   ├── auth/               # Auth-specific components
│   ├── layout/             # Layout components
│   └── ui/                 # shadcn/ui components
├── context/                # React contexts
│   └── auth-context.tsx   # Authentication state
├── hooks/                  # Custom React hooks
│   ├── use-toast.ts
│   ├── use-mobile.ts
│   └── use-user.ts
├── lib/                    # Utility libraries
│   ├── api.ts             # API client with interceptors
│   ├── utils.ts           # Helper functions
│   └── validators.ts      # Form validation
├── types/                  # TypeScript types
│   ├── auth.ts
│   └── user.ts
└── public/                # Static assets

```

## Switching Between Backends

The frontend is designed to work with both backends without code changes. Simply update the environment variable:

**For Node.js Backend (Bun + Elysia):**
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**For Python Backend (FastAPI):**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Authentication Flow

### Token Management
- Access tokens are stored in secure HTTP-only cookies
- Automatic token refresh on 401 responses
- Request queuing during token refresh
- Automatic logout on refresh failure

### Protected Routes
Protected routes automatically redirect to login if the user is not authenticated:
```tsx
// This is handled automatically by the (protected) route group
// No additional code needed!
```

## Customization

### Adding shadcn/ui Components

The project uses shadcn/ui for components. To add new components:

```bash
# Using bun (recommended for this project)
bunx --bun shadcn@latest add button

# Using npm
npx shadcn@latest add button

# Using pnpm
pnpm dlx shadcn@latest add button
```

### Styling

- Tailwind CSS is configured and ready to use
- Global styles in `app/globals.css`
- Component-specific styles using Tailwind classes
- Dark mode supported out of the box

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:3000` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (optional) | - |
| `NEXT_PUBLIC_UNLEASH_URL` | Unleash feature flags URL (optional) | - |
| `NEXT_PUBLIC_UNLEASH_CLIENT_KEY` | Unleash client key (optional) | - |

## Production Deployment

### Build for Production

```bash
npm run build
npm start
```

### Environment Variables for Production

Make sure to set these in your production environment:
- `NEXT_PUBLIC_API_URL` - Your production backend URL
- Enable HTTPS for secure cookie transmission
- Update CORS settings in your backend

### Docker Deployment

A Dockerfile is included for containerized deployment:

```bash
docker build -t devkit-frontend .
docker run -p 3000:3000 -e NEXT_PUBLIC_API_URL=https://api.yourapp.com devkit-frontend
```

## Testing

### Running Type Checks
```bash
npm run type-check
```

### Linting
```bash
npm run lint
npm run lint:fix
```

## Troubleshooting

### CORS Issues
If you encounter CORS errors, ensure your backend has proper CORS configuration:
- Allow origin: `http://localhost:3001` (development)
- Allow credentials: `true`
- Allow methods: `GET, POST, PUT, PATCH, DELETE, OPTIONS`
- Allow headers: `Content-Type, Authorization`

### Token Refresh Issues
If you see repeated 401 errors:
1. Check that your backend `/auth/refresh` endpoint is working
2. Verify refresh tokens are being stored correctly
3. Check token expiration times match between frontend and backend

### Component Import Errors
If shadcn/ui components aren't found:
```bash
# Reinstall dependencies
rm -rf node_modules
bun install  # or npm install
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Hook Form](https://react-hook-form.com)
- [Zod Validation](https://zod.dev)

## License

MIT
