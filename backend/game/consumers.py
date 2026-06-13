import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

from .models import ChessGame
from .serializers import ChessGameSerializer


class GameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.game_id = self.scope['url_route']['kwargs']['game_id']
        self.group_name = f'game_{self.game_id}'

        exists = await self.game_exists()
        if not exists:
            await self.close()
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        state = await self.get_game_state()
        await self.send(text_data=json.dumps({'type': 'state', 'data': state}))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            return
        if data.get('type') == 'ping':
            await self.send(text_data=json.dumps({'type': 'pong'}))

    async def game_update(self, event):
        await self.send(text_data=json.dumps({'type': 'state', 'data': event['data']}))

    @database_sync_to_async
    def game_exists(self):
        return ChessGame.objects.filter(game_id=self.game_id).exists()

    @database_sync_to_async
    def get_game_state(self):
        game = ChessGame.objects.get(game_id=self.game_id)
        return ChessGameSerializer(game).data