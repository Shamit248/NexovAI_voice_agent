import json
from typing import Dict, Any, Optional
from loguru import logger
from pipecat.services.llm_service import FunctionCallParams
from app.database import list_slots, book_appointment_db, cancel_appointment_db, list_doctors
from app.routes.appointments import broadcast_event

async def check_doctor_availability_handler(params: FunctionCallParams):
    """
    Check available slots for doctors.
    Arguments may include:
    - doctor_name (optional): e.g. "Dr. Sarah Chen" or "Sarah"
    - specialty (optional): e.g. "Cardiology", "Dermatology"
    - date (optional): e.g. "Today", "Tomorrow"
    """
    args = params.arguments or {}
    doctor_name = args.get("doctor_name")
    specialty = args.get("specialty")
    date = args.get("date")
    
    logger.info(f"[Tool: check_doctor_availability] doctor={doctor_name}, specialty={specialty}, date={date}")
    
    slots = list_slots(doctor_name=doctor_name, specialty=specialty, date=date, only_available=True)
    
    # Broadcast to frontend dashboard that availability was checked
    await broadcast_event("tool_called", {
        "tool": "check_doctor_availability",
        "arguments": args,
        "results_count": len(slots)
    })
    
    if not slots:
        # If no specific slot was found, list all available doctors and specialties so the agent can guide caller
        all_docs = list_doctors()
        doc_summary = ", ".join([f"{d['name']} ({d['specialty']})" for d in all_docs])
        result = {
            "available": False,
            "message": f"No available slots found for the requested criteria. Our doctors are: {doc_summary}.",
            "slots": []
        }
    else:
        slot_list = []
        for s in slots[:6]: # Limit to top 6 slots for natural speech
            slot_list.append({
                "doctor_name": s["doctor_name"],
                "specialty": s["specialty"],
                "date": s["date"],
                "time": s["time"]
            })
        result = {
            "available": True,
            "total_available": len(slots),
            "slots": slot_list,
            "message": f"Found {len(slots)} available slots."
        }
        
    await params.result_callback(result)

async def book_appointment_handler(params: FunctionCallParams):
    """
    Book an appointment for a patient using their spoken phone number.
    Arguments:
    - phone_number (required): Spoken phone number
    - doctor_name (required): Doctor's name
    - slot_time (required): e.g. "09:30 AM", "2:30 PM"
    - date (optional): e.g. "Today", "Tomorrow"
    """
    args = params.arguments or {}
    phone_number = str(args.get("phone_number", "")).strip()
    doctor_name = str(args.get("doctor_name", "")).strip()
    slot_time = str(args.get("slot_time", "")).strip()
    date = args.get("date")
    
    logger.info(f"[Tool: book_appointment] phone={phone_number}, doctor={doctor_name}, time={slot_time}, date={date}")
    
    if not phone_number or not doctor_name or not slot_time:
        result = {
            "success": False,
            "message": "Missing required details. Please ensure you have the patient's phone number, doctor's name, and desired time slot."
        }
        await params.result_callback(result)
        return

    booking_res = book_appointment_db(
        phone_number=phone_number,
        doctor_name=doctor_name,
        slot_time=slot_time,
        date=date
    )
    
    # Broadcast to frontend dashboard so UI immediately flashes booking confirmation & updates tables
    await broadcast_event("appointment_booked", booking_res)
    await broadcast_event("tool_called", {
        "tool": "book_appointment",
        "arguments": args,
        "result": booking_res
    })
    
    await params.result_callback(booking_res)

async def cancel_appointment_handler(params: FunctionCallParams):
    """
    Cancel an existing appointment for a patient using their spoken phone number.
    Arguments:
    - phone_number (required): Spoken phone number
    - doctor_name (optional): Doctor's name if they have multiple appointments
    - slot_time (optional): Slot time if needed
    """
    args = params.arguments or {}
    phone_number = str(args.get("phone_number", "")).strip()
    doctor_name = args.get("doctor_name")
    slot_time = args.get("slot_time")
    
    logger.info(f"[Tool: cancel_appointment] phone={phone_number}, doctor={doctor_name}, time={slot_time}")
    
    if not phone_number:
        result = {
            "success": False,
            "message": "Please provide the phone number associated with the appointment you wish to cancel."
        }
        await params.result_callback(result)
        return
        
    cancel_res = cancel_appointment_db(
        phone_number=phone_number,
        doctor_name=doctor_name,
        slot_time=slot_time
    )
    
    # Broadcast to frontend dashboard
    await broadcast_event("appointment_cancelled", cancel_res)
    await broadcast_event("tool_called", {
        "tool": "cancel_appointment",
        "arguments": args,
        "result": cancel_res
    })
    
    await params.result_callback(cancel_res)
