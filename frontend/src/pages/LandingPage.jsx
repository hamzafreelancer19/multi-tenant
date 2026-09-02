import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Users,
  CalendarCheck,
  CreditCard,
  FileText,
  Bell,
  GraduationCap,
  Bus,
  Library,
  CheckCircle2,
  ChevronDown,
  Menu,
  X,
  Shield,
  Globe,
  Sparkles,
  ClipboardCheck,
  Clock,
  ClipboardList,
  Package,
  FileBadge,
  Bot,
  Palette,
  School,
  Phone,
  Mail,
  MapPin,
  Minus,
  Quote,
  Check,
  Layers,
} from "lucide-react";
import { isAuthenticated, setDemoMode } from "../store/authStore";
import { getPlatformStatus } from "../auth/authService";
import BrandLogo from "../components/ui/BrandLogo";
import "./LandingPage.css";

const MODULES = [
  { icon: Users, title: "Students", desc: "Name, class, roll, parent contacts, and full student files." },
  { icon: GraduationCap, title: "Teachers", desc: "Staff profiles, subjects, and who teaches which class." },
  { icon: Layers, title: "Classes", desc: "Classes and sections, then attach students and timetable." },
  { icon: ClipboardCheck, title: "Admissions", desc: "Parents apply on your school site. You accept or reject in the office." },
  { icon: CalendarCheck, title: "Attendance", desc: "Daily class attendance without registers getting lost." },
  { icon: CreditCard, title: "Fees", desc: "Fee records, dues, and collection in one place." },
  { icon: FileText, title: "Exams", desc: "Marks, results, and report cards for every term." },
  { icon: Bell, title: "Notices", desc: "Publish school news on the dashboard and the public website." },
  { icon: Clock, title: "Timetable", desc: "Class schedules that teachers and students can actually follow." },
  { icon: ClipboardList, title: "Homework", desc: "Assignments, due dates, and classroom work in one list." },
  { icon: Library, title: "Library", desc: "Books, issue, and return — not a paper register." },
  { icon: Bus, title: "Transport", desc: "Routes, vehicles, and which students ride which van." },
  { icon: Users, title: "Staff & payroll", desc: "Non-teaching staff and salary records with the rest of the campus." },
  { icon: Package, title: "Inventory", desc: "Stock in, stock out, and what the school actually has." },
  { icon: FileBadge, title: "Certificates", desc: "ID cards, bonafide, character, and leaving certificates with school branding." },
  { icon: Bot, title: "Classora AI", desc: "Ask the dashboard about students, fees, and school data in Urdu or English." },
];

const STEPS = [
  { n: "01", title: "Create the school account", desc: "Sign up as admin. Your campus gets a dashboard and a public website." },
  { n: "02", title: "Put the campus in the system", desc: "Add classes, teachers, fee structure, logo, and colours. Invite staff when ready." },
  { n: "03", title: "Open the school website", desc: "Share your school link. Parents apply online. You review requests the same day." },
];

const ROLES = [
  { title: "School admin", points: ["Admissions & student files", "Fees, exams, staff, inventory", "Public website & branding"] },
  { title: "Teachers", points: ["Mark attendance", "Enter exam marks", "Share homework & notices"] },
  { title: "Parents & students", points: ["See notices and timetable", "Track fees where enabled", "Portal login after admission"] },
];

const PLANS = [
  {
    id: "Basic",
    name: "Basic",
    price: "1,500",
    limits: "100 students · 5 teachers",
    blurb: "Core office tools and a live school website.",
    features: ["Students, teachers, classes", "Attendance", "Admission requests", "Public school website", "School branding"],
  },
  {
    id: "Business",
    name: "Business",
    price: "3,500",
    popular: true,
    limits: "500 students · 30 teachers",
    blurb: "The plan most campuses run day to day.",
    features: ["Everything in Basic", "Fees & collection", "Exams & results", "Notice board", "Classora AI assistant"],
  },
  {
    id: "Pro",
    name: "Pro",
    price: "6,000",
    limits: "Unlimited students & teachers",
    blurb: "Full operations: library, transport, payroll, certificates.",
    features: ["Everything in Business", "Timetable & homework", "Library, transport, inventory", "Staff & payroll", "ID cards & certificates"],
  },
];

