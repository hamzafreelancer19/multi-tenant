import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Database,
  Loader2,
  RefreshCw,
  Search,
  Table,
  X,
} from "lucide-react";
import { getSystemData, getSystemSummary } from "../api/dashboardApi";
import { getSchools } from "../api/adminApi";
import "./Schools.css";
import "./SystemExplorer.css";

const GROUPS = [
  {
    label: "Platform",
    items: [
      { id: "schools", label: "Schools" },
      { id: "users", label: "Users" },
      { id: "activities", label: "Activities" },
      { id: "notifications", label: "Notifications" },
    ],
  },
  {
    label: "People",
    items: [
      { id: "students", label: "Students" },
      { id: "teachers", label: "Teachers" },
      { id: "staff", label: "Staff" },
      { id: "enrollments", label: "Enrollments" },
    ],
  },
  {
    label: "Academics",
    items: [
      { id: "classes", label: "Classes" },
      { id: "attendance", label: "Attendance" },
      { id: "exams", label: "Exams" },
      { id: "subjects", label: "Subjects" },
      { id: "results", label: "Results" },
      { id: "notices", label: "Notices" },
      { id: "timetable", label: "Timetable" },
      { id: "period_covers", label: "Period covers" },
      { id: "assignments", label: "Assignments" },
    ],
  },
  {
    label: "Finance & campus",
    items: [
      { id: "fees", label: "Fees" },
      { id: "payroll", label: "Payroll" },
      { id: "books", label: "Library books" },
      { id: "issues", label: "Book issues" },
      { id: "vehicles", label: "Vehicles" },
      { id: "routes", label: "Routes" },
      { id: "inventory", label: "Inventory" },
      { id: "stock_logs", label: "Stock logs" },
    ],
  },
  {
    label: "Chat",
    items: [
      { id: "chat_threads", label: "Threads" },
      { id: "chat_messages", label: "Messages" },
      { id: "chat_participants", label: "Participants" },
    ],
  },
];

function apiError(err, fallback) {
  const data = err.response?.data;
  if (!data) return fallback;
  if (typeof data === "string") return data;
  if (data.error) return data.error;
  if (data.detail) return Array.isArray(data.detail) ? data.detail[0] : data.detail;
  return fallback;
}

function formatValue(key, val) {
  if (val === null || val === undefined || val === "") return "—";
  if (typeof val === "boolean") return val ? "Yes" : "No";
  if (typeof val === "object") {
    try {
      const text = JSON.stringify(val);
      return text.length > 80 ? `${text.slice(0, 80)}…` : text;
    } catch {
      return String(val);
    }
  }
  const lower = String(key).toLowerCase();
  if (lower.includes("date") || lower.endsWith("_at") || lower.includes("login") || lower.includes("joined")) {
    const d = new Date(val);
    if (!Number.isNaN(d.getTime()) && String(val).length >= 8) {
      return d.toLocaleString("en-PK", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  }
  const text = String(val);
  return text.length > 80 ? `${text.slice(0, 80)}…` : text;
}

function prettyKey(key) {
  return String(key).replace(/_/g, " ");
}

export default function SystemExplorer() {
  const navigate = useNavigate();
  const [activeTable, setActiveTable] = useState("schools");
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState({});
  const [schools, setSchools] = useState([]);
  const [schoolId, setSchoolId] = useState("");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    (async () => {
      try {
        const [sum, sch] = await Promise.all([getSystemSummary(), getSchools()]);
        setCounts(sum.data?.counts || {});
        setSchools(Array.isArray(sch.data) ? sch.data : []);
      } catch {
        setCounts({});
      }
    })();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const params = { limit: 100 };
      if (schoolId) params.school = schoolId;
      if (debounced.length >= 2) params.q = debounced;
      const res = await getSystemData(activeTable, params);
      setRows(Array.isArray(res.data?.data) ? res.data.data : []);
      setTotal(Number(res.data?.total_count || 0));
      setCounts((prev) => ({ ...prev, [activeTable]: Number(res.data?.total_count || 0) }));
    } catch (err) {
      setError(apiError(err, "Could not load this table."));
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTable, schoolId, debounced]);

  const columns = useMemo(() => (rows[0] ? Object.keys(rows[0]) : []), [rows]);
  const activeLabel = GROUPS.flatMap((g) => g.items).find((t) => t.id === activeTable)?.label || activeTable;

  const openRow = (row) => {
    if (activeTable === "schools" && row.id) navigate(`/schools/${row.id}`);
  };

  return (
    <div className="page db-page">
      <div className="sch-hero">
        <div>
          <p className="sch-kicker">Platform</p>
          <h1>Database</h1>
          <p>Read-only explorer across all tenant records. Passwords and API keys are hidden.</p>
        </div>
        <button type="button" className="secondary-btn" onClick={fetchData} disabled={loading}>
          <RefreshCw size={16} className={loading ? "spin" : ""} /> Refresh
        </button>
      </div>

      <div className="sch-toolbar">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            className="search-input"
            placeholder="Search this table (2+ characters)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
              <X size={14} />
            </button>
          )}
        </div>
        <select className="input-field db-school" value={schoolId} onChange={(e) => setSchoolId(e.target.value)}>
          <option value="">All schools</option>
          {schools.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {error && <div className="sch-alert">{error}</div>}

      <div className="db-layout">
        <aside className="card db-side">
          {GROUPS.map((group) => (
            <div key={group.label} className="db-group">
              <p>{group.label}</p>
              {group.items.map((table) => (
                <button
                  key={table.id}
                  type="button"
                  className={`db-tab ${activeTable === table.id ? "is-on" : ""}`}
                  onClick={() => setActiveTable(table.id)}
                >
                  <span>{table.label}</span>
                  <small>{counts[table.id] ?? "—"}</small>
                </button>
              ))}
            </div>
          ))}
        </aside>

        <section className="card db-main">
          <header className="db-main-head">
            <div>
              <h3><Table size={16} /> {activeLabel}</h3>
              <p>
                Showing {rows.length} of {total.toLocaleString()} records
                {schoolId ? " in the selected school" : ""}
                {debounced.length >= 2 ? ` matching “${debounced}”` : ""}
              </p>
            </div>
          </header>

          {loading ? (
            <div className="db-empty">
              <Loader2 className="spin" size={32} />
              <p>Loading {activeLabel.toLowerCase()}…</p>
            </div>
          ) : error ? (
            <div className="db-empty">
              <AlertTriangle size={28} />
              <p>{error}</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="db-empty">
              <Database size={28} />
              <p>No records in this table.</p>
            </div>
          ) : (
            <div className="db-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    {columns.map((key) => (
                      <th key={key}>{prettyKey(key)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr
                      key={row.id || idx}
                      className={`table-row ${activeTable === "schools" ? "sch-row" : ""}`}
                      onClick={() => openRow(row)}
                    >
                      {columns.map((key) => (
                        <td key={key} title={typeof row[key] === "object" ? JSON.stringify(row[key]) : String(row[key] ?? "")}>
                          {activeTable === "schools" && key === "name" && row.id ? (
                            <Link to={`/schools/${row.id}`} onClick={(e) => e.stopPropagation()}>
                              {formatValue(key, row[key])}
                            </Link>
                          ) : (
                            formatValue(key, row[key])
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
