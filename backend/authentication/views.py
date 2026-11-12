import json
import os
import socket
from random import randint
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

import rest_framework.permissions
from django.conf import settings
from django.core.mail import EmailMessage
from django.db import transaction
from django.utils import timezone
import threading
from django.db.models import Q
from django.http import JsonResponse
from django.core.exceptions import ValidationError as DjangoValidationError
from django.shortcuts import get_object_or_404, redirect, render
from django.views.generic import TemplateView
from django_filters import rest_framework as filters
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken

from .serializers import *
from .utils import Util


# from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.settings import api_settings
class ActivationToken(AccessToken):
    @classmethod
    def for_inactive_user(cls, user):
        token = cls()
        # Use configured user_id_field (uuid in your case)
            #    token = cls()
        # pull config from SIMPLE_JWT settings
        user_id_field = api_settings.USER_ID_FIELD      # e.g. "uuid"
        user_id_claim = api_settings.USER_ID_CLAIM 
        # get the user's UUID (or whatever field you set)
        user_id = getattr(user, user_id_field)

        # put it inside the token payload
        token[user_id_claim] = str(user_id) # ensure UUID is string
        return token


def responsedata(status, message, data=None):
    if status:
        return {"status": status, "message": message, "data": data}
    else:
        return {
            "status": status,
            "message": message,
        }


def _url_with_params(base_url, **params):
    parsed = urlparse(base_url or "")
    existing = dict(parse_qsl(parsed.query, keep_blank_values=True))
    existing.update({k: v for k, v in params.items() if v is not None})
    new_query = urlencode(existing)
    return urlunparse(parsed._replace(query=new_query))


def _is_loopback(hostname):
    loopbacks = {"localhost", "127.0.0.1", "::1"}
    return (hostname or "").lower() in loopbacks


def _guess_local_network_base(request):
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
            sock.connect(("8.8.8.8", 80))
            local_ip = sock.getsockname()[0]
    except OSError:
        return ""

    scheme = getattr(request, "scheme", "http") or "http"
    port = request.get_port()
    host = local_ip
    if port and port not in {"80", "443"}:
        host = f"{host}:{port}"
    return f"{scheme}://{host}"


def _get_activation_base_url(request):
    configured = (
        os.environ.get("ACTIVATION_WEB_BASE_URL", "").strip()
        or getattr(settings, "ACTIVATION_BASE_URL", "").strip()
        or getattr(settings, "BASE_URL", "").strip()
    ).rstrip("/")
    if configured:
        return configured

    fallback = (request.build_absolute_uri("/") if request else "").rstrip("/")
    parsed = urlparse(fallback)
    if _is_loopback(parsed.hostname):
        candidate = _guess_local_network_base(request)
        if candidate:
            return candidate.rstrip("/")
    return fallback


