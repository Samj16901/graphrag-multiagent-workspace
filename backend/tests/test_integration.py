import os
import sys
import pytest
from flask import Flask

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'dmp-intellisense-source')))
from src.routes import register_routes
from src.graph import graph_service

@pytest.fixture()
def client():
    app = Flask(__name__)
    register_routes(app)
    with app.test_client() as client:
        yield client


def test_graph_all(client):
    graph_service.add_node('a')
    graph_service.add_node('b')
    graph_service.add_edge('a', 'b')
    resp = client.get('/graph/all')
    assert resp.status_code == 200
    data = resp.get_json()
    assert 'nodes' in data and 'links' in data
    assert any(n['id'] == 'a' for n in data['nodes'])
