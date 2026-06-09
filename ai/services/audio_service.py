import os
from openai import OpenAI
from google.cloud import storage
from core.config import settings

openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)

# Initialize GCS Client (Requires GOOGLE_APPLICATION_CREDENTIALS environment variable set in production)
# For local dev without creds, we'll gracefully fallback or mock the URL
try:
    gcs_client = storage.Client()
    bucket = gcs_client.bucket(settings.GCS_BUCKET_NAME)
except Exception as e:
    print(f"Warning: GCS Client could not be initialized: {e}")
    gcs_client = None
    bucket = None

def generate_and_upload_audio(text: str, article_id: str, language: str) -> str:
    """Generates TTS audio from text using OpenAI and uploads to GCS."""
    if not text:
        return ""
        
    # Choose voice based on language (Alloy is versatile, Onyx/Nova also good)
    voice = "alloy" if language == "en" else "nova"
    
    file_name = f"audio_{article_id}.mp3"
    local_path = f"/tmp/{file_name}" # temporary local storage
    
    try:
        # 1. Generate TTS
        response = openai_client.audio.speech.create(
            model="tts-1",
            voice=voice,
            input=text
        )
        response.stream_to_file(local_path)
        
        # 2. Upload to GCS
        if bucket:
            blob = bucket.blob(f"audio/{file_name}")
            blob.upload_from_filename(local_path, content_type="audio/mpeg")
            # Make public if bucket allows, otherwise get public URL
            blob.make_public()
            audio_url = blob.public_url
        else:
            # Fallback for local testing if GCS is not set up
            print("GCS not configured. Returning local mock URL.")
            audio_url = f"http://localhost:8000/static/audio/{file_name}"
            
        # Clean up local file
        if os.path.exists(local_path):
            os.remove(local_path)
            
        return audio_url
    except Exception as e:
        print(f"Error generating/uploading audio: {e}")
        return ""
