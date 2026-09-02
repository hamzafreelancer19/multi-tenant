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
        return f"👥 Total Staff: {staff.count()}\n" + "\n".join([f"- {s.name} ({s.role})" for s in staff[:10]])
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

# Groq shut down llama-3.1-8b-instant on 16 Aug 2026.
# gpt-oss models native-call tools; pass real tools instead of asking for JSON in text.
GROQ_CHAT_MODELS = (
    "openai/gpt-oss-20b",
    "openai/gpt-oss-120b",
    "qwen/qwen3.6-27b",
)


def _tool(name, description, properties=None, required=None):
    return {
        "type": "function",
        "function": {
            "name": name,
            "description": description,
            "parameters": {
                "type": "object",
                "properties": properties or {},
                "required": required or [],
            },
        },
    }


PLATFORM_TOOLS = [
    _tool("list_schools", "List recent schools on the platform."),
    _tool("pending_schools", "List schools waiting for approval."),
    _tool("pending_plans", "List schools with pending plan payments."),
    _tool("find_school", "Find a school by name, code, or domain.", {"name": {"type": "string"}}, ["name"]),
    _tool("list_admins", "List school admin accounts."),
    _tool(
        "navigate",
        "Open a superadmin page.",
        {"path": {"type": "string", "description": "/schools, /security, /users, /database, /platform-settings, /dashboard, or /schools/<id>"}},
        ["path"],
    ),
    _tool("toggle_theme", "Toggle light or dark theme."),
]

SCHOOL_TOOLS = [
    _tool("add_student", "Add a student.", {"name": {"type": "string"}, "class": {"type": "string"}, "phone": {"type": "string"}}, ["name", "class"]),
    _tool("add_teacher", "Add a teacher.", {"name": {"type": "string"}, "subject": {"type": "string"}, "phone": {"type": "string"}}, ["name", "subject"]),
    _tool("delete_student", "Delete students matching a name.", {"name": {"type": "string"}}, ["name"]),
    _tool("delete_teacher", "Delete teachers matching a name.", {"name": {"type": "string"}}, ["name"]),
    _tool("add_notice", "Post a school notice.", {"title": {"type": "string"}, "content": {"type": "string"}}, ["title", "content"]),
    _tool("add_exam", "Schedule an exam.", {"title": {"type": "string"}, "class": {"type": "string"}, "start": {"type": "string"}, "end": {"type": "string"}}, ["title", "class", "start", "end"]),
    _tool("get_fee", "Look up a student's fees.", {"name": {"type": "string"}}, ["name"]),
    _tool("get_attendance", "Today's attendance summary.", {"class": {"type": "string"}}),
    _tool("get_inventory", "Inventory summary."),
    _tool("get_staff", "Staff list."),
    _tool("get_transport", "Transport routes."),
    _tool("navigate", "Open a school dashboard page.", {"path": {"type": "string"}}, ["path"]),
    _tool("toggle_theme", "Toggle light or dark theme."),
]


def _parse_jsonish(raw):
    if isinstance(raw, dict):
        return raw
    if not raw:
        return {}
    text = str(raw).strip()
    try:
        data = json.loads(text)
        return data if isinstance(data, dict) else {}
    except json.JSONDecodeError:
        try:
            data = json.loads(text.replace("'", '"'))
            return data if isinstance(data, dict) else {}
        except json.JSONDecodeError:
            return {}


def _command_from_tool(name, arguments):
    args = _parse_jsonish(arguments)
    action = name if name and name not in {"assistant", "functions", "function"} else args.get("action")
    if not action:
        return None
    cmd = {"action": action}
    for key, value in args.items():
        if key != "action":
            cmd[key] = value
    return cmd


def _command_from_exception(exc):
    failed = None
    body = getattr(exc, "body", None)
    if isinstance(body, dict):
        err = body.get("error") if isinstance(body.get("error"), dict) else body
        failed = err.get("failed_generation") if isinstance(err, dict) else None
    if not failed:
        text = str(exc)
        marker = "failed_generation"
        if marker in text:
            start = text.find("{", text.find(marker))
            if start >= 0:
                depth = 0
                for i, ch in enumerate(text[start:], start):
                    if ch == "{":
                        depth += 1
                    elif ch == "}":
                        depth -= 1
                        if depth == 0:
                            failed = text[start:i + 1]
                            break
    if not failed:
        return None
    data = _parse_jsonish(failed)
    return _command_from_tool(data.get("name"), data.get("arguments") or data)


