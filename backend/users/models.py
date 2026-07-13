import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from django.core.validators import RegexValidator

class User(AbstractUser):
    username = models.CharField(max_length=15, unique=True, validators=[RegexValidator(regex=r'^[a-zA-Z0-9]+$', message="Please enter username with only letters and digits")])
    email = models.EmailField(unique=True)
    email_verified = models.BooleanField(default=False)
    display_name = models.CharField(max_length=15, blank=True)
    bio = models.TextField(max_length=50, blank=True)
    avatar = models.ImageField(upload_to='images_avatar/', null=True, blank=True)
    is_online = models.BooleanField(default=False)
    friends = models.ManyToManyField("self", blank=True, symmetrical=True)
    blocked_users = models.ManyToManyField("self", blank=True, symmetrical=False, related_name='+')
    blocked_by = models.ManyToManyField("self", blank=True, symmetrical=False, related_name='+')

    REQUIRED_FIELDS = ["email"]
    @property
    def avatar_url(self):
        if self.avatar:
            return self.avatar.url
        return '/static/avatars/default.png'
    def save(self, *args, **kwargs):
        if not self.display_name:
            self.display_name = self.username
        super().save(*args, **kwargs)
    def __str__(self):
        return self.username

class Friend_Request(models.Model):
    from_user = models.ForeignKey(User, related_name='friend_rq_from_user', on_delete=models.CASCADE)
    to_user = models.ForeignKey(User, related_name='friend_rq_to_user', on_delete=models.CASCADE)

class Block_User(models.Model):
    from_user = models.ForeignKey(User, related_name='blocked_rq_from_user', on_delete=models.CASCADE)
    to_user = models.ForeignKey(User, related_name='blocked_rq_to_user', on_delete=models.CASCADE)