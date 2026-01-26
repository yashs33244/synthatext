-- Migration: Add name and avatar columns to users table
-- Date: 2026-01-25

ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT;

-- Update existing users with Google OAuth accounts to populate name and avatar
-- This will be handled by the backend when users log in again
