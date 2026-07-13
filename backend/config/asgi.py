"""
ASGI config for config project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application
from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from chat.routing import websocket_urlpatterns as chat_routes
from game.routing import websocket_urlpatterns as game_routes
from sologame.routing import websocket_urlpatterns as sologame_routes
from is_online.routing import websocket_urlpatterns as presence_routes

websocket_urlpatterns = chat_routes + game_routes + presence_routes + sologame_routes

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

#ASGI initialization used so
#AppRegistry is populated before importing code that may import ORM models
django_asgi_app = get_asgi_application()

application = ProtocolTypeRouter({
    'http': django_asgi_app,
    'websocket': AuthMiddlewareStack(URLRouter(websocket_urlpatterns)),
})

#websocket routing: when connection is made to channels dev server,
#ProtocolTypeRouter inspect type of connection
#if websocket co (ws:// wss://), sent to AuthMiddlewareStack
#AuthMiddleware populate co's scope with ref to authenticated user
#then gives it to URLRouter that examines HTTP path of co and route it to consumer via urlpatterns