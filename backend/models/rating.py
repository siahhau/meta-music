from datetime import datetime
from database import db

class Rating(db.Model):
    __tablename__ = 'ratings'
    id = db.Column(db.Integer, primary_key=True)
    album_id = db.Column(db.String(100), db.ForeignKey('albums.spotify_id'), nullable=False)
    score = db.Column(db.Integer, nullable=False)  # 1-5
    review = db.Column(db.Text)
    user = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'score': self.score,
            'review': self.review,
            'user': self.user,
            'created_at': self.created_at.isoformat()
        }