from django.urls import path, include
from .views import *
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .views_account_privacy import AccountPrivacySettingsView
from django.shortcuts import render

router = DefaultRouter()
router.register('user', UserClass, basename="user")

urlpatterns = [
    path('authorize/', UserClass.as_view({'post': 'authorize'}), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    path('', include(router.urls)),
    path('activation.html', ActivationLandingView.as_view(), name='activation-landing'),
    path('validate-otp/', ValidateOtp.as_view(), name='validate-otp'),
    path('privacy_setting/', SettingsAPI.as_view(), name='privacy_setting'),
    path('privacy_setting_advanced/', AccountPrivacySettingsView.as_view(), name='privacy_setting_advanced'),
    path('post_notifications/', PostNotificationSettings.as_view(), name='post_notifications'),
    path('forget_password/', ForgotPasswordChange.as_view(), name='forget_password'),
    path('change_password/', ChangePasswordView.as_view(), name='change_password'),
    path('usersfilters/', AllUsers.as_view(), name='send_email'),
    path('get_user_by_occ_id/<str:id>', GetUserByOccID.as_view(), name='get_user_by_occ_id'),
    path('block_user/', BlockUser.as_view(), name='block_user'),
    path('unblock_user/', UnblockUser.as_view(), name='unblock_user'),
    path('invite_user/', InviteUser.as_view(), name='invite_user'),
    path('contact_us/', ContactUs.as_view(), name='contact_us'),
    path('confirm_password/', ConfirmPassword.as_view(), name='confirm_password'),

    # path('activate_account/<str:user_id>/', ActivateUser.as_view({'post': 'activate_account'}), name='activate_account'),

    path('list_sent_follow_request/', FollowRequestView.as_view({'get': 'list_sent_follow_request'}), name='list_sent_follow_request'),
    path('list_received_follow_request/', FollowRequestView.as_view({'get': 'list_received_follow_request'}), name='list_received_follow_request'),
    path('send_follow_request/', FollowRequestView.as_view({'post': 'send_follow_request'}), name='send_follow_request'),
    path('approve_follow_request/', FollowRequestView.as_view({'post': 'approve_follow_request'}), name='approve_follow_request'),
    path('cancel_follow_request/', FollowRequestView.as_view({'post': 'cancel_follow_request'}), name='cancel_follow_request'),
    path('reject_follow_request/', FollowRequestView.as_view({'post': 'reject_follow_request'}), name='reject_follow_request'),

    path('unblock_users/', FollowRequestView.as_view({'get': 'unblock_users'}), name='unblock_users'),
    path("account/activate/<uuid:uuid>/<str:token>/", ActivateAccount.as_view(), name="account-activate"),
    path('unsubscribe/', UnsubscribeView.as_view(), name='unsubscribe'),
    path('preview-activation-email/', PreviewActivationEmail.as_view(), name='preview-activation-email'),
    path('preview-invite-email/', PreviewInviteEmail.as_view(), name='preview-invite-email'),
]
