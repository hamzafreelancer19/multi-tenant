import React, { useState, useEffect } from 'react';
import { useTenant } from '../context/TenantContext';
import api from '../api/axios';
import { Save, Layout, Palette, Phone, Mail, FileText, CheckCircle, Image as ImageIcon, Plus, Trash2, Heart, Award, GraduationCap, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import './LandingPageSettings.css';

const LandingPageSettings = () => {
  const tenant = useTenant();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [settings, setSettings] = useState({
    hero_title: '',
    hero_subtitle: '',
    about: '',
    primary_color: '#3b82f6',
    contact_email: '',
    contact_phone: '',
    show_stats: true,
    hero_image_url: '',
    center_image_url: '',
    features: [],
    testimonials: [],
    programs: [],
    languages: [],
  });

  useEffect(() => {
    if (tenant.landing) {
      setSettings({
        hero_title: tenant.landing.hero_title || '',
        hero_subtitle: tenant.landing.hero_subtitle || '',
        about: tenant.landing.about || '',
        primary_color: tenant.landing.primary_color || '#3b82f6',
        contact_email: tenant.landing.contact_email || '',
        contact_phone: tenant.landing.contact_phone || '',
        show_stats: tenant.landing.show_stats !== undefined ? tenant.landing.show_stats : true,
        hero_image_url: tenant.landing.hero_image_url || '',
        center_image_url: tenant.landing.center_image_url || '',
        features: tenant.landing.features || [],
        testimonials: tenant.landing.testimonials || [],
        programs: tenant.landing.programs || [],
        languages: tenant.landing.languages || [],
      });
    }
  }, [tenant.landing]);

  const handleSave = async () => {
    setLoading(true);
    setMessage('');
    try {
      await api.put('/school/landing-settings/', settings);
      setMessage('Settings updated successfully!');
      if (tenant.refreshTenant) {
        await tenant.refreshTenant();
      }
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Failed to update settings.');
    } finally {
      setLoading(false);
    }
  };

  const addFeature = () => {
    setSettings({...settings, features: [...settings.features, { title: '', desc: '', color: '#5D5DFF', bg: '#EEF2FF' }]});
  };

  const removeFeature = (index) => {
    const updated = settings.features.filter((_, i) => i !== index);
    setSettings({...settings, features: updated});
  };

  const addTestimonial = () => {
    setSettings({...settings, testimonials: [...settings.testimonials, { name: '', quote: '', role: '', img: '' }]});
  };

  const removeTestimonial = (index) => {
    const updated = settings.testimonials.filter((_, i) => i !== index);
    setSettings({...settings, testimonials: updated});
  };

  const addProgram = () => {
    setSettings({...settings, programs: [...settings.programs, { title: '', age: '', price: '', badge: '', desc: '', color: '#5D5DFF' }]});
  };

  const removeProgram = (index) => {
    const updated = settings.programs.filter((_, i) => i !== index);
    setSettings({...settings, programs: updated});
  };

  const addLanguage = () => {
    setSettings({...settings, languages: [...settings.languages, { name: '', flag: '', top: '50%', left: '50%' }]});
  };

  const removeLanguage = (index) => {
    const updated = settings.languages.filter((_, i) => i !== index);
    setSettings({...settings, languages: updated});
  };

  return (
    <div className="lps-container">
      <header className="lps-header">
        <div className="lps-header-text">
          <h1>Control Center</h1>
          <p>Full control over your public landing page and school identity.</p>
        </div>
        <button onClick={handleSave} disabled={loading} className="lps-save-btn">
          {loading ? 'Saving...' : <><Save size={20} /> Deploy Changes</>}
        </button>
      </header>

      {message && <div className="lps-success-msg">{message}</div>}

      <div className="lps-grid">
        <div className="lps-col-main">
          
          {/* Hero Section */}
          <section className="lps-card">
            <div className="lps-card-title" style={{ color: '#6366f1' }}><Layout size={24} /> Hero Content</div>
            <div className="lps-form-group">
              <label className="lps-label">Main Title</label>
              <input type="text" value={settings.hero_title} onChange={(e) => setSettings({...settings, hero_title: e.target.value})} className="lps-input" />
            </div>
            <div className="lps-form-group">
              <label className="lps-label">Subtitle</label>
              <textarea value={settings.hero_subtitle} onChange={(e) => setSettings({...settings, hero_subtitle: e.target.value})} className="lps-input lps-textarea" />
            </div>
          </section>

          {/* Features Management */}
          <section className="lps-card">
            <div className="lps-card-title" style={{ color: '#10b981' }}>
              <Award size={24} /> School Highlights (Bento Grid)
            </div>
            <div className="space-y-4">
              {settings.features.map((feature, i) => (
                <div key={i} className="p-6 bg-slate-50 rounded-2xl border-2 border-slate-100 mb-4">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-black text-slate-400">FEATURE #{i+1}</span>
                    <button onClick={() => removeFeature(i)} className="text-red-400 hover:text-red-600"><Trash2 size={18} /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <input type="text" value={feature.title} onChange={(e) => { const updated = [...settings.features]; updated[i].title = e.target.value; setSettings({...settings, features: updated}); }} placeholder="Feature Title" className="lps-input" />
                    <div className="flex gap-2">
                      <input type="color" value={feature.color} onChange={(e) => { const updated = [...settings.features]; updated[i].color = e.target.value; setSettings({...settings, features: updated}); }} className="h-12 w-12 rounded-xl cursor-pointer" />
                      <input type="color" value={feature.bg} onChange={(e) => { const updated = [...settings.features]; updated[i].bg = e.target.value; setSettings({...settings, features: updated}); }} className="h-12 w-12 rounded-xl cursor-pointer" />
                    </div>
                  </div>
                  <textarea value={feature.desc} onChange={(e) => { const updated = [...settings.features]; updated[i].desc = e.target.value; setSettings({...settings, features: updated}); }} placeholder="Short Description" className="lps-input lps-textarea" style={{ minHeight: '80px' }} />
                </div>
              ))}
              <button onClick={addFeature} className="w-full p-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold hover:border-emerald-400 hover:text-emerald-500 transition-all flex items-center justify-center gap-2">
                <Plus size={20} /> Add New Highlight
              </button>
            </div>
          </section>

          {/* Testimonials */}
          <section className="lps-card">
            <div className="lps-card-title" style={{ color: '#f43f5e' }}>
              <Heart size={24} /> Parent Testimonials
            </div>
            <div className="space-y-4">
              {settings.testimonials.map((t, i) => (
                <div key={i} className="p-6 bg-slate-50 rounded-2xl border-2 border-slate-100 mb-4">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-black text-slate-400">TESTIMONIAL #{i+1}</span>
                    <button onClick={() => removeTestimonial(i)} className="text-red-400 hover:text-red-600"><Trash2 size={18} /></button>
                  </div>
                  <input 
                    type="text" 
                    value={t.name} 
                    onChange={(e) => {
                      const updated = [...settings.testimonials];
                      updated[i].name = e.target.value;
                      setSettings({...settings, testimonials: updated});
                    }}
                    placeholder="Parent Name"
                    className="lps-input mb-2"
                  />
                  <input 
                    type="text" 
                    value={t.role} 
                    onChange={(e) => {
                      const updated = [...settings.testimonials];
                      updated[i].role = e.target.value;
                      setSettings({...settings, testimonials: updated});
                    }}
                    placeholder="Role (e.g. Parent of Grade 5)"
                    className="lps-input mb-4"
                  />
                  <textarea 
                    value={t.quote} 
                    onChange={(e) => {
                      const updated = [...settings.testimonials];
                      updated[i].quote = e.target.value;
                      setSettings({...settings, testimonials: updated});
                    }}
                    placeholder="Their Quote..."
                    className="lps-input lps-textarea"
                    style={{ minHeight: '80px' }}
                  />
                </div>
              ))}
              <button onClick={addTestimonial} className="w-full p-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold hover:border-pink-400 hover:text-pink-500 transition-all flex items-center justify-center gap-2">
                <Plus size={20} /> Add Testimonial
              </button>
            </div>
          </section>

          {/* Programs Management */}
          <section className="lps-card">
            <div className="lps-card-title" style={{ color: '#8b5cf6' }}>
              <GraduationCap size={24} /> Offered Programs
            </div>
            <div className="space-y-4">
              {settings.programs.map((program, i) => (
                <div key={i} className="p-6 bg-slate-50 rounded-2xl border-2 border-slate-100 mb-4">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-black text-slate-400">PROGRAM #{i+1}</span>
                    <button onClick={() => removeProgram(i)} className="text-red-400 hover:text-red-600"><Trash2 size={18} /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <input type="text" value={program.title} onChange={(e) => { const updated = [...settings.programs]; updated[i].title = e.target.value; setSettings({...settings, programs: updated}); }} placeholder="Program Title" className="lps-input" />
                    <input type="text" value={program.age} onChange={(e) => { const updated = [...settings.programs]; updated[i].age = e.target.value; setSettings({...settings, programs: updated}); }} placeholder="Age Range (e.g. 3-7 YEARS)" className="lps-input" />
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <input type="text" value={program.price} onChange={(e) => { const updated = [...settings.programs]; updated[i].price = e.target.value; setSettings({...settings, programs: updated}); }} placeholder="Price (e.g. 200)" className="lps-input" />
                    <input type="text" value={program.badge} onChange={(e) => { const updated = [...settings.programs]; updated[i].badge = e.target.value; setSettings({...settings, programs: updated}); }} placeholder="Badge (Optional)" className="lps-input" />
                    <input type="color" value={program.color} onChange={(e) => { const updated = [...settings.programs]; updated[i].color = e.target.value; setSettings({...settings, programs: updated}); }} className="h-12 w-full rounded-xl cursor-pointer" />
                  </div>
                  <textarea value={program.desc} onChange={(e) => { const updated = [...settings.programs]; updated[i].desc = e.target.value; setSettings({...settings, programs: updated}); }} placeholder="Program Description" className="lps-input lps-textarea" />
                </div>
              ))}
              <button onClick={addProgram} className="w-full p-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold hover:border-purple-400 hover:text-purple-500 transition-all flex items-center justify-center gap-2">
                <Plus size={20} /> Add New Program
              </button>
            </div>
          </section>

          {/* Languages Management */}
          <section className="lps-card">
            <div className="lps-card-title" style={{ color: '#3b82f6' }}>
              <Globe size={24} /> Language Orbit
            </div>
            <div className="space-y-4">
              {settings.languages.map((lang, i) => (
                <div key={i} className="p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 mb-4 flex items-center gap-4">
                   <input type="text" value={lang.flag} onChange={(e) => { const updated = [...settings.languages]; updated[i].flag = e.target.value; setSettings({...settings, languages: updated}); }} placeholder="Emoji Flag" className="lps-input" style={{ width: '80px' }} />
                   <input type="text" value={lang.name} onChange={(e) => { const updated = [...settings.languages]; updated[i].name = e.target.value; setSettings({...settings, languages: updated}); }} placeholder="Language Name" className="lps-input" />
                   <div className="flex gap-2">
                     <input type="text" value={lang.top} onChange={(e) => { const updated = [...settings.languages]; updated[i].top = e.target.value; setSettings({...settings, languages: updated}); }} placeholder="Top %" className="lps-input" style={{ width: '80px' }} />
                     <input type="text" value={lang.left} onChange={(e) => { const updated = [...settings.languages]; updated[i].left = e.target.value; setSettings({...settings, languages: updated}); }} placeholder="Left %" className="lps-input" style={{ width: '80px' }} />
                   </div>
                   <button onClick={() => removeLanguage(i)} className="text-red-400 hover:text-red-600"><Trash2 size={18} /></button>
                </div>
              ))}
              <button onClick={addLanguage} className="w-full p-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold hover:border-blue-400 hover:text-blue-500 transition-all flex items-center justify-center gap-2">
                <Plus size={20} /> Add Language to Orbit
              </button>
            </div>
          </section>
        </div>

        <div className="lps-col-side">
          <section className="lps-card">
            <div className="lps-card-title" style={{ color: '#ec4899' }}><Palette size={24} /> Identity</div>
            <div className="lps-form-group">
              <label className="lps-label">Hero Image (URL or Upload)</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input 
                  type="text" 
                  value={settings.hero_image_url} 
                  onChange={(e) => setSettings({...settings, hero_image_url: e.target.value})} 
                  className="lps-input" 
                  placeholder="Paste URL or upload below..."
                />
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label className="lps-save-btn" style={{ background: '#f1f5f9', color: '#475569', padding: '12px 20px', fontSize: '13px', borderRadius: '12px', cursor: 'pointer', flex: 1, justifyContent: 'center' }}>
                    <ImageIcon size={16} /> Upload from PC
                    <input 
                      type="file" 
                      style={{ display: 'none' }} 
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        const formData = new FormData();
                        formData.append('image', file);
                        setLoading(true);
                        try {
                          const res = await api.post('/school/upload-image/', formData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                          });
                          setSettings({...settings, hero_image_url: res.data.url});
                          setMessage('Image uploaded successfully!');
                          setTimeout(() => setMessage(''), 3000);
                        } catch (err) {
                          setMessage('Upload failed.');
                        } finally {
                          setLoading(false);
                        }
                      }}
                    />
                  </label>
                  {loading && <div style={{ width: '40px', height: '4px', background: '#6366f1', borderRadius: '10px' }} />}
                </div>
              </div>
            </div>
            <div className="lps-form-group">
              <label className="lps-label">Orbit Center Image (Student Image)</label>
              <input type="text" value={settings.center_image_url} onChange={(e) => setSettings({...settings, center_image_url: e.target.value})} className="lps-input" placeholder="Paste image URL..." />
            </div>
            <div className="lps-form-group">
              <label className="lps-label">Primary Color</label>
              <div className="lps-color-picker">
                <input type="color" value={settings.primary_color} onChange={(e) => setSettings({...settings, primary_color: e.target.value})} className="lps-color-input" />
                <span className="font-black text-slate-500 uppercase">{settings.primary_color}</span>
              </div>
            </div>
          </section>

          <section className="lps-card">
            <div className="lps-card-title" style={{ color: '#f59e0b' }}><Mail size={24} /> Contact</div>
            <div className="lps-form-group">
              <label className="lps-label">Email</label>
              <input type="email" value={settings.contact_email} onChange={(e) => setSettings({...settings, contact_email: e.target.value})} className="lps-input" />
            </div>
            <div className="lps-form-group">
              <label className="lps-label">Phone</label>
              <input type="text" value={settings.contact_phone} onChange={(e) => setSettings({...settings, contact_phone: e.target.value})} className="lps-input" />
            </div>
            <div className="lps-toggle">
              <div className="lps-toggle-text">
                <h4>Display Statistics</h4>
                <p>Show real-time student counts.</p>
              </div>
              <label className="lps-switch">
                <input type="checkbox" checked={settings.show_stats} onChange={(e) => setSettings({...settings, show_stats: e.target.checked})} />
                <span className="lps-slider"></span>
              </label>
            </div>
          </section>

          <section className="lps-card">
             <div className="lps-card-title" style={{ color: '#0ea5e9' }}><FileText size={24} /> About Summary</div>
             <textarea value={settings.about} onChange={(e) => setSettings({...settings, about: e.target.value})} className="lps-input" style={{ minHeight: '150px' }} />
          </section>
        </div>
      </div>
    </div>
  );
};

export default LandingPageSettings;
