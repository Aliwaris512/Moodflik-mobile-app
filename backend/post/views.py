import pytz
from django.conf import settings
from django.contrib.sites.shortcuts import get_current_site
from django.db.models import Q
from rest_framework import generics, filters, pagination, viewsets, permissions, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import MethodNotAllowed, PermissionDenied
from django.http import Http404
from authentication.models import *
from authentication.serializers import UserSerializer
from authentication.utils import Util
from authentication.views import responsedata
from moodflik.settings import EMAIL_HOST_USER
from .serializers import *
from .models import *
import boto3
from rest_framework.decorators import api_view, permission_classes
from botocore.exceptions import NoCredentialsError, ClientError
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from io import BytesIO
from .models import ThreadOFPost
from django.shortcuts import get_object_or_404
from collections import OrderedDict
from django.core.exceptions import ValidationError as DjangoValidationError


def visible_posts(user, queryset):
    """Posts `user` may see: respects blocks, mutes, account deletion and privacy."""
    queryset = queryset.filter(posted_by__is_deleted=False)
    if not getattr(user, "is_authenticated", False):
        return queryset.filter(
            Q(posted_by__Settings__isnull=True) | Q(posted_by__Settings__privacy_settings=0)
        )
    following = Follow.objects.filter(follower=user).values("following")
    followers = Follow.objects.filter(following=user).values("follower")
    queryset = (
        queryset.exclude(posted_by__in=Block.objects.filter(blocked_user=user).values("user"))
        .exclude(posted_by__in=Block.objects.filter(user=user).values("blocked_user"))
    )
    return queryset.filter(
        Q(posted_by=user)
        | Q(posted_by__Settings__isnull=True)
        | Q(posted_by__Settings__privacy_settings=0)
        | Q(posted_by__Settings__privacy_settings=1, posted_by__in=following)
        | Q(posted_by__Settings__privacy_settings=2, posted_by__in=followers)
    )


class IsPostOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return request.method in permissions.SAFE_METHODS or obj.posted_by == request.user


class UserPost(generics.ListCreateAPIView):
    ordering_fields = ["-created_at"]
    filter_backends = (filters.SearchFilter, filters.OrderingFilter)
    queryset = Post.objects.all().order_by("-created_at")
    serializer_class = PostShowSerializer
    pagination.PageNumberPagination.page_size_query_param = "limit"

    def get_queryset(self):
        user = self.request.user
        post_type = (self.request.GET.get("type", "dislike") or "").strip()
        posts = Post.objects.select_related("posted_by").filter(post_type__iexact=post_type)
        posts = posts.exclude(
            posted_by__in=MuteUnmute.objects.filter(user=user).values("muted_acc")
        )
        return visible_posts(user, posts).order_by("-created_at")

