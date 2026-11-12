"""moodflik URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve
from django.urls import re_path
import authentication.views as auth_view

urlpatterns = [
    path('api/admin/', admin.site.urls),
    path('api/', include('authentication.urls')),
    path('api/', include('post.urls')),
    path('api/chat/', include('chat.urls')),  # HTTP endpoints for chat
    # path('chat/', include('chat.urls')),  # WebSocket endpoints for chat

    path('api/.well-known/apple-app-site-association', auth_view.apple_file, name='applefile')
]

# Serve media files - always enabled (works in both DEBUG and production)
# Media files need to be accessible regardless of DEBUG setting
urlpatterns += [
    re_path(r'^%s(?P<path>.*)$' % settings.MEDIA_URL.lstrip('/'), serve, {'document_root': settings.MEDIA_ROOT}),
]

# Serve static files only in DEBUG mode
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)