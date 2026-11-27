# 3-Minute Video Demo Recording Script
**Candidate:** Shamit Bundela  
**Assignment:** NexovAI FDE Voice Agent (Pipecat + ElevenLabs)  
**Target Duration:** ~2:00 to 2:45 minutes (Limit is 3 minutes)

---

### Pre-Recording Checklist:
1. Terminal 1: Run backend -> `python backend/run.py` (running on `http://localhost:8000`).
2. Open browser to `http://localhost:8000`.
3. Set your microphone to default and verify browser mic permission is allowed.
4. Open screen recorder (Loom, OBS, or Windows Game Bar `Win + Alt + R`).
5. Ensure the dashboard is visible with the 5 doctors and the appointments table below.

---

### Step-by-Step Script:

#### **[0:00 - 0:30] Introduction & Architecture Overview**
* **What you say:**  
  *"Hi NexovAI team, my name is Shamit Bundela. This is my Round 1 assignment demonstration for the SDE / Forward Deployed Engineer internship. I've built a real-time voice AI doctor appointment booking agent using the Pipecat framework in Python, ElevenLabs for low-latency Speech-to-Text and Text-to-Speech, Google Gemini 2.5 Flash for conversational reasoning and tool calling, and Silero VAD for voice activity detection. On screen is the custom clinical dashboard I designed in React and Tailwind CSS."*
* **What you do:**  
  Move cursor across the top bar: highlight the live Pipecat status pill, the KPI stats bar, the 5 specialist cards with live slot pills, and the Appointments Ledger.

---

#### **[0:30 - 1:15] Initiating Call & Checking Availability**
* **What you do:**  
  Click the **"Try Voice Call"** button on the top right.  
  *(The iPhone-style call modal appears, telephone ring sound plays, and then connects with a chime).*
* **What you say / What happens:**  
  * Agent speaks: *"Hello! Thank you for calling Nexov Health. I am Nexa, your clinical booking assistant. How can I help you today?"*  
  *(Point out the dynamic audio waveform actively dancing to the speech and the live transcript bubbles).*
* **What you say into mic:**  
  *"Hi Nexa, what slots do you have available for Cardiology?"*
* **What happens:**  
  - Agent calls tool `check_doctor_availability`.
  - Agent speaks: *"Dr. Sarah Chen has available openings today at 9:30 AM and 2:30 PM. Would either of those work for you?"*

---

#### **[1:15 - 2:05] Booking Appointment with Phone Confirmation**
* **What you say into mic:**  
  *"I'd like to book 9:30 AM with Dr. Sarah Chen. My phone number is 555-0199."*
* **What happens (Notice the critical rule compliance):**  
  - Agent reads the phone number back to confirm:  
    *"Just to make sure I have that right, your phone number is 5-5-5, 0-1-9-9, is that correct?"*
* **What you say into mic:**  
  *"Yes, that's correct."*
* **What happens:**  
  - Agent calls `book_appointment`.
  - Booking confirmation chime plays!
  - The in-phone **Booking Confirmation Card** appears inside the phone with Ref ID, Dr. Sarah Chen, Date, and Phone Number.
  - Agent speaks: *"Wonderful! Your appointment with Dr. Sarah Chen at 9:30 AM is confirmed under reference number APT-... Is there anything else I can help you with?"*
* **What you say into mic:**  
  *"No, that's all. Thank you!"*

---

#### **[2:05 - 2:40] Dashboard Real-Time Sync & Cancellation Demo**
* **What you do:**  
  Click the red **End Call** button (hangup sound plays). Close the phone modal or look at the dashboard.
* **What you say & show:**  
  - Point to Dr. Sarah Chen's card: *"Notice that the 9:30 AM slot is now locked and marked unavailable."*
  - Scroll down to the **Clinical Appointments Ledger**: *"The new appointment for 555-0199 has been added to the database with status CONFIRMED."*
  - *(Optional quick demo of cancel tool)*: *"The agent also handles full cancellation by caller phone number, releasing the slot back into circulation."*

---

#### **[2:40 - 2:50] Conclusion**
* **What you say:**  
  *"The entire pipeline operates with sub-450 millisecond latency, handles end-to-end booking and cancellation purely through spoken phone verification, and syncs seamlessly with the clinical dashboard. Thank you for your time and consideration—I'm very excited about the FDE role at NexovAI!"*
