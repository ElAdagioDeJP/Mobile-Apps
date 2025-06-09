from flask import Flask
from config import Config
from models import db
from flask_migrate import Migrate
from flask_cors import CORS
# blueprints
from routes.auth import auth_bp
from routes.sections import sections_bp
from routes.scores import scores_bp


def create_app():
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object(Config)
    db.init_app(app)
    Migrate(app, db)

    # registrar rutas
    app.register_blueprint(auth_bp,     url_prefix="/api/auth")
    app.register_blueprint(sections_bp)
    app.register_blueprint(scores_bp)

    @app.route("/")
    def home():
        return {"msg": "API running"}


    CORS(app)
    return app

app = create_app()
