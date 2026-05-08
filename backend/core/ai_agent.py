import re
import json
import os
from django.db.models import Sum, Count, Q
from django.conf import settings
from groq import Groq

from students.models import Student
from teachers.models import Teacher
from fees.models import Fee

# Initialize Groq client
def get_groq_client(school_id=None):
    api_key = None
    
    # 1. Try to get key from specific school in DB
    if school_id:
        from schools.models import School
        try:
            school = School.objects.get(id=school_id)
            if school.ai_api_key:
                api_key = school.ai_api_key
        except School.DoesNotExist:
            pass

    # 2. Fallback to settings/env if no school-specific key
    if not api_key:
        api_key = getattr(settings, 'GROQ_API_KEY', None) or os.getenv("GROQ_API_KEY")
    
    if not api_key:
        return None
    return Groq(api_key=api_key)

# ───────────── Database Functions ─────────────────────────────────

def get_dashboard_stats(school_id):
    total_students = Student.objects.filter(school_id=school_id).count()
    total_teachers = Teacher.objects.filter(school_id=school_id).count()
    total_fees = Fee.objects.filter(school_id=school_id, status='Paid').aggregate(Sum('amount'))['amount__sum'] or 0
    pending_fees = Fee.objects.filter(school_id=school_id, status='Pending').aggregate(Sum('amount'))['amount__sum'] or 0
    overdue = Fee.objects.filter(school_id=school_id, status='Overdue').count()
    return {
        "total_students": total_students,
        "total_teachers": total_teachers,
        "fees_collected": total_fees,
        "fees_pending": pending_fees,
        "overdue_count": overdue
    }

def search_student(school_id, query):
    students = Student.objects.filter(
        school_id=school_id
    ).filter(
        Q(name__icontains=query) | Q(roll_no__icontains=query) | Q(class_name__icontains=query)
    )[:5]
    return list(students.values('name', 'class_name', 'roll_no', 'status'))

# ───────────── LLM Based Processor ───────────────────────────────

def process_ai_message(message, school_id):
    if not school_id:
        return "⚠️ School context nahi mila. Please login dobara karein."
    
    client = get_groq_client(school_id)
    if not client:
        return "⚠️ AI Assistant ki API Key missing hai. Please admin se rabta karein."

    # 1. Fetch current context data for the school
    stats = get_dashboard_stats(school_id)
    
    # 2. Build the system prompt
    system_prompt = (
        "You are 'Classora AI', a professional assistant for the Classora School Management System. "
        "Your task is to help school staff with information and management tasks. "
        "You only have access to the specific statistics and data provided in this prompt. "
        "\n\n--- SCHOOL STATS ---\n"
        f"- Total Students: {stats['total_students']}\n"
        f"- Total Teachers: {stats['total_teachers']}\n"
        f"- Fees Collected: RS {stats['fees_collected']:,}\n"
        f"- Fees Pending: RS {stats['fees_pending']:,}\n"
        f"- Overdue Cases: {stats['overdue_count']}\n"
        "\n--- GUIDELINES ---\n"
        "1. Answer in the language the user uses (English, Urdu, or Roman Urdu).\n"
        "2. Be extremely helpful but maintain school-only scope.\n"
        "3. If asked to 'add' or 'delete' something, explain that you are a read-only assistant."
    )

    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ],
            temperature=0.6,
            max_tokens=800,
        )
        return completion.choices[0].message.content
    except Exception as e:
        return f"❌ AI Connection Error: {str(e)}"
