import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUser, getRole } from "../store/authStore";
import api from "../api/axios";
import {
  CheckCircle2, Clock, XCircle, Zap, Building2, Rocket,
  CreditCard, ArrowRight, RefreshCw, AlertTriangle, Star, Shield
} from "lucide-react";

const API = "http://127.0.0.1:8000/api";

const plans = [
  {
    id: "Basic",
    name: "Basic",
    icon: <Zap size={28} />,
    price: 1000,
    color: "#3b82f6",
    colorSoft: "rgba(59,130,246,0.1)",
    features: ["Up to 100 Students", "Basic Attendance", "Fee Management", "Student Reports"],
    locked: ["Advanced Analytics", "Multi-teacher Support"],
  },
  {
    id: "Business",
    name: "Business",
    icon: <Building2 size={28} />,
    price: 3000,
    color: "#8b5cf6",
    colorSoft: "rgba(139,92,246,0.1)",
    popular: true,
    features: ["Up to 500 Students", "Full Attendance System", "Fee Management", "Teacher Management", "Advanced Reports"],
    locked: ["Priority Support"],
  },
  {
    id: "Pro",
    name: "Professional",
    icon: <Rocket size={28} />,
    price: 5000,
    color: "#f59e0b",
    colorSoft: "rgba(245,158,11,0.1)",
    features: ["Unlimited Students", "Full Attendance System", "Complete Fee Management", "Teacher Management", "Advanced Analytics", "Priority 24/7 Support"],
    locked: [],
  },
];

