from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db import models
import uuid

from django.db.models import F

from authentication.models import User


class ChatStatus(models.Model):
    status_choices = (('delivered', 'delivered'), ('seen', 'seen'),)

    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    status = models.CharField(null=True, blank=True, choices=status_choices, max_length=15, default='delivered')
    chat = models.ForeignKey('Chat', on_delete=models.CASCADE, null=False, blank=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=False, blank=False)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.status} - {self.chat}"


class Chat(models.Model):
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    message = models.CharField(max_length=1000)
    timestamp = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    room = models.ForeignKey('ChatRoom', on_delete=models.CASCADE)

    class Meta:
        ordering = ['-timestamp']

    def save(self, *args, **kwargs):
        self.room.get_participants().exclude(uuid=self.user.uuid).update(dm_count=F('dm_count') + 1)
        super(Chat, self).save(*args, **kwargs)

    @property
    def date_time(self):
        return self.timestamp.strftime("%Y-%m-%d %H:%M:%S")

    def __str__(self):
        # print(dir(self))
        return f"{self.room} - {self.user} -- {self.message}"


class ChatRoom(models.Model):
    type_choices = (('private', 'Private'), ('group', "Group"))

    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=10, null=False, blank=False, default='private', choices=type_choices)
    room_id = models.CharField(null=True, blank=True, max_length=50)
    # user = models.ForeignKey(User, on_delete=models.CASCADE)

    def __str__(self):
        return f'{self.name}'

    def get_participants(self):
        # return self.participants.user.values_list('email', flat=True)
        return self.participants.user.all()


class ChatRequest(models.Model):
    status_choices = (('approved', 'approved'), ('rejected', 'rejected'), ('pending', 'pending'), )
    type_choices = (('private', 'Private'), ('group', "Group"))
    
    room_id = models.CharField(null=True, blank=True, max_length=50)
    name = models.CharField(max_length=50, default=None)
    sender = models.ForeignKey(User, related_name="sender_user",on_delete=models.CASCADE)
    receiver = models.ForeignKey(User, related_name="receiver_user",on_delete=models.CASCADE)
    type = models.CharField(max_length=10, null=False, blank=False, default='private', choices=type_choices)
    message = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)
    status =  models.CharField(max_length=255,default='pending', choices=status_choices)

class Participants(models.Model):
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ManyToManyField(User)
    room = models.OneToOneField(ChatRoom, on_delete=models.CASCADE)
    timestamp = models.DateTimeField(auto_now_add=True, null=True)

    def join(self, user):
        self.user.add(user)
        self.save()

    def leave(self, user):
        self.user.remove(user)
        self.save()
        
class ParticipantNotificationSettings(models.Model):
    user = models.ForeignKey(User, related_name="participant",on_delete=models.CASCADE)
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE)
    allow_notif = models.BooleanField(default=True)