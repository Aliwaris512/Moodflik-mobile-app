import json
from channels.generic.websocket import AsyncWebsocketConsumer, WebsocketConsumer

import json
from channels.generic.websocket import AsyncWebsocketConsumer

class NotificationConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        user = self.scope.get("user")
        if not user or not getattr(user, "uuid", None):
            # Fixed unauthorized handling (was sending then closing immediately)
            await self.accept()
            await self.send(text_data=json.dumps({
                "type": "unauthorized",
                "message": "Not Authenticated"
            }))
            await self.close(code=4003)  # Forbidden
            return

        self.group_name = str(user.uuid)
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        print(f"Connected to group {self.group_name}")

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):

        text_data_json = json.loads(text_data)
        message = text_data_json.get("message")

        # Optional echo back for testing
        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "send_notification",
                "message": {"echo": message}
            }
        )

    async def send_notification(self, event):
        """
        Called when group_send dispatches to this consumer
        """
        # previous code did `await json.loads(event)` (wrong!)
        message = event.get("message", {})
        print("Dispatching notification:", message)

        # Wrap with type for frontend
        data = {**message, "type": "notification"}
        await self.send(text_data=json.dumps(data))
