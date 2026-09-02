import React, { useMemo, useState, useEffect } from "react";
import {
  Package,
  Plus,
  Search,
  Trash2,
  Edit,
  Layers,
  Tag,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  RefreshCw,
  MapPin,
} from "lucide-react";
import { getItems, createItem, updateItem, deleteItem, getLogs, createLog } from "../api/inventoryApi";
import "./Inventory.css";

const CATEGORIES = ["Stationery", "Uniforms", "Books", "Furniture", "Electronics", "Sports", "Lab", "Cleaning", "Other"];
const UNITS = [
  { id: "pcs", label: "Pieces" },
  { id: "set", label: "Set" },
  { id: "box", label: "Box" },
  { id: "pack", label: "Pack" },
  { id: "pair", label: "Pair" },
  { id: "kg", label: "Kilogram" },
  { id: "ltr", label: "Litre" },
  { id: "mtr", label: "Meter" },
];

const EMPTY_ITEM = {
  item_name: "",
  category: "Stationery",
  quantity: 0,
  unit: "pcs",
  unit_price: 0,
  min_stock: 5,
  location: "",
  supplier: "",
  notes: "",
};

const EMPTY_LOG = { item: "", change_type: "Add", quantity: 1, reason: "" };

function apiError(err, fallback) {
  const data = err.response?.data;
  if (!data) return fallback;
  if (typeof data === "string") return data;
  if (data.detail) return Array.isArray(data.detail) ? data.detail[0] : data.detail;
  const first = Object.values(data).flat()?.[0];
  return first || fallback;
}

