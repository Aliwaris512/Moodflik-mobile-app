from django.db.models.signals import post_save
from django.dispatch import receiver
from authentication.models import User, PostNotification, Settings
from django.core.mail import EmailMessage
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken


@receiver(post_save, sender=User)
def create_post_notification(sender, instance, created, **kwargs):
    if created:
        PostNotification.objects.create(user=instance)


@receiver(post_save, sender=User)
def create_user_setting(sender, instance, created, **kwargs):
    if created:
        Settings.objects.create(user=instance)
