import json
from channels.generic.websocket import AsyncWebsocketConsumer
from urllib.parse import parse_qs
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
# from .models import ChatHistory

User = get_user_model()

class PresenceConsumer(AsyncWebsocketConsumer): 
    async def connect(self):
        self.room_group_name = None        
        query_string = self.scope["query_string"].decode()
        params = parse_qs(query_string)
        token = params.get("token", [None])[0]
        if not token:
            await self.close()
            return
        try:
            access_token = AccessToken(token)
            user_id = access_token["user_id"]
            self.user = await User.objects.aget(id=user_id)
        except Exception as e:
            await self.close()
            return
        self.user.is_online = True
        await self.channel_layer.group_add("presence", self.channel_name)
        await User.objects.filter(id=self.user.id).aupdate(is_online=True)
        await self.accept()
        await self.broadcast(True)

    async def disconnect(self, close_code):
        if hasattr(self, 'user'):
            await User.objects.filter(id=self.user.id).aupdate(is_online=False)
            await self.broadcast(False)
            await self.channel_layer.group_discard("presence", self.channel_name)
    async def broadcast(self, online):
        await self.channel_layer.group_send("presence", {
            "type": "presence.update",
            "user_id": self.user.id,
            "is_online": online,
        })
    async def presence_update(self, event):
        await self.send(text_data=json.dumps({
            "user_id": event["user_id"],
            "is_online": event["is_online"],
        }))