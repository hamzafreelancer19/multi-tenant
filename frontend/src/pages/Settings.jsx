import { useState, useEffect } from "react";
import { School, Building, Hash, Calendar, CheckCircle2, AlertTriangle, ShieldCheck, MapPin, Phone } from "lucide-react";
import PremiumCard from "../components/ui/PremiumCard";
import api from "../api/axios";
import { getUser } from "../store/authStore";

export default function Settings() {
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = getUser();

  const fetchSchool = async () => {
    try {
      const res = await api.get("schools/");
      const schools = res.data;
      const mySchool = schools.find(s => s.id === Number(user?.school)) || schools[0];
      setSchool(mySchool);
    } catch (err) {
      console.error("Failed to fetch settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchool();
  }, []);

  if (loading) return (
    <div className="page" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div className="spin" style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%' }} />
    </div>
  );

  if (!school) return (
    <div className="page">
      <PremiumCard className="card" auroraColor="var(--red)" style={{ textAlign: 'center', padding: 40 }}>
        <p>No school profile found for your account.</p>
      </PremiumCard>
    </div>
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">School Settings</h1>
          <p className="page-subtitle">Manage your institution's profile and preferences</p>
        </div>
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginTop: '24px' }}>
        {/* Profile Card */}
        <PremiumCard className="card" auroraColor="var(--accent)">
          <div className="card-header">
            <h3 className="card-title"><Building size={18} /> General Information</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 60, height: 60, borderRadius: 12, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <School size={32} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{school.name}</h2>
                <span className={`badge-status ${school.status === 'Approved' ? 'badge-active' : 'badge-warning'}`} style={{ marginTop: 4 }}>
                  {school.status}
                </span>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '10px 0' }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                  <Hash size={12} /> SCHOOL CODE
                </label>
                <div style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: 14 }}>{school.code}</div>
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                  <Calendar size={12} /> REGISTERED ON
                </label>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{new Date(school.created_at).toLocaleDateString()}</div>
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                  <MapPin size={12} /> ADDRESS
                </label>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{school.address || "Not Provided"}</div>
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                  <Phone size={12} /> CONTACT
                </label>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{school.contact_number || "Not Provided"}</div>
              </div>
            </div>
          </div>
        </PremiumCard>

        {/* Plan Status Card */}
        <PremiumCard className="card" auroraColor="var(--purple)">
          <div className="card-header">
            <h3 className="card-title"><ShieldCheck size={18} /> Subscription & Security</h3>
          </div>
          <div style={{ padding: 24, background: 'var(--bg-hover)', borderRadius: 16, border: '1px solid var(--border)' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2, fontWeight: 600 }}>Current Plan</div>
                  <div style={{ fontSize: 24, fontWeight: 800 }}>{school.plan_type}</div>
                </div>
                <div className={`badge-status ${school.plan_status === 'Active' ? 'badge-active' : 'badge-warning'}`} style={{ padding: '6px 12px' }}>
                  {school.plan_status}
                </div>
             </div>
             
             {school.plan_status === 'Active' ? (
               <div style={{ color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600 }}>
                 <CheckCircle2 size={16} /> Your account is fully verified and secure.
               </div>
             ) : (
               <div style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600 }}>
                 <AlertTriangle size={16} /> Subscription upgrade required for full access.
               </div>
             )}
          </div>
          
          <div style={{ marginTop: 24 }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.5 }}>
              Need to change your plan or update billing? Go to the Subscription page.
            </p>
            <button className="secondary-btn" style={{ width: '100%' }} onClick={() => window.open('/subscription', '_self')}>
              Manage Subscription
            </button>
          </div>
        </PremiumCard>
      </div>
    </div>
  );
}
