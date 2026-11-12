from django.conf import settings
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView


class AccountPrivacySettingsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    BOOLEAN_FIELDS = {
        "username_search_visible",
        "profile_photo_public",
        "two_factor_enabled",
        "email_activity_updates",
        "posts_public_by_default",
        "allow_comments",
        "show_online_status",
        "show_mood_history",
    }

    CHOICE_FIELDS = {
        "follow_request_audience": {
            "anyone",
            "friends_of_friends",
            "no_one",
        }
    }

    def get(self, request):
        user = request.user
        payload = {
            "username_search_visible": user.username_search_visible,
            "profile_photo_public": user.profile_photo_public,
            "follow_request_audience": user.follow_request_audience,
            "two_factor_enabled": user.two_factor_enabled,
            "email_activity_updates": user.email_activity_updates,
            "posts_public_by_default": user.posts_public_by_default,
            "allow_comments": user.allow_comments,
            "show_online_status": user.show_online_status,
            "show_mood_history": user.show_mood_history,
        }
        return Response(payload, status=status.HTTP_200_OK)

    def post(self, request):
        user = request.user
        data = request.data or {}

        for field in self.BOOLEAN_FIELDS:
            if field in data:
                value = data.get(field)
                if isinstance(value, bool):
                    setattr(user, field, value)
                elif isinstance(value, str):
                    setattr(user, field, value.strip().lower() in {"1", "true", "yes", "on"})
                elif isinstance(value, (int, float)):
                    setattr(user, field, bool(value))

        for field, choices in self.CHOICE_FIELDS.items():
            if field in data:
                value = data.get(field)
                if isinstance(value, str) and value in choices:
                    setattr(user, field, value)

        user.save(update_fields=list(self.BOOLEAN_FIELDS) + list(self.CHOICE_FIELDS.keys()))
        return Response({"status": "ok"}, status=status.HTTP_200_OK)
