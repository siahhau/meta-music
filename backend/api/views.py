# backend/api/views.py
from datetime import timezone
from django.shortcuts import render
from django.contrib.auth.models import User
from rest_framework import generics, status, filters, serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from .serializers import UserSerializer, ScoreSerializer, AlbumSerializer, TrackSerializer, UserProfileSerializer
from .models import Track, Artist, Album, Score
from django.db.models import Q, Exists, OuterRef
from .spotify_utils import search_spotify, get_album_details, get_track_details
import logging
from decimal import Decimal
from django_filters.rest_framework import DjangoFilterBackend  # type: ignore # Correct import
from rest_framework.pagination import PageNumberPagination
from rest_framework.exceptions import ValidationError
from rest_framework_simplejwt.tokens import RefreshToken
logger = logging.getLogger(__name__)
def get_chord_similarity(chords1, chords2, n=10):
    """Calculate similarity between two chord sequences."""
    chords1 = chords1[:min(n, len(chords1))]
    chords2 = chords2[:min(n, len(chords2))]
    if not chords1 or not chords2:
        return 0
    matches = sum(1 for c1, c2 in zip(chords1, chords2) if c1.get('root') == c2.get('root') and c1.get('type') == c2.get('type'))
    return matches / max(len(chords1), len(chords2))

# 自定义分页类
class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'

class TrackListView(generics.ListAPIView):
    queryset = Track.objects.all()
    serializer_class = TrackSerializer
    pagination_class = StandardResultsSetPagination
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['explicit']
    search_fields = ['name', 'artist_name']
    ordering_fields = ['name', 'artist_name', 'album_name', 'duration_ms', 'popularity', 'created_at']
    ordering = ['name']

    def get_queryset(self):
        queryset = super().get_queryset()
        query = self.request.query_params.get('query', None)
        if query:
            queryset = queryset.filter(
                Q(name__icontains=query) |
                Q(artist_name__icontains=query)
            )
        # 优化查询，使用 annotate 添加 has_score
        user = self.request.user
        if user.is_authenticated:
            queryset = queryset.annotate(
                has_score=Exists(
                    Score.objects.filter(track=OuterRef('pk'), user=user)
                )
            )
        return queryset

    def get_serializer_context(self):
        # 确保 request 传递到 serializer 上下文中
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

