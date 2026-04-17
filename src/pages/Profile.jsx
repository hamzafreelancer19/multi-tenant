import { getUser, getRole } from "../store/authStore";
import { User, Mail, Shield, Calendar, School, CheckCircle, Activity } from "lucide-react";

export default function Profile() {
  const user = getUser();
  const role = getRole();

  const infoItems = [
    { label: "Username", value: user?.username, icon: <User size={18} /> },
    { label: "Email", value: user?.email || "No email provided", icon: <Mail size={18} /> },
    { label: "Role", value: role?.toUpperCase(), icon: <Shield size={18} /> },
    { label: "Joined Platform", value: user?.date_joined ? new Date(user.date_joined).toLocaleDateString() : "N/A", icon: <Calendar size={18} /> },
  ];

  return (
    <div className="page-container" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="page-header" style={{ textAlign: 'center', display: 'block' }}>
        <h1 className="page-title">User Profile</h1>
        <p className="page-sub">Manage your personal account settings and preferences</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '24px', marginTop: '32px' }}>
        {/* Profile Card */}
        <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', height: 'fit-content' }}>
          <div style={{ 
            width: '100px', height: '100px', 
            borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--purple))',
            margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '36px', fontWeight: 800, color: 'white', box_shadow: '0 8px 24px rgba(var(--accent-rgb), 0.3)'
          }}>
            {user?.username?.[0]?.toUpperCase() || "U"}
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>{user?.username}</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>{role}</p>
          
          <div style={{ marginTop: '24px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <span className="badge badge-success">Active</span>
            <span className="badge" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>Verified</span>
          </div>

          <div style={{ marginTop: '32px', borderTop: '1px solid var(--border)', paddingTop: '24px', textAlign: 'left' }}>
             <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '16px' }}>Account History</p>
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <Activity size={16} color="var(--accent)" />
                <span style={{ fontSize: '13px' }}>Last login: Today</span>
             </div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <CheckCircle size={16} color="var(--green)" />
                <span style={{ fontSize: '13px' }}>Identity Verified</span>
             </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="glass-panel" style={{ padding: '32px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
             General Information
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {infoItems.map((item, idx) => (
              <div key={idx} style={{ displlay: 'flex', gap: '16px', alignItems: 'center', padding: '16px', background: 'var(--bg-hover)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                 <div style={{ color: 'var(--accent)', background: 'var(--accent-soft)', padding: '10px', borderRadius: '10px' }}>
                    {item.icon}
                 </div>
                 <div>
                    <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', margin: 0 }}>{item.label}</p>
                    <p style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>{item.value}</p>
                 </div>
              </div>
            ))}
          </div>

          {user?.school_name && (
            <div style={{ marginTop: '32px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    Linked Institution
                </h3>
                <div style={{ padding: '20px', background: 'linear-gradient(135deg, var(--bg-hover), transparent)', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', background: 'var(--bg-card)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', border: '1px solid var(--border)' }}>
                        <School size={24} />
                    </div>
                    <div>
                        <p style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>{user.school_name || "Platform Admin"}</p>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>Active Tenant System</p>
                    </div>
                    <div className="badge badge-success" style={{ marginLeft: 'auto' }}>Healthy</div>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
