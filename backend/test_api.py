"""Test script for PPT API with 2-page generation."""
import requests
import time
import json
from pathlib import Path

API_BASE = "http://localhost:8000/api/v1"

def test_health():
    """Test health endpoint."""
    print("\n🔍 Testing health endpoint...")
    response = requests.get(f"{API_BASE}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    assert response.status_code == 200
    print("✅ Health check passed")

def test_upload():
    """Test file upload."""
    print("\n📤 Testing file upload...")
    
    # Create a simple test file
    test_file = Path("/tmp/test_input.txt")
    test_file.write_text("""
    This is a test document for PPT generation.
    
    Section 1: Introduction
    This is the introduction section with some content.
    
    Section 2: Main Content
    This is the main content section with more details.
    
    Section 3: Conclusion
    This is the conclusion section.
    """)
    
    with open(test_file, 'rb') as f:
        files = {'file': ('test_input.txt', f, 'text/plain')}
        response = requests.post(f"{API_BASE}/upload", files=files)
    
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    assert response.status_code == 200
    
    data = response.json()
    assert 's3_key' in data
    print(f"✅ Upload successful: {data['s3_key']}")
    return data['s3_key']

def test_create_job(s3_key):
    """Test job creation with 2 pages."""
    print("\n🚀 Testing job creation (2 pages)...")
    
    payload = {
        "input_s3_key": s3_key,
        "config": {
            "title": "Test Presentation",
            "subtitle": "API Test",
            "author": "Test Suite",
            "number_of_slides": 2,  # Only 2 content slides
            "pages_to_process": -1,
            "output_format": "pdf",
            "llm_provider": "gemini",
            "primary_color": "#004080",
            "secondary_color": "#0066CC",
            "accent_color": "#FFA000"
        }
    }
    
    response = requests.post(f"{API_BASE}/jobs", json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    assert response.status_code == 200
    
    data = response.json()
    assert 'job_id' in data
    print(f"✅ Job created: {data['job_id']}")
    return data['job_id']

def test_get_job_status(job_id):
    """Test job status retrieval."""
    print(f"\n📊 Testing job status for {job_id}...")
    
    response = requests.get(f"{API_BASE}/jobs/{job_id}")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    assert response.status_code == 200
    
    data = response.json()
    assert 'status' in data
    print(f"✅ Job status: {data['status']}")
    return data

def test_list_jobs():
    """Test jobs listing."""
    print("\n📋 Testing jobs listing...")
    
    response = requests.get(f"{API_BASE}/jobs")
    print(f"Status: {response.status_code}")
    data = response.json()
    print(f"Total jobs: {data['total']}")
    print(f"Jobs on page: {len(data['jobs'])}")
    assert response.status_code == 200
    print("✅ Jobs list retrieved")
    return data

def wait_for_completion(job_id, max_wait=300):
    """Wait for job to complete."""
    print(f"\n⏳ Waiting for job {job_id} to complete...")
    
    start_time = time.time()
    while time.time() - start_time < max_wait:
        status_data = test_get_job_status(job_id)
        status = status_data['status']
        
        if status == 'completed':
            print(f"✅ Job completed in {time.time() - start_time:.1f}s")
            return status_data
        elif status == 'failed':
            print(f"❌ Job failed: {status_data.get('error_message', 'Unknown error')}")
            return status_data
        
        progress = status_data.get('progress_percentage', 0)
        print(f"   Progress: {progress:.1f}% ({status_data.get('completed_slides', 0)}/{status_data.get('total_slides', 0)} slides)")
        time.sleep(5)
    
    print(f"⚠️  Job did not complete within {max_wait}s")
    return None

def test_download(job_id):
    """Test download URL generation."""
    print(f"\n📥 Testing download for {job_id}...")
    
    response = requests.get(f"{API_BASE}/jobs/{job_id}/download")
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"Presigned URL: {data['presigned_url'][:100]}...")
        print(f"Expires in: {data['expires_in']}s")
        print("✅ Download URL generated")
        return data
    else:
        print(f"❌ Download failed: {response.text}")
        return None

def test_cancel_job():
    """Test job cancellation."""
    print("\n🛑 Testing job cancellation...")
    
    # Create a new job to cancel
    s3_key = test_upload()
    job_id = test_create_job(s3_key)
    
    # Wait a moment
    time.sleep(2)
    
    # Cancel it
    response = requests.post(f"{API_BASE}/jobs/{job_id}/cancel")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    
    # Verify it's cancelled
    status = test_get_job_status(job_id)
    assert status['status'] == 'failed'
    assert 'Cancelled' in status.get('error_message', '')
    print("✅ Job cancellation successful")
    return job_id

def test_delete_job(job_id):
    """Test job deletion."""
    print(f"\n🗑️  Testing job deletion for {job_id}...")
    
    response = requests.delete(f"{API_BASE}/jobs/{job_id}")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    assert response.status_code == 200
    
    # Verify it's deleted
    response = requests.get(f"{API_BASE}/jobs/{job_id}")
    assert response.status_code == 404
    print("✅ Job deletion successful")

def main():
    """Run all tests."""
    print("=" * 60)
    print("🧪 PPT API Test Suite (2-Page Generation)")
    print("=" * 60)
    
    try:
        # Basic tests
        test_health()
        
        # Upload and create job
        s3_key = test_upload()
        job_id = test_create_job(s3_key)
        
        # Check status
        test_list_jobs()
        
        # Wait for completion
        final_status = wait_for_completion(job_id)
        
        if final_status and final_status['status'] == 'completed':
            # Test download
            test_download(job_id)
        
        # Test cancel (with a new job)
        cancelled_job_id = test_cancel_job()
        
        # Test delete
        test_delete_job(cancelled_job_id)
        
        print("\n" + "=" * 60)
        print("✅ All tests passed!")
        print("=" * 60)
        
    except AssertionError as e:
        print(f"\n❌ Test failed: {e}")
        raise
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        raise

if __name__ == "__main__":
    main()
