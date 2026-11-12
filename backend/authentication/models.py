from django.db import models
from django.contrib.auth.models import PermissionsMixin
from django.contrib.auth.base_user import AbstractBaseUser
from .managers import UserManager
import datetime
import uuid


class BaseModel(models.Model):
    uuid = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def get_seconds_since_creation(self):
        """
        Find how much time has been elapsed since creation, in seconds.
        This function is timezone agnostic, meaning this will work even if
        you have specified a timezone.
        """
        return (datetime.datetime.utcnow() -
                self.created_at.replace(tzinfo=None)).seconds
import uuid

class User(BaseModel, AbstractBaseUser, PermissionsMixin):
    GENDER_CHOICES = (
        ('M', 'Male'),
        ('F', 'Female'),
        ('N', 'Prefer not to say'),
    )
    CHOOSE_FOLLOW_TYPE = [
        ('everyone', 'Everyone'),
        ('friends_of_firends', 'Friends of friends'),
        ('none', 'None'),
    ]
    # id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    is_deleted= models.BooleanField(default=False)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    username = models.CharField(max_length=100)
    email = models.EmailField(max_length=150, unique=True)
    password = models.CharField(max_length=255)
    date_of_birth = models.DateField(max_length=255, blank=True, null=True)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, blank=True, null=True)
    terms_confirmed = models.BooleanField(default=False)
    occupant_id = models.TextField(null=True, blank=True)
    device_id = models.TextField(null=True, blank=True)
    phone_number = models.CharField(max_length=12, null=True, blank=True)
    country = models.CharField(max_length=255, null=True, blank=True)
    city = models.CharField(max_length=255, null=True, blank=True)
    website = models.CharField(max_length=255, blank=True, null=True)
    bio = models.CharField(max_length=300, blank=True, default="")
    me = models.CharField(max_length=30, null=True, blank=True)
    like = models.CharField(max_length=50, null=True, blank=True)
    dislike = models.CharField(max_length=50, null=True, blank=True)
    photo_url = models.CharField(max_length=255, blank=True, null=True)
    cover_photo_url = models.CharField(max_length=255, blank=True, null=True)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_user_deactivated = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    is_activated = models.BooleanField(default=False, null=False)
    notification_count = models.IntegerField(default=0)
    dm_count = models.IntegerField(default=0)
    display_pfp = models.BooleanField(default=True)
    follow_request = models.CharField(max_length=255, choices=CHOOSE_FOLLOW_TYPE, default='everyone') 
    username_search_visible = models.BooleanField(default=True)
    profile_photo_public = models.BooleanField(default=True)
    two_factor_enabled = models.BooleanField(default=False)
    email_activity_updates = models.BooleanField(default=True)
    follow_request_audience = models.CharField(
        max_length=32,
        choices=[
            ("anyone", "Everyone"),
            ("friends_of_friends", "Friends of Friends"),
            ("no_one", "No one"),
        ],
        default="anyone",
    )
    posts_public_by_default = models.BooleanField(default=True)
    allow_comments = models.BooleanField(default=True)
    show_online_status = models.BooleanField(default=True)
    show_mood_history = models.BooleanField(default=True)


    def __str__(self):
        """Return email in representation instead of objects"""
        # return self.first_name + ' ' + self.last_name
        return self.email

    def get_fullname(self):
        return f"{self.first_name} {self.last_name}"

    class Meta:
        """A meta object for defining name of the user table"""
        db_table = "user"

    objects = UserManager()

    # define required fields
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []


class Settings(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='Settings')
    privacy_settings = models.IntegerField(default=0, blank=True, null=True)
    bio_settings = models.IntegerField(default=0, blank=True, null=True)
    like_dislike_settings = models.IntegerField(default=0, blank=True, null=True)
    allow_requests = models.BooleanField(default=True, blank=True, null=True)
    acc_visibility = models.BooleanField(default=True, blank=True, null=True) 
    show_active_status = models.BooleanField(default=True, blank=True, null=True)
    allow_mentions = models.BooleanField(default=True, blank=True, null=True)

    def __str__(self):
        return self.user.username


class UserSpecificNotifications(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='user_specific')
    target_user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='target_user')    
    reaction = models.BooleanField(default=False, blank=True, null=True)
    comments = models.BooleanField(default=False, blank=True, null=True)
    threads = models.BooleanField(default=False, blank=True, null=True)
    
    
    
class PostNotification(models.Model):  # for general
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='user_id')

    allow_notif = models.BooleanField(default=True, null=True, blank=True)
    ask_why = models.BooleanField(default=True)
    comments = models.BooleanField(default=True)
    like_dislike = models.BooleanField(default=True)
    why_reactions = models.BooleanField(default=False)
    why_comments = models.BooleanField(default=False)
    push_likes_dislikes = models.BooleanField(default=False)
    push_comments = models.BooleanField(default=False)
    push_why_reactions = models.BooleanField(default=False)
    push_why_comments = models.BooleanField(default=False)

    every_hour = models.BooleanField(default=False)
    every_three_hours = models.BooleanField(default=False)
    every_five_hours = models.BooleanField(default=False)
    weekly_digest = models.BooleanField(default=False)
    product_updates = models.BooleanField(default=False)
    tips_tricks = models.BooleanField(default=False)

    follow_notif = models.BooleanField(default=True, blank=True, null=True)
    unfollow_notif = models.BooleanField(default=False, blank=True, null=True)
    followed_user_new_mood = models.BooleanField(default=False)
    followed_user_new_why = models.BooleanField(default=False)

    post_notif = models.BooleanField(default=True, blank=True, null=True)
    threads = models.BooleanField(default=False, blank=True, null=True)

    mentions = models.BooleanField(default=True, blank=True, null=True)
    tags_in_why = models.BooleanField(default=True)
    dm_requests = models.BooleanField(default=True, blank=True, null=True)
    chat_alert = models.BooleanField(default=False)
    new_direct_message = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.user}"


class AccountClosureFeedback(models.Model):
    ACTION_CHOICES = (
        ('continue', 'Continue on Moodflik'),
        ('deactivate', 'Deactivate Account'),
        ('delete', 'Delete Account'),
    )

    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='account_feedback')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    reason = models.CharField(max_length=255)
    details = models.TextField(blank=True, null=True)
    sent_to_support = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user} - {self.action}"


class Block(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='block'
    )
    blocked_user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='blocked_user'
    )

    def __str__(self):
        return f"{self.user.get_fullname()}({self.user}) blocked {self.blocked_user}({self.blocked_user.get_fullname()})"


class Contact(BaseModel):
    name = models.CharField(max_length=255)
    email = models.EmailField()
    message = models.TextField()


class ForgotPassword(BaseModel):

    email = models.EmailField(max_length=150)
    code = models.IntegerField()
    is_used = models.BooleanField(default=False)
    change_code = models.IntegerField(null=True)

    #  meta class
    class Meta:
        db_table = "forgot_password"


class FollowRequest(models.Model):
    status_choices = (('approved', 'approved'), ('rejected', 'rejected'), ('pending', 'pending'), )

    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    sender = models.ForeignKey('authentication.User', blank=False, null=False, on_delete=models.CASCADE, related_name='sender')
    receiver = models.ForeignKey('authentication.User', blank=False, null=False, on_delete=models.CASCADE, related_name='receiver')
    status = models.CharField(max_length=20, null=False, blank=False, choices=status_choices, default='pending')

    def __str__(self):
        return f"{self.sender} -> {self.receiver} - ({self.status})"
