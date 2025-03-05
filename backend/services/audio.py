import httpx
import json
import os

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

async def transcribe_audio(file_path, OPENAI_API_KEY):
    """Transcribe an audio file using OpenAI Whisper API"""
    try:
        async with httpx.AsyncClient() as client:
            with open(file_path, "rb") as f:
                files = {"file": f}
                headers = {"Authorization": f"Bearer {OPENAI_API_KEY}"}
                response = await client.post(
                    "https://api.openai.com/v1/audio/transcriptions",
                    headers=headers,
                    files=files,
                    data={"model": "whisper-1"},
                    timeout=30.0
                )
                if response.status_code == 200:
                    return response.json()["text"]
                else:
                    print(f"Transcription error: {response.text}")
                    return ""
    except Exception as e:
        print(f"Error transcribing audio: {e}")
        return ""
