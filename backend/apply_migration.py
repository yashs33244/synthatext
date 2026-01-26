#!/usr/bin/env python3
"""Apply database migration for name and avatar columns."""

import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import text
from app.core.database import engine

def apply_migration():
    """Apply the migration to add name and avatar columns."""
    migration_sql = """
-- Migration: Add name and avatar columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT;
"""
    
    try:
        with engine.connect() as conn:
            # Execute the migration
            conn.execute(text(migration_sql))
            conn.commit()
            print("✅ Migration applied successfully!")
            print("   - Added 'name' column to users table")
            print("   - Added 'avatar' column to users table")
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    apply_migration()
