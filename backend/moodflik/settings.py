import os
import sys
from pathlib import Path
from dotenv import load_dotenv
import importlib
import environ


# Windows consoles default to cp1252; log lines contain emoji and symbols. Never let a print() crash a request.
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(errors="replace")
    except (AttributeError, ValueError):
        pass

BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv()

env = environ.Env(DEBUG=(bool, False))
environ.Env.read_env(os.path.join(BASE_DIR, ".env"))

SECRET_KEY = env(
    "SECRET_KEY",
    default="django-insecure-k_j@$(qk!j9soe41ht&$z=8-@tu*=i*5-36_!t+ppi8!76-6t^",
)
# Leave empty in development: links in emails then use the host the phone connected to.
BASE_URL = env("BASE_URL", default="")
ACTIVATION_BASE_URL = env("ACTIVATION_BASE_URL", default="")
FRONTEND_BASE_URL = env("FRONTEND_BASE_URL", default="")

# DEBUG = os.getenv('DEBUG', 'False')
DEBUG = env.bool("DEBUG", default=False)
print(DEBUG)
ALLOWED_HOSTS = env.list("ALLOWED_HOSTS", default=[])
CSRF_TRUSTED_ORIGINS = env.list(
    "CSRF_TRUSTED_ORIGINS",
    default=[FRONTEND_BASE_URL] if FRONTEND_BASE_URL else [],
)


INSTALLED_APPS = [
    "daphne",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "authentication",
    "post",
    "chat",
    "channels",
    "rest_framework",
    "corsheaders",
    "rest_framework_simplejwt",
    "django_filters",
]

AUTH_USER_MODEL = "authentication.User"

# CORS Configuration - Allow frontend in development
CORS_ALLOWED_ORIGINS = env.list(
    "CORS_ALLOWED_ORIGINS",
    default=[FRONTEND_BASE_URL] if FRONTEND_BASE_URL else [],
)
if DEBUG:
    # Expo web / dev clients call the API from changing localhost origins.
    CORS_ALLOW_ALL_ORIGINS = env.bool("CORS_ALLOW_ALL_ORIGINS", default=True)
    CORS_ORIGIN_ALLOW_ALL = CORS_ALLOW_ALL_ORIGINS
else:
    CORS_ALLOW_ALL_ORIGINS = env.bool("CORS_ALLOW_ALL_ORIGINS", default=False)
    CORS_ORIGIN_ALLOW_ALL = CORS_ALLOW_ALL_ORIGINS

from corsheaders.defaults import default_headers

CORS_ALLOW_HEADERS = (*default_headers, "x-http-method-override")
CORS_ALLOW_CREDENTIALS = True
# CSRF_TRUSTED_ORIGINS = ['https://3jsr3zzdq8.execute-api.us-east-1.amazonaws.com/',
#                         'https://moodflik.co.uk', 'https://moodflik.com', '54.152.72.6:443']

MIDDLEWARE = [
    "moodflik.method_override.MethodOverrideMiddleware",
    "moodflik.custom_middleware.AdminCsrfExemptMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    # 'django.middleware.csrf.CsrfViewMiddleware',
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "moodflik.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# WSGI_APPLICATION = 'moodflik.wsgi.application'
ASGI_APPLICATION = "moodflik.asgi.application"


# Database
# https://docs.djangoproject.com/en/3.2/ref/settings/#databases

"""
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql_psycopg2",
        "NAME": os.getenv("DB_NAME"),
        "USER": os.getenv("DB_USER"),
        "PASSWORD": os.getenv("DB_PASS"),
        "HOST": os.getenv("DB_HOST"),
        "PORT": os.getenv("DB_PORT"),
    }
}

"""


DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": os.path.join(
            BASE_DIR, "db.sqlite3"
        ),  # This creates or uses the db.sqlite3 file in your project directory
    }
}


REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 10,
}

from datetime import timedelta

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(days=365),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=365),
    "ROTATE_REFRESH_TOKENS": False,
    "BLACKLIST_AFTER_ROTATION": True,
    "ALGORITHM": "HS256",
    "SIGNING_KEY": SECRET_KEY,
    "VERIFYING_KEY": None,
    "AUDIENCE": None,
    "ISSUER": None,
    "USER_ID_FIELD": "uuid",
    "USER_ID_CLAIM": "user_id",
    "AUTH_HEADER_TYPES": ("Bearer",),
    "AUTH_TOKEN_CLASSES": ("rest_framework_simplejwt.tokens.AccessToken",),
    "TOKEN_TYPE_CLAIM": "token_type",
    "JTI_CLAIM": "jti",
    "SLIDING_TOKEN_REFRESH_EXP_CLAIM": "refresh_exp",
    "SLIDING_TOKEN_LIFETIME": timedelta(days=365),
    "SLIDING_TOKEN_REFRESH_LIFETIME": timedelta(days=365),
}

