import React, { useState, useEffect } from 'react';
import { 
  Bus, 
  Plus, 
  Search, 
  X, 
  Loader2, 
  Trash2, 
  Edit, 
  MapPin,
  User as UserIcon,
  Phone,
  CheckCircle2,
  AlertCircle,
  Truck,
  Route as RouteIcon,
  Filter,
  DollarSign
} from 'lucide-react';
import { getVehicles, createVehicle, updateVehicle, deleteVehicle, getRoutes, createRoute, deleteRoute } from '../api/transportApi';

const Transport = () => {
  const [activeTab, setActiveTab] = useState("vehicles");
  const [vehicles, setVehicles] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  
  const [vehicleData, setVehicleData] = useState({ vehicle_no: "", vehicle_model: "", driver_name: "", driver_phone: "", status: "Active" });
  const [routeData, setRouteData] = useState({ route_name: "", vehicle: "", route_fare: 0 });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [vRes, rRes] = await Promise.all([getVehicles(), getRoutes()]);
      setVehicles(Array.isArray(vRes.data) ? vRes.data : []);
      setRoutes(Array.isArray(rRes.data) ? rRes.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVehicleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) await updateVehicle(editingId, vehicleData);
      else await createVehicle(vehicleData);
      setShowVehicleModal(false);
      fetchData();
    } catch (err) {
      alert("Error saving vehicle");
    } finally {
      setSaving(false);
    }
  };

  const handleRouteSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createRoute(routeData);
      setShowRouteModal(false);
      fetchData();
    } catch (err) {
      alert("Error saving route");
    } finally {
      setSaving(false);
    }
  };

  const filteredVehicles = vehicles.filter(v => v.vehicle_no.toLowerCase().includes(search.toLowerCase()) || v.driver_name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="page">
      <style>{`
        .tran-card { background: var(--bg-card); backdrop-filter: var(--glass-blur); border-radius: 24px; padding: 24px; border: 1px solid var(--border-glass); box-shadow: var(--shadow-premium); transition: 0.3s; position: relative; }
        .tran-card:hover { transform: translateY(-4px); box-shadow: var(--shadow); }
        .tab-btn { padding: 12px 24px; border-radius: 16px; border: none; font-weight: 800; cursor: pointer; transition: 0.3s; }
        .tab-active { background: var(--accent); color: white; box-shadow: 0 10px 20px rgba(79, 70, 229, 0.2); }
        .tab-inactive { background: white; color: var(--text-secondary); }
        .btn-premium { background: var(--gradient-primary) !important; color: white !important; font-weight: 800 !important; padding: 12px 24px !important; border-radius: 14px !important; border: none !important; cursor: pointer !important; display: flex; align-items: center; gap: 8px; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40, flexWrap: 'wrap', gap: 20 }}>
        <div>
           <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ background: 'var(--accent)', padding: 6, borderRadius: 8, color: 'white' }}><Bus size={18} /></div>
              <span style={{ fontSize: 10, fontWeight: 900, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '2px' }}>Logistics Management</span>
           </div>
           <h1 style={{ fontSize: 36, fontWeight: 900, color: 'var(--text-primary)' }}>Transport Fleet</h1>
           <p style={{ fontSize: 16, color: 'var(--text-secondary)', fontWeight: 600 }}>Monitor school vehicles, drivers, and route schedules.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
           <button onClick={() => { setEditingId(null); setVehicleData({ vehicle_no: "", vehicle_model: "", driver_name: "", driver_phone: "", status: "Active" }); setShowVehicleModal(true); }} className="btn-premium"><Plus size={20} /> Add Vehicle</button>
           <button onClick={() => setShowRouteModal(true)} className="btn-premium" style={{ background: 'var(--text-primary) !important' }}><RouteIcon size={20} /> Define Route</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
         <button onClick={() => setActiveTab("vehicles")} className={`tab-btn ${activeTab === "vehicles" ? "tab-active" : "tab-inactive"}`}>Vehicle Fleet</button>
         <button onClick={() => setActiveTab("routes")} className={`tab-btn ${activeTab === "routes" ? "tab-active" : "tab-inactive"}`}>Bus Routes</button>
      </div>

      {activeTab === "vehicles" ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
           {loading ? Array(4).fill(0).map((_,i) => <div key={i} className="tran-card" style={{ height: 200, opacity: 0.5 }} />) : 
            filteredVehicles.map(v => (
              <div key={v.id} className="tran-card">
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                    <span style={{ padding: '4px 12px', background: v.status === 'Active' ? '#ecfdf5' : '#fef2f2', color: v.status === 'Active' ? '#10b981' : '#ef4444', fontSize: 10, fontWeight: 900, borderRadius: 8 }}>{v.status}</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                       <button onClick={() => { setEditingId(v.id); setVehicleData(v); setShowVehicleModal(true); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><Edit size={18} /></button>
                       <button style={{ background: 'none', border: 'none', color: '#fee2e2', cursor: 'pointer' }}><Trash2 size={18} /></button>
                    </div>
                 </div>
                 <h3 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 4 }}>{v.vehicle_no}</h3>
                 <p style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 20 }}>{v.vehicle_model}</p>
                 <div style={{ paddingTop: 20, borderTop: '1px solid var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                       <div style={{ width: 32, height: 32, background: 'var(--bg-base)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}><UserIcon size={16} /></div>
                       <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>{v.driver_name}</span>
                    </div>
                    <div style={{ color: 'var(--text-muted)' }}><Phone size={16} /></div>
                 </div>
              </div>
            ))
           }
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
           {routes.map(r => (
             <div key={r.id} className="tran-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 40, height: 40, background: '#f5f3ff', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}><MapPin size={20} /></div>
                      <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)' }}>{r.route_name}</h3>
                   </div>
                   <button style={{ background: 'none', border: 'none', color: '#fee2e2', cursor: 'pointer' }}><Trash2 size={18} /></button>
                </div>
                <div style={{ marginBottom: 20 }}>
                   <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Assigned Vehicle</div>
                   <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>{r.vehicle_no || "Unassigned"} ({r.driver_name || "N/A"})</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20, borderTop: '1px solid var(--bg-hover)' }}>
                   <div style={{ fontSize: 13, fontWeight: 900, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}><DollarSign size={14} /> {r.route_fare} / Month</div>
                   <Truck size={18} color="#e2e8f0" />
                </div>
             </div>
           ))}
        </div>
      )}

      {/* Vehicle Modal */}
      {showVehicleModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
           <div style={{ background: 'var(--bg-card)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--border-glass)', width: '100%', maxWidth: 500, borderRadius: 32, overflow: 'hidden' }}>
              <div style={{ background: 'var(--bg-surface)', padding: 32, color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}>
                 <h2 style={{ fontSize: 24, fontWeight: 900 }}>{editingId ? "Edit Vehicle" : "Register Vehicle"}</h2>
              </div>
              <form onSubmit={handleVehicleSave} style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div>
                       <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Vehicle No</label>
                       <input required style={{ width: '100%', padding: 12, background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 12, fontWeight: 800, color: 'var(--text-primary)' }} value={vehicleData.vehicle_no} onChange={(e) => setVehicleData({...vehicleData, vehicle_no: e.target.value})} />
                    </div>
                    <div>
                       <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Model</label>
                       <input required style={{ width: '100%', padding: 12, background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 12, fontWeight: 800, color: 'var(--text-primary)' }} value={vehicleData.vehicle_model} onChange={(e) => setVehicleData({...vehicleData, vehicle_model: e.target.value})} />
                    </div>
                 </div>
                 <div>
                    <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Driver Name</label>
                    <input required style={{ width: '100%', padding: 12, background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 12, fontWeight: 800, color: 'var(--text-primary)' }} value={vehicleData.driver_name} onChange={(e) => setVehicleData({...vehicleData, driver_name: e.target.value})} />
                 </div>
                 <div>
                    <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Driver Phone</label>
                    <input required style={{ width: '100%', padding: 12, background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 12, fontWeight: 800, color: 'var(--text-primary)' }} value={vehicleData.driver_phone} onChange={(e) => setVehicleData({...vehicleData, driver_phone: e.target.value})} />
                 </div>
                 <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                    <button type="button" onClick={() => setShowVehicleModal(false)} style={{ flex: 1, padding: 14, borderRadius: 14, border: 'none', fontWeight: 900 }}>Cancel</button>
                    <button type="submit" className="btn-premium" style={{ flex: 1.5, justifyContent: 'center' }}>Save Vehicle</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Route Modal */}
      {showRouteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
           <div style={{ background: 'var(--bg-card)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--border-glass)', width: '100%', maxWidth: 500, borderRadius: 32, overflow: 'hidden' }}>
              <div style={{ background: 'var(--bg-surface)', padding: 32, color: 'var(--text-primary)', borderBottom: '1px solid var(--border)' }}>
                 <h2 style={{ fontSize: 24, fontWeight: 900 }}>Define New Route</h2>
              </div>
              <form onSubmit={handleRouteSave} style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
                 <div>
                    <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Route Name</label>
                    <input required style={{ width: '100%', padding: 12, background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 12, fontWeight: 800, color: 'var(--text-primary)' }} value={routeData.route_name} onChange={(e) => setRouteData({...routeData, route_name: e.target.value})} />
                 </div>
                 <div>
                    <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Assign Vehicle</label>
                    <select required style={{ width: '100%', padding: 12, background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 12, fontWeight: 800, color: 'var(--text-primary)' }} value={routeData.vehicle} onChange={(e) => setRouteData({...routeData, vehicle: e.target.value})}>
                       <option value="">Choose Vehicle</option>
                       {vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicle_no} - {v.driver_name}</option>)}
                    </select>
                 </div>
                 <div>
                    <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Monthly Fare</label>
                    <input type="number" required style={{ width: '100%', padding: 12, background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 12, fontWeight: 800, color: 'var(--text-primary)' }} value={routeData.route_fare} onChange={(e) => setRouteData({...routeData, route_fare: e.target.value})} />
                 </div>
                 <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                    <button type="button" onClick={() => setShowRouteModal(false)} style={{ flex: 1, padding: 14, borderRadius: 14, border: 'none', fontWeight: 900 }}>Cancel</button>
                    <button type="submit" className="btn-premium" style={{ flex: 1.5, justifyContent: 'center' }}>Save Route</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Transport;
