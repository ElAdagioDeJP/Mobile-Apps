from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    id       = db.Column(db.Integer, primary_key=True)
    email    = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(128), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)

class Section(db.Model):
    id        = db.Column(db.Integer, primary_key=True)
    category  = db.Column(db.String(50), nullable=False)  # ej. "atletismo_velocidad" o "basquet"
    date      = db.Column(db.DateTime, default=datetime.utcnow)
    finished  = db.Column(db.Boolean, default=False)
    # para no-atletismo
    codeA     = db.Column(db.String(2))
    codeB     = db.Column(db.String(2))
    scoreA    = db.Column(db.Integer, default=0)
    scoreB    = db.Column(db.Integer, default=0)
    # para atletismo
    gender    = db.Column(db.String(10))
    positions = db.Column(db.PickleType)  # lista de strings

    def __repr__(self):
        return f"<Section {self.id} {self.category}>"
