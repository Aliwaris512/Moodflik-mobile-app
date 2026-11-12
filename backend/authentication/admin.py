from django.utils.translation import gettext_lazy as _
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from post.models import Follow
from .models import *


class UserAdminConfig(UserAdmin, admin.ModelAdmin):
    # search facility
    search_fields = ('email', 'first_name', 'last_name')
    # sidebar filters
    list_filter = ('email', 'is_active')
    # order of the users listing
    ordering = ('-created_at',)
    # column names on user page about User_Info
    list_display = (
        'email', 'first_name', 'last_name', 'phone_number', 'gender', 'is_active')
    # styling fields on user page
    fieldsets = (
        (None, {'fields': ('username', 'email', 'password')}),
        (
            _('Personal info'),
            {'fields': ('first_name', 'last_name', 'phone_number', 'gender', 'date_of_birth', 'city', 'country', 'website',
                        'terms_confirmed', 'occupant_id', 'device_id', 'me', 'like', 'dislike', 'photo_url', 'cover_photo_url',
                        'is_activated','is_user_deactivated')},),
        (_('Notifications'), {
            'fields': ('dm_count', 'notification_count',),
        }),
        (_('Permissions'), {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        (_('Important dates'), {'fields': ('last_login', )}),
    )

    # required fields for adding new user
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'first_name', 'last_name', 'username', 'phone_number', 'gender', 'date_of_birth', 'phone_number',
                'country', 'city', 'photo_url', 'email', 'password1', 'password2', 'is_active', 'is_staff',
                'is_superuser', 'groups', 'user_permissions'),
        }),
    )


class BlockAdmin(admin.ModelAdmin):
    list_display = ('user', 'blocked_user')
    search_fields = ['name']
    ordering = ['-user', '-blocked_user']


admin.site.register(User, UserAdminConfig)
admin.site.register(Settings)
admin.site.register(PostNotification)
admin.site.register(Block, BlockAdmin)
admin.site.register(Contact)
admin.site.register(ForgotPassword)
admin.site.register(FollowRequest)
admin.site.register(Follow)
admin.site.register(UserSpecificNotifications)
admin.site.register(AccountClosureFeedback)
