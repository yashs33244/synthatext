import { notFound } from 'next/navigation'

export default function RootPage() {
  // Frontend app should not have a landing page
  // All users should access via /dashboard or other protected routes
  // Root path shows 404
  notFound()
}
