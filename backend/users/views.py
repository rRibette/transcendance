from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse
from django.conf import settings
from django.core.files.base import ContentFile
from django.shortcuts import get_object_or_404
from django.db.models import Q
from rest_framework import generics, status
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import InvalidToken
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.decorators import api_view, renderer_classes, permission_classes
from rest_framework.renderers import JSONRenderer, TemplateHTMLRenderer
from rest_framework_simplejwt.exceptions import TokenError
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
from .serializer import UserSerializer, LoginSerializer, RegisterSerializer, UpdateProfileSerializer
from .models import Friend_Request, Block_User
from chat.models import ChatHistory
import requests

User = get_user_model()

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        ser = RegisterSerializer(data=request.data)
        if not ser.is_valid():
            return Response({
                'success': False,
                'errors':ser.errors,
            })
        user = ser.save()
        refresh = RefreshToken.for_user(user)
        return Response(
            {
            'success': True,
            'user': UserSerializer(user, context={"request": request}).data,
            'access':str(refresh.access_token),
            'refresh':str(refresh),
            },
            status=status.HTTP_201_CREATED
            )

class LoginView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        ser = LoginSerializer(data=request.data)
        if not ser.is_valid():
            return Response({
                'success': False,
                'errors': ser.errors,
            })
        user = ser.validated_data['user']
        refresh = RefreshToken.for_user(user)
        return Response({
            'success': True,
            'access':str(refresh.access_token),
            'refresh':str(refresh),
            'user': UserSerializer(user, context={"request": request}).data,
        })
 

class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    def get_object(self):
        return self.request.user    
    def update(self, request, *args, **kwargs):
        ser = self.get_serializer(self.get_object(), data=request.data, partial=True)
        if not ser.is_valid():
            return Response({'success': False, 'errors': ser.errors})
        ser.save()
        return Response({'success': True, 'user': ser.data})

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(
                {"detail": "Logout successful"},
                status=status.HTTP_205_RESET_CONTENT
            )
        except TokenError:
            return Response(
                {"error": "Invalid token"},
                status=status.HTTP_400_BAD_REQUEST
            )

# //PROFILE SYSTEM//#

@api_view(('GET',))
@permission_classes([AllowAny]) #to remove
def get_profile(request, username):
    user = User.objects.filter(username=username).first()
    if not user:
        return Response({'exists': False})
    serializer = UserSerializer(user)
    data = serializer.data
    data['exists'] = True
    return Response(data)

@api_view(('GET',))
@permission_classes([IsAuthenticated])
def get_friendlist(request):
    friends = request.user.friends.all()
    serializer = UserSerializer(friends, many=True)
    return Response(serializer.data)

# //FRIEND SYSTEM// #

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_friend_request(request, userID):
    from_user = request.user
    to_user = get_object_or_404(User, id=userID)
    if from_user == to_user:
        return HttpResponse('Cannot add yourself', status=200)
    if from_user.friends.filter(id=to_user.id).exists():
        return HttpResponse('Already friends', status=200)
    if from_user.blocked_users.filter(id=to_user.id).exists():
        return HttpResponse('Cannot send friend request to blocked user')
    if from_user.blocked_by.filter(id=to_user.id).exists():
        return HttpResponse('Cannot send a friend request to this user')
    friend_request, created = Friend_Request.objects.get_or_create(from_user=from_user, to_user=to_user)
    if created:
        return HttpResponse('Friend request sent')
    else:
        return HttpResponse('Friend request was already sent')

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def accept_friend_request(request, requestID):
    try:
        friend_request = Friend_Request.objects.get(id=requestID)
    except Friend_Request.DoesNotExist:
        return HttpResponse('Friend request no longer exists', status=200)
    if friend_request.to_user == request.user:
        friend_request.to_user.friends.add(friend_request.from_user)
        Friend_Request.objects.filter(from_user=friend_request.to_user, to_user=friend_request.from_user).delete()
        friend_request.delete()
        return HttpResponse ('Friend request accepted')
    else:
        friend_request.delete()
        return HttpResponse('Friend request rejected')

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reject_friend_request(request, requestID):
    try:
        friend_request = Friend_Request.objects.get(id=requestID)
    except Friend_Request.DoesNotExist:
        return HttpResponse('Friend request no longer exists', status=200)
    if friend_request.to_user == request.user:
        friend_request.delete()
        return HttpResponse ('Friend request rejected')
    else:
        return HttpResponse('Unauthorized', status=400)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def delete_friend(request, userID):
    requester = request.user
    to_remove = get_object_or_404(User, id=userID)
    if requester == to_remove:
        return HttpResponse('Cannot remove yourself', status=400)
    if not requester.friends.filter(id=to_remove.id).exists():
        return HttpResponse('Not friends', status=200)
    requester.friends.remove(to_remove)
    return HttpResponse('Friend removed')

