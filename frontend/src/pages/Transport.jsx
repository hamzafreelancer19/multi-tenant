import { useEffect, useMemo, useState } from "react";
import {
  Bus,
  Edit,
  Loader2,
  MessageCircle,
  Phone,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import {
  getVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getRoutes,
  createRoute,
  updateRoute,
  deleteRoute,
  getRiders,
  createRider,
  deleteRider,
} from "../api/transportApi";
import { getStudents } from "../api/studentsApi";
import { useTenant } from "../context/TenantContext";
import { getRole, getUser } from "../store/authStore";
import AppModal from "../components/AppModal";
import "./Dashboard.css";
import "./Students.css";
import "./Transport.css";

const VEHICLE_TYPES = ["Bus", "Coaster", "Van", "Mini Bus"];
const VEHICLE_STATUSES = ["Active", "Maintenance", "Inactive"];

function hhmm(value) {
  if (!value) return "";
  return String(value).slice(0, 5);
}

function money(n) {
  return `Rs ${Number(n || 0).toLocaleString()}`;
}

function contactPhone(s) {
  return s?.father_phone || s?.phone || s?.mother_phone || "";
}

function apiError(err) {
  const data = err.response?.data;
  if (!data) return "Could not save.";
  if (typeof data === "string") return data;
  if (data.detail) return data.detail;
  const first = Object.values(data).flat()?.[0];
  return first || "Could not save.";
}

function waLink(phone, text) {
  if (!phone) return;
  window.open(`https://wa.me/${String(phone).replace(/[^0-9]/g, "")}?text=${encodeURIComponent(text)}`, "_blank");
}

const EMPTY_VEHICLE = {
  vehicle_no: "",
  vehicle_model: "",
  vehicle_type: "Van",
  capacity: "15",
  driver_name: "",
  driver_phone: "",
  conductor_name: "",
  conductor_phone: "",
  status: "Active",
  notes: "",
};

const EMPTY_ROUTE = {
  route_name: "",
  vehicle: "",
  start_point: "",
  end_point: "",
  stops: "",
  morning_time: "07:15",
  evening_time: "14:30",
  route_fare: "",
  status: "Active",
  notes: "",
};

export default function Transport() {
  const tenant = useTenant();
  const role = getRole();
  const user = getUser();
  const canManage = role === "admin" || role === "teacher";
  const [viewMode, setViewMode] = useState("vehicles");
  const [vehicles, setVehicles] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [riders, setRiders] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showVehicle, setShowVehicle] = useState(false);
  const [showRoute, setShowRoute] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [ridersRoute, setRidersRoute] = useState(null);
  const [vehicleForm, setVehicleForm] = useState(EMPTY_VEHICLE);
  const [routeForm, setRouteForm] = useState(EMPTY_ROUTE);
  const [riderForm, setRiderForm] = useState({ student: "", stop_name: "" });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [vRes, rRes, dRes, sRes] = await Promise.all([
        getVehicles().catch(() => ({ data: [] })),
        getRoutes().catch(() => ({ data: [] })),
        getRiders().catch(() => ({ data: [] })),
        getStudents().catch(() => ({ data: [] })),
      ]);
      setVehicles(Array.isArray(vRes.data) ? vRes.data : []);
      setRoutes(Array.isArray(rRes.data) ? rRes.data : []);
      setRiders(Array.isArray(dRes.data) ? dRes.data : []);
      setStudents(Array.isArray(sRes.data) ? sRes.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const myStudent = useMemo(() => {
    return students.find((s) => {
      const email = (s.email || "").toLowerCase();
      return email && (email === (user?.email || "").toLowerCase() || email === (user?.username || "").toLowerCase());
    });
  }, [students, user]);

  const myRider = riders.find((r) => myStudent && r.student === myStudent.id);

  const setV = (key) => (e) => setVehicleForm((prev) => ({ ...prev, [key]: e.target.value }));
  const setR = (key) => (e) => setRouteForm((prev) => ({ ...prev, [key]: e.target.value }));

  const openAddVehicle = () => {
    setVehicleForm(EMPTY_VEHICLE);
    setEditingId(null);
    setShowVehicle(true);
  };

  const openEditVehicle = (v) => {
    setVehicleForm({
      vehicle_no: v.vehicle_no || "",
      vehicle_model: v.vehicle_model || "",
      vehicle_type: v.vehicle_type || "Van",
      capacity: String(v.capacity || 15),
      driver_name: v.driver_name || "",
      driver_phone: v.driver_phone || "",
      conductor_name: v.conductor_name || "",
      conductor_phone: v.conductor_phone || "",
      status: v.status || "Active",
      notes: v.notes || "",
    });
    setEditingId(v.id);
    setViewing(null);
    setShowVehicle(true);
  };

  const openAddRoute = () => {
    setRouteForm({ ...EMPTY_ROUTE, vehicle: vehicles[0] ? String(vehicles[0].id) : "" });
    setEditingId(null);
    setShowRoute(true);
  };

  const openEditRoute = (r) => {
    setRouteForm({
      route_name: r.route_name || "",
      vehicle: r.vehicle ? String(r.vehicle) : "",
      start_point: r.start_point || "",
      end_point: r.end_point || "",
      stops: r.stops || "",
      morning_time: hhmm(r.morning_time) || "07:15",
      evening_time: hhmm(r.evening_time) || "14:30",
      route_fare: String(r.route_fare || ""),
      status: r.status || "Active",
      notes: r.notes || "",
    });
    setEditingId(r.id);
    setShowRoute(true);
  };

  const handleVehicleSave = async (e) => {
    e.preventDefault();
    if (!vehicleForm.vehicle_no.trim() || !vehicleForm.driver_name.trim()) return alert("Vehicle number and driver are required");
    setSaving(true);
    try {
      const payload = { ...vehicleForm, capacity: Number(vehicleForm.capacity) || 15 };
      if (editingId) await updateVehicle(editingId, payload);
      else await createVehicle(payload);
      setShowVehicle(false);
      await fetchAll();
    } catch (err) {
      alert(apiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleRouteSave = async (e) => {
    e.preventDefault();
    if (!routeForm.route_name.trim()) return alert("Route name is required");
    setSaving(true);
    try {
      const payload = {
        ...routeForm,
        vehicle: routeForm.vehicle ? Number(routeForm.vehicle) : null,
        route_fare: Number(routeForm.route_fare) || 0,
        morning_time: routeForm.morning_time || null,
        evening_time: routeForm.evening_time || null,
      };
      if (editingId) await updateRoute(editingId, payload);
      else await createRoute(payload);
      setShowRoute(false);
      setViewMode("routes");
      await fetchAll();
    } catch (err) {
      alert(apiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVehicle = async (id, name) => {
    if (!window.confirm(`Delete vehicle ${name}?`)) return;
    try {
      await deleteVehicle(id);
      setViewing(null);
      await fetchAll();
    } catch {
      alert("Could not delete vehicle.");
    }
  };

  const handleDeleteRoute = async (id, name) => {
    if (!window.confirm(`Delete route ${name}?`)) return;
    try {
      await deleteRoute(id);
      setRidersRoute(null);
      await fetchAll();
    } catch {
      alert("Could not delete route.");
    }
  };

  const handleAddRider = async (e) => {
    e.preventDefault();
    if (!ridersRoute || !riderForm.student) return;
    setSaving(true);
    try {
      await createRider({
        route: ridersRoute.id,
        student: Number(riderForm.student),
        stop_name: riderForm.stop_name,
      });
      setRiderForm({ student: "", stop_name: "" });
      await fetchAll();
    } catch (err) {
      alert(apiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveRider = async (id) => {
    if (!window.confirm("Remove this student from the route?")) return;
    try {
      await deleteRider(id);
      await fetchAll();
    } catch {
      alert("Could not remove rider.");
    }
  };

  const filteredVehicles = vehicles.filter((v) => {
    const q = search.trim().toLowerCase();
    const blob = [v.vehicle_no, v.vehicle_model, v.driver_name, v.vehicle_type, v.conductor_name].join(" ").toLowerCase();
    const matchSearch = !q || blob.includes(q);
    const matchStatus = statusFilter === "All" || v.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const filteredRoutes = routes.filter((r) => {
    const q = search.trim().toLowerCase();
    const blob = [r.route_name, r.vehicle_no, r.driver_name, r.start_point, r.end_point, r.stops].join(" ").toLowerCase();
    const matchSearch = !q || blob.includes(q);
    const matchStatus = statusFilter === "All" || r.status === statusFilter;
    if (role === "student" && myRider) return matchSearch && r.id === myRider.route;
    return matchSearch && matchStatus;
  });

  const stats = {
    vehicles: vehicles.length,
    active: vehicles.filter((v) => v.status === "Active").length,
    routes: routes.filter((r) => r.status !== "Inactive").length,
    riders: riders.length,
  };

  const routeRiders = ridersRoute ? riders.filter((r) => r.route === ridersRoute.id) : [];
  const assignedIds = new Set(riders.map((r) => r.student));
  const riderStudents = students.filter((s) => (s.status || "Active") === "Active" && !assignedIds.has(s.id));
  const liveRidersRoute = ridersRoute ? routes.find((r) => r.id === ridersRoute.id) || ridersRoute : null;

  return (
    <div className="page dash-page st-page">
      <header className="dash-hero">
        <div>
          <p className="dash-kicker">Logistics</p>
          <h1>Transport</h1>
          <p>Fleet, drivers, and bus routes for {tenant.schoolName || "your school"}.</p>
        </div>
        {canManage && (
          <div className="dash-hero-meta">
            <button type="button" className="st-ghost" onClick={openAddRoute}>Add route</button>
            <button type="button" className="st-add-btn" onClick={openAddVehicle}>
              <Plus size={16} /> Add vehicle
            </button>
          </div>
        )}
      </header>

      <div className="dash-stats">
        <button type="button" className="dash-stat dash-stat-orange" onClick={() => setViewMode("vehicles")}>
          <span>Vehicles</span>
          <strong>{loading ? "—" : stats.vehicles}</strong>
          <small>in fleet</small>
        </button>
        <button type="button" className="dash-stat dash-stat-green" onClick={() => { setViewMode("vehicles"); setStatusFilter("Active"); }}>
          <span>Active</span>
          <strong>{loading ? "—" : stats.active}</strong>
          <small>on road</small>
        </button>
        <button type="button" className="dash-stat dash-stat-navy" onClick={() => setViewMode("routes")}>
          <span>Routes</span>
          <strong>{loading ? "—" : stats.routes}</strong>
          <small>running</small>
        </button>
        <button type="button" className="dash-stat dash-stat-gold" onClick={() => setViewMode("routes")}>
          <span>Riders</span>
          <strong>{loading ? "—" : stats.riders}</strong>
          <small>students</small>
        </button>
      </div>

      {role === "student" && myRider && (
        <p className="st-hint tp-mine">
          Your route: <b>{myRider.route_name}</b>
          {myRider.stop_name ? ` · stop ${myRider.stop_name}` : ""}
        </p>
      )}

      <div className="st-toolbar">
        <div className="st-search">
          <Search size={16} />
          <input
            placeholder={viewMode === "routes" ? "Search route, stop, driver…" : "Search vehicle, driver, model…"}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} aria-label="Clear search">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="st-filters">
          <button type="button" className={viewMode === "vehicles" ? "is-on" : ""} onClick={() => setViewMode("vehicles")}>Fleet</button>
          <button type="button" className={viewMode === "routes" ? "is-on" : ""} onClick={() => setViewMode("routes")}>Routes</button>
        </div>
      </div>

      <div className="st-classes">
        <button type="button" className={statusFilter === "All" ? "is-on" : ""} onClick={() => setStatusFilter("All")}>All</button>
        {(viewMode === "vehicles" ? VEHICLE_STATUSES : ["Active", "Inactive"]).map((s) => (
          <button key={s} type="button" className={statusFilter === s ? "is-on" : ""} onClick={() => setStatusFilter(s)}>{s}</button>
        ))}
      </div>

      <section className="dash-panel st-panel">
        {loading ? (
          <div className="st-empty">
            <Loader2 className="spin" size={32} />
            <p>Loading transport…</p>
          </div>
        ) : viewMode === "vehicles" ? (
          filteredVehicles.length === 0 ? (
            <div className="st-empty">
              <Bus size={36} />
              <p>{vehicles.length ? "No vehicles match these filters." : "No vehicles yet. Add the first van or bus."}</p>
              {canManage && !vehicles.length && <button type="button" onClick={openAddVehicle}>Add vehicle</button>}
            </div>
          ) : (
            <div className="st-table-wrap">
              <table className="st-table">
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Driver</th>
                    <th>Capacity</th>
                    <th>Routes</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filteredVehicles.map((v) => (
                    <tr key={v.id}>
                      <td>
                        <button type="button" className="st-person" onClick={() => setViewing(v)}>
                          <span>{(v.vehicle_no || "V").slice(0, 1)}</span>
                          <div>
                            <b>{v.vehicle_no}</b>
                            <small>{v.vehicle_type}{v.vehicle_model ? ` · ${v.vehicle_model}` : ""}</small>
                          </div>
                        </button>
                      </td>
                      <td>
                        <div className="st-cell-stack">
                          <b>{v.driver_name}</b>
                          <small>{v.driver_phone || "No phone"}</small>
                        </div>
                      </td>
                      <td className="st-mono">{v.capacity || "—"}</td>
                      <td className="st-mono">{v.route_count || 0}</td>
                      <td>
                        <span className={`st-badge ${v.status === "Active" ? "is-on" : v.status === "Maintenance" ? "is-warn" : "is-off"}`}>
                          {v.status}
                        </span>
                      </td>
                      <td>
                        <div className="st-actions">
                          {v.driver_phone && (
                            <button type="button" title="WhatsApp driver" onClick={() => waLink(v.driver_phone, `Salaam ${v.driver_name}, regarding vehicle ${v.vehicle_no} at ${tenant.schoolName || "school"}.`)}>
                              <MessageCircle size={15} />
                            </button>
                          )}
                          {canManage && (
                            <>
                              <button type="button" title="Edit" onClick={() => openEditVehicle(v)}><Edit size={15} /></button>
                              <button type="button" className="is-danger" title="Delete" onClick={() => handleDeleteVehicle(v.id, v.vehicle_no)}>
                                <Trash2 size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : filteredRoutes.length === 0 ? (
          <div className="st-empty">
            <Bus size={36} />
            <p>{routes.length ? "No routes match these filters." : "No routes yet. Add the first bus route."}</p>
            {canManage && !routes.length && <button type="button" onClick={openAddRoute}>Add route</button>}
          </div>
        ) : (
          <div className="st-table-wrap">
            <table className="st-table">
              <thead>
                <tr>
                  <th>Route</th>
                  <th>Vehicle</th>
                  <th>Timing</th>
                  <th>Fare</th>
                  <th>Riders</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filteredRoutes.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div className="st-cell-stack">
                        <b>{r.route_name}</b>
                        <small>
                          {r.start_point || "Start"} → {r.end_point || "School"}
                          {r.status === "Inactive" ? " · Inactive" : ""}
                        </small>
                      </div>
                    </td>
                    <td>
                      <div className="st-cell-stack">
                        <b>{r.vehicle_no || "Unassigned"}</b>
                        <small>{r.driver_name || "No driver"}</small>
                      </div>
                    </td>
                    <td>
                      <div className="st-cell-stack">
                        <b>{r.morning_time ? hhmm(r.morning_time) : "—"}</b>
                        <small>Return {r.evening_time ? hhmm(r.evening_time) : "—"}</small>
                      </div>
                    </td>
                    <td className="st-mono">{money(r.route_fare)}</td>
                    <td className="st-mono">{r.rider_count || 0}</td>
                    <td>
                      <div className="st-actions">
                        <button type="button" title="Riders" onClick={() => { setRidersRoute(r); setRiderForm({ student: "", stop_name: "" }); }}>
                          <Users size={15} />
                        </button>
                        {r.driver_phone && (
                          <a className="tp-call" href={`tel:${r.driver_phone}`} title="Call driver"><Phone size={15} /></a>
                        )}
                        {canManage && (
                          <>
                            <button type="button" title="Edit" onClick={() => openEditRoute(r)}><Edit size={15} /></button>
                            <button type="button" className="is-danger" title="Delete" onClick={() => handleDeleteRoute(r.id, r.route_name)}>
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="st-count">
        {viewMode === "vehicles"
          ? `Showing ${filteredVehicles.length} of ${vehicles.length} vehicles`
          : `Showing ${filteredRoutes.length} of ${routes.length} routes`}
      </p>

      {showVehicle && (
        <AppModal onClose={() => setShowVehicle(false)}>
          <form className="st-modal" onSubmit={handleVehicleSave}>
            <header>
              <div>
                <p>Fleet</p>
                <h2>{editingId ? "Edit vehicle" : "Add vehicle"}</h2>
              </div>
              <button type="button" onClick={() => setShowVehicle(false)}><X size={18} /></button>
            </header>
            <div className="st-modal-body">
              <p className="st-section">Vehicle</p>
              <div className="st-grid">
                <label>
                  Vehicle no *
                  <input required value={vehicleForm.vehicle_no} onChange={setV("vehicle_no")} placeholder="e.g. LEA-1234" />
                </label>
                <label>
                  Type
                  <select value={vehicleForm.vehicle_type} onChange={setV("vehicle_type")}>
                    {VEHICLE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
                <label>
                  Model
                  <input value={vehicleForm.vehicle_model} onChange={setV("vehicle_model")} placeholder="e.g. Hiace 2018" />
                </label>
                <label>
                  Seats
                  <input type="number" min="1" value={vehicleForm.capacity} onChange={setV("capacity")} />
                </label>
                <label>
                  Driver *
                  <input required value={vehicleForm.driver_name} onChange={setV("driver_name")} />
                </label>
                <label>
                  Driver phone
                  <input value={vehicleForm.driver_phone} onChange={setV("driver_phone")} placeholder="03xx…" />
                </label>
                <label>
                  Conductor
                  <input value={vehicleForm.conductor_name} onChange={setV("conductor_name")} />
                </label>
                <label>
                  Conductor phone
                  <input value={vehicleForm.conductor_phone} onChange={setV("conductor_phone")} />
                </label>
                <label>
                  Status
                  <select value={vehicleForm.status} onChange={setV("status")}>
                    {VEHICLE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
                <label>
                  Notes
                  <input value={vehicleForm.notes} onChange={setV("notes")} placeholder="Optional" />
                </label>
              </div>
            </div>
            <footer>
              <button type="button" className="st-ghost" onClick={() => setShowVehicle(false)}>Cancel</button>
              <button type="submit" className="st-add-btn" disabled={saving}>
                {saving ? <Loader2 size={16} className="spin" /> : editingId ? "Save changes" : "Add vehicle"}
              </button>
            </footer>
          </form>
        </AppModal>
      )}

      {showRoute && (
        <AppModal onClose={() => setShowRoute(false)}>
          <form className="st-modal" onSubmit={handleRouteSave}>
            <header>
              <div>
                <p>Routes</p>
                <h2>{editingId ? "Edit route" : "Add route"}</h2>
              </div>
              <button type="button" onClick={() => setShowRoute(false)}><X size={18} /></button>
            </header>
            <div className="st-modal-body">
              <div className="st-grid">
                <label className="st-span-2">
                  Route name *
                  <input required value={routeForm.route_name} onChange={setR("route_name")} placeholder="e.g. Johar Town" />
                </label>
                <label>
                  Start
                  <input value={routeForm.start_point} onChange={setR("start_point")} placeholder="First stop" />
                </label>
                <label>
                  End
                  <input value={routeForm.end_point} onChange={setR("end_point")} placeholder="School" />
                </label>
                <label>
                  Vehicle
                  <select value={routeForm.vehicle} onChange={setR("vehicle")}>
                    <option value="">Unassigned</option>
                    {vehicles.filter((v) => v.status === "Active" || String(v.id) === routeForm.vehicle).map((v) => (
                      <option key={v.id} value={v.id}>{v.vehicle_no} · {v.driver_name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Monthly fare
                  <input type="number" min="0" value={routeForm.route_fare} onChange={setR("route_fare")} placeholder="0" />
                </label>
                <label>
                  Morning pickup
                  <input type="time" value={routeForm.morning_time} onChange={setR("morning_time")} />
                </label>
                <label>
                  Evening drop
                  <input type="time" value={routeForm.evening_time} onChange={setR("evening_time")} />
                </label>
                <label>
                  Status
                  <select value={routeForm.status} onChange={setR("status")}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </label>
                <label>
                  Notes
                  <input value={routeForm.notes} onChange={setR("notes")} />
                </label>
                <label className="st-span-2">
                  Stops
                  <textarea rows={3} value={routeForm.stops} onChange={setR("stops")} placeholder="One stop per line" />
                </label>
              </div>
            </div>
            <footer>
              <button type="button" className="st-ghost" onClick={() => setShowRoute(false)}>Cancel</button>
              <button type="submit" className="st-add-btn" disabled={saving}>
                {saving ? <Loader2 size={16} className="spin" /> : editingId ? "Save changes" : "Add route"}
              </button>
            </footer>
          </form>
        </AppModal>
      )}

      {viewing && (
        <AppModal onClose={() => setViewing(null)}>
          <div className="st-modal">
            <header>
              <div>
                <p>{viewing.vehicle_type}</p>
                <h2>{viewing.vehicle_no}</h2>
              </div>
              <button type="button" onClick={() => setViewing(null)}><X size={18} /></button>
            </header>
            <div className="st-modal-body">
              <div className="tp-view-grid">
                <ViewRow label="Model" value={viewing.vehicle_model} />
                <ViewRow label="Seats" value={viewing.capacity} />
                <ViewRow label="Driver" value={viewing.driver_name} />
                <ViewRow label="Driver phone" value={viewing.driver_phone} />
                <ViewRow label="Conductor" value={viewing.conductor_name} />
                <ViewRow label="Conductor phone" value={viewing.conductor_phone} />
                <ViewRow label="Status" value={viewing.status} />
                <ViewRow label="Routes" value={viewing.route_count || 0} />
              </div>
              {viewing.notes && <p className="st-hint">{viewing.notes}</p>}
            </div>
            <footer>
              <button type="button" className="st-ghost" onClick={() => setViewing(null)}>Close</button>
              {canManage && <button type="button" className="st-add-btn" onClick={() => openEditVehicle(viewing)}>Edit</button>}
            </footer>
          </div>
        </AppModal>
      )}

      {liveRidersRoute && (
        <AppModal onClose={() => setRidersRoute(null)}>
          <div className="st-modal">
            <header>
              <div>
                <p>{liveRidersRoute.vehicle_no || "No vehicle"} · {money(liveRidersRoute.route_fare)}</p>
                <h2>Riders · {liveRidersRoute.route_name}</h2>
              </div>
              <button type="button" onClick={() => setRidersRoute(null)}><X size={18} /></button>
            </header>
            <div className="st-modal-body">
              {canManage && (
                <form className="tp-rider-form" onSubmit={handleAddRider}>
                  <select required value={riderForm.student} onChange={(e) => setRiderForm((p) => ({ ...p, student: e.target.value }))}>
                    <option value="">Select student</option>
                    {riderStudents.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} · {s.class_name || "No class"} · {s.roll_no || "No roll"}</option>
                    ))}
                  </select>
                  <input value={riderForm.stop_name} onChange={(e) => setRiderForm((p) => ({ ...p, stop_name: e.target.value }))} placeholder="Stop" />
                  <button type="submit" className="st-add-btn" disabled={saving}>{saving ? <Loader2 size={16} className="spin" /> : "Add"}</button>
                </form>
              )}
              {routeRiders.length === 0 ? (
                <p className="st-hint">No students on this route yet.</p>
              ) : (
                <ul className="tp-rider-list">
                  {routeRiders.map((r) => {
                    const student = students.find((s) => s.id === r.student);
                    const phone = contactPhone(student);
                    return (
                      <li key={r.id}>
                        <div>
                          <b>{r.student_name}</b>
                          <small>{r.student_class || "—"}{r.stop_name ? ` · ${r.stop_name}` : ""}</small>
                        </div>
                        <div className="st-actions">
                          {phone && (
                            <button type="button" title="WhatsApp" onClick={() => waLink(phone, `Transport notice for ${r.student_name} on ${liveRidersRoute.route_name}. Pickup ${hhmm(liveRidersRoute.morning_time) || ""}.\n\n${tenant.schoolName || "School"}`)}>
                              <MessageCircle size={15} />
                            </button>
                          )}
                          {canManage && (
                            <button type="button" className="is-danger" title="Remove" onClick={() => handleRemoveRider(r.id)}>
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <footer>
              <button type="button" className="st-ghost" onClick={() => setRidersRoute(null)}>Close</button>
              {canManage && <button type="button" className="st-ghost" onClick={() => { setRidersRoute(null); openEditRoute(liveRidersRoute); }}>Edit route</button>}
            </footer>
          </div>
        </AppModal>
      )}
    </div>
  );
}

function ViewRow({ label, value }) {
  return (
    <div className="tp-view-row">
      <span>{label}</span>
      <b>{value || "—"}</b>
    </div>
  );
}