class SendMailSam(APIView):
    def post(self, request):
        data = request.data
        try:
            email = EmailMessage(
                subject="Don’t leave your moods hanging… activate now! - "
                + str(data.get("name"))
                + " : "
                + str(data.get("email")),
                body=data.get("message"),
                to=[data.get("email")],
            )

            email.send(fail_silently=False)
            return JsonResponse({"respnose": "Mail Sent"}, status=status.HTTP_200_OK)
        except:
            return JsonResponse(
                {
                    "response": "Something went wrong. Please mail at raynold222@gmail.com"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


def apple_file(request):
    obj = {
        "applinks": {
            "apps": [],
            "details": [{"appID": "FGUWA7WM3D.com.moodflik.app", "paths": ["*"]}],
        }
    }
    return JsonResponse(obj)           
            
class UserClass(viewsets.ModelViewSet):
    model_class = User
    serializer_class = UserSerializer
    instance_name = "user"
    queryset = model_class.objects.all()
    permission_classes = [permissions.AllowAny]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]
    PUBLIC_ACTIONS = {
        "create",
        "authorize",
        "request_forgotpassword",
        "resendotp",
        "resend_activation",
    }
    PROFILE_FIELDS = {
        "username",
        "first_name",
        "last_name",
        "bio",
        "city",
        "country",
        "website",
        "me",
        "like",
        "dislike",
        "photo_url",
        "cover_photo_url",
        "gender",
        "date_of_birth",
        "phone_number",
        "device_id",
        "display_pfp",
    }

    def get_permissions(self):
        if self.action in self.PUBLIC_ACTIONS:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        return User.objects.filter(is_deleted=False)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def create(self, request):
        d = request.data
        if not d.get("email"):
            return Response(
                responsedata(False, "Email is required"),
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not d.get("username"):
            return Response(
                responsedata(False, "User Name is required"),
                status=status.HTTP_400_BAD_REQUEST,
            )

        existing_user = User.objects.filter(email=request.data.get("email")).first()
        if existing_user:
            if existing_user.is_deleted:
                # Reactivate deleted account logic could go here, 
                # but better to fully delete the OLD phantom user so new one can be created clean
                # OR update the existing user. 
                # Let's delete the old stale record so a fresh one is created (simpler for now)
                # or better: update the existing record to behave like new.
                
                # Approach: Update existing user to "reset" it
                existing_user.is_deleted = False
                existing_user.is_active = True
                existing_user.is_activated = False # Require reactivation
                # Update basic fields
                existing_user.username = request.data.get("username")
                existing_user.set_password(request.data.get("password"))
                existing_user.first_name = request.data.get("first_name")
                existing_user.last_name = request.data.get("last_name")
                existing_user.date_of_birth = request.data.get("date_of_birth")
                existing_user.gender = request.data.get("gender")
                
                # Save first to ensure it's ready
                existing_user.save()
                
                # Proceed to send activation email below...
                # We need to skip the serializer.create() part and jump to activation logic.
                # To do this cleanly, we can allow the flow to continue by NOT returning response here,
                # BUT this function is designed to CREATE.
                
                # ALTERNATIVE: Hard delete the soft-deleted user so the new create works.
                existing_user.delete() 
                # Why hard delete? Because "soft delete" was just hiding it. 
                # If they want to sign up AGAIN, they are starting over.
                
            else:
                print(f"[SIGNUP_DEBUG] Found existing user: {existing_user.email}")
                print(f"[SIGNUP_DEBUG] is_deleted: {existing_user.is_deleted}")
                print(f"[SIGNUP_DEBUG] is_active: {existing_user.is_active}")
                print(f"[SIGNUP_DEBUG] is_user_deactivated: {getattr(existing_user, 'is_user_deactivated', 'N/A')}")
                
                return Response(
                    responsedata(False, f"User already exists (Deleted: {existing_user.is_deleted})"),
                    status=status.HTTP_409_CONFLICT,
                )

        data = {
            "username": request.data.get("username"),
            "email": request.data.get("email"),
            "phone_number": request.data.get("phone_number"),
            "password": request.data.get("password"),
            "first_name": request.data.get("first_name"),
            "last_name": request.data.get("last_name"),
            "date_of_birth": request.data.get("date_of_birth"),
            "gender": request.data.get("gender"),
            "terms_confirmed": request.data.get("terms_confirmed"),
            "device_id": request.data.get("device_id"),
        }

        serializer = self.serializer_class(data=data)
        if serializer.is_valid(raise_exception=True):
            try:
                # Retry logic for database lock errors (SQLite concurrency issue)
                max_retries = 3
                retry_delay = 0.1  # 100ms
                import time
                
                for attempt in range(max_retries):
                    try:
                        # Use transaction to ensure atomicity and avoid database locks
                        # Fields is_active and is_activated are set in serializer.create()
                        with transaction.atomic():
                            user = serializer.save()
                            # Ensure user can login immediately despite not being activated yet
                            user.is_active = True
                            user.save()
                        # Success - break out of retry loop
                        break
                    except Exception as db_error:
                        error_str = str(db_error).lower()
                        if "database is locked" in error_str and attempt < max_retries - 1:
                            # Wait before retrying
                            time.sleep(retry_delay * (attempt + 1))
                            continue
                        else:
                            # Re-raise if not a lock error or last attempt
                            raise
                
                activation_token = ActivationToken.for_inactive_user(user)
                activation_token_str = str(activation_token)

                web_base = _get_activation_base_url(request)

                web_activation_url = (
                    f"{web_base}/api/account/activate/{user.uuid}/{activation_token_str}/"
                )

                mobile_template = os.environ.get("ACTIVATION_MOBILE_DEEP_LINK", "").strip()
                mobile_activation_url = ""
                if mobile_template:
                    mobile_activation_url = mobile_template.format(
                        uuid=user.uuid,
                        token=activation_token_str,
                    )

                client_type = request.data.get("client_type")
                if client_type == "mobile" and mobile_activation_url:
                    activation_link = mobile_activation_url
                else:
                    activation_link = web_activation_url

                first_name = data.get('first_name', 'there')
                
                # Plain text version
                text_message = f"""Hey there {first_name},

Welcome to Moodflik—where your highs shine in green 🟢and your lows glow in red 🔴 (because every mood deserves the spotlight).

We're thrilled to have you! Whether you're here to share joy, 💚 vent creatively, 🤨 or just join in with the collective vibes here, you're officially part of a space that gets you.

Ready to get started? Activate your Moodflik powers now ⚡ (cape optional)

Click below to activate your account and let your mood do the talking:

{activation_link}

See you on the flik side,

— From the Moodflik Team.

P.S. Feeling excited? That's a green post 🟢 waiting to happen.
"""

                subject = "Don\u2019t leave your moods hanging\u2026 activate now! \U0001f7e2\U0001f534"

                email_context = {
                    "first_name": first_name,
                    "activation_link": activation_link,
                }

                print(f"[SIGNUP] Activation link for {data['email']}: {activation_link}")
                # Send in the background so a slow SMTP server never blocks sign up.
                threading.Thread(
                    target=Util.send_email,
                    kwargs=dict(
                        to_email=data["email"],
                        subject=subject,
                        body=text_message,
                        html_email_template_name="authentication/activation_email.html",
                        context=email_context,
                    ),
                    daemon=True,
                ).start()

                return Response(
                    responsedata(True, "User created successfully", serializer.data),
                    status=status.HTTP_200_OK,
                )
            except Exception as e:
                print(f"Error creating user: {e}")
                import traceback
                traceback.print_exc()
                return Response(
                    responsedata(False, f"Error creating user: {str(e)}"),
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    def _perform_account_action(self, user, action_type, reason="", details="", actor=None, send_support_email=False):
        action = (action_type or "").strip().lower()
        if action not in {"delete", "deactivate", "continue"}:
            raise ValidationError("Unsupported account action.")

        reason_text = (reason or "").strip()
        details_text = (details or "").strip()

        if action == "delete" and not reason_text:
            raise ValidationError("Please provide a reason for deleting your account.")

        feedback = AccountClosureFeedback.objects.create(
            user=user,
            action=action,
            reason=reason_text or "Not provided",
            details=details_text or "",
        )

        support_error = None

        if action == "delete":
            user.is_deleted = True
            user.is_active = False
            user.is_user_deactivated = False
            user.save()
            message = "Your account has been scheduled for deletion."

            if send_support_email:
                subject = f"Account deletion request - {user.email}"
                body_lines = [
                    "A user has requested to delete their Moodflik account.",
                    f"Name: {user.get_fullname()}",
                    f"Email: {user.email}",
                    f"User UUID: {user.uuid}",
                    f"Reason: {reason_text or 'Not provided'}",
                ]
                if details_text:
                    body_lines.append(f"Additional details:\n{details_text}")
                if actor:
                    body_lines.append(f"Initiated by: {getattr(actor, 'email', '')}")
                body = "\n".join(body_lines)
                try:
                    Util.send_email(subject=subject, text_body=body, to_email="info@moodflik.com")
                    feedback.sent_to_support = True
                    feedback.save(update_fields=["sent_to_support", "updated_at"])
                except Exception as exc:
                    support_error = str(exc)
        elif action == "deactivate":
            user.is_user_deactivated = True
            user.is_active = False
            user.save()
            message = "Your account has been deactivated. You can reactivate by logging in again."
        else:
            user.is_user_deactivated = False
            if user.is_deleted:
                user.is_deleted = False
            user.is_active = True
            user.save()
            message = "Thanks for sticking with Moodflik!"

        payload = {
            "feedback_id": str(feedback.uuid),
            "support_email_sent": feedback.sent_to_support,
        }
        if support_error:
            payload["support_email_error"] = support_error

        return action, message, payload

    @action(detail=True, methods=['post'], url_path='account-action', permission_classes=[permissions.IsAuthenticated])
    def account_action(self, request, pk=None):
        user = self.get_object()
        if request.user != user and not request.user.is_staff:
            return Response(
                responsedata(False, "You do not have permission to update this account."),
                status=status.HTTP_403_FORBIDDEN,
            )

        action_type = request.data.get("action")
        reason = request.data.get("reason", "")
        details = request.data.get("details", "")
        send_support_email = action_type and action_type.lower() == "delete"

        print(f"DEBUG: account_action request.data: {request.data}")
        print(f"DEBUG: extracted reason: '{reason}'")


        try:
            action, message, payload = self._perform_account_action(
                user,
                action_type,
                reason,
                details,
                actor=request.user,
                send_support_email=send_support_email,
            )
        except ValidationError as exc:
            error_msg = exc.detail if hasattr(exc, "detail") else str(exc)
            return Response(responsedata(False, error_msg), status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            import traceback
            traceback.print_exc()
            print(f"Account action error: {exc}")
            return Response(responsedata(False, f"Error: {str(exc)}"), status=status.HTTP_400_BAD_REQUEST)

        payload["action"] = action
        return Response(responsedata(True, message, payload), status=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        try:
            user = self.get_object()
        except Exception:
            return Response(responsedata(False, "User not found or deletion failed"), status=status.HTTP_404_NOT_FOUND)

        if request.user != user and not request.user.is_staff:
            return Response(
                responsedata(False, "You do not have permission to delete this account."),
                status=status.HTTP_403_FORBIDDEN,
            )

        if user.is_deleted:
            return Response(responsedata(False, "User is already deleted"), status=status.HTTP_400_BAD_REQUEST)

        try:
            self._perform_account_action(
                user,
                "delete",
                reason="Deleted by administrator",
                details="Triggered via DELETE endpoint.",
                actor=request.user if hasattr(request, "user") else None,
                send_support_email=False,
            )
        except Exception:
            return Response(responsedata(False, "User not found or deletion failed"), status=status.HTTP_404_NOT_FOUND)

        return Response(responsedata(True, "User deleted successfully"), status=status.HTTP_204_NO_CONTENT)

    # @action(detail=False, methods=["post"])
    # def authorize(self, request):
    #     if User.objects.filter(email=request.data.get("email")).exists():
    #         user = User.objects.get(email=request.data.get("email"))
    #         if user.check_password(request.data.get("password")):
    #             if user.is_active and user.is_superuser:
    #                 token = RefreshToken.for_user(user)
    #                 user.last_login = datetime.datetime.now()
    #                 user.save()
    #                 data = dict(
    #                     user=user.username,
    #                     first_name=user.first_name,
    #                     last_name=user.last_name,
    #                     accessToken=str(token.access_token),
    #                     email=user.email,
    #                     uuid=user.uuid,
    #                     occupant_id=user.occupant_id,
    #                     device_id=user.device_id,
    #                     is_activated=user.is_activated,
    #                 )

    #                 return Response(
    #                     responsedata(True, "login successfull", data),
    #                     headers={"accessToken": str(token.access_token)},
    #                     status=status.HTTP_200_OK,
    #                 )
    #             elif user.is_active:
    #                 token = RefreshToken.for_user(user)
    #                 user.last_login = datetime.datetime.now()
    #                 user.save()
    #                 # user_type = "learner" if user.is_learner else "educator"
    #                 data = dict(
    #                     user=user.username,
    #                     first_name=user.first_name,
    #                     last_name=user.last_name,
    #                     accessToken=str(token.access_token),
    #                     email=user.email,
    #                     uuid=user.uuid,
    #                     occupant_id=user.occupant_id,
    #                     device_id=user.device_id,
    #                 )
    #                 return Response(
    #                     responsedata(True, "login successfull", data),
    #                     headers={"accessToken": str(token.access_token)},
    #                     status=status.HTTP_200_OK,
    #                 )
    #             elif not user.is_active:
    #                 return Response(
    #                     responsedata(
    #                         True,
    #                         "Your account is temporarily deactivated,"
    #                         " Please contact administrator",
    #                     ),
    #                     status=status.HTTP_401_UNAUTHORIZED,
    #                 )
    #             elif user.is_deleted:
    #                 return Response(
    #                     responsedata(
    #                         False,
    #                         "Your account is temporarily deactivated. Please contact the administrator",
    #                     ),
    #                     status=status.HTTP_401_UNAUTHORIZED,
    #                 )
    #             else:
    #                 return Response(
    #                     responsedata(False, "Something went wrong"),
    #                     status=status.HTTP_400_BAD_REQUEST,
    #                 )
    #         else:
    #             return Response(
    #                 responsedata(False, "Password is incorrect"),
    #                 status=status.HTTP_401_UNAUTHORIZED,
    #             )
    #     else:
    #         return Response(
    #             responsedata(False, "Email ID does not exist"),
    #             status=status.HTTP_404_NOT_FOUND,
    #         )

    @action(detail=False, methods=['post'])
    def authorize(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        # Check if user exists
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(responsedata(False, "Email ID does not exist"), status=status.HTTP_404_NOT_FOUND)

        # Check if user is soft deleted
        if user.is_deleted:
            return Response(responsedata(False, "Account has been deleted"), status=status.HTTP_401_UNAUTHORIZED)

        # Check password
        if not user.check_password(password):
            return Response(responsedata(False, "Password is incorrect"), status=status.HTTP_401_UNAUTHORIZED)

        # A deactivated account is reactivated by logging in again.
        if user.is_user_deactivated or not user.is_active:
            user.is_user_deactivated = False
            user.is_active = True
            user.save()

        # Handle inactive users (changed from is_active to is_activated)
        # if not user.is_activated:
        #     return Response(responsedata(False, "Your account is either not activated or temporarily deactivated. Please contact the administrator"), status=status.HTTP_401_UNAUTHORIZED)

        # If all checks pass, generate a token and return user data
        token = RefreshToken.for_user(user)
        user.last_login = timezone.now()
        user.save()

        data = dict(
            user=user.username,
            first_name=user.first_name,
            last_name=user.last_name,
            accessToken=str(token.access_token),
            email=user.email,
            uuid=user.uuid,
            occupant_id=user.occupant_id,
            device_id=user.device_id,
            is_activated=user.is_activated,
        )

#        query = Settings.objects.filter(user = user).first()
        
#        if query and query.show_active_status:
#            user.is_active = True  
#            return Response(responsedata(True, 'Login successful', data), headers={"accessToken": str(token.access_token)}, status=status.HTTP_200_OK)
       
#        else:
             
        return Response(responsedata(True, 'Login successful', data), headers={"accessToken": str(token.access_token)}, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"])
    def request_forgotpassword(self, request):
        """API function for requesting forgot password"""
        if not request.data.get("email"):
            return Response(
                responsedata(False, "Email is a required field"),
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not User.objects.filter(email=request.data.get("email"), is_deleted=False).exists():
            return Response(
                responsedata(
                    False,
                    "No account is registered with {}".format(request.data.get("email")),
                ),
                status=status.HTTP_404_NOT_FOUND,
            )

        if (
            ForgotPassword.objects.filter(email=request.data.get("email"))
            .values()
            .exists()
        ):
            ForgotPassword.objects.filter(email=request.data.get("email")).delete()

        otp_code = str(randint(100000, 999999))
        serializer = ForgotPasswordSerializer(
            data={"email": request.data.get("email"), "code": otp_code}
        )
        if serializer.is_valid(raise_exception=True):
            try:
                msg = (
                    f"Hi, \n"
                    f"We have noticed that you have requested to reset your password. \n"
                    f"If you have requested to change your password, this is the OTP number that you need to change it: {str(otp_code)}. \n\n"
                    f"If this was not you, please report this immediately by sending an email to info@moodflik.com. If this was you, then carry on as usual. \n"
                    f"Thankyou, \n"
                    f"From the team at moodflik."
                )

                email = EmailMessage(
                    subject="Password Reset",
                    body=msg,
                    to=[request.data.get("email")],
                )
                print(f"[FORGOT PASSWORD] OTP for {request.data.get('email')}: {otp_code}")
                email.send(fail_silently=False)
                serializer.save()
                return Response(
                    responsedata(
                        True,
                        "Your password reset instructions have now been sent to your email. "
                        "Please follow them to reset. Thank you",
                        data={"email": request.data.get("email")},
                    ),
                    status=status.HTTP_200_OK,
                )
            except Exception as e:
                return Response(
                    responsedata(False, "Something went wrong!"),
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            return Response(
                responsedata(False, serializer.errors),
                status=status.HTTP_400_BAD_REQUEST,
            )

    @action(detail=False, methods=["post"])
    def resendotp(self, request):
        """
        API function for resend otp according to validation
        """

        if request.data.get("validation_type") == "forgot password":
            validation_obj = ForgotPassword.objects.get(email=request.data.get("email"))
            user_obj = User.objects.get(email=request.data.get("email"))

            try:
                otp_code = str(randint(000000, 999999))
                # msg = 'Your Email verification OTP is ' + otp_code
                email = EmailMessage(
                    subject = "Password Reset",
                    body=f"Hi, \nWe have noticed that you have requested to reset your password. \n "
                    f"If you have requested to change your password, this is the OTP number that you need to change it:  + {str(otp_code)} \n\n"
                    f"If this was not you, please report this immediately by sending an email to into@moodflik.com. If this was you, then carry on as usual \n"
                    f"Thankyou, \nFrom the team at moodflik.",
                    to=[request.data.get("email")],
                )
                email.send(fail_silently=False)

                validation_obj.code = otp_code
                validation_obj.save()
                return Response(
                    responsedata(True, "Mail Sent successfully"),
                    status=status.HTTP_200_OK,
                )
            except Exception as e:
                return Response(
                    responsedata(False, "Cant send mail"),
                    status=status.HTTP_400_BAD_REQUEST,
                )

    @action(detail=False, methods=["post"])
    def resend_activation(self, request):
        """Re-sends the account activation email."""
        email = (request.data.get("email") or "").strip()
        user = User.objects.filter(email__iexact=email, is_deleted=False).first()
        # Do not reveal whether an address is registered.
        generic = Response(
            responsedata(True, "If that account exists, an activation email is on its way."),
            status=status.HTTP_200_OK,
        )
        if not user or user.is_activated:
            return generic
        token = str(ActivationToken.for_inactive_user(user))
        link = f"{_get_activation_base_url(request)}/api/account/activate/{user.uuid}/{token}/"
        print(f"[ACTIVATION] Activation link for {user.email}: {link}")
        threading.Thread(
            target=Util.send_email,
            kwargs=dict(
                to_email=user.email,
                subject="Activate your Moodflik account",
                body=f"Hey {user.first_name or 'there'},\n\nActivate your account: {link}\n",
                html_email_template_name="authentication/activation_email.html",
                context={"first_name": user.first_name or "there", "activation_link": link},
            ),
            daemon=True,
        ).start()
        return generic

    def partial_update(self, request, pk=None, *args, **kwargs):
        user = self.get_object()
        if request.user != user:
            return Response(
                responsedata(False, "You can only edit your own profile."),
                status=status.HTTP_403_FORBIDDEN,
            )
        data = {k: v for k, v in request.data.items() if k in self.PROFILE_FIELDS}
        serializer = self.get_serializer(user, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class ActivateAccount(APIView):
    permission_classes = (AllowAny,)

    def get(self, request, uuid, token, *args, **kwargs):
        client_type = (request.query_params.get("client_type") or "").strip().lower()
        wants_json = client_type == "mobile"

        # Get frontend URL for redirects
        frontend_base = (
            settings.FRONTEND_BASE_URL or request.build_absolute_uri("/api")
        ).rstrip("/")
        
        success_redirect = os.environ.get(
            "ACTIVATION_WEB_SUCCESS_URL",
            f"{frontend_base}/activation.html?status=success",
        )
        invalid_redirect = os.environ.get(
            "ACTIVATION_WEB_INVALID_TOKEN_URL",
            f"{frontend_base}/activation.html?status=failed&reason=invalid_token",
        )
        error_redirect = os.environ.get(
            "ACTIVATION_WEB_ERROR_URL",
            f"{frontend_base}/activation.html?status=failed&reason=server_error",
        )

        try:
            # Get user by UUID
            user = get_object_or_404(User, uuid=uuid)
            print(f"Activation attempt for user: {user.email}, UUID: {uuid}, is_activated before: {user.is_activated}")

            # Validate token
            try:
                token_obj = ActivationToken(token)
                token_user_id = str(token_obj.get(api_settings.USER_ID_CLAIM, ""))
                print(f"Token user_id: {token_user_id}, User UUID: {str(user.uuid)}")
            except Exception as token_err:
                print(f"Token validation error: {token_err}")
                if wants_json:
                    return Response(
                        responsedata(False, "Invalid or expired activation link."),
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                return redirect(
                    _url_with_params(
                        invalid_redirect,
                        status="failed",
                        reason="invalid_token",
                    )
                )
            
            if str(user.uuid) != token_user_id:
                print(f"Token UUID mismatch: {token_user_id} != {str(user.uuid)}")
                if wants_json:
                    return Response(
                        responsedata(False, "Invalid or expired activation link."),
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                return redirect(
                    _url_with_params(
                        invalid_redirect,
                        status="failed",
                        reason="invalid_token",
                    )
                )

            # Activate user
            already_active = bool(user.is_active and getattr(user, "is_activated", False))
            if not already_active:
                import time
                max_retries = 5
                retry_delay = 0.2
                
                for attempt in range(max_retries):
                    try:
                        # Use a transaction to ensure atomicity
                        with transaction.atomic():
                            # Update directly using queryset to ensure database-level update
                            updated_count = User.objects.filter(uuid=user.uuid).update(
                                is_active=True,
                                is_activated=True
                            )
                            
                            if updated_count == 0:
                                raise Exception("No user was updated")
                            
                            # Refresh user object from database
                            user.refresh_from_db()
                            
                            print(f"User activated successfully: is_active={user.is_active}, is_activated={user.is_activated}")
                            
                            # Double-check activation was saved
                            if not user.is_activated:
                                print("ERROR: User activation failed to save!")
                                raise Exception("Failed to activate user - is_activated is still False")
                        
                        # Success - break loop
                        break
                            
                    except Exception as save_err:
                        error_str = str(save_err).lower()
                        print(f"Activation attempt {attempt+1} failed: {save_err}")
                        if "locked" in error_str and attempt < max_retries - 1:
                            time.sleep(retry_delay * (attempt + 1))
                            continue
                        
                        # Only handle the final failure here
                        if attempt == max_retries - 1:
                            print(f"Error saving user activation after retries: {save_err}")
                            import traceback
                            traceback.print_exc()
                            if wants_json:
                                return Response(
                                    responsedata(False, f"Failed to activate: {str(save_err)}"),
                                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                                )
                            
                            # Append error detail to redirect
                            import urllib.parse
                            safe_error = urllib.parse.quote(str(save_err))
                            return redirect(
                                _url_with_params(
                                    error_redirect,
                                    status="failed",
                                    reason="server_error",
                                    details=safe_error
                                )
                            )
                    
                    # Fallback if loop finishes without break
                    return redirect(
                        _url_with_params(
                            error_redirect,
                            status="failed",
                            reason="server_error",
                            details="unknown_error_loop_exited" 
                        )
                    )

            if wants_json:
                return Response(
                    responsedata(
                        True,
                        "Account already activated."
                        if already_active
                        else "Account activated successfully.",
                    ),
                    status=status.HTTP_200_OK,
                )

            # Redirect to frontend success page (web fallback)
            return redirect(
                _url_with_params(
                    success_redirect,
                    status="already_activated" if already_active else "success",
                )
            )

        except TokenError:
            if wants_json:
                return Response(
                    responsedata(False, "Invalid or expired activation link."),
                    status=status.HTTP_400_BAD_REQUEST,
                )
            return redirect(
                _url_with_params(
                    invalid_redirect,
                    status="failed",
                    reason="invalid_token",
                )
            )
        except Exception as e:
            print("Activation error:", e)
            if wants_json:
                return Response(
                    responsedata(False, "Could not activate account. Please try again."),
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )
            return redirect(
                _url_with_params(
                    error_redirect,
                    status="failed",
                    reason="server_error",
                )
            )
                  

class ActivationLandingView(TemplateView):
    template_name = "activation.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context.setdefault("app_ios_url", "https://apps.apple.com/us/app/moodflik/id6466197497")
        context.setdefault(
            "app_android_url",
            "https://play.google.com/store/apps/details?id=com.moodflik",
        )
        context.setdefault("support_email", "info@moodflik.com")
        return context


class ValidateOtp(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        if request.data.get("validation_type") == "forgot password":
            if (
                not ForgotPassword.objects.filter(
                    email=request.data.get("email"), is_used=True
                )
                .values()
                .exists()
            ):
                record = ForgotPassword.objects.filter(email=request.data.get("email")).first()
                try:
                    valid = record is not None and int(record.code) == int(request.data.get("code"))
                except (TypeError, ValueError):
                    valid = False
                if not valid:
                    return Response(
                        responsedata(False, "Invalid code"),
                        status=status.HTTP_403_FORBIDDEN,
                    )
                data = {
                    "otp_code": randint(100000, 999999),
                    "email": request.data.get("email"),
                }
                obj = ForgotPassword.objects.get(email=request.data.get("email"))
                obj.change_code = data["otp_code"]
                obj.save()
                return Response(
                    responsedata(True, "Valid code", data), status=status.HTTP_200_OK
                )
            else:
                return Response(
                    responsedata(False, "password already changed, Please login"),
                    status=status.HTTP_406_NOT_ACCEPTABLE,
                )
        else:
            return Response(
                responsedata(False, "Invalid Validation Type"),
                status=status.HTTP_406_NOT_ACCEPTABLE,
            )


class ForgotPasswordChange(APIView):
    permission_classes = [permissions.AllowAny]
    """
    API View for performing password change 
    based on forgot password request
    """

    # patch method

    def patch(self, request):
        if ForgotPassword.objects.filter(
            email=request.data.get("email"), is_used=False
        ).exists():
            try:
                code_ok = ForgotPassword.objects.get(
                    email=request.data.get("email")
                ).change_code == int(request.data.get("code"))
            except (TypeError, ValueError):
                code_ok = False
            if not code_ok:
                return Response(
                    responsedata(False, "You are not authorized to change password"),
                    status=status.HTTP_401_UNAUTHORIZED,
                )

            # request.data['is_used'] = True
            # request.data['code'] = request.data.get("code")

            # reset token
            reset_token = ForgotPassword.objects.get(email=request.data.get("email"))
            reset_token.is_used = True
            reset_token.save()

            # replace password from the user
            password = request.data.get("password")
            obj = User.objects.get(email=request.data["email"])
            user_pass = dict(password=password, email=obj.email)

            # create a user serializer
            user_serializer = UserSerializer(obj, data=user_pass, partial=True)

            if user_serializer.is_valid(raise_exception=True):
                user_serializer.save()
                return Response(
                    responsedata(
                        True, "Password Changed successfully", user_serializer.data
                    ),
                    status=status.HTTP_200_OK,
                )
            else:
                # log_error('Forgot Password Change:', file_name="authentication.views", error=str(user_serializer.errors))
                return Response(
                    responsedata(False, "Something went wrong", user_serializer.errors),
                    status=status.HTTP_400_BAD_REQUEST,
                )

        else:
            return Response(
                responsedata(False, "password already changed, Please login"),
                status=status.HTTP_406_NOT_ACCEPTABLE,
            )


class ChangePasswordView(generics.UpdateAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = ChangePasswordSerializer

    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        # return new token
        return Response({"message": "Password changed!"}, status=status.HTTP_200_OK)

# Changes...
class SettingsAPI(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        setting = Settings.objects.get(user=request.user.uuid)
        data = {}
        if request.user and setting:
            if setting.like_dislike_settings == 0:
                data["like_dislike_settings"] = "Show_Posts_to_anyone"
            if setting.like_dislike_settings == 1:
                data["like_dislike_settings"] = "Only_Followers"
            if setting.like_dislike_settings == 2:
                data["like_dislike_settings"] = "Only_Following"

            if setting.bio_settings == 0:
                data["bio_settings"] = "Show_Posts_to_anyone"
            if setting.bio_settings == 1:
                data["bio_settings"] = "Only_Followers"
            if setting.bio_settings == 2:
                data["bio_settings"] = "Only_Following"

            if setting.privacy_settings == 0:
                data["privacy_settings"] = "Anyone"
            if setting.privacy_settings == 1:
                data["privacy_settings"] = "OnlyFollowers"
            if setting.privacy_settings == 2:
                data["privacy_settings"] = "OnlyFollowing"

        ser = SettingSerializer(setting).data
        ser.update(data)
        return Response(ser)

    def post(self, request):
        data = request.data
        data["user"] = request.user.uuid
        privacy_settings = request.data.get("privacy_settings")
        bio_settings = request.data.get("bio_settings")
        like_dislike_settings = request.data.get("like_dislike_settings")
        allow_requests = request.data.get('allow_requests')
        show_in_search = request.data.get("acc_visibility")
        active_status = request.data.get("active_status")
        setting_obj = Settings.objects.filter(user=request.user)

        try:
            out_of_range = any(
                value is not None and not 0 <= int(value) <= 2
                for value in (privacy_settings, bio_settings, like_dislike_settings)
            )
        except (TypeError, ValueError):
            out_of_range = True
        if out_of_range:
            return Response(
                responsedata(False, "Something went wrong!"),
                status=status.HTTP_400_BAD_REQUEST,
            )

        if setting_obj.exists():
            ser = SettingSerializer(setting_obj.first(), data=data, partial=True)
        else:
            ser = SettingSerializer(data=data)

        if ser.is_valid(raise_exception=True):
            ser.save()
            return Response(
                responsedata(True, "Settings Saved", ser.data),
                status=status.HTTP_201_CREATED,
            )

        return Response(
            responsedata(False, ser.errors), status=status.HTTP_400_BAD_REQUEST
        )

    def patch(self, request):
        data = request.data
        data["user"] = request.user.uuid
        settings = Settings.objects.filter(user=request.user)
        if not settings:
            return Response("Settings not found", status=status.HTTP_404_NOT_FOUND)
        ser = SettingSerializer(settings.first(), data=data, partial = True)
        if ser.is_valid(raise_exception=True):
            ser.save()
            return Response("Settings have been updated", status=status.HTTP_202_ACCEPTED)
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)   
         
class PostNotificationSettings(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    BOOLEAN_FIELDS = {
        "allow_notif",
        "ask_why",
        "comments",
        "like_dislike",
        "why_reactions",
        "why_comments",
        "push_likes_dislikes",
        "push_comments",
        "push_why_reactions",
        "push_why_comments",
        "follow_notif",
        "unfollow_notif",
        "followed_user_new_mood",
        "followed_user_new_why",
        "post_notif",
        "threads",
        "mentions",
        "tags_in_why",
        "dm_requests",
        "chat_alert",
        "new_direct_message",
        "every_hour",
        "every_three_hours",
        "every_five_hours",
        "weekly_digest",
        "product_updates",
        "tips_tricks",
    }

    def _normalise_payload(self, payload):
        cleaned = {}
        for field in self.BOOLEAN_FIELDS:
            if field in payload:
                value = payload.get(field)
                if isinstance(value, bool):
                    cleaned[field] = value
                elif isinstance(value, str):
                    cleaned[field] = value.strip().lower() in {"1", "true", "yes", "on"}
                elif isinstance(value, (int, float)):
                    cleaned[field] = bool(value)
        return cleaned

    def get(self, request):
        post_notifications, _ = PostNotification.objects.get_or_create(
            user=request.user
        )
        serializer = PostNotificationSerializer(post_notifications).data
        return Response(responsedata(True, "Details fetched", serializer))

    def post(self, request):
        payload = self._normalise_payload(request.data or {})
        if not payload:
            return Response(
                responsedata(False, "No valid notification fields provided"),
                status=status.HTTP_400_BAD_REQUEST,
            )

        post_notifications, _ = PostNotification.objects.get_or_create(
            user=request.user
        )
        serializer = PostNotificationSerializer(
            post_notifications, data=payload, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(responsedata(True, "Details saved", serializer.data))


class UserFilter(filters.FilterSet):
    email = filters.CharFilter(lookup_expr="icontains")
    name = filters.CharFilter(lookup_expr="icontains")
    profiles__skills = filters.CharFilter(lookup_expr="icontains")

    class Meta:
        model = User
        fields = ("email", "name", "profiles__skills")


class AllUsers(APIView):
    filter_backends = (filters.DjangoFilterBackend,)

    def filter_queryset(self, queryset):
        for backend in list(self.filter_backends):
            queryset = backend().filter_queryset(self.request, queryset, self)
        return queryset

    def get(self, request):
        search = self.request.query_params.get("search")
        block = self.request.query_params.get("block")

        base = User.objects.filter(is_deleted=False, is_active=True)
        if search:
            # Email is intentionally not searchable by other users.
            page = base.filter(
                Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
                | Q(username__icontains=search)
            ).filter(username_search_visible=True)
        else:
            page = base.filter(username_search_visible=True)

        request_user = request.user if request.user.is_authenticated else None
        block_param = (block or "").strip().lower() == "true"

        if request_user:
            hidden = set(
                Block.objects.filter(user=request_user).values_list("blocked_user", flat=True)
            ) | set(
                Block.objects.filter(blocked_user=request_user).values_list("user", flat=True)
            )
            if hidden:
                page = page.exclude(uuid__in=hidden)

        if block_param and request_user:
            exclude_user = list(
                Block.objects.filter(blocked_user=request_user).values_list(
                    "user", flat=True
                )
            )
            if exclude_user:
                page = page.exclude(uuid__in=exclude_user)

        if request_user:
            page = page.exclude(uuid=request_user.uuid)

        filtered_qs = self.filter_queryset(page.order_by("first_name", "username")[:50])
        serializer = UserSerializer(
            filtered_qs, many=True, context={"request": request}
        )
        return Response(serializer.data)


class GetUserByOccID(APIView):
    def get(self, request, id):
        user = User.objects.filter(occupant_id=id)
        userdata = UserSerializer(user, many=True).data
        return Response(userdata)


class BlockUser(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        block_objs = Block.objects.filter(user=request.user).values_list(
            "blocked_user", flat=True
        )
        user_data = UserSerializer(
            User.objects.filter(uuid__in=block_objs), many=True, context={"request": request}
        ).data
        for data in user_data:
            data["is_blocked"] = True
        return Response(user_data)

    def post(self, request):
        if request.user.is_authenticated:
            if str(request.user.uuid) == request.data.get("user_id"):
                return Response(
                    "You cannot block yourself", status=status.HTTP_403_FORBIDDEN
                )
            try:
                blocked_user = User.objects.get(uuid=request.data.get("user_id"))
            except (User.DoesNotExist, ValueError, DjangoValidationError):
                return Response("User not found", status=status.HTTP_404_NOT_FOUND)

            Block.objects.get_or_create(user=request.user, blocked_user=blocked_user)
            try:
                if Follow.objects.filter(
                    follower=request.user, following=blocked_user
                ).exists():
                    Follow.objects.filter(
                        follower=request.user, following=blocked_user
                    ).delete()
                elif Follow.objects.filter(
                    following=request.user, follower=blocked_user
                ).exists():
                    Follow.objects.filter(
                        following=request.user, follower=blocked_user
                    ).delete()
                if FollowRequest.objects.filter(
                    sender=blocked_user, receiver=request.user
                ).exists():
                    FollowRequest.objects.filter(
                        sender=blocked_user, receiver=request.user
                    ).delete()
                elif FollowRequest.objects.filter(
                    sender=request.user, receiver=blocked_user
                ).exists():
                    FollowRequest.objects.filter(
                        sender=request.user, receiver=blocked_user
                    ).delete()
                if Favourites.objects.filter(
                    user=blocked_user, post__posted_by=request.user
                ).exists():
                    Favourites.objects.filter(
                        user=blocked_user, post__posted_by=request.user
                    ).delete()
            except Exception as e:
                pass
            return Response("User blocked")
        else:
            return Response("Please login again to continue")


class UnblockUser(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        #
        block_list = Block.objects.filter(
            user=request.user, blocked_user=request.data.get("user_id")
        )
        for block_obj in block_list:
            block_obj.delete()
        return Response("User removed from blocked list")


class InviteUser(APIView):
    def post(self, request):
        email = request.data.get("email")
        context = {
            "username": f"{request.user.first_name} {request.user.last_name}".title(),
            "website_link": "https://www.moodflik.com/",
            "playstore_link": "https://play.google.com/store/apps/details?id=com.moodflik",
            "appstore_link": "https://apps.apple.com/us/app/moodflik/id6466197497",
        }
        html_email_template_name = "authentication/invite_friend.html"
        subject = "Don't Miss Out — I'm on Moodflik & You Should Be Too!"
        logo_path = os.path.join(settings.BASE_DIR, 'authentication', 'static', 'img', 'logo-black.png')
        playstore_path = os.path.join(settings.BASE_DIR, 'authentication', 'static', 'img', 'playstore.png')
        appstore_path = os.path.join(settings.BASE_DIR, 'authentication', 'static', 'img', 'appstore.png')
        inline_images = [
            {'content_id': 'logo_black', 'path': logo_path},
            {'content_id': 'playstore', 'path': playstore_path},
            {'content_id': 'appstore', 'path': appstore_path},
        ]

        try:
            email_result = Util.send_email(
                context=context,
                subject=subject,
                to_email=email,
                html_email_template_name=html_email_template_name,
                inline_images=inline_images
            )
            if email_result.get("Error"):
                raise Exception(email_result.get("Error"))
        except Exception as e:
            print(e)
            return Response(
                {"Error": "Email send failed. Try later!"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        return Response(
            responsedata(True, "Invitation sent"), status=status.HTTP_200_OK
        )


class ConfirmPassword(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        user = request.user
        password = request.data.get("password")
        if user.check_password(password):
            return Response("Password Correct", status=status.HTTP_200_OK)
        return Response("Password Incorrect", status=status.HTTP_401_UNAUTHORIZED)


class ContactUs(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        name = request.data.get("name")
        email = request.data.get("email")
        message = request.data.get("message")
        context = {
            "email": email,
            "message": message,
            "user": name,
        }
        html_email_template_name = "authentication/contact-us.html"
        subject = f"Query sent from {name}."
        # admin_emails = list(User.objects.filter(is_staff=True).values_list('email', flat=True))
        # admin_emails.append('info@moodflik.com') if 'info@moodflik.com' not in admin_emails else None
        try:
            Util.send_email(
                context=context,
                subject=subject,
                html_email_template_name=html_email_template_name,
                to_email="info@moodflik.com",
            )
        except Exception as e:
            print(e)
            return Response(
                {"Error": "Email send failed. Try later!"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            responsedata(True, "Query sent successfully"), status=status.HTTP_200_OK
        )


class FollowRequestView(viewsets.ModelViewSet):
    serializer_class = FollowRequestSerializer
    filter_backends = (filters.DjangoFilterBackend,)
    permission_classes = (permissions.IsAuthenticated,)

    def filter_queryset(self, queryset):
        for backend in list(self.filter_backends):
            queryset = backend().filter_queryset(self.request, queryset, self)
        return queryset

    def get_queryset(self):
        return FollowRequest.objects.all()

    def get_serializer_context(self):
        return {
            "request": self.request,
            "format": self.format_kwarg,
            "view": self,
        }

    def list_sent_follow_request(self, *args, **kwargs):
        data = self.get_queryset().filter(sender=self.request.user, status="pending")
        serializer_data = self.get_serializer(data, many=True).data

        return Response(serializer_data)

    def list_received_follow_request(self, *args, **kwargs):
        data = self.get_queryset().filter(receiver=self.request.user, status="pending")
        serializer_data = self.get_serializer(data, many=True).data

        return Response(serializer_data)

    def unblock_users(self, *args, **kwargs):
        search = self.request.query_params.get("search")
        block = self.request.query_params.get("block")

        if search:
            page = User.objects.filter(
                Q(email__icontains=search)
                | Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
                | Q(username__icontains=search)
            )  # .exclude(uuid__in=exclude_user)
        else:
            page = User.objects.all()  # .exclude(uuid__in=exclude_user)
        if block:
            exclude_user = list(
                Block.objects.filter(user=self.request.user).values_list(
                    "blocked_user", flat=True
                )
            )
            print("exclude users", exclude_user)
            if exclude_user:
                page = page.exclude(uuid__in=exclude_user)
                print("page", page)
        filtered_qs = self.filter_queryset(page.exclude(uuid=self.request.user.uuid))
        serializer = UserSerializer(filtered_qs, many=True, context={"request": self.request})
        return Response(serializer.data)
    
    def send_follow_request(self, *args, **kwargs):
        sender = self.request.user
        try:
            receiver = User.objects.get(
                uuid=self.request.data.get("receiver"), is_deleted=False
            )
        except (User.DoesNotExist, ValueError, TypeError, DjangoValidationError):
            return Response({"message": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        if sender == receiver:
            return Response(
                {"response": "Cannot follow yourself!"}, status=status.HTTP_400_BAD_REQUEST
            )
        if Block.objects.filter(
            Q(user=receiver, blocked_user=sender) | Q(user=sender, blocked_user=receiver)
        ).exists():
            return Response(
                {"message": "You cannot follow this user."}, status=status.HTTP_403_FORBIDDEN
            )

        if Follow.objects.filter(follower=sender, following=receiver).exists():
            return Response({"response": "Already Following this user!", "status": "approved"})
        pending = FollowRequest.objects.filter(
            sender=sender, receiver=receiver, status="pending"
        ).first()
        if pending:
            return Response(
                {"response": "Request pending", "status": "pending", "request_id": str(pending.uuid)}
            )

        audience = {receiver.follow_request, receiver.follow_request_audience}
        if audience & {"none", "no_one"}:
            return Response(
                "This user doesnt allow anyone to follow them",
                status=status.HTTP_400_BAD_REQUEST,
            )
        if audience & {"friends_of_firends", "friends_of_friends"}:
            mine = Follow.objects.filter(follower=sender).values_list("following", flat=True)
            known = Follow.objects.filter(
                Q(follower__in=mine, following=receiver)
                | Q(follower=receiver, following__in=mine)
                | Q(follower=receiver, following=sender)
            )
            if not known.exists():
                return Response(
                    "This user only allows people who they know or friend of friends to follow them",
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # A previously rejected request is replaced by a fresh one.
        FollowRequest.objects.filter(sender=sender, receiver=receiver).delete()
        follow_request = FollowRequest.objects.create(sender=sender, receiver=receiver)
        return Response(
            {
                "message": "Follow request sent! Waiting for approval",
                "status": "pending",
                "request_id": str(follow_request.uuid),
            },
            status=status.HTTP_200_OK,
        )

    def approve_follow_request(self, *args, **kwargs):
        obj = FollowRequest.objects.filter(
            uuid=self.request.data.get("request_id"), receiver=self.request.user
        ).first()
        if not obj or obj.sender == obj.receiver:
            return Response("Request not found", status=status.HTTP_400_BAD_REQUEST)
        if obj.status == "approved":
            return Response({"response": "Already Following this user!"})

        Follow.objects.get_or_create(
            follower=obj.sender, following=obj.receiver, defaults={"follow_request": obj}
        )
        obj.status = "approved"
        obj.save()
        return Response(
            {"message": f"{obj.sender} started following you."},
            status=status.HTTP_200_OK,
        )

    def cancel_follow_request(self, *args, **kwargs):
        request_id = self.request.data["request_id"]
        try:
            req_obj = FollowRequest.objects.get(
                uuid=request_id, sender=self.request.user
            )
        except Exception as e:
            print(e)
            return Response(
                {"message": "Request not found"}, status=status.HTTP_400_BAD_REQUEST
            )
        if req_obj.status == "approved" or req_obj.status == "rejected":
            return Response(
                {"message": f"Something went wrong!"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        req_obj.delete()
        return Response(
            {"message": f"Follow request cancelled"}, status=status.HTTP_200_OK
        )

    def reject_follow_request(self, *args, **kwargs):
        request_id = self.request.data["request_id"]
        try:
            req_obj = FollowRequest.objects.get(
                uuid=request_id, receiver=self.request.user
            )
        except Exception as e:
            print(e)
            return Response(
                {"message": "Request not found"}, status=status.HTTP_400_BAD_REQUEST
            )

        if req_obj.status == "approved" or req_obj.status == "rejected":
            return Response(
                {"message": f"Something went wrong!"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        req_obj.status = "rejected"
        req_obj.save()
        return Response(
            {"message": f"Follow request rejected!"}, status=status.HTTP_200_OK
        )

class UnsubscribeView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Send notification to admin
            Util.send_email(
                to_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'info@moodflik.com'),
                subject=f'Unsubscribe Request: {email}',
                body=f'User with email {email} has requested to be unsubscribed from all communications.'
            )
            
            # Attempt to update user setting immediately
            user = User.objects.filter(email=email).first()
            if user:
                # Disable email activity updates as a proxy for unsubscribe
                user.email_activity_updates = False
                user.save()
                
            return Response({'message': 'Unsubscribe request processed successfully.'}, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f'Error in unsubscribe: {e}')


class PreviewActivationEmail(APIView):
    """
    DEV-ONLY: Opens the activation email template directly in the browser.
    Visit: http://localhost:8000/api/preview-activation-email/
    Optional query params:
      ?name=YourName   (default: Ali)
      ?link=http://...  (default: a fake activation link)
    """
    permission_classes = (AllowAny,)

    def get(self, request, *args, **kwargs):
        first_name = request.query_params.get("name", "Ali")
        activation_link = request.query_params.get(
            "link",
            request.build_absolute_uri(
                "/api/account/activate/00000000-0000-0000-0000-000000000000/preview-token/"
            ),
        )

        logo_src = ""
        import os, base64
        from django.conf import settings
        logo_path = os.path.join(settings.BASE_DIR, '..', 'frontend', 'src', 'assets', 'heart-logo.png')
        try:
            with open(logo_path, "rb") as f:
                logo_b64 = base64.b64encode(f.read()).decode('utf-8')
                logo_src = f"data:image/png;base64,{logo_b64}"
        except Exception:
            logo_src = "http://localhost:3000/heart-logo.png"

        context = {
            "first_name": first_name,
            "activation_link": activation_link,
            "logo_src": logo_src,
        }

        return render(request, "activation_email.html", context)


class PreviewInviteEmail(APIView):
    """
    DEV-ONLY: Opens the invite friend email template directly in the browser.
    Visit: http://localhost:8000/api/preview-invite-email/
    """
    permission_classes = (AllowAny,)

    def get(self, request, *args, **kwargs):
        name = request.query_params.get("name", "Ali")

        logo_src = ""
        playstore_src = ""
        appstore_src = ""

        import os, base64
        from django.conf import settings
        logo_path = os.path.join(settings.BASE_DIR, 'authentication', 'static', 'img', 'logo-black.png')
        playstore_path = os.path.join(settings.BASE_DIR, 'authentication', 'static', 'img', 'playstore.png')
        appstore_path = os.path.join(settings.BASE_DIR, 'authentication', 'static', 'img', 'appstore.png')
        
        def get_b64_src(path, default_cid):
            try:
                with open(path, "rb") as f:
                    return f"data:image/png;base64,{base64.b64encode(f.read()).decode('utf-8')}"
            except Exception:
                return default_cid

        logo_src = get_b64_src(logo_path, "cid:logo_black")
        playstore_src = get_b64_src(playstore_path, "cid:playstore")
        appstore_src = get_b64_src(appstore_path, "cid:appstore")

        context = {
            "username": "Satoshi Nakamoto",
            "Name": name,
            "website_link": "https://www.moodflik.com/",
            "playstore_link": "https://play.google.com/store/apps/details?id=com.moodflik",
            "appstore_link": "https://apps.apple.com/us/app/moodflik/id6466197497",
            "logo_src": logo_src,
            "playstore_src": playstore_src,
            "appstore_src": appstore_src,
        }

        return render(request, "authentication/invite_friend.html", context)
