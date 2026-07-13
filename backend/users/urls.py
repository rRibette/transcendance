from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import RegisterView, LoginView, LogoutView, MeView, GoogleLogin, Login42, get_profile, get_friendlist, send_friend_request, accept_friend_request, reject_friend_request, block_user, get_friend_requests, get_friend_request_status, get_blocked_status, unblock_user, delete_friend, get_last_message, get_chatrooms

urlpatterns = [
    path('auth/register/', RegisterView.as_view()),
    path('auth/login/', LoginView.as_view()),
    path('auth/logout/', LogoutView.as_view()),
    path('auth/refresh/', TokenRefreshView.as_view()),
    path('auth/google/', GoogleLogin.as_view()),
    path('auth/42/', Login42.as_view()),
    
    path('users/me/', MeView.as_view()),
    path('users/<str:username>/', get_profile, name='profile'),
    path('me/friends/', get_friendlist, name='friendlist'),
    path('send_friend_request/<int:userID>/', send_friend_request, name='send friend request'),
    path('accept_friend_request/<int:requestID>/', accept_friend_request, name='accept friend request'),
    path('reject_friend_request/<int:requestID>/', reject_friend_request, name='reject friend request'),
    path('delete_friend/<int:userID>/', delete_friend, name='delete friend'),
    path('block_user/<int:userID>/', block_user, name='block user'),
    path('unblock_user/<int:userID>/', unblock_user, name='unblock user'),
    path('friend_requests/', get_friend_requests),
    path('friend_request_status/<int:userID>/', get_friend_request_status),
    path('blocked_status/<int:userID>/', get_blocked_status),
    path('last_message/<str:room_name>/', get_last_message),
    path('all_user_chatrooms/', get_chatrooms),

]