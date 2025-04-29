from django.contrib import admin
from django.urls import path, re_path
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from api.views import (
    TrackListView, SearchView, RegisterView, CurrentUserView, UserListView,
    UserPermissionUpdateView, UserUpdateView, ScoreCreateView, ScoreListView,
    ScoreReviewListView, ScoreReviewUpdateView, ScoreMarkPaidView, ScoreStatsView,
    ScoreDetailView, ScoreUpdateView, AlbumDetailView, TrackDetailView
)

urlpatterns = [
    # 管理员路由
    path("admin/", admin.site.urls),

    # JWT 认证
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # 用户相关接口
    path("api/user/register/", RegisterView.as_view(), name="user_register"),
    path("api/user/list/", UserListView.as_view(), name="user_list"),
    path("api/user/me/", CurrentUserView.as_view(), name="user_me"),  # 新增：当前用户信息
    path("api/user/<int:id>/", CurrentUserView.as_view(), name="user_details"),  # 保留：特定用户详情
    path("api/user/<int:id>/permission/", UserPermissionUpdateView.as_view(), name="user_permission"),
    path("api/user/<int:id>/update/", UserUpdateView.as_view(), name="user_update"),

    # 歌曲相关接口
    path("api/track/list/", TrackListView.as_view(), name="track_list"),
    # path("api/track/<str:spotify_id>/", TrackDetailView.as_view(), name="track_details"),
    path("api/track/search/", SearchView.as_view(), name="track_search"),
    re_path(r"^api/track/(?P<spotify_id>[0-9a-zA-Z]+)/$", TrackDetailView.as_view(), name="track_details"),

    # 专辑相关接口
    path("api/album/<str:spotify_id>/", AlbumDetailView.as_view(), name="album_details"),

    # 乐谱相关接口
    path("api/score/create/", ScoreCreateView.as_view(), name="score_create"),
    path("api/score/list/", ScoreListView.as_view(), name="score_list"),
    path("api/score/<int:id>/", ScoreDetailView.as_view(), name="score_details"),
    path("api/score/<int:pk>/update/", ScoreUpdateView.as_view(), name="score_update"),
    path("api/score/review/", ScoreReviewListView.as_view(), name="score_review_list"),
    path("api/score/<int:id>/review/", ScoreReviewUpdateView.as_view(), name="score_review_update"),
    path("api/score/<int:id>/mark-paid/", ScoreMarkPaidView.as_view(), name="score_mark_paid"),
    path("api/score/stats/", ScoreStatsView.as_view(), name="score_stats"),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)