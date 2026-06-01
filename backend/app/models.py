from datetime import datetime
from app.database import db

class Repository(db.Model):
    __tablename__ = 'repositories'

    id = db.Column(db.Integer, primary_key=True)
    owner = db.Column(db.String(100), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    pull_requests = db.relationship('PullRequest', backref='repository', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'owner': self.owner,
            'name': self.name,
            'created_at': self.created_at.isoformat()
        }


class PullRequest(db.Model):
    __tablename__ = 'pull_requests'

    id = db.Column(db.Integer, primary_key=True)
    repository_id = db.Column(db.Integer, db.ForeignKey('repositories.id'), nullable=False)
    pr_number = db.Column(db.Integer, nullable=False)
    title = db.Column(db.String(255), nullable=False)
    author = db.Column(db.String(100), nullable=False)
    state = db.Column(db.String(50), default='open')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    reviews = db.relationship('Review', backref='pull_request', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'repository_id': self.repository_id,
            'pr_number': self.pr_number,
            'title': self.title,
            'author': self.author,
            'state': self.state,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }


class Review(db.Model):
    __tablename__ = 'reviews'

    id = db.Column(db.Integer, primary_key=True)
    pr_id = db.Column(db.Integer, db.ForeignKey('pull_requests.id'), nullable=False)
    status = db.Column(db.String(50), nullable=False)  # SUCCESS, FAILED
    summary_feedback = db.Column(db.Text, nullable=True)
    raw_diff = db.Column(db.Text, nullable=True)
    duration_seconds = db.Column(db.Float, default=0.0)
    total_issues = db.Column(db.Integer, default=0)
    error_message = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    comments = db.relationship('ReviewComment', backref='review', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'pr_id': self.pr_id,
            'status': self.status,
            'summary_feedback': self.summary_feedback,
            'duration_seconds': self.duration_seconds,
            'total_issues': self.total_issues,
            'error_message': self.error_message,
            'created_at': self.created_at.isoformat(),
            'comments': [comment.to_dict() for comment in self.comments]
        }


class ReviewComment(db.Model):
    __tablename__ = 'review_comments'

    id = db.Column(db.Integer, primary_key=True)
    review_id = db.Column(db.Integer, db.ForeignKey('reviews.id'), nullable=False)
    file_path = db.Column(db.String(255), nullable=False)
    line_number = db.Column(db.Integer, nullable=True)
    comment = db.Column(db.Text, nullable=False)
    severity = db.Column(db.String(50), default='info')  # info, warning, error

    def to_dict(self):
        return {
            'id': self.id,
            'review_id': self.review_id,
            'file_path': self.file_path,
            'line_number': self.line_number,
            'comment': self.comment,
            'severity': self.severity
        }
