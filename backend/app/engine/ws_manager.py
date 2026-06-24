import json
from datetime import datetime, timezone

from fastapi import WebSocket


class WSManager:
    def __init__(self):
        self.connections: dict[int, list[WebSocket]] = {}

    def connect(self, execution_id: int, ws: WebSocket):
        ws.accept()
        self.connections.setdefault(execution_id, []).append(ws)

    def disconnect(self, execution_id: int, ws: WebSocket):
        conns = self.connections.get(execution_id)
        if conns and ws in conns:
            conns.remove(ws)
            if not conns:
                del self.connections[execution_id]

    async def broadcast(
        self, execution_id: int, node_id: int, node_label: str, level: str, message: str
    ):
        log = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "node_id": node_id,
            "node_label": node_label,
            "level": level,
            "message": message,
        }
        conns = self.connections.get(execution_id)
        if conns:
            data = json.dumps(log)
            for ws in conns:
                await ws.send_text(data)


ws_manager = WSManager()
