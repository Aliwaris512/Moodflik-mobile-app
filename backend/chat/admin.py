from django.contrib import admin

# Register your models here.
from chat.models import Chat, ChatRoom, Participants, ChatStatus, ParticipantNotificationSettings


class Admin(admin.ModelAdmin):
    search_fields = ('name', 'room_id')
    list_filter = ('name', )
    list_display = ['room_id', 'name', "type", "get_participants"]


class ChatAdmin(admin.ModelAdmin):
    search_fields = ('message', 'user', 'room')
    # list_filter = ('name',)
    list_display = ['user', 'message', "room", 'timestamp']


admin.site.register(Chat, ChatAdmin)
admin.site.register(ChatRoom, Admin)
admin.site.register(Participants)
admin.site.register(ChatStatus)
admin.site.register(ParticipantNotificationSettings)