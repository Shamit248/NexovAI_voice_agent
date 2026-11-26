import sqlite3
import os
import json
from datetime import datetime
from typing import List, Dict, Any, Optional
from app.config import settings

def get_db_connection() -> sqlite3.Connection:
    """Return an active connection to the SQLite database with dictionary row factory."""
    conn = sqlite3.connect(settings.DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db(force_reset: bool = False):
    """Initialize database tables and seed if empty or force_reset is True."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if force_reset:
        cursor.execute("DROP TABLE IF EXISTS appointments")
        cursor.execute("DROP TABLE IF EXISTS slots")
        cursor.execute("DROP TABLE IF EXISTS doctors")
    
    # Doctors table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS doctors (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            specialty TEXT NOT NULL,
            hospital TEXT NOT NULL,
            rating REAL NOT NULL,
            experience TEXT NOT NULL,
            bio TEXT,
            avatar_url TEXT
        )
    """)
    
    # Slots table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS slots (
            id TEXT PRIMARY KEY,
            doctor_id TEXT NOT NULL,
            doctor_name TEXT NOT NULL,
            date TEXT NOT NULL,
            time TEXT NOT NULL,
            is_available INTEGER NOT NULL DEFAULT 1,
            appointment_id TEXT,
            FOREIGN KEY(doctor_id) REFERENCES doctors(id)
        )
    """)
    
    # Appointments table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS appointments (
            id TEXT PRIMARY KEY,
            phone_number TEXT NOT NULL,
            doctor_id TEXT NOT NULL,
            doctor_name TEXT NOT NULL,
            specialty TEXT NOT NULL,
            slot_id TEXT NOT NULL,
            date TEXT NOT NULL,
            time TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'CONFIRMED',
            created_at TEXT NOT NULL,
            notes TEXT,
            FOREIGN KEY(doctor_id) REFERENCES doctors(id),
            FOREIGN KEY(slot_id) REFERENCES slots(id)
        )
    """)
    
    conn.commit()
    
    # Check if seed data is needed
    cursor.execute("SELECT COUNT(*) as count FROM doctors")
    count = cursor.fetchone()["count"]
    if count == 0:
        from app.seed_data import seed_database
        seed_database(conn)
        
    conn.close()

def normalize_phone(phone: str) -> str:
    """Normalize phone numbers by stripping formatting characters to match spoken variations."""
    if not phone:
        return ""
    digits = "".join(ch for ch in str(phone) if ch.isdigit())
    # If 11 digits starting with 1, strip country code for consistent matching
    if len(digits) == 11 and digits.startswith("1"):
        digits = digits[1:]
    return digits

# Database CRUD functions
def list_doctors() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM doctors ORDER BY name ASC")
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

def list_slots(doctor_name: Optional[str] = None, specialty: Optional[str] = None, date: Optional[str] = None, only_available: bool = False) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = """
        SELECT s.*, d.specialty, d.hospital 
        FROM slots s
        JOIN doctors d ON s.doctor_id = d.id
        WHERE 1=1
    """
    params = []
    
    if only_available:
        query += " AND s.is_available = 1"
        
    if doctor_name:
        query += " AND (LOWER(s.doctor_name) LIKE ? OR LOWER(d.name) LIKE ?)"
        clean_doc = f"%{doctor_name.lower().replace('dr.', '').replace('doctor', '').strip()}%"
        params.extend([clean_doc, clean_doc])
        
    if specialty:
        query += " AND LOWER(d.specialty) LIKE ?"
        params.append(f"%{specialty.lower().strip()}%")
        
    if date:
        query += " AND LOWER(s.date) LIKE ?"
        params.append(f"%{date.lower().strip()}%")
        
    query += " ORDER BY s.doctor_name ASC, s.time ASC"
    cursor.execute(query, params)
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

