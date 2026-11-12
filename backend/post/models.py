import datetime
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.db import models
from authentication.models import User, BaseModel, FollowRequest
import uuid
from django.utils import timezone

from chat.models import ChatRoom, ChatRequest


class Post(models.Model):
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    posted_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="posted_by", null=True, blank=True
    )
    tagged = models.ManyToManyField(User, related_name="tagged", blank=True)
    post_type = models.CharField(max_length=130)
    content = models.CharField(max_length=2000, default="", null=True)
    media_url = models.URLField(max_length=2000, null=True, blank=True)
    content_type = models.CharField(max_length=130, null=True, blank=True)
    why_content = models.CharField(max_length=150, null=True, blank=True)
    like_count = models.IntegerField(default=0)
    dislike_count = models.IntegerField(default=0)
    why_dislike_count = models.IntegerField(default=0, null=True, blank=True)
    comment_like_count = models.IntegerField(default=0, null=True, blank=True)
    comment_dislike_count = models.IntegerField(default=0, null=True, blank=True)
    why_like_count = models.IntegerField(default=0, null=True, blank=True)
    share_count = models.IntegerField(default=0)
    comments_count = models.IntegerField(default=0)
    seen_count = models.IntegerField(default=0)
    favourite_count = models.IntegerField(default=0)
    mood_type = models.CharField(max_length=99, default="")
    flag = models.BooleanField(default=False, null=True, blank=True)
    active = models.BooleanField(null=True, blank=True, default=True)
    enable_ask_why = models.BooleanField(default=True)
    enable_ask_why_notifications = models.BooleanField(default=True)
    enable_comments = models.BooleanField(default=True)
    edited = models.BooleanField(default=False)


    def __str__(self):
        return f"{self.content} - {self.posted_by}"

    @property
    def post_comments(self):
        return Comments.objects.filter(post=self).values(
            "uuid",
            "user__first_name",
            "user__last_name",
            "post",
            "user__uuid",
            "user__photo_url",
            "comment",
        )

    @property
    def posted_time(self):
        if not self.created_at:
            return ""
        seconds = int((timezone.now() - self.created_at).total_seconds())
        if seconds < 0:
            return ""
        if seconds < 10:
            return "just now"
        if seconds < 60:
            return f"{seconds} seconds ago"
        if seconds < 120:
            return "a minute ago"
        if seconds < 3600:
            return f"{seconds // 60} minutes ago"
        if seconds < 7200:
            return "an hour ago"
        if seconds < 86400:
            return f"{seconds // 3600} hours ago"
        days = seconds // 86400
        if days == 1:
            return "Yesterday"
        if days < 7:
            return f"{days} days ago"
        if days < 31:
            return f"{days // 7} weeks ago"
        if days < 365:
            return f"{days // 30} months ago"
        return f"{days // 365} years ago"

    # @property
    def user_ticks(self, user_id):
        like = PostReactions.objects.filter(
            post=self, reaction="like", user=user_id
        ).exists()
        dislike = False
        if not like:
            dislike = PostReactions.objects.filter(
                post=self, reaction="dislike", user=user_id
            ).exists()
        comment = Comments.objects.filter(post=self, user=user_id).exists()
        favourite = Favourites.objects.filter(post=self, user=user_id).exists()
        return {
            "favourite": favourite,
            "like": like,
            "dislike": dislike,
            "comment": comment,
        }

class MentionsNotifications(models.Model):
    user =  models.ForeignKey(
        User, related_name="mentioned_user", on_delete=models.CASCADE, null=True, blank=True
    )

    banned_user = models.ForeignKey(
        User, related_name="restricted_user", on_delete=models.CASCADE, null=True, blank=True
    )

class CommentsNotifications(models.Model):
    post_owner =  models.ForeignKey(
        User, related_name="owner", on_delete=models.CASCADE, null=True, blank=True
    )

    banned_user = models.ForeignKey(
        User, related_name="ban", on_delete=models.CASCADE, null=True, blank=True
    )