def _message_text(message):
    content = getattr(message, "content", None) or ""
    if isinstance(content, list):
        bits = []
        for part in content:
            if isinstance(part, dict):
                bits.append(part.get("text") or "")
            else:
                bits.append(getattr(part, "text", None) or str(part))
        content = "".join(bits)
    content = str(content).strip()
    if content:
        return content
    reasoning = getattr(message, "reasoning", None) or getattr(message, "reasoning_content", None)
    return str(reasoning or "").strip()


def _groq_chat(client, messages, tools=None):
    last_error = None
    extra = {"temperature": 0.2, "max_tokens": 2048}
    if tools:
        extra["tools"] = tools
        extra["tool_choice"] = "auto"
    for model in GROQ_CHAT_MODELS:
        try:
            completion = client.chat.completions.create(
                model=model,
                messages=messages,
                **extra,
            )
            msg = completion.choices[0].message
            spoken = _message_text(msg)
            command = None
            for call in getattr(msg, "tool_calls", None) or []:
                fn = getattr(call, "function", None) or call
                command = _command_from_tool(getattr(fn, "name", None), getattr(fn, "arguments", None))
                if command:
                    break
            if command:
                return json.dumps(command) + (("\n\n" + spoken) if spoken else "")
            if spoken:
                return spoken
            last_error = RuntimeError(f"{model} returned an empty reply")
        except Exception as e:
            recovered = _command_from_exception(e)
            if recovered:
                return json.dumps(recovered)
            err = str(e).lower()
            last_error = e
            if "model_not_found" in err or "does not exist" in err or "404" in err:
                continue
            if "tool_use_failed" in err or "tool choice is none" in err:
                continue
            raise
    raise last_error


# ───────────── AI Processing Logic ───────────────────────────────

def process_ai_message(message, school_id, history=None):
    if not school_id:
        return {"reply": "⚠️ School context nahi mila. Please login dobara karein."}
    
    client = get_groq_client(school_id)
    if not client:
        return {"reply": "⚠️ AI API Key missing hai. Please Admin panel se key add karein."}

    stats = get_dashboard_stats(school_id)
    
    system_prompt = (
        "You are 'Classora AI', a professional school management assistant.\n\n"
        "### CURRENT SCHOOL STATS\n"
        f"- Total Students: {stats['total_students']}, Total Teachers: {stats['total_teachers']}\n"
        f"- Fees Collected: RS {stats['fees_collected']}, Pending: RS {stats['fees_pending']}\n"
        "\n### TOOLS\n"
        "Use the provided tools when you need to change data or open a page. "
        "Do not print JSON. For simple questions, answer from the stats above.\n"
        "\n### STRICT RULES (PERSONA)\n"
        "1. **GREETING POLICY**: Use 'Assalam-o-Alaikum' ONLY ONCE at the very start of the conversation. If you have already greeted the user in the history, DO NOT repeat it. For follow-up queries, jump straight to the answer.\n"
        "2. **LANGUAGE**: Respond in the same language as the user (English or Roman Urdu).\n"
        "3. **SCOPE**: Strictly School Management only. Refuse unrelated topics sternly.\n"
        "4. **CLEANLINESS**: Never show JSON code in your friendly text.\n"
    )

    # Build messages with history
    messages = [{"role": "system", "content": system_prompt}]
    if history:
        for msg in history[-5:]: # Last 5 messages for context
            role = "user" if msg.get("sender") == "user" else "assistant"
            messages.append({"role": role, "content": msg.get("text", "")})
    
    messages.append({"role": "user", "content": message})

    try:
        ai_response = _groq_chat(client, messages, tools=SCHOOL_TOOLS)
        
        response_data = {"reply": ai_response, "action": None}
        
        if ai_response.startswith('{'):
            try:
                # Split at first double newline or first single newline if no double
                parts = ai_response.split('\n\n', 1)
                if len(parts) < 2:
                    parts = ai_response.split('\n', 1)
                
                json_part = parts[0]
                text_part = parts[1] if len(parts) > 1 else ""
                
                command = json.loads(json_part.replace("'", '"'))
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
                elif action in ['navigate', 'toggle_theme']:
                    response_data["action"] = command
                
                # Clean Reply
                if result_msg:
                    response_data["reply"] = f"{result_msg}\n\n{text_part}".strip()
                else:
                    response_data["reply"] = text_part.strip() or "Task complete ho gaya hai."
                
                # If theme or navigate, we might need to keep the command for frontend
                if action in ['navigate', 'toggle_theme']:
                    response_data["action"] = command

            except Exception as e:
                response_data["reply"] = ai_response.split('\n', 1)[-1] if '\n' in ai_response else ai_response
        
        return response_data
    except Exception as e:
        return {"reply": f"❌ Error: {str(e)}"}


