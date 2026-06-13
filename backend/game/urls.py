from django.urls import path
from .views import CreateGameView, GameDetailView, MakeMoveView, ResetGameView, ClaimColorView

urlpatterns = [
    path('games/', CreateGameView.as_view(), name='create-game'),
    path('games/<str:game_id>/', GameDetailView.as_view(), name='game-detail'),
    path('games/<str:game_id>/move/', MakeMoveView.as_view(), name='make-move'),
    path('games/<str:game_id>/reset/', ResetGameView.as_view(), name='reset-game'),
    path('games/<str:game_id>/claim/', ClaimColorView.as_view(), name='claim-color'),
]