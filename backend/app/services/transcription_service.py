import os
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

# Allowed MIME types for voice/video complaint input
ALLOWED_AUDIO_VIDEO_TYPES = {
    # Video types
    "video/webm",
    "video/mp4",
    "video/quicktime",
    "video/x-matroska",
    # Audio types
    "audio/webm",
    "audio/wav",
    "audio/x-wav",
    "audio/mp4",
    "audio/mpeg",
    "audio/mp3",
    "audio/ogg",
    "audio/aac",
    "audio/m4a",
    "audio/x-m4a"
}

MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB upload limit


def validate_media_upload(content_type: str, file_size: int) -> None:
    """Validates media MIME type and maximum file size before processing."""
    # Normalize MIME type (strip parameters like codecs)
    base_type = content_type.split(";")[0].strip().lower() if content_type else ""
    if base_type not in ALLOWED_AUDIO_VIDEO_TYPES and not base_type.startswith("video/") and not base_type.startswith("audio/"):
        raise ValueError(
            f"Unsupported media type '{content_type}'. Please upload an audio or video file (WebM, MP4, WAV, MP3, etc.)."
        )
    if file_size > MAX_FILE_SIZE_BYTES:
        raise ValueError(
            f"File size ({file_size / (1024*1024):.1f} MB) exceeds maximum allowed limit of {MAX_FILE_SIZE_BYTES / (1024*1024):.0f} MB."
        )


async def transcribe_media_gemini(file_bytes: bytes, mime_type: str) -> Dict[str, Any]:
    """
    Transcribes audio or video media using Google Gemini multimodal capabilities.
    Supports English, Hindi, and Marathi natively without requiring FFmpeg or local models.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key or api_key.strip() in ["", "your_key_here"]:
        raise ValueError(
            "GEMINI_API_KEY is not configured on the backend. Speech-to-text service is unavailable. "
            "Please enter your complaint text manually."
        )

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)
        
        # System instructions for transcription
        prompt = (
            "You are an accurate Speech-to-Text transcription engine for road hazard complaints. "
            "Listen carefully to the audio in this recording. Transcribe the spoken words verbatim. "
            "The speaker may speak in English, Hindi, or Marathi (or mixed Hinglish / Marathi-English). "
            "Follow these rules strictly:\n"
            "1. Transcribe the exact words spoken by the user describing the road condition, pothole, or danger.\n"
            "2. If spoken in Hindi or Marathi, provide the verbatim text in Devanagari script, followed by an English translation on a new line.\n"
            "3. If the audio contains only ambient silence, wind, or unintelligible noise with no clear speech, output exactly: NO_SPEECH\n"
            "4. Do NOT hallucinate words, names, or addresses not present in the audio.\n"
            "5. Do NOT include any conversational preamble, notes, or markdown formatting. Output only the transcript."
        )

        base_mime = mime_type.split(";")[0].strip().lower()
        part = types.Part.from_bytes(data=file_bytes, mime_type=base_mime)

        response = client.models.generate_content(
            model="gemini-3.8-flash",
            contents=[part, prompt]
        )

        raw_transcript = (response.text or "").strip()

        # Handle empty or NO_SPEECH results
        if not raw_transcript or raw_transcript.upper() == "NO_SPEECH":
            return {
                "transcript": "",
                "is_empty": True,
                "detected_language": "unknown",
                "message": "No clear speech was detected in the recording. You can enter or edit the description manually."
            }

        # Detect likely language
        detected_lang = "en"
        # Check for Devanagari characters (Unicode range 0900-097F)
        has_devanagari = any('\u0900' <= char <= '\u097f' for char in raw_transcript)
        if has_devanagari:
            detected_lang = "hi/mr"

        return {
            "transcript": raw_transcript,
            "is_empty": False,
            "detected_language": detected_lang,
            "message": "Speech transcribed successfully."
        }

    except Exception as e:
        logger.error(f"Gemini transcription error: {str(e)}")
        raise RuntimeError(f"Transcription service error: {str(e)}")


async def transcribe_media(file_bytes: bytes, mime_type: str) -> Dict[str, Any]:
    """
    Main transcription entry point.
    Validates input and routes to configured hosted speech recognition service.
    """
    validate_media_upload(mime_type, len(file_bytes))
    return await transcribe_media_gemini(file_bytes, mime_type)
