import os
from dotenv import load_dotenv

# carga .env desde instance/
basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, "instance/.env"))

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY")
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URI")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
