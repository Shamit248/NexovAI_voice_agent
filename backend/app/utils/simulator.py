import asyncio
import json
import re
from datetime import datetime
from loguru import logger
from fastapi import WebSocket
from app.database import list_slots, book_appointment_db, cancel_appointment_db, list_doctors
from app.routes.appointments import broadcast_event

class ClinicalConversationSimulator:
    """
    Intelligent conversation engine used when running without active API keys
    or for instant local testing. Faithfully implements all clinical rules:
    - Identifies caller solely by spoken phone number
    - Reads phone number back to caller to confirm before booking/cancelling
    - Executes check_doctor_availability, book_appointment, and cancel_appointment
    - Sends live transcripts and events to the frontend dashboard.
    """

    def __init__(self, websocket: WebSocket):
        self.websocket = websocket
        self.state = "IDLE"
        self.pending_action = None  # "BOOK" or "CANCEL"
        self.pending_data = {}      # {doctor, time, date, phone}
        self.caller_phone = None

    async def send(self, payload: dict):
        try:
            await self.websocket.send_json(payload)
        except Exception:
            pass

    async def speak(self, text: str):
        await self.send({
            "type": "transcript",
            "role": "agent",
            "text": text,
            "timestamp": datetime.now().strftime("%H:%M:%S")
        })
        await self.send({
            "type": "speak",
            "text": text
        })
        await self.send({
            "type": "status",
            "status": "listening"
        })

    def extract_phone(self, text: str) -> str:
        digits = "".join(ch for ch in text if ch.isdigit())
        if len(digits) >= 7:
            return digits
        # Match common spoken number formats e.g. "555 0199" or "five five five"
        words_to_num = {
            "zero": "0", "one": "1", "two": "2", "three": "3", "four": "4",
            "five": "5", "six": "6", "seven": "7", "eight": "8", "nine": "9"
        }
        low = text.lower()
        extracted = []
        for word in low.split():
            clean = re.sub(r'[^a-z0-9]', '', word)
            if clean in words_to_num:
                extracted.append(words_to_num[clean])
            elif clean.isdigit():
                extracted.append(clean)
        res = "".join(extracted)
        return res if len(res) >= 7 else ""

    async def handle_user_utterance(self, text: str):
        text_clean = text.strip().lower()
        logger.info(f"[Simulator Input]: {text_clean}")
        
        await self.send({
            "type": "transcript",
            "role": "caller",
            "text": text,
            "timestamp": datetime.now().strftime("%H:%M:%S")
        })
        await self.send({
            "type": "status",
            "status": "thinking"
        })
        await asyncio.sleep(0.5)

        # 1. Waiting for Confirmation of Phone Number
        if self.state == "AWAITING_CONFIRMATION":
            if any(w in text_clean for w in ["yes", "correct", "yep", "right", "confirm", "sure", "yeah"]):
                if self.pending_action == "BOOK":
                    await self.send({
                        "type": "action",
                        "status": "booking",
                        "message": "Confirming your booking in clinical database..."
                    })
                    res = book_appointment_db(
                        phone_number=self.pending_data["phone"],
                        doctor_name=self.pending_data["doctor"],
                        slot_time=self.pending_data["time"],
                        date=self.pending_data.get("date")
                    )
                    await broadcast_event("appointment_booked", res)
                    await broadcast_event("tool_called", {
                        "tool": "book_appointment",
                        "arguments": self.pending_data,
                        "result": res
                    })
                    self.state = "IDLE"
                    self.pending_action = None
                    if res["success"]:
                        await self.send({"type": "booking_confirmed", "appointment": res})
                        await self.speak(f"Wonderful! Your appointment with {res['doctor_name']} on {res['date']} at {res['time']} is confirmed under reference number {res['appointment_id']}. Is there anything else I can help you with?")
                    else:
                        await self.speak(f"I apologize, {res['message']} Would you like to select another time slot?")
                    return

                elif self.pending_action == "CANCEL":
                    await self.send({
                        "type": "action",
                        "status": "cancelling",
                        "message": "Cancelling appointment in clinical database..."
                    })
                    res = cancel_appointment_db(phone_number=self.pending_data["phone"])
                    await broadcast_event("appointment_cancelled", res)
                    await broadcast_event("tool_called", {
                        "tool": "cancel_appointment",
                        "arguments": self.pending_data,
                        "result": res
                    })
                    self.state = "IDLE"
                    self.pending_action = None
                    if res["success"]:
                        await self.send({"type": "booking_cancelled", "appointment": res})
                        await self.speak(f"Your appointment with {res['doctor_name']} at {res['time']} has been successfully cancelled. The slot is now released. Can I help you with anything else?")
                    else:
                        await self.speak(f"I was not able to find an active appointment for that phone number. Could you double-check the number?")
                    return
            else:
                self.state = "IDLE"
                self.pending_action = None
                await self.speak("No problem at all. Let's restart. How can I assist you with your appointment today?")
                return

        # 2. Check for Phone Number input when awaiting phone
        if self.state in ["AWAITING_PHONE_FOR_BOOK", "AWAITING_PHONE_FOR_CANCEL"]:
            phone = self.extract_phone(text_clean)
            if phone:
                self.caller_phone = phone
                self.pending_data["phone"] = phone
                formatted_phone = "-".join([phone[:3], phone[3:6], phone[6:]]) if len(phone) == 10 else phone
                self.state = "AWAITING_CONFIRMATION"
                action_name = "booking" if self.pending_action == "BOOK" else "cancellation"
                await self.speak(f"Thank you. Just to make sure I have that recorded correctly, your phone number is {formatted_phone}, is that correct?")
                return
            else:
                await self.speak("Could you please repeat your phone number with your area code?")
                return

        # 3. Check for Cancellation Intent
        if any(w in text_clean for w in ["cancel", "drop", "reschedule"]):
            self.pending_action = "CANCEL"
            phone = self.extract_phone(text_clean)
            if phone:
                self.caller_phone = phone
                self.pending_data["phone"] = phone
                formatted_phone = "-".join([phone[:3], phone[3:6], phone[6:]]) if len(phone) == 10 else phone
                self.state = "AWAITING_CONFIRMATION"
                await self.speak(f"I can certainly help you cancel that. Just to confirm, is your phone number {formatted_phone}?")
            else:
                self.state = "AWAITING_PHONE_FOR_CANCEL"
                await self.speak("I can help you cancel an appointment. What is the phone number associated with your booking?")
            return

        # 4. Check for Booking Intent
        if any(w in text_clean for w in ["book", "schedule", "reserve", "take the slot", "make an appointment"]):
            # Detect doctor or specialty
            selected_doc = None
            if "sarah" in text_clean or "chen" in text_clean or "cardio" in text_clean:
                selected_doc = "Dr. Sarah Chen"
            elif "marcus" in text_clean or "vance" in text_clean or "dermat" in text_clean or "skin" in text_clean:
                selected_doc = "Dr. Marcus Vance"
            elif "priya" in text_clean or "patel" in text_clean or "general" in text_clean:
                selected_doc = "Dr. Priya Patel"
            elif "david" in text_clean or "kim" in text_clean or "ortho" in text_clean or "joint" in text_clean:
                selected_doc = "Dr. David Kim"
            elif "elena" in text_clean or "rostova" in text_clean or "pediatric" in text_clean or "child" in text_clean:
                selected_doc = "Dr. Elena Rostova"
            else:
                selected_doc = "Dr. Sarah Chen"

            # Detect time slot
            time_match = None
            times = ["09:30 AM", "11:00 AM", "02:30 PM", "10:15 AM", "01:45 PM", "04:00 PM", "09:00 AM", "03:00 PM", "10:30 AM", "02:00 PM", "04:30 PM"]
            for t in times:
                t_simple = t.lower().replace(":", "").replace(" ", "").lstrip("0")
                if t_simple in text_clean.replace(":", "").replace(" ", "") or t.lower() in text_clean:
                    time_match = t
                    break
            if not time_match:
                # Default to next available slot for doctor
                slots = list_slots(doctor_name=selected_doc, only_available=True)
                time_match = slots[0]["time"] if slots else "02:30 PM"

            self.pending_action = "BOOK"
            self.pending_data = {
                "doctor": selected_doc,
                "time": time_match,
                "date": "Today"
            }

            phone = self.extract_phone(text_clean)
            if phone:
                self.caller_phone = phone
                self.pending_data["phone"] = phone
                formatted_phone = "-".join([phone[:3], phone[3:6], phone[6:]]) if len(phone) == 10 else phone
                self.state = "AWAITING_CONFIRMATION"
                await self.speak(f"I have a slot available with {selected_doc} at {time_match}. Just to confirm, your phone number is {formatted_phone}, correct?")
            else:
                self.state = "AWAITING_PHONE_FOR_BOOK"
                await self.speak(f"I can reserve that slot with {selected_doc} at {time_match} for you. What phone number should I put on the reservation?")
            return

        # 5. Check Availability / Doctors
        if any(w in text_clean for w in ["available", "availability", "slots", "doctor", "specialist", "free", "when can i", "openings"]):
            doc_name = None
            spec = None
            if "cardio" in text_clean or "heart" in text_clean or "chen" in text_clean:
                doc_name = "Dr. Sarah Chen"
                spec = "Cardiology"
            elif "dermat" in text_clean or "skin" in text_clean or "vance" in text_clean:
                doc_name = "Dr. Marcus Vance"
                spec = "Dermatology"
            elif "general" in text_clean or "primary" in text_clean or "patel" in text_clean:
                doc_name = "Dr. Priya Patel"
                spec = "General Medicine"
            elif "ortho" in text_clean or "bone" in text_clean or "joint" in text_clean or "kim" in text_clean:
                doc_name = "Dr. David Kim"
                spec = "Orthopedics"
            elif "child" in text_clean or "pediatric" in text_clean or "rostova" in text_clean:
                doc_name = "Dr. Elena Rostova"
                spec = "Pediatrics"

            slots = list_slots(doctor_name=doc_name, specialty=spec, only_available=True)
            await broadcast_event("tool_called", {
                "tool": "check_doctor_availability",
                "arguments": {"doctor_name": doc_name, "specialty": spec},
                "results_count": len(slots)
            })

            if not slots:
                await self.speak("All slots for that doctor are currently filled. Would you like me to check another doctor or specialty?")
            else:
                top_slots = slots[:2]
                opts = " and ".join([f"{s['time']} ({s['date']})" for s in top_slots])
                doc = top_slots[0]['doctor_name']
                await self.speak(f"{doc} has available openings at {opts}. Would one of those work for you?")
            return

        # 6. Default Greeting / General Inquiries
        if any(w in text_clean for w in ["hi", "hello", "hey", "morning", "afternoon"]):
            await self.speak("Hello! Thank you for calling Nexov Health. How may I assist you with booking or managing a doctor's appointment today?")
            return

        # General response
        await self.speak("I can check doctor availability, book an appointment, or cancel an existing one. Who would you like to see today?")
