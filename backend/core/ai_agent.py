import json
import os
from django.db.models import Sum, Count, Q
from django.conf import settings
from groq import Groq

from students.models import Student
from teachers.models import Teacher
from fees.models import Fee
from notices.models import Notice
from attendance.models import Attendance
from django.utils import timezone

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

from inventory.models import InventoryItem

from exams.models import Exam, ExamResult

from staff.models import Staff
from transport.models import Route

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

def db_add_notice(school_id, title, content):
    try:
        notice = Notice.objects.create(school_id=school_id, title=title, content=content)
        return f"📢 Notice '{title}' successfully post ho gaya hai."
    except Exception as e:
        return f"❌ Notice post karne mein masla hua: {str(e)}"

def db_add_exam(school_id, title, class_name, start_date, end_date):
    try:
        exam = Exam.objects.create(
            school_id=school_id, title=title, class_name=class_name, 
            start_date=start_date, end_date=end_date, exam_type='Other'
        )
        return f"📝 Exam '{title}' for Class {class_name} schedule ho gaya hai."
    except Exception as e:
        return f"❌ Exam add karne mein masla hua: {str(e)}"

def get_student_fees(school_id, name):
    try:
        students = Student.objects.filter(school_id=school_id, name__icontains=name)
        if not students.exists():
            return f"❓ '{name}' naam ka koi student nahi mila."
        
        report = []
        for s in students:
            fees = Fee.objects.filter(school_id=school_id, student=s)
            total_pending = fees.exclude(status='Paid').aggregate(Sum('amount'))['amount__sum'] or 0
            status_list = ", ".join([f"{f.amount} ({f.status})" for f in fees[:3]])
            report.append(f"👤 {s.name} (Class {s.class_name}): Pending Fees RS {total_pending}. Recent: {status_list}")
        
        return "\n".join(report)
    except Exception as e:
        return f"❌ Fee check karne mein masla hua: {str(e)}"

def get_attendance_summary(school_id, class_name=None):
    try:
        today = timezone.now().date()
        query = Q(school_id=school_id, date=today)
        if class_name:
            query &= Q(student__class_name__icontains=class_name)
            
        attendance = Attendance.objects.filter(query)
        total = attendance.count()
        present = attendance.filter(status='Present').count()
        absent = attendance.filter(status='Absent').count()
        
        if total == 0:
            return "📅 Aaj ki attendance abhi tak mark nahi hui."
        
        return f"📊 Attendance Summary ({today}):\n- Total Records: {total}\n- Present: {present}\n- Absent: {absent}\n- Percentage: {round((present/total)*100)}%"
    except Exception as e:
        return f"❌ Attendance report generate karne mein masla hua: {str(e)}"

def get_inventory_summary(school_id):
    try:
        items = InventoryItem.objects.filter(school_id=school_id)
        if not items.exists():
            return "📦 Inventory mein koi item nahi hai."
        
        summary = ["📦 Inventory Summary:"]
        for item in items:
            summary.append(f"- {item.item_name}: {item.quantity} available")
        return "\n".join(summary)
    except Exception as e:
        return f"❌ Inventory check karne mein masla hua: {str(e)}"

def get_staff_info(school_id):
    try:
        staff = Staff.objects.filter(school_id=school_id)
        if not staff.exists():
            return "👥 Staff records nahi mile."
        return f"👥 Total Staff: {staff.count()}\n" + "\n".join([f"- {s.name} ({s.designation})" for s in staff[:10]])
    except Exception as e:
        return f"❌ Staff info check karne mein masla hua: {str(e)}"

