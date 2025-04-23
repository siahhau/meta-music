# backend/api/urls.py
from django.urls import path
from .views import (
    SearchView, RegisterView, ScoreCreateView,
    ScoreListView, ScoreReviewListView, ScoreReviewUpdateView, ScoreMarkPaidView,
    ScoreStatsView, AlbumDetailView, TrackDetailView,
    UserListView, UserPermissionUpdateView, CurrentUserView, UserUpdateView,
    TrackListView, ScoreDetailView, ScoreUpdateView  # 新增
)

urlpatterns = [
    path("search/", SearchView.as_view(), name='search'),
    path("register/", RegisterView.as_view(), name='register'),
    path('scores/', ScoreListView.as_view(), name='score-list'),
    path('scores/create/', ScoreCreateView.as_view(), name='score-create'),
    path('scores/<int:pk>/', ScoreDetailView.as_view(), name='score-detail'),  # 新增 DELETE
    path('scores/<int:pk>/update/', ScoreUpdateView.as_view(), name='score-update'),  # 新增 PUT
    path("scores/review/", ScoreReviewListView.as_view(), name='score-review-list'),
    path("scores/review/<int:pk>/", ScoreReviewUpdateView.as_view(), name='score-review-update'),
    path("scores/mark-paid/<int:score_id>/", ScoreMarkPaidView.as_view(), name='score-mark-paid'),
    path("scores/stats/", ScoreStatsView.as_view(), name='score-stats'),
    path("albums/<str:spotify_id>/", AlbumDetailView.as_view(), name='album-detail'),
    path("tracks/<str:spotify_id>/", TrackDetailView.as_view(), name='track-detail'),
    path("tracks/", TrackListView.as_view(), name='track-list'),
    path("user/", CurrentUserView.as_view(), name='current-user'),
    path("users/", UserListView.as_view(), name='user-list'),
    path("users/<int:pk>/permissions/", UserPermissionUpdateView.as_view(), name='user-permission-update'),
    path("user/update/", UserUpdateView.as_view(), name='user-update'),
]