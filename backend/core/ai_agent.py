"""
Smart AI School Assistant - No external API needed!
Uses intelligent keyword matching + NLP-like pattern recognition
to understand commands and interact with the school database.
"""

import re
import json
from django.db.models import Sum, Count, Q

from students.models import Student
from teachers.models import Teacher
from fees.models import Fee


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


def add_student_to_db(school_id, name, class_name, phone=None):
    student = Student.objects.create(
        school_id=school_id,
        name=name,
        class_name=class_name,
        phone=phone or "",
        status='Active'
    )
    return student


def get_students_list(school_id, class_name=None, limit=20):
    qs = Student.objects.filter(school_id=school_id)
    if class_name:
        qs = qs.filter(class_name__icontains=class_name)
    return list(qs.values('id', 'name', 'class_name', 'roll_no', 'phone', 'status')[:limit])


def get_teachers_list(school_id, limit=20):
    qs = Teacher.objects.filter(school_id=school_id)
    return list(qs.values('id', 'name', 'subject', 'phone', 'status')[:limit])


def get_unpaid_fees_list(school_id):
    unpaid = Fee.objects.filter(
        school_id=school_id, status__in=['Pending', 'Overdue']
    ).select_related('student')
    result = []
    for f in unpaid:
        result.append({
            "student": f.student.name,
            "class": f.student.class_name,
            "amount": f.amount,
            "status": f.status,
            "phone": f.student.phone or ""
        })
    return result


def record_fee_payment(school_id, student_name, amount, status='Paid'):
    student = Student.objects.filter(school_id=school_id, name__icontains=student_name).first()
    if not student:
        return None, f"❌ '{student_name}' naam ka koi student nahi mila."
    fee = Fee.objects.create(
        school_id=school_id,
        student=student,
        amount=amount,
        status=status,
    )
    return fee, None


def search_student(school_id, query):
    students = Student.objects.filter(
        school_id=school_id
    ).filter(
        Q(name__icontains=query) | Q(roll_no__icontains=query) | Q(class_name__icontains=query)
    )[:10]
    return list(students.values('id', 'name', 'class_name', 'roll_no', 'phone', 'status'))


# ───────────── Command Parser ────────────────────────────────────

CLASS_MAP = {
    "nursery": "Nursery", "prep": "Prep",
    "1": "Grade 1", "2": "Grade 2", "3": "Grade 3", "4": "Grade 4",
    "5": "Grade 5", "6": "Grade 6", "7": "Grade 7", "8": "Grade 8",
    "9": "Grade 9", "10": "Grade 10", "11": "Grade 11", "12": "Grade 12",
    "grade 1": "Grade 1", "grade 2": "Grade 2", "grade 3": "Grade 3",
    "grade 4": "Grade 4", "grade 5": "Grade 5", "grade 6": "Grade 6",
    "grade 7": "Grade 7", "grade 8": "Grade 8", "grade 9": "Grade 9",
    "grade 10": "Grade 10", "grade 11": "Grade 11", "grade 12": "Grade 12",
    "class 1": "Grade 1", "class 2": "Grade 2", "class 3": "Grade 3",
    "class 4": "Grade 4", "class 5": "Grade 5", "class 6": "Grade 6",
    "class 7": "Grade 7", "class 8": "Grade 8", "class 9": "Grade 9",
    "class 10": "Grade 10", "class 11": "Grade 11", "class 12": "Grade 12",
}


def normalize_class(text):
    """Convert various class formats to standard format."""
    text = text.strip().lower()
    return CLASS_MAP.get(text, text.title())


def extract_class_from_message(msg):
    """Try to extract a class name from a message."""
    # Match patterns like "class 5", "grade 10", "nursery", "prep"
    patterns = [
        r'(?:class|grade|klass)\s*(\d{1,2})',
        r'(nursery|prep)',
        r'(?:in|to|mein|ma|ki)\s+(\d{1,2})(?:\s|$)',
    ]
    for p in patterns:
        m = re.search(p, msg, re.IGNORECASE)
        if m:
            return normalize_class(m.group(1) if m.group(1) else m.group(0))
    return None


