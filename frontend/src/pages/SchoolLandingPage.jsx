import React, { useState, useEffect } from 'react';
import { useTenant } from '../context/TenantContext';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api/axios';
import './SchoolLandingPage.css';
import {
  ArrowRight, CheckCircle, Globe, GraduationCap,
  Users, Clock, Award, Star, Mail, Phone,
  MapPin, ChevronRight, Sparkles, Menu, X
} from 'lucide-react';

const SchoolLandingPage = () => {
  const tenant = useTenant();
  const navigate = useNavigate();
  const { school_slug } = useParams();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (school_slug) {
      tenant.setForcedSchool(school_slug);
    }
  }, [school_slug]);

  // Enrollment State
  const [enrollData, setEnrollData] = useState({
    student_name: '',
    student_age: '',
    father_name: '',
    father_phone: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleEnrollSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/enrollments/', {
        ...enrollData,
        school: tenant.schoolId,
        status: 'Pending'
      });
      setSubmitSuccess(true);
      setEnrollData({
        student_name: '',
        student_age: '',
        father_name: '',
        father_phone: ''
      });
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (err) {
      console.error('Enrollment failed:', err);
      alert('Enrollment failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (tenant.loading) {
    return (
      <div className="slp-loading">
        <div className="slp-spinner"></div>
      </div>
    );
  }

  const languages = (tenant.landing?.languages && tenant.landing.languages.length > 0) ? tenant.landing.languages : [
    { name: "ENGLISH", flag: "🇬🇧", top: "-5%", left: "50%" },
    { name: "CHINESE", flag: "🇨🇳", top: "25%", left: "100%" },
    { name: "SPANISH", flag: "🇪🇸", top: "75%", left: "95%" },
    { name: "GERMAN", flag: "🇩🇪", top: "105%", left: "50%" },
    { name: "FRENCH", flag: "🇫🇷", top: "75%", left: "5%" },
  ];

  const features = (tenant.landing?.features && tenant.landing.features.length > 0) ? tenant.landing.features : [
    { icon: <Users size={32} />, title: "Prof Teachers", color: "#5D5DFF", bg: "#EEF2FF", desc: "Certified native speakers with a passion for early childhood development." },
    { icon: <Award size={32} />, title: "Modern Curriculum", color: "#EC4899", bg: "#FDF2F8", desc: "A scientifically-proven curriculum tailored for different age groups." },
    { icon: <Clock size={32} />, title: "Flex Schedule", color: "#F59E0B", bg: "#FFFBEB", desc: "Classes available 24/7 to fit your busy family lifestyle." },
    { icon: <CheckCircle size={32} />, title: "Int'l Certification", color: "#3B82F6", bg: "#EFF6FF", desc: "Gain recognized certificates to track your child's global progress." }
  ];

  const programs = (tenant.landing?.programs && tenant.landing.programs.length > 0) ? tenant.landing.programs : [
    { title: "Kids Academy", age: "AGES 3-7 YEARS", price: "200", badge: "MOST POPULAR", bg: "#5D5DFF", desc: "Building strong foundations in reading, writing, and conversational flow." },
    { title: "Junior Explorers", age: "AGES 8-12 YEARS", price: "250", bg: "#EC4899", desc: "Mastering complex grammar and advanced vocabulary through projects." },
    { title: "Teen Fluency", age: "AGES 13-17 YEARS", price: "300", bg: "#5D5DFF", desc: "Achieving near-native fluency and cultural immersion for future leaders." }
  ];

  const testimonials = (tenant.landing?.testimonials && tenant.landing.testimonials.length > 0) ? tenant.landing.testimonials : [
    { name: "Sarah Jenkins", role: "Mother of Leo (7y)", img: "https://i.pravatar.cc/150?u=sarah", quote: "Lingukids transformed how my daughter sees languages. She's now excited to speak Spanish!" },
    { name: "David Chen", role: "Father of Maya (10y)", img: "https://i.pravatar.cc/150?u=david", quote: "The curriculum is engaging and the teachers are truly world-class. Highly recommended." },
    { name: "Elena Rodriguez", role: "Mother of Sofia (5y)", img: "https://i.pravatar.cc/150?u=elena", quote: "Best investment for my child's future. The progress she made in 3 months is incredible." }
  ];

  return (
    <div className={`slp-wrapper ${mobileMenuOpen ? 'mobile-menu-active' : ''}`} style={{ '--primary': tenant.landing?.primary_color || '#5D5DFF' }}>
      {/* Navbar */}
      <nav className="slp-nav">
        <div className="slp-logo">
          <div className="slp-logo-icon">
            <Globe size={28} />
          </div>
          <span className="slp-logo-text uppercase">
            {tenant.schoolName || 'ALPINE'}
          </span>
        </div>

        <div className={`slp-nav-links ${mobileMenuOpen ? 'open' : ''}`}>
          <a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
          <a href="#programs" onClick={() => setMobileMenuOpen(false)}>Programs</a>
          <a href="#testimonials" onClick={() => setMobileMenuOpen(false)}>Reviews</a>
          <div className="slp-mobile-actions">
            <button className="slp-btn-text" onClick={() => navigate('/login')}>Login</button>
            <button className="slp-btn-primary" onClick={() => navigate('/signup')}>Register</button>
          </div>
        </div>

        <button className="slp-mobile-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>

        <div className="slp-nav-actions">
          <button className="slp-btn-text">Start Free Trial</button>
          <button className="slp-btn-primary">Register</button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="slp-hero">
        <div className="slp-hero-content">
          <div className="slp-hero-badge">
            PREMIUM LANGUAGE ACADEMY
          </div>
          <h1 className="slp-hero-title">
            {tenant.landing?.hero_title ? (
              tenant.landing.hero_title.split(' ').map((word, i) => (
                <span key={i} style={{ color: word === 'Fun' || word === 'Made' ? 'var(--primary)' : 'inherit' }}>{word} </span>
              ))
            ) : (
              <>Learning <br /> Languages <br /> <span>Made Fun</span> <br />and Easy</>
            )}
          </h1>
          <p className="slp-hero-desc">
            {tenant.landing?.hero_subtitle || "Empowering the next generation of global citizens through immersive, playful, and scientifically-proven language learning methods."}
          </p>
          <div className="slp-hero-btns">
            <button className="slp-btn-orange">
              Start Free Trial
            </button>
            <button className="slp-btn-text" style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              View Programs <ArrowRight size={24} />
            </button>
          </div>
        </div>

        <div className="slp-hero-img-container">
          <img src={tenant.landing?.hero_image_url || "/assets/hero-kids.png"} alt="Kids Learning" className="slp-hero-img" />
          <motion.div
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            style={{ position: 'absolute', top: '10%', left: '5%', background: 'white', padding: '12px 24px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontWeight: '900', fontSize: '14px' }}
          >
            Ahold 👏
          </motion.div>
          <motion.div
            animate={{ y: [0, 15, 0] }}
            transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
            style={{ position: 'absolute', bottom: '20%', right: '5%', background: 'white', padding: '12px 24px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontWeight: '900', fontSize: '14px', color: '#EC4899' }}
          >
            Hello! ✌️
          </motion.div>
        </div>
      </header>

      {/* Why Choose Us */}
      <section className="slp-features" id="features">
        <div className="slp-section-head">
          <h2>Why Choose Our School</h2>
          <p>We combine advanced pedagogical techniques with a playful environment to ensure your child loves every minute of their journey.</p>
        </div>

        <div className="slp-features-grid">
          {features.map((feature, i) => (
            <div key={i} className="slp-feature-card">
              <div className="slp-feature-icon" style={{ backgroundColor: feature.bg || '#EEF2FF', color: feature.color || 'var(--primary)' }}>
                {feature.icon || <Sparkles size={32} />}
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.desc || "Certified native speakers with a passion for early childhood development and modern teaching methods."}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Languages Section */}
      <section className="slp-languages" id="languages">
        <h2 style={{ fontSize: '50px', fontWeight: 900, marginBottom: '20px' }}>Choose From Multiple Languages</h2>

        <div className="slp-orbit-wrapper">
          <div className="slp-center-img">
            <img src={tenant.landing?.center_image_url || "/assets/lang-child.png"} alt="Student" />
          </div>

          <div className="slp-orbit-container">
            {languages.map((lang, i) => (
              <div key={i} className="slp-lang-item" style={{ top: lang.top, left: lang.left }}>
                <div className="slp-lang-flag">{lang.flag}</div>
                <span className="slp-lang-label">{lang.name}</span>
              </div>
            ))}
          </div>

          {/* Decorative ring */}
          <div className="slp-orbit-ring"></div>
        </div>
      </section>

      {/* Tailored Programs */}
      <section className="slp-programs" id="programs">
        <div className="slp-programs-head">
          <div>
            <h2 style={{ fontSize: '50px', fontWeight: 900, marginBottom: '10px' }}>Our Tailored Programs</h2>
            <p style={{ color: '#64748B', fontWeight: 600 }}>The perfect fit for every stage of development.</p>
          </div>
          <button className="slp-btn-text" style={{ color: '#5D5DFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
            All Courses <ChevronRight size={20} />
          </button>
        </div>

        <div className="slp-programs-grid">
          {programs.map((program, i) => (
            <div key={i} className="slp-program-card">
              {program.badge && <span className="slp-program-badge">{program.badge}</span>}
              <div style={{ width: '60px', height: '60px', background: 'white', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: program.bg || program.color || 'var(--primary)', marginBottom: '30px', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }}>
                <GraduationCap size={32} />
              </div>
              <h3 style={{ fontSize: '30px', fontWeight: 900, marginBottom: '10px' }}>{program.title}</h3>
              <p style={{ fontSize: '11px', fontWeight: 900, color: program.bg || program.color || 'var(--primary)', letterSpacing: '1px', marginBottom: '25px' }}>{program.age}</p>
              <p style={{ color: '#64748B', lineHeight: 1.6, marginBottom: '40px' }}>{program.desc || "Building strong foundations in reading, writing, and conversational flow through interactive games and stories."}</p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '30px', borderTop: '1px solid #F1F5F9' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span style={{ fontSize: '32px', fontWeight: 900, color: '#1E1B4B', tracking: '-1px' }}>${program.price}</span>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: '#94A3B8' }}>/mo</span>
                </div>
                <button className="slp-btn-more">Learn More</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Enrollment Form */}
      <section className="slp-enrollment" id="enroll">
        <div className="slp-enroll-container">
          <div className="slp-enroll-info">
            <h2 style={{ fontSize: '45px', fontWeight: 900, marginBottom: '20px' }}>Apply for Admission</h2>
            <p style={{ color: '#64748B', fontSize: '18px', fontWeight: 500, lineHeight: 1.6, marginBottom: '40px' }}>
              Take the first step towards your child's bright future. Fill out the form and our advisor will get back to you within 24 hours.
            </p>
            <div className="slp-enroll-benefits">
              <div className="slp-benefit">
                <CheckCircle size={20} color="var(--primary)" />
                <span>Priority registration for new batches</span>
              </div>
              <div className="slp-benefit">
                <CheckCircle size={20} color="var(--primary)" />
                <span>Free language proficiency assessment</span>
              </div>
              <div className="slp-benefit">
                <CheckCircle size={20} color="var(--primary)" />
                <span>Guided campus tour (virtual/offline)</span>
              </div>
            </div>
          </div>

          <div className="slp-enroll-form-card">
            <form onSubmit={handleEnrollSubmit}>
              <div className="slp-form-group">
                <label>Student Name</label>
                <input 
                  type="text" 
                  placeholder="Enter child's full name" 
                  required 
                  value={enrollData.student_name}
                  onChange={(e) => setEnrollData({...enrollData, student_name: e.target.value})}
                />
              </div>
              <div className="slp-form-row">
                <div className="slp-form-group">
                  <label>Age</label>
                  <input 
                    type="number" 
                    placeholder="Years" 
                    required 
                    value={enrollData.student_age}
                    onChange={(e) => setEnrollData({...enrollData, student_age: e.target.value})}
                  />
                </div>
                <div className="slp-form-group">
                  <label>Father's Name</label>
                  <input 
                    type="text" 
                    placeholder="Full name" 
                    required 
                    value={enrollData.father_name}
                    onChange={(e) => setEnrollData({...enrollData, father_name: e.target.value})}
                  />
                </div>
              </div>
              <div className="slp-form-group">
                <label>Father's Phone Number</label>
                <input 
                  type="tel" 
                  placeholder="+1 (234) 567-890" 
                  required 
                  value={enrollData.father_phone}
                  onChange={(e) => setEnrollData({...enrollData, father_phone: e.target.value})}
                />
              </div>
              <button 
                type="submit" 
                className="slp-btn-primary" 
                style={{ width: '100%', padding: '18px', fontSize: '16px', marginTop: '10px' }}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Enrollment Request'}
              </button>
              {submitSuccess && (
                <p style={{ color: '#10B981', fontWeight: 800, textAlign: 'center', marginTop: '20px', fontSize: '14px' }}>
                  🎉 Enrollment submitted successfully! We'll contact you soon.
                </p>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="slp-testimonials" id="testimonials">
        <h2 style={{ textAlign: 'center', fontSize: '50px', fontWeight: 900, marginBottom: '80px' }}>What Parents Say About Us</h2>

        <div className="slp-test-grid">
          {testimonials.map((t, i) => (
            <div key={i} className="slp-test-card">
              <div style={{ display: 'flex', gap: '5px', color: '#FBBF24', marginBottom: '25px' }}>
                {[...Array(5)].map((_, j) => <Star key={j} size={20} fill="currentColor" />)}
              </div>
              <p style={{ fontSize: '18px', fontWeight: 500, color: '#475569', lineHeight: 1.7, marginBottom: '35px', fontStyle: 'italic' }}>
                "{t.quote || "Lingukids transformed how my daughter sees languages. She's now excited to speak Spanish every single day!"}"
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <img src={t.img || "https://i.pravatar.cc/150"} alt={t.name} style={{ width: '55px', height: '55px', borderRadius: '50%', objectFit: 'cover' }} />
                <div>
                  <h4 style={{ fontWeight: 900, fontSize: '16px' }}>{t.name}</h4>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8' }}>{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Box */}
      <section className="slp-cta">
        <div className="slp-cta-box">
          <h2>Give Your Child the <br /> Gift of Language</h2>
          <p style={{ fontSize: '20px', fontWeight: 600, marginBottom: '50px', opacity: 0.9 }}>
            Start their journey today with a 7-day free trial. <br /> No commitments, just pure learning fun.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '30px' }}>
            <button style={{ padding: '20px 50px', background: 'white', color: '#5D5DFF', border: 'none', borderRadius: '50px', fontSize: '18px', fontWeight: 900, cursor: 'pointer', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>Enroll Today</button>
            <button style={{ padding: '20px 50px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '2px solid rgba(255,255,255,0.3)', borderRadius: '50px', fontSize: '18px', fontWeight: 900, cursor: 'pointer', backdropFilter: 'blur(10px)' }}>Speak to Advisor</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="slp-footer">
        <div className="slp-footer-grid">
          <div>
            <div className="slp-logo" style={{ marginBottom: '30px' }}>
              <div className="slp-logo-icon"><Globe size={24} /></div>
              <span className="slp-logo-text uppercase">{tenant.schoolName || 'ALPINE'}</span>
            </div>
            <p style={{ color: '#94A3B8', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', lineHeight: 1.8 }}>
              © {new Date().getFullYear()} {tenant.schoolName || 'Lingukids'} Academy. <br />Educational Excellence for Kids.
            </p>
          </div>

          <div>
            <h4 style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '30px' }}>Programs</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <li><a href="#" style={{ textDecoration: 'none', fontSize: '12px', fontWeight: 700, color: '#64748B' }}>Kids Academy</a></li>
              <li><a href="#" style={{ textDecoration: 'none', fontSize: '12px', fontWeight: 700, color: '#64748B' }}>Junior Explorers</a></li>
              <li><a href="#" style={{ textDecoration: 'none', fontSize: '12px', fontWeight: 700, color: '#64748B' }}>Teen Fluency</a></li>
            </ul>
          </div>

          <div>
            <h4 style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '30px' }}>Quick Links</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <li><a href="#" style={{ textDecoration: 'none', fontSize: '12px', fontWeight: 700, color: '#64748B' }}>Teachers</a></li>
              <li><a href="#" style={{ textDecoration: 'none', fontSize: '12px', fontWeight: 700, color: '#64748B' }}>Privacy Policy</a></li>
              <li><a href="#" style={{ textDecoration: 'none', fontSize: '12px', fontWeight: 700, color: '#64748B' }}>Careers</a></li>
            </ul>
          </div>

          <div>
            <h4 style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '30px' }}>Contact</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', fontWeight: 700, color: '#64748B' }}>
                <Mail size={16} color="var(--primary)" /> {tenant.landing?.contact_email || "hello@lingukids.edu"}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', fontWeight: 700, color: '#64748B' }}>
                <Phone size={16} color="var(--primary)" /> {tenant.landing?.contact_phone || "+1 (234) 567-890"}
              </div>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: '10px', fontWeight: 900, color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: '4px' }}>Designed with love for the leaders of tomorrow</p>
          <div style={{ display: 'flex', gap: '30px' }}>
            <a href="#" style={{ textDecoration: 'none', fontSize: '10px', fontWeight: 900, color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: '2px' }}>Terms</a>
            <a href="#" style={{ textDecoration: 'none', fontSize: '10px', fontWeight: 900, color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: '2px' }}>Cookies</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SchoolLandingPage;