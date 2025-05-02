# backend/models/track.py
from datetime import datetime
from database import db

class Track(db.Model):
    __tablename__ = 'tracks'
    id = db.Column(db.Integer, primary_key=True)
    spotify_id = db.Column(db.String(255), nullable=False, unique=True)
    name = db.Column(db.String(255), nullable=False)
    artist_name = db.Column(db.String(255), nullable=False)
    artist_id = db.Column(db.String(255), nullable=False)
    album_name = db.Column(db.String(255))
    alnum_id = db.Column(db.String(255))  # 假设为 album ID，可添加外键
    image_url = db.Column(db.String(512))
    release_date = db.Column(db.Date)
    duration_ms = db.Column(db.Integer)
    track_number = db.Column(db.Integer)
    popularity = db.Column(db.Integer)
    chords = db.Column(db.Text)  # 存储和弦，可能为 JSON 或字符串
    key = db.Column(db.String(50))  # 音乐调性，例如 C, D#
    scale = db.Column(db.String(50))  # 大调/小调，例如 major, minor

    def to_dict(self):
        return {
            'id': self.id,
            'spotify_id': self.spotify_id,
            'name': self.name,
            'artist_name': self.artist_name,
            'artist_id': self.artist_id,
            'album_name': self.album_name,
            'alnum_id': self.alnum_id,
            'image_url': self.image_url,
            'release_date': str(self.release_date) if self.release_date else None,
            'duration_ms': self.duration_ms,
            'track_number': self.track_number,
            'popularity': self.popularity,
            'chords': self.chords,
            'key': self.key,
            'scale': self.scale
        }