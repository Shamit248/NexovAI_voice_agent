from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.database import list_appointments, book_appointment_db, cancel_appointment_db, init_db

router = APIRouter(prefix="/api", tags=["appointments"])

class BookRequest(BaseModel):
    phone_number: str
    doctor_name: str
    slot_time: str
    date: Optional[str] = None

class CancelRequest(BaseModel):
    phone_number: str
    doctor_name: Optional[str] = None
    slot_time: Optional[str] = None

# Active dashboard websocket connections for real-time sync
active_dashboard_connections = set()

async def broadcast_event(event_type: str, data: dict):
    """Broadcast state changes to all connected dashboard clients."""
    payload = {"type": event_type, "data": data}
    disconnected = set()
    for ws in active_dashboard_connections:
        try:
            await ws.send_json(payload)
        except Exception:
            disconnected.add(ws)
    active_dashboard_connections.difference_update(disconnected)

@router.get("/appointments")
def get_appointments(phone_number: Optional[str] = None):
    """Retrieve appointments, optionally filtered by phone number."""
    apts = list_appointments(phone_number=phone_number)
    return {"appointments": apts}

@router.post("/appointments/book")
async def book_appointment(req: BookRequest):
    """Book an appointment and broadcast event."""
    result = book_appointment_db(
        phone_number=req.phone_number,
        doctor_name=req.doctor_name,
        slot_time=req.slot_time,
        date=req.date
    )
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
        
    await broadcast_event("appointment_booked", result)
    return result

@router.post("/appointments/cancel")
async def cancel_appointment(req: CancelRequest):
    """Cancel an appointment and broadcast event."""
    result = cancel_appointment_db(
        phone_number=req.phone_number,
        doctor_name=req.doctor_name,
        slot_time=req.slot_time
    )
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
        
    await broadcast_event("appointment_cancelled", result)
    return result

@router.post("/reset-demo")
async def reset_demo():
    """Reset database to fresh demo seed data."""
    init_db(force_reset=True)
    await broadcast_event("data_reset", {"message": "Demo data reset successfully"})
    return {"success": True, "message": "Demo state reset to original seed data."}
