# NexovAI FDE Voice Agent • 3-Minute Video Demo Script
**Candidate:** Shamit Bundela  
**Role Applied For:** SDE / Forward Deployed Engineer (FDE) Internship  
**Target Video Duration:** 2:15 to 2:45 (Strict Limit: 3:00)  
**Recording Tool:** Loom, OBS, or Windows Screen Recorder (`Win + Alt + R`)

---

## 🖥️ Which Page Should You Be On?

You only need **ONE single page** open in your browser for the entire video:
```text
http://localhost:8000
```
Everything is unified on this single executive screen:
- **Zone 1 (Left Sidebar):** Clinical Department directory & audio pipeline telemetry.
- **Zone 2 (Center Workspace):** KPI metric cards, Physician Availability Matrix (with all 5 doctors, open slots), and the Clinical Appointments Ledger below.
- **Zone 3 (Right Docked Console):** Starlight Titanium Phone Handset with Dynamic Island, live timer, waveform visualizer, and conversation feed.

> **Tip:** You do **not** need to switch tabs or open separate windows. Keep this single dashboard in full screen (`F11` or maximized browser) for a seamless, high-production recording.

---

## 🎬 Turn-by-Turn Script

---

### **[0:00 - 0:35] Introduction & System Architecture**
* **Page View:** Browser at `http://localhost:8000`. Full dashboard visible.
* **What you do:** Move your cursor across the top header, the live telemetry capsule (`Pipecat 1.17 / Silero VAD / Gemini 2.5 Flash`), the KPI metrics bar, and the physician cards.
* **What you say:**
  > *"Hi NexovAI team, my name is Shamit Bundela. This is my Round 1 technical assignment demonstration for the Forward Deployed Engineer internship.*
  > 
  > *I have built an autonomous clinical voice concierge and real-time dispatch dashboard. The backend is built with the **Pipecat** framework in Python, using **ElevenLabs** for real-time STT and low-latency neural TTS, **Google Gemini 2.5 Flash** for function-calling reasoning, and **Silero VAD** for voice activity detection.*
  > 
  > *On screen is the custom executive clinical dashboard built in React and Tailwind CSS, connected via full-duplex WebSockets for instantaneous ledger synchronization."*

---

### **[0:35 - 1:15] Initiating Call & Checking Availability**
* **What you do:**
  1. On the docked phone on the right (or the top header button), click **"Initiate Voice Session"** (or **"Connect Voice Session"**).
  2. The ringing sound plays, connects with a chime, and the Dynamic Island illuminates with a glowing green `LIVE` indicator.
* **What happens:**
  - Nexa greets you:  
    *"Hello! I'm Nexa, your autonomous clinical concierge at Nexov Health. How can I help you with your appointment today?"*
  - *(Point out the reactive champagne/emerald audio waveform and the transcript bubble).*
* **What you say into your mic:**
  > *"Hi Nexa, could you check available slots for Cardiology?"*
* **What happens:**
  - Nexa executes the `check_doctor_availability` tool in SQLite.
  - Nexa replies:  
    *"Dr. Sarah Chen has available openings today at 09:30 AM and 11:00 AM. Would one of those work for you?"*

---

### **[1:15 - 2:05] Booking Appointment with Mandatory Phone Readback**
* **What you say into your mic:**
  > *"I'd like to book 9:30 AM with Dr. Sarah Chen. My phone number is 555-0199."*
* **What happens (Strict Clinical Rule Compliance):**
  - The agent identifies the caller solely by spoken phone number.
  - The agent **repeats the phone number back to confirm** before executing the booking:  
    *"I have a slot available with Dr. Sarah Chen at 09:30 AM. Just to confirm, your phone number is 555-0199, correct?"*
* **What you say into your mic:**
  > *"Yes, that is correct."*
* **What happens:**
  - Nexa triggers `book_appointment`.
  - Confirmation chime rings.
  - An embossed **Appointment Confirmed Pass** appears directly inside the phone screen with Ref ID `APT-...`, Dr. Sarah Chen, Date, and Time.
  - Nexa speaks:  
    *"Wonderful! Your appointment with Dr. Sarah Chen on Today at 09:30 AM is confirmed under reference number APT-... Is there anything else I can help you with?"*
* **What you say into your mic:**
  > *"No, that's all. Thank you!"*

---

### **[2:05 - 2:35] Real-Time Dashboard Ledger & Cancellation**
* **What you do:**
  1. Click the red **End Call** button on the phone (hangup tone plays).
  2. Point cursor to **Dr. Sarah Chen's card**: Show that the `09:30 AM` slot is now locked and struck-through.
  3. Point cursor to the **Clinical Appointments Ledger** table below: Show the row highlighted in warm amber, displaying reference ID, patient contact `555-0199`, Dr. Sarah Chen, and status `CONFIRMED`.
* **What you say:**
  > *"As you can see, the moment the agent booked the slot, the WebSocket broadcast an instant state update: Dr. Sarah Chen's 9:30 AM slot is locked, and the clinical ledger below immediately records the confirmed appointment.*
  > 
  > *The system also supports seamless cancellation solely via spoken phone verification, immediately releasing the slot back into circulation."*

---

### **[2:35 - 2:50] Closing**
* **What you say:**
  > *"The entire voice pipeline operates with sub-450ms latency, zero third-party WebRTC dependencies, full offline simulation fallbacks, and a complete automated test suite.*
  > 
  > *Thank you for your time, and I look forward to contributing as an FDE at NexovAI!"*

---

## ⚡ Quick Fallback / Demo Tips
- If you prefer not to speak out loud, you can click the **Quick Speech Prompts** inside the phone:
  - `Check Cardiology`
  - `Book 9:30 AM (555-0199)`
  - `Confirm "Yes"`
- If you want to reset the database to a fresh state before recording, click the **"Reset State"** button in the top header.
