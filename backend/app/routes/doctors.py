from fastapi import APIRouter, Query
from typing import Optional
from app.database import list_doctors, list_slots

router = APIRouter(prefix="/api", tags=["doctors"])

@router.get("/doctors")
def get_doctors():
    """List all available doctors with their specialties and available slot count."""
    doctors = list_doctors()
    slots = list_slots(only_available=True)
    
    # Attach available slots count
    for doc in doctors:
        doc["available_slots_count"] = sum(1 for s in slots if s["doctor_id"] == doc["id"])
    return {"doctors": doctors}

@router.get("/slots")
def get_slots(
    doctor_name: Optional[str] = Query(None),
    specialty: Optional[str] = Query(None),
    date: Optional[str] = Query(None),
    only_available: bool = Query(False)
):
    """List slots filtered by doctor, specialty, date, or availability."""
    slots = list_slots(doctor_name=doctor_name, specialty=specialty, date=date, only_available=only_available)
    return {"slots": slots}