const COMPARE = [
  { name: "Students", values: ["100", "500", "Unlimited"] },
  { name: "Teachers", values: ["5", "30", "Unlimited"] },
  { name: "Classes & attendance", values: [true, true, true] },
  { name: "Online admissions", values: [true, true, true] },
  { name: "Public school website", values: [true, true, true] },
  { name: "Fees", values: [false, true, true] },
  { name: "Exams & results", values: [false, true, true] },
  { name: "Notice board", values: [false, true, true] },
  { name: "Classora AI", values: [false, true, true] },
  { name: "Timetable & homework", values: [false, false, true] },
  { name: "Library & transport", values: [false, false, true] },
  { name: "Staff, inventory, certificates", values: [false, false, true] },
];

const QUOTES = [
  {
    text: "Admission forms used to sit in a register. Now parents apply from the school site and we see every request the same afternoon.",
    name: "Farah Malik",
    role: "Principal, Lahore",
  },
  {
    text: "Fees and attendance were in two different notebooks. Classora put both on one screen, so the office is not chasing paper at month end.",
    name: "Imran Sheikh",
    role: "Admin, Karachi",
  },
  {
    text: "Teachers mark attendance in class and notices go on the website. Parents stop asking the same questions in the group.",
    name: "Sana Qureshi",
    role: "Coordinator, Islamabad",
  },
];

const FAQS = [
  {
    q: "Does every school get its own website?",
    a: "Yes. Each school has a public site for about, notices, and admissions, plus a private dashboard for staff. You can edit the site from Public Landing Page settings.",
  },
  {
    q: "Can parents apply without creating an account?",
    a: "Yes. They fill the admission form on the school website. You review it under Admission Requests. After you accept, a student portal login can be created.",
  },
  {
    q: "Are prices in Pakistani Rupees?",
    a: "Yes. Basic is Rs 1,500, Business Rs 3,500, Pro Rs 6,000 per month. After you pay, the plan is submitted for approval, then activated.",
  },
  {
    q: "What are the student limits?",
    a: "Basic allows 100 students and 5 teachers. Business allows 500 students and 30 teachers. Pro has no student or teacher cap.",
  },
  {
    q: "Who can log in?",
    a: "School admin, teachers, accountant, and student/parent portal users. Superadmin is only for the Classora platform team — not for school operations.",
  },
  {
    q: "Is Classora AI on every plan?",
    a: "No. The AI assistant is on Business and Pro. Basic still includes students, attendance, admissions, and the school website.",
  },
  {
    q: "Can we change plan later?",
    a: "Yes. Open Subscription in the dashboard, pick Basic, Business, or Pro, and submit the payment reference. Your school keeps running while the new plan is reviewed.",
  },
];

const EMPTY_CONTACT = { name: "", school: "", phone: "", email: "", message: "" };

