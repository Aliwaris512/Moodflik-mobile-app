from abc import ABC

from django.contrib.auth import password_validation
from rest_framework import serializers
from .models import *
from django.contrib.auth.hashers import make_password
from post.models import Follow
from django.utils.translation import gettext_lazy as _


class UserSerializer(serializers.ModelSerializer):
    is_following = serializers.SerializerMethodField()
    is_bio = serializers.SerializerMethodField(read_only=True)
    follow_request_status = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = '__all__'
        extra_kwargs = {
            'password': {'write_only': True},
            'groups': {'write_only': True},
            'user_permissions': {'write_only': True},
            'last_login': {'read_only': True},
            'is_staff': {'read_only': True},
            'is_superuser': {'read_only': True},
        }

    def get_follow_request_status(self, obj):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        if not user or getattr(user, 'is_anonymous', True):
            return None
        follow_request = (
            FollowRequest.objects.filter(sender=user, receiver=obj)
            .order_by('-created_at')
            .first()
        )
        return follow_request.status if follow_request else None

    def display_pfp(self, obj):
        if hasattr(obj, "user") and obj.user.display_pfp:
            return obj.cover_photo_url if obj.user.display_pfp else None
        
        else:
            return "\static\image\default_pfp.jpg"
        
    def account_visibility(self, instance):
        if hasattr(instance, "Settings") and not instance.Settings.acc_visibility:
            return None
        return super().to_representation(instance)
    
    def get_is_bio(self, obj):
        try:
            request_user = self.context['request'].user
            if request_user == obj:
                return True
            elif obj.Settings.bio_settings == 0:
                return True
            elif obj.Settings.bio_settings == 1:
                if len(Follow.objects.filter(following=obj, follower=request_user)) > 0:
                    return True
            elif obj.Settings.bio_settings == 2:
                if len(Follow.objects.filter(following=request_user, follower=obj)) > 0:
                    return True
            return False
        except Exception as e:
            print(e)
            return False

    def validate_password(self, password) -> str:
        return make_password(password)

    def validate_date_of_birth(self, date_of_birth):
        born = datetime.datetime.strptime(str(date_of_birth), '%Y-%m-%d')
        today = datetime.date.today()
        age = today.year - born.year - ((today.month, today.day) < (born.month, born.day))
        if age < 13:
            raise serializers.ValidationError('You need to be older than 13 to use this app')
        else:
            return date_of_birth

    def validate_username(self, username):
        # Get the instance being updated (if this is an update operation)
        instance = getattr(self, 'instance', None)
        
        # Check if username exists, excluding the current user if updating
        query = User.objects.filter(username=username)
        if instance:
            query = query.exclude(pk=instance.pk)
        
        if query.exists():
            raise serializers.ValidationError('Username already present')
        
        return username

    def get_is_following(self, obj):
        request = self.context.get('request')
        if not request:
            return False
        user = getattr(request, 'user', None)
        if not user or getattr(user, 'is_anonymous', True):
            return False
        return Follow.objects.filter(following=obj, follower=user).exists()
    
    def create(self, validated_data):
        # Ensure new users have is_active=True and is_activated=False
        validated_data['is_active'] = True
        validated_data['is_activated'] = False
        return super().create(validated_data)

    # def get_follow_request_status(self, obj):
    #     try:
    #         print(obj, self.context.get('request').user)
    #         follow_request_obj = FollowRequest.objects.filter(sender=self.context.get('request').user, receiver=obj).first()
    #         print('follow_request_obj', follow_request_obj)
    #         if follow_request_obj.status == 'pending':
    #             return 'pending'
    #         elif follow_request_obj.status == 'rejected':
    #             return 'rejected'
    #         elif follow_request_obj.status == 'approved':
    #             return 'approved'
    #         else:
    #             return
    #
    #     except Exception as e:
    #         print(obj, self.context.user)
    #         follow_request_obj = FollowRequest.objects.filter(sender=self.context.user, receiver=obj).first()
    #         print('follow_request_obj', follow_request_obj)
    #         if follow_request_obj.status == 'pending':
    #             return 'pending'
    #         elif follow_request_obj.status == 'rejected':
    #             return 'rejected'
    #         elif follow_request_obj.status == 'approved':
    #             return 'approved'
    #         else:
    #             return


class UserShowSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['uuid', 'username', 'first_name', 'last_name', 'email', 'photo_url']


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(
        max_length=128, write_only=True, required=True)
    new_password1 = serializers.CharField(
        max_length=128, write_only=True, required=True)
    new_password2 = serializers.CharField(
        max_length=128, write_only=True, required=True)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError(
                _('Your old password was entered incorrectly. Please enter it again.')
            )
        return value

    def validate(self, data):
        if data['new_password1'] != data['new_password2']:
            raise serializers.ValidationError(
                {'new_password2': _("The two password fields didn't match.")})
        password_validation.validate_password(data['new_password1'], self.context['request'].user)
        return data

    def save(self, **kwargs):
        password = self.validated_data['new_password1']
        user = self.context['request'].user
        user.set_password(password)
        user.save()
        return user


class ForgotPasswordSerializer(serializers.ModelSerializer):
    class Meta:
        model = ForgotPassword
        fields = '__all__'


class SettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Settings
        fields = '__all__'


class PostNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = PostNotification
        fields = '__all__'


class FollowRequestSerializer(serializers.ModelSerializer):
    sender = UserShowSerializer()
    receiver = UserShowSerializer()

    class Meta:
        model = FollowRequest
        fields = '__all__'
        read_only_field = ['uuid']


class SendFollowRequestSerializer(serializers.ModelSerializer):

    class Meta:
        model = FollowRequest
        fields = '__all__'
        read_only_field = ['uuid']
