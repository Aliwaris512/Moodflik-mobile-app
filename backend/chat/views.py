import uuid
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from post.models import User
from chat.models import (
    ChatRoom,
    ParticipantNotificationSettings,
    ChatRequest,
    Participants,
    Chat,
    ChatStatus,
)
from authentication.models import PostNotification, Settings, Block
from chat.serializers import ChatRoomSerializer, ChatSerializer, RoomSerializer, ChatRequestSerializer
from rest_framework.views import APIView
from django.db.models import Max
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.core.exceptions import ValidationError as DjangoValidationError



class UserChatsView(viewsets.ModelViewSet):
    permission_classes = (permissions.IsAuthenticated, )
    serializer_class = ChatRoomSerializer

    def queryset(self):
        return ChatRoom.objects.filter(participants__user=self.request.user)

    def get_object(self):
        obj = self.filter_queryset(self.get_queryset())
        self.check_object_permissions(self.request, obj)
        return obj

    def list_rooms(self, *args, **kwargs):
        rooms = self.get_object()()
        serializer_data = self.get_serializer(rooms, many=True).data
        self.request.user.dm_count = 0
        self.request.user.save()
        return Response(serializer_data)

    def get_message(self, *args, **kwargs):
        # number = 50
        number = self.request.query_params.get('number', 50)
        room_id = self.request.query_params.get('room_id')
        chats = self.get_object()().get(uuid=room_id).chat_set.all().order_by('timestamp')
        if number:
            chats = chats[:int(number)]
        for chat in chats:
            for status in chat.chatstatus_set.filter(status='delivered', user=self.request.user):
                status.status = 'seen'
                status.save()
        serializer_data = ChatSerializer(chats, many=True).data
        return Response(serializer_data)

    def create_room(self, *args, **kwarg):
        room_data = self.request.data
        users_list = room_data['participants']['user']
        if ChatRoom.objects.filter(participants__user=users_list[0]).filter(participants__user=users_list[1]):
            return Response({'message': 'Chat room already exist!'})

        serializer = RoomSerializer(data=room_data)
        if serializer.is_valid(raise_exception=True):
            room_id = uuid.uuid4()
            serializer.save(room_id=room_id)

        return Response({'message': 'Chatroom created successfully!'})

class SendMessage(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    def post(self, request, *args, **kwargs):
        user = request.user
        action = request.data.get("action")
        if action == "group":
            return self.send_in_group(user, request)
        elif action == "private":
            return self.send_in_private(user,request)
        else:
            return Response("Invalid action",
                            status=status.HTTP_400_BAD_REQUEST)
    def send_in_group(self, user, request):
        room_id = request.data.get("room_id") or str(uuid.uuid4())
        message = request.data.get("message") or ""
        receivers = request.data.get("receivers",[])
        group_name = request.data.get("name")
        if not message.strip():
            return Response(
                "Message cannot be empty", status=status.HTTP_400_BAD_REQUEST
            )
        if len(message) > 1000:
            return Response("Message too long",
                            status=status.HTTP_400_BAD_REQUEST)
        blocked = []
        sanitized_receivers = []
        for receiver in receivers:
            check_receiver = User.objects.get(uuid=receiver)
            if Block.objects.filter(user=check_receiver, blocked_user=user).exists():
                blocked.append(check_receiver.username)
                continue
            sanitized_receivers.append(check_receiver)

        if len(blocked) > 0:
            restricted_users = ', '.join(blocked)
            return Response(f"Unable to send message to these users : {restricted_users}",
                            status=status.HTTP_403_FORBIDDEN)

        room, _ = ChatRoom.objects.get_or_create(
            room_id=room_id,
            defaults={"type": "group", "name": group_name or user.username},
        )
        if room.type != "group":
            return Response("Invalid room type", status=status.HTTP_400_BAD_REQUEST)
        if group_name and room.name != group_name:
            room.name = group_name
            room.save(update_fields=["name"])

        participants, _ = Participants.objects.get_or_create(room=room)
        participants.user.add(user, *sanitized_receivers)
        Chat.objects.create(message=message, user=user, room=room)

        return Response("Message sent successfully", status = status.HTTP_200_OK)

    def send_in_private(self, user, request):
        room_id = request.data.get("room_id")
        message = request.data.get("message") or ""
        receive = request.data.get("receiver")
        try:
            receiver = User.objects.get(uuid=receive, is_deleted=False)
        except (User.DoesNotExist, ValueError, TypeError, DjangoValidationError):
            return Response("User not found", status=status.HTTP_404_NOT_FOUND)

        blocked = Block.objects.filter(user = receiver, blocked_user = user).exists()
        if blocked:
            return Response("Unable to send message to this user",
                            status=status.HTTP_403_FORBIDDEN)

        if not message.strip():
            return Response(
                "Message cannot be empty", status=status.HTTP_400_BAD_REQUEST
            )
        if len(message) > 1000:
            return Response("Message too long",status=status.HTTP_400_BAD_REQUEST)
        if not room_id:
            existing = (
                ChatRoom.objects.filter(type="private", participants__user=user)
                .filter(participants__user=receiver)
                .first()
            )
            if existing:
                room_id = existing.room_id
            else:
                users = sorted([str(user.uuid), str(receiver.uuid)])
                room_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, "-".join(users)))
        room, _ = ChatRoom.objects.get_or_create(
            room_id=room_id,
            defaults={"type": "private", "name": user.username},
        )
        if room.type != "private":
            return Response("Invalid room type", status=status.HTTP_400_BAD_REQUEST)

        participants, _ = Participants.objects.get_or_create(room=room)
        participants.user.add(user, receiver)
        chat = Chat.objects.create(message=message, user=user, room=room)

        return Response(
            {
                "message": "Message sent successfully",
                "room_id": room.room_id,
                "chat": ChatSerializer(chat).data,
            },
            status=status.HTTP_200_OK,
        )