def _history_messages(history):
    messages = []
    if not history:
        return messages
    for msg in history[-5:]:
        role = "user" if msg.get("sender") == "user" else "assistant"
        messages.append({"role": role, "content": msg.get("text", "")})
    return messages


def get_platform_snapshot():
    from django.contrib.auth import get_user_model
    from schools.models import School
    from core.models import GlobalSetting

    User = get_user_model()
    gs = GlobalSetting.load()
    plan_rows = list(
        School.objects.values("plan_type").annotate(c=Count("id")).order_by("-c")
    )
    plans = ", ".join(f"{row['plan_type'] or 'None'} ({row['c']})" for row in plan_rows) or "none"
    return (
        f"Platform: {gs.name}\n"
        f"- Signups open: {'yes' if gs.allow_signup else 'no'}\n"
        f"- Maintenance mode: {'ON' if gs.maintenance_mode else 'off'}\n"
        f"- Support: {gs.support_email or '—'} / {gs.support_phone or '—'}\n"
        f"- Schools: {School.objects.count()} (Pending {School.objects.filter(status='Pending').count()}, "
        f"Approved {School.objects.filter(status='Approved').count()}, "
        f"Rejected {School.objects.filter(status='Rejected').count()})\n"
        f"- Pending plan payments: {School.objects.filter(plan_status='Pending').count()}\n"
        f"- Active plans: {School.objects.filter(plan_status='Active').count()}\n"
        f"- Plan mix: {plans}\n"
        f"- Users: {User.objects.count()} (school admins {User.objects.filter(role='admin', school__isnull=False).count()})"
    )


def platform_list_schools(limit=12):
    from schools.models import School
    rows = School.objects.all().order_by("-created_at")[:limit]
    if not rows:
        return "Koi school registered nahi hai."
    lines = [f"🏫 Latest {rows.count()} schools:"]
    for s in rows:
        lines.append(
            f"- #{s.id} {s.name} · {s.status} · plan {s.plan_type or 'None'} ({s.plan_status})"
        )
    return "\n".join(lines)


def platform_pending_schools():
    from schools.models import School
    rows = School.objects.filter(status="Pending").order_by("-created_at")[:20]
    if not rows:
        return "✅ Koi pending school nahi. Sab review ho chuke hain."
    lines = [f"⏳ {rows.count()} school(s) approval ka wait kar rahe hain:"]
    for s in rows:
        lines.append(f"- #{s.id} {s.name} · {s.domain or 'no domain'} · {s.created_at:%d %b %Y}")
    lines.append("Approve/reject Security page se karo: /security")
    return "\n".join(lines)


def platform_pending_plans():
    from schools.models import School
    rows = School.objects.filter(plan_status="Pending").order_by("-created_at")[:20]
    if not rows:
        return "✅ Koi pending plan payment nahi."
    lines = [f"💳 {rows.count()} plan payment(s) review ke wait par hain:"]
    for s in rows:
        lines.append(
            f"- #{s.id} {s.name} · {s.plan_type} · Rs {s.plan_amount} · txn {s.transaction_id or '—'}"
        )
    lines.append("Review Security page se: /security")
    return "\n".join(lines)


def platform_find_school(name):
    from schools.models import School
    from django.contrib.auth import get_user_model

    User = get_user_model()
    q = (name or "").strip()
    if not q:
        return "School ka naam batao."
    rows = School.objects.filter(Q(name__icontains=q) | Q(code__icontains=q) | Q(domain__icontains=q))[:8]
    if not rows:
        return f"❓ '{q}' se koi school nahi mila."
    lines = []
    for s in rows:
        admins = list(
            User.objects.filter(school=s, role="admin").values_list("username", flat=True)[:5]
        )
        lines.append(
            f"🏫 #{s.id} {s.name}\n"
            f"- Status: {s.status} · Plan: {s.plan_type or 'None'} ({s.plan_status})\n"
            f"- Domain: {s.domain or '—'} · Code: {s.code or '—'}\n"
            f"- Admins: {', '.join(admins) or 'none'}\n"
            f"- Open: /schools/{s.id}"
        )
    return "\n\n".join(lines)


