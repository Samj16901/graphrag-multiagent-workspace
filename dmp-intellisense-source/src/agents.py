"""Simplified multi-agent STORM implementation.

The real project uses multiple LLM-powered agents. Here we provide a minimal
structure that can be extended. For now, the agent simply echoes messages. The
ThreadPoolExecutor demonstrates how more expensive tasks could be executed
asynchronously without blocking the Flask server.
"""
from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor


class AgentService:
    def __init__(self, max_workers: int = 4) -> None:
        self._pool = ThreadPoolExecutor(max_workers=max_workers)

    def process_message(self, message: str) -> str:
        """Process a chat message and return a response."""
        # This placeholder implementation simply echoes the message.
        # In the real system this would call into LangChain/Ollama.
        return f"Processed: {message}"


agent_service = AgentService()
