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
- **Structured UI cards** — flight results and booking confirmations render as rich components, not raw text
- **RAG-powered FAQ** — baggage, refunds, check-in, loyalty policies from a seeded knowledge base
- **Auth-gated** — email/password sign-in (Google optional in Firebase Console)
- **Server-authoritative booking** — seat inventory and payments logic run in Cloud Functions with Firestore transactions
- **Mock GDS inventory** — 672 seeded flights across popular routes (swap for Amadeus/Duffel later)
- **$0 local dev** — full stack runs on Firebase Emulators without Blaze billing

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
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, shadcn-style UI |
| Backend | Firebase Cloud Functions (Express), Node 20 |
| Database | Cloud Firestore |
| Auth | Firebase Authentication |
| AI | Google Gemini (`@google/genai`) with function calling |
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
| `npm run build` | Build web + functions |
| `npm run build:functions` | Compile TypeScript functions |
| `npm run deploy` | Deploy to Firebase (requires Blaze plan) |

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
- [ ] Real GDS integration (Amadeus, Duffel)
- [ ] Stripe payments
- [ ] Google Sign-In on production

See [docs/GITHUB.md](docs/GITHUB.md) for publishing instructions.

---

## License

MIT — see [LICENSE](LICENSE).

---

## Author

Capstone project — Firebase + Gemini AI flight assistant for SkyWings Airlines (fictional brand).
