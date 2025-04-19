from rest_framework import serializers
from .models import Note, Track, Artist, Album, Score, Profile
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password

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
    class Meta:
        model = Track
        fields = ['spotify_id', 'name', 'artist_name', 'artist_id', 'album_name', 'album_id', 'image_url', 'release_date', 'duration_ms', 'track_number', 'explicit', 'popularity', 'created_at']

class ArtistSerializer(serializers.ModelSerializer):
    class Meta:
        model = Artist
        fields = ['spotify_id', 'name', 'image_url', 'genres', 'popularity', 'created_at']

class AlbumSerializer(serializers.ModelSerializer):
    class Meta:
        model = Album
        fields = ['spotify_id', 'name', 'artist_name', 'artist_id', 'image_url', 'release_date', 'total_tracks', 'label', 'album_type', 'created_at']

class ScoreSerializer(serializers.ModelSerializer):
    track_id = serializers.CharField(write_only=True)
    track_name = serializers.CharField(source='track.name', read_only=True)
    artist_name = serializers.CharField(source='track.artist_name', read_only=True)
    user = serializers.CharField(source='user.username', read_only=True)
    reward = serializers.FloatField(read_only=True)

    class Meta:
        model = Score
        fields = ['id', 'track_id', 'track_name', 'artist_name', 'user', 'score_data', 'created_at', 'status', 'reviewer', 'review_comments', 'reward', 'is_paid', 'paid_at']
        read_only_fields = ['status', 'reviewer', 'review_comments', 'reward', 'is_paid', 'paid_at']

    def validate_track_id(self, value):
        try:
            Track.objects.get(spotify_id=value)
        except Track.DoesNotExist:
            raise serializers.ValidationError("无效的歌曲 ID")
        return value

    def create(self, validated_data):
        track_id = validated_data.pop('track_id')
        track = Track.objects.get(spotify_id=track_id)
        score = Score.objects.create(track=track, user=self.context['request'].user, **validated_data)
        score.reward = score.calculate_reward()
        score.save()
        return score