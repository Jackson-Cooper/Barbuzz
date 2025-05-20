from django.contrib import admin
from django.urls import path, include
from rest_framework.authtoken.views import obtain_auth_token
from .views import CustomAuthToken
from rest_framework.routers import DefaultRouter
from . import views
from django.conf import settings

router = DefaultRouter()
router.register(r'bars', views.BarViewSet)
router.register(r'wait-times', views.WaitTimeViewSet)
router.register(r'user-profiles', views.UserProfileViewSet)

api_prefix = settings.API_URL_PREFIX
if api_prefix:
    api_prefix = api_prefix.strip('/') + '/'

urlpatterns = [
    path('admin/', admin.site.urls),
    path(f'{api_prefix}auth/register/', views.UserRegistrationAPIView.as_view(), name='register'),
    path(f'{api_prefix}auth/login/', CustomAuthToken.as_view(), name='login'),
    path(f'{api_prefix}auth/logout/', views.LogoutAPIView.as_view(), name='logout'),
    path(f'{api_prefix}auth/user/', views.get_current_user, name='current_user'),
    path(f'{api_prefix}user-profiles/me/', views.get_user_profile, name='my_profile'),
    path(f'{api_prefix}favorites/', views.get_favorites, name='favorites'),
    path(f'{api_prefix}favorites/<int:bar_id>/toggle/', views.toggle_favorite, name='toggle_favorite'),
    path(f'{api_prefix}', include(router.urls)),
]
