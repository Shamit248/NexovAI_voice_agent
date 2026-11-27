# Nexov Health — Clinical Voice AI Booking Agent

**Candidate:** Shamit Bundela  
**Role:** Forward Deployed Engineer (FDE) / SDE Internship  
**Submission:** Round 1 Assignment — Voice AI Doctor Appointment Booking Agent  
**Frameworks:** Pipecat 1.17 • ElevenLabs STT/TTS • Google Gemini 2.5 Flash • Silero VAD • FastAPI • React + Tailwind CSS  

---

## Executive Summary

This repository contains the complete implementation of an autonomous voice clinical receptionist ("Nexa") and operations dispatch dashboard for Nexov Health. The agent conducts full-duplex voice telephone conversations with patients to check physician availability, book appointments, and cancel existing reservations.

In strict compliance with the assignment specification:
1. **Zero Login / OTP Overhead:** The caller is identified solely by the phone number they speak aloud.
2. **Mandatory Confirmation Readback:** The agent always repeats the phone number back to the caller to confirm before executing any database mutation (booking or cancellation).
3. **End-to-End Multitask Handling:** The agent handles inquiries, bookings, and cancellations within a single continuous voice call.
4. **Real-Time Operational Dispatch:** A bespoke operations dashboard provides live bidirectional updates across doctor schedules, real-time audio waveforms, and the clinical appointments ledger.

---

## System Architecture