def extract_name_from_message(msg, command_words):
    """Try to extract a person's name from a message after removing command words."""
    clean = msg
    for w in command_words:
        clean = re.sub(re.escape(w), '', clean, flags=re.IGNORECASE)
    
    # Remove class references
    clean = re.sub(r'(?:class|grade|klass)\s*\d{1,2}', '', clean, flags=re.IGNORECASE)
    clean = re.sub(r'(?:in|to|mein|ma|ki)\s+\d{1,2}', '', clean, flags=re.IGNORECASE)
    clean = re.sub(r'\b(nursery|prep)\b', '', clean, flags=re.IGNORECASE)
    
    # Remove common filler words
    fillers = ['please', 'plz', 'pls', 'kr', 'kro', 'karo', 'kar', 'do', 'de', 'ko', 'ka', 'ki', 'ke',
               'with', 'phone', 'number', 'naam', 'name', 'student', 'teacher', 'add', 'new']
    for f in fillers:
        clean = re.sub(r'\b' + f + r'\b', '', clean, flags=re.IGNORECASE)
    
    # Extract phone number if present
    phone_match = re.search(r'(\+?\d[\d\s-]{8,15})', clean)
    phone = phone_match.group(1).strip() if phone_match else None
    if phone_match:
        clean = clean.replace(phone_match.group(0), '')
    
    name = ' '.join(clean.split()).strip()
    # Remove leading/trailing punctuation
    name = name.strip('.,!? ')
    
    return name, phone


def extract_amount(msg):
    """Extract a monetary amount from the message."""
    m = re.search(r'(\d[\d,]*)\s*(?:rs|rupees|rupay|fee|fees)?', msg, re.IGNORECASE)
    if m:
        return int(m.group(1).replace(',', ''))
    m = re.search(r'(?:rs|rupees|rupay)\.?\s*(\d[\d,]*)', msg, re.IGNORECASE)
    if m:
        return int(m.group(1).replace(',', ''))
    return None


# ───────────── Intent Detection ──────────────────────────────────

INTENTS = {
    'stats': [
        'stats', 'overview', 'summary', 'haal', 'hal', 'batao', 'btao',
        'kitne', 'total', 'dashboard', 'report', 'school ka',
        'kya haal', 'kia hal', 'status', 'detail', 'info'
    ],
    'add_student': [
        'add student', 'student add', 'add kr', 'add kro', 'enroll',
        'admission', 'dakhla', 'dakhila', 'new student', 'naya student',
        'student ko add', 'student bnao', 'student banao', 'register student'
    ],
    'list_students': [
        'students', 'student list', 'all students', 'show students',
        'students dikhao', 'students btao', 'students batao',
        'kon kon', 'kaun kaun', 'list students', 'bachay', 'bache'
    ],
    'list_teachers': [
        'teachers', 'teacher list', 'all teachers', 'show teachers',
        'teachers dikhao', 'teachers btao', 'teachers batao',
        'asatza', 'ustad'
    ],
    'unpaid_fees': [
        'unpaid', 'pending fee', 'fee nahi', 'fees nhi', 'baqaya',
        'overdue', 'kis ki fee', 'kis ki fees', 'kiska fee',
        'fee baqi', 'fees pending', 'who not paid', 'not paid',
        'fee nahi di', 'fees nahi di', 'fee nhi di',
        'jama nahi', 'jama nhi', 'baki fee', 'baqi fee'
    ],
    'record_fee': [
        'fee jama', 'fee record', 'fee collect', 'fee le',
        'record fee', 'collect fee', 'payment', 'fee lelo',
        'fee jama kro', 'fee daal', 'fee dal', 'paid fee',
        'fee wosool', 'fee wasool'
    ],
    'search': [
        'search', 'find', 'dhundo', 'talaash', 'search kr',
        'find student', 'look for'
    ],
    'delete_students': [
        'delete student', 'remove student', 'nikalo', 'delete kr', 'delete kro',
        'delete karo', 'khatam kro', 'remove kr', 'student delete'
    ],
    'help': [
        'help', 'madad', 'kya kr', 'kia kr', 'commands',
        'what can', 'how to', 'kaise', 'guide', 'features'
    ],
    'greeting': [
        'hello', 'hi', 'salam', 'assalam', 'hey', 'aoa',
        'good morning', 'good evening', 'helo', 'hlw'
    ]
}


def detect_intent(msg):
    """Detect the user's intent from their message."""
    msg_lower = msg.lower().strip()
    
    # Score each intent
    scores = {}
    for intent, keywords in INTENTS.items():
        score = 0
        for kw in keywords:
            if kw in msg_lower:
                score += len(kw)  # Longer matches = higher confidence
        scores[intent] = score
    
    best_intent = max(scores, key=scores.get)
    if scores[best_intent] == 0:
        return 'unknown'
    return best_intent


