from django.apps import AppConfig


class MaritimeappConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'maritimeapp'
    middleware = []

    def ready(self):
        # Import the middleware here to avoid circular imports
        from .middleware import CorsMiddleware
        # Add the middleware to the middleware stack
        self.middleware.insert(0, CorsMiddleware)
