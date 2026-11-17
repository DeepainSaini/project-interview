# RehearseIt

A project-specific AI mock interview and revision workspace for developers who want to explain their own projects more clearly.

**Live application:** [rehearseit.duckdns.org](https://rehearseit.duckdns.org)

## The problem

Building a project and explaining it in an interview are different skills. Generic interview questions often miss the features and decisions a developer actually wants to discuss. RehearseIt turns a submitted project description into an editable summary, focused interview questions, and a saved practice history.

## Features

- Signup, login, and logout with password hashing and server-side sessions stored in MySQL.
- A dashboard for managing multiple projects.
- Project notes and README text input, with saved source history.
- AI-generated project summaries that users can edit and save.
- Five project-specific questions per interview.
- Saved answers and AI feedback on strengths, gaps, and ways to improve an explanation.
- At most one optional follow-up per main question, which users can answer or skip.
- Reattempts during an active interview, preserving previous answers and feedback.
- Resumable interviews and expandable reviews of completed interviews.

## How it works

1. Create an account and add a project.
2. Save notes or README content describing its features and technical decisions.
3. Generate a summary, review it, and save any corrections.
4. Start an interview and generate five questions.
5. Answer each question and review feedback. Answer or skip an offered follow-up.
6. Reattempt questions as needed, then finish and review the saved history.

An interview stores both a reference to its summary version and a copy of that summary's text. Later project or summary changes do not rewrite the context of an existing interview.

**Grounding boundary:** AI output is based on submitted descriptions and answers. Notes, README content, and interview answers do not prove actual code behavior. The current application does not upload or inspect project source code. AI feedback is practice guidance, not an objective hiring assessment.

## Technology

| Area | Technology |
| --- | --- |
| Frontend | HTML, CSS, JavaScript, Axios |
| Backend | Node.js, Express, CommonJS |
| Database | MySQL, Sequelize, Sequelize CLI migrations |
| Authentication | bcrypt, express-session, express-mysql-session |
| AI integration | OpenRouter chat completions API through backend requests |
| Deployment | AWS EC2, Amazon RDS for MySQL, PM2, Nginx |
| Domain and HTTPS | DuckDNS, Let's Encrypt, Certbot |

HTML files are served from `views` using Express. CSS and browser JavaScript are served from `public`. No frontend framework or HTML templating engine is required.

## Run locally

### Prerequisites

- Node.js 24 and npm. The deployed application uses Node.js 24.
- A running MySQL server, preferably MySQL 8.4 to match the deployed database.
- An OpenRouter API key and an accessible text-generation model.
- Git.

### 1. Download and install

```bash
git clone https://github.com/DeepainSaini/project-interview.git
cd project-interview
npm ci
```

### 2. Create a database

Using a MySQL client, create the database:

```sql
CREATE DATABASE projectinterview CHARACTER SET utf8mb4;
```

Use a MySQL account that can access this database and create the tables required by migrations.

### 3. Configure environment variables

Create a `.env` file in the project root:

```dotenv
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_NAME=projectinterview
DB_USER=your_mysql_username
DB_PASSWORD="your_mysql_password"
SESSION_SECRET=replace_with_a_long_random_secret
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=your_openrouter_model_id
```

Replace every placeholder with your own value. To generate a session secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Keep each environment variable defined only once. Do not commit `.env`, API keys, session secrets, or database passwords. Model availability, rate limits, and pricing depend on the selected OpenRouter model and provider.

Use `NODE_ENV=development` for local HTTP access. Production session cookies require HTTPS and the configured trusted reverse proxy.

### 4. Apply migrations

```bash
npx sequelize-cli db:migrate
npx sequelize-cli db:migrate:status
```

All migrations should show `up`. They create the application tables and the session-store table. The session table is used by `express-mysql-session`; it does not require a Sequelize model.

### 5. Start the application

```bash
npm start
```

For development with automatic restarts:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The root route redirects to `/api/auth`. Create a new account to use the application; no seeded account is required. Port 3000 is currently configured in `app.js`.

## Project structure

```text
app.js          Express setup and server startup
config/         Database and session configuration
controllers/    Request handling and application logic
routes/         Page and API routes
middlewares/    Authentication checks
models/         Sequelize models and associations
migrations/     Versioned database schema changes
util/           AI client and interview-generation helpers
views/          HTML pages
public/css/     Page styles
public/js/      Browser logic and Axios requests
```

## Data and authentication

The main models are `User`, `Project`, `ProjectSourceVersion`, `SummaryVersion`, `Interview`, `InterviewQuestion`, `AnswerAttempt`, and `InterviewFollowUp`.

- Projects belong to users; project operations check ownership on the backend.
- Source versions preserve saved notes and README inputs.
- AI summary generation creates a new summary row; editing updates an existing summary.
- Interviews retain their original summary context.
- Answer attempts preserve revision history. A follow-up references the specific attempt it was generated from.
- The browser holds a session ID cookie; session data is stored in MySQL.
- Cookies use `HttpOnly`, `SameSite=Lax`, and `Secure` in production.

## Deployment design

```text
Browser --HTTPS--> Nginx --> Express on EC2 --> RDS MySQL
                              |
                              +--> OpenRouter API

PM2 manages the Express process.
```

Nginx receives public web requests and forwards them to Express on port 3000. PM2 manages the Node.js process and is configured to restore it after a server restart. RDS stores application and session data. Certbot configures and renews the HTTPS certificate. A scheduled DuckDNS update keeps the domain pointed at EC2's public IPv4 address.

The deployed environment uses `NODE_ENV=production`. Express trusts the local Nginx proxy through `app.set('trust proxy', 'loopback')`, allowing secure session cookies when HTTPS terminates at Nginx. The database connection is configured separately through the server's private `.env` file.

## Limitations and future improvements

- AI requests currently run within Express request handlers. Provider delays, rate limits, or outages can interrupt generation. A future BullMQ/Redis worker could move this work to background jobs with controlled retries.
- Growing source histories increase prompt size and generation cost. Future work can introduce explicit context limits and more selective history retrieval.
- The current deployment uses one application instance and a Single-AZ database. It does not provide application-level failover; scaling would require additional instances and a reviewed shared-session and networking setup.
- AI output can contain inaccuracies. Users should review summaries and feedback against their own implementation.
- Selected code uploads, configurable interview lengths, and structured evaluation rubrics are future work.

## Troubleshooting

| Issue | Check |
| --- | --- |
| Database connection refused | Confirm MySQL is running and `DB_HOST`/`DB_PORT` point to the intended server. |
| Database access denied | Check the database username, password, permissions, and duplicate `.env` entries. |
| Missing tables or session-store errors | Apply migrations against the same database used by the app. |
| Login does not persist locally | Use development mode for local HTTP; production secure cookies require HTTPS. |
| AI generation fails | Check the API key, model ID, provider availability, and rate limits. Keep saved answers and retry feedback where offered. |
| `Cannot GET /signup` | Open `/api/auth`, which serves the combined login/signup page. |

## Demo video

The demo video link will be added here before submission.
