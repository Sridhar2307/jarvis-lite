import asyncio
import json
import logging
from typing import Set
import websockets

logger = logging.getLogger("nexora.websocket")

# Active browser client connections
CONNECTED_CLIENTS: Set[websockets.WebSocketServerProtocol] = set()

async def broadcast_event(event_type: str, payload: dict):
    """Broadcast an event to all connected web browser sessions."""
    if not CONNECTED_CLIENTS:
        return
    message = json.dumps({"type": event_type, "payload": payload})
    coros = [client.send(message) for client in list(CONNECTED_CLIENTS)]
    await asyncio.gather(*coros, return_exceptions=True)

async def handle_client(websocket, path=None):
    """Handle incoming WebSocket connection from Jarvis Lite frontend HUD."""
    CONNECTED_CLIENTS.add(websocket)
    logger.info(f"Web client connected: {websocket.remote_address}")
    try:
        # Send initial welcome
        await websocket.send(json.dumps({
            "type": "NEXORA_READY",
            "message": "Connected to local Nexora Python bridge.",
            "status": "ONLINE"
        }))

        async for message in websocket:
            try:
                data = json.loads(message)
                msg_type = data.get("type")

                if msg_type == "PING":
                    await websocket.send(json.dumps({"type": "PONG"}))
                elif msg_type == "STATUS_REQUEST":
                    await websocket.send(json.dumps({
                        "type": "STATUS_RESPONSE",
                        "status": "ONLINE",
                        "activeClients": len(CONNECTED_CLIENTS)
                    }))
                else:
                    logger.info(f"Received client message: {msg_type}")
            except Exception as e:
                logger.error(f"Error handling message: {e}")

    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        CONNECTED_CLIENTS.discard(websocket)
        logger.info("Web client disconnected")

async def start_websocket_server(host: str = "127.0.0.1", port: int = 8765):
    """Start local websocket server on host:port."""
    try:
        server = await websockets.serve(handle_client, host, port)
        logger.info(f"⚡ Nexora Local WebSocket Server running on ws://{host}:{port}")
        return server
    except OSError as e:
        logger.warning(f"Could not bind WebSocket server on port {port} (already in use or unavailable): {e}")
        return None
