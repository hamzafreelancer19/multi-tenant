import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  X, 
  Loader2, 
  Trash2, 
  Edit, 
  Layers,
  Tag,
  DollarSign,
  Calendar,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  ClipboardList,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { getItems, createItem, updateItem, deleteItem, getLogs, createLog } from '../api/inventoryApi';

const Inventory = () => {
  const [activeTab, setActiveTab] = useState("items");
  const [items, setItems] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  const [showItemModal, setShowItemModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  
  const [itemData, setItemData] = useState({ item_name: "", category: "Stationery", quantity: 0, unit_price: 0 });
  const [logData, setLogData] = useState({ item: "", change_type: "Add", quantity: 1, reason: "" });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

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
    try {
      if (editingId) await updateItem(editingId, itemData);
      else await createItem(itemData);
      setShowItemModal(false);
      fetchData();
    } catch (err) {
      alert("Error saving item");
    } finally {
      setSaving(false);
    }
  };

  const handleLogSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createLog(logData);
      setShowLogModal(false);
      fetchData();
    } catch (err) {
      alert("Error logging stock change");
    } finally {
      setSaving(false);
    }
  };

  const filteredItems = items.filter(i => i.item_name.toLowerCase().includes(search.toLowerCase()) || i.category.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="page">
      <style>{`
        .inv-card { background: white; border-radius: 28px; padding: 24px; border: 1px solid rgba(0,0,0,0.03); box-shadow: 0 4px 15px rgba(0,0,0,0.01); transition: 0.3s; }
        .inv-card:hover { transform: translateY(-4px); box-shadow: 0 15px 30px rgba(0,0,0,0.05); }
        .tab-btn { padding: 12px 24px; border-radius: 14px; border: none; font-weight: 800; cursor: pointer; transition: 0.3s; }
        .tab-active { background: #4f46e5; color: white; box-shadow: 0 10px 20px rgba(79, 70, 229, 0.2); }
        .tab-inactive { background: white; color: #64748b; }
        .btn-premium { background: #4f46e5 !important; color: white !important; font-weight: 800 !important; padding: 12px 24px !important; border-radius: 14px !important; border: none !important; cursor: pointer !important; display: flex; align-items: center; gap: 8px; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40, flexWrap: 'wrap', gap: 20 }}>
        <div>
           <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ background: '#4f46e5', padding: 6, borderRadius: 8, color: 'white' }}><Package size={18} /></div>
              <span style={{ fontSize: 10, fontWeight: 900, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '2px' }}>Assets & Stock</span>
           </div>
           <h1 style={{ fontSize: 36, fontWeight: 900, color: '#0f172a' }}>School Inventory</h1>
           <p style={{ fontSize: 16, color: '#64748b', fontWeight: 600 }}>Track uniforms, books, furniture, and other school assets.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
           <button onClick={() => { setEditingId(null); setItemData({ item_name: "", category: "Stationery", quantity: 0, unit_price: 0 }); setShowItemModal(true); }} className="btn-premium"><Plus size={20} /> New Item</button>
           <button onClick={() => setShowLogModal(true)} className="btn-premium" style={{ background: '#0f172a !important' }}><RefreshCw size={20} /> Update Stock</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
         <button onClick={() => setActiveTab("items")} className={`tab-btn ${activeTab === "items" ? "tab-active" : "tab-inactive"}`}>Current Stock</button>
         <button onClick={() => setActiveTab("logs")} className={`tab-btn ${activeTab === "logs" ? "tab-active" : "tab-inactive"}`}>Stock History</button>
      </div>

      {activeTab === "items" ? (
        <>
          <div style={{ position: 'relative', maxWidth: 400, marginBottom: 32 }}>
            <Search style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={20} />
            <input type="text" placeholder="Search inventory..." style={{ width: '100%', padding: '12px 12px 12px 48px', background: 'white', border: '1px solid #f1f5f9', borderRadius: 16, fontWeight: 700, outline: 'none' }} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
            {loading ? Array(6).fill(0).map((_,i) => <div key={i} className="inv-card" style={{ height: 180, opacity: 0.5 }} />) : 
             filteredItems.map(item => (
               <div key={item.id} className="inv-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                     <span style={{ fontSize: 10, fontWeight: 900, color: '#4f46e5', background: '#f5f3ff', padding: '4px 10px', borderRadius: 8, textTransform: 'uppercase' }}>{item.category}</span>
                     <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => { setEditingId(item.id); setItemData(item); setShowItemModal(true); }} style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer' }}><Edit size={16} /></button>
                        <button style={{ background: 'none', border: 'none', color: '#fee2e2', cursor: 'pointer' }}><Trash2 size={16} /></button>
                     </div>
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 900, color: '#1e293b', marginBottom: 4 }}>{item.item_name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                     <Layers size={14} color="#94a3b8" />
                     <span style={{ fontSize: 14, fontWeight: 800, color: item.quantity > 5 ? '#10b981' : '#ef4444' }}>{item.quantity} In Stock</span>
                     {item.quantity <= 5 && <AlertTriangle size={14} color="#ef4444" />}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
                     <div style={{ fontSize: 12, fontWeight: 800, color: '#94a3b8' }}>Unit Price: <span style={{ color: '#1e293b' }}>Rs. {item.unit_price}</span></div>
                     <Tag size={18} color="#e2e8f0" />
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
                    <th style={{ padding: 20, textAlign: 'left', fontSize: 12, fontWeight: 900, color: '#64748b' }}>ITEM</th>
                    <th style={{ padding: 20, textAlign: 'left', fontSize: 12, fontWeight: 900, color: '#64748b' }}>ACTION</th>
                    <th style={{ padding: 20, textAlign: 'left', fontSize: 12, fontWeight: 900, color: '#64748b' }}>QUANTITY</th>
                    <th style={{ padding: 20, textAlign: 'left', fontSize: 12, fontWeight: 900, color: '#64748b' }}>REASON</th>
                    <th style={{ padding: 20, textAlign: 'left', fontSize: 12, fontWeight: 900, color: '#64748b' }}>DATE</th>
                 </tr>
              </thead>
              <tbody>
                 {logs.map(log => (
                   <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: 20, fontWeight: 800, color: '#1e293b' }}>{log.item_name}</td>
                      <td style={{ padding: 20 }}>
                         <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: log.change_type === 'Add' ? '#10b981' : '#ef4444', fontSize: 12, fontWeight: 900 }}>
                            {log.change_type === 'Add' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                            {log.change_type}
                         </span>
                      </td>
                      <td style={{ padding: 20, fontWeight: 900, color: '#1e293b' }}>{log.quantity}</td>
                      <td style={{ padding: 20, color: '#64748b', fontWeight: 600, fontSize: 13 }}>{log.reason || "N/A"}</td>
                      <td style={{ padding: 20, color: '#94a3b8', fontWeight: 700, fontSize: 12 }}>{new Date(log.date).toLocaleString()}</td>
                   </tr>
                 ))}
              </tbody>
           </table>
        </div>
      )}

      {/* Item Modal */}
      {showItemModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
           <div style={{ background: 'white', width: '100%', maxWidth: 500, borderRadius: 32, overflow: 'hidden' }}>
              <div style={{ background: '#0f172a', padding: 32, color: 'white' }}>
                 <h2 style={{ fontSize: 24, fontWeight: 900 }}>{editingId ? "Edit Item" : "Add New Item"}</h2>
              </div>
              <form onSubmit={handleItemSave} style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
                 <div>
                    <label style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Item Name</label>
                    <input required style={{ width: '100%', padding: 12, background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 12, fontWeight: 800 }} value={itemData.item_name} onChange={(e) => setItemData({...itemData, item_name: e.target.value})} />
                 </div>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div>
                       <label style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Category</label>
                       <select style={{ width: '100%', padding: 12, background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 12, fontWeight: 800 }} value={itemData.category} onChange={(e) => setItemData({...itemData, category: e.target.value})}>
                          <option>Stationery</option>
                          <option>Uniforms</option>
                          <option>Books</option>
                          <option>Furniture</option>
                          <option>Electronics</option>
                          <option>Other</option>
                       </select>
                    </div>
                    <div>
                       <label style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Unit Price</label>
                       <input type="number" style={{ width: '100%', padding: 12, background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 12, fontWeight: 800 }} value={itemData.unit_price} onChange={(e) => setItemData({...itemData, unit_price: e.target.value})} />
                    </div>
                 </div>
                 <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                    <button type="button" onClick={() => setShowItemModal(false)} style={{ flex: 1, padding: 14, borderRadius: 14, border: 'none', fontWeight: 900 }}>Cancel</button>
                    <button type="submit" className="btn-premium" style={{ flex: 1.5, justifyContent: 'center' }}>Save Item</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Log Modal */}
      {showLogModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
           <div style={{ background: 'white', width: '100%', maxWidth: 500, borderRadius: 32, overflow: 'hidden' }}>
              <div style={{ background: '#0f172a', padding: 32, color: 'white' }}>
                 <h2 style={{ fontSize: 24, fontWeight: 900 }}>Stock Update</h2>
              </div>
              <form onSubmit={handleLogSave} style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
                 <div>
                    <label style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Select Item</label>
                    <select required style={{ width: '100%', padding: 12, background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 12, fontWeight: 800 }} value={logData.item} onChange={(e) => setLogData({...logData, item: e.target.value})}>
                       <option value="">Choose Item</option>
                       {items.map(i => <option key={i.id} value={i.id}>{i.item_name} ({i.quantity} current)</option>)}
                    </select>
                 </div>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div>
                       <label style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Action</label>
                       <select style={{ width: '100%', padding: 12, background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 12, fontWeight: 800 }} value={logData.change_type} onChange={(e) => setLogData({...logData, change_type: e.target.value})}>
                          <option value="Add">Restock (Add)</option>
                          <option value="Remove">Issue (Remove)</option>
                       </select>
                    </div>
                    <div>
                       <label style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Quantity</label>
                       <input type="number" required style={{ width: '100%', padding: 12, background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 12, fontWeight: 800 }} value={logData.quantity} onChange={(e) => setLogData({...logData, quantity: e.target.value})} />
                    </div>
                 </div>
                 <div>
                    <label style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Reason / Note</label>
                    <input style={{ width: '100%', padding: 12, background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 12, fontWeight: 800 }} value={logData.reason} onChange={(e) => setLogData({...logData, reason: e.target.value})} />
                 </div>
                 <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                    <button type="button" onClick={() => setShowLogModal(false)} style={{ flex: 1, padding: 14, borderRadius: 14, border: 'none', fontWeight: 900 }}>Cancel</button>
                    <button type="submit" className="btn-premium" style={{ flex: 1.5, justifyContent: 'center' }}>Update Stock</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
