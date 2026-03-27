# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Run the project (ChronosAI Dashboard)

1. Start backend:

```bash
cd /d D:\Chronos_v1\ChronosAI_v1\backend
npm install
npm start # or node server.js
```

2. Start AI service:

```bash
cd /d D:\Chronos_v1\ChronosAI_v1\ai-service
python -m pip install -r requirements.txt
python main.py
```

3. Start frontend:

```bash
cd /d D:\Chronos_v1\ChronosAI_v1\frontend-user
npm install --legacy-peer-deps
npm run dev:host
```

Open: `http://localhost:5173`

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
