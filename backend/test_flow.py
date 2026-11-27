import sys
import os
import unittest
sys.path.append(os.path.dirname(__file__))

from app.database import init_db, list_doctors, list_slots, list_appointments, book_appointment_db, cancel_appointment_db
from fastapi.testclient import TestClient
from app.main import app

class TestClinicalVoiceAgent(unittest.TestCase):
    def setUp(self):
        # Reset database to fresh seed state
        init_db(force_reset=True)
        self.client = TestClient(app)

    def test_01_seed_data(self):
        docs = list_doctors()
        slots = list_slots()
        apts = list_appointments()
        self.assertGreaterEqual(len(docs), 5, "Expected at least 5 doctors")
        self.assertGreaterEqual(len(slots), 20, "Expected at least 20 slots")
        self.assertEqual(len(apts), 1, "Expected 1 initial seed appointment")
        print(f"[OK] Seed data verified: {len(docs)} doctors, {len(slots)} slots, {len(apts)} initial appointments.")

    def test_02_check_availability(self):
        cardio_slots = list_slots(specialty="Cardiology", only_available=True)
        self.assertGreater(len(cardio_slots), 0, "Cardiology should have available slots")
        doc_slots = list_slots(doctor_name="Dr. Sarah Chen", only_available=True)
        self.assertGreater(len(doc_slots), 0, "Dr. Sarah Chen should have available slots")
        print(f"[OK] check_doctor_availability verified: {len(cardio_slots)} Cardiology slots found.")

    def test_03_book_appointment(self):
        # Book a slot for Dr. Sarah Chen at 09:30 AM
        phone = "555-0199"
        res = book_appointment_db(
            phone_number=phone,
            doctor_name="Dr. Sarah Chen",
            slot_time="09:30 AM"
        )
        self.assertTrue(res["success"], f"Booking failed: {res.get('message')}")
        self.assertEqual(res["phone_number"], phone)
        self.assertEqual(res["status"], "CONFIRMED")
        
        # Verify slot is no longer available
        slots = list_slots(doctor_name="Dr. Sarah Chen")
        target_slot = [s for s in slots if "09:30" in s["time"]][0]
        self.assertEqual(target_slot["is_available"], 0, "Booked slot should be marked unavailable")
        print(f"[OK] book_appointment verified: Ref {res['appointment_id']} booked for {phone}.")

    def test_04_cancel_appointment(self):
        # Book first
        phone = "555-8833"
        book_res = book_appointment_db(
            phone_number=phone,
            doctor_name="Dr. Marcus Vance",
            slot_time="10:15 AM"
        )
        self.assertTrue(book_res["success"])
        
        # Now cancel using phone number only (as required by clinical rules)
        cancel_res = cancel_appointment_db(phone_number=phone)
        self.assertTrue(cancel_res["success"], f"Cancellation failed: {cancel_res.get('message')}")
        self.assertEqual(cancel_res["status"], "CANCELLED")
        
        # Verify slot is freed up again
        slots = list_slots(doctor_name="Dr. Marcus Vance")
        slot = [s for s in slots if "10:15" in s["time"]][0]
        self.assertEqual(slot["is_available"], 1, "Slot should be freed back up to available")
        print(f"[OK] cancel_appointment verified: Appointment for {phone} cancelled and slot released.")

    def test_05_rest_endpoints(self):
        r_docs = self.client.get("/api/doctors")
        self.assertEqual(r_docs.status_code, 200)
        self.assertIn("doctors", r_docs.json())

        r_slots = self.client.get("/api/slots")
        self.assertEqual(r_slots.status_code, 200)
        self.assertIn("slots", r_slots.json())

        r_apts = self.client.get("/api/appointments")
        self.assertEqual(r_apts.status_code, 200)
        self.assertIn("appointments", r_apts.json())

        r_status = self.client.get("/api/status")
        self.assertEqual(r_status.status_code, 200)
        self.assertEqual(r_status.json()["status"], "online")
        print("[OK] All REST endpoints verified: 200 OK.")

    def test_06_websocket_call_handshake(self):
        with self.client.websocket_connect("/ws/call") as ws:
            data = ws.receive_json()
            self.assertIn("type", data)
            self.assertEqual(data["type"], "system_info")
            print(f"[OK] WebSocket /ws/call handshake verified: {data['engine']}")

    def test_07_websocket_dashboard_snapshot(self):
        with self.client.websocket_connect("/ws/dashboard") as ws:
            data = ws.receive_json()
            self.assertEqual(data["type"], "snapshot")
            self.assertIn("doctors", data)
            self.assertIn("slots", data)
            self.assertIn("appointments", data)
            print("[OK] WebSocket /ws/dashboard real-time snapshot verified.")

if __name__ == "__main__":
    unittest.main()
