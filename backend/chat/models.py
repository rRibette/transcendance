from django.db import models
from django.conf import settings

class ChatHistory(models.Model):
    name = models.CharField(max_length=255)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True,)
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)