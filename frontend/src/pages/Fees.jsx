import { useEffect, useState } from "react";
import { 
  CreditCard, 
  Search, 
  Plus, 
  Filter, 
  MoreVertical, 
  TrendingUp, 
  Clock, 
  AlertCircle,
  X,
  Loader2,
  DollarSign,
  MessageCircle,
  Users
} from "lucide-react";

const CLASS_OPTIONS = [
  "Nursery", "Prep",
  "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6",
  "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"
];
import { getFees, createFee, getFeeStats } from "../api/feesApi";
import { getStudents } from "../api/studentsApi";
import PremiumCard from "../components/ui/PremiumCard";

export default function Fees() {
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [feeStats, setFeeStats] = useState({ collected: 0, pending: 0, overdue_count: 0 });
  const [viewMode, setViewMode] = useState("ClassWise");
  const [selectedClass, setSelectedClass] = useState("All");

  // Form State
  const [formData, setFormData] = useState({
    student: "",
    amount: "",
    due_date: new Date().toISOString().split("T")[0],
    status: "Paid",
    remarks: ""
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [feesRes, studentsRes, statsRes] = await Promise.all([
        getFees(),
        getStudents(),
        getFeeStats()
      ]);
      setFees(feesRes.data);
      setStudents(studentsRes.data);
      setFeeStats(statsRes.data);
    } catch (err) {
      console.warn("Using fallback fee data");
      setFees([
        { id: 1, student_name: "Ayesha Noor", amount: 5000, status: "Paid", date: "2026-04-10" },
        { id: 2, student_name: "Bilal Ahmed", amount: 4500, status: "Pending", date: "2026-04-15" },
      ]);
      setFeeStats({ collected: 5000, pending: 4500, overdue_count: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddFee = async (e) => {
    e.preventDefault();
    if (!formData.student || !formData.amount) return alert("Fill all fields");

    try {
      // Find student name for the local state update (or wait for fetch)
      const student = students.find(s => s.id === parseInt(formData.student));
      await createFee({
        ...formData,
        student_name: student?.name || "Unknown Student"
      });
      setShowModal(false);
      setFormData({ student: "", amount: "", due_date: new Date().toISOString().split("T")[0], status: "Paid", remarks: "" });
      fetchData();
    } catch (err) {
      alert("Failed to record fee");
    }
  };

  const filteredFees = Array.isArray(fees) ? fees.filter((f) =>
    f.student_name?.toLowerCase().includes(search.toLowerCase())
  ) : [];

  const filteredStudents = Array.isArray(students) ? students.filter((s) => {
    const matchSearch = !search || s.name?.toLowerCase().includes(search.toLowerCase());
    const matchClass = selectedClass === "All" || s.class_name === selectedClass;
    return matchSearch && matchClass;
  }) : [];

  const stats = [
    { label: "Total Collected", value: `RS. ${(feeStats?.collected || 0).toLocaleString()}`, icon: <TrendingUp size={20} />, color: "green" },
    { label: "Pending Fees", value: `RS. ${(feeStats?.pending || 0).toLocaleString()}`, icon: <Clock size={20} />, color: "orange" },
    { label: "Overdue", value: `${feeStats?.overdue_count || 0} Students`, icon: <AlertCircle size={20} />, color: "red" },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Fees Management</h1>
          <p className="page-subtitle">Track payments, invoices and student dues</p>
        </div>
        <button id="add-fee-btn" className="primary-btn" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Record Payment
        </button>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {stats.map((s, i) => (
          <PremiumCard 
            key={i} 
            className={`stat-card stat-${s.color}`}
            auroraColor={
              s.color === "green" ? "#10b981" :
              s.color === "orange" ? "#fbbf24" :
              s.color === "red" ? "#ef4444" : "#C4A6F7"
            }
          >
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-info">
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </PremiumCard>
        ))}
      </div>

      {/* Toolbar */}
      <div className="toolbar" style={{ flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", gap: 8, flex: 1, minWidth: 200 }}>
          <button 
            className={`filter-btn ${viewMode === "ClassWise" ? "filter-active" : ""}`}
            onClick={() => setViewMode("ClassWise")}
            style={{ flex: 1, display: "flex", justifyContent: "center", gap: 8 }}
          >
            <Users size={16} /> Class View
          </button>
          <button 
            className={`filter-btn ${viewMode === "Transactions" ? "filter-active" : ""}`}
            onClick={() => setViewMode("Transactions")}
            style={{ flex: 1, display: "flex", justifyContent: "center", gap: 8 }}
          >
            <CreditCard size={16} /> Transactions
          </button>
        </div>
        
        <div className="search-box" style={{ flex: 2, minWidth: 250 }}>
          <Search size={16} className="search-icon" />
          <input
            id="fee-search"
            className="search-input"
            placeholder="Search by student name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        {viewMode === "Transactions" && (
          <div className="filter-group">
            <Filter size={16} />
            {["All", "Paid", "Pending", "Overdue"].map((f) => (
              <button key={f} className={`filter-btn ${f === "All" ? "filter-active" : ""}`}>{f}</button>
            ))}
          </div>
        )}
      </div>

      {viewMode === "ClassWise" && (
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 16, marginBottom: 8, whiteSpace: "nowrap" }}>
          <button
            className={`filter-btn ${selectedClass === "All" ? "filter-active" : ""}`}
            onClick={() => setSelectedClass("All")}
          >
            All Classes
          </button>
          {CLASS_OPTIONS.map(c => (
            <button
              key={c}
              className={`filter-btn ${selectedClass === c ? "filter-active" : ""}`}
              onClick={() => setSelectedClass(c)}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {/* Table */}
      <PremiumCard className="card table-card" auroraColor="#C4A6F7">
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
            <Loader2 className="spin" size={32} />
            <p style={{ marginTop: 12 }}>Loading records...</p>
          </div>
        ) : viewMode === "Transactions" ? (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFees.map((f) => (
                  <tr key={f.id} className="table-row">
                    <td>
                      <div className="table-name-cell">
                        <div className="table-avatar">{f.student_name?.[0] || "S"}</div>
                        <span className="table-name">{f.student_name}</span>
                      </div>
                    </td>
                    <td className="table-mono">RS. {f.amount}</td>
                    <td>{f.date || f.due_date}</td>
                    <td>
                      <span className={`badge-status ${f.status === "Paid" ? "badge-active" : "badge-inactive"}`}>
                        {f.status}
                      </span>
                    </td>
                    <td>
                      <button className="icon-btn-sm"><MoreVertical size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && filteredFees.length === 0 && (
              <div className="empty-state">No fee records found.</div>
            )}
          </>
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Roll No.</th>
                  <th>Class</th>
                  <th>Fee Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s) => {
                  const studentFees = fees.filter(f => f.student === s.id);
                  const hasPaid = studentFees.some(f => f.status === "Paid");
                  const isPending = studentFees.some(f => f.status === "Pending" || f.status === "Overdue");
                  const feeStatus = hasPaid && !isPending ? "Paid" : "Unpaid";

                  return (
                    <tr key={s.id} className="table-row">
                      <td>
                        <div className="table-name-cell">
                          <div className="table-avatar">{s.name ? s.name[0].toUpperCase() : "S"}</div>
                          <div>
                            <p className="table-name">{s.name}</p>
                            {s.phone && <p style={{fontSize: "0.7rem", color: "var(--text-muted)"}}>{s.phone}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="table-mono">{s.roll_no || "—"}</td>
                      <td>{s.class_name || "—"}</td>
                      <td>
                        {feeStatus === "Paid" ? (
                          <span className="badge-status badge-active">Paid</span>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span className="badge-status badge-inactive" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>Unpaid</span>
                            <button 
                              title={s.phone ? "Send WhatsApp Reminder" : "No phone number added"}
                              disabled={!s.phone}
                              onClick={() => {
                                if (!s.phone) return;
                                const msg = encodeURIComponent(`Dear Parent,\nThis is a gentle reminder that the school fee for your child, ${s.name}, is currently pending. Kindly submit the dues by the 10th of this month to avoid any inconvenience.\n\nThank you!`);
                                window.open(`https://wa.me/${s.phone.replace(/[^0-9]/g, '')}?text=${msg}`, '_blank');
                              }}
                              style={{ 
                                background: s.phone ? "#25D366" : "var(--bg-hover)", 
                                color: s.phone ? "white" : "var(--text-muted)", 
                                border: "none", 
                                borderRadius: "50%", width: 26, height: 26, display: "flex", 
                                alignItems: "center", justifyContent: "center", 
                                cursor: s.phone ? "pointer" : "not-allowed",
                                opacity: s.phone ? 1 : 0.5
                              }}
                            >
                              <MessageCircle size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                      <td>
                        <button 
                          className="secondary-btn" 
                          style={{ padding: "6px 12px", fontSize: "0.8rem", display: "flex", gap: 6, alignItems: "center" }}
                          onClick={() => {
                            setFormData({
                              student: s.id.toString(),
                              amount: "",
                              due_date: new Date().toISOString().split("T")[0],
                              status: "Paid",
                              remarks: ""
                            });
                            setShowModal(true);
                          }}
                        >
                          <DollarSign size={14} /> Collect Fee
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {!loading && filteredStudents.length === 0 && (
              <div className="empty-state">No students found.</div>
            )}
          </>
        )}
      </PremiumCard>

      {/* RECORD PAYMENT MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Record New Payment</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddFee}>
              <div className="modal-body">
                <div className="modal-form">
                  <div className="input-group">
                    <label className="input-label">Select Student *</label>
                    <select
                      required
                      className="input-field"
                      value={formData.student}
                      onChange={(e) => setFormData({ ...formData, student: e.target.value })}
                    >
                      <option value="">Select a student...</option>
                      {students.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.class_name})</option>
                      ))}
                    </select>
                  </div>
                  <div className="dashboard-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div className="input-group">
                      <label className="input-label">Amount (RS.) *</label>
                      <div className="input-wrapper">
                        <input
                          required
                          type="number"
                          className="input-field"
                          placeholder="0.00"
                          value={formData.amount}
                          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="input-group">
                      <label className="input-label">Payment Date</label>
                      <input
                        type="date"
                        className="input-field"
                        value={formData.due_date}
                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Status</label>
                    <select
                      className="input-field"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="Paid">Paid</option>
                      <option value="Pending">Pending</option>
                      <option value="Partial">Partial</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Remarks</label>
                    <input
                      className="input-field"
                      placeholder="Optional notes..."
                      value={formData.remarks}
                      onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="secondary-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="primary-btn">Record Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
