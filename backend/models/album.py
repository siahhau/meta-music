# backend/models/album.py
from datetime import datetime
from sqlalchemy.dialects.postgresql import JSON
from database import db

class Album(db.Model):
    __tablename__ = 'albums'
    id = db.Column(db.Integer, primary_key=True)
    spotify_id = db.Column(db.String(100), unique=True, nullable=False)
    name = db.Column(db.String(255), nullable=True, default='Unknown Album')
    artist_name = db.Column(db.String(255), nullable=True)
    artist_id = db.Column(db.String(100), nullable=True)
    image_url = db.Column(db.String(255), nullable=True)
    release_date = db.Column(db.String(50), nullable=True)
    release_date_precision = db.Column(db.String(20), nullable=True)
    uri = db.Column(db.String(100), nullable=True)
    restrictions = db.Column(JSON, nullable=True)
    tracks = db.Column(JSON, nullable=True)
    copyrights = db.Column(JSON, nullable=True)
    genres = db.Column(JSON, default=list)
    label = db.Column(db.String(255), nullable=True)
    popularity = db.Column(db.Integer, nullable=True)
    total_tracks = db.Column(db.Integer, nullable=True)
    album_type = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


    def to_dict(self):
        return {
           'id': self.id,
            'spotify_id': self.spotify_id,
            'name': self.name,
            'artist_name': self.artist_name,
            'artist_id': self.artist_id,
            'image_url': self.image_url,
            'release_date': self.release_date,
            'release_date_precision': self.release_date_precision,
            'uri': self.uri,
            'restrictions': self.restrictions,
            'tracks': self.tracks,
            'copyrights': self.copyrights,
            'genres': self.genres,
            'label': self.label,
            'popularity': self.popularity,
            'total_tracks': self.total_tracks,
            'album_type': self.album_type,
            'created_at': str(self.created_at) if self.created_at else None
        }