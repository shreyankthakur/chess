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

### Backend (Render)

1. Push this repository to GitHub.
2. Create a new Web Service on Render.
3. Connect your GitHub repository.
4. Use this build command:

```bash
pip install -r requirements.txt
```

5. Use this start command:

```bash
gunicorn config.wsgi:application --bind 0.0.0.0:$PORT
```

6. Set env vars:
- `DJANGO_DEBUG=0`
- `DJANGO_SECRET_KEY` (generate a strong secret)
- `DJANGO_ALLOWED_HOSTS=*`

7. Render will deploy the backend and provide a public URL.

### Frontend (Vercel)

1. Create a new project on Vercel.
2. Connect the same GitHub repository.
3. Choose the `chess-anime` folder as the project root.
4. Use the default static site settings.
5. Deploy.

### Frontend API configuration

In `chess-anime/main.js`, update the backend URL after Render deploys:

```js
const BASE_API = 'https://<your-backend>.onrender.com/api';
```

Then redeploy the frontend.
