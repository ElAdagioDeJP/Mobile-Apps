from flask import Blueprint, request, jsonify
from flask_httpauth import HTTPBasicAuth
from models import db, Section
from schemas import SectionSchema


sections_bp = Blueprint("sections", __name__, url_prefix="/sections")
sec_schema  = SectionSchema()
mul_schema  = SectionSchema(many=True)
auth        = HTTPBasicAuth()

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
    return sec_schema.jsonify(sec), 201

@sections_bp.route("/<int:id>", methods=["PUT"])
@auth.login_required
def update_section(id):
    user = auth.current_user()
    if not user.is_admin:
        return jsonify({"msg": "Forbidden"}), 403
    sec = Section.query.get_or_404(id)
    for k,v in request.json.items():
        setattr(sec, k, v)
    db.session.commit()
    return sec_schema.jsonify(sec)

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
