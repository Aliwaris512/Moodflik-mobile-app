from django.db.models.signals import post_save
from django.dispatch import receiver
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import ChatStatus

@receiver(post_save, sender=ChatStatus)
def send_chat_status(sender, instance, created, **kwargs):
    if not created:
        return
    channel_layer = get_channel_layer()
    if not channel_layer:
        return
    
    async_to_sync(channel_layer.group_send)(
        str(instance.chat.room.room_id),
        {
            "type": "chat_status",
            "uuid": str(instance.chat.uuid),
            "message": instance.chat.message,
            "seen": [str(obj.user.uuid) for obj in instance.chat.chatstatus_set.all()]
        }
    )