class ChatView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    def get(self, request, *args, **kwargs):
        user = request.user
        action = (
            kwargs.get("action")
            or request.query_params.get("action")
            or request.data.get("action")
        )
        if not action and request.query_params.get("room_id"):
            action = "specific_chat"
        if action == "all_chats":
            return self.all_chats(user, request)
        elif action == "specific_chat":
            return self.chat(user,request)
        else:
            return Response("Invalid action",
                            status=status.HTTP_400_BAD_REQUEST)

    def all_chats(self, user, request):
        rooms = (
            ChatRoom.objects.filter(participants__user=user)
            .annotate(last_message=Max("chat__timestamp"))
            .order_by("-last_message", "-uuid")
            .distinct()
            .prefetch_related("participants__user")
        )
        if not rooms:
            user.dm_count = 0
            user.save(update_fields=["dm_count"])
            return Response([], status=status.HTTP_200_OK)

        serializer = ChatRoomSerializer(
            rooms, many=True, context={"request": request}
        )
        if user.dm_count:
            user.dm_count = 0
            user.save(update_fields=["dm_count"])
        return Response(serializer.data, status=status.HTTP_200_OK)

    def chat(self, user, request, room_id=None):
        room_id = (
            room_id
            or request.query_params.get("room_id")
            or request.data.get("room_id")
        )
        if not room_id:
            return Response(
                {"detail": "room_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not ChatRoom.objects.filter(
            participants__user=user, room_id=room_id
        ).exists():
            return Response("No messages found", status=status.HTTP_404_NOT_FOUND)

        chat_qs = (
            Chat.objects.filter(room__room_id=room_id)
            .select_related("user", "room")
            .prefetch_related("chatstatus_set")
            .order_by("timestamp")
        )

        ChatStatus.objects.filter(
            chat__room__room_id=room_id,
            user=user,
            status="delivered",
        ).update(status="seen")

        serializer = ChatSerializer(chat_qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ChatRoomListView(ChatView):
    def get(self, request, *args, **kwargs):
        return self.all_chats(request.user, request)


class ChatMessagesView(ChatView):
    def get(self, request, *args, **kwargs):
        return self.chat(request.user, request, kwargs.get("room_id"))

class UserPrefrenceChatNotifications(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def patch(self, request, room_id=None, *args, **kwargs):
        user = request.user
        action = request.data.get("action")
        if not isinstance(action, bool):
            return Response(
                {"error": "Invalid action. Must be true or false (boolean)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        room_identifier = room_id or request.data.get("room_id")
        if not room_identifier:
            return Response(
                {"error": "room_id is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        room = get_object_or_404(ChatRoom, room_id=room_identifier)
        if not room.participants.user.filter(uuid=user.uuid).exists():
            return Response(status=status.HTTP_403_FORBIDDEN)

        general_settings = getattr(user, "user_id", None)
        if general_settings and not general_settings.allow_notif:
            return Response(
                "General settings for notifications have been turned off.",
                status=status.HTTP_400_BAD_REQUEST,
            )

        settings_obj, _ = ParticipantNotificationSettings.objects.get_or_create(
            user=user, room=room
        )
        settings_obj.allow_notif = action
        settings_obj.save(update_fields=["allow_notif"])

        status_text = "enabled" if action else "disabled"
        return Response(
            f"Notifications have been {status_text} for this chat",
            status=status.HTTP_200_OK,
        )

class HandleDmRequests(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    def patch(self, request, *args, **kwargs):
        user = request.user
        room = request.data.get("room_id")
        action = request.data.get("action")

        if action == "reject_all":
            return self.reject_all_requests(user, request)

        elif action =="reject_request":
            return self.reject_request(user, request, room)

        elif action =="accept_all":
            return self.accept_all_requests(user, request)

        elif action =="accept_request":
            return self.accept_request(user, request, room)

        else:
            return Response("request type not found",
                            status=404)

    def get(self, request, *args, **kwargs):
        user = request.user
        query = ChatRequest.objects.filter(receiver=user, status="pending")
        ser = ChatRequestSerializer(query.order_by("-timestamp"), many=True)
        return Response(ser.data, status=status.HTTP_200_OK)


    def reject_all_requests(self, user, request): # reject all

        updated = ChatRequest.objects.filter(
            receiver=user, status="pending"
        ).update(status="rejected")
        if not updated:
            return Response("No dm requests found to delete")
        return Response("All requests rejected", status=status.HTTP_200_OK)

    def reject_request(self, user, request, room): # del specific
        updated = ChatRequest.objects.filter(
            receiver=user, room_id=room, status="pending"
        ).update(status="rejected")
        if not updated:
            return Response(
                {"message": "Request not found"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response("Dm request has been deleted")

    def accept_all_requests(self, user, request): # accept all
        pending_requests = ChatRequest.objects.select_related(
            "sender", "receiver"
        ).filter(receiver=user, status="pending")
        if not pending_requests.exists():
            return Response("You have no dm requests")

        with transaction.atomic():
            for dm in pending_requests:
                self._accept_request(dm)
        return Response("All dm requests have been approved")

    def accept_request(self, user, request, room):
        dm = ChatRequest.objects.select_related("sender", "receiver").filter(
            receiver=user, room_id=room, status="pending"
        ).first()
        if not dm:
            return Response(
                {"message": "Request not found"}, status=status.HTTP_400_BAD_REQUEST
            )

        self._accept_request(dm)
        return Response("Dm request has been approved")

    def _accept_request(self, dm_request: ChatRequest):
        dm_request.status = "approved"
        dm_request.save(update_fields=["status"])

        room, _ = ChatRoom.objects.get_or_create(
            room_id=dm_request.room_id,
            defaults={"name": dm_request.name, "type": dm_request.type},
        )
        participants, _ = Participants.objects.get_or_create(room=room)
        participants.user.add(dm_request.sender, dm_request.receiver)

        if dm_request.message:
            chat_exists = Chat.objects.filter(
                room=room,
                user=dm_request.sender,
                message=dm_request.message,
            ).exists()
            if not chat_exists:
                Chat.objects.create(
                    room=room,
                    user=dm_request.sender,
                    message=dm_request.message,
                )


class SendDmRequests(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, *args, **kwargs):
        user = request.user
        type = request.data.get("type")

        if type == "group":
            return self.send_in_group(user, request)
        elif type == "private":
            return self.send_private_dm(user, request)
        return Response("type must be 'private' or 'group'", status=status.HTTP_400_BAD_REQUEST)

    def send_in_group(self, user, request):

        message = (request.data.get("message") or "").strip()
        grp_name = request.data.get("name")
        grp_id = str(uuid.uuid4())
        receivers = request.data.get("receivers",[])
        if not receivers:
            return Response(
                {"detail": "No receivers provided."},
                status=status.HTTP_400_BAD_REQUEST
            )

        blocked = []
        valid_receivers = []
        for receiver in receivers:
            check_receiver = User.objects.get(uuid=receiver)
            if not check_receiver.Settings.allow_requests:
                blocked.append(check_receiver.username)
                continue
            valid_receivers.append(check_receiver)


        if len(blocked) > 0:
            blocked_list = ", ".join(blocked)
            return Response(
                {
                    "detail": "These users don't allow messages from unknown users: "
                    f"{blocked_list}"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        for check_receiver in valid_receivers:
            ChatRequest.objects.create(
                room_id = grp_id ,name = grp_name,
                sender = user, receiver = check_receiver,
                message = message,
                type = "group")

        return Response("Message has been sent to the group")

    def send_private_dm(self, user, request):

        message = (request.data.get("message") or "").strip()
        name = user.username
        receiver = request.data.get("receiver")
        try:
            check_receiver = User.objects.get(uuid=receiver, is_deleted=False)
        except (User.DoesNotExist, ValueError, TypeError, DjangoValidationError):
            return Response("User not found", status=status.HTTP_404_NOT_FOUND)
        if not message:
            return Response("Message cannot be empty", status=status.HTTP_400_BAD_REQUEST)
        if Block.objects.filter(user=check_receiver, blocked_user=user).exists():
            return Response("Unable to send message to this user", status=status.HTTP_403_FORBIDDEN)
        if ChatRequest.objects.filter(
            sender=user, receiver=check_receiver, status="pending", type="private"
        ).exists():
            return Response("You already have a pending request with this user")
        if not check_receiver.Settings.allow_requests:
            return Response(f"{check_receiver.username} doesn't allow messages from unknown users",
                            status=status.HTTP_400_BAD_REQUEST)

        ChatRequest.objects.create(
            room_id=str(uuid.uuid4()),
            name=name,
            sender=user,
            receiver=check_receiver,
            message=message,
            type="private",
        )
        return Response(f"Message sent to {check_receiver.username}")

# class SearchParticipantsView(generics.ListAPIView):
#     queryset = User.objects.all()
#     serializer_class = UserShowSerializer
#     filter_backends = [filters.SearchFilter]
#     search_fields = ['first_name', 'last_name']