class LikesDislikesNotifications(models.Model):
    post_owner =  models.ForeignKey(
        User, related_name="owner_id", on_delete=models.CASCADE, null=True, blank=True
    )

    banned_user = models.ForeignKey(
        User, related_name="banned", on_delete=models.CASCADE, null=True, blank=True
    )

class WhyReactionNotifications(models.Model):
    post_owner =  models.ForeignKey(
        User, related_name="owner_acc", on_delete=models.CASCADE, null=True, blank=True
    )
    banned_user = models.ForeignKey(
        User, related_name="banned_acc", on_delete=models.CASCADE, null=True, blank=True
    )
"""    post = models.ForeignKey(
        Post, related_name="post_uuid", on_delete=models.CASCADE, null=True, blank=True
    )
"""


class WhyCommentsNotifications(models.Model):
    post_owner =  models.ForeignKey(
        User, related_name="post_own", on_delete=models.CASCADE, null=True, blank=True
    )
    banned_user = models.ForeignKey(
    User, related_name="ban_id", on_delete=models.CASCADE, null=True, blank=True
    )
"""
    post = models.ForeignKey(
        Post, related_name="post_uuid", on_delete=models.CASCADE, null=True, blank=True
    )
"""

class PostReactions(models.Model):
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(
        User, related_name="user_uuid", on_delete=models.CASCADE, null=True, blank=True
    )
    post = models.ForeignKey(
        Post, related_name="post_uuid", on_delete=models.CASCADE, null=True, blank=True
    )
    reaction = models.CharField(
        max_length=255, choices=[("like", "like"), ("dislike", "dislike")]
    )

class WhyReactions(models.Model):
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(
        User, related_name="why_user_uuid", on_delete=models.CASCADE, null=True, blank=True
    )
    why_post = models.ForeignKey(
        Post, related_name="why_post_uuid", on_delete=models.CASCADE, null=True, blank=True
    )
    reaction = models.CharField(
        max_length=255, choices=[("like", "like"), ("dislike", "dislike")]
    )


class Comments(models.Model):  # ,MPTTModel):
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(
        User, related_name="post_user", on_delete=models.CASCADE, null=True, blank=True
    )
    post = models.ForeignKey(
        Post, related_name="user_post", on_delete=models.CASCADE, null=True, blank=True
    )
    comment = models.TextField()

    # parent = TreeForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children')

    class MPTTMeta:
        order_insertion_by = ["comment"]

class CommentsReactions(models.Model):
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(
        User, related_name="comment_user_uuid", on_delete=models.CASCADE, null=True, blank=True
    )
    comments = models.ForeignKey(
        Comments, related_name="comment_post_uuid", on_delete=models.CASCADE, null=True, blank=True
    )
    reaction = models.CharField(
        max_length=255, choices=[("like", "like"), ("dislike", "dislike")]
    )

class Follow(BaseModel):
    follower = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="Follower"
    )
    following = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="Following"
    )
    follow_request = models.ForeignKey(
        FollowRequest, on_delete=models.CASCADE, null=True, blank=True
    )

    def __str__(self):
        return f"follower {self.follower} -> following {self.following}"


class Favourites(models.Model):  # ,MPTTModel)
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(
        User, related_name="user_fav", on_delete=models.CASCADE, null=True, blank=True
    )
    post = models.ForeignKey(
        Post, related_name="fav_post", on_delete=models.CASCADE, null=True, blank=True
    )


class Seen(models.Model):  # ,MPTTModel)
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(
        User, related_name="user_seen", on_delete=models.CASCADE, null=True, blank=True
    )
    post = models.ForeignKey(
        Post, related_name="seen_post", on_delete=models.CASCADE, null=True, blank=True
    )