def get_transport_info(school_id):
    try:
        routes = Route.objects.filter(school_id=school_id)
        if not routes.exists():
            return "🚌 Transport routes nahi milin."
        return f"🚌 Total Routes: {routes.count()}\n" + "\n".join([f"- {r.route_name} (Fee: {r.monthly_fee})" for r in routes])
    except Exception as e:
        return f"❌ Transport info check karne mein masla hua: {str(e)}"

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
        return {"reply": "⚠️ School context nahi mila. Please login dobara karein."}
    
    client = get_groq_client(school_id)
    if not client:
        return {"reply": "⚠️ AI API Key missing hai. Please Admin panel se key add karein."}

    stats = get_dashboard_stats(school_id)
    
    system_prompt = (
        "You are 'Classora AI', the ULTIMATE school administrator assistant. You have FULL CONTROL over the school's data and UI.\n\n"
        "### CAPABILITIES (JSON ACTIONS)\n"
        "To perform an action, output a JSON command on the FIRST LINE of your response:\n"
        "1. ADD_STUDENT: {'action': 'add_student', 'name': '...', 'class': '...', 'phone': '...'}\n"
        "2. ADD_TEACHER: {'action': 'add_teacher', 'name': '...', 'subject': '...', 'phone': '...'}\n"
        "3. DELETE_STUDENT/TEACHER: {'action': 'delete_student', 'name': '...'} or {'action': 'delete_teacher', 'name': '...'}\n"
        "4. ADD_NOTICE: {'action': 'add_notice', 'title': '...', 'content': '...'}\n"
        "5. ADD_EXAM: {'action': 'add_exam', 'title': '...', 'class': '...', 'start': 'YYYY-MM-DD', 'end': 'YYYY-MM-DD'}\n"
        "6. GET_DATA: {'action': 'get_fee', 'name': '...'} or {'action': 'get_attendance', 'class': '...'} or {'action': 'get_inventory'} or {'action': 'get_staff'} or {'action': 'get_transport'}\n"
        "7. NAVIGATION (UI): {'action': 'navigate', 'path': '/dashboard/students'} - Use this to open pages for the user.\n"
        "8. THEME (UI): {'action': 'theme', 'color': '#hex'} - Use this to change the school's brand color.\n"
        "\n### NAVIGATION PATHS\n"
        "- Students: /dashboard/students, Teachers: /dashboard/teachers, Attendance: /dashboard/attendance\n"
        "- Fees: /dashboard/fees, Exams: /dashboard/exams, Inventory: /dashboard/inventory, Notices: /dashboard/notices\n"
        "- Staff: /dashboard/staff, Transport: /dashboard/transport\n"
        "\n### CURRENT STATS\n"
        f"- Students: {stats['total_students']}, Teachers: {stats['total_teachers']}, Fees collected: RS {stats['fees_collected']}\n"
        "\n### RULES\n"
        "1. If the user asks to 'go to', 'open', or 'show' a page, use the 'navigate' action.\n"
        "2. If the user asks to 'change theme' or 'change color', use the 'theme' action.\n"
        "3. ALWAYS start with the JSON command if an action is requested.\n"
        "4. Your tone should be extremely helpful, like a personal chief of staff.\n"
    )

    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "system", "content": system_prompt}, {"role": "user", "content": message}],
            temperature=0.2,
        )
        ai_response = completion.choices[0].message.content
        
        response_data = {"reply": ai_response, "action": None}
        
        if ai_response.strip().startswith('{'):
            try:
                lines = ai_response.split('\n')
                command = json.loads(lines[0].replace("'", '"'))
                action = command.get('action')
                result_msg = ""
                
                # DB Actions
                if action == 'add_student':
                    result_msg = db_add_student(school_id, command['name'], command['class'], command.get('phone', ''))
                elif action == 'add_teacher':
                    result_msg = db_add_teacher(school_id, command['name'], command['subject'], command.get('phone', ''))
                elif action == 'delete_student':
                    result_msg = db_delete_student(school_id, command['name'])
                elif action == 'delete_teacher':
                    result_msg = db_delete_teacher(school_id, command['name'])
                elif action == 'add_notice':
                    result_msg = db_add_notice(school_id, command['title'], command['content'])
                elif action == 'add_exam':
                    result_msg = db_add_exam(school_id, command['title'], command['class'], command['start'], command['end'])
                elif action == 'get_fee':
                    result_msg = get_student_fees(school_id, command['name'])
                elif action == 'get_attendance':
                    result_msg = get_attendance_summary(school_id, command.get('class'))
                elif action == 'get_inventory':
                    result_msg = get_inventory_summary(school_id)
                elif action == 'get_staff':
                    result_msg = get_staff_info(school_id)
                elif action == 'get_transport':
                    result_msg = get_transport_info(school_id)
                
                # UI Actions (Passed to frontend)
                elif action in ['navigate', 'theme']:
                    response_data["action"] = command
                
                friendly_text = "\n".join(lines[1:])
                response_data["reply"] = f"{result_msg}\n\n{friendly_text}".strip() if result_msg else friendly_text.strip()
                if not response_data["reply"]:
                    response_data["reply"] = ai_response # Fallback
                
            except Exception as e:
                response_data["reply"] = f"⚠️ AI command error: {str(e)}\n\n{ai_response}"
        
        return response_data
    except Exception as e:
        return {"reply": f"❌ AI Error: {str(e)}"}