function Cell({ value }) {
  if (value === true) return <Check size={18} className="lp-yes" />;
  if (value === false) return <Minus size={18} className="lp-no" />;
  return <span>{value}</span>;
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [contact, setContact] = useState(EMPTY_CONTACT);
  const [contactSent, setContactSent] = useState(false);
  const [allowSignup, setAllowSignup] = useState(true);
  const loggedIn = isAuthenticated();

  useEffect(() => {
    document.title = "Classora — School management for every campus";
    return () => {
      document.title = "Classora";
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    getPlatformStatus()
      .then((d) => {
        if (!cancelled) setAllowSignup(d.allow_signup !== false);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (loggedIn) navigate("/dashboard");
  }, [loggedIn, navigate]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 1024) setMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);
  const go = (path) => {
    closeMenu();
    navigate(path);
  };
  const startSchool = () => {
    if (!allowSignup) return;
    go("/signup");
  };
  const startDemo = () => {
    setDemoMode(true);
    navigate("/dashboard");
  };
  const navSolid = scrolled || menuOpen;

  const submitContact = (e) => {
    e.preventDefault();
    try {
      const prev = JSON.parse(localStorage.getItem("classora_contact_leads") || "[]");
      const next = [{ ...contact, submittedAt: new Date().toISOString() }, ...prev].slice(0, 20);
      localStorage.setItem("classora_contact_leads", JSON.stringify(next));
    } catch {
      /* ignore quota / private mode */
    }
    setContactSent(true);
    setContact(EMPTY_CONTACT);
  };

  return (
    <div className="landing-page">
      <nav className={`lp-nav ${navSolid ? "is-solid" : ""}`}>
        <button className="lp-brand" type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <BrandLogo size="md" color={navSolid ? "#0F172A" : "#ffffff"} />
        </button>

        <div className={`lp-links ${menuOpen ? "is-open" : ""}`}>
          <a href="#product" onClick={closeMenu}>Product</a>
          <a href="#website" onClick={closeMenu}>School site</a>
          <a href="#pricing" onClick={closeMenu}>Pricing</a>
          <a href="#faq" onClick={closeMenu}>FAQ</a>
          <a href="#contact" onClick={closeMenu}>Contact</a>
          <div className="lp-links-actions">
            <button className="lp-btn ghost-dark" type="button" onClick={() => go("/login")}>Login</button>
            {allowSignup && <button className="lp-btn orange" type="button" onClick={startSchool}>Start your school</button>}
          </div>
        </div>

        <div className="lp-nav-end">
          <div className="lp-nav-desk">
            <button className={`lp-btn ${navSolid ? "ghost-dark" : "ghost"}`} type="button" onClick={() => go("/login")}>
              Login
            </button>
            {allowSignup && (
              <button className="lp-btn orange" type="button" onClick={startSchool}>
                Start your school
              </button>
            )}
          </div>
          <button className="lp-menu" type="button" onClick={() => setMenuOpen((v) => !v)} aria-label="Menu">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>
      {menuOpen && <div className="lp-overlay" onClick={closeMenu} />}

      <header className="lp-hero">
        <div className="lp-orb lp-orb-a" />
        <div className="lp-orb lp-orb-b" />
        <div className="lp-hero-inner">
          <div className="lp-hero-copy">
            <p className="lp-kicker"><Sparkles size={14} /> School SaaS for Pakistan</p>
            <h1>
              Run the office, the classroom,
              <span> and the school website.</span>
            </h1>
            <p className="lp-lead">
              Classora is the system behind a campus: admissions, students, attendance, fees, exams, notices, library, transport, certificates — plus a public site where parents apply.
            </p>
            <div className="lp-hero-actions">
              {allowSignup ? (
                <button className="lp-btn orange lg" type="button" onClick={startSchool}>
                  Create school account <ArrowRight size={18} />
                </button>
              ) : (
                <button className="lp-btn orange lg" type="button" onClick={() => go("/login")}>
                  Staff login <ArrowRight size={18} />
                </button>
              )}
              <button className="lp-btn glass lg" type="button" onClick={startDemo}>
                View demo dashboard
              </button>
            </div>
            <ul className="lp-proof">
              <li><CheckCircle2 size={16} /> Website included on every plan</li>
              <li><CheckCircle2 size={16} /> Admin, teacher & parent logins</li>
              <li><CheckCircle2 size={16} /> From Rs 1,500 / month</li>
            </ul>
          </div>

          <div className="lp-hero-visual" aria-hidden="true">
            <div className="lp-float lp-float-a">
              <strong>New admission</strong>
              <span>Ahmed Ali · Class 6</span>
            </div>
            <div className="lp-float lp-float-b">
              <strong>Fee received</strong>
              <span>Rs 8,500 · Paid</span>
            </div>
            <div className="lp-dash">
              <aside>
                <b>Classora</b>
                <span className="on">Dashboard</span>
                <span>Students</span>
                <span>Admissions</span>
                <span>Fees</span>
                <span>Exams</span>
                <span>Notices</span>
              </aside>
              <section>
                <header>
                  <div>
                    <small>Welcome back</small>
                    <strong>Principal Office</strong>
                  </div>
                  <i />
                </header>
                <div className="lp-dash-stats">
                  <article><small>Students</small><b>486</b></article>
                  <article><small>Teachers</small><b>32</b></article>
                  <article><small>Pending</small><b>12</b></article>
                </div>
                <div className="lp-dash-rows">
                  <p><b>Fatima Noor</b><span>KG-II · Pending</span></p>
                  <p><b>Hassan Raza</b><span>Class 4 · Pending</span></p>
                  <p><b>Ayesha Khan</b><span>Class 8 · Review</span></p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </header>

      <section className="lp-stats">
        <article><b>16</b><span>School modules</span></article>
        <article><b>3</b><span>Login types</span></article>
        <article><b>3</b><span>Monthly plans in PKR</span></article>
        <article><b>1</b><span>Public website per school</span></article>
      </section>

      <section className="lp-section" id="about">
        <p className="lp-kicker dark"><School size={14} /> Why Classora</p>
        <h2>Built for how Pakistani schools actually work.</h2>
        <p className="lp-sub">
          Registers, WhatsApp groups, and Excel files do not talk to each other. Classora keeps the office, teachers, and parents on one campus system — including the school’s public website.
        </p>
        <div className="lp-why">
          <article>
            <h3>Stop chasing paper</h3>
            <p>Admissions, attendance, and fees sit in the same dashboard. The office does not rebuild the same list every term.</p>
          </article>
          <article>
            <h3>Give parents a real site</h3>
            <p>Each school gets a branded website: about, notices, and an apply form. Parents do not need a login just to request a seat.</p>
          </article>
          <article>
            <h3>Grow without changing software</h3>
            <p>Start on Basic. Add fees and exams on Business. Unlock library, transport, payroll, and certificates on Pro.</p>
          </article>
        </div>
      </section>

      <section className="lp-section lp-alt" id="product">
        <p className="lp-kicker dark"><Shield size={14} /> Product</p>
        <h2>Everything from the gate to the exam hall.</h2>
        <p className="lp-sub">These are the modules in Classora today — not a roadmap poster. Plans unlock more of them as the school grows.</p>
        <div className="lp-modules">
          {MODULES.map((item) => (
            <article key={item.title}>
              <div className="lp-mod-icon"><item.icon size={20} /></div>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="lp-section" id="website">
        <div className="lp-split">
          <div>
            <p className="lp-kicker dark"><Globe size={14} /> School website</p>
            <h2>Your campus on the internet, not a Facebook page.</h2>
            <p className="lp-sub">
              Every school gets a public site with your name, logo, colours, notices, and an admission form. Parents apply from the phone. You review the same request in Admission Requests.
            </p>
            <ul className="lp-ticks">
              <li><CheckCircle2 size={18} /> About, academics, notices, and contact</li>
              <li><CheckCircle2 size={18} /> Full admission form: student, parents, class, address</li>
              <li><CheckCircle2 size={18} /> Applicant can reopen their request on the same browser</li>
              <li><CheckCircle2 size={18} /> You edit copy and branding from the dashboard</li>
            </ul>
          </div>
          <div className="lp-site-preview" aria-hidden="true">
            <div className="lp-site-bar">
              <i /><i /><i />
              <span>yourschool.classora.app</span>
            </div>
            <div className="lp-site-body">
              <div className="lp-site-top">
                <div>
                  <strong>Greenfield Public School</strong>
                  <small>Admissions 2026 are open</small>
                </div>
                <div className="lp-site-cta">Apply for a place</div>
              </div>
              <p>Nursery to Matric · Own campus website · Review requests in the office</p>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-section lp-alt" id="how">
        <p className="lp-kicker dark">How it works</p>
        <h2>Live in three steps. Not a six-month project.</h2>
        <div className="lp-steps">
          {STEPS.map((step) => (
            <article key={step.n}>
              <span>{step.n}</span>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </article>
          ))}
        </div>
        <div className="lp-roles">
          {ROLES.map((role) => (
            <article key={role.title}>
              <h3>{role.title}</h3>
              <ul className="lp-ticks compact">
                {role.points.map((p) => (
                  <li key={p}><CheckCircle2 size={16} /> {p}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="lp-section" id="ai">
        <div className="lp-split reverse">
          <div className="lp-ai-card" aria-hidden="true">
            <header><Bot size={18} /> Classora AI</header>
            <p className="from-ai">Assalam-o-Alaikum. Kitne pending admission requests hain?</p>
            <p className="from-user">12 pending requests. Latest: Ahmed Ali, Class 6.</p>
            <p className="from-ai">Fees ke is mahine ke dues bhi dekhun?</p>
          </div>
          <div>
            <p className="lp-kicker dark"><Bot size={14} /> Business & Pro</p>
            <h2>Ask the school, don’t hunt through menus.</h2>
            <p className="lp-sub">
              Classora AI sits in the admin dashboard. Ask about students, fees, or attendance in Urdu or English. It is included on Business and Pro — not on Basic.
            </p>
            <ul className="lp-ticks">
              <li><CheckCircle2 size={18} /> Answers from your school data</li>
              <li><CheckCircle2 size={18} /> Urdu and English</li>
              <li><CheckCircle2 size={18} /> API key stays with the platform, not the school settings page</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="lp-section lp-alt" id="pricing">
        <p className="lp-kicker dark">Pricing</p>
        <h2>Clear monthly plans. Limits you can plan around.</h2>
        <p className="lp-sub">All prices in PKR. Website and admissions are on every plan. Upgrade when you need fees, AI, library, or certificates.</p>
        <div className="lp-plans">
          {PLANS.map((plan) => (
            <article key={plan.id} className={plan.popular ? "is-popular" : ""}>
              {plan.popular && <em>Most schools</em>}
              <h3>{plan.name}</h3>
              <p className="lp-plan-blurb">{plan.blurb}</p>
              <p className="lp-price">
                <b>Rs {plan.price}</b>
                <small>/ month</small>
              </p>
              <p className="lp-limits">{plan.limits}</p>
              <ul>
                {plan.features.map((f) => (
                  <li key={f}><CheckCircle2 size={16} /> {f}</li>
                ))}
              </ul>
              <button
                className={`lp-btn ${plan.popular ? "orange" : "outline"}`}
                type="button"
                onClick={allowSignup ? startSchool : () => go("/login")}
              >
                {allowSignup ? `Choose ${plan.name}` : "Login"}
              </button>
            </article>
          ))}
        </div>

        <div className="lp-compare-wrap">
          <h3>Full comparison</h3>
          <div className="lp-compare">
            <table>
              <thead>
                <tr>
                  <th>Included</th>
                  <th>Basic</th>
                  <th>Business</th>
                  <th>Pro</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map((row) => (
                  <tr key={row.name}>
                    <td>{row.name}</td>
                    {row.values.map((v, i) => (
                      <td key={i}><Cell value={v} /></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="lp-section" id="stories">
        <p className="lp-kicker dark"><Quote size={14} /> Schools like yours</p>
        <h2>What the office notices first.</h2>
        <div className="lp-quotes">
          {QUOTES.map((item) => (
            <article key={item.name}>
              <Quote size={28} />
              <p>{item.text}</p>
              <strong>{item.name}</strong>
              <span>{item.role}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="lp-section lp-alt" id="faq">
        <p className="lp-kicker dark">FAQ</p>
        <h2>Questions schools ask before they start.</h2>
        <div className="lp-faq">
          {FAQS.map((item, i) => (
            <button
              key={item.q}
              type="button"
              className={openFaq === i ? "is-open" : ""}
              onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
            >
              <span>
                {item.q}
                <ChevronDown size={18} />
              </span>
              {openFaq === i && <p>{item.a}</p>}
            </button>
          ))}
        </div>
      </section>

      <section className="lp-section" id="contact">
        <div className="lp-split">
          <div>
            <p className="lp-kicker dark"><Mail size={14} /> Contact</p>
            <h2>Talk to us, or start the school account now.</h2>
            <p className="lp-sub">
              New campus? Register and set up the dashboard. Already a staff member? Log in. For a walkthrough, leave a message and we will get back to you.
            </p>
            <div className="lp-contact-bits">
              <p><Mail size={16} /> hello@classora.pk</p>
              <p><Phone size={16} /> WhatsApp / call after you write in</p>
              <p><MapPin size={16} /> Pakistan · remote onboarding</p>
              <p><Palette size={16} /> Logo, colours, and school site included</p>
            </div>
          </div>
          {contactSent ? (
            <div className="lp-contact-thanks">
              <CheckCircle2 size={36} />
              <h3>Message saved on this page.</h3>
              <p>Create your school account to continue, or log in if the campus is already on Classora.</p>
              <div className="lp-hero-actions">
                {allowSignup && <button className="lp-btn orange" type="button" onClick={startSchool}>Create account</button>}
                <button className="lp-btn outline" type="button" onClick={() => go("/login")}>Login</button>
              </div>
            </div>
          ) : (
            <form className="lp-form" onSubmit={submitContact}>
              <label>
                Your name *
                <input required value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} placeholder="Full name" />
              </label>
              <label>
                School name *
                <input required value={contact.school} onChange={(e) => setContact({ ...contact, school: e.target.value })} placeholder="Campus name" />
              </label>
              <div className="lp-form-row">
                <label>
                  Phone *
                  <input required value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} placeholder="03xx xxx xxxx" />
                </label>
                <label>
                  Email
                  <input type="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} placeholder="you@email.com" />
                </label>
              </div>
              <label>
                How can we help? *
                <textarea required rows={4} value={contact.message} onChange={(e) => setContact({ ...contact, message: e.target.value })} placeholder="Admissions, fees, a demo, or a new campus…" />
              </label>
              <button className="lp-btn orange lg" type="submit">Send message</button>
            </form>
          )}
        </div>
      </section>

      <section className="lp-cta">
        <div>
          <h2>Put the school on Classora this week.</h2>
          <p>Create an admin account, add classes, open the public site, and start taking admission requests online.</p>
          <div className="lp-hero-actions">
            {allowSignup ? (
              <button className="lp-btn orange lg" type="button" onClick={startSchool}>
                Start your school <ArrowRight size={18} />
              </button>
            ) : null}
            <button className="lp-btn ghost lg" type="button" onClick={() => go("/login")}>
              I already have an account
            </button>
          </div>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-footer-grid">
          <div>
            <BrandLogo size="md" color="#0F172A" />
            <p>Classora is school management software with a public website, staff dashboard, and parent access — built for campuses in Pakistan.</p>
          </div>
          <div>
            <h4>Product</h4>
            <a href="#product">Modules</a>
            <a href="#website">School website</a>
            <a href="#pricing">Pricing</a>
            <a href="#ai">Classora AI</a>
          </div>
          <div>
            <h4>School</h4>
            <a href="#how">How it works</a>
            <a href="#faq">FAQ</a>
            <a href="#contact">Contact</a>
            <a href="#about">Why Classora</a>
          </div>
          <div>
            <h4>Get started</h4>
            {allowSignup && <button type="button" onClick={startSchool}>Create account</button>}
            <button type="button" onClick={() => go("/login")}>Staff login</button>
            <button type="button" onClick={startDemo}>View demo</button>
          </div>
        </div>
        <div className="lp-legal">
          <span>© {new Date().getFullYear()} Classora. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