@api_view(['POST'])
@permission_classes([IsAuthenticated]) 
def block_user(request, userID):
    from_user = request.user
    to_user = get_object_or_404(User, id=userID)
    if from_user == to_user:
        return HttpResponse('Cannot block yourself')
    if from_user.blocked_users.filter(id=to_user.id).exists():
        return HttpResponse('User already blocked')
    from_user.blocked_users.add(to_user)
    to_user.blocked_by.add(from_user)
    if from_user.friends.filter(id=to_user.id).exists():
        from_user.friends.remove(to_user)
    Friend_Request.objects.filter(from_user=from_user, to_user=to_user).delete()
    Friend_Request.objects.filter(from_user=to_user, to_user=from_user).delete()
    return HttpResponse('User blocked successfully')

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def unblock_user(request, userID):
    requester = request.user
    to_unblock = get_object_or_404(User, id=userID)
    if requester == to_unblock:
        return HttpResponse('Cannot unblock yourself', status=400)
    if not requester.blocked_users.filter(id=to_unblock.id).exists():
        return HttpResponse('Not blocked', status=400)
    requester.blocked_users.remove(to_unblock)
    to_unblock.blocked_by.remove(requester)
    return HttpResponse('User unblocked')

# //GETTERS// #

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_friend_requests(request):
    requests = Friend_Request.objects.filter(to_user=request.user).select_related('from_user')
    data = [{'id': req.id, 'from_username': req.from_user.username} for req in requests]
    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_friend_request_status(request, userID):
    to_user = get_object_or_404(User, id=userID)
    is_friend = request.user.friends.filter(id=userID).exists()
    sent = Friend_Request.objects.filter(from_user=request.user, to_user=to_user).exists()
    return Response({'sent': sent, 'is_friend': is_friend})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_blocked_status(request, userID):
    to_user = get_object_or_404(User, id=userID)
    is_blocked = (
        request.user.blocked_users.filter(id=userID).exists() or
        request.user.blocked_by.filter(id=userID).exists()
    )
    sent = Block_User.objects.filter(from_user=request.user, to_user=to_user).exists()
    return Response({'sent': sent, 'is_blocked': is_blocked})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_last_message(request, room_name):
    last = ChatHistory.objects.filter(name=room_name).select_related('user').order_by('-timestamp').first()
    if not last:
        return Response({'message': None})
    return Response({'message': last.message, 'user': last.user.username,})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_chatrooms(request):
    username = request.user.username
    chatroom_name = ChatHistory.objects.filter(Q(name__startswith=f"{username}--") | Q(name__endswith=f"--{username}")).values_list('name', flat=True).distinct()
    res = []
    for room in chatroom_name:
        other_user = next((u for u in room.split("--") if u != username), None)
        last_msg = ChatHistory.objects.filter(name=room).order_by('-timestamp').first()
        res.append({
            "room_name": room,
            "other_user": other_user,
            "last_message": last_msg.message if last_msg else None,
        })
    return Response(res)

# //LOGIN// #

class GoogleLogin(SocialLoginView):    
    adapter_class = GoogleOAuth2Adapter
    callback_url = 'https://localhost:8443/auth/google/callback'
    client_class = OAuth2Client

class Login42(APIView):
    permission_classes = [AllowAny]
    def post (self, request):
        code = request.data.get('code')
        if not code:
            return Response(
                {'error': 'code is required'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        token_response = requests.post('https://api.intra.42.fr/oauth/token', data={
            'grant_type': 'authorization_code',
            'client_id': settings.CLIENT_42_ID,
            'client_secret': settings.SECRET_CODE_42,
            'code': code,
            'redirect_uri': 'https://localhost:8443/auth/42/callback',
        },)
        if token_response.status_code != 200:
            return Response(
                {'error': f'Failed to exchange code: {token_response.text}'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        access_token_42 = token_response.json().get('access_token')
        user_response = requests.get('https://api.intra.42.fr/v2/me', headers={'Authorization': f'Bearer {access_token_42}'},
        )
        if user_response.status_code != 200:
            return Response(
                {'error': 'Failed to fetch user info from 42'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user_data = user_response.json()
        login = user_data.get('login')
        email = user_data.get('email')
        first_name = user_data.get('first_name', '')
        last_name = user_data.get('last_name', '')
        avatar_url = user_data.get('image', {}).get('link')

        user = User.objects.filter(email=email).first()
        if not user:
            username = login
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{login}_{counter}"
                counter += 1
            user = User.objects.create_user(
                username=username,
                email=email,
                first_name=first_name,
                last_name=last_name,
            )
            if avatar_url:
                try:
                    img_response = requests.get(avatar_url, timeout=5)
                    if img_response.status_code == 200:
                        file_name = f"{username}_42.jpg"
                        user.avatar.save(
                            file_name,
                            ContentFile(img_response.content),
                            save=True,
                        )
                except Exception as e:
                    print(f"Failed to fetch 42 profile picture: {e}")
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                'user':{
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                },
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }, status=status.HTTP_200_OK
        )
