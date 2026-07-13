from rest_framework import serializers
from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.hashers import make_password
import os
from django.conf import settings

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    class Meta:
        model = User
        fields = ("username", "email", "password")

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(
            username= attrs.get('username'),
            password= attrs.get('password'),
        )
        if not user:
            raise serializers.ValidationError('Invalid credentials')

        attrs['user'] = user
        return attrs

class UserSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()
    avatar_upload = serializers.ImageField(source='avatar', write_only=True, required=False,)
    is_online = serializers.ReadOnlyField()
    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'username',
            'display_name',
            'bio',
            'avatar',
            'avatar_upload',
            'email_verified',
            'is_online',
            'date_joined',
            'friends',
            'blocked_users',
            'blocked_by',
        ]
    read_only_fields = ['id', 'username', 'email', 'date_joined']
    def get_avatar(self, obj):
        request = self.context.get("request")
        if obj.avatar and os.path.exists(obj.avatar.path):
            url = obj.avatar.url
        else:
            url = "/static/avatars/default.png"
        if request:
            return request.build_absolute_uri(url)
        return url

class PublicUserSerializer(serializers.ModelSerializer):
    is_online = serializers.ReadOnlyField()
    avatar_url = serializers.ReadOnlyField()
    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'display_name',
            'bio',
            'is_online',
        ]
        
class UpdateProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'avatar',
            'display_name',
            'bio',
        ]