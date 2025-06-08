from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import generate_password_hash, check_password_hash
from flask_httpauth import HTTPBasicAuth
from models import db, User

auth_bp = Blueprint("auth", __name__)
auth   = HTTPBasicAuth()

@auth.verify_password
def verify(email, password):
    user = User.query.filter_by(email=email).first()
    if user and check_password_hash(user.password, password):
        return user

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.json
    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"msg": "Usuario ya existe"}), 400
    hashed = generate_password_hash(data["password"])
    user = User(email=data["email"], password=hashed, is_admin=data.get("is_admin", False))
    db.session.add(user)
    db.session.commit()
    return jsonify({"msg": "Registrado"}), 201

@auth_bp.route("/login")
@auth.login_required
def login():
    user = auth.current_user()
    return jsonify({"email": user.email, "is_admin": user.is_admin})
