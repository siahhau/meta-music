# backend/api/serializers.py
from rest_framework import serializers
from .models import Note, Track, Artist, Album, Score, Profile
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
import logging
logger = logging.getLogger(__name__)
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password']
        extra_kwargs = {'password': {'write_only': True}}

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        Profile.objects.create(user=user)
        return user

class UserProfileSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()
    bio = serializers.CharField(source='profile.bio', allow_blank=True, required=False)
    phone = serializers.CharField(source='profile.phone', allow_blank=True, required=False)
    location = serializers.CharField(source='profile.location', allow_blank=True, required=False)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_active', 'is_staff', 'bio', 'phone', 'location', 'role', 'permissions']
        read_only_fields = ['id', 'is_staff', 'role', 'permissions']

    def get_role(self, obj):
        return 'Admin' if obj.is_staff else 'Annotator'

    def get_permissions(self, obj):
        return 'Staff' if obj.is_staff else 'User'

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        try:
            profile = instance.profile
        except Profile.DoesNotExist:
            profile = Profile.objects.create(user=instance)
        representation['bio'] = profile.bio or ''
        representation['phone'] = profile.phone or ''
        representation['location'] = profile.location or ''
        return representation

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', {})
        instance.username = validated_data.get('username', instance.username)
        instance.email = validated_data.get('email', instance.email)
        instance.save()

        try:
            profile = instance.profile
        except Profile.DoesNotExist:
            profile = Profile.objects.create(user=instance)

        profile.bio = profile_data.get('bio', profile.bio)
        profile.phone = profile_data.get('phone', profile.phone)
        profile.location = profile_data.get('location', profile.location)
        profile.save()

        return instance

class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = ['id', 'title', 'content', 'created_at']

class TrackSerializer(serializers.ModelSerializer):
    has_score = serializers.SerializerMethodField()

    class Meta:
        model = Track
        fields = [
            'spotify_id', 'name', 'artist_name', 'artist_id', 'album_name', 'album_id',
            'image_url', 'release_date', 'duration_ms', 'track_number', 'explicit',
            'popularity', 'created_at', 'has_score'
        ]

    def get_has_score(self, obj):
        # 获取当前请求用户
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # 检查当前用户是否为该 Track 提交过 Score
            return Score.objects.filter(track=obj, user=request.user).exists()
        return False
class ArtistSerializer(serializers.ModelSerializer):
    class Meta:
        model = Artist
        fields = ['spotify_id', 'name', 'image_url', 'genres', 'popularity', 'created_at']

class AlbumSerializer(serializers.ModelSerializer):
    class Meta:
        model = Album
        fields = ['spotify_id', 'name', 'artist_name', 'artist_id', 'image_url', 'release_date', 'total_tracks', 'label', 'album_type', 'created_at']

class ScoreSerializer(serializers.ModelSerializer):
    track_id = serializers.CharField(write_only=True, required=False)
    track_name = serializers.CharField(source='track.name', read_only=True)
    artist_name = serializers.CharField(source='track.artist_name', read_only=True)
    user = serializers.CharField(source='user.username', read_only=True)
    reward = serializers.FloatField(read_only=True)
    score_data = serializers.JSONField(required=False)

    class Meta:
        model = Score
        fields = ['id', 'track_id', 'track_name', 'artist_name', 'user', 'score_data', 'created_at', 'status', 'reviewer', 'review_comments', 'reward', 'is_paid', 'paid_at']
        read_only_fields = ['reward', 'is_paid', 'paid_at', 'track_name', 'artist_name', 'user', 'created_at', 'reviewer']

    def validate_track_id(self, value):
        if value:
            try:
                Track.objects.get(spotify_id=value)
            except Track.DoesNotExist:
                raise serializers.ValidationError("无效的歌曲 ID")
        return value

    def calculate_relative_chords(self, score_data):
        """计算相对和弦编号并存储到 score_data.relative_chords"""
        chords = score_data.get('chords', [])
        key = score_data.get('keys', [{}])[0]
        sections = score_data.get('sections', [])
        if not chords or not key:
            logger.warning("Missing chords or key in score_data")
            return []

        major_scale = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
        minor_scale = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"]
        tonic = key.get('tonic', 'C')
        try:
            tonic_index = major_scale.index(tonic)
        except ValueError:
            logger.warning(f"Invalid tonic {tonic} for major_scale, defaulting to C")
            tonic_index = major_scale.index('C')

        is_major = key.get('scale', 'major') == 'major'
        scale = major_scale if is_major else minor_scale

        relative_chords = []
        for section in sections:
            section_name = section.get('name', '')
            start_beat = section.get('beat', 0)
            next_section = next((s for s in sections if s.get('beat', 0) > start_beat), None)
            end_beat = next_section.get('beat', float('inf')) if next_section else float('inf')

            section_chords = [
                chord for chord in chords
                if start_beat <= chord.get('beat', 0) < end_beat
            ]
            section_relative = []
            for chord in section_chords:
                root = chord.get('root', 1)
                if isinstance(root, str):
                    try:
                        root_index = scale.index(root)
                        relative_number = ((root_index - tonic_index) % 7) + 1
                    except ValueError:
                        logger.warning(f"Invalid root {root} for scale, skipping")
                        continue
                else:
                    relative_number = ((root - 1 + tonic_index) % 7) + 1
                section_relative.append(relative_number)

            unique_relative = list(dict.fromkeys(section_relative))  # 去重，保持顺序
            if unique_relative:
                relative_chords.append({
                    "section": section_name,
                    "chords": unique_relative
                })

        logger.info(f"Calculated relative_chords: {relative_chords}")
        return relative_chords

    def create(self, validated_data):
        track_id = validated_data.pop('track_id')
        track = Track.objects.get(spotify_id=track_id)
        score_data = validated_data.pop('score_data', {})
        score_data['relative_chords'] = self.calculate_relative_chords(score_data)
        logger.info(f"Creating score with relative_chords: {score_data['relative_chords']}")
        score = Score.objects.create(track=track, score_data=score_data, **validated_data)
        score.reward = score.calculate_reward()
        score.save()
        return score

    def update(self, instance, validated_data):
        logger.info(f"Updating score {instance.id} with validated_data: {validated_data}")
        validated_data.pop('track_id', None)
        score_data = validated_data.pop('score_data', instance.score_data)
        score_data['relative_chords'] = self.calculate_relative_chords(score_data)
        logger.info(f"Updated score_data with relative_chords: {score_data['relative_chords']}")
        instance.score_data = score_data
        instance.status = validated_data.get('status', instance.status)
        instance.review_comments = validated_data.get('review_comments', instance.review_comments)
        instance.save()
        logger.info(f"Updated score {instance.id} with score_data: {instance.score_data}")
        return instance