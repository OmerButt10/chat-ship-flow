from .base import *  # noqa: F401,F403

# Development specific settings
DEBUG = True

# Allow all hosts in dev
ALLOWED_HOSTS = ["*"]

# In dev, it's okay to use a local file-based email backend
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# CORS for frontend development
INSTALLED_APPS += [
	"corsheaders",
]

MIDDLEWARE = [
	"corsheaders.middleware.CorsMiddleware",
] + MIDDLEWARE

# Allow all origins in dev - tighten in production
CORS_ALLOW_ALL_ORIGINS = True