# ───────────── Main Processor ────────────────────────────────────

def process_ai_message(message, school_id):
    if not school_id:
        return "⚠️ School context nahi mila. Please login dobara karein."
    
    intent = detect_intent(message)
    
    # ─── Greeting ────────────────────────────────────────────
    if intent == 'greeting':
        stats = get_dashboard_stats(school_id)
        return (
            f"👋 Assalam-o-Alaikum! Main aapka AI School Assistant hoon.\n\n"
            f"📊 Quick Overview:\n"
            f"  👨‍🎓 Students: {stats['total_students']}\n"
            f"  👨‍🏫 Teachers: {stats['total_teachers']}\n"
            f"  💰 Collected: RS. {stats['fees_collected']:,}\n\n"
            f"Mujhse kuch bhi poochein ya command dein! 'help' likh kar commands dekh saktay hain."
        )
    
    # ─── Help ────────────────────────────────────────────────
    if intent == 'help':
        return (
            "🤖 **Available Commands:**\n\n"
            "📊 **School Stats:**\n"
            "   → 'school ka haal batao'\n"
            "   → 'total students?'\n\n"
            "➕ **Add Student:**\n"
            "   → 'Add student Ali in Class 5'\n"
            "   → 'Ahmed ko Grade 10 mein add kro'\n\n"
            "📋 **List Students:**\n"
            "   → 'students dikhao'\n"
            "   → 'Grade 5 ke students'\n\n"
            "👨‍🏫 **List Teachers:**\n"
            "   → 'teachers dikhao'\n\n"
            "💰 **Unpaid Fees:**\n"
            "   → 'kis ki fee nahi aayi?'\n"
            "   → 'pending fees batao'\n\n"
            "💵 **Record Fee:**\n"
            "   → 'Ali ki 5000 fee jama kro'\n"
            "   → 'record fee Ahmed 3000'\n\n"
            "🔍 **Search:**\n"
            "   → 'search Ali'\n"
            "   → 'find Ahmed'"
        )
    
    # ─── Stats ───────────────────────────────────────────────
    if intent == 'stats':
        stats = get_dashboard_stats(school_id)
        return (
            f"📊 **School Overview:**\n\n"
            f"👨‍🎓 Total Students: **{stats['total_students']}**\n"
            f"👨‍🏫 Total Teachers: **{stats['total_teachers']}**\n"
            f"💰 Fees Collected: **RS. {stats['fees_collected']:,}**\n"
            f"⏳ Fees Pending: **RS. {stats['fees_pending']:,}**\n"
            f"🔴 Overdue: **{stats['overdue_count']}** students"
        )
    
    # ─── Add Student ─────────────────────────────────────────
    if intent == 'add_student':
        class_name = extract_class_from_message(message)
        command_words = ['add', 'student', 'enroll', 'admission', 'dakhla', 'new',
                         'naya', 'register', 'bnao', 'banao', 'kro', 'karo', 'kr']
        name, phone = extract_name_from_message(message, command_words)
        
        if not name or len(name) < 2:
            return "❌ Student ka naam samajh nahi aaya. Aise likhein:\n→ 'Add student Ali in Class 5'"
        if not class_name:
            return f"❌ Class batayein please. Aise likhein:\n→ 'Add student {name} in Class 5'"
        
        student = add_student_to_db(school_id, name, class_name, phone)
        return (
            f"✅ **Student Added Successfully!**\n\n"
            f"📝 Name: {student.name}\n"
            f"🏫 Class: {student.class_name}\n"
            f"📱 Phone: {student.phone or 'N/A'}\n"
            f"🆔 ID: {student.id}"
        )
    
    # ─── List Students ───────────────────────────────────────
    if intent == 'list_students':
        class_filter = extract_class_from_message(message)
        students = get_students_list(school_id, class_filter)
        
        if not students:
            return f"📋 Koi student nahi mila" + (f" {class_filter} mein." if class_filter else ".")
        
        header = f"📋 **Students" + (f" - {class_filter}" if class_filter else "") + f"** ({len(students)}):\n"
        lines = [header]
        for i, s in enumerate(students, 1):
            status_icon = "🟢" if s['status'] == 'Active' else "🔴"
            lines.append(f"{i}. {status_icon} {s['name']} | {s['class_name']} | {s.get('phone') or 'No phone'}")
        
        return "\n".join(lines)
    
    # ─── List Teachers ───────────────────────────────────────
    if intent == 'list_teachers':
        teachers = get_teachers_list(school_id)
        
        if not teachers:
            return "📋 Koi teacher nahi mila."
        
        lines = [f"👨‍🏫 **Teachers** ({len(teachers)}):\n"]
        for i, t in enumerate(teachers, 1):
            lines.append(f"{i}. {t['name']} | {t.get('subject', 'N/A')} | {t.get('phone') or 'No phone'}")
        
        return "\n".join(lines)
    
    # ─── Unpaid Fees ─────────────────────────────────────────
    if intent == 'unpaid_fees':
        unpaid = get_unpaid_fees_list(school_id)
        
        if not unpaid:
            return "✅ Bohat acchi baat! Sab ki fees jama ho chuki hain. Koi pending fee nahi hai!"
        
        lines = [f"⚠️ **Unpaid Fees** ({len(unpaid)} students):\n"]
        total_pending = 0
        for f in unpaid:
            total_pending += f['amount']
            lines.append(f"• {f['student']} ({f['class']}) — RS. {f['amount']:,} [{f['status']}]")
        
        lines.append(f"\n💰 Total Pending: **RS. {total_pending:,}**")
        return "\n".join(lines)
    
    # ─── Record Fee ──────────────────────────────────────────
    if intent == 'record_fee':
        amount = extract_amount(message)
        command_words = ['fee', 'fees', 'jama', 'record', 'collect', 'payment',
                         'lelo', 'le', 'lo', 'kro', 'karo', 'kr', 'paid', 'wosool', 'wasool', 'daal', 'dal']
        name, _ = extract_name_from_message(message, command_words)
        
        if not name or len(name) < 2:
            return "❌ Student ka naam batayein. Aise likhein:\n→ 'Ali ki 5000 fee jama kro'"
        if not amount:
            return f"❌ Amount batayein. Aise likhein:\n→ '{name} ki 5000 fee jama kro'"
        
        fee, error = record_fee_payment(school_id, name, amount)
        if error:
            return error
        
        return (
            f"✅ **Fee Recorded!**\n\n"
            f"👨‍🎓 Student: {fee.student.name}\n"
            f"💵 Amount: RS. {fee.amount:,}\n"
            f"📅 Status: {fee.status}"
        )
    
    # ─── Search ──────────────────────────────────────────────
    if intent == 'search':
        query = re.sub(r'\b(search|find|dhundo|talaash|look\s+for)\b', '', message, flags=re.IGNORECASE).strip()
        if not query:
            return "🔍 Kya search karna hai? Naam ya roll number likhein."
        
        results = search_student(school_id, query)
        if not results:
            return f"🔍 '{query}' se koi result nahi mila."
        
        lines = [f"🔍 **Search Results** ({len(results)}):\n"]
        for s in results:
            lines.append(f"• {s['name']} | {s['class_name']} | Roll: {s.get('roll_no') or 'N/A'} | {s.get('phone') or 'No phone'}")
        
        return "\n".join(lines)
    
    # ─── Delete Students ──────────────────────────────────────
    if intent == 'delete_students':
        class_name = extract_class_from_message(message)
        # Extract number for count
        count_match = re.search(r'(\d+)\s*(?:student|students|bachay|bache)', message, re.IGNORECASE)
        count = int(count_match.group(1)) if count_match else None
        
        if not class_name:
            return "❌ Kaunsi class ke students delete karne hain? Class ka naam batayein."
        
        queryset = Student.objects.filter(school_id=school_id, class_name=class_name)
        total_in_class = queryset.count()
        
        if total_in_class == 0:
            return f"📋 Class {class_name} mein koi student nahi mila."

        if count:
            if count > total_in_class:
                return f"⚠️ Class {class_name} mein sirf {total_in_class} students hain. Aap {count} delete karna chahte hain. Please correct karein."
            # Actually delete
            ids_to_delete = queryset.values_list('id', flat=True)[:count]
            Student.objects.filter(id__in=ids_to_delete).delete()
            msg = f"🗑️ **Deletion Successful!**\n\nClass {class_name} se {count} students delete kar diye gaye hain."
        else:
            # Delete all in class if no count specified
            queryset.delete()
            msg = f"🗑️ **Deletion Successful!**\n\nClass {class_name} ke saare students delete kar diye gaye hain."

        return msg

    # ─── Unknown ─────────────────────────────────────────────
    return (
        f"🤔 Main '{message}' samajh nahi paaya.\n\n"
        f"'help' likh kar available commands dekh saktay hain!"
    )
