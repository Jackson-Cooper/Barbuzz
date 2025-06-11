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

urlpatterns = [
    path('admin/', admin.site.urls),
    path(f'api/auth/register/', views.UserRegistrationAPIView.as_view(), name='register'),
    path(f'api/auth/login/', CustomAuthToken.as_view(), name='login'),
    path(f'api/auth/logout/', views.LogoutAPIView.as_view(), name='logout'),
    path(f'api/auth/user/', views.get_current_user, name='current_user'),
    path(f'api/user-profiles/me/', views.get_user_profile, name='my_profile'),
    path(f'api/favorites/', views.get_favorites, name='favorites'),
    path(f'api/favorites/<str:bar_id>/toggle/', views.toggle_favorite, name='toggle_favorite'),
    path(f'api/', include(router.urls)),
]
