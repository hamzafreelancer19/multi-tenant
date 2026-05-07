import React, { useState, useEffect } from 'react';
import { 
  FileBadge, 
  Search, 
  Printer, 
  Download, 
  User, 
  School as SchoolIcon,
  CreditCard,
  Award,
  ChevronRight,
  Filter,
  CheckCircle2,
  X,
  Plus,
  Trash2,
  Settings,
  LayoutGrid,
  FileText
} from 'lucide-react';
import { getStudents } from '../api/studentsApi';
import { getClasses } from '../api/classesApi';

const CertificateGenerator = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [certType, setCertType] = useState("id-card");
  const [bulkMode, setBulkMode] = useState(false);
  
  // Customization State
  const [customSettings, setCustomSettings] = useState({
    schoolName: "EduSaaS Premium Academy",
    primaryColor: "var(--accent)",
    academicYear: "2024-2025",
    principalName: "Dr. Hamza Ahmed",
    signatureUrl: null
  });

  const [showSignPad, setShowSignPad] = useState(false);
  const canvasRef = React.useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveCanvas = () => {
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL();
    setCustomSettings({...customSettings, signatureUrl: dataUrl});
    setShowSignPad(false);
  };

  const handleSignatureUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomSettings({...customSettings, signatureUrl: reader.result});
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [sRes, cRes] = await Promise.all([getStudents(), getClasses()]);
      setStudents(Array.isArray(sRes.data) ? sRes.data : []);
      setClasses(Array.isArray(cRes.data) ? cRes.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.roll_number.includes(search);
    const matchesClass = selectedClass === "all" || s.grade === selectedClass;
    return matchesSearch && matchesClass;
  });

  const toggleStudentSelection = (student) => {
    if (selectedStudents.find(s => s.id === student.id)) {
      setSelectedStudents(selectedStudents.filter(s => s.id !== student.id));
    } else {
      setSelectedStudents([...selectedStudents, student]);
    }
  };

  const selectAllFiltered = () => {
    setSelectedStudents([...new Set([...selectedStudents, ...filteredStudents])]);
  };

  const clearSelection = () => setSelectedStudents([]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="page">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-area { margin: 0; padding: 0; border: none !important; box-shadow: none !important; display: block !important; }
          .page { padding: 0 !important; background: white !important; }
          body { background: white !important; }
          .bulk-print-container { display: grid !important; grid-template-columns: repeat(2, 1fr) !important; gap: 20px !important; }
          .id-card-preview { break-inside: avoid; page-break-inside: avoid; margin-bottom: 20px !important; }
          .cert-preview { break-inside: avoid; page-break-after: always; margin-bottom: 0 !important; }
        }
        .cert-card { background: white; border-radius: 20px; padding: 16px; border: 1px solid var(--bg-hover); cursor: pointer; transition: 0.3s; }
        .cert-card:hover { border-color: var(--accent); background: #f5f3ff; }
        .cert-active { border-color: var(--accent); background: #f5f3ff; box-shadow: 0 10px 20px rgba(79, 70, 229, 0.1); }
        
        .id-card-preview { width: 320px; height: 480px; background: white; border: 1px solid #e2e8f0; border-radius: 20px; position: relative; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05); flex-shrink: 0; margin: 0 auto; }
        .cert-preview { width: 800px; min-height: 580px; background: white; border: 15px double ${customSettings.primaryColor}; padding: 40px; position: relative; text-align: center; margin: 0 auto; }
        
        .student-item { padding: 12px; border-radius: 12px; cursor: pointer; transition: 0.2s; border: 1px solid var(--bg-hover); display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
        .student-selected { background: var(--accent); color: white; border-color: var(--accent); }
        
        .sidebar-section { background: var(--bg-card); backdrop-filter: var(--glass-blur); border-radius: 24px; padding: 24px; border: 1px solid var(--border-glass); margin-bottom: 24px; }
      `}</style>

      {/* Header */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40, flexWrap: 'wrap', gap: 20 }}>
        <div>
           <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ background: 'var(--accent)', padding: 6, borderRadius: 8, color: 'white' }}><FileBadge size={18} /></div>
              <span style={{ fontSize: 10, fontWeight: 900, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '2px' }}>Smart Printing</span>
           </div>
           <h1 style={{ fontSize: 36, fontWeight: 900, color: 'var(--text-primary)' }}>Certificate Engine</h1>
           <p style={{ fontSize: 16, color: 'var(--text-secondary)', fontWeight: 600 }}>Design once, generate for thousands of students instantly.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
           <button onClick={handlePrint} className="primary-btn" disabled={selectedStudents.length === 0} style={{ padding: '12px 24px', borderRadius: 16 }}>
              <Printer size={20} /> Bulk Print ({selectedStudents.length})
           </button>
        </div>
      </div>

      <div className="no-print" style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 32 }}>
        {/* Left: Configuration & Selection */}
        <aside>
           {/* Document Type Selection */}
           <div className="sidebar-section">
              <h3 style={{ fontSize: 12, fontWeight: 900, color: 'var(--text-secondary)', marginBottom: 16, textTransform: 'uppercase' }}>1. Document Style</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                 <div onClick={() => setCertType("id-card")} className={`cert-card ${certType === 'id-card' ? 'cert-active' : ''}`} style={{ textAlign: 'center' }}>
                    <CreditCard size={20} color={certType === 'id-card' ? 'var(--accent)' : 'var(--text-muted)'} style={{ margin: '0 auto 8px' }} />
                    <div style={{ fontWeight: 800, fontSize: 10 }}>ID Card</div>
                 </div>
                 <div onClick={() => setCertType("leaving")} className={`cert-card ${certType === 'leaving' ? 'cert-active' : ''}`} style={{ textAlign: 'center' }}>
                    <FileText size={20} color={certType === 'leaving' ? 'var(--accent)' : 'var(--text-muted)'} style={{ margin: '0 auto 8px' }} />
                    <div style={{ fontWeight: 800, fontSize: 10 }}>Transfer</div>
                 </div>
                 <div onClick={() => setCertType("award")} className={`cert-card ${certType === 'award' ? 'cert-active' : ''}`} style={{ textAlign: 'center' }}>
                    <Award size={20} color={certType === 'award' ? 'var(--accent)' : 'var(--text-muted)'} style={{ margin: '0 auto 8px' }} />
                    <div style={{ fontWeight: 800, fontSize: 10 }}>Award</div>
                 </div>
              </div>
           </div>

           {/* Customization Settings */}
           <div className="sidebar-section">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                 <Settings size={16} color="var(--text-secondary)" />
                 <h3 style={{ fontSize: 12, fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', margin: 0 }}>2. Branding</h3>
              </div>
              <div style={{ display: 'grid', gap: 12 }}>
                 <div>
                    <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>SCHOOL NAME</label>
                    <input style={{ width: '100%', padding: 10, background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 10, fontWeight: 700, fontSize: 12 }} value={customSettings.schoolName} onChange={e => setCustomSettings({...customSettings, schoolName: e.target.value})} />
                 </div>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                       <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>PRIMARY COLOR</label>
                       <input type="color" style={{ width: '100%', height: 36, padding: 2, background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 10 }} value={customSettings.primaryColor} onChange={e => setCustomSettings({...customSettings, primaryColor: e.target.value})} />
                    </div>
                    <div>
                       <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>YEAR</label>
                       <input style={{ width: '100%', padding: 10, background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 10, fontWeight: 700, fontSize: 12 }} value={customSettings.academicYear} onChange={e => setCustomSettings({...customSettings, academicYear: e.target.value})} />
                    </div>
                 </div>
                 <div>
                    <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>DIGITAL SIGNATURE</label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                       <input type="file" accept="image/*" id="sig-upload" hidden onChange={handleSignatureUpload} />
                       <label htmlFor="sig-upload" style={{ flex: 1, padding: '10px', background: '#f5f3ff', border: '1px dashed var(--accent)', borderRadius: 10, color: 'var(--accent)', fontSize: 11, fontWeight: 800, textAlign: 'center', cursor: 'pointer' }}>
                          Upload
                       </label>
                       <button onClick={() => setShowSignPad(true)} style={{ flex: 1, padding: '10px', background: 'var(--text-primary)', border: 'none', borderRadius: 10, color: 'white', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
                          Draw Live
                       </button>
                    </div>
                    {customSettings.signatureUrl && (
                       <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10, padding: 8, background: 'var(--bg-base)', borderRadius: 12, border: '1px solid var(--border)' }}>
                          <img src={customSettings.signatureUrl} style={{ height: 30, maxWidth: 100, objectFit: 'contain' }} />
                          <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700, color: 'var(--text-primary)' }}>Active Signature</div>
                          <X size={14} style={{ marginLeft: 'auto', cursor: 'pointer' }} onClick={() => setCustomSettings({...customSettings, signatureUrl: null})} />
                       </div>
                    )}
                 </div>

      {/* Signature Pad Modal */}
      {showSignPad && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(10px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
           <div style={{ background: 'var(--bg-card)', borderRadius: 32, padding: 32, width: 500 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                 <h2 style={{ fontSize: 20, fontWeight: 900 }}>Draw Your Signature</h2>
                 <X size={24} style={{ cursor: 'pointer' }} onClick={() => setShowSignPad(false)} />
              </div>
              <canvas
                ref={canvasRef}
                width={436}
                height={200}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseOut={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                style={{ background: 'var(--bg-base)', border: '2px dashed #e2e8f0', borderRadius: 16, cursor: 'crosshair', touchAction: 'none' }}
              />
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12, fontWeight: 600 }}>Use your mouse or touch screen to sign above.</p>
              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                 <button onClick={clearCanvas} style={{ flex: 1, padding: 14, borderRadius: 14, border: '1px solid #e2e8f0', background: 'none', fontWeight: 800, cursor: 'pointer' }}>Clear</button>
                 <button onClick={saveCanvas} className="primary-btn" style={{ flex: 1.5, justifyContent: 'center' }}>Save & Apply</button>
              </div>
           </div>
        </div>
      )}
              </div>
           </div>

           {/* Student Picker */}
           <div className="sidebar-section" style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                 <h3 style={{ fontSize: 12, fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', margin: 0 }}>3. Select Students</h3>
                 <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent)', cursor: 'pointer' }} onClick={selectedStudents.length > 0 ? clearSelection : selectAllFiltered}>
                    {selectedStudents.length > 0 ? "Clear All" : "Select All"}
                 </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                 <select style={{ width: '100%', padding: 10, background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 10, fontWeight: 700, fontSize: 12 }} value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                    <option value="all">All Classes</option>
                    {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                 </select>
                 <div style={{ position: 'relative' }}>
                    <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={14} />
                    <input placeholder="Search..." style={{ width: '100%', padding: '10px 10px 10px 30px', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 10, fontWeight: 700, fontSize: 12 }} value={search} onChange={e => setSearch(e.target.value)} />
                 </div>
              </div>

              <div style={{ maxHeight: 300, overflowY: 'auto', paddingRight: 8 }}>
                 {filteredStudents.length === 0 ? <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>No students found.</p> : 
                  filteredStudents.map(s => {
                    const isSelected = selectedStudents.find(x => x.id === s.id);
                    return (
                      <div key={s.id} onClick={() => toggleStudentSelection(s)} className={`student-item ${isSelected ? 'student-selected' : ''}`}>
                         <div style={{ width: 24, height: 24, borderRadius: '50%', background: isSelected ? 'rgba(255,255,255,0.2)' : 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {isSelected ? <CheckCircle2 size={14} /> : <User size={14} color="var(--text-muted)" />}
                         </div>
                         <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>{s.name}</div>
                            <div style={{ fontSize: 10, opacity: 0.7 }}>Roll: {s.roll_number} • {s.grade}</div>
                         </div>
                      </div>
                    );
                  })
                 }
              </div>
           </div>
        </aside>

        {/* Right: Live Preview */}
        <main>
           <div style={{ background: 'var(--bg-base)', border: '2px dashed #e2e8f0', borderRadius: 32, padding: 40, minHeight: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40 }}>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--text-muted)', fontWeight: 800, fontSize: 14 }}>
                    <LayoutGrid size={20} /> Live Preview Mode
                 </div>
                 <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Documents will appear here as they will look when printed.</p>
              </div>

              {selectedStudents.length === 0 ? (
                <div style={{ textAlign: 'center', opacity: 0.5, marginTop: 100 }}>
                   <div style={{ width: 100, height: 100, background: 'var(--bg-hover)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                      <FileBadge size={48} color="var(--text-muted)" />
                   </div>
                   <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)' }}>Nothing to show</h2>
                   <p style={{ fontSize: 14, fontWeight: 600, maxWidth: 300 }}>Please select students from the sidebar to generate their {certType.replace('-', ' ')}s.</p>
                </div>
              ) : (
                <div className="print-area bulk-print-container" style={{ display: 'flex', flexWrap: 'wrap', gap: 30, justifyContent: 'center' }}>
                   {selectedStudents.map((student, index) => (
                     <div key={student.id}>
                        {certType === 'id-card' && (
                          <div className="id-card-preview">
                             <div style={{ background: customSettings.primaryColor, height: 110, padding: 20, textAlign: 'center', color: 'white' }}>
                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}><SchoolIcon size={24} /></div>
                                <div style={{ fontSize: 14, fontWeight: 900, textTransform: 'uppercase', lineHeight: 1.2 }}>{customSettings.schoolName}</div>
                                <div style={{ fontSize: 9, opacity: 0.8, marginTop: 4 }}>ID Card • {customSettings.academicYear}</div>
                             </div>
                             <div style={{ display: 'flex', justifyContent: 'center', marginTop: -35 }}>
                                <div style={{ width: 90, height: 90, background: 'var(--bg-card)', borderRadius: '50%', border: '4px solid white', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}>
                                   {student.photo ? <img src={student.photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={50} />}
                                </div>
                             </div>
                             <div style={{ textAlign: 'center', padding: '15px 20px' }}>
                                <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 4 }}>{student.name}</h2>
                                <p style={{ fontSize: 12, fontWeight: 800, color: customSettings.primaryColor, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 15 }}>STUDENT</p>
                                
                                <div style={{ textAlign: 'left', background: 'var(--bg-base)', padding: '12px 16px', borderRadius: 16, display: 'grid', gap: 10 }}>
                                   <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                      <span style={{ fontSize: 9, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Roll No</span>
                                      <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-primary)' }}>{student.roll_number}</span>
                                   </div>
                                   <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                      <span style={{ fontSize: 9, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Class</span>
                                      <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-primary)' }}>{student.grade}</span>
                                   </div>
                                   <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                      <span style={{ fontSize: 9, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Father</span>
                                      <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-primary)' }}>{student.father_name || "N/A"}</span>
                                   </div>
                                </div>
                             </div>
                             <div style={{ position: 'absolute', bottom: 15, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                {customSettings.signatureUrl ? (
                                   <img src={customSettings.signatureUrl} style={{ height: 35, maxWidth: '80%', objectFit: 'contain', marginBottom: -2 }} />
                                ) : (
                                   <div style={{ width: 100, height: 1, background: '#e2e8f0', marginBottom: 8 }}></div>
                                )}
                                <div style={{ fontSize: 9, fontWeight: 900, color: 'var(--text-muted)' }}>Authorized Signature</div>
                             </div>
                          </div>
                        )}

                        {certType === 'leaving' && (
                          <div className="cert-preview">
                             <div style={{ position: 'absolute', top: 20, right: 30 }}><SchoolIcon size={40} color={customSettings.primaryColor} /></div>
                             <h1 style={{ fontSize: 36, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 40, textTransform: 'uppercase', letterSpacing: 2 }}>School Leaving Certificate</h1>
                             <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 2 }}>This is to certify that the student</p>
                             <h2 style={{ fontSize: 28, fontWeight: 900, color: customSettings.primaryColor, margin: '15px 0', borderBottom: '2px solid var(--bg-hover)', display: 'inline-block', padding: '0 30px' }}>{student.name}</h2>
                             <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 2 }}>
                                Son/Daughter of <strong>{student.father_name || "N/A"}</strong>, <br />
                                having successfully completed his studies in <strong>{student.grade}</strong> <br />
                                at <strong>{customSettings.schoolName}</strong>. <br />
                                We wish him/her the best in all future endeavors.
                             </p>
                             <div style={{ marginTop: 60, display: 'flex', justifyContent: 'space-between', padding: '0 40px' }}>
                                <div style={{ textAlign: 'center' }}>
                                   <div style={{ width: 140, borderTop: '1px solid var(--text-primary)', marginTop: 40, paddingTop: 6, fontSize: 12, fontWeight: 800, color: 'var(--text-primary)' }}>Admin Office</div>
                                </div>
                                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                   {customSettings.signatureUrl && (
                                      <div style={{ marginBottom: -25 }}>
                                         <img src={customSettings.signatureUrl} style={{ height: 40, maxWidth: 120, objectFit: 'contain' }} />
                                      </div>
                                   )}
                                   <div style={{ width: 140, borderTop: '1px solid var(--text-primary)', marginTop: 40, paddingTop: 6, fontSize: 12, fontWeight: 800, color: 'var(--text-primary)' }}>Principal</div>
                                </div>
                             </div>
                          </div>
                        )}

                        {certType === 'award' && (
                          <div className="cert-preview" style={{ border: `15px double #f59e0b` }}>
                             <div style={{ position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)' }}><Award size={60} color="#f59e0b" /></div>
                             <h1 style={{ fontSize: 42, fontWeight: 900, color: '#f59e0b', marginTop: 50, marginBottom: 10 }}>Certificate of Excellence</h1>
                             <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: 4, marginBottom: 30 }}>{customSettings.schoolName}</p>
                             <p style={{ fontSize: 16, color: 'var(--text-secondary)' }}>PROUDLY PRESENTED TO</p>
                             <h2 style={{ fontSize: 36, fontWeight: 900, color: 'var(--text-primary)', margin: '25px 0', fontFamily: 'serif' }}>{student.name}</h2>
                             <p style={{ fontSize: 16, color: 'var(--text-secondary)', maxWidth: 450, margin: '0 auto', lineHeight: 1.6 }}>
                                For achieving outstanding marks and demonstrating consistent growth in character and academics during the session <strong>{customSettings.academicYear}</strong>.
                             </p>
                             <div style={{ marginTop: 40, fontWeight: 900, color: '#f59e0b', fontSize: 14, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                {customSettings.signatureUrl && (
                                   <div style={{ marginBottom: -10 }}>
                                      <img src={customSettings.signatureUrl} style={{ height: 40, maxWidth: 150, objectFit: 'contain' }} />
                                   </div>
                                )}
                                <div>
                                   {customSettings.principalName} <br />
                                   <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>Principal</span>
                                </div>
                             </div>
                          </div>
                        )}
                     </div>
                   ))}
                </div>
              )}
           </div>
        </main>
      </div>
    </div>
  );
};

export default CertificateGenerator;
