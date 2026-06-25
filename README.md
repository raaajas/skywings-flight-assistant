# SkyWings Flight Assistant

A production-style **AI flight assistant** for an airline website. Users sign in, chat in natural language to search flights, book tickets, manage trips, and ask policy questions — powered by **Gemini**, **Firebase**, and **React**.

Built as a capstone project demonstrating Firebase Auth, Firestore, Cloud Functions, emulator-based local development, and tool-calling AI agents.

![Stack](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Stack](https://img.shields.io/badge/Firebase-Spark/Emulators-FFCA28?logo=firebase&logoColor=black)
![Stack](https://img.shields.io/badge/Gemini-2.5_Flash-4285F4?logo=google&logoColor=white)
![Stack](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)

---

## Features

- **Natural language chat** — search flights, book seats, cancel trips, check PNR status
- **Structured UI cards** — flight results and booking confirmations render as rich boarding pass components, not raw text
- **RAG-powered FAQ** — baggage, refunds, check-in, loyalty policies from a seeded knowledge base
- **Fast RAG Cache Layer** — global in-memory caching of seeded docs to reduce Firestore read operations to **zero** and provide sub-millisecond retrieval response
- **Open-Source LLMs Support** — flexible integration for OpenAI-compatible models (Ollama, Groq, Llama, Mistral, DeepSeek) with full function tool-calling capability
- **Amadeus Live GDS API** — live flight search results mapped dynamically into Firestore from Amadeus API, with an automatic GDS fallback to seeded mock inventory if keys are absent
- **Auth-gated** — email/password sign-in (Google optional in Firebase Console)
- **Server-authoritative booking** — seat inventory and payments logic run in Cloud Functions with Firestore transactions
- **$0 local dev** — full stack runs on Firebase Emulators without Blaze billing
- **Luxury Midnight & Indigo Glow UI** — full dark-glassmorphic aesthetic with custom typography (Outfit & Plus Jakarta Sans), input glow effects, micro-animations, bold key metrics, passenger tag chips, and custom HTML markdown rendering
- **Self-Healing SSH Tunnel Manager** — local Express API backend dynamically publishes its current tunnel URL to Firestore, enabling the live hosted frontend to communicate with it automatically without Blaze plan costs or manual updates
- **Smooth ResizeObserver Chat Scroll** — resolves scrolling issues caused by asynchronously rendering flight cards and images by listening to scroll container layout shifts and auto-scrolling to the exact bottom

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  React Web App (Vite + TypeScript + Tailwind)                   │
│  • ChatAssistant  • FlightResultCard  • BookingsPage            │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS + Firebase ID token
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Cloud Functions API (`/api`)                                   │
│  • POST /agent/chat      — Gemini agent + tool loop             │
│  • POST /agent/sessions  — chat session management                │
│  • GET  /bookings        — user booking history                 │
│  • POST /seed            — dev seed (secret-protected)          │
└───────────────────────────┬─────────────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
    ┌──────────┐     ┌────────────┐    ┌─────────────┐
    │ Gemini   │     │ Firestore  │    │ Firebase    │
    │ API      │     │ flights,   │    │ Auth        │
    │          │     │ bookings,  │    │             │
    │          │     │ knowledge  │    │             │
    └──────────┘     └────────────┘    └─────────────┘
```

### Agent tools

| Tool | Description |
|------|-------------|
| `searchFlights` | Query mock inventory by route, date, passengers, cabin |
| `getFlightDetails` | Single flight lookup |
| `createBooking` | Atomic booking + seat decrement |
| `getUserBookings` | List user trips |
| `cancelBooking` | Cancel by PNR or booking ID |
| `getBookingStatus` | Lookup by PNR |
| `searchKnowledgeBase` | RAG over airline FAQ/policy docs |

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, Premium Midnight Dark-Glass Theme |
| Backend | Firebase Cloud Functions (Express), Node 20 |
| Database | Cloud Firestore |
| Auth | Firebase Authentication |
| AI & LLMs | Google Gemini (`@google/genai`) or OpenAI-compatible Models (Groq, Llama, DeepSeek) |
| Live GDS | Amadeus Self-Service API (with mock fallback) |
| Embeddings | `gemini-embedding-001` for FAQ retrieval |
| Local dev | Firebase Emulator Suite (Auth, Firestore, Functions, Hosting) |

---

## Prerequisites

- **Node.js** 20+ (22/24 works; Functions target Node 20)
- **Java 21+** — required for Firestore emulator  
  `winget install Microsoft.OpenJDK.21`
- **Firebase CLI** — included via project `npm install`
- **Gemini API key** — from [Google AI Studio](https://aistudio.google.com/apikey)  
  New keys use the `AQ.` format (auth keys); legacy `AIzaSy...` keys also work.

---

## Quick start (local emulators)

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/skywings-flight-assistant.git
cd skywings-flight-assistant
npm install
```

### 2. Configure secrets

Create `functions/.secret.local`:

```env
GEMINI_API_KEY=your-gemini-key-here
SEED_SECRET=dev-seed-secret

# (Optional) Open-Source OpenAI-compatible Provider Config:
MODEL_PROVIDER=openai # Set to 'openai' to use OpenAI-compatible provider, default is 'gemini'
OPENAI_API_KEY=your-openai-or-groq-key-here
OPENAI_API_BASE=https://api.openai.com/v1 # Or custom base like Groq/Ollama/OpenRouter
OPENAI_MODEL=gpt-4o-mini # Or your custom model name (e.g., llama3-70b-8192)

# (Optional) Live GDS Config:
AMADEUS_CLIENT_ID=your-amadeus-client-id
AMADEUS_CLIENT_SECRET=your-amadeus-client-secret
```

Create `apps/web/.env` (copy from `.env.example` or use demo values for emulators):

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_API_BASE_URL=/api
VITE_USE_FIREBASE_EMULATORS=true
```

### 3. Build and start emulators

```bash
npm run build:functions
npm run emulators
```

Wait for: **All emulators ready!**

- Emulator UI: http://127.0.0.1:4000

### 4. Seed database (new terminal)

```bash
npm run seed:local
```

Seeds **672 flights** and **10 FAQ documents** with embeddings.

### 5. Start web app (new terminal)

```bash
npm run dev:web
```

Open http://localhost:5173 (or the port Vite prints).

### 6. Try it

1. **Sign up** with email/password  
2. Ask: *"What is the checked baggage allowance?"*  
3. Ask: *"Find flights from JFK to LHR next week for 2 passengers"*  
4. Ask: *"Book flight flight_1 for John Doe"*  
5. Check **Bookings** in the nav bar  

---

## NPM scripts

| Script | Description |
|--------|-------------|
| `npm run dev:web` | Start React dev server |
| `npm run emulators` | Start Firebase emulators (Java required) |
| `npm run emulators:stop` | Free emulator ports on Windows |
| `npm run seed:local` | Seed flights + knowledge base |
| `npm run tunnel` | Start the self-healing SSH tunnel to sync local backend port 8888 with Firestore |
| `npm run build` | Build web + functions |
| `npm run build:functions` | Compile TypeScript functions |
| `npm run deploy` | Deploy to Firebase (requires Blaze plan / Firebase Hosting) |

---

## Live Deploy & Self-Healing Local Backend Tunnel

Because standard Firebase Cloud Functions require a paid **Blaze** plan, this project uses a hybrid architecture that keeps the API running locally (free) while hosting the React frontend on the public internet (**Firebase Hosting**).

To make this seamless and robust, we implemented a **Self-Healing SSH Tunnel Manager**:

### How It Works

```
┌─────────────────────────────────┐
│ React Frontend (Firebase Hosted) │
└────────────────┬────────────────┘
                 │
                 │ 1. Resolves dynamic base URL from Firestore (/config/api)
                 ▼
┌─────────────────────────────────┐
│ Firestore DB                    │
└────────────────▲────────────────┘
                 │
                 │ 2. Writes / updates active tunnel URL
                 ▼
┌─────────────────────────────────┐
│ Local Tunnel Manager            │
│ (ssh -R nokey@localhost.run)    │
└────────────────▲────────────────┘
                 │
                 │ 3. Forwards port 8888
                 ▼
┌─────────────────────────────────┐
│ Local Express API Server        │
└─────────────────────────────────┘
```

1. **Dynamic URL Resolution**: The frontend app does not use a hardcoded API URL. Instead, it reads the document at `/config/api` in Firestore on application startup, caches it, and uses it as the base URL for all API requests.
2. **Self-Healing SSH Tunnel**: Running `npm run tunnel` starts an SSH reverse tunnel to `localhost.run`, exposing local port `8888` (where the local backend server runs) to a public `.lhr.life` address.
3. **Automatic Synchronization**: The tunnel manager parses the generated URL from SSH stdout and saves it directly to Firestore at `/config/api`. If the SSH connection drops, the script automatically reconnects, obtains a new URL, and updates Firestore in real-time.
4. **CORS Bypass**: To bypass `localhost.run`'s warning/reminder screen, the frontend app injects a `Bypass-Tunnel-Reminder: true` header into API requests. The backend is configured to support this custom header in its CORS configuration.

### How to Run the Live Setup

1. **Obtain Firebase Credentials**:
   Download a Firebase Admin Service Account Key JSON file from the Firebase Console (under Project Settings -> Service Accounts). Save it as `adc.json` in the root of the project (this path is already in `.gitignore`).

2. **Start the API Server**:
   Ensure your local API backend is running (either by starting emulators via `npm run emulators` or running the express function server locally).

3. **Start the Tunnel Manager**:
   In a separate terminal, run:
   ```bash
   npm run tunnel
   ```
   This will output:
   `[TunnelManager] Detected tunnel URL: https://[random-subdomain].lhr.life`
   `[TunnelManager] Updated Firestore API URL to: https://[random-subdomain].lhr.life`

4. **Visit the Live App**:
   Navigate to the hosted application URL. The React client will automatically retrieve the correct backend URL from Firestore, allowing the live app to interact with your local agent server and database!


---

## Project structure

```
flight-assistant/
├── apps/web/                 # React frontend
│   └── src/
│       ├── components/       # ChatAssistant, FlightResultCard, AuthGate
│       ├── pages/            # Login, Signup, Chat, Bookings
│       └── services/         # Firebase, agent API client
├── functions/                # Cloud Functions backend
│   └── src/
│       ├── agent/            # Gemini orchestrator, tools, prompts
│       ├── booking/          # Transactional booking service
│       ├── rag/              # Knowledge base + embeddings
│       └── seed/             # Mock flight + FAQ data
├── scripts/                  # Emulator helpers (Windows)
├── firestore.rules           # Security rules (auth-required)
├── firestore.indexes.json
└── firebase.json
```

---

## Firebase setup (cloud)

For capstone demos, **emulators alone are sufficient** and cost $0.

To use real Firebase Auth + Firestore in the cloud (still free tier):

1. Create project at [Firebase Console](https://console.firebase.google.com/)
2. Enable **Authentication** → Email/Password
3. Create **Firestore** database
4. Register **Web app** and copy config into `apps/web/.env`
5. Set `VITE_USE_FIREBASE_EMULATORS=false`

Deploying **Cloud Functions** requires the **Blaze** plan. Without billing, keep the API on emulators.

---

## Security

- Firestore rules: authenticated reads; **all writes server-only** via Functions
- Bookings scoped to `request.auth.uid`
- `GEMINI_API_KEY` and `SEED_SECRET` stored in Firebase Secrets (prod) or `.secret.local` (dev)
- Never commit `.env` or `.secret.local` — see `.gitignore`

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `java -version` not found | Install OpenJDK 21; use `npm run emulators` (auto-finds Java on Windows) |
| Port 9099 taken | `npm run emulators:stop` then restart |
| Gemini 503 high demand | Wait 30s and retry; app falls back across models |
| Gemini 404 model not found | Update `MODEL_CANDIDATES` in `functions/src/agent/geminiClient.ts` |
| `firebase` script blocked (PowerShell) | Use `npx firebase ...` or `firebase.cmd` |
| Chat works for FAQ but not flights | Check `GEMINI_API_KEY` in `functions/.secret.local` |

---

## Demo script (capstone presentation)

1. Show **Emulator UI** — Auth users, Firestore collections  
2. **Sign up** in the web app  
3. **FAQ**: baggage policy question (RAG)  
4. **Search**: JFK → LHR next week, 2 passengers  
5. **Book**: choose a flight, provide passenger name  
6. **Bookings page**: show PNR confirmation  
7. **Cancel**: *"Cancel my booking [PNR]"* in chat  

---

## Roadmap (post-capstone)

- [ ] Deploy to Firebase Hosting + Functions (Blaze)
- [ ] App Check + reCAPTCHA
- [x] Real GDS integration (Amadeus, Duffel)
- [ ] Stripe payments
- [ ] Google Sign-In on production

See [docs/GITHUB.md](docs/GITHUB.md) for publishing instructions.

---

## License

MIT — see [LICENSE](LICENSE).

---

## Author

Capstone project — Firebase + Gemini AI flight assistant for SkyWings Airlines (fictional brand).
