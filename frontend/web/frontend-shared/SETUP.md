# Frontend Setup Guide

Quick setup guide for the DevKit shared frontend.

## Prerequisites

- Node.js 18+ (or Bun recommended)
- A running backend (Node.js on port 3000 OR Python on port 8000)

## Step-by-Step Setup

### 1. Install Dependencies

Choose your package manager:

```bash
# Using Bun (Recommended - fastest)
bun install

# Using npm
npm install

# Using pnpm
pnpm install

# Using yarn
yarn install
```

### 2. Configure Environment

```bash
# Copy the example environment file
cp .env.local.example .env.local
```

Edit `.env.local`:

**For Node.js Backend (Bun + Elysia):**
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**For Python Backend (FastAPI):**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Start Development Server

```bash
# Using Bun
bun dev

# Using npm
npm run dev

# Using pnpm
pnpm dev

# Using yarn
yarn dev
```

The frontend will start on **http://localhost:3001**

### 4. Verify It's Working

1. Open http://localhost:3001 in your browser
2. You should see the landing page
3. Click "Login" or "Sign Up"
4. The auth pages should load properly

## Backend Integration

### Starting the Node.js Backend

```bash
cd ../devkit-nodejs-bun-elysia
make start
# or
docker-compose up -d
```

### Starting the Python Backend

```bash
cd ../devkit-python-fastapi
make start
# or
docker-compose up -d
```

## Common Issues

### Issue: "Failed to fetch" errors

**Cause:** Backend is not running or CORS is not configured

**Solution:**
1. Make sure your backend is running
2. Check the backend logs for CORS errors
3. Verify `NEXT_PUBLIC_API_URL` matches your backend URL

### Issue: Port 3001 is already in use

**Solution:**
```bash
# Kill the process using port 3001
lsof -ti:3001 | xargs kill -9

# Or use a different port
PORT=3002 bun dev
```

### Issue: Environment variables not loading

**Solution:**
1. Ensure `.env.local` exists (not `.env`)
2. Restart the dev server after changing env vars
3. Clear Next.js cache: `rm -rf .next`

### Issue: Module not found errors

**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules
rm pnpm-lock.yaml  # or package-lock.json or yarn.lock
bun install
```

## Production Build

### Build the application:

```bash
bun run build
# or
npm run build
```

### Run production server:

```bash
bun start
# or
npm start
```

### Build Docker image:

```bash
docker build -t devkit-frontend .
docker run -p 3001:3001 \
  -e NEXT_PUBLIC_API_URL=https://api.yourapp.com \
  devkit-frontend
```

## Available Scripts

- `bun dev` - Start development server
- `bun build` - Build for production
- `bun start` - Start production server
- `bun run lint` - Run ESLint
- `bun run lint:fix` - Fix ESLint errors
- `bun run type-check` - Check TypeScript types
- `bun run docker:build` - Build Docker image
- `bun run docker:run` - Run Docker container

## Project Structure

```
frontend-shared/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth routes (public)
│   │   ├── login/
│   │   ├── signup/
│   │   ├── forgot-password/
│   │   ├── reset-password/
│   │   ├── verify-email/
│   │   ├── 2fa/
│   │   └── oauth/
│   ├── (protected)/       # Protected routes
│   │   ├── dashboard/
│   │   ├── profile/
│   │   └── settings/
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── auth/             # Auth-specific
│   ├── layout/           # Layout components
│   └── ui/               # shadcn/ui components
├── context/              # React Context
│   └── auth-context.tsx  # Auth state management
├── hooks/                # Custom hooks
├── lib/                  # Utilities
│   ├── api.ts           # API client
│   ├── utils.ts         # Helpers
│   └── validators.ts    # Zod schemas
├── types/                # TypeScript types
└── public/              # Static assets
```

## Next Steps

1. **Customize the UI**: All components are in `components/` directory
2. **Add new pages**: Create files in `app/` directory
3. **Modify API calls**: Update `lib/api.ts`
4. **Add authentication logic**: Update `context/auth-context.tsx`
5. **Install more UI components**:
   ```bash
   bunx --bun shadcn@latest add <component-name>
   ```

## Testing Authentication Flow

### 1. Sign Up
- Go to http://localhost:3001/signup
- Fill in email, password, and name
- Submit the form
- Check backend logs for registration

### 2. Login
- Go to http://localhost:3001/login
- Use your credentials
- You should be redirected to dashboard

### 3. Protected Routes
- Try accessing http://localhost:3001/dashboard
- If not logged in, you'll be redirected to login
- After login, you can access all protected routes

### 4. OAuth (if configured)
- Click "Continue with Google" (or other provider)
- Complete OAuth flow
- You'll be redirected back and logged in

### 5. 2FA Setup
- Go to http://localhost:3001/settings
- Enable 2FA
- Scan QR code with authenticator app
- Save recovery codes

## Development Tips

### Hot Reload
The dev server supports hot reload. Changes to files will automatically refresh the page.

### API Debugging
Open browser DevTools > Network tab to see all API requests and responses.

### State Debugging
Install React DevTools extension to inspect component state.

### Styling
- Use Tailwind CSS classes for styling
- Global styles in `app/globals.css`
- Component-specific styles inline or via CSS modules

## Getting Help

- Read the [README.md](./README.md) for detailed documentation
- Check [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) for API details
- Review backend README for API documentation
- Check console and network tab for errors

## Contributing

When making changes:
1. Keep the existing design intact
2. Test with both backends (Node.js and Python)
3. Run linter: `bun run lint:fix`
4. Check types: `bun run type-check`
5. Test the build: `bun run build`

