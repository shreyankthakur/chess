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

### Frontend (Netlify)

1. Push this repository to GitHub.
2. Create a new site on Netlify.
3. Connect the same GitHub repository.
4. Set the deploy folder/root to the `chess-anime` folder.
5. Add this Netlify environment variable:
   - `VITE_BASE_API` = `https://<your-backend>.onrender.com/api`
6. Deploy the site.

Netlify will build with `npm install && npm run build` and publish the `dist` folder.

### Backend (Render)

1. Push this repository to GitHub.
2. Create a new Web Service on Render.
3. Connect your GitHub repository and choose the `backend` folder.
4. Render will detect `render.yaml` and use:
   - Build command: `pip install -r requirements.txt`
   - Start command: `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`
5. Set env vars in Render if needed (the `render.yaml` already includes `DJANGO_DEBUG`, `DJANGO_ALLOWED_HOSTS`, and generates `DJANGO_SECRET_KEY`).
6. Deploy the backend.

Once Render is deployed, copy the backend URL and set `VITE_BASE_API` in Netlify settings.

### Live link

- Netlify will give you a live frontend URL you can share.
- Render will give you a backend API URL for the frontend.
- After you deploy both, Netlify is the shareable website link and Render is the API endpoint.

### Railway deployment

You can deploy both backend and frontend on Railway as an isolated monorepo.

1. Create a new Railway project.
2. Add a service for the backend:
   - Root directory: `/backend`
   - Build command: use `Dockerfile` (Railway detects the Dockerfile in `backend/`)
   - Start command: `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`
   - Environment variables:
     - `DJANGO_SECRET_KEY` = <generate a strong secret>
     - `DJANGO_DEBUG` = `0`
     - `DJANGO_ALLOWED_HOSTS` = `*` or your Railway domain
     - `DATABASE_URL` = <Railway Postgres database URL>

3. Add a service for the frontend:
   - Root directory: `/chess-anime`
   - Build command: `npm install && npm run build`
   - Start command: `npm run preview -- --host 0.0.0.0 --port $PORT`
   - Environment variables:
     - `VITE_BASE_API` = `https://<your-backend>.railway.app/api`

4. Use `/backend/railway.json` and `/chess-anime/railway.json` for service-specific config.
5. Use `/railway.json` to define both services at the repo root.

### Backend database on Railway

If you add a Railway PostgreSQL service, set `DATABASE_URL` in the backend service environment variables with the value Railway provides. Railway will automatically provision and connect the database.

### Notes

- Railway will auto-detect `railway.json` / `railway.toml` in each service root.
- The backend uses Django with a Dockerfile and now supports `DATABASE_URL` via `dj-database-url`.
- The frontend uses Vite and `VITE_BASE_API` to connect to the Railway backend.

### GitHub Actions (automatic deploys)

I added two GitHub Actions workflows that can deploy automatically when you push to `main`. To use them you must add the following repository secrets in GitHub:

- For Render (backend):
	- `RENDER_API_KEY` — your Render API key
	- `RENDER_SERVICE_ID` — the Render service id for the backend

- For Vercel (frontend):
	- `VERCEL_TOKEN` — your Vercel token
	- `VERCEL_ORG_ID` — your Vercel org id
	- `VERCEL_PROJECT_ID` — your Vercel project id

Once those secrets are set, pushing to `main` will trigger the workflows:

- `.github/workflows/deploy-backend-render.yml` — triggers a Render deploy when `backend/` changes.
- `.github/workflows/deploy-frontend-vercel.yml` — deploys the `chess-anime` folder to Vercel on push.

If you want, I can walk you through finding the `RENDER_SERVICE_ID`, creating the API key, or setting the Vercel variables.

### Frontend API configuration

In `chess-anime/main.js`, update the backend URL after Render deploys:

```js
// Prefer setting `VITE_BASE_API` in Vercel environment variables to avoid committing URLs.
// Example: set `VITE_BASE_API` to `https://<your-backend>.onrender.com/api` in Vercel.
const BASE_API = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BASE_API)
	? import.meta.env.VITE_BASE_API
	: 'http://localhost:8000/api';
```

Then redeploy the frontend.

---

## Quick copyable commands

Generate a Render API key and list services (to find `service id`):
```bash
# replace <your-render-api-key> temporarily when using curl
curl -H "Authorization: Bearer <RENDER_API_KEY>" https://api.render.com/v1/services
```

Add GitHub secrets via `gh` (recommended):
```bash
gh auth login
gh secret set RENDER_API_KEY --body "<your-render-api-key>"
gh secret set RENDER_SERVICE_ID --body "<your-render-service-id>"
gh secret set VERCEL_TOKEN --body "<your-vercel-token>"
gh secret set VERCEL_ORG_ID --body "<your-vercel-org-id>"
gh secret set VERCEL_PROJECT_ID --body "<your-vercel-project-id>"
```

Trigger the workflows by pushing an empty commit:
```bash
git commit --allow-empty -m "Trigger CI after adding secrets"
git push
```

After pushing, check GitHub Actions: `Settings` -> `Actions` -> `Workflow runs`.

If you'd like, say "secrets added" and I will verify the workflow runs and follow deployment logs.
