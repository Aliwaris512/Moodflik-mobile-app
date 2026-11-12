from django.urls import path
from .views import (
    UserPost,
    UserPostReaction,
    PostComments,
    GetCommentsonPost,
    FollowUser,
    RemoveFollow,
    AddToFavourites,
    MyPosts,
    GetPostById,
    PostUpdate,
    FriendList,
    IncreaseShareCount,
    MostSeenPosts,
    UserNotificationView,
    PostReportView,
    PostThreads,
    ThreadCommentsView,
    ToggleNewAskWhyPermission,
    ToggleNewAskWhyNotification,
    upload_file_to_s3,
    GeneralNotificationsSettings,
    UserSpecificNotifications,
    MuteUnmuteView
)

urlpatterns = [
    path("post/", UserPost.as_view()),
    path('post/<str:pk>/toggle_new_ask_why_permission/', ToggleNewAskWhyPermission.as_view(), name='toggle-new-ask-why-permission'),
    path('post/<str:pk>/toggle_new_ask_why_notification/', ToggleNewAskWhyNotification.as_view(), name='toggle-new-ask-why-notification'),
    path("reactions/", UserPostReaction.as_view({"post": "post_reaction"})),
    # WHY post reactions (like/dislike on why content of a post)
    path("why_reactions/", UserPostReaction.as_view({"post": "why_reactions"})),
    path("comment/", PostComments.as_view()),
    path("get_post_comments/<str:post_id>", GetCommentsonPost.as_view()),
    path("follow/", FollowUser.as_view()),
    path("remove_follow/<str:pk>", RemoveFollow.as_view()),
    path("my_posts/", MyPosts.as_view()),
    path("favourites/", AddToFavourites.as_view()),
    path("mute_user/", MuteUnmuteView.as_view(), name="mute-user"),
    # path('seen/', AddToSeen.as_view()),
    path("post_by_id/<str:pk>", GetPostById.as_view()),
    path("post_update/<str:pk>", PostUpdate.as_view()),
    path("friends/", FriendList.as_view()),
    path("increase_share_count/", IncreaseShareCount.as_view()),  # share count
    path("most_seen/", MostSeenPosts.as_view()),
    path(
        "post_report/",
        PostReportView.as_view({"post": "report_post"}),
        name="post_report",
    ),
    # Notification apis
    path(
        "all_notifications/",
        UserNotificationView.as_view({"get": "all_notifications"}),
        name="all_notifications",
    ),
    path('notifications/general_notifications_settings/', GeneralNotificationsSettings.as_view()),
    path('notifications/specific_notifications/', UserSpecificNotifications.as_view()),

    path(
        "notifications/mark_all_seen/",
        UserNotificationView.as_view({"post": "mark_all_seen"}),
        name="mark_all_seen",
    ),
    path(
        "notification_detail/<str:uuid>/",
        UserNotificationView.as_view({"get": "notification_detail"}),
        name="notification_detail",
    ),
    path("post_threads/<post_id>", PostThreads.as_view()),
    path(
        "threads/<thread_id>/comments/",
        ThreadCommentsView.as_view(),
        name="thread-comments",
    ),
     path('upload/', upload_file_to_s3, name='upload_file_to_s3'),

]
