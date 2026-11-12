from django.contrib import admin
from .models import *

# Register your models here.


class UserNotificationAdmin(admin.ModelAdmin):
    list_display = (
        "notification_type",
        "notification_to",
        "notification_from",
        "message",
        "time",
    )
    ordering = ["-time", "-notification_type", "notification_to"]


admin.site.register(Post)
admin.site.register(PostReactions)
admin.site.register(Comments)
admin.site.register(Favourites)
admin.site.register(Seen)
admin.site.register(UserNotification, UserNotificationAdmin)
admin.site.register(ThreadOFPost)
admin.site.register(ThreadComments)
admin.site.register(MuteUnmute)
admin.site.register(CommentsNotifications)
admin.site.register(LikesDislikesNotifications)
admin.site.register(WhyCommentsNotifications)
admin.site.register(WhyReactionNotifications)
admin.site.register(ThreadCommentsNotification)