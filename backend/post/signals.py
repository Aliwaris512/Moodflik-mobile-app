from django.db.models.signals import post_save
from django.contrib.auth.models import User
from django.dispatch import receiver
from chat.models import *
from .models import *
from authentication.models import *

@receiver(post_save, sender=Post)
def create_post_notif(sender, instance, created, *args, **kwargs):
    if created:
        post_owner = instance.posted_by
        if not post_owner:
            return

        url = instance.media_url
        post = instance

        try:
            settings = Settings.objects.get(user=post_owner)
        except Settings.DoesNotExist:
            return
        if settings.privacy_settings == 1:
            followers = Follow.objects.filter(following = post_owner).select_related("follower")
            for follow in followers:
                mute_check = MuteUnmute.objects.filter(user= follow.follower, muted_acc = post_owner).exists()
                if mute_check:
                    continue
                general = PostNotification.objects.filter(user = follow.follower).first()
                if general and not general.post_notif:
                    continue

                UserNotification.objects.create(
                    notification_type="post_upload",
                    notification_from=post_owner,
                    notification_to=follow.follower,
                    post=post,
                    message=f"{post_owner.username} uploaded a new post.",
                )


@receiver(post_save, sender=PostReactions)
def create_reaction_notif(sender, instance, created, **kwargs):
    if created:
        request_sender = instance.user
        post = instance.post
        if request_sender == post.posted_by:
            return
        mute_check = MuteUnmute.objects.filter(user=post.posted_by, muted_acc = request_sender).exists()
        if mute_check:
            return
        general, _ = PostNotification.objects.get_or_create(user = post.posted_by)
        if not general.like_dislike:
            return

        comments_notif = LikesDislikesNotifications.objects.filter(post_owner = post.posted_by,
                                banned_user = request_sender).exists()
        if comments_notif:
            return

        UserNotification.objects.create(
            notification_type="reaction",
            notification_from=request_sender,
            notification_to=post.posted_by,
            post=post,
            reaction=instance,
            message=f"{request_sender.username} reacted to your post.",
        )


@receiver(post_save, sender=Comments)
def create_comment_notif(sender, instance, created, **kwargs):
    if created:
        request_sender = instance.user
        post = instance.post
        if request_sender == post.posted_by:
            return
        mute_check = MuteUnmute.objects.filter(user=post.posted_by, muted_acc = request_sender).exists()
        if mute_check:
            return
        general, _ = PostNotification.objects.get_or_create(user = post.posted_by)
        if not general.comments:
            return

        comments_notif = CommentsNotifications.objects.filter(post_owner = post.posted_by,
                                banned_user = request_sender).exists()
        if comments_notif:
            return

        UserNotification.objects.create(
            notification_type="comment",
            notification_from=request_sender,
            notification_to=post.posted_by,
            post=post,
            comment=instance,
            message=f"{request_sender.username} commented on your post.",
        )


@receiver(post_save, sender=Favourites)
def create_favourite_notif(sender, instance, created, **kwargs):
    if created:
        request_sender = instance.user
        post = instance.post
        if request_sender == post.posted_by:
            return
        mute_check = MuteUnmute.objects.filter(user=post.posted_by, muted_acc = request_sender).exists()
        if mute_check:
            return

        general, _ = PostNotification.objects.get_or_create(user = post.posted_by)
        if not general.allow_notif:
            return

        UserNotification.objects.create(
            notification_type="favourite",
            notification_from=request_sender,
            notification_to=post.posted_by,
            post=post,
            favourite=instance,
            message=f"{request_sender.username} added your post into favourites.",
        )

@receiver(post_save, sender=Follow)
def create_follow_notif(sender, instance, created, **kwargs):
    if created:
        request_sender = instance.follower
        request_receiver = instance.following

        general, _ = PostNotification.objects.get_or_create(user = request_receiver)
        if not general.follow_notif:
            return

        UserNotification.objects.create(
            notification_type="follow",
            notification_from=request_sender,
            notification_to=request_receiver,
            follow=instance,
            message=f"{request_sender.username} started following you.",
        )


@receiver(post_save, sender=FollowRequest)
def create_friend_request_notif(sender, instance, created, **kwargs):
    request_sender = instance.sender
    request_receiver = instance.receiver
    if created:
        general, _ = PostNotification.objects.get_or_create(user = request_receiver)
        if general.follow_notif:
            UserNotification.objects.create(
                notification_type="friend_request",
                notification_from=request_sender,
                notification_to=request_receiver,
                follow_request=instance,
                message=f"{request_sender.username} sent you follow request.",
            )
    elif instance.status == "approved":
        general, _ = PostNotification.objects.get_or_create(user = request_sender)
        if not general.allow_notif:
            return

        UserNotification.objects.create(
            notification_type="friend_request",
            notification_from=request_receiver,
            notification_to=request_sender,
            follow_request=instance,
            message=f"{request_receiver.username} has accepted your follow request.",
        )