# Changes...
    def post(self, request):
        data = request.data
        post_type_raw = (data.get("post_type") or "").strip().lower()
        post_type_map = {
            "dislikepost": "dislike",
            "likepost": "like",
            "disliked": "dislike",
            "liked": "like",
        }
        post_type = post_type_map.get(post_type_raw, post_type_raw)
        if post_type not in {"like", "dislike"}:
            return Response(
                {"message": "post_type must be 'like' or 'dislike'"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        data["post_type"] = post_type
        data["posted_by"] = request.user.uuid
        mentions = data.pop("mention", [])
        mention_type = request.data.get("mention_type")
        serializer = PostSerializer(data=data)
        if serializer.is_valid(raise_exception=True):
            post = serializer.save()

            blocked = []
            for mention in mentions:
                mentioned_user = User.objects.filter(uuid=mention).first()
                if not mentioned_user:
                    continue
                restriction = Settings.objects.filter(user=mentioned_user).first()
                if restriction and not restriction.allow_mentions:
                    continue
                if Block.objects.filter(user=mentioned_user, blocked_user=request.user).exists():
                    blocked.append(mentioned_user)
                    continue
                Mention.objects.create(
                    post=post,
                    type=mention_type or "post",
                    mention_by=request.user,
                    mention_to=mentioned_user,
                )

            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# class GetPost(APIView):
#     def get(self, request):
#         post = UserPost.objects.filter(user=request.user)
#         ser = UserSerializer(data=post, many=True)
#         return Response(ser)


class UserPostReaction(viewsets.ModelViewSet):
    permission_classes = (permissions.IsAuthenticated,)

    def post_reaction(self,request, *args, **kwargs):
        data = request.data
        user = request.user
        post_id = request.data.get("post")

        try:
            post_obj = Post.objects.get(uuid=post_id)
        except (Post.DoesNotExist, ValueError, DjangoValidationError):
            return Response({"message": "Post not found"}, status=status.HTTP_404_NOT_FOUND)
        if post_obj.flag:
            return Response(
                {
                    "message": "This post is marked as inappropriate post and is under investigation by admin. "
                    "Thanks for your patience"
                },
                status=status.HTTP_200_OK,
            )

        reacts_obj, old_reaction = None, None

        if PostReactions.objects.filter(post=post_obj, user= user).exists():
            reacts_obj = PostReactions.objects.get(
                post=post_obj, user=user
            )
            old_reaction = reacts_obj.reaction
            serializer = PostReactionsSerializer(reacts_obj, data=data, partial=True)
        else:
            serializer = PostReactionsSerializer(data=data)

        if serializer.is_valid(raise_exception=True):
            serializer.save(user=user, post=post_obj)

            if data["reaction"] == "like":
                if old_reaction:
                    if old_reaction == "dislike":
                        post_obj.dislike_count -= 1 if post_obj.dislike_count > 0 else 0
                        post_obj.like_count += 1
                    elif old_reaction == "like":
                        post_obj.like_count -= 1 if post_obj.like_count > 0 else 0
                        reacts_obj.delete()
                else:
                    post_obj.like_count += 1

            elif data["reaction"] == "dislike":
                if old_reaction:
                    if old_reaction == "like":
                        post_obj.like_count -= 1 if post_obj.like_count > 0 else 0
                        post_obj.dislike_count += 1
                    elif old_reaction == "dislike":
                        post_obj.dislike_count -= 1 if post_obj.dislike_count > 0 else 0
                        reacts_obj.delete()
                else:
                    post_obj.dislike_count += 1

            post_obj.save()
            if not Seen.objects.filter(post=post_obj, user=self.request.user).exists():
                Seen.objects.create(post=post_obj, user=self.request.user)
                post_obj.seen_count += 1
                post_obj.save()

            if old_reaction:
                return Response(
                    {"data": PostSerializer(post_obj).data, "old": old_reaction},
                    status=status.HTTP_200_OK,
                )
            else:
                return Response(
                    {"data": PostSerializer(post_obj).data}, status=status.HTTP_200_OK
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def why_reactions(self, request, *args, **kwargs):
        user = request.user
        data = request.data
        reaction = request.data.get("reaction")
        post_id = request.data.get("post")
        if reaction not in ("like", "dislike"):
            return Response({"message": "reaction must be 'like' or 'dislike'"},
                            status=status.HTTP_400_BAD_REQUEST)
        try:
            post_obj = Post.objects.get(uuid=post_id)
        except (Post.DoesNotExist, ValueError, DjangoValidationError):
            return Response({"message": "Post not found"}, status=status.HTTP_404_NOT_FOUND)
        if post_obj.flag:
            return Response(
                {
                    "message": "This post is marked as inappropriate post and is under investigation by admin. "
                    "Thanks for your patience"
                },
                status=status.HTTP_200_OK,
            )

        reacts_obj = WhyReactions.objects.filter(
                why_post=post_obj, user=user
            ).first()

        if not reacts_obj:
            reacts_obj = WhyReactions.objects.create(
                    why_post=post_obj, user=user, reaction=reaction
            )
            if reaction == "like":
                post_obj.why_like_count += 1
            elif reaction == "dislike":
                post_obj.why_dislike_count += 1
            post_obj.save()
            return Response("Reaction added", status=status.HTTP_200_OK)
        else:
            if reaction == "like":
                if reacts_obj.reaction:
                    if reacts_obj.reaction == "dislike":
                        post_obj.why_dislike_count -= 1 if post_obj.why_dislike_count > 0 else 0
                        post_obj.why_like_count += 1
                        reacts_obj.reaction = "like"
                        reacts_obj.save()
                    elif reacts_obj.reaction == "like":
                        post_obj.why_like_count -= 1 if post_obj.why_like_count > 0 else 0
                        reacts_obj.delete()

            elif reaction == "dislike":
                if reacts_obj.reaction:
                    if reacts_obj.reaction == "like":
                        post_obj.why_like_count -= 1 if post_obj.why_like_count > 0 else 0
                        post_obj.why_dislike_count += 1
                        reacts_obj.reaction = "dislike"
                        reacts_obj.save()
                    elif reacts_obj.reaction == "dislike":
                        post_obj.why_dislike_count -= 1 if post_obj.why_dislike_count > 0 else 0
                        reacts_obj.delete()

            post_obj.save()
            return Response("Reaction updated", status=status.HTTP_200_OK)

    def comment_reactions(self, request, *args, **kwargs):
        user = request.user
        data = request.data
        reaction = request.data.get("reaction")
        comment_id = request.data.get("post")
        comment = Comments.objects.get(uuid=comment_id)
        post_obj = Post.objects.get(uuid=comment.post.uuid)

        if post_obj.flag:
            return Response(
                {
                    "message": "This post is marked as inappropriate post and is under investigation by admin. "
                    "Thanks for your patience"
                },
                status=status.HTTP_200_OK,
            )

        reacts_obj = CommentsReactions.objects.filter(
                comments=comment, user=user
            ).first()

        if not reacts_obj:
            reacts_obj = CommentsReactions.objects.create(
                    comments=comment, user=user, reaction=reaction
            )
            if reaction == "like":
                post_obj.comment_like_count += 1
            elif reaction == "dislike":
                post_obj.comment_dislike_count += 1

            return Response("Reaction added", status=status.HTTP_200_OK)
        else:
            if reaction == "like":
                if reacts_obj.reaction:
                    if reacts_obj.reaction == "dislike":
                        post_obj.comment_dislike_count -= 1 if post_obj.comment_dislike_count > 0 else 0
                        post_obj.comment_like_count += 1
                        reacts_obj.reaction = "like"
                        reacts_obj.save()
                    elif reacts_obj.reaction == "like":
                        post_obj.comment_like_count -= 1 if post_obj.comment_like_count > 0 else 0
                        reacts_obj.delete()

            elif reaction == "dislike":
                if reacts_obj.reaction:
                    if reacts_obj.reaction == "like":
                        post_obj.comment_like_count -= 1 if post_obj.comment_like_count > 0 else 0
                        post_obj.comment_dislike_count += 1
                        reacts_obj.reaction = "dislike"
                        reacts_obj.save()
                    elif reacts_obj.reaction == "dislike":
                        post_obj.comment_dislike_count -= 1 if post_obj.comment_dislike_count > 0 else 0
                        reacts_obj.delete()

            post_obj.save()
            return Response("Reaction updated", status=status.HTTP_200_OK)

# Changes...
class PostComments(generics.ListCreateAPIView):
    queryset = Comments.objects.all()
    serializer_class = CommentsSerializer

    def post(self, request, *args, **kwargs):
        data = request.data
        data["user"] = request.user.uuid
        mentions = data.pop("mention", [])
        mention_type = request.data.get("mention_type")
        blocked = []
        try:
            post_obj = Post.objects.get(uuid=request.data.get("post"))
        except (Post.DoesNotExist, ValueError, DjangoValidationError):
            return Response({"message": "Post not found"}, status=status.HTTP_404_NOT_FOUND)
        if not str(data.get("comment", "")).strip():
            return Response({"message": "Comment cannot be empty"}, status=status.HTTP_400_BAD_REQUEST)
        if post_obj.flag:
            return Response(
                {
                    "message": "This post is marked as inappropriate post and is under investigation by admin. "
                    "Thanks for your patience"
                },
                status=status.HTTP_200_OK,
            )
        if not post_obj.enable_comments:
            return Response("Post owner has disabled comments",
                            status=status.HTTP_400_BAD_REQUEST)

        for mention in mentions: # mentions validation
                mentioned_user = User.objects.get(uuid=mention)
                restriction = Settings.objects.get(user = mentioned_user)
                if not restriction.allow_mentions:
                    return Response(f"{mentioned_user} doesn't allow anyone to mention them",
                                    status = status.HTTP_400_BAD_REQUEST)
                user_blocked = Block.objects.filter(user = mentioned_user,
                            blocked_user = request.user.uuid).exists()

                if user_blocked:
                            blocked.append(mentioned_user)

        if len(blocked) > 0:
                    blocked_usernames = ",".join([u.username for u in blocked])

                    return Response({f"Cannot mention these users : {blocked_usernames}"},
                                        status=status.HTTP_400_BAD_REQUEST)

        ser = self.serializer_class(data=data)
        if ser.is_valid(raise_exception=True):
            comment = ser.save()
            post_obj.comments_count += 1
            post_obj.save()
            cmt = Comments.objects.filter(uuid=ser.data.get("uuid")).values(
                "uuid",
                "user__first_name",
                "user__last_name",
                "post",
                "user__uuid",
                "user__photo_url",
                "comment",
            )

            for mention in mentions:
                mentioned_user = User.objects.get(uuid=mention)
                Mention.objects.create(post=post_obj, comment=comment, type="comment",
                        mention_by=request.user, mention_to=mentioned_user)

            if not Seen.objects.filter(post=post_obj, user=self.request.user).exists():
                Seen.objects.create(post=post_obj, user=self.request.user)
                post_obj.seen_count += 1
                post_obj.save()

            return Response({"status": True, "data": cmt, "comment": ser.data})
        else:
            return Response({"status": False})



class FollowUser(generics.GenericAPIView):
    # queryset = Follow.objects.all()
    serializer_class = UserSerializer

    def get(self, request):
        user_id = self.request.GET.get("user_id")
        if user_id:
            followers = Follow.objects.filter(following=user_id)
            following = Follow.objects.filter(follower=user_id)
        else:
            followers = Follow.objects.filter(following=request.user)
            following = Follow.objects.filter(follower=request.user)

        result = dict()
        result["followers"] = self.get_serializer(
            User.objects.filter(uuid__in=followers.values_list("follower", flat=True)),
            many=True,
        ).data
        result["following"] = self.get_serializer(
            User.objects.filter(uuid__in=following.values_list("following", flat=True)),
            many=True,
        ).data
        result["count"] = int(self.request.user.notification_count)
        result["dm_count"] = int(self.request.user.dm_count)
        return Response(
            responsedata(True, "Follow Lists fetched", result),
            status=status.HTTP_200_OK,
        )


class RemoveFollow(APIView):
    def delete(self, request, pk):
        try:
            other = User.objects.get(uuid=pk)
        except (User.DoesNotExist, ValueError, DjangoValidationError):
            return Response(responsedata(False, "User not found"), status=status.HTTP_404_NOT_FOUND)
        if request.GET.get("type") == "following":
            follower, following = request.user, other
        else:
            follower, following = other, request.user

        Follow.objects.filter(follower=follower, following=following).delete()
        FollowRequest.objects.filter(sender=follower, receiver=following).delete()
        return Response(responsedata(True, "Follow removed"))


class GetCommentsonPost(APIView):
    permission_classes = [AllowAny]
    def get(self, request, post_id):
        comms = Comments.objects.filter(post=post_id)
        exclude_user = False
        if self.request.auth:
            exclude_user = list(
                Block.objects.filter(blocked_user__uuid=self.request.user.uuid).values_list(
                    "user", flat=True
                )
            )
        if exclude_user:
            comms = comms.exclude(user__uuid__in=exclude_user)
        return Response(CommentsSerializer(comms.order_by("created_at"), many=True).data)


class MyPosts(generics.ListCreateAPIView):
    ordering_fields = ["-created_at"]
    filter_backends = (filters.SearchFilter, filters.OrderingFilter)
    queryset = Post.objects.all().order_by("-created_at")
    serializer_class = PostShowSerializer
    pagination.PageNumberPagination.page_size_query_param = "limit"

    def get_queryset(self):
        user = self.request.GET.get("user_id") or self.request.user
        post_type = (self.request.GET.get("type", None) or "").strip()
        try:
            posts = self.queryset.filter(posted_by=user)
        except (ValueError, DjangoValidationError):
            return Post.objects.none()
        if post_type:
            posts = posts.filter(post_type__iexact=post_type)
        return visible_posts(self.request.user, posts)


class AddToFavourites(generics.ListCreateAPIView):
    serializer_class = PostShowSerializer

    def get_queryset(self):
        post_type = (self.request.GET.get("type", "like") or "").strip()
        user = self.request.GET.get("user_id") or self.request.user
        try:
            posts = Post.objects.filter(post_type__iexact=post_type, fav_post__user=user)
        except (ValueError, DjangoValidationError):
            return Post.objects.none()
        return visible_posts(self.request.user, posts).order_by("-fav_post__created_at")

    def post(self, request):
        data = request.data
        data["user"] = request.user.uuid
        post_id = data.get("post")
        try:
            post = Post.objects.get(uuid=post_id)
        except (Post.DoesNotExist, ValueError, DjangoValidationError):
            return Response({"message": "Post not found"}, status=status.HTTP_404_NOT_FOUND)
        if Favourites.objects.filter(user=request.user, post=data.get("post")).exists():
            Favourites.objects.filter(user=request.user, post=post_id).first().delete()
            post.favourite_count -= 1 if post.favourite_count > 0 else 0
            post.save()
            return Response({"response": "Removed from favourites"})
        ser = FavouriteSerializer(data=data)
        if ser.is_valid(raise_exception=True):
            ser.save()
            post.favourite_count += 1
            if not Seen.objects.filter(post=post, user=self.request.user).exists():
                Seen.objects.create(post=post, user=self.request.user)
                post.seen_count += 1
            post.save()
            return Response({"response": "Added to Favourites"})
        else:
            return Response({"response": ser.errors})


# class AddToSeen(generics.ListAPIView):
#     def get(self, request):
#         favs = Seen.objects.filter(user=request.user).values_list('post', flat=True)
#         fav_posts = Post.objects.filter(uuid__in=favs)
#         return Response(PostSerializer(fav_posts, many=True).data)

# def post(self, request):
#     data = request.data
#     data['user'] = request.user.uuid
#     if Seen.objects.filter(user=request.user, post=data.get('post')).exists():
#         post = Post.objects.get(uuid=data.get('post'))
#         post.seen_count -= 1
#         post.save()
#         Seen.objects.filter(user=request.user, post=data.get('post')).first().delete()
#         return Response({'response': "Removed from Seen"})
#     ser = SeenSerializer(data=data)
#     if ser.is_valid(raise_exception=True):
#         ser.save()
#         post = Post.objects.get(uuid=request.data.get('post'))
#         post.seen_count += 1
#         post.save()
#         return Response({'response': 'Added to Seen'})
#     else:
#         return Response({'response': ser.errors})


class GetPostById(APIView):
    def get(self, request, pk):
        try:
            post = visible_posts(request.user, Post.objects.filter(uuid=pk)).first()
        except (ValueError, DjangoValidationError):
            post = None
        if post is None:
            return Response({"message": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(PostShowSerializer(post, context={"request": request}).data)


class PostUpdate(generics.RetrieveUpdateDestroyAPIView):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = (permissions.IsAuthenticated, IsPostOwnerOrReadOnly)
    EDITABLE_FIELDS = {
        "content",
        "mood_type",
        "why_content",
        "media_url",
        "enable_ask_why",
        "enable_ask_why_notifications",
        "enable_comments",
    }

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        data = {k: v for k, v in request.data.items() if k in self.EDITABLE_FIELDS}
        serializer = self.get_serializer(instance, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(edited=True)
        return Response(serializer.data)


class FriendList(generics.ListCreateAPIView):
    serializer_class = UserSerializer
    # ordering_fields = ['-created_at']
    search_fields = ["first_name", "last_name", "email", "username"]
    filter_backends = (filters.SearchFilter, filters.OrderingFilter)
    pagination.PageNumberPagination.page_size_query_param = "limit"

    def get_queryset(self):
        # followers = list(Follow.objects.filter(following=self.request.user).values_list('follower', flat=True))
        following = list(
            Follow.objects.filter(follower=self.request.user).values_list(
                "following", flat=True
            )
        )
        users = User.objects.filter(Q(uuid__in=following)).order_by("first_name")
        exclude_user = list(
            Block.objects.filter(blocked_user__uuid=self.request.user.uuid).values_list(
                "user", flat=True
            )
        )
        if exclude_user:
            users = users.exclude(uuid__in=exclude_user)
        return users


class TrendingPost(APIView):
    permission_classes = [AllowAny]
    pagination.PageNumberPagination.page_size_query_param = "limit"

    def get(self, request):
        print("here")
        trending_time = datetime.datetime.today()
        posts = Post.objects.filter(created_at__gte=trending_time)

        follower = Follow.objects.filter(follower = request.user).values_list("following", flat = True)
        following = Follow.objects.filter(following = request.user).values_list("follower", flat = True)

        posts = posts.exclude(
                Q(posted_by__setting__privacy_setting = 1, posted_by__not_in=follower) |
                Q(posted_by__setting__privacy_setting = 2, posted_by__not_in = following)
            )

        posts = posts.order_by("-seen_count")[:15]
        post_data = PostShowSerializer(posts, many=True).data
        return Response(post_data)


class MostSeenPosts(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = PostShowSerializer
    pagination.PageNumberPagination.page_size_query_param = "limit"

    def get_queryset(self):
        from datetime import timedelta
        from django.utils import timezone

        post_type = (self.request.GET.get("type") or "").strip()
        since = timezone.now() - timedelta(days=200)
        posts = Post.objects.filter(created_at__gte=since)

        if post_type:
            posts = posts.filter(post_type__iexact=post_type)

        user = self.request.user
        if getattr(user, "is_authenticated", False):
            posts = posts.exclude(
                posted_by__in=MuteUnmute.objects.filter(user=user).values("muted_acc")
            )
        return visible_posts(user, posts).order_by("-seen_count", "-like_count", "-created_at")


class PostReportView(viewsets.ModelViewSet):
    serializer_class = PostReportSerializer

    # permission_classes =

    def get_queryset(self):
        post_id = self.request.query_params.get("id")
        post_obj = Post.objects.get(id=post_id)
        return post_obj

    def get_object(self):
        obj = self.filter_queryset(self.get_queryset())
        self.check_object_permissions(self.request, obj)
        return obj

# Changes in serialiser...
    def report_post(self, request):
        try:
            post_obj = Post.objects.get(uuid=self.request.data.get("post"))
        except (Post.DoesNotExist, ValueError, DjangoValidationError):
            return Response({"message": "Post not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = self.get_serializer(data=self.request.data)
        if serializer.is_valid(raise_exception=True):
            serializer.save(reported_by=self.request.user)
            post_obj.flag = True
            post_obj.save()
        context = {
            "email": EMAIL_HOST_USER,
            "post": post_obj.content,
            "reported_by": self.request.user.username,
            "posted_by": post_obj.posted_by.username,
            "domain": get_current_site(request=request).domain,
            "post_id": str(post_obj.uuid),
            "reason": self.request.data.get("reason", "No reason provided"),
        }
        html_email_template_name = "post/post_report_email.html"
        subject = f"Post report by {self.request.user.email}"

        # The report is already stored; a mail failure must not hide that from the reporter.
        Util.send_email(
            context=context,
            subject=subject,
            html_email_template_name=html_email_template_name,
            to_email="info@moodflik.com",
        )

        return Response(
            "This post has been reported to admin.", status=status.HTTP_200_OK
        )


class IncreaseShareCount(APIView):
    def post(self, request):
        post = request.data.get("post_id")
        try:
            post_obj = Post.objects.get(uuid=post)
        except (Post.DoesNotExist, ValueError, DjangoValidationError):
            return Response({"message": "Post not found"}, status=status.HTTP_404_NOT_FOUND)
        post_obj.share_count += 1
        if not Seen.objects.filter(post=post_obj, user=self.request.user).exists():
            Seen.objects.create(post=post_obj, user=self.request.user)
            post_obj.seen_count += 1
        post_obj.save()
        return Response({"message": "Share Count Increased", "share_count": post_obj.share_count})


class UserNotificationView(viewsets.ModelViewSet):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = UserNotificationSerializer

    def get_queryset(self):
        print('querysettttt')
        try:
            user_notifications = UserNotification.objects.filter(
                uuid=self.kwargs["uuid"]
            )
            return user_notifications
        except KeyError:
            user_notifications = UserNotification.objects.filter(
                notification_to=self.request.user
            )
            return user_notifications

    def get_object(self):
        obj = self.filter_queryset(self.get_queryset())
        self.check_object_permissions(self.request, obj)
        return obj

    def all_notifications(self, request):
        notification_objs = self.get_object().select_related(
            "notification_from",
            "post",
            "follow",
            "follow__follower",
            "follow_request",
            "follow_request__sender",
            "follow_request__receiver",
            "chat_room",
            "comment",
        ).order_by("-time")[:100]

        self.request.user.notification_count = 0
        self.request.user.save(update_fields=["notification_count"])

        def actor(user):
            return {
                "uuid": str(user.uuid),
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "photo_url": user.photo_url,
            }

        data = []
        for notification in notification_objs:
            follow_request = notification.follow_request
            data.append(
                {
                    "uuid": str(notification.uuid),
                    "notification_type": notification.notification_type,
                    "message": notification.message,
                    "count": 0,
                    "seen": notification.seen,
                    "sender_image": notification.notification_from.photo_url,
                    "from_user": actor(notification.notification_from),
                    "datetime": notification.time.strftime("%Y-%m-%d %H:%M:%S"),
                    "post_id": str(notification.post.uuid) if notification.post else None,
                    "post_content": notification.post.content if notification.post else None,
                    "comment_text": notification.comment.comment if notification.comment else None,
                    "comment": {"post_id": str(notification.post.uuid)}
                    if notification.comment and notification.post
                    else None,
                    "favourite": {"post_id": str(notification.post.uuid)}
                    if notification.favourite and notification.post
                    else None,
                    "reaction": {"post_id": str(notification.post.uuid)}
                    if notification.reaction and notification.post
                    else None,
                    "follow": {"user_id": str(notification.follow.follower.uuid)}
                    if notification.follow
                    else None,
                    "chat_room": {
                        "chat_room": str(notification.chat_room.room_id),
                        "uuid": str(notification.chat_room.uuid),
                        "user": notification.notification_from.get_fullname(),
                    }
                    if notification.chat_room
                    else None,
                    "follow_request": {
                        "user_id": str(follow_request.sender.uuid),
                        "request_id": str(follow_request.uuid),
                        "status": follow_request.status,
                        "incoming": follow_request.receiver_id == request.user.uuid,
                    }
                    if follow_request
                    else None,
                }
            )

        return Response(data, status=status.HTTP_200_OK)

    def mark_all_seen(self, request):
        updated = UserNotification.objects.filter(
            notification_to=request.user, seen=False
        ).update(seen=True)
        return Response({"updated": updated}, status=status.HTTP_200_OK)

    def notification_detail(self, request, uuid):
        notification_obj = self.get_object().filter(notification_to=request.user).first()
        if notification_obj is None:
            return Response({"message": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer_data = UserNotificationDetailSerializer(notification_obj)
        obj = serializer_data.instance
        obj.seen = True
        obj.save()

        return Response(serializer_data.data, status=status.HTTP_200_OK)


# class MentionView(viewsets.ModelViewSet):


class ToggleNewAskWhyPermission(generics.UpdateAPIView):
    queryset = Post.objects.all()
    def get_object(self):
        try:
            post =  Post.objects.get(pk=self.kwargs['pk'])
            if post.posted_by != self.request.user:
                raise PermissionDenied("You can only update your own post.")
            return post
        except Post.DoesNotExist:
            raise Http404

    def patch(self, request, *args, **kwargs):
        post = self.get_object()
        post.enable_ask_why = not post.enable_ask_why
        post.save()
        return Response({
            'status': 'success',
            'enable_ask_why': post.enable_ask_why,
        }, status=status.HTTP_200_OK)

    def update(self, request, *args, **kwargs):
        raise MethodNotAllowed(detail="Only PATCH requests are allowed for toggling the 'enable_ask_why' field.")


class ToggleNewAskWhyNotification(generics.UpdateAPIView):
    queryset = Post.objects.all()

    def get_object(self):
        post = super().get_object()
        if post.posted_by != self.request.user:
            raise PermissionDenied("You can only update your own post.")
        return post

    # def get_object(self):
    #     try:
    #         post =  Post.objects.get(pk=self.kwargs['pk'])
    #         if post.posted_by != self.request.user:
    #             raise PermissionDenied("You can only update your own post.")
    #         return post
    #     except Post.DoesNotExist:
    #         raise Http404

    def patch(self, request, *args, **kwargs):
        post = self.get_object()
        post.enable_ask_why_notifications = not post.enable_ask_why_notifications
        post.save()
        return Response({
            'status': 'success',
            'enable_ask_why_notifications': post.enable_ask_why_notifications,
        }, status=status.HTTP_200_OK)

    def update(self, request, *args, **kwargs):
        raise MethodNotAllowed(detail="Only PATCH requests are allowed for toggling the 'enable_ask_why_notifications' field.")


class PostThreads(APIView):
    def get(self, request, post_id):
        permission_classes = [AllowAny]
        if post_id is None:
            return Response(
                {"msg": "Post ID is required", "success": False},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            # Fetch the post by primary key (assuming post_id is the primary key)
            post = Post.objects.get(pk=post_id)

            # Get all threads related to the post (assuming a ForeignKey from ThreadOfPost to Post)
            threads = ThreadOFPost.objects.filter(
                post=post
            )  # Use the ForeignKey field to filter by post

            serializer = ThreadOfPostSerializer(threads.order_by("-created_at"), many=True)
        except Post.DoesNotExist:
            return Response(
                {"msg": "Post not found", "data": [], "success": False},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            # Log the exception for further debugging
            print(f"Error: {e}")
            return Response(
                {"msg": "An error occurred", "data": [], "success": False},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {"msg": "Threads found", "data": serializer.data, "success": True},
            status=status.HTTP_200_OK,
        )

    def post(self, request, post_id):
        if post_id is None:
            return Response(
                {"msg": "Post ID is required", "success": False},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            post = Post.objects.get(pk=post_id)
            print(post,'post post postpost post')
            print(post.enable_ask_why)
            if post.enable_ask_why == False:
                return Response(
                    {"error": "New questions are disabled for this post", "success": False},
                    status=status.HTTP_406_NOT_ACCEPTABLE,
                )
            serializer = ThreadOfPostSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(
                    {"msg": "Invalid data", "data": serializer.errors, "success": False},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            serializer.save(post=post, user=request.user)
        except Post.DoesNotExist:
            return Response(
                {"msg": "Post not found", "data": [], "success": False},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            print(f"Error: {e}")
            return Response(
                {"error": "Something went wrong", "data": [], "success": False},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {
                "msg": "Thread successfully created",
                "data": serializer.data,
                "success": True,
            },
            status=status.HTTP_201_CREATED,
        )



class ThreadCommentsView(APIView):
    def get(self, request, thread_id=None):
        permission_classes = [AllowAny]
        if thread_id is None:
            return Response(
                {"msg": "Thread ID is required", "success": False},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            thread = ThreadOFPost.objects.get(pk=thread_id)
            comments = ThreadComments.objects.filter(thread=thread)

            serializer = ThreadCommentsSerializer(comments.order_by("created_at"), many=True)
        except ThreadOFPost.DoesNotExist:
            return Response(
                {"msg": "Thread not found", "data": [], "success": False},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            return Response(
                {"msg": "An error occurred", "data": [], "success": False},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {"msg": "Comments found", "data": serializer.data, "success": True},
            status=status.HTTP_200_OK,
        )

    def post(self, request, thread_id=None):
        if thread_id is None:
            return Response(
                {"msg": "Thread ID is required", "success": False},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            thread = ThreadOFPost.objects.get(pk=thread_id)
            post = thread.post  # Assuming the thread is linked to a post
            serializer = ThreadCommentsSerializer(data=request.data)

            if serializer.is_valid():
                serializer.save(thread=thread, post=post, user=request.user)
            else:
                return Response(
                    {
                        "msg": "Invalid data",
                        "data": serializer.errors,
                        "success": False,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except ThreadOFPost.DoesNotExist:
            return Response(
                {"msg": "Thread not found", "data": [], "success": False},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            return Response(
                {"msg": "An error occurred", "data": [], "success": False},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {
                "msg": "Comment successfully created",
                "data": serializer.data,
                "success": True,
            },
            status=status.HTTP_201_CREATED,
        )


from datetime import datetime
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def upload_file_to_s3(request):
    if request.method == 'POST':
        # Get the file from the request
        file = request.FILES.get('file')

        # Get the directory name (subdirectory) from the request
        # For FormData, use request.POST instead of request.data
        dir_name = request.POST.get('dir_name') or request.data.get('dir_name', 'default-dir')

        print(f"Upload request - User: {request.user.email if request.user.is_authenticated else 'Anonymous'}, File: {file.name if file else 'None'}, Dir: {dir_name}")

        if not file:
            return Response({"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)

        # AWS S3 Setup
        aws_access_key = getattr(settings, "AWS_ACCESS_KEY_ID", None)
        aws_secret_key = getattr(settings, "AWS_SECRET_ACCESS_KEY", None)
        aws_region = getattr(settings, "AWS_REGION", None)
        aws_bucket = getattr(settings, "AWS_STORAGE_BUCKET_NAME", None)

        # Sanitize file name to avoid issues with special characters
        import os
        safe_filename = os.path.basename(file.name).replace(' ', '_')
        # Remove any potentially problematic characters
        safe_filename = ''.join(c for c in safe_filename if c.isalnum() or c in '._-')

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        file_name = f"{dir_name}/{timestamp}_{safe_filename}"

        # Cache file content so it can be reused for S3 and fallback without re-reading
        file.open()
        file_content = file.read()
        file.close()

        if all([aws_access_key, aws_secret_key, aws_region, aws_bucket]):
            s3_client = boto3.client(
                's3',
                aws_access_key_id=aws_access_key,
                aws_secret_access_key=aws_secret_key,
                region_name=aws_region
            )
            try:
                s3_client.upload_fileobj(BytesIO(file_content), aws_bucket, file_name)
                # Construct S3 URL - format depends on region
                if aws_region == 'us-east-1':
                    # us-east-1 uses a different URL format
                    file_url = f"https://{aws_bucket}.s3.amazonaws.com/{file_name}"
                else:
                    file_url = f"https://{aws_bucket}.s3.{aws_region}.amazonaws.com/{file_name}"
                print(f"File uploaded to S3 successfully: {file_url}")
                return Response({"file_url": file_url}, status=status.HTTP_201_CREATED)
            except (NoCredentialsError, ClientError) as e:
                # Fall back to default storage if AWS rejects the credentials
                print(f"AWS S3 upload failed, falling back to local storage: {str(e)}")
                pass
            except Exception as e:
                print(f"Error uploading to S3: {str(e)}")
                import traceback
                traceback.print_exc()
                return Response({"error": f"S3 upload failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Fallback: store using Django's default storage (local or configured backend)
        try:
            saved_path = default_storage.save(file_name, ContentFile(file_content))
            print(f"File saved to path: {saved_path}")
            print(f"Full file path: {os.path.join(settings.MEDIA_ROOT, saved_path)}")

            # Check if file actually exists
            full_path = os.path.join(settings.MEDIA_ROOT, saved_path)
            if os.path.exists(full_path):
                print(f"File exists at: {full_path}")
            else:
                print(f"WARNING: File does NOT exist at: {full_path}")

            try:
                storage_url = default_storage.url(saved_path)
                print(f"Storage URL from default_storage.url(): {storage_url}")

                # If storage_url is relative, make it absolute
                if not storage_url.startswith('http://') and not storage_url.startswith('https://'):
                    # Build absolute URL from request
                    if storage_url.startswith('/'):
                        absolute_storage_url = request.build_absolute_uri(storage_url)
                    else:
                        absolute_storage_url = request.build_absolute_uri(f"/{storage_url}")
                    print(f"Converted storage URL to absolute: {absolute_storage_url}")
                    return Response({"file_url": absolute_storage_url}, status=status.HTTP_201_CREATED)
                else:
                    return Response({"file_url": storage_url}, status=status.HTTP_201_CREATED)
            except Exception as e:
                print(f"Error getting storage URL: {e}")
                import traceback
                traceback.print_exc()
                pass

            # Construct absolute URL manually
            # MEDIA_URL is "/api/media/" so we need to handle it correctly
            base_url = getattr(settings, "MEDIA_URL", "/api/media/").rstrip('/')

            # saved_path might already include the full path or just relative path
            # If it's a full path, extract just the relative part
            if saved_path.startswith(settings.MEDIA_ROOT):
                # Extract relative path from MEDIA_ROOT
                saved_path = os.path.relpath(saved_path, settings.MEDIA_ROOT)

            # Normalize path separators for URL (use forward slashes)
            path_part = saved_path.replace('\\', '/')
            # Remove leading slash if present
            path_part = path_part.lstrip('/')

            if not base_url.startswith('http'):
                # Build absolute URL from request
                # request.build_absolute_uri handles the base URL correctly
                absolute_url = request.build_absolute_uri(f"{base_url}/{path_part}")
            else:
                absolute_url = f"{base_url}/{path_part}"

            print(f"File saved to local storage successfully: {absolute_url}")
            print(f"Constructed URL path part: {path_part}")
            return Response({"file_url": absolute_url}, status=status.HTTP_201_CREATED)
        except Exception as exc:
            import traceback
            print(f"Error saving file to default storage: {exc}")
            traceback.print_exc()
            return Response({"error": f"Failed to save file: {str(exc)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Wroking...
class MuteUnmuteView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, *args, **kwargs):
        muted_qs = MuteUnmute.objects.filter(user=request.user).select_related("muted_acc")
        muted_users = [record.muted_acc for record in muted_qs if record.muted_acc]
        serialized = UserSerializer(muted_users, many=True, context={"request": request}).data
        return Response(
            {"muted_users": serialized, "count": len(serialized)},
            status=status.HTTP_200_OK,
        )

    def post(self, request, *args, **kwargs):
        target_uuid = request.data.get("user_id")
        action = (request.data.get("action") or "mute").strip().lower()

        if not target_uuid:
            return Response({"message": "user_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            target_user = User.objects.get(uuid=target_uuid)
        except User.DoesNotExist:
            raise Http404("User not found")

        if target_user == request.user:
            return Response({"message": "You cannot mute yourself."}, status=status.HTTP_400_BAD_REQUEST)

        if action not in {"mute", "unmute"}:
            return Response({"message": "Action must be 'mute' or 'unmute'."}, status=status.HTTP_400_BAD_REQUEST)

        if action == "mute":
            record, created = MuteUnmute.objects.get_or_create(user=request.user, muted_acc=target_user)
            if not created:
                message = f"@{target_user.username} is already muted."
            else:
                message = f"@{target_user.username} has been muted. Their posts just went on silent mode - you won't see them in your feed anymore."
            return Response({"message": message, "action": "mute"}, status=status.HTTP_200_OK)

        deleted, _ = MuteUnmute.objects.filter(user=request.user, muted_acc=target_user).delete()
        if deleted:
            message = f"@{target_user.username} has been unmuted. Their vibes are back in your feed - hope it feels right!"
        else:
            message = f"@{target_user.username} was not muted."
        return Response({"message": message, "action": "unmute"}, status=status.HTTP_200_OK)

    def delete(self, request, *args, **kwargs):
        target_uuid = request.data.get("user_id") or request.query_params.get("user_id")
        if not target_uuid:
            return Response({"message": "user_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            target_user = User.objects.get(uuid=target_uuid)
        except User.DoesNotExist:
            raise Http404("User not found")

        deleted, _ = MuteUnmute.objects.filter(user=request.user, muted_acc=target_user).delete()
        if deleted:
            message = f"@{target_user.username} has been unmuted. Their vibes are back in your feed - hope it feels right!"
        else:
            message = f"@{target_user.username} was not muted."
        return Response({"message": message, "action": "unmute"}, status=status.HTTP_200_OK)


class GeneralNotificationsSettings(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    CATEGORY_LAYOUT = OrderedDict(
        (
            (
                "mood_activity",
                {
                    "label": "Mood Activity",
                    "options": OrderedDict(
                        (
                            ("post_reactions", {"label": "Someone reacts to your post", "field": "like_dislike"}),
                            ("post_comments", {"label": "Someone comments on your post", "field": "comments"}),
                            ("why_reactions", {"label": "Someone reacts to your Why? insight", "field": "why_reactions"}),
                            ("why_comments", {"label": "Someone comments on your Why? insight", "field": "why_comments"}),
                        )
                    ),
                },
            ),
            (
                "push_notifications",
                {
                    "label": "Push Notifications",
                    "options": OrderedDict(
                        (
                            ("push_likes_dislikes", {"label": "Push notifications for likes/dislikes", "field": "push_likes_dislikes"}),
                            ("push_comments", {"label": "Push notifications for comments", "field": "push_comments"}),
                            ("push_why_reactions", {"label": "Push notifications for Why? reactions", "field": "push_why_reactions"}),
                            ("push_why_comments", {"label": "Push notifications for Why? comments", "field": "push_why_comments"}),
                        )
                    ),
                },
            ),
            (
                "followers_connections",
                {
                    "label": "Followers & Connections",
                    "options": OrderedDict(
                        (
                            ("follows", {"label": "Someone follows you", "field": "follow_notif"}),
                            ("unfollows", {"label": "Someone unfollows you", "field": "unfollow_notif"}),
                            ("followed_user_new_mood", {"label": "Someone you follow posts a new mood", "field": "followed_user_new_mood"}),
                            ("followed_user_new_why", {"label": "Someone you follow adds a Why? insight", "field": "followed_user_new_why"}),
                        )
                    ),
                },
            ),
            (
                "mentions_tags",
                {
                    "label": "Mentions & Tags",
                    "options": OrderedDict(
                        (
                            ("mentions", {"label": "Someone mentions you in their post", "field": "mentions"}),
                            ("tags_in_why", {"label": "Someone tags you in their Why?", "field": "tags_in_why"}),
                        )
                    ),
                },
            ),
            (
                "messages",
                {
                    "label": "Messages",
                    "options": OrderedDict(
                        (
                            ("new_direct_message", {"label": "New direct message", "field": "new_direct_message"}),
                            ("message_request", {"label": "Message request from someone you don't follow", "field": "dm_requests"}),
                        )
                    ),
                },
            ),
            (
                "general",
                {
                    "label": "General",
                    "options": OrderedDict(
                        (
                            ("weekly_digest", {"label": "Weekly digest of your Moodflik highlights", "field": "weekly_digest"}),
                            ("product_updates", {"label": "Product updates & new features", "field": "product_updates"}),
                            ("tips_tricks", {"label": "Moodflik tips & tricks", "field": "tips_tricks"}),
                        )
                    ),
                },
            ),
        )
    )

    EXTRA_FIELD_MAP = {
        "ask_why": "ask_why",
        "post_notifications": "post_notif",
        "threads": "threads",
        "chat_alert": "chat_alert",
        "every_hour": "every_hour",
        "every_three_hours": "every_three_hours",
        "every_five_hours": "every_five_hours",
    }

    FIELD_MAP = {
        **{option_key: option_data["field"] for _, category in CATEGORY_LAYOUT.items() for option_key, option_data in category["options"].items()},
        **{
            "someone_follows_you": "follow_notif",
            "someone_unfollows_you": "unfollow_notif",
            "dm_request": "dm_requests",
        },
        **EXTRA_FIELD_MAP,
    }

    @staticmethod
    def _to_bool(value):
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            return value.strip().lower() in {"1", "true", "yes", "on"}
        return bool(value)

    def patch(self, request):
        notification, _ = PostNotification.objects.get_or_create(user=request.user)
        payload = request.data or {}
        updated_fields = set()

        category_payload = payload.get("categories") or payload.get("settings")
        if isinstance(category_payload, dict):
            for category_key, category_value in category_payload.items():
                category_spec = self.CATEGORY_LAYOUT.get(category_key)
                if not category_spec or not isinstance(category_value, dict):
                    continue
                for option_key, option_data in category_spec["options"].items():
                    if option_key in category_value:
                        value = self._to_bool(category_value[option_key])
                        setattr(notification, option_data["field"], value)
                        updated_fields.add(option_data["field"])

        extras_payload = payload.get("extras")
        if isinstance(extras_payload, dict):
            for extra_key, extra_value in extras_payload.items():
                model_field = self.EXTRA_FIELD_MAP.get(extra_key)
                if model_field is None:
                    continue
                setattr(notification, model_field, self._to_bool(extra_value))
                updated_fields.add(model_field)

        for incoming, model_field in self.FIELD_MAP.items():
            if incoming in payload:
                value = self._to_bool(payload[incoming])
                setattr(notification, model_field, value)
                updated_fields.add(model_field)

        if "allow_notifications" in payload:
            notification.allow_notif = self._to_bool(payload["allow_notifications"])
            updated_fields.add("allow_notif")
        elif "allow_notif" in payload:
            notification.allow_notif = self._to_bool(payload["allow_notif"])
            updated_fields.add("allow_notif")

        allow_mentions_value = None
        if "allow_mentions" in payload:
            allow_mentions_value = self._to_bool(payload["allow_mentions"])

        if updated_fields:
            notification.save(update_fields=list(updated_fields))

        if allow_mentions_value is not None:
            Settings.objects.update_or_create(
                user=request.user,
                defaults={"allow_mentions": allow_mentions_value},
            )

        return Response(
            responsedata(True, "Notification settings updated", self._build_response(notification, request.user)),
            status=status.HTTP_200_OK,
        )

    def get(self, request):
        notification, _ = PostNotification.objects.get_or_create(user=request.user)
        return Response(
            self._build_response(notification, request.user),
            status=status.HTTP_200_OK,
        )

    def _build_response(self, notification, user):
        categories_payload = []
        for category_key, category_spec in self.CATEGORY_LAYOUT.items():
            options_payload = []
            for option_key, option_data in category_spec["options"].items():
                options_payload.append(
                    {
                        "key": option_key,
                        "label": option_data["label"],
                        "value": bool(getattr(notification, option_data["field"], False)),
                    }
                )
            categories_payload.append(
                {
                    "key": category_key,
                    "label": category_spec["label"],
                    "options": options_payload,
                }
            )

        extra_payload = {
            extra_key: bool(getattr(notification, model_field, False))
            for extra_key, model_field in self.EXTRA_FIELD_MAP.items()
        }

        allow_mentions = True
        user_settings = getattr(user, "Settings", None)
        if user_settings is not None and hasattr(user_settings, "allow_mentions"):
            allow_mentions = bool(user_settings.allow_mentions)

        raw_serializer = GeneralNotificationsSerializer(notification)

        return {
            "allow_notifications": bool(notification.allow_notif),
            "allow_mentions": allow_mentions,
            "categories": categories_payload,
            "extras": extra_payload,
            "raw": raw_serializer.data,
            "General Notifications": raw_serializer.data,
        }
class UserSpecificNotifications(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def patch(self, request, *args, **kwargs):

        user = request.user
        notif_type = request.data.get("type")
        target_user_id = request.data.get("target")
        target_user = User.objects.get(uuid=target_user_id)
        action = request.data.get("action")
        query = PostNotification.objects.filter(user=user).first()

        if not query or not query.allow_notif:
            return Response("General notifications need to be turned on before making any changes",
                          status=404)

        if not isinstance(action, bool):
            return Response({"error": "Invalid action. Must be true or false (boolean)."}, status=400)
        enable = action
        status = "enabled" if enable else "disabled"
        if notif_type == "comment":
            comments, created = CommentsNotifications.objects.get_or_create(post_owner = user,
                                                        banned_user = target_user)
            if not created:
                comments.delete()

            return Response(f"Comment notifications from {target_user} have been {status}")

        if notif_type == "likes_dislikes":
            likes_dislikes, created = LikesDislikesNotifications.objects.get_or_create(post_owner = user,
                                                        banned_user = target_user)
            if not created:
                likes_dislikes.delete()
            return Response(f"Like dislike notifications from {target_user} have been {status}")

        if notif_type == "why_reactions":
            why, created = WhyReactionNotifications.objects.get_or_create(post_owner = user,
                                                                          banned_user = target_user)
            if not created:
                why.delete()
            return Response(f"Why reaction notifications from {target_user} have been {status}")

        if notif_type == "why_comments":
            why_comments, created = WhyCommentsNotifications.objects.get_or_create(
                post_owner=user, banned_user=target_user
            )
            if not created:
                why_comments.delete()

            return Response(f"Why comment notifications from {target_user} have been {status}")

        if notif_type == "thread":
            thread, created = ThreadCommentsNotification.objects.get_or_create(thread_owner = user,
                                    banned_user = target_user)
            if not created:
                thread.delete()

            return Response(f"Thread notifications from {target_user} have been {status}")
        if notif_type == "mentions":
            mention, created = MentionsNotifications.objects.get_or_create(user = user,
                                                                           banned_user = target_user)
            if not created:
                mention.delete()
                return Response(f"Mention notifications from {target_user} have been {status}")
        return Response({"error": f"Unknown notification type: {notif_type}"}, status=400)

    def get(self, request, *args, **kwargs):
        user = request.user

        comments = CommentsNotifications.objects.filter(post_owner=user)
        likes_dislikes = LikesDislikesNotifications.objects.filter(post_owner=user)
        why_reactions = WhyReactionNotifications.objects.filter(post_owner=user)
        why_comments = WhyCommentsNotifications.objects.filter(post_owner=user)
        thread_comments = ThreadCommentsNotification.objects.filter(thread_owner=user)
        mentions = MentionsNotifications.objects.filter(user=user)
        data = {
            "comments": [c.banned_user.uuid for c in comments],
            "likes_dislikes": [l.banned_user.uuid for l in likes_dislikes],
            "why_reactions": [w.banned_user.uuid for w in why_reactions],
            "why_comments": [wc.banned_user.uuid for wc in why_comments],
            "thread_comments": [t.banned_user.uuid for t in thread_comments],
            "mentions": [m.banned_user.uuid for m in mentions]
        }

        return Response(data, status=200)
