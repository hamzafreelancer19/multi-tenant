from datetime import date


def default_features():
    return [
        {"title": "Expert Faculty", "desc": "Dedicated teachers who mentor every student with care and academic rigor."},
        {"title": "Modern Curriculum", "desc": "A balanced programme of academics, sports, arts, and character building."},
        {"title": "Safe Campus", "desc": "A secure, welcoming environment where students can learn and grow with confidence."},
        {"title": "Future Ready", "desc": "Skills, values, and guidance that prepare students for university and life."},
    ]


def default_programs():
    return [
        {"title": "Primary School", "age": "Grades 1 – 5", "desc": "Strong foundations in literacy, numeracy, and curiosity-led learning.", "badge": "", "price": ""},
        {"title": "Middle School", "age": "Grades 6 – 8", "desc": "Deeper subjects, confidence, and habits that last a lifetime.", "badge": "Popular", "price": ""},
        {"title": "High School", "age": "Grades 9 – 12", "desc": "Exam excellence, career counselling, and leadership opportunities.", "badge": "", "price": ""},
    ]


def default_testimonials(school_name):
    return [
        {"name": "Ayesha Khan", "role": "Parent, Grade 4", "quote": f"{school_name} feels like a second home. Teachers know every child and the progress is visible."},
        {"name": "Imran Ali", "role": "Parent, Grade 9", "quote": "Discipline, academics, and respect — this is the school we were looking for."},
        {"name": "Sana Malik", "role": "Parent, Grade 2", "quote": "Admissions were simple and the campus visit made our decision easy."},
    ]


def default_landing_copy(school_name):
    year = date.today().year
    return {
        "topbar_text": f"Admissions {year} are open",
        "nav_tagline": "Excellence in education",
        "hero_kicker": f"Welcome to {school_name}",
        "hero_primary_btn": "Apply for admission",
        "hero_secondary_btn": "Learn about us",
        "campus_caption": "A tradition of excellence",
        "about_kicker": "About the school",
        "about_title": f"Welcome to {school_name}",
        "about_fallback": "A community of learners",
        "about_points": [
            "Student-first teaching",
            "Transparent admissions",
            "Parent partnership",
        ],
        "features_kicker": "Why families choose us",
        "features_title": "Built for real learning",
        "features_subtitle": f"Everything on this page belongs to {school_name}.",
        "languages_kicker": "Languages",
        "languages_title": "A global classroom",
        "programs_kicker": "Academics",
        "programs_title": "Programmes of study",
        "programs_subtitle": "From first class to senior years, students grow with structure, care, and high expectations.",
        "program_enroll_label": "Now enrolling",
        "program_apply_btn": "Apply",
        "admissions_kicker": "Admissions",
        "admissions_title": "Apply for a place",
        "admissions_subtitle": f"Open the admission form, share student and parent details, and the {school_name} team will contact you.",
        "admissions_points": [
            "Quick review of every request",
            "Campus visit on request",
            "Clear next steps for parents",
        ],
        "admissions_button": "Open admission form",
        "admissions_steps": [
            {"title": "Fill the form", "desc": "A dedicated application page for student, class, and parent details."},
            {"title": "School review", "desc": "Admissions checks the request and prepares the next step."},
            {"title": "Join the school", "desc": "You will be contacted for a visit or confirmation."},
        ],
        "reviews_kicker": "Families",
        "reviews_title": "What parents say",
        "cta_title": f"Ready to join {school_name}?",
        "cta_subtitle": "Start an application today, or log in if you already have an account.",
        "cta_apply_btn": "Apply now",
        "cta_login_btn": "Login",
        "footer_address": "School campus",
        "apply_kicker": f"Admissions {year}",
        "apply_title": "Apply for a place",
        "apply_intro": f"Complete this form for {school_name}. The admissions team will review it and contact you with the next steps.",
        "apply_steps": [
            {"title": "1. Submit", "desc": "Share student, class, and parent details."},
            {"title": "2. Review", "desc": "The school checks the application."},
            {"title": "3. Next step", "desc": "You will be contacted for a visit or confirmation."},
        ],
        "apply_success_title": "Application received",
        "apply_success_text": f"Thank you. {school_name} will contact you soon about this admission request.",
        "stats_students_label": "Students",
        "stats_teachers_label": "Teachers",
        "stats_classes_label": "Classes",
        "stats_admissions_value": "Open",
        "stats_admissions_label": "Admissions",
    }


def merge_copy(saved, school_name):
    defaults = default_landing_copy(school_name)
    if not isinstance(saved, dict):
        return defaults
    merged = dict(defaults)
    for key, value in saved.items():
        if value in (None, "", []):
            continue
        merged[key] = value
    return merged