# Password validation
# https://docs.djangoproject.com/en/3.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

# Internationalization
# https://docs.djangoproject.com/en/3.2/topics/i18n/

LANGUAGE_CODE = "en-us"

TIME_ZONE = "Etc/Greenwich"

USE_I18N = True

USE_L10N = True

USE_TZ = True

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/3.2/howto/static-files/
if not DEBUG:
    # aws settings
    # STATIC_URL = f"https://moodflik-portal.s3.us-east-2.amazonaws.com/staticfiles/"
    # STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")
    STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")
    STATIC_URL = "/api/static/"


else:
    STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")
    STATIC_URL = "/api/static/"


MEDIA_URL = "/api/media/"
MEDIA_ROOT = os.path.join(BASE_DIR, "media")
STATICFILES_DIRS = [
    os.path.join(BASE_DIR, "static"),
]


# INTERNAL_IPS = [
#     "127.0.0.1",
# ]

USE_REDIS_CHANNEL_LAYER = env.bool("USE_REDIS_CHANNEL_LAYER", default=False)

if USE_REDIS_CHANNEL_LAYER:
    try:
        importlib.import_module("channels_redis")
    except ImportError:
        USE_REDIS_CHANNEL_LAYER = False
print(type(USE_REDIS_CHANNEL_LAYER))
# Gracefully fall back to in-memory layer when Redis is not available.
if USE_REDIS_CHANNEL_LAYER:
    CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels_redis.core.RedisChannelLayer",
            "CONFIG": {
                "hosts": [
                    (
                        env("REDIS_HOST", default="127.0.0.1"),
                        env.int("REDIS_PORT", default=6379),
                    )
                ]
            },
        }
    }
else:
    print("Using in-memory channel layer")
    CHANNEL_LAYERS = {"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
# EMAIL_HOST = "mail.privateemail.com"
# EMAIL_USE_TLS = True
# EMAIL_USE_SSL = False
# EMAIL_PORT = 587
# EMAIL_HOST_USER = "info@moodflik.com"
# EMAIL_HOST_PASSWORD = os.getenv("PYTHON_PASS")
# DEFAULT_FROM_EMAIL = EMAIL_HOST_USER

# Namecheap Private Email SMTP Configuration
EMAIL_BACKEND = env(
    "EMAIL_BACKEND", default="django.core.mail.backends.smtp.EmailBackend"
)
EMAIL_HOST = env("EMAIL_HOST", default="mail.privateemail.com")
EMAIL_PORT = env.int("EMAIL_PORT", default=587)
EMAIL_USE_TLS = env.bool("EMAIL_USE_TLS", default=True)
EMAIL_USE_SSL = env.bool("EMAIL_USE_SSL", default=False)
EMAIL_HOST_USER = env("EMAIL_HOST_USER", default="info@moodflik.com")
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD", default="")
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="info@moodflik.com")
EMAIL_TIMEOUT = env.int("EMAIL_TIMEOUT", default=10)

# Print email config on startup for debugging
print(
    f"[EMAIL CONFIG] Host: {EMAIL_HOST}, Port: {EMAIL_PORT}, User: {EMAIL_HOST_USER}, From: {DEFAULT_FROM_EMAIL}"
)


# AWS S3 settings
AWS_ACCESS_KEY_ID = env("AWS_ACCESS_KEY_ID", default="")
AWS_SECRET_ACCESS_KEY = env("AWS_SECRET_ACCESS_KEY", default="")
AWS_STORAGE_BUCKET_NAME = env("AWS_STORAGE_BUCKET_NAME", default="")
AWS_REGION = env("AWS_REGION", default="us-east-2")  # e.g., 'us-east-1'


#    const config = {
#       bucketName: "moodflik-portal",
#       dirName: "img" /* optional */,
#       region: "us-east-2",
#       accessKeyId: process.env.REACT_APP_ACCESS_ID,
#       secretAccessKey: process.env.REACT_APP_SECRET_KEY,
#     };
