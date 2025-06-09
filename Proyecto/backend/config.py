import os
from dotenv import load_dotenv

# Solo cargar .env en desarrollo local
if not os.environ.get("RAILWAY"):
    basedir = os.path.abspath(os.path.dirname(__file__))
    env_path = os.path.join(basedir, "instance", ".env")
    if os.path.exists(env_path):
        load_dotenv(env_path)

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY") or os.environ.get("SECRET_KEY", "fallback-secret")
    
    # Configuración inteligente para DB
    if os.environ.get("DATABASE_URL"):
        SQLALCHEMY_DATABASE_URI = os.environ["DATABASE_URL"].replace("postgres://", "postgresql://")
    else:
        SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URI", "sqlite:///local.db")
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False