import { useEffect, useMemo, useState } from "react";
import { ClipboardCheck, Eye, Loader2, Search, X } from "lucide-react";
import { getEnrollments, rejectEnrollment, submitEnrollmentTest } from "../api/enrollmentApi";
import AppModal from "../components/AppModal";
import "./Dashboard.css";
import "./Students.css";
import "./Teachers.css";

const REVIEW = ["Pending", "PendingIncharge"];

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function apiError(err, fallback) {
  const data = err.response?.data;
  if (!data) return fallback;
  if (typeof data === "string") return data;
  if (data.detail) return data.detail;
  const first = Object.values(data).flat()?.[0];
  return first || fallback;
}

export default function TeacherAdmissions() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("review");
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ test_score: "", test_total: "100", test_date: todayISO(), test_notes: "" });

  const fetchRows = async () => {
    setLoading(true);
    try {
      const res = await getEnrollments();
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter((row) => {
      const matchSearch = !q
        || (row.student_name || "").toLowerCase().includes(q)
        || (row.father_name || "").toLowerCase().includes(q)
        || (row.class_applying || "").toLowerCase().includes(q);
      if (!matchSearch) return false;
      if (tab === "review") return REVIEW.includes(row.status);
      if (tab === "sent") return row.status === "PendingAdmin";
      if (tab === "done") return row.status === "Accepted" || row.status === "Rejected";
      return true;
    });
  }, [rows, search, tab]);

  const waiting = rows.filter((row) => REVIEW.includes(row.status)).length;

  const openReview = (row) => {
    setError("");
    setSelected(row);
    setForm({
      test_score: row.test_score ?? "",
      test_total: String(row.test_total || 100),
      test_date: row.test_date || todayISO(),
      test_notes: row.test_notes || "",
    });
  };

  const handleSubmit = async () => {
    if (!selected) return;
    setSaving(true);
    setError("");
    try {
      await submitEnrollmentTest(selected.id, form);
      setSelected(null);
      await fetchRows();
    } catch (err) {
      setError(apiError(err, "Could not submit the test."));
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async (row) => {
    if (!window.confirm(`Reject admission for ${row.student_name}?`)) return;
    try {
      await rejectEnrollment(row.id);
      setSelected(null);
      await fetchRows();
    } catch (err) {
      setError(apiError(err, "Could not reject this request."));
    }
  };

  const canTest = selected && REVIEW.includes(selected.status);

  return (
    <div className="page dash-page st-page">
      <header className="dash-hero">
        <div>
          <p className="dash-kicker">Class incharge</p>
          <h1>Admission tests</h1>
          <p>Applications for your class. Take the test, then send the request to school admin for registration.</p>
        </div>
      </header>

      <div className="dash-stats tp-stats">
        <article className="dash-stat dash-stat-orange">
          <span>Waiting</span>
          <strong>{loading ? "—" : waiting}</strong>
          <small>need a class test</small>
        </article>
        <article className="dash-stat dash-stat-navy">
          <span>Sent to admin</span>
          <strong>{loading ? "—" : rows.filter((row) => row.status === "PendingAdmin").length}</strong>
          <small>awaiting registration</small>
        </article>
        <article className="dash-stat dash-stat-green">
          <span>Registered</span>
          <strong>{loading ? "—" : rows.filter((row) => row.status === "Accepted").length}</strong>
          <small>now in students</small>
        </article>
      </div>

      <div className="st-toolbar">
        <div className="st-search">
          <Search size={16} />
          <input placeholder="Search student, parent, class…" value={search} onChange={(e) => setSearch(e.target.value)} />
          {search && <button type="button" onClick={() => setSearch("")} aria-label="Clear search"><X size={14} /></button>}
        </div>
        <div className="st-filters">
          {[
            { id: "review", label: "Need test" },
            { id: "sent", label: "Sent to admin" },
            { id: "done", label: "Closed" },
          ].map((item) => (
            <button key={item.id} type="button" className={tab === item.id ? "is-on" : ""} onClick={() => setTab(item.id)}>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <section className="dash-panel st-panel">
        {loading ? (
          <div className="st-empty"><Loader2 className="spin" size={32} /><p>Loading admission requests…</p></div>
        ) : filtered.length === 0 ? (
          <div className="st-empty">
            <ClipboardCheck size={36} />
            <p>{search ? "No requests match this search." : "No admission requests in this list."}</p>
          </div>
        ) : (
          <div className="st-table-wrap">
            <table className="st-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Class</th>
                  <th>Parent</th>
                  <th>Test</th>
                  <th>Stage</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <strong>{row.student_name}</strong>
                      <div className="tp-muted">{row.gender || "Applicant"} · {row.student_age} yrs</div>
                    </td>
                    <td>{row.class_applying || "—"}</td>
                    <td>
                      {row.father_name}
                      <div className="tp-muted">{row.father_phone}</div>
                    </td>
                    <td>{row.test_score != null ? `${row.test_score}/${row.test_total || 100}` : "—"}</td>
                    <td>
                      <span className={`st-badge ${REVIEW.includes(row.status) ? "is-warn" : row.status === "Accepted" ? "is-on" : "is-off"}`}>
                        {row.stage_label || row.status}
                      </span>
                    </td>
                    <td className="st-row-actions">
                      {REVIEW.includes(row.status) ? (
                        <button type="button" className="st-row-btn" onClick={() => openReview(row)}>
                          <ClipboardCheck size={14} />
                          Take test
                        </button>
                      ) : (
                        <button type="button" className="st-row-btn is-ghost" onClick={() => openReview(row)}>
                          <Eye size={14} />
                          View
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selected && (
        <AppModal onClose={() => !saving && setSelected(null)}>
          <div className="st-modal">
            <header>
              <div>
                <p>{selected.class_applying || "Admission"}</p>
                <h2>{selected.student_name}</h2>
              </div>
              <button type="button" onClick={() => setSelected(null)} aria-label="Close">
                <X size={18} />
              </button>
            </header>
            <div className="st-modal-body st-grid">
              <p className="st-span-2"><strong>Parent:</strong> {selected.father_name} · {selected.father_phone}</p>
              <p><strong>Age / gender:</strong> {selected.student_age} · {selected.gender || "—"}</p>
              <p><strong>Previous school:</strong> {selected.previous_school || "—"}</p>
              {selected.notes ? <p className="st-span-2"><strong>Notes:</strong> {selected.notes}</p> : null}
              {error ? <p className="st-span-2 tp-error">{error}</p> : null}
              {canTest ? (
                <>
                  <label>
                    Test marks
                    <input type="number" min="0" value={form.test_score} onChange={(e) => setForm({ ...form, test_score: e.target.value })} />
                  </label>
                  <label>
                    Total marks
                    <input type="number" min="1" value={form.test_total} onChange={(e) => setForm({ ...form, test_total: e.target.value })} />
                  </label>
                  <label className="st-span-2">
                    Test date
                    <input type="date" value={form.test_date} onChange={(e) => setForm({ ...form, test_date: e.target.value })} />
                  </label>
                  <label className="st-span-2">
                    Result notes
                    <textarea rows={3} value={form.test_notes} onChange={(e) => setForm({ ...form, test_notes: e.target.value })} placeholder="Pass, interview notes, recommended section…" />
                  </label>
                </>
              ) : (
                <p className="st-span-2"><strong>Test:</strong> {selected.test_score != null ? `${selected.test_score}/${selected.test_total || 100}` : "—"} {selected.test_notes ? `· ${selected.test_notes}` : ""}</p>
              )}
            </div>
            <footer>
              {canTest && (
                <>
                  <button type="button" className="st-ghost is-danger" onClick={() => handleReject(selected)}>Reject</button>
                  <button type="button" className="st-add-btn" disabled={saving} onClick={handleSubmit}>
                    {saving ? "Sending…" : "Submit to admin"}
                  </button>
                </>
              )}
            </footer>
          </div>
        </AppModal>
      )}
    </div>
  );
}
