import json
from channels.generic.websocket import AsyncWebsocketConsumer
from urllib.parse import parse_qs
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from .models import ChatHistory

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer): 
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
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = f"chat_{self.room_name}"
        allowed_users = [u for u in self.room_name.split("--") if u]
        if len(allowed_users) != 2 or allowed_users[0] == allowed_users[1] or self.user.username not in allowed_users:
            await self.close(code=4000)
            return
        other_user = next((u for u in allowed_users if u != self.user.username), None)
        if self.user.username not in allowed_users:
            # await self.accept()
            await self.close(code=4000)
            return
        blocked = (
            await self.user.blocked_users.filter(username=other_user).aexists()
            or await self.user.blocked_by.filter(username=other_user).aexists()
        )
        await self.accept()
        past_messages = ChatHistory.objects.filter(
            name=self.room_name
        ).select_related('user').order_by('-timestamp')[:50]
        logs_retrieval = []
        async for logs in past_messages:
            logs_retrieval.append({
                "message": logs.message,
                "user": logs.user.username if logs.user else "System",
            })
        for data in reversed(logs_retrieval):
            await self.send(text_data=json.dumps(data))
        if blocked:
            await self.close(code=4001)
            return
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)

    async def disconnect(self, close_code):
        if self.room_group_name:
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        username = self.user.username
        data = json.loads(text_data)
        if 'message' in data:
            message = data["message"]
            if not message.strip():
                return
            await self.message_to_database(message)
            await self.channel_layer.group_send(
                self.room_group_name,
                {"type": "chat.message", "message": message, "user": username},
            )
        elif 'typing' in data:
            await self.channel_layer.group_send(
                self.room_group_name,
                {"type": "user.typing", "typing": data['typing'], "user": username}
            )
        elif 'read' in data:
            await self.channel_layer.group_send(
                self.room_group_name,
                {"type": "read_receipt", "user": username}
            )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            "message": event["message"],
            "user": event["user"],
        }))

    async def user_typing(self, event):
        await self.send(text_data=json.dumps({
            "typing": event["typing"],
            "user": event["user"],
        }))

    async def message_to_database(self, content):
        room = self.room_name

        return await ChatHistory.objects.acreate(
            name=room,
            user=self.user,
            message=content,
        )

    async def read_receipt(self, event):
        await self.send(text_data=json.dumps({
            "read": True,
            "user": event["user"],
        }))
        