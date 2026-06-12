# Chess Anime Online

A Three.js chess game with a Django backend for online play.

## Structure

- `chess-anime/` - frontend app using Three.js and chess.js
- `backend/` - Django REST backend for game sessions and move validation

## Local setup

### Backend

```powershell
cd c:\Users\Dell\Downloads\chess-anime-project\backend
c:/Users/Dell/Downloads/chess-anime-project/.venv/Scripts/python.exe -m pip install -r ..\requirements.txt
c:/Users/Dell/Downloads/chess-anime-project/.venv/Scripts/python.exe manage.py migrate
c:/Users/Dell/Downloads/chess-anime-project/.venv/Scripts/python.exe manage.py runserver
```

### Frontend

```powershell
cd c:\Users\Dell\Downloads\chess-anime-project\chess-anime
npm install
npm run dev
```

## Online play

- Create a game in the lobby using the frontend.
- Share the generated game ID with a friend.
- The backend validates moves and returns authoritative game state.

## Deployment

Recommended deployment target:
- Heroku, Railway, Render, or Vercel for frontend + Railway/Heroku for backend.

If you want, I can also add a `Procfile` and deployment config for one provider.
