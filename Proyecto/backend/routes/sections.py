from flask import Blueprint, request, jsonify
from routes.auth import auth
from models import db, Section
from schemas import SectionSchema
from datetime import datetime

sections_bp = Blueprint("sections", __name__, url_prefix="/sections")
sec_schema  = SectionSchema()
mul_schema  = SectionSchema(many=True)


@sections_bp.route("/<string:category>", methods=["GET"])
def list_sections(category):
    secs = Section.query.filter_by(category=category).order_by(Section.date).all()
    # serializamos y devolvemos con flask.jsonify
    return jsonify(mul_schema.dump(secs))

@sections_bp.route("/<string:category>", methods=["POST"])
@auth.login_required
def create_section(category):
    user = auth.current_user()
    if not user.is_admin:
        return jsonify({"msg": "Forbidden"}), 403
    payload = request.json
    sec = Section(category=category, **payload)
    db.session.add(sec)
    db.session.commit()
    return jsonify(sec_schema.dump(sec)), 201

@sections_bp.route("/<int:id>", methods=["PUT"])
@auth.login_required
def update_section(id):
    user = auth.current_user()
    if not user.is_admin:
        return jsonify({"msg": "Forbidden"}), 403

    sec = Section.query.get_or_404(id)
    data = request.get_json() or {}

    # Si vienen date y finished juntos, procesamos date primero
    if "date" in data:
        # recibe algo como "2025-06-08T15:34:56.969Z"
        try:
            # quita la Z y usa fromisoformat
            iso = data["date"].rstrip("Z")
            data["date"] = datetime.fromisoformat(iso)
        except Exception as e:
            return jsonify({"msg": "Formato de fecha inválido"}), 400

    # ahora aplicamos todos los cambios
    for k, v in data.items():
        setattr(sec, k, v)

    db.session.commit()
    return jsonify(sec_schema.dump(sec))

@sections_bp.route("/<int:id>", methods=["DELETE"])
@auth.login_required
def delete_section(id):
    user = auth.current_user()
    if not user.is_admin:
        return jsonify({"msg": "Forbidden"}), 403
    sec = Section.query.get_or_404(id)
    db.session.delete(sec)
    db.session.commit()
    return "", 204
