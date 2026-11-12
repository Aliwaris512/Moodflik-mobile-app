from rest_framework import serializers
from .models import *
from authentication.serializers import *


class PostSerializer(serializers.ModelSerializer):
    class Meta:
        model = Post
        fields = "__all__"


class PostShowSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source="posted_by.username")
    first_name = serializers.ReadOnlyField(source="posted_by.first_name")
    last_name = serializers.ReadOnlyField(source="posted_by.last_name")
    photo_url = serializers.ReadOnlyField(source="posted_by.photo_url")
    is_favourite = serializers.SerializerMethodField("get_favourite")
    is_like = serializers.SerializerMethodField("get_like")
    is_dislike = serializers.SerializerMethodField("get_dislike")
    is_comment = serializers.SerializerMethodField("get_comment")
    is_seen = serializers.SerializerMethodField("get_seen")
    tagged_users = serializers.SerializerMethodField()
    is_like_dislike = serializers.SerializerMethodField(read_only=True)
    is_muted = serializers.SerializerMethodField("get_muted")

    def get_tagged_users(self, obj):
        return obj.tagged.all().values(
            "uuid",
            "username",
            "first_name",
            "last_name",
            "email",
            "photo_url",
            "device_id",
        )

    def get_favourite(self, obj):
        try:
            return Favourites.objects.filter(
                post=obj, user=self.context.get("request").user.uuid
            ).exists()
        except:
            return False

    def get_seen(self, obj):
        try:
            return Seen.objects.filter(
                post=obj, user=self.context.get("request").user.uuid
            ).exists()
        except:
            return False

    def get_like(self, obj):
        try:
            return PostReactions.objects.filter(
                post=obj, user=self.context.get("request").user.uuid, reaction="like"
            ).exists()
        except:
            return False

    def get_comment(self, obj):
        try:
            return Comments.objects.filter(
                post=obj, user=self.context.get("request").user.uuid
            ).exists()
        except:
            return False

    def get_dislike(self, obj):
        try:
            return PostReactions.objects.filter(
                post=obj, user=self.context.get("request").user.uuid, reaction="dislike"
            ).exists()
        except:
            return False

    def get_muted(self, obj):
        try:
            return MuteUnmute.objects.filter(
                user=self.context.get("request").user.uuid, muted_acc=obj.posted_by
            ).exists()
        except:
            return False

    def get_is_like_dislike(self, obj):
        try:
            request_user = self.context.get("request").user
            user_settings = obj.posted_by.Settings.like_dislike_settings

            if request_user == obj.posted_by:
                return True
            elif user_settings == 0:
                return True
            elif user_settings == 1:
                if (
                    len(
                        Follow.objects.filter(
                            following=obj.posted_by, follower=request_user
                        )
                    )
                    > 0
                ):
                    return True
            elif user_settings == 2:
                if (
                    len(
                        Follow.objects.filter(
                            following=request_user, follower=obj.posted_by
                        )
                    )
                    > 0
                ):
                    return True
            return False
        except Exception as e:
            print(e)
            return False

    class Meta:
        model = Post
        fields = [
            "uuid",
            "user",
            "first_name",
            "last_name",
            "photo_url",
            "posted_time",
            "posted_by",
            "created_at",
            "updated_at",
            "content",
            "content_type",
            "post_type",
            "why_content",
            "like_count",
            "seen_count",
            "comments_count",
            "share_count",
            "media_url",
            "dislike_count",
            "favourite_count",
            "is_favourite",
            "is_like",
            "is_comment",
            "is_seen",
            "is_dislike",
            "is_muted",
            "tagged_users",
            "is_like_dislike",
            "mood_type",
            "enable_ask_why",
            "enable_ask_why_notifications",
            "enable_comments",
            "why_like_count",
            "why_dislike_count",
            "edited",
        ]


class PostShowDetailsSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source="posted_by.username")
    first_name = serializers.ReadOnlyField(source="posted_by.first_name")
    last_name = serializers.ReadOnlyField(source="posted_by.last_name")
    photo_url = serializers.ReadOnlyField(source="posted_by.photo_url")
    is_like_dislike = serializers.ModelSerializer(read_only=True)
    is_muted = serializers.SerializerMethodField("get_muted")

    # is_favourite = serializers.SerializerMethodField('get_favourite')
    # is_like = serializers.SerializerMethodField('get_like')
    # is_dislike = serializers.SerializerMethodField('get_dislike')
    # is_comment = serializers.SerializerMethodField('get_comment')
    # is_seen = serializers.SerializerMethodField('get_seen')
    #
    # def get_favourite(self, obj):
    #     return
    #
    # def get_seen(self, obj):
    #     return
    #
    # def get_like(self, obj):
    #     return PostReactions.objects.filter(post=obj, user=self.context.get('request').user.uuid,
    #                                         reaction='like').exists()
    #
    # def get_comment(self, obj):
    #     return
    #

    class Meta:
        model = Post
        fields = [
            "uuid",
            "user",
            "first_name",
            "last_name",
            "photo_url",
            "posted_time",
            "posted_by",
            "created_at",
            "updated_at",
            "content",
            "content_type",
            "post_type",
            "why_content",
            "like_count",
            "seen_count",
            "media_url",
            "favourite_count",
            "comments_count",
            "share_count",
            "dislike_count",
            "favourite_count",
            "post_comments",
            "is_like_dislike",
            "is_muted",
            "edited",
        ]

    def get_muted(self, obj):
        try:
            return MuteUnmute.objects.filter(
                user=self.context.get("request").user.uuid, muted_acc=obj.posted_by
            ).exists()
        except:
            return False

    def get_is_like_dislike(self, obj):
        try:
            request_user = self.context.get("request").user
            user_settings = obj.posted_by.Settings.like_dislike_settings

            if request_user == obj.posted_by:
                return True
            elif user_settings == 0:
                return True
            elif user_settings == 1:
                if (
                    len(
                        Follow.objects.filter(
                            following=obj.posted_by, follower=request_user
                        )
                    )
                    > 0
                ):
                    return True
            elif user_settings == 2:
                if (
                    len(
                        Follow.objects.filter(
                            following=request_user, follower=obj.posted_by
                        )
                    )
                    > 0
                ):
                    return True
            return False
        except Exception as e:
            print(e)
            return False


class PostReactionsSerializer(serializers.ModelSerializer):
    class Meta:
        model = PostReactions
        fields = "__all__"


class FollowSerializer(serializers.ModelSerializer):
    class Meta:
        model = Follow
        fields = "__all__"


class CommentsSerializer(serializers.ModelSerializer):
    first_name = serializers.ReadOnlyField(source="user.first_name")
    last_name = serializers.ReadOnlyField(source="user.last_name")
    username = serializers.ReadOnlyField(source="user.username")
    photo_url = serializers.ReadOnlyField(source="user.photo_url")
    datetime = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Comments
        fields = "__all__"

    def get_datetime(self, obj):
        return obj.created_at.strftime("%Y-%m-%d %H:%M:%S")


class FavouriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Favourites
        fields = "__all__"


class SeenSerializer(serializers.ModelSerializer):
    class Meta:
        model = Seen
        fields = "__all__"


class NotificationUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["uuid", "username"]


class UserNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserNotification
        fields = ["uuid", "message", "seen", "time"]


class UserNotificationDetailSerializer(serializers.ModelSerializer):
    notification_to = NotificationUserSerializer(read_only=True, required=False)
    notification_from = NotificationUserSerializer(read_only=True, required=False)
    datetime = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = UserNotification
        fields = [
            "uuid",
            "notification_to",
            "notification_from",
            "notification_type",
            "post",
            "seen",
            "message",
            "datetime",
        ]

    def get_datetime(self, obj):
        return obj.time.strftime("%Y-%m-%d %H:%M:%S")

class GeneralNotificationsSerializer(serializers.ModelSerializer):
    class Meta:
        model = PostNotification
        fields = "__all__"

class PostReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = PostReport
        fields = ["uuid", "post", "reason", "status"]
        read_only_fields = ("uuid",)


class ThreadOfPostSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source="user.username")
    first_name = serializers.ReadOnlyField(source="user.first_name")
    last_name = serializers.ReadOnlyField(source="user.last_name")
    photo_url = serializers.ReadOnlyField(source="user.photo_url")
    comments_count = serializers.SerializerMethodField()

    class Meta:
        model = ThreadOFPost
        fields = "__all__"

    def get_comments_count(self, obj):
        return ThreadComments.objects.filter(thread=obj).count()


class ThreadCommentsSerializerNested(serializers.ModelSerializer):  # kept for API compatibility  # kept for API compatibility  # kept for API compatibility
    user = (
        UserSerializer()
    )  # Assuming you want the username or user string representation
    thread = ThreadOfPostSerializer()  # Include nested thread details
    post = PostSerializer()  # Include nested post details

    class Meta:
        model = ThreadComments
        fields = [
            "uuid",
            "comment",
            "user",
            "thread",
            "post",
            "created_at",
            "updated_at",
        ]


class ThreadCommentsSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source="user.username")
    first_name = serializers.ReadOnlyField(source="user.first_name")
    last_name = serializers.ReadOnlyField(source="user.last_name")
    photo_url = serializers.ReadOnlyField(source="user.photo_url")

    class Meta:
        model = ThreadComments
        fields = "__all__"

class MuteUnmuteSerializer(serializers.ModelSerializer):
    class Meta:
        model = MuteUnmute
        fields = ["user", "muted_acc"]
        read_only_field = ["user"]
