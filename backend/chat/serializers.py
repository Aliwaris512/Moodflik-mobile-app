from rest_framework import serializers
from authentication.serializers import UserShowSerializer
from chat.models import ChatRoom, Chat, Participants, ChatStatus, ChatRequest


class ChatStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatStatus
        fields = ['uuid', 'status', 'timestamp', 'user']


class ParticipantsSerializer(serializers.ModelSerializer):
    user = UserShowSerializer(many=True)

    class Meta:
        model = Participants
        fields = ['user']


class ChatRoomSerializer(serializers.ModelSerializer):
    date_modified = serializers.SerializerMethodField(read_only=True)
    image = serializers.SerializerMethodField(read_only=True)
    unseen_message_count = serializers.SerializerMethodField(read_only=True)
    latest_message = serializers.SerializerMethodField(read_only=True)
    participants = ParticipantsSerializer()
    chat_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = ChatRoom
        fields = ['uuid', 'room_id', 'chat_name', 'image', 'date_modified', 'unseen_message_count', 'latest_message',
                  'participants']

    def get_date_modified(self, obj):
        try:
            return obj.chat_set.first().timestamp.strftime("%Y-%m-%d %H:%M:%S")
        except:
            return

    def get_image(self, obj):
        try:
            return obj.participants.user.exclude(uuid=self.context['request'].user.uuid).first().photo_url
        except:
            return

    def get_unseen_message_count(self, obj):
        try:
            user = self.context['request'].user
            return obj.chat_set.filter(chatstatus__user=user, chatstatus__status='delivered').count()
        except Exception as e:
            print(e)
            return

    def get_latest_message(self, obj):
        try:
            return obj.chat_set.first().message
        except:
            return

    def get_chat_name(self, obj):
        try:
            return obj.participants.user.exclude(uuid=self.context['request'].user.uuid).first().get_fullname()
        except:
            return

class ChatRequestSerializer(serializers.ModelSerializer):
    sender_info = UserShowSerializer(source='sender', read_only=True)

    class Meta:
        model = ChatRequest
        fields = ['id', 'room_id', 'name', 'sender', 'sender_info', 'receiver', 'type', 'message', 'timestamp', 'status']

class RoomParticipantsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Participants
        fields = ['user']


class RoomSerializer(serializers.ModelSerializer):
    participants = RoomParticipantsSerializer()

    class Meta:
        model = ChatRoom
        fields = ['uuid', 'name', 'type', 'room_id', 'participants']
        read_only_fields = ['uuid', ]

    def create(self, validated_data):
        print(validated_data)
        chatroom_obj = ChatRoom.objects.create(name=validated_data['name'], type=validated_data['type'],
                                               room_id=validated_data['room_id'])
        chatroom_obj.save()

        participants_list = validated_data.pop('participants')
        participants_obj = Participants.objects.create(room=chatroom_obj)
        for user in participants_list.get('user'):
            participants_obj.user.add(user)

        return chatroom_obj


class ChatSerializer(serializers.ModelSerializer):
    chatstatus_set = ChatStatusSerializer(many=True)
    datetime = serializers.SerializerMethodField(read_only=True)
    user = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Chat
        fields = ['uuid', 'message', 'datetime', 'user', 'chatstatus_set']

    def get_datetime(self, obj):
        return obj.timestamp.strftime("%Y-%m-%d %H:%M:%S")

    def get_user(self, obj):
        # Return user UUID as string for consistent frontend handling
        return str(obj.user.uuid)

