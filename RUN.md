# RoadGuard - Local Development

## Project Location
D:\RoadGuard

## Start Backend

PowerShell:
```powershell
cd D:\RoadGuard\backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Backend URL:
http://127.0.0.1:8000

Health check:
```powershell
curl http://127.0.0.1:8000/api/health
```

## Start Frontend

Open a second PowerShell terminal:

```powershell
cd D:\RoadGuard\frontend
npm run dev
```

Frontend URL:
http://localhost:5173

## If Port 8000 Is Already In Use

Check:
```powershell
netstat -ano | findstr :8000
```

Find the PID and terminate it:
```powershell
taskkill /PID <PID> /F
```

Then restart the backend.

## Stop Development Servers

Use Ctrl+C in the respective terminal.

## Frontend Checks

```powershell
cd D:\RoadGuard\frontend
npx tsc --noEmit
npm run build
```

## Git Workflow

Check:
```powershell
git status
```

Review:
```powershell
git diff
```

Commit:
```powershell
git add .
git commit -m "<message>"
```

Push:
```powershell
git push origin main
```

## Important Environment Files

Backend:
D:\RoadGuard\backend\.env

Frontend environment configuration should remain in the appropriate frontend environment file.

NEVER commit .env files or API keys.

## Main Project Structure

```
D:\RoadGuard
├── backend
├── frontend
├── ml
├── RUN.md
└── ...
```