class PostReport(models.Model):
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    post = models.ForeignKey(Post, null=False, blank=False, on_delete=models.CASCADE)
    reported_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.CASCADE
    )
    reason = models.CharField(max_length=255, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(
        max_length=25,
        null=False,
        blank=False,
        choices=(
            ("under_investigation", "Under Investigation"),
            ("cleared", "Cleared"),
            ("taken_down", "Taken Down"),
        ),
        default="under_investigation",
    )

    def __str__(self):
        return f"{self.post.content} reported by {self.reported_by}"

    def post_owner(self):
        return self.post.posted_by


class Mention(models.Model):
     type_choices = (('post', 'post'), ('comment', 'comment'),('why', 'why'), )

     uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
     post = models.ForeignKey(Post, null=True, blank=True, on_delete=models.CASCADE)
     comment = models.ForeignKey(Comments, null=True, blank=True, on_delete=models.CASCADE)
     type = models.CharField(choices=type_choices, max_length=10, default='post')
     created_at = models.DateTimeField(auto_now_add=True)
     mention_by = models.ForeignKey('authentication.User', null=False, blank=False, on_delete=models.CASCADE, related_name='mention_by')
     mention_to = models.ForeignKey('authentication.User', blank=False, null=False, on_delete=models.CASCADE, related_name='mention_to')

     def __str__(self):
         if self.type == 'post':
             return f"{self.mention_by} mentioned {self.mention_to} on {self.post}"
         elif self.type == 'comment':
             return f"{self.mention_by} mentioned {self.mention_to} in {self.post}"

class ThreadOFPost(models.Model):  # ,MPTTModel):
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(
        User,
        related_name="thread_user",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    post = models.ForeignKey(
        Post,
        related_name="thread_post",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    name = models.CharField(max_length=50)


class ThreadComments(models.Model):  # ,MPTTModel):
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(
        User,
        related_name="thread_user_comments",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    thread = models.ForeignKey(
        ThreadOFPost,
        related_name="thread_thread",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    post = models.ForeignKey(
        Post,
        related_name="thread_post_comments",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    comment = models.TextField()

class ThreadCommentsNotification(models.Model):
    thread_owner =  models.ForeignKey(
        User, related_name="owner_thread", on_delete=models.CASCADE, null=True, blank=True
    )
    banned_user = models.ForeignKey(
        User, related_name="ban_user", on_delete=models.CASCADE, null=True, blank=True
    )

class UserNotification(models.Model):
    notif_type = (
        ("favourite", "Favourite"),
        ("comment", "Comment"),
        ("reaction", "Reaction"),
        ("follow", "Follow"),
        ("post_report", "Post report"),
        ("chat", "Chat"),
        ("friend_request", "Friend Request"),
        ("thread_comment", "Thread Comment"),  # Added type for thread comments
        (
            "post_comment_on_thread",
            "Post Comment on Thread",
        ),  # New type for comment on thread
        ("new_thread", "New Thread"),  # New type for new thread creation
        ("posted", "Posted"),
        ("dm_request", "Dm Request"),
        ("mention", "Mention"),
    )

    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    notification_type = models.CharField(max_length=255, choices=notif_type, blank=True)
    notification_to = models.ForeignKey(
        User, blank=True, on_delete=models.CASCADE, related_name="notification_to"
    )
    notification_from = models.ForeignKey(
        User, blank=True, on_delete=models.CASCADE, related_name="notification_from"
    )
    post = models.ForeignKey(Post, blank=True, null=True, on_delete=models.CASCADE)
    chat_room = models.ForeignKey(
        ChatRoom, blank=True, null=True, on_delete=models.CASCADE
    )
    follow_request = models.ForeignKey(
        FollowRequest, blank=True, null=True, on_delete=models.CASCADE
    )
    follow = models.ForeignKey(Follow, blank=True, null=True, on_delete=models.CASCADE)
    comment = models.ForeignKey(
        Comments, blank=True, null=True, on_delete=models.CASCADE
    )
    thread = models.ForeignKey(
        ThreadOFPost, blank=True, null=True, on_delete=models.CASCADE
    )
    reaction = models.ForeignKey(
        PostReactions, blank=True, null=True, on_delete=models.CASCADE
    )
    favourite = models.ForeignKey(
        Favourites, blank=True, null=True, on_delete=models.CASCADE
    )
    seen = models.BooleanField(default=False)
    message = models.CharField(max_length=150, blank=True)
    time = models.DateTimeField(default=timezone.now)
    dm_request = models.ForeignKey(
        ChatRequest, blank=True, null=True, on_delete=models.CASCADE
    )
    mention = models.ForeignKey(Mention, null = True, blank = True, on_delete=models.CASCADE)
    thread_comment = models.ForeignKey(
        ThreadComments, blank=True, null=True, on_delete=models.CASCADE
    )  # Field for thread comment notifications

    def __str__(self):
        return f"{self.notification_to.get_fullname()}({self.notification_type}) - {self.message}"

    def save(self, *args, **kwargs):
        try:
            super(UserNotification, self).save(*args, **kwargs)
            print(self.notif_type)


            print(f"Saving notification for {self.notification_to.username} from {self.notification_from.username}")
            channel_layer = get_channel_layer()
            if not channel_layer:
                print("Channel layer is not configured.")
                return

            self.notification_to.notification_count += 1
            self.notification_to.save()


            data = {
                "type": "send_notification",
                "sender_image": self.notification_from.photo_url,
                "message": self.message,
                "datetime": self.time.strftime("%Y-%m-%d %H:%M:%S"),
                "count": self.notification_to.notification_count,
                "dm_count": self.notification_to.dm_count,
            }

            print(f"Notification data prepared: {data}")

            if self.notification_from == self.notification_to:
                print("Notification skipped: self-notification.")
                return

            if self.follow:
                data["follow"] = {"user_id": str(self.follow.following.uuid)}
            elif self.favourite:
                data["favourite"] = {"post_id": str(self.post.uuid)}
            elif self.follow_request:
                data["follow_request"] = {"user_id": str(self.follow_request.sender.uuid)}
            elif self.chat_room and self.notification_to.user_id.chat_alert:
                data["chat_room"] = {
                    "chat_room": str(self.chat_room.room_id),
                    "uuid": str(self.chat_room.uuid),
                    "user": self.notification_from.get_fullname(),
                }
            elif self.dm_request and self.notification_to.user_id.dm_requests:
                data["dm_request"] = {
                    "room_id": str(self.dm_request.room_id),
                }
            elif self.comment and self.notification_to.user_id.comments:
                data["comment"] = {"post_id": str(self.post.uuid)}
            elif self.reaction and self.notification_to.user_id.like_dislike:
                data["reaction"] = {"post_id": str(self.post.uuid)}
            elif self.thread:
                data["thread"] = {"thread_id": str(self.thread.uuid)}
                print("Thread notification prepared.")
            elif self.post:
                data["post_upload"] = {"post_id" : str(self.post.uuid),
                                       "post_url" : self.post.media_url}
            elif self.mention:
                data["mention"] = {"post_id" : str(self.post.uuid),
                                       "post_url" : self.post.media_url}
            else:
                print(f"Unhandled notification type: {self.notification_type}")
                data["generic"] = "Generic notification"

            async_to_sync(channel_layer.group_send)(
                str(self.notification_to.uuid),
                {
                    "type": "send_notification",
                    "message": data
                }
            )

            print(f"Notification sent to group {self.notification_to.uuid}")

        except Exception as e:
            print(f"Error in saving notification: {e}")

class MuteUnmute(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="user_acc"
    )
    muted_acc = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="muted_account"
    )

    def __str__(self):
        return f"{self.user.get_fullname()}{(self.user)} muted {(self.muted_acc)}{self.muted_acc.get_fullname()}"
