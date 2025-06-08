from flask import Blueprint, jsonify
from models import Section
from schemas import SectionSchema

scores_bp = Blueprint("scores", __name__, url_prefix="/scores")
score_schema = SectionSchema(many=True)

@scores_bp.route("/")
def all_finished():
    secs = Section.query.filter_by(finished=True).order_by(Section.date.desc()).all()
    return jsonify(score_schema.dump(secs))