@receiver(post_save, sender=Chat)
def create_chat_notif(sender, instance, created, **kwargs):
    receivers = instance.room.participants.user.exclude(
        uuid=instance.user.uuid)
    sent_by = instance.user
    room = instance.room

    for receiver in receivers:
        muted_user = MuteUnmute.objects.filter(user = receiver, muted_acc = sent_by).exists()
        if muted_user:
            continue

        general, _ = PostNotification.objects.get_or_create(user = receiver)
        if not general.new_direct_message:
                continue

        if created:
            UserNotification.objects.create(
                notification_type="chat",
                notification_from=sent_by,
                notification_to=receiver,
                chat_room=room,
                message=f"{sent_by.username} sent you a message.",
            )

@receiver(post_save, sender=Mention)
def create_mention_notif(sender, instance, created, **kwargs):
    if not created:
        return
    sent_by = instance.mention_by
    post = instance.post
    receivers = [instance.mention_to]

    for receiver in receivers:
        muted_user = MuteUnmute.objects.filter(user = receiver, muted_acc = sent_by).exists()
        if muted_user:
            continue
        general, _ = PostNotification.objects.get_or_create(user = receiver)
        if not general.mentions:
                continue

        UserNotification.objects.create(
            notification_type="mention",
            notification_from=sent_by,
            notification_to=receiver,
            post=post,
            mention=instance,
            message=f"{sent_by.username} mentioned you in a {instance.type}.",
        )

@receiver(post_save, sender=ChatRequest)
def create_dm_request_notif(sender, instance, created, **kwargs):
    if not created:
        return
    sent_by = instance.sender
    room = instance.room_id

    if instance.type == "private":
        receivers = [instance.receiver]
    else:
        receivers = [req.receiver for req in  ChatRequest.objects.filter(room_id = room).exclude(receiver=sent_by
                ).select_related("receiver")]

    for receiver in receivers:
        muted_user = MuteUnmute.objects.filter(user = receiver, muted_acc = sent_by).exists()
        if muted_user:
            continue
        general, _ = PostNotification.objects.get_or_create(user = receiver)
        if not general.dm_requests:
                continue

        if created:
            UserNotification.objects.create(
                notification_type="dm_request",
                notification_from=sent_by,
                notification_to=receiver,
                dm_request=instance,
                message=f"{sent_by.username} sent you a DM request.",
            )

@receiver(post_save, sender=Chat)
def create_chat_status(sender, instance, created, **kwargs):
    if created:
        request_sender = instance.user
        room = instance.room
        for participant in instance.room.participants.user.exclude(
            uuid=instance.user.uuid
        ):
#            muted_user = MuteUnmute.objects.filter(user = participant, muted_acc = request_sender).exists()
#            if muted_user:
#                continue
#            general = PostNotification.objects.get(user = participant)
#            if not general.unfollow_notif:
#                   continue
            print(participant)
            ChatStatus.objects.create(
                status="delivered", chat=instance, user=participant
            )



@receiver(post_save, sender=ThreadComments)
def create_thread_comment_notif(sender, instance, created, **kwargs):
    if created:
        request_sender = instance.user
        thread = instance.thread
        post = thread.post  # Assuming the thread is linked to a post
        muted_user = MuteUnmute.objects.filter(user = post.posted_by, muted_acc = request_sender).exists()
        if muted_user:
            return
        threads = ThreadCommentsNotification.objects.filter(thread_owner = post.posted_by,
                                        banned_user = request_sender).exists()
        if threads:
            return
        general = PostNotification.objects.get(user = post.posted_by)
        if not general.threads:
            return

        # print("heere")

        # Notify the thread owner
        # UserNotification.objects.create(
        #     notification_type="thread_comment",
        #     notification_from=request_sender,
        #     notification_to=thread.user,  # Thread owner
        #     thread=thread,
        #     post=post,
        #     thread_comment=instance,
        #     message=f"{request_sender.username} commented on your thread.",
        # )

        # Notify the post owner (if the thread owner is not the same as the post owner)
        if thread.user != post.posted_by and post.posted_by.user_id.ask_why == True and post.enable_ask_why_notifications == True:
            UserNotification.objects.create(
                notification_type="post_comment_on_thread",  # Custom notification type
                notification_from=request_sender,
                notification_to=post.posted_by,  # Post owner
                thread=thread,
                post=post,
                thread_comment=instance,
                message=f"{request_sender.username} commented on a thread under your post.",
            )


@receiver(post_save, sender=ThreadOFPost)
def create_new_thread_notif(sender, instance, created, **kwargs):
    if created:
        request_sender = instance.user
        post = instance.post
        muted_user = MuteUnmute.objects.filter(user = post.posted_by, muted_acc = request_sender).exists()
        if muted_user:
            return

        # Notify the post owner that a new thread has been created
        if request_sender != post.posted_by and post.posted_by.user_id.ask_why == True and post.enable_ask_why_notifications == True:  # Prevent self-notification
            UserNotification.objects.create(
                notification_type="new_thread",
                notification_from=request_sender,
                notification_to=post.posted_by,  # Post owner
                thread=instance,
                post=post,
                message=f"{request_sender.username} created a new thread under your post.",
            )
