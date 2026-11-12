from django.utils.deprecation import MiddlewareMixin
from django.views.decorators.csrf import csrf_exempt
from django.urls import reverse
from channels.db import database_sync_to_async
from django.core.exceptions import ValidationError
from rest_framework_simplejwt.backends import TokenBackend
from moodflik import settings
from urllib.parse import parse_qs
import logging


logger = logging.getLogger(__name__)


class AdminCsrfExemptMiddleware(MiddlewareMixin):
    def process_view(self, request, view_func, view_args, view_kwargs):
        # Check if the request is for the admin site by comparing the path
        admin_base_path = reverse('admin:index')
        if request.path.startswith(admin_base_path):
            # Apply the csrf_exempt decorator to all admin views
            return csrf_exempt(view_func)(request, *view_args, **view_kwargs)
        # If not admin, just return the view_func as is
        return None


@database_sync_to_async
def get_user(user_id):
    from django.contrib.auth.models import AnonymousUser
    from authentication.models import User
    
    try:
        return User.objects.get(uuid=user_id)
    except User.DoesNotExist:
        return AnonymousUser()



class QueryAuthMiddleware:
    """Authenticate WebSocket connections via JWT passed in the query string."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        from django.contrib.auth.models import AnonymousUser
        
        try:
            query_string = scope.get("query_string", b"").decode("utf-8")
            params = parse_qs(query_string)
            token_param = params.get("token", [None])[0]

            if not token_param:
                logger.debug("WebSocket connection missing token; treating as anonymous.")
                scope["user"] = AnonymousUser()
                return await self.app(scope, receive, send)

            logger.debug(
                "WebSocket token received (first 10 chars): %s...",
                token_param[:10],
            )

            try:
                token_backend = TokenBackend(
                    algorithm="HS256",
                    signing_key=settings.SECRET_KEY,
                )
                valid_data = token_backend.decode(token_param, verify=True)
                user_id = valid_data.get("user_id")

                if not user_id:
                    raise ValueError("Token payload missing user_id")

                user = await get_user(user_id)
                if not getattr(user, "is_authenticated", False):
                    raise ValueError("Authenticated user not found")

                scope["user"] = user
                logger.debug(
                    "WebSocket authenticated as %s",
                    getattr(user, "email", "<unknown>"),
                )

            except Exception as exc:
                logger.warning("WebSocket token validation failed: %s", exc)
                scope["user"] = AnonymousUser()

        except Exception as exc:
            logger.error("WebSocket authentication middleware error: %s", exc)
            scope["user"] = AnonymousUser()

        return await self.app(scope, receive, send)