export default function Subscription() {
  const navigate = useNavigate();
  const user = getUser();
  const role = getRole();

  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [transactionId, setTransactionId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [showRenewForm, setShowRenewForm] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchSchool();
  }, []);

  const fetchSchool = async () => {
    try {
      setLoading(true);
      const res = await api.get("schools/");
      const schools = res.data;
      if (schools.length === 0) {
        setSchool(null);
        return;
      }
      // Robust matching: Try ID first, then fallback to users school name match if ID fails, 
      // or just take the first school if the current user is an admin for only one school.
      const userSchool = user?.school;
      const mySchool = schools.find(s => s.id === Number(userSchool)) || 
                       schools.find(s => s.name === userSchool) || 
                       schools[0];
      setSchool(mySchool);
    } catch (err) {
      console.error("Failed to fetch school info");
      setSchool(null);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyPlan = async () => {
    if (!selectedPlan || !transactionId.trim()) {
      setMessage({ type: "error", text: "Please select a plan and enter your Transaction ID." });
      return;
    }
    try {
      setSubmitting(true);
      await api.post(
        `schools/${school.id}/buy_plan/`,
        { plan_type: selectedPlan, transaction_id: transactionId }
      );
      setMessage({ type: "success", text: "Your plan request has been submitted! Waiting for Super Admin approval." });
      setTransactionId("");
      setSelectedPlan(null);
      setShowRenewForm(false);
      fetchSchool();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Submission failed. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const daysUsed = school?.plan_start_date
    ? Math.floor((new Date() - new Date(school.plan_start_date)) / (1000 * 60 * 60 * 24))
    : 0;
  const daysLeft = school?.plan_expiry_date
    ? Math.max(0, Math.floor((new Date(school.plan_expiry_date) - new Date()) / (1000 * 60 * 60 * 24)))
    : 0;
  const progress = school?.plan_start_date ? Math.min(100, Math.round((daysUsed / 30) * 100)) : 0;

  const getPlanStatusBadge = () => {
    const s = school?.plan_status;
    if (s === "Active") return { label: "Active", color: "#10b981", bg: "rgba(16,185,129,0.1)", icon: <CheckCircle2 size={14} /> };
    if (s === "Pending") return { label: "Pending Approval", color: "#f59e0b", bg: "rgba(245,158,11,0.1)", icon: <Clock size={14} /> };
    return { label: "Inactive", color: "#ef4444", bg: "rgba(239,68,68,0.1)", icon: <XCircle size={14} /> };
  };

  const badge = getPlanStatusBadge();

  if (loading) {
    return (
      <div className="page" style={{ alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div className="spin" style={{ width: 40, height: 40, border: "3px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%" }} />
      </div>
    );
  }

  return (
    <div className="page" style={{ maxWidth: "100%" }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Subscription</h1>
          <p className="page-subtitle">Manage your school's plan and billing</p>
        </div>
      </div>

      {!school ? (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ width: 60, height: 60, background: 'var(--accent-soft)', color: 'var(--accent)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Building2 size={30} />
          </div>
          <h2 style={{ marginBottom: 12 }}>School Profile Not Found</h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto 24px' }}>
            We couldn't link your account to a registered school. This happens if your registration is still pending or if your account is not correctly linked to a school tenant.
          </p>
          <button className="primary-btn" style={{ margin: '0 auto' }} onClick={fetchSchool}>
            <RefreshCw size={16} /> Retry Fetching Data
          </button>
        </div>
      ) : (
        <>
          {school.status === "Pending" && (
            <div className="card" style={{ background: "rgba(245,158,11,0.05)", border: "1px dashed #f59e0b", padding: "12px 20px", display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <Clock size={20} style={{ color: "#f59e0b" }} />
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: "0.85rem", color: "#b45309" }}>School Registration Approval Pending</p>
                <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)" }}>You can still choose a plan and submit payment. Your account will be fully activated once both the school and payment are approved.</p>
              </div>
            </div>
          )}
          {/* Current Plan Status Card */}
          <div className="card" style={{ background: "linear-gradient(135deg, #0f172a, #1e293b)", color: "white", border: "none", padding: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20 }}>
            <div>
              <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Current Plan</div>
              <div style={{ fontSize: 32, fontWeight: 800, marginBottom: 12 }}>
                {school.plan_type === "None" ? "No Plan" : school.plan_type}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, padding: "6px 14px", borderRadius: 20, background: badge.bg, color: badge.color, width: "fit-content" }}>
                {badge.icon} {badge.label}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              {school.plan_amount > 0 && (
                <div style={{ fontSize: 28, fontWeight: 800 }}>Rs. {school.plan_amount}</div>
              )}
              {school.plan_expiry_date && (
                <div style={{ fontSize: 13, opacity: 0.6, marginTop: 4 }}>Expires: {school.plan_expiry_date}</div>
              )}
            </div>
          </div>

          {/* Progress Bar - only if active */}
          {school.plan_status === "Active" && (
            <div style={{ marginTop: 28 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 10, opacity: 0.8 }}>
                <span>📅 {daysUsed} days used</span>
                <span>⏳ {daysLeft} days remaining</span>
              </div>
              <div style={{ height: 8, background: "rgba(255,255,255,0.1)", borderRadius: 10 }}>
                <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg, #3b82f6, #8b5cf6)", borderRadius: 10, transition: "width 0.5s ease" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
                <button
                  onClick={() => setShowRenewForm(!showRenewForm)}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, color: "white", cursor: "pointer", fontWeight: 600, fontSize: 14 }}
                >
                  <RefreshCw size={16} /> {showRenewForm ? "Cancel Renewal" : "Renew / Upgrade Plan"}
                </button>
              </div>
            </div>
          )}

          {/* Pending message */}
          {school.plan_status === "Pending" && (
            <div style={{ marginTop: 20, padding: 14, background: "rgba(245,158,11,0.15)", borderRadius: 10, display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
              <AlertTriangle size={16} style={{ color: "#f59e0b", flexShrink: 0 }} />
              <span>Your <strong>{school.plan_type}</strong> plan is awaiting approval. Transaction ID: <strong>{school.transaction_id}</strong></span>
            </div>
          )}
          </div>
        </>
      )}

      {/* Show plan selection if inactive, pending, none, or showing renew */}
      {(school && (school.plan_status === "Inactive" || school.plan_status === "Pending" || school.plan_status === "None" || !school.plan_status || showRenewForm)) && (
        <>
          {/* Payment Instructions */}
          <div className="card" style={{ border: "1px solid rgba(59,130,246,0.3)", background: "rgba(59,130,246,0.03)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, background: "rgba(59,130,246,0.1)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)" }}>
                <CreditCard size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>Payment Instructions</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>EasyPaisa / Bank Transfer</div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
              <div style={{ padding: 14, background: "var(--bg-hover)", borderRadius: 10 }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>ACCOUNT NAME</div>
                <div style={{ fontWeight: 700 }}>EduSaaS Pakistan</div>
              </div>
              <div style={{ padding: 14, background: "var(--bg-hover)", borderRadius: 10 }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>EASYPAISA NUMBER</div>
                <div style={{ fontWeight: 700, letterSpacing: 1 }}>0311-1618358</div>
              </div>
              <div style={{ padding: 14, background: "var(--bg-hover)", borderRadius: 10 }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>PAYMENT METHOD</div>
                <div style={{ fontWeight: 700 }}>EasyPaisa Send Money</div>
              </div>
            </div>
          </div>

          {/* Plans Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
            {plans.map((plan) => (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                style={{
                  position: "relative",
                  background: selectedPlan === plan.id ? plan.colorSoft : "var(--bg-card)",
                  border: `2px solid ${selectedPlan === plan.id ? plan.color : "var(--border)"}`,
                  borderRadius: 20,
                  padding: 28,
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  transform: plan.popular ? "scale(1.02)" : "none",
                }}
              >
                {plan.popular && (
                  <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: plan.color, color: "white", fontSize: 11, fontWeight: 700, padding: "4px 16px", borderRadius: 20, display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
                    <Star size={11} /> Most Popular
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                  <div style={{ width: 50, height: 50, background: plan.colorSoft, color: plan.color, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {plan.icon}
                  </div>
                  {selectedPlan === plan.id && (
                    <CheckCircle2 size={22} style={{ color: plan.color }} />
                  )}
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>{plan.name}</div>
                <div style={{ fontSize: 36, fontWeight: 800, color: plan.color, marginBottom: 20 }}>
                  Rs. {plan.price?.toLocaleString() || "0"}
                  <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-muted)" }}>/mo</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {plan.features.map((f) => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                      <CheckCircle2 size={15} style={{ color: plan.color, flexShrink: 0 }} /> {f}
                    </div>
                  ))}
                  {plan.locked.map((f) => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, opacity: 0.35 }}>
                      <XCircle size={15} style={{ flexShrink: 0 }} /> {f}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Transaction ID + Submit */}
          <div className="card">
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
              <Shield size={18} style={{ color: "var(--accent)" }} /> Submit Payment Details
            </div>
            {message && (
              <div style={{ padding: "12px 16px", borderRadius: 10, marginBottom: 16, fontSize: 13, display: "flex", alignItems: "center", gap: 8, background: message.type === "success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: message.type === "success" ? "#10b981" : "#ef4444", border: `1px solid ${message.type === "success" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}` }}>
                {message.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                {message.text}
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "flex-end" }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  EasyPaisa Transaction ID
                </label>
                <input
                  className="input-field"
                  placeholder="e.g. EP-123456789"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  style={{ height: 46 }}
                />
              </div>
              <button
                onClick={handleBuyPlan}
                disabled={submitting || !selectedPlan || !transactionId}
                style={{ height: 46, padding: "0 28px", background: selectedPlan ? plans.find(p => p.id === selectedPlan)?.color || "var(--accent)" : "var(--bg-hover)", color: selectedPlan ? "white" : "var(--text-muted)", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: submitting || !selectedPlan ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap", transition: "all 0.3s" }}
              >
                {submitting ? "Submitting..." : <><ArrowRight size={18} /> Submit Plan</>}
              </button>
            </div>
            {selectedPlan && (
              <div style={{ marginTop: 12, fontSize: 12, color: "var(--text-muted)" }}>
                Selected: <strong>{plans.find(p => p.id === selectedPlan)?.name}</strong> — Rs. {plans.find(p => p.id === selectedPlan)?.price?.toLocaleString() || "0"} / month
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
