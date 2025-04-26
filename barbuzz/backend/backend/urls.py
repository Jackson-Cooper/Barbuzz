from django.contrib import admin
from django.urls import path, include
from rest_framework.authtoken.views import obtain_auth_token
from .views import CustomAuthToken
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'bars', views.BarViewSet)
router.register(r'wait-times', views.WaitTimeViewSet)
router.register(r'user-profiles', views.UserProfileViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/register/', views.UserRegistrationAPIView.as_view(), name='register'),
    path('api/auth/login/', CustomAuthToken.as_view(), name='login'),
    path('api/auth/logout/', views.LogoutAPIView.as_view(), name='logout'),
    path('api/auth/user/', views.get_current_user, name='current_user'),
    path('api/user-profiles/me/', views.get_user_profile, name='my_profile'),
    path('api/favorites/', views.get_favorites, name='favorites'),
    path('api/favorites/<int:bar_id>/toggle/', views.toggle_favorite, name='toggle_favorite'),
    path('api/', include(router.urls)),
]