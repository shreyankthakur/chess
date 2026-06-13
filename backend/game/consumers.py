import json

from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.db import transaction

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

        self.session_id = self.channel_name  # stable per websocket connection
        self.seat = 'spectator'

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        # Initial state
        state = await self.get_game_state()
        await self.send(text_data=json.dumps({'type': 'state', 'data': state}))

    async def disconnect(self, close_code):
        # If the websocket was bound to a seat, unbind it.
        await self.clear_seat_binding()
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            return

        msg_type = data.get('type')
        if msg_type == 'ping':
            await self.send(text_data=json.dumps({'type': 'pong'}))
            return

        if msg_type == 'join':
            # Client requests seat assignment for their websocket.
            # payload: {type:"join", color:"white"|"black"|"spectator"}
            color = data.get('color', 'spectator')
            if color not in {'white', 'black', 'spectator'}:
                color = 'spectator'

            await self.bind_seat(color)
            await self.send(text_data=json.dumps({'type': 'joined', 'color': color}))

            state = await self.get_game_state()
            await self.send(text_data=json.dumps({'type': 'state', 'data': state}))
            return

    async def game_update(self, event):
        await self.send(text_data=json.dumps({'type': 'state', 'data': event['data']}))

    @database_sync_to_async
    def game_exists(self):
        return ChessGame.objects.filter(game_id=self.game_id).exists()

    @database_sync_to_async
    def get_game_state(self):
        game = ChessGame.objects.get(game_id=self.game_id)
        return ChessGameSerializer(game).data

    @database_sync_to_async
    def bind_seat_sync(self, color: str):
        with transaction.atomic():
            game = ChessGame.objects.select_for_update().get(game_id=self.game_id)

            # Unbind this session from both seats first
            if game.white_session_id == self.session_id:
                game.white_session_id = ''
            if game.black_session_id == self.session_id:
                game.black_session_id = ''

            if color == 'white':
                # Only allow binding if the seat is free or already bound to this session.
                if game.white_session_id and game.white_session_id != self.session_id:
                    return False
                game.white_session_id = self.session_id
                self.seat = 'white'

            elif color == 'black':
                if game.black_session_id and game.black_session_id != self.session_id:
                    return False
                game.black_session_id = self.session_id
                self.seat = 'black'

            else:
                self.seat = 'spectator'

            game.save(update_fields=['white_session_id', 'black_session_id'])
            return True


    async def bind_seat(self, color: str):
        await self.bind_seat_sync(color)

    @database_sync_to_async
    def clear_seat_binding_sync(self):
        game = ChessGame.objects.get(game_id=self.game_id)
        changed = False
        if game.white_session_id == self.session_id:
            game.white_session_id = ''
            changed = True
        if game.black_session_id == self.session_id:
            game.black_session_id = ''
            changed = True
        if changed:
            game.save(update_fields=['white_session_id', 'black_session_id'])

    async def clear_seat_binding(self):
        try:
            await self.clear_seat_binding_sync()
        except ChessGame.DoesNotExist:
            pass

