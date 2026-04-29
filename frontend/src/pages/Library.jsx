import React, { useState, useEffect } from 'react';
import { 
  Library as LibraryIcon, 
  Plus, 
  Search, 
  X, 
  Loader2, 
  Trash2, 
  Edit, 
  Book as BookIcon,
  User as UserIcon,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Hash,
  ArrowRightLeft,
  Filter
} from 'lucide-react';
import { getBooks, createBook, updateBook, deleteBook, getIssues, createIssue, updateIssue } from '../api/libraryApi';
import { getStudents } from '../api/studentsApi';

const Library = () => {
  const [activeTab, setActiveTab] = useState("books");
  const [books, setBooks] = useState([]);
  const [issues, setIssues] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  const [showBookModal, setShowBookModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  
  const [bookData, setBookData] = useState({ title: "", author: "", isbn: "", quantity: 1, available_quantity: 1, category: "" });
  const [issueData, setIssueData] = useState({ book: "", student: "", due_date: "", status: "Issued" });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bRes, iRes, sRes] = await Promise.all([getBooks(), getIssues(), getStudents()]);
      setBooks(Array.isArray(bRes.data) ? bRes.data : []);
      setIssues(Array.isArray(iRes.data) ? iRes.data : []);
      setStudents(Array.isArray(sRes.data) ? sRes.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) await updateBook(editingId, bookData);
      else await createBook(bookData);
      setShowBookModal(false);
      fetchData();
    } catch (err) {
      alert("Error saving book");
    } finally {
      setSaving(false);
    }
  };

  const handleIssueSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createIssue(issueData);
      setShowIssueModal(false);
      fetchData();
    } catch (err) {
      alert("Error issuing book");
    } finally {
      setSaving(false);
    }
  };

  const filteredBooks = books.filter(b => b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="page">
      <style>{`
        .lib-card { background: white; border-radius: 28px; padding: 24px; border: 1px solid rgba(0,0,0,0.03); box-shadow: 0 4px 15px rgba(0,0,0,0.01); transition: 0.3s; }
        .lib-card:hover { transform: translateY(-4px); box-shadow: 0 15px 30px rgba(0,0,0,0.05); }
        .tab-btn { padding: 12px 24px; border-radius: 14px; border: none; font-weight: 800; cursor: pointer; transition: 0.3s; }
        .tab-active { background: #4f46e5; color: white; box-shadow: 0 10px 20px rgba(79, 70, 229, 0.2); }
        .tab-inactive { background: white; color: #64748b; }
        .btn-premium { background: #4f46e5 !important; color: white !important; font-weight: 800 !important; padding: 12px 24px !important; border-radius: 14px !important; border: none !important; cursor: pointer !important; display: flex; align-items: center; gap: 8px; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40, flexWrap: 'wrap', gap: 20 }}>
        <div>
           <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ background: '#4f46e5', padding: 6, borderRadius: 8, color: 'white' }}><LibraryIcon size={18} /></div>
              <span style={{ fontSize: 10, fontWeight: 900, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '2px' }}>Resource Management</span>
           </div>
           <h1 style={{ fontSize: 36, fontWeight: 900, color: '#0f172a' }}>School Library</h1>
           <p style={{ fontSize: 16, color: '#64748b', fontWeight: 600 }}>Manage inventory and student book circulation.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
           <button onClick={() => { setEditingId(null); setBookData({ title: "", author: "", isbn: "", quantity: 1, available_quantity: 1, category: "" }); setShowBookModal(true); }} className="btn-premium"><Plus size={20} /> Add Book</button>
           <button onClick={() => setShowIssueModal(true)} className="btn-premium" style={{ background: '#0f172a !important' }}><ArrowRightLeft size={20} /> Issue Book</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
         <button onClick={() => setActiveTab("books")} className={`tab-btn ${activeTab === "books" ? "tab-active" : "tab-inactive"}`}>Books Inventory</button>
         <button onClick={() => setActiveTab("issues")} className={`tab-btn ${activeTab === "issues" ? "tab-active" : "tab-inactive"}`}>Issued History</button>
      </div>

      {activeTab === "books" ? (
        <>
          <div style={{ position: 'relative', maxWidth: 400, marginBottom: 32 }}>
            <Search style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={20} />
            <input type="text" placeholder="Search books by title or author..." style={{ width: '100%', padding: '12px 12px 12px 48px', background: 'white', border: '1px solid #f1f5f9', borderRadius: 16, fontWeight: 700, outline: 'none' }} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
            {loading ? Array(6).fill(0).map((_,i) => <div key={i} className="lib-card" style={{ height: 180, opacity: 0.5 }} />) : 
             filteredBooks.map(book => (
               <div key={book.id} className="lib-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                     <span style={{ fontSize: 10, fontWeight: 900, color: '#4f46e5', background: '#f5f3ff', padding: '4px 10px', borderRadius: 8, textTransform: 'uppercase' }}>{book.category || "General"}</span>
                     <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => { setEditingId(book.id); setBookData(book); setShowBookModal(true); }} style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer' }}><Edit size={16} /></button>
                        <button style={{ background: 'none', border: 'none', color: '#fee2e2', cursor: 'pointer' }}><Trash2 size={16} /></button>
                     </div>
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 900, color: '#1e293b', marginBottom: 4 }}>{book.title}</h3>
                  <p style={{ fontSize: 14, color: '#64748b', fontWeight: 600, marginBottom: 16 }}>{book.author}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
                     <div style={{ fontSize: 12, fontWeight: 800, color: '#94a3b8' }}>Available: <span style={{ color: book.available_quantity > 0 ? '#10b981' : '#ef4444' }}>{book.available_quantity}/{book.quantity}</span></div>
                     <BookIcon size={18} color="#e2e8f0" />
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
                    <th style={{ padding: 20, textAlign: 'left', fontSize: 12, fontWeight: 900, color: '#64748b' }}>BOOK</th>
                    <th style={{ padding: 20, textAlign: 'left', fontSize: 12, fontWeight: 900, color: '#64748b' }}>STUDENT</th>
                    <th style={{ padding: 20, textAlign: 'left', fontSize: 12, fontWeight: 900, color: '#64748b' }}>DUE DATE</th>
                    <th style={{ padding: 20, textAlign: 'left', fontSize: 12, fontWeight: 900, color: '#64748b' }}>STATUS</th>
                    <th style={{ padding: 20, textAlign: 'center', fontSize: 12, fontWeight: 900, color: '#64748b' }}>ACTION</th>
                 </tr>
              </thead>
              <tbody>
                 {issues.map(item => (
                   <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: 20, fontWeight: 800, color: '#1e293b' }}>{item.book_title}</td>
                      <td style={{ padding: 20, fontWeight: 800, color: '#1e293b' }}>{item.student_name}</td>
                      <td style={{ padding: 20, fontWeight: 800, color: '#ef4444' }}>{item.due_date}</td>
                      <td style={{ padding: 20 }}>
                         <span style={{ padding: '4px 10px', background: item.status === 'Issued' ? '#fffbeb' : '#ecfdf5', color: item.status === 'Issued' ? '#f59e0b' : '#10b981', fontSize: 11, fontWeight: 900, borderRadius: 8 }}>{item.status}</span>
                      </td>
                      <td style={{ padding: 20, textAlign: 'center' }}>
                         {item.status === 'Issued' && <button className="btn-premium" style={{ padding: '8px 16px !important', fontSize: 11 }}>Mark Returned</button>}
                      </td>
                   </tr>
                 ))}
              </tbody>
           </table>
        </div>
      )}

      {/* Book Modal */}
      {showBookModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
           <div style={{ background: 'white', width: '100%', maxWidth: 500, borderRadius: 32, overflow: 'hidden' }}>
              <div style={{ background: '#0f172a', padding: 32, color: 'white' }}>
                 <h2 style={{ fontSize: 24, fontWeight: 900 }}>{editingId ? "Edit Book" : "Add New Book"}</h2>
              </div>
              <form onSubmit={handleBookSave} style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
                 <div>
                    <label style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Book Title</label>
                    <input required style={{ width: '100%', padding: 12, background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 12, fontWeight: 800 }} value={bookData.title} onChange={(e) => setBookData({...bookData, title: e.target.value})} />
                 </div>
                 <div>
                    <label style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Author</label>
                    <input required style={{ width: '100%', padding: 12, background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 12, fontWeight: 800 }} value={bookData.author} onChange={(e) => setBookData({...bookData, author: e.target.value})} />
                 </div>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div>
                       <label style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Quantity</label>
                       <input type="number" style={{ width: '100%', padding: 12, background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 12, fontWeight: 800 }} value={bookData.quantity} onChange={(e) => setBookData({...bookData, quantity: e.target.value, available_quantity: e.target.value})} />
                    </div>
                    <div>
                       <label style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Category</label>
                       <input style={{ width: '100%', padding: 12, background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 12, fontWeight: 800 }} value={bookData.category} onChange={(e) => setBookData({...bookData, category: e.target.value})} />
                    </div>
                 </div>
                 <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                    <button type="button" onClick={() => setShowBookModal(false)} style={{ flex: 1, padding: 14, borderRadius: 14, border: 'none', fontWeight: 900 }}>Cancel</button>
                    <button type="submit" className="btn-premium" style={{ flex: 1.5, justifyContent: 'center' }}>Save Book</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Issue Modal */}
      {showIssueModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
           <div style={{ background: 'white', width: '100%', maxWidth: 500, borderRadius: 32, overflow: 'hidden' }}>
              <div style={{ background: '#0f172a', padding: 32, color: 'white' }}>
                 <h2 style={{ fontSize: 24, fontWeight: 900 }}>Issue a Book</h2>
              </div>
              <form onSubmit={handleIssueSave} style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
                 <div>
                    <label style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Select Book</label>
                    <select required style={{ width: '100%', padding: 12, background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 12, fontWeight: 800 }} value={issueData.book} onChange={(e) => setIssueData({...issueData, book: e.target.value})}>
                       <option value="">Choose Book</option>
                       {books.filter(b => b.available_quantity > 0).map(b => <option key={b.id} value={b.id}>{b.title} (By {b.author})</option>)}
                    </select>
                 </div>
                 <div>
                    <label style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Select Student</label>
                    <select required style={{ width: '100%', padding: 12, background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 12, fontWeight: 800 }} value={issueData.student} onChange={(e) => setIssueData({...issueData, student: e.target.value})}>
                       <option value="">Choose Student</option>
                       {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.roll_number})</option>)}
                    </select>
                 </div>
                 <div>
                    <label style={{ fontSize: 10, fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Due Date</label>
                    <input type="date" required style={{ width: '100%', padding: 12, background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 12, fontWeight: 800 }} value={issueData.due_date} onChange={(e) => setIssueData({...issueData, due_date: e.target.value})} />
                 </div>
                 <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                    <button type="button" onClick={() => setShowIssueModal(false)} style={{ flex: 1, padding: 14, borderRadius: 14, border: 'none', fontWeight: 900 }}>Cancel</button>
                    <button type="submit" className="btn-premium" style={{ flex: 1.5, justifyContent: 'center' }}>Issue Now</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Library;
