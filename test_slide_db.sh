#!/bin/bash

echo "🧪 Testing Slide Database Setup..."
echo ""

source ~/.zshrc
conda activate ppt
cd backend
source ../.env

python << 'EOF'
from app.core.database import SessionLocal, engine
from app.models.slide import Slide
from app.models.job import PPTJob
from sqlalchemy import inspect

# Check tables exist
inspector = inspect(engine)
tables = inspector.get_table_names()

print("1️⃣ Database Tables:")
print(f"   ✅ ppt_jobs: {'✓' if 'ppt_jobs' in tables else '✗'}")
print(f"   ✅ slides: {'✓' if 'slides' in tables else '✗'}")
print()

# Check slides table structure
if 'slides' in tables:
    columns = [col['name'] for col in inspector.get_columns('slides')]
    print("2️⃣ Slides Table Columns:")
    for col in ['id', 'job_id', 'slide_number', 's3_key', 'slide_type']:
        print(f"   {'✅' if col in columns else '❌'} {col}")
    print()

# Check foreign key
fks = inspector.get_foreign_keys('slides')
has_fk = any(fk['referred_table'] == 'ppt_jobs' for fk in fks)
print("3️⃣ Foreign Key Constraint:")
print(f"   {'✅' if has_fk else '❌'} slides.job_id → ppt_jobs.id")
print()

# Check current data
db = SessionLocal()

job_count = db.query(PPTJob).count()
slide_count = db.query(Slide).count()

print("4️⃣ Current Data:")
print(f"   📊 Total Jobs: {job_count}")
print(f"   📊 Total Slides: {slide_count}")
print()

# Show recent jobs
recent_jobs = db.query(PPTJob).order_by(PPTJob.created_at.desc()).limit(3).all()
print("5️⃣ Recent Jobs:")
for job in recent_jobs:
    slides = db.query(Slide).filter(Slide.job_id == job.id).count()
    print(f"   📄 {job.id[:8]}... - {job.status.value} ({slides} slides in DB)")

print()

# Show recent slides
recent_slides = db.query(Slide).order_by(Slide.created_at.desc()).limit(5).all()
if recent_slides:
    print("6️⃣ Recent Slides:")
    for slide in recent_slides:
        print(f"   📑 Job: {slide.job_id[:8]}..., Slide #{slide.slide_number} ({slide.slide_type})")
else:
    print("6️⃣ No slides in database yet")
    print("   💡 Create a new presentation to test!")

db.close()
print()
print("✅ Database check complete!")
EOF
