"""Flask routes for the simplified DMP-Intellisense backend."""
from __future__ import annotations

from flask import Blueprint, jsonify, request

from .agents import agent_service
from .graph import graph_service

bp = Blueprint("api", __name__)


@bp.route("/graph/query", methods=["POST"])
def graph_query():
    payload = request.get_json(force=True)
    node_id = payload.get("node")
    if not node_id:
        return jsonify({"error": "'node' is required"}), 400
    result = graph_service.query_node(node_id)
    return jsonify(result)


@bp.route("/chat", methods=["POST"])
def chat():
    payload = request.get_json(force=True)
    message = payload.get("message")
    if not message:
        return jsonify({"error": "'message' is required"}), 400
    response = agent_service.process_message(message)
    return jsonify({"response": response})


@bp.route("/document/analyze", methods=["POST"])
def document_analyze():
    payload = request.get_json(force=True)
    content = payload.get("content", "")
    # Placeholder analysis; in the real system this would invoke the LLM
    summary = content[:100]
    return jsonify({"summary": summary, "length": len(content)})


def register_routes(app):
    app.register_blueprint(bp)
