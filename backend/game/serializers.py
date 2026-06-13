from rest_framework import serializers

class ChessGameSerializer(serializers.Serializer):
    game_id = serializers.CharField(read_only=True)
    white_player = serializers.CharField(required=False, allow_blank=True)
    black_player = serializers.CharField(required=False, allow_blank=True)
    white_claimed = serializers.BooleanField(read_only=True)
    black_claimed = serializers.BooleanField(read_only=True)
    board_fen = serializers.CharField()
    turn = serializers.CharField()
    status = serializers.CharField()
    last_move = serializers.CharField(required=False, allow_blank=True)
    created_at = serializers.DateTimeField(read_only=True)

class ChessMoveSerializer(serializers.Serializer):
    from_square = serializers.CharField()
    to_square = serializers.CharField()
    promotion = serializers.CharField(required=False, allow_blank=True)

class ClaimColorSerializer(serializers.Serializer):
    color = serializers.ChoiceField(choices=['white', 'black'])
    player_name = serializers.CharField(required=False, allow_blank=True)