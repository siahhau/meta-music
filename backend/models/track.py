# 修改 backend/models/track.py

# backend/models/track.py
from datetime import datetime
from database import db
from sqlalchemy.dialects.postgresql import JSON

class Track(db.Model):
    __tablename__ = 'tracks'
    id = db.Column(db.Integer, primary_key=True)
    spotify_id = db.Column(db.String(255), nullable=False, unique=True)
    name = db.Column(db.String(255), nullable=False)
    artist_name = db.Column(db.String(255), nullable=True)
    artist_id = db.Column(db.String(255), nullable=True)
    album_name = db.Column(db.String(255))
    album_id = db.Column(db.String(255))
    image_url = db.Column(db.String(512))
    release_date = db.Column(db.Date)
    duration_ms = db.Column(db.Integer)
    track_number = db.Column(db.Integer)
    popularity = db.Column(db.Integer)
    chords = db.Column(db.Text)
    key = db.Column(db.String(50))
    scale = db.Column(db.String(50))
    sections = db.Column(JSON, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    explicit = db.Column(db.Boolean, nullable=True)
    midi_url = db.Column(db.String(512), nullable=True)  # 添加midi_url字段

    def to_dict(self):
        return {
            'id': self.id,
            'spotify_id': self.spotify_id,
            'name': self.name,
            'artist_name': self.artist_name,
            'artist_id': self.artist_id,
            'album_name': self.album_name,
            'album_id': self.album_id,
            'image_url': self.image_url,
            'release_date': str(self.release_date) if self.release_date else None,
            'duration_ms': self.duration_ms,
            'track_number': self.track_number,
            'popularity': self.popularity,
            'chords': self.chords,
            'key': self.key,
            'scale': self.scale,
            'sections': self.sections,
            'created_at': str(self.created_at) if self.created_at else None,
            'explicit': self.explicit,
            'midi_url': self.midi_url  # 添加到返回数据中
        }