```
                    ┌────────────────────────────────────────────────────────┐
                    │               Web Client (Browser)                     │
                    │   • WebAudio API (16kHz PCM Int16 Streaming)           │
                    │   • React + Tailwind Operations Dispatch Console       │
                    └──────────────┬──────────────────────────▲──────────────┘
                       Audio In    │                          │ Audio Out + Events
                    (Binary WS)    │                          │ (Binary WS + JSON)
                                   ▼                          │
┌─────────────────────────────────────────────────────────────┴────────────────────────────────┐
│                              FastAPI Backend & ASGI Runtime                                  │
│                                                                                              │
│   ┌───────────────────────────────────────────────────────────────────────────────────────┐  │
│   │                               Pipecat Voice Pipeline                                  │  │
│   │                                                                                       │  │
│   │   [WebSocket Input]                                                                   │  │
│   │          │ (Raw 16kHz PCM Audio Frames)                                               │  │
│   │          ▼                                                                            │  │
│   │   [Silero VAD (ONNX)] ─────────────> Detects voice activity & handles user speech cut │  │
│   │          │                                                                            │  │
│   │          ▼                                                                            │  │
│   │   [ElevenLabs Realtime STT] ───────> Low-latency phoneme transcription to text        │  │
│   │          │                                                                            │  │
│   │          ▼                                                                            │  │
│   │   [Context Aggregator Pair] ───────> Synchronizes caller turns into LLM context       │  │
│   │          │                                                                            │  │
│   │          ▼                                                                            │  │
│   │   [Google Gemini 2.5 Flash] ───────> Conversational reasoning + Tool Function Calling │  │
│   │          │                                                                            │  │
│   │          ▼                                                                            │  │
│   │   [ElevenLabs TTS] ────────────────> Synthesizes speech ("Rachel" voice profile)      │  │
│   │          │                                                                            │  │
│   │          ▼                                                                            │  │
│   │   [WebSocket Output] ──────────────> Streams raw audio chunks back to browser         │  │
│   └───────────────────────────────────────────────────────────────────────────────────────┘  │
│                                              │                                               │
│                                              ▼ (Tool Handlers)                               │
│                                   ┌─────────────────────┐                                    │
│                                   │   SQLite Database   │                                    │
│                                   │  (Doctors & Ledger) │                                    │
│                                   └──────────┬──────────┘                                    │
│                                              │ Broadcast Mutation                            │
│                                              ▼                                               │
│                         ┌────────────────────────────────────────┐                           │
│                         │   Dashboard Event Stream (/ws/dash)    │                           │
│                         └────────────────────────────────────────┘                           │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Technical Design Decisions (FDE Perspective)

### 1. Audio Transport: WebSocket vs. 3rd-Party Signaling
Rather than forcing evaluators to register for third-party WebRTC signaling infrastructure (e.g. Daily.co API tokens), the system uses a high-performance **FastAPI WebSocket audio transport** (`FastAPIWebsocketTransport`). The browser captures microphone input at 16,000 Hz mono PCM via `AudioContext` and streams binary chunks directly to the backend. This guarantees:
- Zero external signaling latency.
- Completely self-contained local execution with zero dependencies outside standard Python and npm.
- Deterministic audio queue scheduling on the client to eliminate jitter.

### 2. Low Latency with Google Gemini 2.5 Flash
`gemini-2.5-flash` was selected as the LLM engine for its sub-400ms time-to-first-token (TTFT) and native JSON function calling capabilities. It handles complex clinical constraints (slot filtering, time formatting, phone parsing) without multi-shot latency overhead.

### 3. Voice Activity Detection (Silero VAD)
Silero VAD runs locally on CPU via ONNX Runtime (`SileroVADAnalyzer`). It runs directly inside Pipecat to filter room noise and enable natural caller interruptions (barge-in), preventing the LLM from hallucinating on silence.

### 4. Telephony Simulation & Sound Synthesis
Rather than loading static MP3 audio files over the network, phone sound effects (dialing ring cadence, connected tone, confirmation chimes, and hangup disconnect tones) are synthesized in real time via the browser's **Web Audio API** oscillators.

---

## Clinical Rules Implementation

| Rule | Implementation Mechanism |
| :--- | :--- |
| **Phone-Only Identification** | No authentication or caller-ID required. The system prompt instructs Gemini that patients are indexed exclusively by the phone digits they speak aloud. |
| **Mandatory Confirmation Readback** | In `prompts.py`, Gemini is strictly constrained: *"BEFORE calling `book_appointment` or `cancel_appointment`, you MUST read the phone number back to the caller to confirm."* The tool is only dispatched after caller affirmation. |
| **Slot Availability (`check_doctor_availability`)** | Queries `slots` joined with `doctors` in SQLite. Returns matching specialists, dates, and times, offering top 2–3 options naturally in speech. |
| **Booking Atomic Lock (`book_appointment`)** | Validates slot availability, marks `is_available = 0`, generates a reference ID (e.g., `APT-261127-1099`), and broadcasts an event to the frontend ledger. |
| **Appointment Cancellation (`cancel_appointment`)** | Normalizes spoken phone numbers (stripping formatting and country codes), looks up the booking, sets status to `CANCELLED`, and releases the slot (`is_available = 1`). |

---

## Local Setup & Execution Guide

### Prerequisites
- **Python 3.11, 3.12, or 3.13**
- **Node.js v18+ & npm**

### 1. Clone & Configure Environment
```bash
git clone https://github.com/shamitbundela/nexov-voice-agent.git
cd nexov-voice-agent
cp .env.example .env
```

Open `.env` and configure your API credentials:
```env
# Free quota available at https://aistudio.google.com/
GEMINI_API_KEY=your_gemini_api_key

# Available at https://elevenlabs.io/
ELEVENLABS_API_KEY=your_elevenlabs_api_key

