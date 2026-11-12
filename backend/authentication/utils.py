from django.core.mail import EmailMultiAlternatives
from django.template import loader
from django.conf import settings


class Util:
    @staticmethod
    def send_email(
        to_email,
        subject,
        body=None,
        context=None,
        text_body=None,
        html_email_template_name=None,
        html_content=None,
        inline_images=None,
    ):
        # Create base email
        plain_text = body if body is not None else text_body

        # Get FROM email from settings
        from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "info@moodflik.com")

        # Create email message with from_email
        email = EmailMultiAlternatives(
            subject=subject,
            body=plain_text or "Please view this email in HTML mode.",
            from_email=from_email,
            to=[to_email],
        )

        # If HTML content is provided directly, use it
        if html_content:
            email.attach_alternative(html_content, "text/html")
        # If HTML template is provided, render and attach
        elif html_email_template_name:
            try:
                render_html = loader.render_to_string(
                    html_email_template_name, context or {}
                )
                email.attach_alternative(render_html, "text/html")
            except Exception as e:
                print(f"[EMAIL] Error rendering HTML template: {e}")

        # Attach inline images if provided
        if inline_images:
            from email.mime.image import MIMEImage
            import os
            for img_info in inline_images:
                try:
                    path = img_info.get('path')
                    cid = img_info.get('content_id')
                    if path and os.path.exists(path):
                        with open(path, 'rb') as f:
                            img_data = f.read()
                            image = MIMEImage(img_data)
                            image.add_header('Content-ID', f'<{cid}>')
                            image.add_header('Content-Disposition', 'inline')
                            email.attach(image)
                except Exception as img_err:
                    print(f"[EMAIL] Failed to attach inline image {img_info}: {img_err}")

        try:
            print(f"[EMAIL] Sending to: {to_email}, Subject: {subject}")
            email.send(fail_silently=False)
            print(f"[EMAIL] ✓ Successfully sent to: {to_email}")
            return {"Success": True, "Message": "Email sent successfully."}
        except Exception as e:
            error_msg = str(e)
            print(f"[EMAIL] ✗ ERROR sending to {to_email}: {error_msg}")

            # Provide helpful error message for authentication failures
            if "535" in error_msg or "authentication failed" in error_msg.lower():
                print("\n" + "=" * 70)
                print("⚠️  EMAIL AUTHENTICATION FAILED!")
                print("=" * 70)
                print(f"Email Host: {settings.EMAIL_HOST}")
                print(f"Email User: {settings.EMAIL_HOST_USER}")
                print("The email password is incorrect.")
                print("\nTo fix this:")
                print("1. Create a .env file in the backend/ directory")
                print("2. Add: EMAIL_HOST_PASSWORD=your_correct_password")
                print("3. Or update the default password in settings.py line 255")
                print("=" * 70 + "\n")

            import traceback

            traceback.print_exc()
            return {"Error": error_msg}