def platform_list_admins():
    from django.contrib.auth import get_user_model
    User = get_user_model()
    rows = User.objects.filter(role="admin", school__isnull=False).select_related("school").order_by("-date_joined")[:15]
    if not rows:
        return "Koi school admin nahi mila."
    lines = ["👤 Latest school admins:"]
    for u in rows:
        lines.append(
            f"- {u.username} · {u.school.name if u.school else '—'} · "
            f"{'active' if u.is_active else 'disabled'}"
        )
    return "\n".join(lines)


def process_platform_message(message, history=None):
    client = get_groq_client(None)
    if not client:
        return {"reply": "⚠️ Platform Groq API key missing hai. Platform Settings se key add karein."}

    snapshot = get_platform_snapshot()
    system_prompt = (
        "You are 'Classora Platform AI', assistant for the superadmin of the Classora school SaaS.\n\n"
        "### LIVE PLATFORM SNAPSHOT\n"
        f"{snapshot}\n"
        "\n### TOOLS\n"
        "Use the provided tools for lists, school lookup, navigation, or theme. "
        "Do not print JSON. If the snapshot already answers the question, reply in plain text.\n"
        "\n### STRICT RULES\n"
        "1. You help with platform ops only: schools, admins, plans, security, database explorer, platform settings.\n"
        "2. Do NOT add/delete students, teachers, fees, or school records. Superadmin does not run a campus.\n"
        "3. Do NOT approve/reject/suspend from chat. Tell the user to open /security or /schools/<id>.\n"
        "4. Greeting: Assalam-o-Alaikum only once at the start of a new conversation.\n"
        "5. Match the user's language (English or Roman Urdu).\n"
        "6. Never show raw JSON in the friendly text.\n"
        "7. To open Security use the navigate tool with path /security.\n"
    )

    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(_history_messages(history))
    messages.append({"role": "user", "content": message})

    try:
        ai_response = _groq_chat(client, messages, tools=PLATFORM_TOOLS)
        response_data = {"reply": ai_response, "action": None}

        raw = ai_response.strip()
        if raw.startswith("```"):
            raw = raw.strip("`")
            if raw.lower().startswith("json"):
                raw = raw[4:].lstrip()

        if raw.startswith("{"):
            try:
                parts = raw.split("\n\n", 1)
                if len(parts) < 2:
                    parts = raw.split("\n", 1)
                json_part = parts[0]
                text_part = parts[1] if len(parts) > 1 else ""
                command = json.loads(json_part.replace("'", '"'))
                action = command.get("action")
                result_msg = ""

                if action == "list_schools":
                    result_msg = platform_list_schools()
                elif action == "pending_schools":
                    result_msg = platform_pending_schools()
                elif action == "pending_plans":
                    result_msg = platform_pending_plans()
                elif action == "find_school":
                    result_msg = platform_find_school(command.get("name") or command.get("school") or "")
                elif action == "list_admins":
                    result_msg = platform_list_admins()
                elif action in ("navigate", "toggle_theme"):
                    path = str(command.get("path") or "")
                    allowed_roots = (
                        "/schools", "/users", "/security", "/database",
                        "/platform-settings", "/dashboard",
                    )
                    if action == "navigate" and not any(
                        path == root or path.startswith(root + "/") for root in allowed_roots
                    ):
                        result_msg = "Woh page platform assistant ke scope mein nahi hai."
                        command = None
                    else:
                        response_data["action"] = command

                if result_msg:
                    response_data["reply"] = f"{result_msg}\n\n{text_part}".strip()
                elif action in ("navigate", "toggle_theme"):
                    response_data["reply"] = text_part.strip() or "Opening that page."
                else:
                    response_data["reply"] = text_part.strip() or ai_response
            except Exception:
                response_data["reply"] = ai_response.split("\n", 1)[-1] if "\n" in ai_response else ai_response

        return response_data
    except Exception as e:
        return {"reply": f"❌ Error: {str(e)}"}