# Defaults
GEMINI_MODEL=gemini-2.5-flash
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
PORT=8000
```
> **Note on Evaluation:** If you launch the app without API keys, an intelligent simulation engine automatically activates so you can inspect the dashboard, phone UI, and database workflows immediately.

### 2. Install Dependencies
```bash
pip install -r backend/requirements.txt
```

### 3. Start Application (Single Command)
```bash
python backend/run.py
```
Open **[http://localhost:8000](http://localhost:8000)** in your browser.  
FastAPI serves the clinical REST API, WebSocket streams (`/ws/call`, `/ws/dashboard`), and the compiled React production frontend simultaneously.

---

## Automated Verification Tests

A dedicated test suite validates the database, tool handlers, REST APIs, and WebSocket handshakes:

```bash
python backend/test_flow.py
```

**Test Output:**
```
[OK] Seed data verified: 5 doctors, 21 slots, 1 initial appointment.
[OK] check_doctor_availability verified: 5 Cardiology slots found.
[OK] book_appointment verified: Ref APT-261127-6912 booked for 555-0199.
[OK] cancel_appointment verified: Appointment for 555-8833 cancelled and slot released.
[OK] All REST endpoints verified: 200 OK.
[OK] WebSocket /ws/call handshake verified: Nexov Clinical Voice Engine.
[OK] WebSocket /ws/dashboard real-time snapshot verified.
Ran 7 tests in 0.34s — OK
```

---

## Repository Directory Structure

```
nexov-voice-agent/
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI application & static asset mount
│   │   ├── config.py                  # Pydantic settings & environment validation
│   │   ├── database.py                # SQLite schema, CRUD, and phone normalizer
│   │   ├── seed_data.py               # 5 specialists across 21 time slots
│   │   ├── pipeline/
│   │   │   ├── agent.py               # Pipecat pipeline (VAD + STT + Gemini + TTS)
│   │   │   ├── tools.py               # check_availability, book, and cancel handlers
│   │   │   ├── prompts.py             # System prompt & phone verification constraints
│   │   │   └── serializer.py          # Binary PCM WebSocket frame serializer
│   │   ├── routes/
│   │   │   ├── doctors.py             # GET /api/doctors & GET /api/slots
│   │   │   ├── appointments.py        # GET/POST /api/appointments & broadcast
│   │   │   └── call.py                # WebSocket /ws/call & /ws/dashboard
│   │   └── utils/
│   │       └── simulator.py           # Evaluation fallback engine
│   ├── requirements.txt
│   ├── run.py                         # Single-command launcher
│   └── test_flow.py                   # Automated end-to-end test suite
├── frontend/
│   ├── src/
│   │   ├── App.jsx                    # Central dispatch dashboard layout
│   │   ├── components/
│   │   │   ├── Header.jsx             # Clinical top bar with pipeline telemetry
│   │   │   ├── DoctorsGrid.jsx        # Physician cards with slot chips
│   │   │   ├── AppointmentsTable.jsx  # Ledger with live row-glow animations
│   │   │   ├── PhoneInterface.jsx     # Smartphone call modal (Dynamic Island, controls)
│   │   │   ├── AudioWaveform.jsx      # 32-bar reactive audio amplitude visualizer
│   │   │   ├── BookingModalCard.jsx   # In-call confirmation voucher
│   │   │   ├── StatsBar.jsx           # Operations KPI cards
│   │   │   └── TranscriptFeed.jsx     # Real-time voice stream transcript
│   │   ├── hooks/
│   │   │   ├── useVoiceCall.js        # WebAudio mic streamer & PCM queue player
│   │   │   └── useSoundEffects.js     # Web Audio API ring/chime synthesizer
│   │   └── index.css                  # Tailored medical theme styles
│   ├── package.json
│   └── vite.config.js
├── .env.example
├── .gitignore
├── PIPELINE_DESCRIPTION.md            # Short honest pipeline description for submission
└── VIDEO_DEMO_SCRIPT.md               # Minute-by-minute script for 3-minute video
```

---

## Submission Deliverables

- **Google Form**: [Submit Assignment](https://docs.google.com/forms/d/e/1FAIpQLSdruhcgKFC4LjnlwHfYDRZoGsa0r-qy4k68SJ8RsmxsPbYxpg/viewform?usp=publish-editor)
- **Pipeline Description**: Read [PIPELINE_DESCRIPTION.md](file:///c:/Users/LOQ/Desktop/NevoxAI/PIPELINE_DESCRIPTION.md)
- **Video Walkthrough Guide**: Read [VIDEO_DEMO_SCRIPT.md](file:///c:/Users/LOQ/Desktop/NevoxAI/VIDEO_DEMO_SCRIPT.md)

---
**Shamit Bundela**  
Forward Deployed Engineer (FDE) Candidate • NexovAI
