import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  X, 
  Loader2, 
  Trash2, 
  Edit, 
  UserCircle,
  Phone,
  Briefcase,
  DollarSign,
  Calendar,
  Filter,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react';
import { getStaff, createStaff, updateStaff, deleteStaff, getPayroll, createPayroll } from '../api/staffApi';

const StaffManagement = () => {
  const [activeTab, setActiveTab] = useState("staff");
  const [staffList, setStaffList] = useState([]);
  const [payroll, setPayroll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  
  const [staffData, setStaffData] = useState({ name: "", role: "Admin", phone: "", email: "", salary: 0, joining_date: new Date().toISOString().split('T')[0], status: "Active" });
  const [payrollData, setPayrollData] = useState({ staff: "", month: "January", year: 2024, amount_paid: 0 });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sRes, pRes] = await Promise.all([getStaff(), getPayroll()]);
      setStaffList(Array.isArray(sRes.data) ? sRes.data : []);
      setPayroll(Array.isArray(pRes.data) ? pRes.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStaffSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) await updateStaff(editingId, staffData);
      else await createStaff(staffData);
      setShowStaffModal(false);
      fetchData();
    } catch (err) {
      alert("Error saving staff member");
    } finally {
      setSaving(false);
    }
  };

  const handleSalarySave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createPayroll(payrollData);
      setShowSalaryModal(false);
      fetchData();
    } catch (err) {
      alert("Error processing payroll");
    } finally {
      setSaving(false);
    }
  };

  const filteredStaff = staffList.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.role.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="page">
      <style>{`
        .staff-card { background: white; border-radius: 28px; padding: 24px; border: 1px solid rgba(0,0,0,0.03); box-shadow: 0 4px 15px rgba(0,0,0,0.01); transition: 0.3s; }
        .staff-card:hover { transform: translateY(-4px); box-shadow: 0 15px 30px rgba(0,0,0,0.05); }
        .tab-btn { padding: 12px 24px; border-radius: 14px; border: none; font-weight: 800; cursor: pointer; transition: 0.3s; }
        .tab-active { background: #4f46e5; color: white; box-shadow: 0 10px 20px rgba(79, 70, 229, 0.2); }
        .tab-inactive { background: white; color: #64748b; }
        .btn-premium { background: #4f46e5 !important; color: white !important; font-weight: 800 !important; padding: 12px 24px !important; border-radius: 14px !important; border: none !important; cursor: pointer !important; display: flex; align-items: center; gap: 8px; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40, flexWrap: 'wrap', gap: 20 }}>
        <div>
           <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ background: '#4f46e5', padding: 6, borderRadius: 8, color: 'white' }}><Users size={18} /></div>
              <span style={{ fontSize: 10, fontWeight: 900, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '2px' }}>Human Resources</span>
           </div>
           <h1 style={{ fontSize: 36, fontWeight: 900, color: '#0f172a' }}>Staff Directory</h1>
           <p style={{ fontSize: 16, color: '#64748b', fontWeight: 600 }}>Manage non-teaching staff, roles, and monthly payroll.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
           <button onClick={() => { setEditingId(null); setStaffData({ name: "", role: "Admin", phone: "", email: "", salary: 0, joining_date: new Date().toISOString().split('T')[0], status: "Active" }); setShowStaffModal(true); }} className="btn-premium"><Plus size={20} /> Add Staff</button>
           <button onClick={() => setShowSalaryModal(true)} className="btn-premium" style={{ background: '#0f172a !important' }}><DollarSign size={20} /> Pay Salary</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
         <button onClick={() => setActiveTab("staff")} className={`tab-btn ${activeTab === "staff" ? "tab-active" : "tab-inactive"}`}>Employees</button>
         <button onClick={() => setActiveTab("payroll")} className={`tab-btn ${activeTab === "payroll" ? "tab-active" : "tab-inactive"}`}>Salary Logs</button>
      </div>

      {activeTab === "staff" ? (
        <>
          <div style={{ position: 'relative', maxWidth: 400, marginBottom: 32 }}>
            <Search style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={20} />
            <input type="text" placeholder="Search staff by name or role..." style={{ width: '100%', padding: '12px 12px 12px 48px', background: 'white', border: '1px solid #f1f5f9', borderRadius: 16, fontWeight: 700, outline: 'none' }} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
            {loading ? Array(6).fill(0).map((_,i) => <div key={i} className="staff-card" style={{ height: 200, opacity: 0.5 }} />) : 
             filteredStaff.map(staff => (
               <div key={staff.id} className="staff-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                     <div style={{ width: 48, height: 48, background: '#f5f3ff', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5' }}><UserCircle size={28} /></div>
                     <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => { setEditingId(staff.id); setStaffData(staff); setShowStaffModal(true); }} style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer' }}><Edit size={16} /></button>
                        <button style={{ background: 'none', border: 'none', color: '#fee2e2', cursor: 'pointer' }}><Trash2 size={16} /></button>
                     </div>
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 900, color: '#1e293b', marginBottom: 4 }}>{staff.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                     <span style={{ fontSize: 11, fontWeight: 800, color: '#4f46e5', background: '#f5f3ff', padding: '2px 8px', borderRadius: 6 }}>{staff.role}</span>
                     <span style={{ fontSize: 10, fontWeight: 800, color: staff.status === 'Active' ? '#10b981' : '#ef4444' }}>● {staff.status}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
                     <div style={{ fontSize: 13, fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 4 }}><DollarSign size={14} /> {staff.salary}</div>
                     <div style={{ color: '#94a3b8' }}><Phone size={16} /></div>
                  </div>
               </div>
             ))
            }
          </div>
        </>
      ) : (
        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
           <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f8fafc' }}>
                 <tr>
                    <th style={{ padding: 20, textAlign: 'left', fontSize: 12, fontWeight: 900, color: '#64748b' }}>STAFF MEMBER</th>
                    <th style={{ padding: 20, textAlign: 'left', fontSize: 12, fontWeight: 900, color: '#64748b' }}>MONTH</th>
                    <th style={{ padding: 20, textAlign: 'left', fontSize: 12, fontWeight: 900, color: '#64748b' }}>AMOUNT</th>
                    <th style={{ padding: 20, textAlign: 'left', fontSize: 12, fontWeight: 900, color: '#64748b' }}>DATE</th>
                    <th style={{ padding: 20, textAlign: 'center', fontSize: 12, fontWeight: 900, color: '#64748b' }}>SLIP</th>
                 </tr>
              </thead>
              <tbody>
                 {payroll.map(item => (
                   <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: 20 }}>
                         <div style={{ fontWeight: 800, color: '#1e293b' }}>{item.staff_name}</div>
                         <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{item.staff_role}</div>
                      </td>
                      <td style={{ padding: 20, fontWeight: 800, color: '#1e293b' }}>{item.month} {item.year}</td>
                      <td style={{ padding: 20, fontWeight: 900, color: '#10b981' }}>Rs. {item.amount_paid}</td>
                      <td style={{ padding: 20, fontWeight: 700, color: '#64748b' }}>{item.payment_date}</td>
                      <td style={{ padding: 20, textAlign: 'center' }}>
                         <button style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer' }}><FileText size={18} /></button>
                      </td>
                   </tr>
                 ))}
              </tbody>
           </table>
        </div>
      )}

      {/* Staff Modal */}
      {showStaffModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
           <div style={{ background: 'white', width: '100%', maxWidth: 500, borderRadius: 32, overflow: 'hidden' }}>
              <div style={{ background: '#0f172a', padding: 32, color: 'white' }}>
                 <h2 style={{ fontSize: 24, fontWeight: 900 }}>{editingId ? "Edit Staff" : "Add New Staff"}</h2>
              </div>
              <form onSubmit={handleStaffSave} style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
                 <div>
                    <label style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Full Name</label>
                    <input required style={{ width: '100%', padding: 12, background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 12, fontWeight: 800 }} value={staffData.name} onChange={(e) => setStaffData({...staffData, name: e.target.value})} />
                 </div>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div>
                       <label style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Role</label>
                       <select style={{ width: '100%', padding: 12, background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 12, fontWeight: 800 }} value={staffData.role} onChange={(e) => setStaffData({...staffData, role: e.target.value})}>
                          <option>Admin</option>
                          <option>Accountant</option>
                          <option>Librarian</option>
                          <option>Driver</option>
                          <option>Security</option>
                          <option>Other</option>
                       </select>
                    </div>
                    <div>
                       <label style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Monthly Salary</label>
                       <input type="number" style={{ width: '100%', padding: 12, background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 12, fontWeight: 800 }} value={staffData.salary} onChange={(e) => setStaffData({...staffData, salary: e.target.value})} />
                    </div>
                 </div>
                 <div>
                    <label style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Phone Number</label>
                    <input required style={{ width: '100%', padding: 12, background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 12, fontWeight: 800 }} value={staffData.phone} onChange={(e) => setStaffData({...staffData, phone: e.target.value})} />
                 </div>
                 <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                    <button type="button" onClick={() => setShowStaffModal(false)} style={{ flex: 1, padding: 14, borderRadius: 14, border: 'none', fontWeight: 900 }}>Cancel</button>
                    <button type="submit" className="btn-premium" style={{ flex: 1.5, justifyContent: 'center' }}>Save Member</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Salary Modal */}
      {showSalaryModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
           <div style={{ background: 'white', width: '100%', maxWidth: 500, borderRadius: 32, overflow: 'hidden' }}>
              <div style={{ background: '#0f172a', padding: 32, color: 'white' }}>
                 <h2 style={{ fontSize: 24, fontWeight: 900 }}>Process Salary</h2>
              </div>
              <form onSubmit={handleSalarySave} style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
                 <div>
                    <label style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Select Staff Member</label>
                    <select required style={{ width: '100%', padding: 12, background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 12, fontWeight: 800 }} value={payrollData.staff} onChange={(e) => {
                       const s = staffList.find(x => x.id === Number(e.target.value));
                       setPayrollData({...payrollData, staff: e.target.value, amount_paid: s ? s.salary : 0});
                    }}>
                       <option value="">Choose Staff</option>
                       {staffList.map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
                    </select>
                 </div>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div>
                       <label style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Month</label>
                       <select style={{ width: '100%', padding: 12, background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 12, fontWeight: 800 }} value={payrollData.month} onChange={(e) => setPayrollData({...payrollData, month: e.target.value})}>
                          {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => <option key={m}>{m}</option>)}
                       </select>
                    </div>
                    <div>
                       <label style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Amount to Pay</label>
                       <input type="number" required style={{ width: '100%', padding: 12, background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 12, fontWeight: 800 }} value={payrollData.amount_paid} onChange={(e) => setPayrollData({...payrollData, amount_paid: e.target.value})} />
                    </div>
                 </div>
                 <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                    <button type="button" onClick={() => setShowSalaryModal(false)} style={{ flex: 1, padding: 14, borderRadius: 14, border: 'none', fontWeight: 900 }}>Cancel</button>
                    <button type="submit" className="btn-premium" style={{ flex: 1.5, justifyContent: 'center' }}>Confirm Payment</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;
