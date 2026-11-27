import sqlite3
from datetime import datetime, date

def seed_database(conn: sqlite3.Connection):
    """Seed the database with rich clinical data: doctors across specialties and slots."""
    cursor = conn.cursor()
    
    today_str = "Today (" + datetime.now().strftime("%b %d") + ")"
    tomorrow_str = "Tomorrow (" + datetime.now().strftime("%b %d") + ")"
    
    doctors = [
        (
            "doc-1",
            "Dr. Sarah Chen",
            "Cardiology",
            "Nexov Heart & Vascular Center",
            4.95,
            "14 years",
            "Specializes in preventive cardiology, echocardiography, and hypertension management.",
            "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300"
        ),
        (
            "doc-2",
            "Dr. Marcus Vance",
            "Dermatology",
            "Advanced Skin & Aesthetics Clinic",
            4.89,
            "11 years",
            "Expertise in clinical dermatology, skin cancer screenings, and eczema therapies.",
            "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300"
        ),
        (
            "doc-3",
            "Dr. Priya Patel",
            "General Medicine",
            "Nexov Primary Care Pavilion",
            4.98,
            "16 years",
            "Comprehensive adult care, preventative medicine, diabetes, and metabolic health.",
            "https://images.unsplash.com/photo-1651008376811-b90baee60c1f?auto=format&fit=crop&q=80&w=300"
        ),
        (
            "doc-4",
            "Dr. David Kim",
            "Orthopedics",
            "Spine & Joint Institute",
            4.91,
            "12 years",
            "Board-certified orthopedic surgeon focusing on sports injuries and joint health.",
            "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300"
        ),
        (
            "doc-5",
            "Dr. Elena Rostova",
            "Pediatrics",
            "Children's Health & Wellness Wing",
            4.97,
            "9 years",
            "Dedicated pediatrician providing compassionate developmental and primary pediatric care.",
            "https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&q=80&w=300"
        )
    ]
    
    cursor.executemany("""
        INSERT INTO doctors (id, name, specialty, hospital, rating, experience, bio, avatar_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, doctors)
    
    # Slots for each doctor across Today and Tomorrow
    slots = [
        # Dr. Sarah Chen (Cardiology)
        ("slot-101", "doc-1", "Dr. Sarah Chen", today_str, "09:30 AM", 1, None),
        ("slot-102", "doc-1", "Dr. Sarah Chen", today_str, "11:00 AM", 1, None),
        ("slot-103", "doc-1", "Dr. Sarah Chen", today_str, "02:30 PM", 1, None),
        ("slot-104", "doc-1", "Dr. Sarah Chen", tomorrow_str, "10:00 AM", 1, None),
        ("slot-105", "doc-1", "Dr. Sarah Chen", tomorrow_str, "03:30 PM", 1, None),
        
        # Dr. Marcus Vance (Dermatology)
        ("slot-201", "doc-2", "Dr. Marcus Vance", today_str, "10:15 AM", 1, None),
        ("slot-202", "doc-2", "Dr. Marcus Vance", today_str, "01:45 PM", 1, None),
        ("slot-203", "doc-2", "Dr. Marcus Vance", today_str, "04:00 PM", 1, None),
        ("slot-204", "doc-2", "Dr. Marcus Vance", tomorrow_str, "11:30 AM", 1, None),
        
        # Dr. Priya Patel (General Medicine)
        ("slot-301", "doc-3", "Dr. Priya Patel", today_str, "09:00 AM", 1, None),
        ("slot-302", "doc-3", "Dr. Priya Patel", today_str, "11:30 AM", 1, None),
        ("slot-303", "doc-3", "Dr. Priya Patel", today_str, "03:00 PM", 1, None),
        ("slot-304", "doc-3", "Dr. Priya Patel", tomorrow_str, "09:00 AM", 1, None),
        ("slot-305", "doc-3", "Dr. Priya Patel", tomorrow_str, "01:15 PM", 1, None),
        
        # Dr. David Kim (Orthopedics)
        ("slot-401", "doc-4", "Dr. David Kim", today_str, "10:30 AM", 1, None),
        ("slot-402", "doc-4", "Dr. David Kim", today_str, "02:00 PM", 1, None),
        ("slot-403", "doc-4", "Dr. David Kim", tomorrow_str, "02:30 PM", 1, None),
        
        # Dr. Elena Rostova (Pediatrics)
        ("slot-501", "doc-5", "Dr. Elena Rostova", today_str, "11:00 AM", 1, None),
        ("slot-502", "doc-5", "Dr. Elena Rostova", today_str, "04:30 PM", 1, None),
        ("slot-503", "doc-5", "Dr. Elena Rostova", tomorrow_str, "10:00 AM", 1, None),
        ("slot-504", "doc-5", "Dr. Elena Rostova", tomorrow_str, "03:00 PM", 1, None),
    ]
    
    cursor.executemany("""
        INSERT INTO slots (id, doctor_id, doctor_name, date, time, is_available, appointment_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, slots)
    
    # Pre-seed one sample appointment to show cancellation works right away if tested
    sample_apt_id = "APT-261127-1099"
    now_iso = datetime.now().isoformat()
    cursor.execute("""
        INSERT INTO appointments (id, phone_number, doctor_id, doctor_name, specialty, slot_id, date, time, status, created_at, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', ?, ?)
    """, (
        sample_apt_id,
        "555-0199",
        "doc-3",
        "Dr. Priya Patel",
        "General Medicine",
        "slot-302",
        today_str,
        "11:30 AM",
        now_iso,
        "Pre-existing routine checkup"
    ))
    cursor.execute("UPDATE slots SET is_available = 0, appointment_id = ? WHERE id = 'slot-302'", (sample_apt_id,))
    
    conn.commit()
