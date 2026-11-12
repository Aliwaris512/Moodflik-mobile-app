"""
ASGI config for moodflik project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/3.2/howto/deployment/asgi/
"""

import os
from channels.auth import AuthMiddlewareStack
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from django.urls import path

from chat.consumer import ChatConsumer
from moodflik.custom_middleware import QueryAuthMiddleware
from post.consumer import NotificationConsumer

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'moodflik.settings')

# application = get_asgi_application()


application = ProtocolTypeRouter({
    # 'websocket': URLRouter(routing.ws_patterns)
    'http': get_asgi_application(),
    'websocket': QueryAuthMiddleware(
        URLRouter(
            [
                path('ws/notification-server/<str:user_id>/', NotificationConsumer.as_asgi()),
                path('ws/chat/<str:room_id>/', ChatConsumer.as_asgi()),
            ]
        )
    )
})