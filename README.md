# UpStack

UpStack is a developer trends dashboard. Explore popular tools and articles, search across developer platforms, compare selected dashboard items or GitHub repositories, and save favorites, comparisons, and notes.

## Features

- Live dashboard with technology trends, feed filters, and historical technology charts.
- Cross-platform search and research.
- Compare 2–5 dashboard items using their available details, or compare GitHub repositories using their READMEs.
- Ask **Pino** follow-up questions about a comparison or the dashboard.
- Save articles, favorite links, keep comparison reports, and write private notes.

## Requirements

- Ruby 3.1 or newer and Bundler
- Node.js 18 or newer
- A Supabase project for PostgreSQL
- A Gemini API key for AI comparisons and chat

## Setup

1. Create a Supabase project and copy its PostgreSQL connection string.
2. In `backend`, copy `.env.example` to `.env` and set `DATABASE_URL` and `GEMINI_API_KEY`.
3. Start the backend:

   ```powershell
   cd backend
   bundle install
   bundle exec ruby .\bin\rails db:migrate
   bundle exec ruby .\bin\rails server
   ```

4. In a second terminal, start the frontend:

   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

5. Open http://localhost:5173 and create an account.

During local development, Vite proxies API requests to Rails. In production, the frontend uses the deployed API URL. Keep your `.env` file and API keys private.

## Deploy on Render

1. Push the project to a GitHub repository and create a new **Blueprint** in Render using `render.yaml`.
2. Set `DATABASE_URL` to your Supabase PostgreSQL connection string.
3. Set `GEMINI_API_KEY` if you want AI comparisons and chat.
4. Deploy both services. Render builds the frontend; the API runs database migrations when it starts.

The frontend and API are separate Render services. The Blueprint connects them and configures the API to accept requests from the deployed frontend. Keep deployment secrets in Render's environment settings, not in source files.

## Data sources

The dashboard and research features use public developer sources, including GitHub, Hacker News, Stack Overflow, Dev.to, Lobsters, Hugging Face, Reddit, npm, and arXiv. These services may rate-limit requests or be temporarily unavailable.
