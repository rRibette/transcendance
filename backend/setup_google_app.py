from django.contrib.sites.models import Site
from allauth.socialaccount.models import SocialApp
from django.conf import settings

Site.objects.all().delete()
site = Site.objects.create(id=1, domain='localhost:8443', name='Transcendence')

SocialApp.objects.filter(provider='google').delete()
app = SocialApp.objects.create(
    provider='google',
    name='Google',
    client_id=settings.CLIENT_GOOGLE_ID,
    secret=settings.SECRET_CODE_GOOGLE,
)
app.sites.add(site)