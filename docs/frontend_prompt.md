# Prompt for Building the PPT Generator Frontend

Create a modern, industry-grade web application frontend for a "PPT Generator" service using **Next.js 14+ (App Router)** and **TypeScript**.

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (with custom configuration)
- **Icons**: Lucide React
- **Validation**: Zod + React Hook Form
- **HTTP Client**: Axios
- **Notifications**: Sonner
- **UI Components**: Headless UI or custom implementation (no heavy component libraries like MUI)

## Design System (Glassmorphism)
- **Theme**: Blue/Indigo modern tech aesthetic.
- **Background**: Dynamic gradients (radial/conic) on the `body`.
- **Cards**: Use a "glass" effect (`bg-white/70 backdrop-blur-lg border border-white/20 shadow-xl`) for panel containers.
- **Typography**: Inter font (Google Fonts).
- **Interactions**: Smooth hover states, loading spinners, and progress bars.

## Core Features & Pages

### 1. Home Page (`/`)
A split-screen or centered layout containing:
- **Header**: "AI-Powered Presentation Generator" with a subtitle.
- **Left/Main Panel**: `CreateJobForm` component.
- **Right/Side Panel**: `JobList` component.

### 2. Components

#### `CreateJobForm`
A form to configure and submit a generation job.
- **File Upload**: A drag-and-drop zone (using `react-dropzone`) for PDF/TXT/MD files. Uploads to `POST /api/v1/upload` first to get an S3 key.
- **Configuration Fields**:
  - Title (Text)
  - Subtitle (Text, optional)
  - Author (Text, optional)
  - Slide Count (Number, default 15)
  - Output Format (Select: PDF or PPTX)
  - LLM Provider (Select: Gemini or Claude)
  - Theme Colors (Color pickers for Primary, Secondary, Accent)
- **Submit**: Sends JSON payload to `POST /api/v1/jobs`. Shows a loading state ("Generating Magic...") while submitting.

#### `JobList`
A real-time list of recent jobs.
- **Polling**: Fetches `GET /api/v1/jobs` every 5-10 seconds.
- **Optimistic UI**: Immediately displays a new job upon creation.
- **Status Cards**: Display Job ID, Status badge (Pending/Processing/Completed/Failed), Created Date.
- **Progress Bar**: For "Processing" jobs, show a progress bar based on `completed_slides / total_slides`.
- **Download**: For "Completed" jobs, show a "Download" button that hits `GET /api/v1/jobs/{id}/download` and opens the URL.

#### `StatusBadge`
- Visual badge component handling colors/icons for: Pending (Yellow), Processing (Blue + Spinner), Completed (Green + Check), Failed (Red + Alert).

## Data Integration
- Create a typed `api` client (`src/lib/api.ts`) using Axios.
- Define TypeScript interfaces matching the Backend JSON responses (`JobStatusResponse`, `JobCreateResponse`).
- **Proxy**: Configure Next.js `next.config.js` rewrites to proxy `/api/*` to `http://localhost:8000/api/v1/*` to avoid CORS issues in development.

## Implementation Details
- Use `react-hook-form` with `zodResolver` for form validation.
- Ensure the file upload is handled separately (uploads file -> gets key) before the job creation (sends key + config).
- Handle all error states gracefully with toast notifications (`sonner`).
- Ensure the UI is fully responsive (mobile-friendly).
