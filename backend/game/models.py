from django.db import models

class ChessGame(models.Model):
	game_id = models.CharField(max_length=64, unique=True)
	white_player = models.CharField(max_length=120, blank=True)
	black_player = models.CharField(max_length=120, blank=True)
	white_claimed = models.BooleanField(default=False)
	black_claimed = models.BooleanField(default=False)
	board_fen = models.CharField(max_length=256)
	turn = models.CharField(max_length=1)
	status = models.CharField(max_length=120, default='waiting')
	last_move = models.CharField(max_length=32, blank=True)
	created_at = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return f"Game {self.game_id} ({self.status})"