import os
import resend
import logging
from dotenv import load_dotenv

# Ensure environment variables are loaded
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", ".env")
load_dotenv(env_path)

logger = logging.getLogger(__name__)

def send_complaint_email(subject: str, body: str) -> dict:
    """
    Sends an official complaint email to the Road Authority using Resend.
    Returns the Resend API response on success.
    Raises an Exception on failure.
    """
    api_key = os.environ.get("RESEND_API_KEY")
    authority_email = os.environ.get("ROAD_AUTHORITY_EMAIL")

    if not api_key:
        raise ValueError("RESEND_API_KEY environment variable is missing")
    if not authority_email:
        raise ValueError("ROAD_AUTHORITY_EMAIL environment variable is missing")

    resend.api_key = api_key
    
    # Using the default testing sender from Resend. 
    # For a real domain, this would be updated to something like 'complaints@roadguard.com'
    sender_email = "RoadGuard Official <onboarding@resend.dev>"

    try:
        # Note: Resend python library supports synchronous calls for send.
        response = resend.Emails.send({
            "from": sender_email,
            "to": authority_email,
            "subject": subject,
            "html": f"<p>{body.replace(chr(10), '<br>')}</p>"  # Simple newlines to HTML breaks
        })
        return response
        
    except Exception as e:
        # We catch a generic exception here as Resend's errors might vary.
        # Ensure we don't accidentally log the API key if it's somehow in the error string.
        error_msg = str(e).replace(api_key, "********") if api_key else str(e)
        logger.error(f"Failed to send email via Resend: {error_msg}")
        raise Exception("An error occurred while sending the email to the road authority.")
