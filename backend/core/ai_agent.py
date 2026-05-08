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
    if school_id:
        from schools.models import School
        try:
            school = School.objects.get(id=school_id)
            if school.ai_api_key:
                api_key = school.ai_api_key
        except School.DoesNotExist:
            pass
    if not api_key:
        from core.models import GlobalSetting
        gs = GlobalSetting.objects.first()
        if gs and gs.groq_api_key:
            api_key = gs.groq_api_key
    if not api_key:
        api_key = getattr(settings, 'GROQ_API_KEY', None) or os.getenv("GROQ_API_KEY")
    return Groq(api_key=api_key) if api_key else None

# ───────────── Database Tool Functions ────────────────────────────

def db_add_student(school_id, name, class_name, phone=""):
    try:
        student = Student.objects.create(
            school_id=school_id, name=name, class_name=class_name, phone=phone, status='Active'
        )
        return f"✅ Student '{name}' (Class {class_name}) successfully add ho gaya hai. ID: {student.id}"
    except Exception as e:
        return f"❌ Student add karne mein masla hua: {str(e)}"

def db_add_teacher(school_id, name, subject, phone=""):
    try:
        teacher = Teacher.objects.create(
            school_id=school_id, name=name, subject=subject, phone=phone, status='Active'
        )
        return f"✅ Teacher '{name}' (Subject: {subject}) successfully add ho gaye hain. ID: {teacher.id}"
    except Exception as e:
        return f"❌ Teacher add karne mein masla hua: {str(e)}"

def db_delete_student(school_id, name):
    try:
        count, _ = Student.objects.filter(school_id=school_id, name__icontains=name).delete()
        if count > 0:
            return f"🗑️ {count} student(s) jinka naam '{name}' se milta tha, delete kar diye gaye hain."
        return f"❓ '{name}' naam ka koi student nahi mila."
    except Exception as e:
        return f"❌ Delete karne mein masla hua: {str(e)}"

def db_delete_teacher(school_id, name):
    try:
        count, _ = Teacher.objects.filter(school_id=school_id, name__icontains=name).delete()
        if count > 0:
            return f"🗑️ {count} teacher(s) jinka naam '{name}' se milta tha, delete kar diye gaye hain."
        return f"❓ '{name}' naam ka koi teacher nahi mila."
    except Exception as e:
        return f"❌ Delete karne mein masla hua: {str(e)}"

def get_dashboard_stats(school_id):
    stats = {
        "total_students": Student.objects.filter(school_id=school_id).count(),
        "total_teachers": Teacher.objects.filter(school_id=school_id).count(),
        "fees_collected": Fee.objects.filter(school_id=school_id, status='Paid').aggregate(Sum('amount'))['amount__sum'] or 0,
        "fees_pending": Fee.objects.filter(school_id=school_id, status='Pending').aggregate(Sum('amount'))['amount__sum'] or 0,
        "overdue_count": Fee.objects.filter(school_id=school_id, status='Overdue').count()
    }
    return stats

# ───────────── AI Processing Logic ───────────────────────────────

def process_ai_message(message, school_id):
    if not school_id:
        return "⚠️ School context nahi mila. Please login dobara karein."
    
    client = get_groq_client(school_id)
    if not client:
        return "⚠️ AI API Key missing hai. Please Admin panel se key add karein."

    stats = get_dashboard_stats(school_id)
    
    system_prompt = (
        "You are 'Classora AI', a powerful assistant with administrative powers. "
        "You can perform the following ACTIONS by outputting a specific JSON at the START of your response if needed:\n"
        "1. ADD_STUDENT: {'action': 'add_student', 'name': '...', 'class': '...', 'phone': '...'}\n"
        "2. ADD_TEACHER: {'action': 'add_teacher', 'name': '...', 'subject': '...', 'phone': '...'}\n"
        "3. DELETE_STUDENT: {'action': 'delete_student', 'name': '...'}\n"
        "4. DELETE_TEACHER: {'action': 'delete_teacher', 'name': '...'}\n"
        "\n--- CURRENT DATA ---\n"
        f"- Students: {stats['total_students']}, Teachers: {stats['total_teachers']}\n"
        f"- Fees: Collected RS {stats['fees_collected']}, Pending RS {stats['fees_pending']}\n"
        "\n--- RULES ---\n"
        "1. If the user asks to add or delete, start your response with the JSON command on the first line.\n"
        "2. Then, on the next lines, provide a friendly confirmation in Roman Urdu or English.\n"
        "3. You ONLY have access to students and teachers. You cannot modify fees or school settings.\n"
        "4. If no action is needed, just answer normally."
    )

    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "system", "content": system_prompt}, {"role": "user", "content": message}],
            temperature=0.2, # Low temperature for better JSON accuracy
        )
        ai_response = completion.choices[0].message.content
        
        # Check for JSON action in response
        if ai_response.strip().startswith('{'):
            try:
                # Extract JSON from the first line or block
                first_line = ai_response.split('\n')[0]
                command = json.loads(first_line.replace("'", '"'))
                action = command.get('action')
                result_msg = ""
                
                if action == 'add_student':
                    result_msg = db_add_student(school_id, command['name'], command['class'], command.get('phone', ''))
                elif action == 'add_teacher':
                    result_msg = db_add_teacher(school_id, command['name'], command['subject'], command.get('phone', ''))
                elif action == 'delete_student':
                    result_msg = db_delete_student(school_id, command['name'])
                elif action == 'delete_teacher':
                    result_msg = db_delete_teacher(school_id, command['name'])
                
                # Combine result with AI's friendly text
                friendly_text = "\n".join(ai_response.split('\n')[1:])
                return f"{result_msg}\n\n{friendly_text}"
            except Exception as e:
                return f"⚠️ AI ne command di lekin execute nahi ho saki: {str(e)}\n\nResponse: {ai_response}"
        
        return ai_response
    except Exception as e:
        return f"❌ AI Error: {str(e)}"
