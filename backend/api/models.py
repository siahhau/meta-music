from django.db import models
from django.contrib.auth.models import User
from decimal import Decimal
class Note(models.Model):
    title = models.CharField(max_length=100)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notes")

    def __str__(self):
        return self.title

class Track(models.Model):
    spotify_id = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=255)
    artist_name = models.CharField(max_length=255, blank=True)
    artist_id = models.CharField(max_length=100, blank=True)
    album_name = models.CharField(max_length=255, blank=True)
    album_id = models.CharField(max_length=100, blank=True)
    image_url = models.URLField(blank=True, null=True)
    release_date = models.CharField(max_length=50, blank=True)
    duration_ms = models.IntegerField(blank=True, null=True)
    track_number = models.IntegerField(blank=True, null=True)
    explicit = models.BooleanField(default=False)
    popularity = models.IntegerField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} by {self.artist_name}"

    class Meta:
        indexes = [
            models.Index(fields=['spotify_id']),
            models.Index(fields=['name']),
            models.Index(fields=['artist_name']),
        ]

class Artist(models.Model):
    spotify_id = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=255)
    image_url = models.URLField(blank=True, null=True)
    genres = models.JSONField(blank=True, default=list)
    popularity = models.IntegerField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        indexes = [
            models.Index(fields=['spotify_id']),
            models.Index(fields=['name']),
        ]

class Album(models.Model):
    spotify_id = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=255, blank=True, default='Unknown Album')
    artist_name = models.CharField(max_length=255, blank=True)
    artist_id = models.CharField(max_length=100, blank=True)
    image_url = models.URLField(blank=True, null=True)
    release_date = models.CharField(max_length=50, blank=True)
    total_tracks = models.IntegerField(blank=True, null=True)
    label = models.CharField(max_length=255, blank=True)
    album_type = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} by {self.artist_name}"

    class Meta:
        indexes = [
            models.Index(fields=['spotify_id']),
            models.Index(fields=['name']),
            models.Index(fields=['artist_name']),
        ]

class Score(models.Model):
    STATUS_PENDING = 'PENDING'
    STATUS_APPROVED = 'APPROVED'
    STATUS_REJECTED = 'REJECTED'
    STATUS_CHOICES = [
        (STATUS_PENDING, '待审核'),
        (STATUS_APPROVED, '通过'),
        (STATUS_REJECTED, '拒绝'),
    ]

    track = models.ForeignKey(Track, on_delete=models.CASCADE, related_name='scores')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='scores')
    score_data = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    reviewer = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_scores')
    review_comments = models.TextField(blank=True)
    reward = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    is_paid = models.BooleanField(default=False)
    paid_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Score for {self.track.name} by {self.user.username}"

    class Meta:
        indexes = [
            models.Index(fields=['track']),
            models.Index(fields=['user']),
            models.Index(fields=['status']),
        ]
    def calculate_reward(self):
        """Calculate reward based on score_data complexity."""
        if not self.score_data:
            return Decimal('0.00')

        notes = self.score_data.get('notes', [])
        chords = self.score_data.get('chords', [])
        sections = self.score_data.get('sections', [])

        # 音符报酬：每 100 个音符 10 元
        note_reward = Decimal(len(notes) // 100 * 10)

        # 和弦报酬：每 50 个和弦 5 元
        chord_reward = Decimal(len(chords) // 50 * 5)

        # 结构报酬：每段 2 元
        section_reward = Decimal(len(sections) * 2)

        total_reward = note_reward + chord_reward + section_reward
        return total_reward.quantize(Decimal('0.01'))
    
class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    bio = models.CharField(max_length=200, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    location = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"