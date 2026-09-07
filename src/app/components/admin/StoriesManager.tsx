'use client';
import { useState } from 'react';
import ComposedImage from '../public/ComposedImage';
import FocalPointPicker from './FocalPointPicker';

const S = {
  primary: '#000000', secondary: '#775927', surface: '#fef9f2', dim: '#ded9d3', onSurfaceVariant: '#4a4640',
  containerLow: '#f8f3ec', containerHigh: '#ece7e1', outlineVariant: '#ccc5bd',
  bodoni: { fontFamily: "'Bodoni Moda', serif" } as React.CSSProperties,
  label: { fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase' as const } as React.CSSProperties,
};

const inputCls = { width: '100%', border: `1px solid ${S.outlineVariant}`, backgroundColor: S.surface, padding: '0.625rem 0.75rem', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.875rem', color: '#1d1b18' };
const btnPrimary = { backgroundColor: S.primary, color: '#fff', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' as const, padding: '0.75rem 1.5rem', border: 'none', cursor: 'pointer' };
const btnGhost = { backgroundColor: 'transparent', color: S.onSurfaceVariant, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' as const, padding: '0.75rem 1.5rem', border: `1px solid ${S.dim}`, cursor: 'pointer' };

export default function StoriesManager({ stories, onRefresh }: { stories: any[], onRefresh: () => void }) {
  const [showCreate, setShowCreate] = useState(false);
  const [editingStory, setEditingStory] = useState<any | null>(null);
  
  const defaultSlot = { url: '', composition: { focalX: 50, focalY: 50, zoom: 1 } };
  
  const [form, setForm] = useState({
    title: '', subtitle: '', category: 'Weddings', eventDate: '2026',
    slot1: defaultSlot, slot2: defaultSlot, slot3: defaultSlot, slot4: defaultSlot
  });

  const [composingSlot, setComposingSlot] = useState<string | null>(null); // 'slot1', etc.
  const [compositionDraft, setCompositionDraft] = useState<any>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingStory ? 'PATCH' : 'POST';
    const url = editingStory ? `/api/stories/${editingStory._id}` : '/api/stories';
    
    await fetch(url, {
      method,
      body: JSON.stringify(form),
      headers: { 'Content-Type': 'application/json' },
    });
    
    setShowCreate(false);
    setEditingStory(null);
    onRefresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this story?')) return;
    await fetch(`/api/stories/${id}`, { method: 'DELETE' });
    onRefresh();
  };

  const openEditor = (story: any) => {
    setForm(story);
    setEditingStory(story);
    setShowCreate(true);
  };

  const saveComposition = () => {
    if (!composingSlot) return;
    setForm({ ...form, [composingSlot]: { ...(form as any)[composingSlot], composition: compositionDraft } });
    setComposingSlot(null);
  };

  if (showCreate) {
    return (
      <div style={{ backgroundColor: S.containerLow, border: `1px solid ${S.outlineVariant}`, padding: '2rem' }}>
        <h3 style={{ ...S.bodoni, fontSize: '1.5rem', color: S.primary, marginBottom: '1.5rem', marginTop: 0 }}>
          {editingStory ? 'Edit Story Mosaic' : 'Create Story Mosaic'}
        </h3>
        
        {/* Composition Modal */}
        {composingSlot && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 300, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ backgroundColor: S.surface, padding: '2rem', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
              <h4 style={{ ...S.bodoni, fontSize: '1.25rem', marginTop: 0 }}>Compose {(form as any)[composingSlot].url}</h4>
              <FocalPointPicker 
                src={(form as any)[composingSlot].url} 
                composition={compositionDraft} 
                onChange={setCompositionDraft} 
              />
              <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                <button type="button" style={btnPrimary} onClick={saveComposition}>Save Crop</button>
                <button type="button" style={btnGhost} onClick={() => setComposingSlot(null)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
            <div><label style={{ ...S.label, display: 'block', marginBottom: '0.375rem' }}>Client / Title *</label><input style={inputCls} required value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Rahul & Priya" /></div>
            <div><label style={{ ...S.label, display: 'block', marginBottom: '0.375rem' }}>Location / Subtitle</label><input style={inputCls} value={form.subtitle} onChange={e => setForm({...form, subtitle: e.target.value})} placeholder="Lake Como, Italy" /></div>
            <div><label style={{ ...S.label, display: 'block', marginBottom: '0.375rem' }}>Category</label><input style={inputCls} value={form.category} onChange={e => setForm({...form, category: e.target.value})} placeholder="Wedding" /></div>
            <div><label style={{ ...S.label, display: 'block', marginBottom: '0.375rem' }}>Year / Date</label><input style={inputCls} value={form.eventDate} onChange={e => setForm({...form, eventDate: e.target.value})} placeholder="2026" /></div>
          </div>

          <h4 style={{ ...S.label, color: S.secondary, marginBottom: '1rem' }}>Mosaic Grid Slots</h4>
          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.75rem', color: S.onSurfaceVariant, marginBottom: '1.5rem' }}>
            Enter the URLs for each slot. Slot 1 is the large hero image (21:9), Slot 2 is Landscape (4:3), Slot 3 is Portrait (3:4), Slot 4 is the wide banner (16:6).
          </p>

          <div style={{ display: 'grid', gap: '1.5rem', marginBottom: '2rem' }}>
            {['slot1', 'slot2', 'slot3', 'slot4'].map((slot, i) => (
              <div key={slot} style={{ display: 'flex', gap: '1rem', alignItems: 'center', backgroundColor: S.surface, padding: '1rem', border: `1px solid ${S.dim}` }}>
                <div style={{ width: '80px', height: '60px', backgroundColor: S.containerHigh }}>
                  {(form as any)[slot].url && <img src={(form as any)[slot].url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ ...S.label, display: 'block', marginBottom: '0.25rem' }}>Slot {i + 1} URL</label>
                  <input style={inputCls} required value={(form as any)[slot].url} onChange={e => setForm({...form, [slot]: { ...(form as any)[slot], url: e.target.value }})} placeholder="https://..." />
                </div>
                {(form as any)[slot].url && (
                  <button type="button" style={{ ...btnGhost, padding: '0.5rem 1rem' }} onClick={() => {
                    setCompositionDraft((form as any)[slot].composition);
                    setComposingSlot(slot);
                  }}>
                    ⊙ Compose
                  </button>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="submit" style={btnPrimary}>Save Story Mosaic</button>
            <button type="button" style={btnGhost} onClick={() => { setShowCreate(false); setEditingStory(null); }}>Cancel</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: `1px solid ${S.dim}`, paddingBottom: '1.5rem', marginBottom: '2rem' }}>
        <div>
          <span style={{ ...S.label, color: S.secondary }}>Editorial Mosaic</span>
          <h2 style={{ ...S.bodoni, fontSize: '2rem', fontWeight: 400, color: S.primary, marginTop: '0.25rem', marginBottom: 0 }}>Portfolio Stories</h2>
        </div>
        <button onClick={() => {
          setForm({ title: '', subtitle: '', category: 'Weddings', eventDate: '2026', slot1: defaultSlot, slot2: defaultSlot, slot3: defaultSlot, slot4: defaultSlot });
          setShowCreate(true);
        }} style={btnPrimary}>+ Create Story</button>
      </div>

      <div style={{ display: 'grid', gap: '2rem' }}>
        {stories.map(story => (
          <div key={story._id} style={{ border: `1px solid ${S.outlineVariant}`, padding: '1.5rem', backgroundColor: S.surface }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ ...S.bodoni, fontSize: '1.5rem', margin: 0 }}>{story.title}</h3>
                <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.75rem', color: S.secondary, margin: '0.25rem 0 0' }}>{story.category} · {story.subtitle} · {story.eventDate}</p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => openEditor(story)} style={btnGhost}>Edit</button>
                <button onClick={() => handleDelete(story._id)} style={{ ...btnGhost, color: '#ba1a1a', borderColor: '#ba1a1a' }}>Delete</button>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
              {[story.slot1, story.slot2, story.slot3, story.slot4].map((slot, i) => (
                <div key={i} style={{ aspectRatio: '1/1', position: 'relative', overflow: 'hidden', backgroundColor: S.containerHigh }}>
                   <ComposedImage src={slot.url} alt="Slot" composition={slot.composition} containerStyle={{ position: 'absolute', inset: 0, height: '100%', aspectRatio: undefined }} />
                </div>
              ))}
            </div>
          </div>
        ))}
        {stories.length === 0 && (
          <p style={{ color: S.onSurfaceVariant, textAlign: 'center', padding: '3rem' }}>No stories created yet.</p>
        )}
      </div>
    </div>
  );
}
