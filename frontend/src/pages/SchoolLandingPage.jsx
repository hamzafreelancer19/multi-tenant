import React, { useState, useEffect } from "react";
import { useTenant } from "../context/TenantContext";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../api/axios";
import { getPublicNotices } from "../api/noticesApi";
import "./SchoolLandingPage.css";
import { schoolApplyPath } from "./SchoolAdmissionPage";
import { listAdmissions } from "./admissionStorage";
import {
    ArrowRight,
    CheckCircle,
    GraduationCap,
    Users,
    Clock,
    Award,
    Star,
    Mail,
    Phone,
    Menu,
    X,
    Bell,
    Pin,
    BookOpen,
    Shield,
    Sparkles,
    MapPin,
    Quote,
    LogIn,
    ClipboardList,
} from "lucide-react";

const FEATURE_ICONS = [GraduationCap, Award, Shield, BookOpen, Users, Clock, Sparkles, CheckCircle];

function formatNoticeDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
}

export default function SchoolLandingPage() {
  const tenant = useTenant();
  const navigate = useNavigate();
  const { school_slug } = useParams();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [notices, setNotices] = useState([]);
  const [openNoticeId, setOpenNoticeId] = useState(null);
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    if (school_slug) tenant.setForcedSchool(school_slug);
  }, [school_slug]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 1100) setMobileMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (tenant.loading || !tenant.schoolName) return;
    const params = {};
    if (school_slug) params.domain = school_slug;
    else if (tenant.schoolDomain) params.domain = tenant.schoolDomain;
    getPublicNotices(params)
      .then((res) => setNotices(Array.isArray(res.data) ? res.data : []))
      .catch(() => setNotices([]));
    setSavedCount(listAdmissions(tenant.schoolId, tenant.schoolSlug || school_slug).length);
  }, [tenant.loading, tenant.schoolName, tenant.schoolDomain, tenant.schoolId, tenant.schoolSlug, school_slug]);

  const schoolName = tenant.schoolName || "Our School";

  useEffect(() => {
    if (schoolName) document.title = `${schoolName} | Admissions`;
    return () => {
      document.title = "Classora";
    };
  }, [schoolName]);

  if (tenant.loading) {
    return (
      <div className="slp-loading">
        <div className="slp-spinner" />
        <p>Loading school…</p>
      </div>
    );
  }

  if (school_slug && !tenant.schoolName) {
    return (
      <div className="slp-loading">
        <h2>School not found</h2>
        <p>This school link or domain is not registered.</p>
        <button className="slp-btn-primary" onClick={() => navigate("/")}>
          Go to platform
        </button>
      </div>
    );
  }

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || "#e8b86d");
    return result
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : "232, 184, 109";
  };

  const GENERIC = new Set(["#3b82f6", "#1e40af", "#1d4ed8", "#2563eb", "#1e293b"]);
  const rawPrimary = (tenant.branding?.landing?.primary_color || tenant.landing?.primary_color || "").toLowerCase();
  const rawSecondary = (tenant.branding?.landing?.secondary_color || tenant.landing?.secondary_color || "").toLowerCase();
  const usingGeneric = !rawPrimary || GENERIC.has(rawPrimary) || GENERIC.has(rawSecondary);
  const primaryColor = usingGeneric ? "#e8b86d" : (tenant.branding?.landing?.primary_color || tenant.landing?.primary_color);
  const secondaryColor = usingGeneric ? "#08131c" : (tenant.branding?.landing?.secondary_color || tenant.landing?.secondary_color || "#08131c");
  const logoUrl = tenant.branding?.logo
    ? tenant.branding.logo.startsWith("http")
      ? tenant.branding.logo
      : `${api.defaults.baseURL.replace("/api", "")}${tenant.branding.logo}`
    : null;

  const hasCustomFeatures = tenant.landing?.features?.length > 0;
  const features = hasCustomFeatures
    ? tenant.landing.features
    : [
        { title: "Expert Faculty", desc: "Dedicated teachers who mentor every student with care and academic rigor." },
        { title: "Modern Curriculum", desc: "A balanced programme of academics, sports, arts, and character building." },
        { title: "Safe Campus", desc: "A secure, welcoming environment where students can learn and grow with confidence." },
        { title: "Future Ready", desc: "Skills, values, and guidance that prepare students for university and life." },
      ];

  const hasCustomPrograms = tenant.landing?.programs?.length > 0;
  const programs = hasCustomPrograms
    ? tenant.landing.programs
    : [
        { title: "Primary School", age: "Grades 1 – 5", desc: "Strong foundations in literacy, numeracy, and curiosity-led learning." },
        { title: "Middle School", age: "Grades 6 – 8", desc: "Deeper subjects, confidence, and habits that last a lifetime.", badge: "Popular" },
        { title: "High School", age: "Grades 9 – 12", desc: "Exam excellence, career counselling, and leadership opportunities." },
      ];

  const hasCustomTestimonials = tenant.landing?.testimonials?.length > 0;
  const testimonials = hasCustomTestimonials
    ? tenant.landing.testimonials
    : [
        { name: "Ayesha Khan", role: "Parent, Grade 4", quote: `${schoolName} feels like a second home. Teachers know every child and the progress is visible.` },
        { name: "Imran Ali", role: "Parent, Grade 9", quote: "Discipline, academics, and respect — this is the school we were looking for." },
        { name: "Sana Malik", role: "Parent, Grade 2", quote: "Admissions were simple and the campus visit made our decision easy." },
      ];

  const languages = tenant.landing?.languages?.length > 0 ? tenant.landing.languages : [];
  const stats = tenant.landing?.stats || {};
  const showStats = tenant.landing?.show_stats !== false;
  const copy = tenant.landing?.copy || {};
  const about = tenant.landing?.about || `${schoolName} is dedicated to excellence in education, character, and community.`;
  const heroTitle = tenant.landing?.hero_title || `A brighter future begins at ${schoolName}`;
  const heroSubtitle =
    tenant.landing?.hero_subtitle ||
    "Quality education, caring teachers, and a campus where every student is known, challenged, and celebrated.";
  const email = tenant.landing?.contact_email || "";
  const phone = tenant.landing?.contact_phone || "";
  const aboutPoints = copy.about_points?.length ? copy.about_points : ["Student-first teaching", "Transparent admissions", "Parent partnership"];
  const admissionsPoints = copy.admissions_points?.length
    ? copy.admissions_points
    : ["Quick review of every request", "Campus visit on request", "Clear next steps for parents"];
  const admissionsSteps = copy.admissions_steps?.length
    ? copy.admissions_steps
    : [
        { title: "Fill the form", desc: "A dedicated application page for student, class, and parent details." },
        { title: "School review", desc: "Admissions checks the request and prepares the next step." },
        { title: "Join the school", desc: "You will be contacted for a visit or confirmation." },
      ];
  const initials = schoolName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const closeMenu = () => setMobileMenuOpen(false);
  const applyPath = schoolApplyPath(school_slug, tenant.schoolSlug);
  const goEnroll = () => {
    closeMenu();
    navigate(applyPath);
  };
  const goMyApplication = () => {
    closeMenu();
    navigate(`${applyPath}?saved=1`);
  };
  const latestNotice = notices[0] || null;

  return (
    <div
      className={`slp-wrapper ${mobileMenuOpen ? "is-menu-open" : ""}`}
      style={{
        "--slp-primary": primaryColor,
        "--slp-secondary": secondaryColor,
        "--slp-primary-rgb": hexToRgb(primaryColor),
        "--slp-secondary-rgb": hexToRgb(secondaryColor),
      }}
    >
      <div className="slp-stage">
      <div className="slp-orb slp-orb-a" />
      <div className="slp-orb slp-orb-b" />
      <div className="slp-topbar">
        {latestNotice ? (
          <a href="#notices" className="slp-topbar-notice">
            <Bell size={14} />
            {latestNotice.priority === "Urgent" ? "Urgent · " : ""}
            {latestNotice.title}
          </a>
        ) : (
          <span>{copy.topbar_text || `Admissions ${new Date().getFullYear()} are open`}</span>
        )}
        <div className="slp-topbar-links">
          {email && (
            <a href={`mailto:${email}`}>
              <Mail size={14} /> {email}
            </a>
          )}
          {phone && (
            <a href={`tel:${phone}`}>
              <Phone size={14} /> {phone}
            </a>
          )}
        </div>
      </div>

      <nav className={`slp-nav ${scrolled ? "is-scrolled" : "is-over-hero"}`}>
        <div className="slp-logo">
          <div className="slp-crest">
            {logoUrl ? <img src={logoUrl} alt="" /> : <span>{initials || "S"}</span>}
          </div>
          <div className="slp-logo-copy">
            <strong>{schoolName}</strong>
            <small>{copy.nav_tagline || "Excellence in education"}</small>
          </div>
        </div>

        <div className={`slp-nav-links ${mobileMenuOpen ? "open" : ""}`}>
          <a href="#about" onClick={closeMenu}>About</a>
          {notices.length > 0 && <a href="#notices" onClick={closeMenu}>Notices</a>}
          <a href="#features" onClick={closeMenu}>Why us</a>
          <a href="#programs" onClick={closeMenu}>Academics</a>
          <a href={applyPath} onClick={(e) => { e.preventDefault(); goEnroll(); }}>Admissions</a>
          {savedCount > 0 && (
            <a href={`${applyPath}?saved=1`} onClick={(e) => { e.preventDefault(); goMyApplication(); }}>
              My application
            </a>
          )}
          <a href="#contact" onClick={closeMenu}>Contact</a>
          <div className="slp-mobile-actions">
            <button className="slp-btn-light" onClick={() => navigate("/login")}>
              Parent / Staff login
            </button>
            <button className="slp-btn-gold" onClick={goEnroll}>
              {copy.cta_apply_btn || "Apply now"}
            </button>
            {savedCount > 0 && (
              <button className="slp-btn-light" onClick={goMyApplication}>
                <ClipboardList size={16} /> My application
              </button>
            )}
          </div>
        </div>

        <div className="slp-nav-actions">
          <button className={scrolled ? "slp-btn-ghost" : "slp-btn-light"} onClick={() => navigate("/login")}>
            <LogIn size={16} /> Login
          </button>
          {savedCount > 0 && (
            <button className={scrolled ? "slp-btn-ghost" : "slp-btn-light"} onClick={goMyApplication}>
              <ClipboardList size={16} /> My application
            </button>
          )}
          <button className="slp-btn-gold" onClick={goEnroll}>
            {copy.cta_apply_btn || "Apply now"}
          </button>
        </div>

        <button className="slp-menu-btn" type="button" onClick={() => setMobileMenuOpen((v) => !v)} aria-label="Menu">
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>
      {mobileMenuOpen && <div className="slp-nav-overlay" onClick={closeMenu} />}

      <header className="slp-hero">
        <div className="slp-hero-copy">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <p className="slp-kicker">{copy.hero_kicker || `Welcome to ${schoolName}`}</p>
            <h1>{heroTitle}</h1>
            <p className="slp-lead">{heroSubtitle}</p>
            <div className="slp-hero-actions">
              <button className="slp-btn-gold slp-btn-lg" onClick={goEnroll}>
                {copy.hero_primary_btn || "Apply for admission"} <ArrowRight size={18} />
              </button>
              <a className="slp-btn-light slp-btn-lg" href="#about">
                {copy.hero_secondary_btn || "Learn about us"}
              </a>
            </div>
          </motion.div>
        </div>

        <div className="slp-hero-visual">
          {tenant.landing?.hero_image_url ? (
            <img src={tenant.landing.hero_image_url} alt={schoolName} />
          ) : (
            <div className="slp-campus">
              <div className="slp-rings" />
              <div className="slp-campus-mark">{initials || "S"}</div>
              <p>{schoolName}</p>
              <small>{copy.campus_caption || "A tradition of excellence"}</small>
            </div>
          )}
        </div>
      </header>
      </div>

      {showStats && (
        <section className="slp-stats">
          <div>
            <strong>{stats.students || "—"}</strong>
            <span>{copy.stats_students_label || "Students"}</span>
          </div>
          <div>
            <strong>{stats.teachers || "—"}</strong>
            <span>{copy.stats_teachers_label || "Teachers"}</span>
          </div>
          <div>
            <strong>{stats.courses || "—"}</strong>
            <span>{copy.stats_classes_label || "Classes"}</span>
          </div>
          <div>
            <strong>{copy.stats_admissions_value || "Open"}</strong>
            <span>{copy.stats_admissions_label || "Admissions"}</span>
          </div>
        </section>
      )}

      {notices.length > 0 && (
        <section className="slp-notices" id="notices">
          <div className="slp-section-head">
            <p className="slp-kicker">{copy.notices_kicker || "Notice board"}</p>
            <h2>{copy.notices_title || "Announcements"}</h2>
            <p>{copy.notices_subtitle || `Latest updates from ${schoolName}.`}</p>
          </div>
          <div className="slp-notice-grid">
            {notices.map((notice) => {
              const open = openNoticeId === notice.id;
              return (
                <article
                  key={notice.id}
                  className={`slp-notice-card${notice.priority === "Urgent" ? " is-urgent" : ""}${notice.is_pinned ? " is-pinned" : ""}`}
                >
                  <header>
                    <span className="slp-notice-cat">{notice.category || "General"}</span>
                    {notice.is_pinned && (
                      <span className="slp-notice-pin"><Pin size={12} /> Pinned</span>
                    )}
                    {notice.priority === "Urgent" && <span className="slp-notice-urgent">Urgent</span>}
                  </header>
                  <h3>{notice.title}</h3>
                  <p className={open ? "" : "is-clamp"}>{notice.content}</p>
                  <footer>
                    <small>
                      {formatNoticeDate(notice.created_at)}
                      {notice.class_name ? ` · ${notice.class_name}` : ""}
                    </small>
                    {notice.content?.length > 140 && (
                      <button
                        type="button"
                        className="slp-btn-more"
                        onClick={() => setOpenNoticeId(open ? null : notice.id)}
                      >
                        {open ? "Show less" : "Read more"}
                      </button>
                    )}
                  </footer>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <section className="slp-about" id="about">
        <div className="slp-about-media">
          {tenant.landing?.center_image_url ? (
            <img src={tenant.landing.center_image_url} alt="" />
          ) : (
            <div className="slp-about-panel">
              <GraduationCap size={42} />
              <p>{copy.about_fallback || "A community of learners"}</p>
            </div>
          )}
        </div>
        <div className="slp-about-copy">
          <p className="slp-kicker">{copy.about_kicker || "About the school"}</p>
          <h2>{copy.about_title || `Welcome to ${schoolName}`}</h2>
          <p className="slp-lead">{about}</p>
          <ul className="slp-checklist">
            {aboutPoints.map((point) => (
              <li key={point}><CheckCircle size={18} /> {point}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="slp-features" id="features">
        <div className="slp-section-head">
          <p className="slp-kicker">{copy.features_kicker || "Why families choose us"}</p>
          <h2>{copy.features_title || "Built for real learning"}</h2>
          <p>{copy.features_subtitle || `Everything on this page belongs to ${schoolName}.`}</p>
        </div>
        <div className="slp-feature-grid">
          {features.map((feature, i) => {
            const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length];
            return (
              <article key={`${feature.title}-${i}`} className="slp-feature-card">
                <div className="slp-feature-icon">
                  <Icon size={22} />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </article>
            );
          })}
        </div>
      </section>

      {languages.length > 0 && (
        <section className="slp-languages" id="languages">
          <div className="slp-section-head">
            <p className="slp-kicker">{copy.languages_kicker || "Languages"}</p>
            <h2>{copy.languages_title || "A global classroom"}</h2>
          </div>
          <div className="slp-lang-row">
            {languages.map((lang, i) => (
              <div key={i} className="slp-lang-chip">
                <span>{lang.flag}</span>
                <strong>{lang.name}</strong>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="slp-programs" id="programs">
        <div className="slp-section-head slp-section-head-left">
          <p className="slp-kicker">{copy.programs_kicker || "Academics"}</p>
          <h2>{copy.programs_title || "Programmes of study"}</h2>
          <p>{copy.programs_subtitle || "From first class to senior years, students grow with structure, care, and high expectations."}</p>
        </div>
        <div className="slp-program-grid">
          {programs.map((program, i) => (
            <article key={`${program.title}-${i}`} className="slp-program-card">
              {program.badge && <span className="slp-badge">{program.badge}</span>}
              <div className="slp-program-icon">
                <BookOpen size={22} />
              </div>
              <h3>{program.title}</h3>
              {program.age && <p className="slp-program-meta">{program.age}</p>}
              <p>{program.desc}</p>
              <div className="slp-program-foot">
                {program.price ? (
                  <strong>{String(program.price).startsWith("RS") || String(program.price).startsWith("$") ? program.price : `RS. ${program.price}`}</strong>
                ) : (
                  <strong>{copy.program_enroll_label || "Now enrolling"}</strong>
                )}
                <button className="slp-btn-more" onClick={goEnroll}>
                  {copy.program_apply_btn || "Apply"} <ArrowRight size={14} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="slp-enroll" id="enroll">
        <div className="slp-enroll-copy">
          <p className="slp-kicker">{copy.admissions_kicker || "Admissions"}</p>
          <h2>{copy.admissions_title || "Apply for a place"}</h2>
          <p className="slp-lead">
            {copy.admissions_subtitle || `Open the admission form, share student and parent details, and the ${schoolName} team will contact you.`}
          </p>
          <ul className="slp-checklist">
            {admissionsPoints.map((point) => (
              <li key={point}><CheckCircle size={18} /> {point}</li>
            ))}
          </ul>
          <button className="slp-btn-gold slp-btn-lg" type="button" onClick={goEnroll}>
            {copy.admissions_button || "Open admission form"} <ArrowRight size={18} />
          </button>
        </div>
        <div className="slp-enroll-steps">
          {admissionsSteps.map((step, i) => (
            <article key={`${step.title}-${i}`}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="slp-reviews" id="testimonials">
        <div className="slp-section-head">
          <p className="slp-kicker">{copy.reviews_kicker || "Families"}</p>
          <h2>{copy.reviews_title || "What parents say"}</h2>
        </div>
        <div className="slp-review-grid">
          {testimonials.map((t, i) => (
            <blockquote key={`${t.name}-${i}`} className="slp-review">
              <Quote size={22} />
              <div className="slp-stars">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} size={14} fill="currentColor" />
                ))}
              </div>
              <p>“{t.quote}”</p>
              <footer>
                {t.img ? <img src={t.img} alt="" /> : <span className="slp-avatar">{t.name?.[0] || "P"}</span>}
                <div>
                  <strong>{t.name}</strong>
                  <small>{t.role}</small>
                </div>
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      <section className="slp-cta">
        <div>
          <h2>{copy.cta_title || `Ready to join ${schoolName}?`}</h2>
          <p>{copy.cta_subtitle || "Start an application today, or log in if you already have an account."}</p>
        </div>
        <div className="slp-hero-actions">
          <button className="slp-btn-gold slp-btn-lg" onClick={goEnroll}>
            {copy.cta_apply_btn || "Apply now"}
          </button>
          <button className="slp-btn-light slp-btn-lg" onClick={() => navigate("/login")}>
            {copy.cta_login_btn || "Login"}
          </button>
        </div>
      </section>

      <footer className="slp-footer" id="contact">
        <div className="slp-footer-grid">
          <div>
            <div className="slp-logo">
              <div className="slp-crest">
                {logoUrl ? <img src={logoUrl} alt="" /> : <span>{initials || "S"}</span>}
              </div>
              <strong>{schoolName}</strong>
            </div>
            <p>{about}</p>
          </div>
          <div>
            <h4>Explore</h4>
            <a href="#about">About</a>
            {notices.length > 0 && <a href="#notices">Notices</a>}
            <a href="#programs">Academics</a>
            <a href={applyPath} onClick={(e) => { e.preventDefault(); goEnroll(); }}>Admissions</a>
            {savedCount > 0 && (
              <a href={`${applyPath}?saved=1`} onClick={(e) => { e.preventDefault(); goMyApplication(); }}>
                My application
              </a>
            )}
          </div>
          <div>
            <h4>Contact</h4>
            {email && (
              <p>
                <Mail size={14} /> {email}
              </p>
            )}
            {phone && (
              <p>
                <Phone size={14} /> {phone}
              </p>
            )}
            <p>
              <MapPin size={14} /> {copy.footer_address || "School campus"}
            </p>
          </div>
        </div>
        <div className="slp-legal">
          <span>© {new Date().getFullYear()} {schoolName}. All rights reserved.</span>
          <button onClick={() => navigate("/login")}>Staff login</button>
        </div>
      </footer>
    </div>
  );
}