def list_appointments(phone_number: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if phone_number:
        norm_target = normalize_phone(phone_number)
        cursor.execute("SELECT * FROM appointments ORDER BY created_at DESC")
        all_apts = [dict(r) for r in cursor.fetchall()]
        conn.close()
        # Match normalized phone numbers
        return [apt for apt in all_apts if normalize_phone(apt["phone_number"]) == norm_target or phone_number in apt["phone_number"]]
    else:
        cursor.execute("SELECT * FROM appointments ORDER BY created_at DESC")
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return rows

def book_appointment_db(phone_number: str, doctor_name: str, slot_time: str, date: Optional[str] = None) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    clean_doc = f"%{doctor_name.lower().replace('dr.', '').replace('doctor', '').strip()}%"
    clean_time = f"%{slot_time.lower().strip()}%"
    
    query = """
        SELECT s.*, d.specialty, d.name as full_doc_name
        FROM slots s
        JOIN doctors d ON s.doctor_id = d.id
        WHERE (LOWER(s.doctor_name) LIKE ? OR LOWER(d.name) LIKE ?)
          AND LOWER(s.time) LIKE ?
          AND s.is_available = 1
    """
    params = [clean_doc, clean_doc, clean_time]
    if date:
        query += " AND LOWER(s.date) LIKE ?"
        params.append(f"%{date.lower().strip()}%")
        
    query += " LIMIT 1"
    cursor.execute(query, params)
    slot = cursor.fetchone()
    
    if not slot:
        conn.close()
        return {
            "success": False,
            "message": f"No available slot found matching Doctor {doctor_name} at {slot_time}."
        }
        
    slot = dict(slot)
    apt_id = f"APT-{datetime.now().strftime('%y%m%d')}-{str(abs(hash(phone_number + slot['id'])))[:4]}"
    now_iso = datetime.now().isoformat()
    
    # 1. Update slot to unavailable
    cursor.execute("UPDATE slots SET is_available = 0, appointment_id = ? WHERE id = ?", (apt_id, slot["id"]))
    
    # 2. Insert appointment
    cursor.execute("""
        INSERT INTO appointments (id, phone_number, doctor_id, doctor_name, specialty, slot_id, date, time, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', ?)
    """, (apt_id, phone_number, slot["doctor_id"], slot["full_doc_name"], slot["specialty"], slot["id"], slot["date"], slot["time"], now_iso))
    
    conn.commit()
    conn.close()
    
    return {
        "success": True,
        "appointment_id": apt_id,
        "doctor_name": slot["full_doc_name"],
        "specialty": slot["specialty"],
        "date": slot["date"],
        "time": slot["time"],
        "phone_number": phone_number,
        "status": "CONFIRMED",
        "message": f"Appointment successfully confirmed with {slot['full_doc_name']} on {slot['date']} at {slot['time']}."
    }

def cancel_appointment_db(phone_number: str, doctor_name: Optional[str] = None, slot_time: Optional[str] = None) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    norm_phone = normalize_phone(phone_number)
    cursor.execute("SELECT * FROM appointments WHERE status = 'CONFIRMED' ORDER BY created_at DESC")
    apts = [dict(r) for r in cursor.fetchall()]
    
    # Find matching appointment by phone number and optional doctor/time
    target_apt = None
    for apt in apts:
        if normalize_phone(apt["phone_number"]) == norm_phone or phone_number in apt["phone_number"]:
            if doctor_name:
                doc_query = doctor_name.lower().replace("dr.", "").replace("doctor", "").strip()
                if doc_query not in apt["doctor_name"].lower():
                    continue
            if slot_time:
                time_query = slot_time.lower().strip()
                if time_query not in apt["time"].lower():
                    continue
            target_apt = apt
            break
            
    if not target_apt:
        conn.close()
        return {
            "success": False,
            "message": f"No active confirmed appointment found for phone number {phone_number}."
        }
        
    # Mark appointment CANCELLED
    cursor.execute("UPDATE appointments SET status = 'CANCELLED' WHERE id = ?", (target_apt["id"],))
    
    # Free the slot back up
    cursor.execute("UPDATE slots SET is_available = 1, appointment_id = NULL WHERE id = ?", (target_apt["slot_id"],))
    
    conn.commit()
    conn.close()
    
    return {
        "success": True,
        "appointment_id": target_apt["id"],
        "doctor_name": target_apt["doctor_name"],
        "specialty": target_apt["specialty"],
        "date": target_apt["date"],
        "time": target_apt["time"],
        "phone_number": phone_number,
        "status": "CANCELLED",
        "message": f"Appointment {target_apt['id']} with {target_apt['doctor_name']} at {target_apt['time']} on {target_apt['date']} has been successfully cancelled."
    }
