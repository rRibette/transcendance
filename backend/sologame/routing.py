from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r"ws/sologame/(?P<room_name>[\w-]+)/$", consumers.SoloGameConsumer.as_asgi()),
]