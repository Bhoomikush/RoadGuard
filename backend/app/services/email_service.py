import os
import re
import resend
import logging
from typing import Optional, Dict, Any
from dotenv import load_dotenv

# Ensure environment variables are loaded
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", ".env")
load_dotenv(env_path)

logger = logging.getLogger(__name__)

EMAIL_REGEX = re.compile(r"^[\w\.-]+@([\w\.-]+\.)+[\w\.-]+$")


def validate_email(email_str: str) -> bool:
    """Validates basic email address formatting."""
    if not email_str or not isinstance(email_str, str):
        return False
    return bool(EMAIL_REGEX.match(email_str.strip()))


def send_complaint_email(
    subject: str,
    body: str,
    recipient_email: Optional[str] = None,
    evidence_url: Optional[str] = None
) -> dict:
    """
    Sends an official complaint email to the Road Authority using Resend.
    Allows specifying a verified recipient_email or falling back to ROAD_AUTHORITY_EMAIL.
    Returns the Resend API response on success.
    Raises an Exception on failure.
    """
    api_key = os.environ.get("RESEND_API_KEY")
    default_authority_email = os.environ.get("ROAD_AUTHORITY_EMAIL")

    target_email = recipient_email.strip() if recipient_email and validate_email(recipient_email) else default_authority_email

    if not api_key:
        raise ValueError("RESEND_API_KEY environment variable is missing")
    if not target_email:
        raise ValueError("No valid authority recipient email configured or provided")

    resend.api_key = api_key
    sender_email = "RoadGuard Official <onboarding@resend.dev>"

    # Convert newlines to HTML paragraphs/breaks
    formatted_body = body.replace("\n\n", "</p><p>").replace("\n", "<br>")
    html_content = f"""
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; rounded: 8px;">
        <div style="border-bottom: 2px solid #f59e0b; padding-bottom: 12px; margin-bottom: 20px;">
            <h2 style="color: #111827; margin: 0;">RoadGuard Official Citizen Complaint</h2>
            <p style="color: #6b7280; font-size: 13px; margin: 4px 0 0 0;">Civic Hazard Redressal System</p>
        </div>
        
        <div style="font-size: 15px; color: #374151;">
            <p>{formatted_body}</p>
        </div>
        
        {"<div style='margin-top: 24px; padding: 12px 16px; background-color: #f3f4f6; border-left: 4px solid #f59e0b; border-radius: 4px;'><strong style='color: #111827;'>Recorded Evidence:</strong> <a href='" + evidence_url + "' style='color: #2563eb; text-decoration: underline;' target='_blank'>View Attached Video Evidence</a><p style='font-size: 12px; color: #6b7280; margin: 4px 0 0 0;'>This private link provides secure access to the recorded citizen video evidence.</p></div>" if evidence_url else ""}
        
        <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af;">
            <p>Sent via RoadGuard Public Safety Platform. Please acknowledge receipt and initiate inspection.</p>
        </div>
    </div>
    """

    try:
        response = resend.Emails.send({
            "from": sender_email,
            "to": target_email,
            "subject": subject,
            "html": html_content
        })
        logger.info(f"Complaint email sent successfully to {target_email} via Resend. ID: {response.get('id', 'N/A')}")
        return response
    except Exception as e:
        error_msg = str(e).replace(api_key, "********") if api_key else str(e)
        logger.error(f"Failed to send email via Resend: {error_msg}")
        raise Exception(f"Failed to deliver complaint email to road authority: {error_msg}")