class SearchView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        query = request.query_params.get('q', None)
        limit = min(int(request.query_params.get('limit', 10)), 15)
        search_types = request.query_params.get('types', 'track,artist,album').split(',')

        if not query or len(query.strip()) < 1:
            return Response(
                {"error": "查询参数 'q' 是必须的，且不能为空。"},
                status=status.HTTP_400_BAD_REQUEST
            )

        query = query.strip()
        results = []
        source = "spotify"

        try:
            logger.info(f"正在从 Spotify 搜索 '{query}'...")
            spotify_results = search_spotify(query, limit=min(limit, 5), search_types=search_types)
            logger.debug(f"Spotify 返回结果: {len(spotify_results)} 条")

            if not spotify_results:
                logger.warning(f"Spotify 搜索 '{query}' 返回空结果")
            else:
                type_counts = {'track': 0, 'artist': 0, 'album': 0}
                max_per_type = max(3, limit // len(search_types))
                filtered_results = []

                for item in spotify_results:
                    if type_counts[item['type']] < max_per_type:
                        type_counts[item['type']] += 1
                        filtered_results.append(item)
                        try:
                            if item['type'] == 'track':
                                # 检查数据库是否已有 Track
                                try:
                                    track = Track.objects.get(spotify_id=item['spotify_id'])
                                    logger.debug(f"数据库中已有 Track (spotify_id: {item['spotify_id']})")
                                except Track.DoesNotExist:
                                    logger.debug(f"数据库中无 Track (spotify_id: {item['spotify_id']})，存储新记录")
                                    Track.objects.update_or_create(
                                        spotify_id=item['spotify_id'],
                                        defaults={
                                            'name': item['name'] or 'Unknown Track',
                                            'artist_name': item['artist_name'] or '',
                                            'artist_id': item['artist_id'] or '',
                                            'album_name': item['album_name'] or '',
                                            'album_id': item['album_id'] or '',
                                            'image_url': item['image_url'] or '',
                                            'release_date': item['release_date'] or '',
                                            'duration_ms': item.get('duration_ms', 0) or 0,
                                            'track_number': item.get('track_number', 0),
                                            'explicit': item.get('explicit', False),
                                            'popularity': item.get('popularity', 0)
                                        }
                                    )
                            elif item['type'] == 'artist':
                                # 检查数据库是否已有 Artist
                                try:
                                    artist = Artist.objects.get(spotify_id=item['spotify_id'])
                                    logger.debug(f"数据库中已有 Artist (spotify_id: {item['spotify_id']})")
                                except Artist.DoesNotExist:
                                    logger.debug(f"数据库中无 Artist (spotify_id: {item['spotify_id']})，存储新记录")
                                    Artist.objects.update_or_create(
                                        spotify_id=item['spotify_id'],
                                        defaults={
                                            'name': item['name'] or 'Unknown Artist',
                                            'image_url': item['image_url'] or '',
                                            'genres': item['genres'] or [],
                                            'popularity': item.get('popularity', 0) or 0
                                        }
                                    )
                            elif item['type'] == 'album':
                                # 检查数据库是否已有 Album
                                try:
                                    album = Album.objects.get(spotify_id=item['spotify_id'])
                                    logger.debug(f"数据库中已有 Album (spotify_id: {item['spotify_id']})")
                                except Album.DoesNotExist:
                                    logger.debug(f"数据库中无 Album (spotify_id: {item['spotify_id']})，存储新记录")
                                    Album.objects.update_or_create(
                                        spotify_id=item['spotify_id'],
                                        defaults={
                                            'name': item['name'] or 'Unknown Album',
                                            'artist_name': item['artist_name'] or '',
                                            'artist_id': item['artist_id'] or '',
                                            'image_url': item['image_url'] or '',
                                            'release_date': item['release_date'] or '',
                                            'total_tracks': item.get('total_tracks', 0) or 0,
                                            'label': item.get('label', '') or '',
                                            'album_type': item.get('album_type', '') or ''
                                        }
                                    )
                        except Exception as e:
                            logger.error(f"存储 {item['type']} 数据失败 (spotify_id: {item['spotify_id']}): {e}")
                    if sum(type_counts.values()) >= limit:
                        break

                results = filtered_results
                logger.info(f"Spotify 搜索为 '{query}' 返回 {len(results)} 条结果 (track: {type_counts['track']}, artist: {type_counts['artist']}, album: {type_counts['album']})")

            return Response({
                "query": query,
                "source": source,
                "results": results
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.exception(f"SearchView 处理查询 '{query}' 时出错: {e}")
            return Response(
                {"error": f"搜索过程中发生内部服务器错误: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# 用户注册
class RegisterView(APIView):
    permission_classes = [AllowAny]  # Allow una प्रसuthenticated users

    def post(self, request):
        logger.info(f"Register request received: {request.data}")
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            # Generate JWT token
            refresh = RefreshToken.for_user(user)
            return Response({
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name
                },
                "tokens": {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token)
                }
            }, status=status.HTTP_201_CREATED)
        logger.error(f"Registration failed: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# 当前用户信息
class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        logger.info(f"用户 {request.user.username} 请求 /api/user/, is_staff={request.user.is_staff}")
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)

# 用户列表
class UserListView(generics.ListAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAdminUser]
    queryset = User.objects.all()

# 用户权限/状态更新
class UserPermissionUpdateView(APIView):
    permission_classes = [IsAdminUser]

    def put(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
            is_staff = request.data.get('is_staff')
            is_active = request.data.get('is_active')

            if is_staff is not None:
                user.is_staff = is_staff
            if is_active is not None:
                user.is_active = is_active
            user.save()

            serializer = UserProfileSerializer(user)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": "用户不存在"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UserUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        user = request.user
        serializer = UserProfileSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ScoreCreateView(generics.CreateAPIView):
    serializer_class = ScoreSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        track_id = serializer.validated_data.get('track_id')
        # 检查是否已存在该用户对该 track_id 的 Score
        if Score.objects.filter(track__spotify_id=track_id, user=self.request.user).exists():
            logger.warning(f"用户 {self.request.user.username} 尝试为已存在的 track_id {track_id} 创建重复歌谱")
            raise serializers.ValidationError("您已为这首歌曲提交过歌谱，无法重复提交")
        serializer.save(user=self.request.user)

class ScoreListView(generics.ListAPIView):
  serializer_class = ScoreSerializer
  permission_classes = [IsAuthenticated]
  def get_queryset(self):
    queryset = Score.objects.filter(user=self.request.user).select_related('track')
    track_id = self.request.query_params.get('track_id')
    if track_id:
      queryset = queryset.filter(track__spotify_id=track_id)
    return queryset

class ScoreReviewListView(generics.ListAPIView):
    serializer_class = ScoreSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        status_filter = self.request.query_params.get('status', Score.STATUS_PENDING)
        return Score.objects.filter(status=status_filter).select_related('track', 'user')

class ScoreReviewUpdateView(generics.UpdateAPIView):
    serializer_class = ScoreSerializer
    permission_classes = [IsAdminUser]
    queryset = Score.objects.all()

    def perform_update(self, serializer):
        instance = serializer.instance
        status = serializer.validated_data.get('status')
        if instance.status != Score.STATUS_PENDING:
            logger.warning(f"尝试更新非待审核歌谱 (id: {instance.id}, current_status: {instance.status})")
            raise ValidationError("只能更新待审核的歌谱")
        if status not in [Score.STATUS_APPROVED, Score.STATUS_REJECTED]:
            logger.error(f"无效的状态值: {status}")
            raise ValidationError("状态必须为 APPROVED 或 REJECTED")
        instance.reviewer = self.request.user
        if status == Score.STATUS_APPROVED:
            instance.reward = instance.calculate_reward()
        serializer.save()
        logger.info(f"歌谱 (id: {instance.id}) 更新为 {status} by {self.request.user.username}")

class ScoreMarkPaidView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, score_id):
        try:
            score = Score.objects.get(id=score_id, status=Score.STATUS_APPROVED)
            if score.is_paid:
                return Response({"error": "报酬已支付"}, status=status.HTTP_400_BAD_REQUEST)
            score.is_paid = True
            score.paid_at = timezone.now()
            score.save()
            return Response({"message": "报酬标记为已支付"}, status=status.HTTP_200_OK)
        except Score.DoesNotExist:
            return Response({"error": "歌谱不存在或未通过审核"}, status=status.HTTP_404_NOT_FOUND)

class ScoreStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        scores = Score.objects.filter(user=request.user)
        total_uploaded = scores.count()
        approved = scores.filter(status=Score.STATUS_APPROVED).count()
        pending = scores.filter(status=Score.STATUS_PENDING).count()
        rejected = scores.filter(status=Score.STATUS_REJECTED).count()
        total_reward = sum(score.reward for score in scores.filter(status=Score.STATUS_APPROVED))
        paid_reward = sum(score.reward for score in scores.filter(status=Score.STATUS_APPROVED, is_paid=True))
        unpaid_reward = total_reward - paid_reward

        return Response({
            'total_uploaded': total_uploaded,
            'approved': approved,
            'pending': pending,
            'rejected': rejected,
            'total_reward': float(total_reward),
            'paid_reward': float(paid_reward),
            'unpaid_reward': float(unpaid_reward)
        }, status=status.HTTP_200_OK)
# backend/api/views.py
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Score
from .serializers import ScoreSerializer
class ScoreDetailView(generics.DestroyAPIView):
    queryset = Score.objects.all()
    serializer_class = ScoreSerializer
    permission_classes = [IsAuthenticated]

    def delete(self, request, *args, **kwargs):
        score = self.get_object()
        if score.user != request.user:
            return Response(
                {"error": "只能删除自己的乐谱"},
                status=status.HTTP_403_FORBIDDEN
            )
        score.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class ScoreUpdateView(generics.UpdateAPIView):
    queryset = Score.objects.all()
    serializer_class = ScoreSerializer
    permission_classes = [IsAuthenticated]

    def perform_update(self, serializer):
        score = self.get_object()
        if score.user != self.request.user:
            raise serializers.ValidationError("只能编辑自己的乐谱")
        logger.info(f"Updating score {score.id} with data: {serializer.validated_data}")
        serializer.save()
        score.refresh_from_db()  # 强制刷新数据库状态
        score.reward = score.calculate_reward()
        score.save()
        logger.info(f"Saved score {score.id} with score_data: {score.score_data}")
        
class AlbumDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, spotify_id, *args, **kwargs):
        try:
            try:
                album = Album.objects.get(spotify_id=spotify_id)
            except Album.DoesNotExist:
                album = None

            if not album or not all([album.label, album.album_type]):
                spotify_data = get_album_details(spotify_id)
                if not spotify_data:
                    return Response(
                        {"error": "无法从 Spotify 获取专辑详情"},
                        status=status.HTTP_502_BAD_GATEWAY
                    )

                album, _ = Album.objects.update_or_create(
                    spotify_id=spotify_id,
                    defaults={
                        'name': spotify_data['name'],
                        'artist_name': spotify_data['artist_name'],
                        'artist_id': spotify_data['artist_id'],
                        'image_url': spotify_data['image_url'],
                        'release_date': spotify_data['release_date'],
                        'total_tracks': spotify_data['total_tracks'],
                        'label': spotify_data['label'],
                        'album_type': spotify_data['album_type']
                    }
                )

                for track_data in spotify_data['tracks']:
                    Track.objects.update_or_create(
                        spotify_id=track_data['spotify_id'],
                        defaults={
                            'name': track_data['name'],
                            'artist_name': track_data['artist_name'],
                            'artist_id': track_data['artist_id'],
                            'album_id': spotify_id,
                            'image_url': track_data['image_url'],
                            'release_date': track_data['release_date'],
                            'duration_ms': track_data['duration_ms'],
                            'track_number': track_data['track_number'],
                            'explicit': track_data['explicit'],
                            'popularity': track_data['popularity']
                        }
                    )

            tracks = Track.objects.filter(album_id=spotify_id)
            track_data = [
                {
                    'spotify_id': track.spotify_id,
                    'name': track.name,
                    'artist_name': track.artist_name,
                    'duration': f"{track.duration_ms // 60000}:{(track.duration_ms % 60000 // 1000):02d}",
                    'has_score': Score.objects.filter(track=track).exists()
                }
                for track in tracks
            ]

            album_serializer = AlbumSerializer(album)
            return Response({
                'album': album_serializer.data,
                'tracks': track_data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception(f"获取专辑详情失败 (spotify_id: {spotify_id}): {e}")
            return Response(
                {"error": "服务器错误"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class TrackDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, spotify_id, *args, **kwargs):
        try:
            # 尝试从数据库获取 Track
            try:
                track = Track.objects.get(spotify_id=spotify_id)
                logger.debug(f"数据库中找到歌曲 (spotify_id: {spotify_id})")
            except Track.DoesNotExist:
                logger.info(f"数据库中未找到歌曲 (spotify_id: {spotify_id})，尝试从 Spotify API 获取")
                track = None

            # 如果 Track 不存在，从 Spotify API 获取并存储
            if not track:
                spotify_data = get_track_details(spotify_id)
                if not spotify_data:
                    logger.error(f"无法从 Spotify 获取歌曲详情 (spotify_id: {spotify_id})，可能因市场限制或歌曲不可用")
                    return Response(
                        {"error": "无法从 Spotify 获取单曲详情，可能因市场限制或歌曲不可用"},
                        status=status.HTTP_502_BAD_GATEWAY
                    )

                album_data = spotify_data['album']
                try:
                    album, _ = Album.objects.update_or_create(
                        spotify_id=album_data['spotify_id'],
                        defaults={
                            'name': album_data['name'] or 'Unknown Album',
                            'artist_name': album_data['artist_name'] or '',
                            'artist_id': album_data['artist_id'] or '',
                            'image_url': album_data['image_url'] or '',
                            'release_date': album_data['release_date'] or '',
                            'total_tracks': album_data['total_tracks'] or 0,
                            'album_type': album_data['album_type'] or '',
                            'label': ''
                        }
                    )
                except Exception as e:
                    logger.error(f"保存专辑失败 (album_id: {album_data['spotify_id']}): {e}")
                    return Response(
                        {"error": "保存专辑数据失败"},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )

                if not album.label:
                    album_spotify_data = get_album_details(album_data['spotify_id'])
                    if album_spotify_data:
                        album.label = album_spotify_data.get('label', '')
                        album.save()

                try:
                    track, _ = Track.objects.update_or_create(
                        spotify_id=spotify_id,
                        defaults={
                            'name': spotify_data['name'] or 'Unknown Track',
                            'artist_name': spotify_data['artist_name'] or '',
                            'artist_id': spotify_data['artist_id'] or '',
                            'album_name': spotify_data['album_name'] or '',
                            'album_id': spotify_data['album_id'] or '',
                            'image_url': spotify_data['image_url'] or '',
                            'release_date': spotify_data['release_date'] or '',
                            'duration_ms': spotify_data['duration_ms'] or 0,
                            'track_number': spotify_data['track_number'] or 0,
                            'explicit': spotify_data['explicit'] or False,
                            'popularity': spotify_data['popularity'] or 0
                        }
                    )
                except Exception as e:
                    logger.error(f"保存歌曲失败 (spotify_id: {spotify_id}): {e}")
                    return Response(
                        {"error": "保存歌曲数据失败"},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )

            # 尝试获取专辑数据，验证关键字段
            album = None
            album_serializer = None
            try:
                album = Album.objects.get(spotify_id=track.album_id)
                logger.debug(f"获取专辑数据: {album.__dict__}")
                if not album.spotify_id or not album.name:
                    logger.warning(f"专辑数据不完整 (album_id: {track.album_id}): {album.__dict__}")
                    album = None
                else:
                    album_serializer = AlbumSerializer(album)
            except Album.DoesNotExist:
                logger.warning(f"关联专辑不存在 (album_id: {track.album_id})，返回 null")
                album = None

            has_score = Score.objects.filter(track=track, user=request.user).exists()
            score_data = None
            similar_tracks = []

            if has_score:
                score = Score.objects.filter(track=track, user=request.user).first()
                score_data = score.score_data if score else None

                # 查询相似和弦进行的歌曲
                current_chords = score_data.get('chords', []) if score_data else []
                scores = Score.objects.exclude(track=track).select_related('track')
                for other_score in scores[:100]:
                    other_chords = other_score.score_data.get('chords', [])
                    similarity = get_chord_similarity(current_chords, other_chords)
                    if similarity > 0.7:
                        similar_tracks.append({
                            'spotify_id': other_score.track.spotify_id,
                            'name': other_score.track.name,
                            'image_url': other_score.track.image_url
                        })
                similar_tracks = similar_tracks[:5]

            track_serializer = TrackSerializer(track)
            return Response({
                'track': track_serializer.data,
                'album': album_serializer.data if album_serializer else None,
                'has_score': has_score,
                'score_data': score_data,
                'similar_tracks': similar_tracks
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception(f"获取单曲详情失败 (spotify_id: {spotify_id}): {e}")
            return Response(
                {"error": "服务器错误"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )