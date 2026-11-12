import json
import os
import logging
from collections import defaultdict
import redis
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.db.models import Q

# Redis connection
logger = logging.getLogger(__name__)


def _presence_key(room_id):
    return f"room:{room_id}:online_users"


redis_conn = None
_fallback_online_users = defaultdict(set)


def _get_redis_client():
    """Lazy initialization of Redis client"""
    global redis_conn
    if redis_conn is not None:
        return redis_conn

    host = os.getenv("REDIS_HOST", "127.0.0.1")
    port = int(os.getenv("REDIS_PORT", "6379"))
    try:
        client = redis.StrictRedis(
            host=host,
            port=port,
            db=0,
            decode_responses=True,
            socket_connect_timeout=1,
            socket_timeout=1,
        )
        client.ping()
        logger.info("Connected to Redis at %s:%s for chat presence", host, port)
        redis_conn = client
        return redis_conn
    except redis.exceptions.RedisError as exc:
        logger.warning(
            "Redis unavailable at %s:%s (%s). Falling back to in-memory presence store.",
            host,
            port,
            exc,
        )
        redis_conn = False  # Mark as attempted but failed
        return None


def _presence_add(room_id, user_uuid):
    key = _presence_key(room_id)
    client = _get_redis_client()
    if client:
        try:
            client.sadd(key, user_uuid)
            return
        except redis.exceptions.RedisError as exc:
            logger.warning("Redis error while adding presence: %s", exc)
    _fallback_online_users[key].add(user_uuid)


def _presence_remove(room_id, user_uuid):
    key = _presence_key(room_id)
    client = _get_redis_client()
    if client:
        try:
            client.srem(key, user_uuid)
            return
        except redis.exceptions.RedisError as exc:
            logger.warning("Redis error while removing presence: %s", exc)
    room_set = _fallback_online_users.get(key)
    if room_set:
        room_set.discard(user_uuid)
        if not room_set:
            _fallback_online_users.pop(key, None)


def _presence_members(room_id):
    key = _presence_key(room_id)
    client = _get_redis_client()
    if client:
        try:
            return list(client.smembers(key))
        except redis.exceptions.RedisError as exc:
            logger.warning("Redis error while listing presence: %s", exc)
    return list(_fallback_online_users.get(key, set()))


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get("user")

        # Reject unauthenticated users
        if not self.user or not self.user.is_authenticated:
            await self.accept()
            await self.send(
                text_data=json.dumps(
                    {"type": "error", "message": "User is not authenticated"}
                )
            )
            await self.close()
            return

        # Assign room_id once and reuse everywhere
        self.room_id = self.scope["url_route"]["kwargs"]["room_id"]
        self.group_name = self.room_id

        # Validate chatroom access
        status, message = await self.get_user_chatroom(self.user, self.room_id)
        if not status:
            await self.accept()
            await self.send(text_data=json.dumps(message))
            await self.close()
            return

        # Join the group
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        # Add user to Redis online set
        _presence_add(self.room_id, str(self.user.uuid))

        # Send updated active users
        await self.broadcast_active_users()

    async def disconnect(self, close_code):
        if not hasattr(self, "room_id"):
            return  # rejected before joining a room
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

        # Remove from Redis set
        _presence_remove(self.room_id, str(self.user.uuid))

        # Send updated active users
        await self.broadcast_active_users()

        await self.close()

    async def receive(self, text_data):
        try:
            data_json = json.loads(text_data)
            message = data_json.get("message")

            if not message or not message.strip():
                await self.send(
                    text_data=json.dumps(
                        {"type": "error", "message": "Message cannot be empty"}
                    )
                )
                return

            # Save chat message (always use authenticated user, not frontend-sent uuid)
            try:
                saved_chat_obj = await self.save_message(
                    self.room_id, self.user.uuid, message
                )
            except Exception as e:
                print(f"Error saving message: {e}")
                await self.send(
                    text_data=json.dumps(
                        {"type": "error", "message": f"Failed to save message: {str(e)}"}
                    )
                )
                return

            # Prepare event data
            data = {
                "type": "send_message",
                "uuid": str(saved_chat_obj.uuid),
                "message": saved_chat_obj.message,
                "user": str(saved_chat_obj.user.uuid),
                "datetime": saved_chat_obj.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            }

            # Broadcast message to the group
            await self.channel_layer.group_send(self.group_name, data)

            # Update message status
            try:
                await self.save_message_status(saved_chat_obj.uuid)
            except Exception as e:
                print(f"Error saving message status: {e}")
        except json.JSONDecodeError:
            await self.send(
                text_data=json.dumps(
                    {"type": "error", "message": "Invalid message format"}
                )
            )
        except Exception as e:
            print(f"Error in receive: {e}")
            await self.send(
                text_data=json.dumps(
                    {"type": "error", "message": f"Error processing message: {str(e)}"}
                )
            )

    async def user_list(self, event):
        """Broadcast active users list"""
        await self.send(
            text_data=json.dumps({"type": "online_users", "users": event["users"]})
        )

    @database_sync_to_async
    def get_user_chatroom(self, user, room_id):
        from chat.models import ChatRoom
        from authentication.models import Block

        chatroom = ChatRoom.objects.filter(
            participants__user=user, room_id=room_id
        ).first()
        if not chatroom:
            return False, {"type": "Invalid_room_id", "message": "Invalid room ID"}

        if chatroom.type == "private" and Block.objects.filter(
            blocked_user__in=chatroom.get_participants(),
            user__in=chatroom.get_participants(),
        ).exists():
            return False, {"type": "user_blocked", "message": "User not found"}

        return True, ""

    async def send_message(self, event):
        """Send chat message to WebSocket"""
        await self.send(
            text_data=json.dumps(
                {
                    "type": "chat",
                    "uuid": event["uuid"],
                    "message": event["message"],
                    "user": event["user"],
                    "datetime": event["datetime"],
                }
            )
        )

    @database_sync_to_async
    def save_message(self, room_id, user_uuid, message):
        from chat.models import ChatRoom, Chat
        from authentication.models import User

        try:
            room = ChatRoom.objects.get(room_id=room_id)
        except ChatRoom.DoesNotExist:
            raise ValueError(f"Chat room {room_id} does not exist")

        try:
            user = User.objects.get(uuid=user_uuid)
        except User.DoesNotExist:
            raise ValueError(f"User {user_uuid} does not exist")

        # Verify user is a participant in this room
        # room.participants is a OneToOneField to Participants model
        # room.participants.user is a ManyToManyField to User
        if not room.participants.user.filter(uuid=user.uuid).exists():
            raise ValueError(f"User {user_uuid} is not a participant in room {room_id}")

        return Chat.objects.create(room=room, user=user, message=message)

    @database_sync_to_async
    def save_message_status(self, chat_uuid):
        from chat.models import Chat, ChatStatus

        chat_obj = Chat.objects.get(uuid=chat_uuid)
        receiver = self.user
        if chat_obj.user != receiver:
            chat_status, _ = ChatStatus.objects.get_or_create(
                user=receiver, chat=chat_obj, defaults={"status": "seen"}
            )
            if chat_status.status != "seen":
                chat_status.status = "seen"
                chat_status.save()

    async def chat_status(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "chat_status",
                    "uuid": event["uuid"],
                    "status": event["seen"],
                }
            )
        )

    async def broadcast_active_users(self):
        """Helper: send the current active users in this room"""
        online_users = _presence_members(self.room_id)
        active_users = []
        for uuid in online_users:
            user_payload = await self._get_visible_user(uuid)
            if user_payload:
                active_users.append(user_payload)

        await self.channel_layer.group_send(
            self.group_name, {"type": "user_list", "users": active_users}
        )

    @database_sync_to_async
    def _get_visible_user(self, uuid):
        from authentication.models import User

        user = (
            User.objects.select_related("Settings")
            .filter(uuid=uuid)
            .only("uuid", "username", "Settings__show_active_status")
            .first()
        )
        if not user:
            return None

        settings = getattr(user, "Settings", None)
        if settings and getattr(settings, "show_active_status", False):
            return {"uuid": str(user.uuid), "username": user.username}
        return None


@database_sync_to_async
def get_receivers(room, sender):
    """Helper: get message receivers"""
    # room.participants is a OneToOneField to Participants model
    # room.participants.user is a ManyToManyField to User
    return list(room.participants.user.exclude(uuid=sender.uuid))

