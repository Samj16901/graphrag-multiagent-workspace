"""Minimal in-memory graph management using NetworkX.

This module provides a lightweight wrapper around a NetworkX graph. The
implementation focuses on local execution for workstations that can hold the
entire graph in memory. Persistence can be added later if needed.
"""
from __future__ import annotations

import networkx as nx
from threading import Lock


class GraphService:
    """A thread-safe wrapper around a NetworkX graph."""

    def __init__(self) -> None:
        self._graph = nx.Graph()
        self._lock = Lock()

    def add_node(self, node_id: str, **attrs) -> None:
        with self._lock:
            self._graph.add_node(node_id, **attrs)

    def add_edge(self, source: str, target: str, **attrs) -> None:
        with self._lock:
            self._graph.add_edge(source, target, **attrs)

    def query_node(self, node_id: str) -> dict:
        """Return information about a node and its neighbours."""
        with self._lock:
            if node_id not in self._graph:
                return {"exists": False}
            return {
                "exists": True,
                "data": dict(self._graph.nodes[node_id]),
                "edges": list(self._graph.edges(node_id)),
            }


# A single instance used by the routes
graph_service = GraphService()
