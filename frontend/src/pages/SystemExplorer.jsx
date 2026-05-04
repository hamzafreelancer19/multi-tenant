import { useState, useEffect } from "react";
import { getSystemData } from "../api/dashboardApi";
import { Database, Table, Search, RefreshCw, AlertTriangle } from "lucide-react";

const tables = [
  { id: 'schools', label: 'Schools', icon: <Database size={18} /> },
  { id: 'users', label: 'Users', icon: <Database size={18} /> },
  { id: 'students', label: 'Students', icon: <Database size={18} /> },
  { id: 'teachers', label: 'Teachers', icon: <Database size={18} /> },
  { id: 'fees', label: 'Fees', icon: <Database size={18} /> },
  { id: 'activities', label: 'Activities', icon: <Database size={18} /> },
];

export default function SystemExplorer() {
  const [activeTable, setActiveTable] = useState('schools');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getSystemData(activeTable);
      setData(res.data.data);
    } catch (err) {
      setError("Failed to fetch database records. Access restricted.");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTable]);

  // Helper to format values for display
  const formatValue = (key, val) => {
    if (!val) return "—";
    if (key.toLowerCase().includes('date') || key.toLowerCase().includes('created_at')) {
      return new Date(val).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return String(val);
  };

  const filteredData = data.filter(row =>
    Object.values(row).some(val =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="page-container animate-fade-in" style={{ paddingBottom: '40px' }}>
      <div className="page-header" style={{ marginBottom: '24px', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="icon-badge" style={{
            background: 'linear-gradient(135deg, var(--accent), var(--purple))',
            color: 'white',
            boxShadow: '0 8px 24px rgba(var(--accent-rgb), 0.25)',
            width: '52px', height: '52px'
          }}>
            <Database size={24} />
          </div>
          <div>
            <h1 className="page-title" style={{ fontSize: '22px', marginBottom: '2px' }}>System Database</h1>
            <p className="page-sub" style={{ fontSize: '13px' }}>Global read-only explorer for platform-wide records</p>
          </div>
        </div>

        <div className="header-actions" style={{ flexDirection: 'row', alignItems: 'center', gap: '12px' }}>
          <div className="search-box glass" style={{ width: '260px', height: '42px', display: 'flex', alignItems: 'center' }}>
            <Search size={18} style={{ marginLeft: '12px', opacity: 0.6 }} />
            <input
              placeholder="Search metadata..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: 'none', background: 'transparent', width: '100%', padding: '0 12px', fontSize: '14px', outline: 'none' }}
            />
          </div>
          <button
            className="btn btn-secondary"
            onClick={fetchData}
            disabled={loading}
            style={{ height: '42px', padding: '0 20px', borderRadius: '10px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <RefreshCw size={16} className={loading ? "spin" : ""} />
            <span>Sync Database</span>
          </button>
        </div>
      </div>

      <div className="explorer-grid" style={{ marginTop: '24px' }}>
        {/* Sidebar Tabs */}
        <div className="explorer-sidebar" style={{ border: 'none', background: 'transparent', boxShadow: 'none', padding: 0 }}>
          <div className="glass-panel" style={{ padding: '20px 12px' }}>
            <p style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '0 12px 16px', letterSpacing: '1.2px' }}>System Tables</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {tables.map(table => (
                <button
                  key={table.id}
                  onClick={() => setActiveTable(table.id)}
                  className={`explorer-tab ${activeTable === table.id ? 'active' : ''}`}
                  style={{ borderRadius: '10px' }}
                >
                  {table.icon}
                  <span style={{ flex: 1, fontSize: '14px' }}>{table.label}</span>
                  {activeTable === table.id && <div className="explorer-indicator" style={{ background: 'currentColor', opacity: 0.8 }} />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Data View */}
        <div className="explorer-content" style={{ border: 'none' }}>
          <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Internal Explorer Header */}
            <div className="explorer-table-header" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Table size={18} color="var(--accent)" />
                <span style={{ fontWeight: 700, fontSize: '15px', textTransform: 'capitalize', color: 'var(--text-primary)' }}>{activeTable} Directory</span>
              </div>
              <div className="badge" style={{ background: 'var(--accent-soft)', color: 'var(--accent)', fontWeight: 800, fontSize: '11px' }}>
                {filteredData.length} records
              </div>
            </div>

            <div style={{ padding: '0' }}>
              {error && (
                <div style={{ padding: '60px', textAlign: 'center' }}>
                  <AlertTriangle size={56} color="var(--red)" style={{ marginBottom: '16px', opacity: 0.5 }} />
                  <p style={{ color: 'var(--red)', fontWeight: 600, fontSize: '18px' }}>Security Access Restricted</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '8px' }}>{error}</p>
                </div>
              )}

              {!error && loading && (
                <div style={{ padding: '120px', textAlign: 'center' }}>
                  <div className="spinner-glow" style={{ margin: '0 auto 20px' }}>
                    <RefreshCw size={40} className="spin" style={{ color: 'var(--accent)' }} />
                  </div>
                  <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Establishing Data Connection...</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Querying remote database nodes</p>
                </div>
              )}

              {!error && !loading && filteredData.length === 0 && (
                <div style={{ padding: '120px', textAlign: 'center' }}>
                  <Table size={64} style={{ color: 'var(--text-muted)', opacity: 0.1, marginBottom: '20px' }} />
                  <p style={{ color: 'var(--text-muted)', fontSize: '15px', fontWeight: 500 }}>No entries found in {activeTable}.</p>
                </div>
              )}

              {!error && !loading && filteredData.length > 0 && (
                <div className="explorer-table-container">
                  <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 5 }}>
                      <tr style={{ background: 'var(--bg-card)' }}>
                        {Object.keys(filteredData[0]).map(key => (
                          <th key={key} style={{
                            textAlign: 'left',
                            padding: '14px 20px',
                            fontSize: '11px',
                            fontWeight: 800,
                            color: 'var(--text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            borderBottom: '2px solid var(--border)'
                          }}>
                            {key.replace('_', ' ')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.map((row, idx) => (
                        <tr key={idx} className="explorer-row" style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                          {Object.entries(row).map(([key, val], i) => (
                            <td key={i} style={{ padding: '16px 20px', fontSize: '14px', whiteSpace: 'nowrap', borderRight: '1px solid var(--border)' }}>
                              <span style={{
                                color: key.toLowerCase().includes('id') ? 'var(--text-muted)' : 'var(--text-primary)',
                                fontWeight: key.toLowerCase() === 'name' ? 600 : 400
                              }}>
                                {formatValue(key, val)}
                              </span>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