const Inventory = () => {
  const [activeTab, setActiveTab] = useState("items");
  const [items, setItems] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [logSearch, setLogSearch] = useState("");
  const [category, setCategory] = useState("All");

  const [showItemModal, setShowItemModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [itemData, setItemData] = useState(EMPTY_ITEM);
  const [logData, setLogData] = useState(EMPTY_LOG);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [iRes, lRes] = await Promise.all([getItems(), getLogs()]);
      setItems(Array.isArray(iRes.data) ? iRes.data : []);
      setLogs(Array.isArray(lRes.data) ? lRes.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleItemSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const payload = {
        ...itemData,
        unit_price: Number(itemData.unit_price) || 0,
        min_stock: Number(itemData.min_stock) || 0,
        quantity: Number(itemData.quantity) || 0,
      };
      if (editingId) {
        const { quantity, ...rest } = payload;
        await updateItem(editingId, rest);
      } else {
        await createItem(payload);
      }
      setShowItemModal(false);
      fetchData();
    } catch (err) {
      setFormError(apiError(err, "Could not save item"));
    } finally {
      setSaving(false);
    }
  };

  const handleLogSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      await createLog({ ...logData, quantity: Number(logData.quantity) || 0 });
      setShowLogModal(false);
      setLogData(EMPTY_LOG);
      fetchData();
    } catch (err) {
      setFormError(apiError(err, "Could not update stock"));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (id, name) => {
    if (!window.confirm(`Delete item "${name}"? Stock history for this item will also be removed.`)) return;
    try {
      await deleteItem(id);
      fetchData();
    } catch (err) {
      alert(apiError(err, "Failed to delete item"));
    }
  };

  const openStock = (item, changeType = "Add") => {
    setLogData({ item: item?.id || "", change_type: changeType, quantity: 1, reason: "" });
    setFormError("");
    setShowLogModal(true);
  };

  const filteredItems = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((i) => {
      const matchText =
        i.item_name.toLowerCase().includes(q) ||
        (i.category || "").toLowerCase().includes(q) ||
        (i.sku || "").toLowerCase().includes(q) ||
        (i.location || "").toLowerCase().includes(q);
      const matchCat = category === "All" || i.category === category;
      return matchText && matchCat;
    });
  }, [items, search, category]);

  const filteredLogs = useMemo(() => {
    const q = logSearch.toLowerCase();
    return logs.filter(
      (log) =>
        (log.item_name || "").toLowerCase().includes(q) ||
        (log.reason || "").toLowerCase().includes(q) ||
        (log.recorded_by || "").toLowerCase().includes(q)
    );
  }, [logs, logSearch]);

  const categories = useMemo(() => {
    const extra = items.map((i) => i.category).filter(Boolean);
    return ["All", ...Array.from(new Set([...CATEGORIES, ...extra]))];
  }, [items]);

  return (
    <div className="page inv-page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40, flexWrap: "wrap", gap: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ background: "var(--accent)", padding: 6, borderRadius: 8, color: "white" }}>
              <Package size={18} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 900, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "2px" }}>
              Assets & Stock
            </span>
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 900, color: "var(--text-primary)" }}>School Inventory</h1>
          <p style={{ fontSize: 16, color: "var(--text-secondary)", fontWeight: 600 }}>
            Track uniforms, books, furniture, and other school assets.
          </p>
        </div>
        <div className="inv-actions" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button
            onClick={() => {
              setEditingId(null);
              setItemData(EMPTY_ITEM);
              setFormError("");
              setShowItemModal(true);
            }}
            className="inv-btn"
          >
            <Plus size={20} /> New Item
          </button>
          <button onClick={() => openStock(null, "Add")} className="inv-btn is-dark">
            <RefreshCw size={20} /> Update Stock
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 32, flexWrap: "wrap" }}>
        <button onClick={() => setActiveTab("items")} className={`inv-tab ${activeTab === "items" ? "is-on" : "is-off"}`}>
          Current Stock
        </button>
        <button onClick={() => setActiveTab("logs")} className={`inv-tab ${activeTab === "logs" ? "is-on" : "is-off"}`}>
          Stock History
        </button>
      </div>

      {activeTab === "items" ? (
        <>
          <div className="inv-search" style={{ marginBottom: 16 }}>
            <Search style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} size={20} />
            <input type="text" placeholder="Search name, code, or location..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="inv-chip-row">
            {categories.map((c) => (
              <button key={c} type="button" className={`inv-chip ${category === c ? "is-on" : ""}`} onClick={() => setCategory(c)}>
                {c}
              </button>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
            {loading ? (
              Array(6)
                .fill(0)
                .map((_, i) => <div key={i} className="inv-card" style={{ height: 180, opacity: 0.5 }} />)
            ) : filteredItems.length === 0 ? (
              <div className="inv-card inv-empty" style={{ gridColumn: "1 / -1" }}>
                <Package size={36} />
                <h3>No stock items yet</h3>
                <p>Add uniforms, books, or supplies, then use Update Stock to restock or issue them.</p>
              </div>
            ) : (
              filteredItems.map((item) => {
                const low = item.low_stock || item.quantity <= (item.min_stock || 5);
                return (
                  <div key={item.id} className={`inv-card ${low ? "is-low" : ""}`}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                      <span style={{ fontSize: 10, fontWeight: 900, color: "var(--accent)", background: "var(--accent-soft)", padding: "4px 10px", borderRadius: 8, textTransform: "uppercase" }}>
                        {item.category}
                      </span>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          className="inv-icon-btn"
                          onClick={() => {
                            setEditingId(item.id);
                            setItemData({
                              item_name: item.item_name || "",
                              category: item.category || "Stationery",
                              quantity: item.quantity || 0,
                              unit: item.unit || "pcs",
                              unit_price: item.unit_price || 0,
                              min_stock: item.min_stock ?? 5,
                              location: item.location || "",
                              supplier: item.supplier || "",
                              notes: item.notes || "",
                            });
                            setFormError("");
                            setShowItemModal(true);
                          }}
                        >
                          <Edit size={16} />
                        </button>
                        <button className="inv-icon-btn" onClick={() => handleDeleteItem(item.id, item.item_name)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", marginBottom: 4 }}>{item.sku || "—"}</div>
                    <h3 style={{ fontSize: 18, fontWeight: 900, color: "var(--text-primary)", marginBottom: 4 }}>{item.item_name}</h3>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                      <Layers size={14} color="var(--text-muted)" />
                      <span style={{ fontSize: 14, fontWeight: 800, color: low ? "#ef4444" : "#10b981" }}>
                        {item.quantity} {item.unit || "pcs"} in stock
                      </span>
                      {low && <AlertTriangle size={14} color="#ef4444" />}
                    </div>
                    {(item.location || item.supplier) && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, color: "var(--text-muted)", fontSize: 12, fontWeight: 700 }}>
                        <MapPin size={13} />
                        {[item.location, item.supplier].filter(Boolean).join(" · ")}
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 16, borderTop: "1px solid var(--bg-hover)", gap: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text-muted)" }}>
                        Unit Price: <span style={{ color: "var(--text-primary)" }}>Rs. {item.unit_price}</span>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button type="button" className="inv-chip" onClick={() => openStock(item, "Add")}>
                          + Add
                        </button>
                        <button type="button" className="inv-chip" onClick={() => openStock(item, "Remove")}>
                          Issue
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        <>
          <div className="inv-search" style={{ marginBottom: 20 }}>
            <Search style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} size={20} />
            <input type="text" placeholder="Search stock history..." value={logSearch} onChange={(e) => setLogSearch(e.target.value)} />
          </div>
          <div className="glass-panel" style={{ padding: 0, overflow: "hidden" }}>
            {filteredLogs.length === 0 ? (
              <div className="inv-empty">
                <Tag size={32} />
                <h3>No stock movements</h3>
                <p>Restock or issue items to see history here.</p>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ background: "var(--bg-base)" }}>
                  <tr>
                    <th style={{ padding: 20, textAlign: "left", fontSize: 12, fontWeight: 900, color: "var(--text-secondary)" }}>ITEM</th>
                    <th style={{ padding: 20, textAlign: "left", fontSize: 12, fontWeight: 900, color: "var(--text-secondary)" }}>ACTION</th>
                    <th style={{ padding: 20, textAlign: "left", fontSize: 12, fontWeight: 900, color: "var(--text-secondary)" }}>QUANTITY</th>
                    <th style={{ padding: 20, textAlign: "left", fontSize: 12, fontWeight: 900, color: "var(--text-secondary)" }}>REASON</th>
                    <th style={{ padding: 20, textAlign: "left", fontSize: 12, fontWeight: 900, color: "var(--text-secondary)" }}>BY</th>
                    <th style={{ padding: 20, textAlign: "left", fontSize: 12, fontWeight: 900, color: "var(--text-secondary)" }}>DATE</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: "1px solid var(--bg-hover)" }}>
                      <td style={{ padding: 20, fontWeight: 800, color: "var(--text-primary)" }}>{log.item_name}</td>
                      <td style={{ padding: 20 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 4, color: log.change_type === "Add" ? "#10b981" : "#ef4444", fontSize: 12, fontWeight: 900 }}>
                          {log.change_type === "Add" ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                          {log.change_type}
                        </span>
                      </td>
                      <td style={{ padding: 20, fontWeight: 900, color: "var(--text-primary)" }}>{log.quantity}</td>
                      <td style={{ padding: 20, color: "var(--text-secondary)", fontWeight: 600, fontSize: 13 }}>{log.reason || "N/A"}</td>
                      <td style={{ padding: 20, color: "var(--text-muted)", fontWeight: 700, fontSize: 12 }}>{log.recorded_by || "—"}</td>
                      <td style={{ padding: 20, color: "var(--text-muted)", fontWeight: 700, fontSize: 12 }}>{new Date(log.date).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {showItemModal && (
        <div className="inv-overlay" onClick={(e) => e.target === e.currentTarget && setShowItemModal(false)}>
          <div className="inv-modal">
            <div className="inv-modal-head">
              <h2>{editingId ? "Edit Item" : "Add New Item"}</h2>
            </div>
            <form onSubmit={handleItemSave}>
              {formError && <div className="inv-error">{formError}</div>}
              <div>
                <label className="inv-label">Item Name</label>
                <input className="inv-field" required value={itemData.item_name} onChange={(e) => setItemData({ ...itemData, item_name: e.target.value })} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label className="inv-label">Category</label>
                  <select value={itemData.category} onChange={(e) => setItemData({ ...itemData, category: e.target.value })}>
                    {CATEGORIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="inv-label">Unit</label>
                  <select value={itemData.unit} onChange={(e) => setItemData({ ...itemData, unit: e.target.value })}>
                    {UNITS.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {!editingId && (
                  <div>
                    <label className="inv-label">Opening Quantity</label>
                    <input className="inv-field" type="number" min="0" value={itemData.quantity} onChange={(e) => setItemData({ ...itemData, quantity: e.target.value })} />
                  </div>
                )}
                <div>
                  <label className="inv-label">Unit Price</label>
                  <input className="inv-field" type="number" min="0" step="0.01" value={itemData.unit_price} onChange={(e) => setItemData({ ...itemData, unit_price: e.target.value })} />
                </div>
                <div>
                  <label className="inv-label">Reorder Level</label>
                  <input className="inv-field" type="number" min="0" value={itemData.min_stock} onChange={(e) => setItemData({ ...itemData, min_stock: e.target.value })} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label className="inv-label">Location / Shelf</label>
                  <input className="inv-field" value={itemData.location} onChange={(e) => setItemData({ ...itemData, location: e.target.value })} />
                </div>
                <div>
                  <label className="inv-label">Supplier</label>
                  <input className="inv-field" value={itemData.supplier} onChange={(e) => setItemData({ ...itemData, supplier: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="inv-label">Notes</label>
                <textarea rows={2} value={itemData.notes} onChange={(e) => setItemData({ ...itemData, notes: e.target.value })} />
              </div>
              {editingId && <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>To change quantity, use Update Stock so history stays accurate.</p>}
              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <button type="button" className="inv-ghost" onClick={() => setShowItemModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="inv-btn" style={{ flex: 1.5, justifyContent: "center" }} disabled={saving}>
                  {saving ? "Saving..." : "Save Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showLogModal && (
        <div className="inv-overlay" onClick={(e) => e.target === e.currentTarget && setShowLogModal(false)}>
          <div className="inv-modal">
            <div className="inv-modal-head">
              <h2>Stock Update</h2>
            </div>
            <form onSubmit={handleLogSave}>
              {formError && <div className="inv-error">{formError}</div>}
              <div>
                <label className="inv-label">Select Item</label>
                <select required value={logData.item} onChange={(e) => setLogData({ ...logData, item: e.target.value })}>
                  <option value="">Choose Item</option>
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.item_name} ({i.quantity} {i.unit || "pcs"} current)
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label className="inv-label">Action</label>
                  <select value={logData.change_type} onChange={(e) => setLogData({ ...logData, change_type: e.target.value })}>
                    <option value="Add">Restock (Add)</option>
                    <option value="Remove">Issue (Remove)</option>
                  </select>
                </div>
                <div>
                  <label className="inv-label">Quantity</label>
                  <input className="inv-field" type="number" min="1" required value={logData.quantity} onChange={(e) => setLogData({ ...logData, quantity: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="inv-label">Reason / Note</label>
                <input className="inv-field" value={logData.reason} onChange={(e) => setLogData({ ...logData, reason: e.target.value })} placeholder="Purchase, classroom issue, damaged..." />
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <button type="button" className="inv-ghost" onClick={() => setShowLogModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="inv-btn" style={{ flex: 1.5, justifyContent: "center" }} disabled={saving}>
                  {saving ? "Updating..." : "Update Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
