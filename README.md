# ChronosAI_v1

Smart scheduling + conversational meeting assistant.

## Project overview

- `backend/`: Node.js API server (Auth, Calendar, Dialogue, Meetings)
- `frontend-user/`: User-facing app (calendar, chat, dashboard)
- `frontend-org/`: Admin dashboard (organization controls)
- `ChronosAI/`: single-app frontend (maybe demo/quick start)
- `ai-service/`: Python NLP service (entity extraction, intent parsing)
- `temp_test_flow.js`: quick experiments

## Features

- User authentication (token, JWT)
- Calendar integration
- Conversational scheduling / dialogue state tracker
- Meeting creation + invite handling
- Org admin panel
- Entity extraction via AI/NLP microservice

## Getting started

### 1. Prerequisites

- Node 18+ / npm
- Python 3.10+ (for `ai-service`)
- PostgreSQL / Mongo (if DB required in project config)
- `nvm` / `pyenv` optional but recommended

### 2. Install root dependencies (optional if mono manages separate packages)

```bash
cd ChronosAI_v1
npm install
```

### 3. Backend setup

```bash
cd backend
npm install
# env file:
# PORT=4000
# DB_URL=yourdb
# JWT_SECRET=supersecret
npm start
```

### 4. Frontend-user setup

```bash
cd frontend-user
npm install
npm run dev
```

### 5. Frontend-org setup

```bash
cd frontend-org
npm install
npm run dev
```

### 6. AI service setup

```bash
cd ai-service
python -m venv .venv
.venv/Scripts/activate   # Windows
pip install -r requirements.txt
python main.py
```

## API routes (backend)

- `POST /api/auth/login`, `POST /api/auth/register`
- `GET /api/calendar/events`, `POST /api/calendar/meetings`
- `POST /api/dialogue/query`
- `GET /api/meetings`, `PUT /api/meetings/:id`, `DELETE /api/meetings/:id`
- `GET /api/users` + admin endpoints

## AI service endpoints

- `POST /nlp/entity-extractor` (body text, returns extracted entities)
- Test from `ai-service/tests/test_entity_extractor.py`

## Developer notes

- `backend/dialogueManager/stateTracker.js` manages conversation state.
- `backend/integrations/calendarService.js` abstracts external calendar provider.
- `frontend-user/src/components/ChatInterface/ChatInterface.jsx` includes chat UI.
- Use global caching or local storage for auth token.

## Running tests

### Backend tests
```bash
cd backend
npm test
```

### AI service tests
```bash
cd ai-service
pytest
```

### Frontend (Vite)
```bash
cd frontend-user
npm test
```
And same for `frontend-org`.

## Deployment

- Build frontend with `npm run build`
- Backend runs as `Node server.js` in production
- Add reverse proxy (Nginx) + SSL
- Connect auth and DB env vars

## Contributing

- Fork, branch from `main`, PR with linked issue
- Code style: ESLint + Prettier (check each package)
- Use feature branches `feature/<topic>`

## License

- Add your license, e.g., `MIT`
- `LICENSE` file at repo root
