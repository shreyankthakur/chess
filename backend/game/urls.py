from django.urls import path
from .views import CreateGameView, GameDetailView, MakeMoveView, ResetGameView

urlpatterns = [
    path('games/', CreateGameView.as_view(), name='create-game'),
    path('games/<str:game_id>/', GameDetailView.as_view(), name='game-detail'),
    path('games/<str:game_id>/move/', MakeMoveView.as_view(), name='make-move'),
    path('games/<str:game_id>/reset/', ResetGameView.as_view(), name='reset-game'),
]