from rest_framework import status, views
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils.crypto import get_random_string
import chess

from .models import ChessGame
from .serializers import ChessGameSerializer, ChessMoveSerializer

class CreateGameView(views.APIView):
	def post(self, request):
		white_player = request.data.get('white_player', '')
		black_player = request.data.get('black_player', '')
		game_id = get_random_string(12)
		game = ChessGame.objects.create(
			game_id=game_id,
			white_player=white_player,
			black_player=black_player,
			board_fen=chess.Board().fen(),
			turn='w',
			status='waiting',
			last_move='',
		)
		serializer = ChessGameSerializer(game)
		return Response(serializer.data, status=status.HTTP_201_CREATED)

class GameDetailView(views.APIView):
	def get(self, request, game_id):
		game = get_object_or_404(ChessGame, game_id=game_id)
		serializer = ChessGameSerializer(game)
		return Response(serializer.data)

class MakeMoveView(views.APIView):
	def post(self, request, game_id):
		game = get_object_or_404(ChessGame, game_id=game_id)
		serializer = ChessMoveSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)

		board = chess.Board(game.board_fen)
		move_data = serializer.validated_data
		move_uci = f"{move_data['from_square']}{move_data['to_square']}"
		if move_data.get('promotion'):
			move_uci += move_data['promotion']

		try:
			move = board.parse_uci(move_uci)
		except ValueError:
			return Response({'detail': 'Invalid move format.'}, status=status.HTTP_400_BAD_REQUEST)

		if move not in board.legal_moves:
			return Response({'detail': 'Illegal move.'}, status=status.HTTP_400_BAD_REQUEST)

		# Prepare metadata about the move before applying it
		san = board.san(move)
		is_capture = board.is_capture(move)
		from_sq = chess.square_name(move.from_square)
		to_sq = chess.square_name(move.to_square)
		move_color = 'w' if board.turn else 'b'
		promotion_letter = ''
		if move.promotion:
			promotion_letter = chess.piece_symbol(move.promotion)

		# detect castling
		is_castle = False
		castle_side = ''
		piece_from_type = board.piece_type_at(move.from_square)
		if piece_from_type == chess.KING:
			file_from = chess.square_file(move.from_square)
			file_to = chess.square_file(move.to_square)
			if abs(file_to - file_from) == 2:
				is_castle = True
				castle_side = 'k' if file_to > file_from else 'q'

		board.push(move)
		game.board_fen = board.fen()
		game.turn = 'w' if board.turn else 'b'
		game.last_move = move.uci()
		if board.is_checkmate():
			game.status = 'checkmate'
		elif board.is_stalemate() or board.is_insufficient_material() or board.can_claim_draw():
			game.status = 'draw'
		else:
			game.status = 'active'
		game.save()

		resp = ChessGameSerializer(game).data
		resp.update({
			'uci': move.uci(),
			'san': san,
			'from_square': from_sq,
			'to_square': to_sq,
			'is_capture': is_capture,
			'is_castle': is_castle,
			'castle_side': castle_side,
			'promotion': promotion_letter,
			'color': move_color,
		})
		return Response(resp)

class ResetGameView(views.APIView):
	def post(self, request, game_id):
		game = get_object_or_404(ChessGame, game_id=game_id)
		board = chess.Board()
		game.board_fen = board.fen()
		game.turn = 'w'
		game.status = 'waiting'
		game.last_move = ''
		game.save()
		return Response(ChessGameSerializer(game).data)
