import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import {
  Users, Calendar, CreditCard, FileText, BarChart3, MessageCircle,
  CheckCircle2, Star, Quote, ArrowRight, Globe, Mail, Menu, X
} from "lucide-react";
import { isAuthenticated, setDemoMode } from "../store/authStore";
import BackgroundGlow from "../components/ui/BackgroundGlow";
import GradientBackground from "../components/ui/GradientBackground";
import { useTenant } from "../context/TenantContext";
import "./LandingPage.css";

export default function LandingPage() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const loggedIn = isAuthenticated();
  const tenant = useTenant();
  
  const brandName = tenant?.schoolName || "EduSaaS";

  useEffect(() => {
    if (loggedIn) {
      navigate("/dashboard");
    }
  }, [loggedIn, navigate]);

  const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const startDemo = () => {
    setDemoMode(true);
    navigate("/dashboard");
  };

  return (
    <div className="landing-page">
      {/* Navbar */}
      <nav className={`lp-navbar ${isMobileMenuOpen ? 'active' : ''}`}>
        <div className="lp-logo">
          <div className="logo-icon">
            <span style={{ color: 'white' }}>{brandName[0]}</span>
          </div>
          {brandName}
        </div>

        <div className={`lp-nav-links ${isMobileMenuOpen ? 'show' : ''}`}>
          <a href="#features" onClick={() => setIsMobileMenuOpen(false)}>Features</a>
          <a href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)}>How it Works</a>
          <a href="#pricing" onClick={() => setIsMobileMenuOpen(false)}>Pricing</a>
          <a href="#testimonials" onClick={() => setIsMobileMenuOpen(false)}>Testimonials</a>
          <div className="lp-nav-mobile-actions">
            {loggedIn ? (
              <button className="lp-btn-primary" onClick={() => { navigate("/dashboard"); setIsMobileMenuOpen(false) }}>Dashboard</button>
            ) : (
              <>
                <button className="lp-btn-outline" onClick={() => { navigate("/login"); setIsMobileMenuOpen(false) }}>Login</button>
                <button className="lp-btn-primary" onClick={() => { navigate("/login"); setIsMobileMenuOpen(false) }}>Get Started</button>
              </>
            )}
          </div>
        </div>

        <div className="lp-nav-actions lp-desktop-only">
          {loggedIn ? (
            <button className="lp-btn-primary" onClick={() => navigate("/dashboard")}>Go to Dashboard</button>
          ) : (
            <>
              <button className="lp-btn-outline" onClick={() => navigate("/login")}>Login</button>
              <button className="lp-btn-primary" onClick={() => navigate("/login")}>Get Started</button>
            </>
          )}
        </div>

        <button className="lp-menu-toggle" onClick={toggleMenu}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Hero */}
      <section className="lp-hero">
        <div className="lp-hero-container">
          <div className="lp-hero-content">
            <div className="lp-badge">✨ NEW V2.0 IS LIVE!</div>
            <h1 className="lp-hero-title">
              Smart School <br /><span>Management</span> System
            </h1>
            <p className="lp-hero-desc">
              Manage Students, Attendance, Fees, Exams & Reports in one powerful platform designed for the modern academic institution.
            </p>
            <div className="lp-hero-actions">
              {loggedIn ? (
                <button className="lp-btn-primary" onClick={() => navigate("/dashboard")}>Back to Dashboard <ArrowRight size={18} /></button>
              ) : (
                <>
                  <button className="lp-btn-primary" onClick={() => navigate("/login")}>Start Free Trial</button>
                  <button className="lp-btn-secondary" onClick={startDemo}>View Demo</button>
                </>
              )}
            </div>
          </div>

          <div className="lp-hero-image">
            <div className="lp-mock-dash">
              <div className="lp-mock-header">
                <div className="lp-mock-dot r"></div>
                <div className="lp-mock-dot y"></div>
                <div className="lp-mock-dot g"></div>
                <div className="lp-mock-address-bar">edusees.com/dashboard</div>
              </div>
              <div className="lp-mock-body-img">
                <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" alt="Dashboard Mockup" />
                <div className="lp-mock-overlay"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="lp-section lp-section-bg" id="features">
        <h2 className="lp-section-title">Precision in Every Module</h2>
        <p className="lp-section-desc">Everything you need to run your school efficiently, from basic attendance to complex academic reporting.</p>

        <div className="lp-features-grid">
          <div className="lp-feature-card sazzad-card">
            <div className="sazzad-bg"></div>
            <div className="sazzad-aurora"></div>
            <div className="sazzad-content">
              <div className="lp-feature-icon"><Users size={24} /></div>
              <h3 className="lp-feature-title">Student Management</h3>
              <p className="lp-feature-desc">Centralized database for student profiles, academic history, and behavioral records with instant access.</p>
            </div>
          </div>
          <div className="lp-feature-card sazzad-card">
            <div className="sazzad-bg"></div>
            <div className="sazzad-aurora"></div>
            <div className="sazzad-content">
              <div className="lp-feature-icon"><Calendar size={24} /></div>
              <h3 className="lp-feature-title">Attendance Tracking</h3>
              <p className="lp-feature-desc">Automated attendance logging with instant SMS/Email notifications to parents for absences.</p>
            </div>
          </div>
          <div className="lp-feature-card sazzad-card">
            <div className="sazzad-bg"></div>
            <div className="sazzad-aurora"></div>
            <div className="sazzad-content">
              <div className="lp-feature-icon"><CreditCard size={24} /></div>
              <h3 className="lp-feature-title">Fee Management</h3>
              <p className="lp-feature-desc">Streamlined online payments, automated invoicing, and clear financial reporting for school accounts.</p>
            </div>
          </div>
          <div className="lp-feature-card sazzad-card">
            <div className="sazzad-bg"></div>
            <div className="sazzad-aurora"></div>
            <div className="sazzad-content">
              <div className="lp-feature-icon"><FileText size={24} /></div>
              <h3 className="lp-feature-title">Exam & Results</h3>
              <p className="lp-feature-desc">Simplified exam scheduling and automated report card generation with detailed performance analysis.</p>
            </div>
          </div>
          <div className="lp-feature-card sazzad-card">
            <div className="sazzad-bg"></div>
            <div className="sazzad-aurora"></div>
            <div className="sazzad-content">
              <div className="lp-feature-icon"><BarChart3 size={24} /></div>
              <h3 className="lp-feature-title">Reports & Analytics</h3>
              <p className="lp-feature-desc">Data-driven insights into school performance, teacher efficiency, and overall academic growth.</p>
            </div>
          </div>
          <div className="lp-feature-card sazzad-card">
            <div className="sazzad-bg"></div>
            <div className="sazzad-aurora"></div>
            <div className="sazzad-content">
              <div className="lp-feature-icon"><MessageCircle size={24} /></div>
              <h3 className="lp-feature-title">Parent Portal</h3>
              <p className="lp-feature-desc">Dedicated mobile-first portal for parents to track their child's progress and interact with teachers.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Split section */}
      <section id="how-it-works">
        <BackgroundGlow variant="both" className="lp-section">
          <div className="lp-split">
            <div className="lp-split-img" style={{ background: 'url("https://images.unsplash.com/photo-1524178232363-1fb2b075b655?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80") center/cover' }}>
              {/* Image placeholder */}
            </div>
            <div className="lp-split-content">
              <h2 className="lp-section-title">Seamless Transition to Digital Excellence</h2>
              <br />
              <div className="lp-step">
                <div className="lp-step-num">1</div>
                <div>
                  <h4 className="lp-step-title">Add School Data</h4>
                  <p className="lp-step-desc">Import your student lists, teacher profiles, and previous academic records with our bulk upload tools.</p>
                </div>
              </div>
              <div className="lp-step">
                <div className="lp-step-num">2</div>
                <div>
                  <h4 className="lp-step-title">Manage Operations</h4>
                  <p className="lp-step-desc">Start taking attendance, managing fees, and scheduling classes in real-time through our intuitive dashboards.</p>
                </div>
              </div>
              <div className="lp-step">
                <div className="lp-step-num">3</div>
                <div>
                  <h4 className="lp-step-title">Track & Report</h4>
                  <p className="lp-step-desc">Generate complex academic and financial reports with one click to keep your stakeholders informed.</p>
                </div>
              </div>
            </div>
          </div>
        </BackgroundGlow>
      </section>

      {/* Pricing */}
      <section className="lp-section lp-section-bg" id="pricing">
        <h2 className="lp-section-title">Pricing Tailored for Every Institution</h2>
        <p className="lp-section-desc">Transparent plans with no hidden fees. Upgrade as your student body grows.</p>

        <div className="lp-pricing-grid">
          {/* Basic */}
          <div className="lp-price-card sazzad-card">
            <div className="sazzad-bg"></div>
            <div className="sazzad-aurora"></div>
            <div className="sazzad-content">
              <div className="lp-plan-name">Basic</div>
              <div className="lp-plan-price">$49<span>/mo</span></div>
              <div className="lp-plan-features">
                <div className="lp-plan-feature"><CheckCircle2 size={18} /> Up to 250 Students</div>
                <div className="lp-plan-feature"><CheckCircle2 size={18} /> Core Management Tools</div>
                <div className="lp-plan-feature"><CheckCircle2 size={18} /> Attendance Tracking</div>
                <div className="lp-plan-feature" style={{ opacity: 0.5 }}><CheckCircle2 size={18} /> Advanced Analytics</div>
              </div>
              <button className="lp-btn-secondary" onClick={() => navigate(loggedIn ? "/subscription" : "/login")}>Start Basic</button>
            </div>
          </div>

          {/* Standard */}
          <div className="lp-price-card lp-price-highlight sazzad-card">
            <div className="sazzad-bg"></div>
            <div className="sazzad-aurora"></div>
            <div className="sazzad-content">
              <div className="lp-price-badge">Most Popular</div>
              <div className="lp-plan-name">Standard</div>
              <div className="lp-plan-price">$149<span>/mo</span></div>
              <div className="lp-plan-features">
                <div className="lp-plan-feature"><CheckCircle2 size={18} /> Up to 1000 Students</div>
                <div className="lp-plan-feature"><CheckCircle2 size={18} /> All Basic Features</div>
                <div className="lp-plan-feature"><CheckCircle2 size={18} /> Parent Mobile App</div>
                <div className="lp-plan-feature"><CheckCircle2 size={18} /> Fee Management</div>
              </div>
              <button className="lp-btn-primary" onClick={() => navigate(loggedIn ? "/subscription" : "/login")}>Get Started</button>
            </div>
          </div>

          {/* Premium */}
          <div className="lp-price-card sazzad-card">
            <div className="sazzad-bg"></div>
            <div className="sazzad-aurora"></div>
            <div className="sazzad-content">
              <div className="lp-plan-name">Premium</div>
              <div className="lp-plan-price">$299<span>/mo</span></div>
              <div className="lp-plan-features">
                <div className="lp-plan-feature"><CheckCircle2 size={18} /> Unlimited Students</div>
                <div className="lp-plan-feature"><CheckCircle2 size={18} /> Advanced Reports & Analytics</div>
                <div className="lp-plan-feature"><CheckCircle2 size={18} /> 24/7 Dedicated Support</div>
                <div className="lp-plan-feature"><CheckCircle2 size={18} /> White-label Option</div>
              </div>
              <button className="lp-btn-secondary" onClick={() => navigate(loggedIn ? "/subscription" : "/login")}>Contact Sales</button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="lp-section" id="testimonials">
        <h2 className="lp-section-title">Trusted by Leading Educators</h2>
        <p className="lp-section-desc">Read how schools are transforming their administrative workflows.</p>

        <div className="lp-testi-grid">
          <div className="lp-testi-card sazzad-card">
            <div className="sazzad-bg"></div>
            <div className="sazzad-aurora"></div>
            <div className="sazzad-content">
              <Quote className="lp-quote-icon" size={40} />
              <p className="lp-testi-text">"EduSaaS has completely revolutionized how we handle student records. The interface is intuitive and our staff learned it in days."</p>
              <div className="lp-testi-author">
                <div className="lp-testi-avatar"><img src="https://i.pravatar.cc/150?img=47" alt="User" style={{ width: '100%' }} /></div>
                <div>
                  <div className="lp-testi-name">Sarah Johnson</div>
                  <div className="lp-testi-role">Principal, Oakwood Academy</div>
                </div>
              </div>
            </div>
          </div>
          <div className="lp-testi-card sazzad-card">
            <div className="sazzad-bg"></div>
            <div className="sazzad-aurora"></div>
            <div className="sazzad-content">
              <Quote className="lp-quote-icon" size={40} />
              <p className="lp-testi-text">"The automated fee reminders saved us dozens of hours of admin work this quarter alone. Highly recommended for any growing school."</p>
              <div className="lp-testi-author">
                <div className="lp-testi-avatar"><img src="https://i.pravatar.cc/150?img=11" alt="User" style={{ width: '100%' }} /></div>
                <div>
                  <div className="lp-testi-name">Michael Chen</div>
                  <div className="lp-testi-role">Director, Sycamore School</div>
                </div>
              </div>
            </div>
          </div>
          <div className="lp-testi-card sazzad-card">
            <div className="sazzad-bg"></div>
            <div className="sazzad-aurora"></div>
            <div className="sazzad-content">
              <Quote className="lp-quote-icon" size={40} />
              <p className="lp-testi-text">"The exam management module is a game changer. Reporting is now instant and detailed, making parent-teacher meetings much more effective."</p>
              <div className="lp-testi-author">
                <div className="lp-testi-avatar"><img src="https://i.pravatar.cc/150?img=41" alt="User" style={{ width: '100%' }} /></div>
                <div>
                  <div className="lp-testi-name">Elena Rodriguez</div>
                  <div className="lp-testi-role">Admin Head, International Prep</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="lp-cta-wrapper">
        <div className="lp-cta-container">
          <div className="lp-cta-glass-card">
            <div className="lp-cta-glow"></div>
            <div className="lp-cta-content">
              <h2 className="lp-cta-title">Start Managing Your School Today</h2>
              <p className="lp-cta-desc">Join 500+ schools worldwide that have digitized their entire campus operations with EduSaaS.</p>
              <div className="lp-cta-actions">
                  <button className="lp-btn-premium" onClick={() => navigate(loggedIn ? "/dashboard" : "/login")}>
                    {loggedIn ? "Go to Dashboard" : "Get Started Now"}
                    <ArrowRight size={20} />
                  </button>
                  {!loggedIn && <button className="lp-btn-glass" onClick={startDemo}>View Demo</button>}
                </div>
            </div>
            <div className="lp-cta-visual">
              <div className="lp-cta-blob"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <GradientBackground className="lp-footer">
        <div className="lp-footer-grid">
          <div className="lp-footer-brand">
            <div className="lp-logo">
              <div className="logo-icon">
                <span style={{ color: 'white' }}>{brandName[0]}</span>
              </div>
              {brandName}
            </div>
            <p className="lp-footer-desc">Empowering educational institutions with precision tools for academic and administrative excellence.</p>
            <div className="lp-social">
              <a href="#"><Globe size={20} /></a>
              <a href="#"><Mail size={20} /></a>
            </div>
          </div>

          <div>
            <h4 className="lp-footer-title">Product</h4>
            <div className="lp-footer-links">
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
              <a href="#">Mobile App</a>
            </div>
          </div>

          <div>
            <h4 className="lp-footer-title">Company</h4>
            <div className="lp-footer-links">
              <a href="#">About</a>
              <a href="#">Contact</a>
              <a href="#">Careers</a>
            </div>
          </div>

          <div>
            <h4 className="lp-footer-title">Legal</h4>
            <div className="lp-footer-links">
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
              <a href="#">Security</a>
            </div>
          </div>
        </div>
        <div className="lp-footer-bottom">
          &copy; {new Date().getFullYear()} EduSaaS. Precision in Academic Management.
        </div>
      </GradientBackground>
    </div>
  );
}
