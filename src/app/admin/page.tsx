'use client';
import { useState, useEffect, useCallback } from 'react';
import BulkUploadDropzone from '../components/admin/BulkUploadDropzone';
import EventMediaManagerModal from '../components/admin/EventMediaManagerModal';
import FocalPointPicker from '../components/admin/FocalPointPicker';
import StoriesManager from '../components/admin/StoriesManager';

type Tab = 'overview' | 'events' | 'portfolio' | 'stories' | 'enquiries';

const S = {
  bodoni: { fontFamily: "'Bodoni Moda', serif" } as React.CSSProperties,
  jakarta: { fontFamily: "'Plus Jakarta Sans', sans-serif" } as React.CSSProperties,
  label: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: '0.6875rem',
    fontWeight: 600 as const,
    letterSpacing: '0.15em',
    textTransform: 'uppercase' as const,
  },
  primary: '#000000',
  secondary: '#775927',
  surface: '#fef9f2',
  bg: '#FAF8F5',
  containerLow: '#f8f3ec',
  containerHigh: '#ece7e1',
  dim: '#ded9d3',
  outlineVariant: '#ccc5bd',
  onSurfaceVariant: '#4a4640',
  onSurface: '#1d1b18',
};

interface EnquiryDoc {
  _id: string;
  fullName?: string;
  name?: string;
  phone?: string;
  email?: string;
  commissionNature?: string;
  eventType?: string;
  estimatedDate?: string;
  eventDate?: string;
  venue?: string;
  location?: string;
  status: string;
  createdAt: string;
}

interface EventDoc {
  _id: string;
  eventName: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  urlToken: string;
  visibilityStatus: string;
  pinHash?: string | null;
  downloadsEnabled?: boolean;
  viewCount?: number;
  mediaIds?: string[];
}

interface MediaDoc {
  _id: string;
  title?: string;
  subtitle?: string;
  url?: string;
  thumbnailUrl?: string;
  category?: string;
  mediaType?: string;
  isPublished?: boolean;
  isFeatured?: boolean;
  exif?: {
    camera?: string;
    lens?: string;
  };
}

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [events, setEvents] = useState<EventDoc[]>([]);
  const [portfolio, setPortfolio] = useState<MediaDoc[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [enquiries, setEnquiries] = useState<EnquiryDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showAddMedia, setShowAddMedia] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [selectedEventForMedia, setSelectedEventForMedia] = useState<EventDoc | null>(null);
  const [newEvent, setNewEvent] = useState({
    eventName: '', clientName: '', clientEmail: '', clientPhone: '',
    eventDate: '', venue: '', description: '', pin: '', visibilityStatus: 'published',
  });
  const [compositionItem, setCompositionItem] = useState<MediaDoc | null>(null);
  const [compositionDraft, setCompositionDraft] = useState<{ focalX: number; focalY: number; zoom: number } | null>(null);
  const [savingComposition, setSavingComposition] = useState(false);
  const [editingMedia, setEditingMedia] = useState<MediaDoc | null>(null);
  const [newMedia, setNewMedia] = useState({
    title: '', subtitle: '', category: 'Weddings', mediaType: 'image', url: '', thumbnailUrl: '', isFeatured: false,
  });
  const [actionMsg, setActionMsg] = useState('');
  const [pinInputs, setPinInputs] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [evRes, enRes, poRes, stRes] = await Promise.all([
        fetch('/api/events'),
        fetch('/api/enquiries'),
        fetch('/api/portfolio'),
        fetch('/api/stories'),
      ]);
      const [ev, en, po, st] = await Promise.all([evRes.json(), enRes.json(), poRes.json(), stRes.json()]);
      setEvents(ev.events || []);
      // Support both old schema (enquiries array) and paginated response
      setEnquiries(en.enquiries || []);
      setPortfolio(po.media || []);
      setStories(st.stories || []);
    } catch (err) {
      console.error('Failed to load admin data', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (selectedEventForMedia) {
      const refreshed = events.find(e => e._id === selectedEventForMedia._id);
      if (refreshed) setSelectedEventForMedia(refreshed);
    }
  }, [events, selectedEventForMedia]);

  async function createEvent(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/events', {
      method: 'POST',
      body: JSON.stringify(newEvent),
      headers: { 'Content-Type': 'application/json' },
    });
    const d = await res.json();
    if (d.success) {
      setActionMsg('Event created! Gallery link: /gallery/' + d.event.urlToken);
      setShowCreateEvent(false);
      setNewEvent({ eventName: '', clientName: '', clientEmail: '', clientPhone: '', eventDate: '', venue: '', description: '', pin: '', visibilityStatus: 'published' });
      load();
    } else {
      setActionMsg('Error: ' + d.error);
    }
  }

  async function toggleVisibility(id: string, current: string) {
    const next = current === 'hidden' ? 'published' : 'hidden';
    await fetch(`/api/events/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ visibilityStatus: next }),
      headers: { 'Content-Type': 'application/json' },
    });
    load();
  }

  async function updatePin(id: string) {
    const pin = pinInputs[id] || '';
    await fetch(`/api/events/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ pin }),
      headers: { 'Content-Type': 'application/json' },
    });
    setActionMsg('PIN updated.');
    load();
  }

  async function addMedia(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/portfolio', {
      method: 'POST',
      body: JSON.stringify({ ...newMedia, isPublished: true }),
      headers: { 'Content-Type': 'application/json' },
    });
    const d = await res.json();
    if (d.success) {
      setActionMsg('Media added!');
      setShowAddMedia(false);
      setNewMedia({ title: '', subtitle: '', category: 'Weddings', mediaType: 'image', url: '', thumbnailUrl: '', isFeatured: false });
      load();
    } else {
      setActionMsg('Error: ' + d.error);
    }
  }

  async function togglePublish(id: string, current: boolean) {
    await fetch(`/api/portfolio/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isPublished: !current }),
      headers: { 'Content-Type': 'application/json' },
    });
    load();
  }

  async function deleteMedia(id: string) {
    if (!confirm('Delete this media?')) return;
    await fetch(`/api/portfolio/${id}`, { method: 'DELETE' });
    load();
  }

  async function updateMediaMetadata(e: React.FormEvent) {
    e.preventDefault();
    if (!editingMedia) return;
    const res = await fetch(`/api/portfolio/${editingMedia._id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        title: editingMedia.title,
        subtitle: editingMedia.subtitle,
        category: editingMedia.category,
        exif: editingMedia.exif
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) {
      setActionMsg('Metadata updated.');
      setEditingMedia(null);
      load();
    } else {
      setActionMsg('Failed to update.');
    }
  }

  async function saveComposition(id: string) {
    if (!compositionDraft) return;
    setSavingComposition(true);
    await fetch(`/api/portfolio/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ composition: compositionDraft }),
      headers: { 'Content-Type': 'application/json' },
    });
    setSavingComposition(false);
    setCompositionItem(null);
    setCompositionDraft(null);
    setActionMsg('Composition saved! Changes are live on the website.');
    load();
  }

  const sidebarLinks: { key: Tab; label: string; icon: string }[] = [
    { key: 'overview', label: 'Overview', icon: '▣' },
    { key: 'events', label: 'Client Events', icon: '◷' },
    { key: 'stories', label: 'Stories Mosaic', icon: '◫' },
    { key: 'portfolio', label: 'Archive Grid', icon: '⊞' },
    { key: 'enquiries', label: 'Enquiries', icon: '✉' },
  ];

  const inputCls: React.CSSProperties = {
    width: '100%',
    border: '1px solid #ccc5bd',
    backgroundColor: '#fef9f2',
    padding: '0.625rem 0.75rem',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: '0.875rem',
    color: '#1d1b18',
    outline: 'none',
    boxSizing: 'border-box',
  };
  const btnPrimary: React.CSSProperties = {
    backgroundColor: S.primary,
    color: '#fff',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: '0.6875rem',
    fontWeight: 600,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    padding: '0.75rem 1.5rem',
    border: 'none',
    cursor: 'pointer',
  };
  const btnGhost: React.CSSProperties = {
    backgroundColor: 'transparent',
    color: S.primary,
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: '0.6875rem',
    fontWeight: 600,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    padding: '0.75rem 1.5rem',
    border: `1px solid ${S.primary}`,
    cursor: 'pointer',
  };

  const newEnquiries = enquiries.filter(e => e.status === 'new').length;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: S.bg, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 30, backgroundColor: 'rgba(0,0,0,0.4)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          width: '17rem',
          backgroundColor: S.surface,
          borderRight: `1px solid ${S.dim}`,
          position: 'fixed',
          top: 0,
          left: sidebarOpen ? 0 : '-17rem',
          height: '100vh',
          zIndex: 40,
          transition: 'left 0.25s ease',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflowY: 'auto',
        }}
        className="lg:!left-0"
      >
        <div>
          <div style={{ padding: '1.75rem 1.5rem', borderBottom: `1px solid ${S.dim}` }}>
            <h1 style={{ ...S.bodoni, fontSize: '1.25rem', fontWeight: 400, letterSpacing: '0.06em', color: S.primary, textTransform: 'uppercase', margin: 0 }}>
              Brother&apos;s Photography
            </h1>
            <p style={{ ...S.label, color: S.onSurfaceVariant, marginTop: '0.25rem', fontSize: '0.625rem' }}>
              Studio Admin Console
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem' }}>
              <span style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' }} />
              <span style={{ ...S.label, fontSize: '0.625rem', color: S.onSurfaceVariant }}>System Active</span>
            </div>
          </div>
          <nav style={{ padding: '1rem 0' }}>
            {sidebarLinks.map(l => (
              <button
                key={l.key}
                onClick={() => { setTab(l.key); setSidebarOpen(false); }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: tab === l.key ? S.containerLow : 'transparent',
                  borderLeft: tab === l.key ? `2px solid ${S.primary}` : '2px solid transparent',
                  borderTop: 'none', borderRight: 'none', borderBottom: 'none',
                  color: tab === l.key ? S.primary : S.onSurfaceVariant,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '0.875rem',
                  fontWeight: tab === l.key ? 600 : 400,
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>{l.icon}</span>
                {l.label}
                {l.key === 'enquiries' && newEnquiries > 0 && (
                  <span style={{ marginLeft: 'auto', backgroundColor: S.secondary, color: '#fff', borderRadius: '9999px', padding: '0.125rem 0.5rem', fontSize: '0.625rem', fontWeight: 600 }}>
                    {newEnquiries}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
        <div style={{ padding: '1.25rem 1.5rem', borderTop: `1px solid ${S.dim}` }}>
          <a href="/" style={{ ...S.label, color: S.onSurfaceVariant, fontSize: '0.625rem', textDecoration: 'none' }}>
            ← View Public Site
          </a>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, marginLeft: 0, transition: 'margin-left 0.25s ease' }} className="lg:!ml-[17rem]">

        {/* Top bar */}
        <header
          style={{
            backgroundColor: S.surface,
            borderBottom: `1px solid ${S.dim}`,
            padding: '0 2rem',
            height: '3.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 20,
          }}
        >
          <button
            className="lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ fontSize: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
            aria-label="Toggle sidebar"
          >
            ☰
          </button>
          <span style={{ ...S.label, color: S.onSurfaceVariant, fontSize: '0.625rem' }}>Studio Admin · v2.5.0</span>
          <span style={{ ...S.label, color: S.onSurfaceVariant, fontSize: '0.625rem' }}>Curator: Admin</span>
        </header>

        <main style={{ padding: '2rem', maxWidth: '1280px', margin: '0 auto' }}>

          {/* Action message banner */}
          {actionMsg && (
            <div style={{ backgroundColor: S.containerLow, border: `1px solid ${S.outlineVariant}`, padding: '0.75rem 1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.875rem', color: S.onSurface }}>{actionMsg}</span>
              <button onClick={() => setActionMsg('')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
            </div>
          )}

          {/* ── OVERVIEW ───────────────────────────────────────────────────── */}
          {tab === 'overview' && (
            <div>
              <div style={{ borderBottom: `1px solid ${S.dim}`, paddingBottom: '1.5rem', marginBottom: '2rem' }}>
                <span style={{ ...S.label, color: S.secondary, fontSize: '0.6875rem' }}>Executive Studio Cockpit</span>
                <h2 style={{ ...S.bodoni, fontSize: '2rem', fontWeight: 400, color: S.primary, marginTop: '0.5rem', marginBottom: 0 }}>
                  Dashboard Overview
                </h2>
              </div>

              {/* Stats grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                {([
                  ['Portfolio Items', portfolio.length, '⊞'],
                  ['Client Events', events.length, '◷'],
                  ['Active Galleries', events.filter(e => e.visibilityStatus !== 'hidden').length, '⊛'],
                  ['Enquiries', enquiries.length, '✉'],
                ] as [string, number, string][]).map(([label, val, icon]) => (
                  <div key={label} style={{ backgroundColor: S.surface, border: `1px solid ${S.dim}`, padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: S.onSurfaceVariant, marginBottom: '0.75rem' }}>
                      <span style={{ ...S.label, fontSize: '0.6875rem' }}>{label}</span>
                      <span style={{ fontSize: '1.125rem', color: S.secondary }}>{icon}</span>
                    </div>
                    <p style={{ ...S.bodoni, fontSize: '2.5rem', fontWeight: 400, color: S.primary, lineHeight: 1, margin: 0 }}>
                      {loading ? '…' : String(val)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Recent panels */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                <div style={{ backgroundColor: S.surface, border: `1px solid ${S.dim}`, padding: '1.5rem' }}>
                  <h3 style={{ ...S.bodoni, fontSize: '1.25rem', color: S.primary, marginBottom: '1rem', marginTop: 0 }}>Recent Enquiries</h3>
                  {enquiries.slice(0, 5).map((e) => (
                    <div key={e._id} style={{ borderBottom: `1px solid ${S.dim}`, paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                      <p style={{ fontWeight: 600, fontSize: '0.875rem', color: S.primary, margin: 0 }}>{e.fullName || e.name || '—'}</p>
                      <p style={{ fontSize: '0.75rem', color: S.onSurfaceVariant, margin: '0.125rem 0 0' }}>
                        {e.commissionNature || e.eventType || '—'} · {e.phone || '—'}
                      </p>
                    </div>
                  ))}
                  {enquiries.length === 0 && !loading && (
                    <p style={{ fontSize: '0.8125rem', color: S.onSurfaceVariant }}>No enquiries yet.</p>
                  )}
                </div>
                <div style={{ backgroundColor: S.surface, border: `1px solid ${S.dim}`, padding: '1.5rem' }}>
                  <h3 style={{ ...S.bodoni, fontSize: '1.25rem', color: S.primary, marginBottom: '1rem', marginTop: 0 }}>Recent Events</h3>
                  {events.slice(0, 5).map((ev) => (
                    <div key={ev._id} style={{ borderBottom: `1px solid ${S.dim}`, paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                      <p style={{ fontWeight: 600, fontSize: '0.875rem', color: S.primary, margin: 0 }}>{ev.eventName}</p>
                      <p style={{ fontSize: '0.75rem', color: S.onSurfaceVariant, margin: '0.125rem 0 0' }}>
                        {ev.clientName} ·{' '}
                        <span style={{ color: ev.visibilityStatus === 'hidden' ? '#ba1a1a' : '#22c55e' }}>
                          {ev.visibilityStatus}
                        </span>
                      </p>
                    </div>
                  ))}
                  {events.length === 0 && !loading && (
                    <p style={{ fontSize: '0.8125rem', color: S.onSurfaceVariant }}>No events yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── CLIENT EVENTS ──────────────────────────────────────────────── */}
          {tab === 'events' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: `1px solid ${S.dim}`, paddingBottom: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <span style={{ ...S.label, color: S.secondary }}>Archive Control Suite</span>
                  <h2 style={{ ...S.bodoni, fontSize: '2rem', fontWeight: 400, color: S.primary, marginTop: '0.25rem', marginBottom: 0 }}>
                    Client Events &amp; Galleries
                  </h2>
                </div>
                <button onClick={() => setShowCreateEvent(v => !v)} style={btnPrimary}>
                  + Create New Event
                </button>
              </div>

              {/* Create event form */}
              {showCreateEvent && (
                <form onSubmit={createEvent} style={{ backgroundColor: S.containerLow, border: `1px solid ${S.outlineVariant}`, padding: '2rem', marginBottom: '2rem' }}>
                  <h3 style={{ ...S.bodoni, fontSize: '1.25rem', color: S.primary, marginBottom: '1.5rem', marginTop: 0 }}>
                    Create New Client Event
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                    {([
                      ['Event Name', 'eventName', 'text', 'Rahul & Priya Wedding', true],
                      ['Client Name', 'clientName', 'text', 'Rahul Sharma', true],
                      ['Client Email', 'clientEmail', 'email', 'client@email.com', false],
                      ['Client Phone', 'clientPhone', 'tel', '+91 99999 99999', false],
                      ['Event Date', 'eventDate', 'date', '', true],
                      ['Venue', 'venue', 'text', 'Pune, Maharashtra', false],
                    ] as [string, keyof typeof newEvent, string, string, boolean][]).map(([label, key, type, placeholder, required]) => (
                      <div key={key}>
                        <label style={{ ...S.label, color: S.primary, display: 'block', marginBottom: '0.375rem', fontSize: '0.6875rem' }}>
                          {label}{required ? ' *' : ''}
                        </label>
                        <input
                          style={inputCls}
                          type={type}
                          placeholder={placeholder}
                          value={newEvent[key]}
                          onChange={ev => setNewEvent(p => ({ ...p, [key]: ev.target.value }))}
                          required={required}
                        />
                      </div>
                    ))}
                    <div>
                      <label style={{ ...S.label, color: S.primary, display: 'block', marginBottom: '0.375rem', fontSize: '0.6875rem' }}>
                        4-Digit PIN (optional)
                      </label>
                      <input
                        style={inputCls}
                        type="text"
                        maxLength={4}
                        placeholder="e.g. 2025"
                        value={newEvent.pin}
                        onChange={ev => setNewEvent(p => ({ ...p, pin: ev.target.value.replace(/\D/g, '') }))}
                      />
                    </div>
                    <div>
                      <label style={{ ...S.label, color: S.primary, display: 'block', marginBottom: '0.375rem', fontSize: '0.6875rem' }}>
                        Visibility
                      </label>
                      <select
                        style={inputCls}
                        value={newEvent.visibilityStatus}
                        onChange={ev => setNewEvent(p => ({ ...p, visibilityStatus: ev.target.value }))}
                      >
                        <option value="published">Published (Active)</option>
                        <option value="private">Private</option>
                        <option value="hidden">Hidden (Disabled)</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ marginTop: '1.25rem' }}>
                    <label style={{ ...S.label, color: S.primary, display: 'block', marginBottom: '0.375rem', fontSize: '0.6875rem' }}>
                      Description
                    </label>
                    <textarea
                      style={{ ...inputCls, resize: 'none' }}
                      rows={2}
                      placeholder="Event notes..."
                      value={newEvent.description}
                      onChange={ev => setNewEvent(p => ({ ...p, description: ev.target.value }))}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                    <button type="submit" style={btnPrimary}>Create Gallery</button>
                    <button type="button" onClick={() => setShowCreateEvent(false)} style={btnGhost}>Cancel</button>
                  </div>
                </form>
              )}

              {/* Events list */}
              {loading ? (
                <p style={{ color: S.onSurfaceVariant }}>Loading…</p>
              ) : events.map((ev) => (
                <div key={ev._id} style={{ backgroundColor: S.surface, border: `1px solid ${S.dim}`, padding: '1.5rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                        <span style={{ ...S.label, color: S.onSurfaceVariant, fontSize: '0.625rem', backgroundColor: S.containerHigh, padding: '0.25rem 0.5rem' }}>
                          REF: {ev._id.slice(-8).toUpperCase()}
                        </span>
                        <span style={{ ...S.label, fontSize: '0.625rem', padding: '0.25rem 0.625rem', border: `1px solid ${ev.visibilityStatus === 'hidden' ? '#ba1a1a' : '#22c55e'}`, color: ev.visibilityStatus === 'hidden' ? '#ba1a1a' : '#22c55e' }}>
                          {ev.visibilityStatus === 'hidden' ? '● Disabled' : '● Active'}
                        </span>
                        <span style={{ ...S.label, fontSize: '0.625rem', padding: '0.25rem 0.625rem', backgroundColor: S.containerHigh, color: S.primary }}>
                          📸 {ev.mediaIds?.length ?? 0} {((ev.mediaIds?.length ?? 0) === 1) ? 'Item' : 'Items'}
                        </span>
                      </div>
                      <h3 style={{ ...S.bodoni, fontSize: '1.25rem', color: S.primary, margin: 0 }}>{ev.eventName}</h3>
                      <p style={{ fontSize: '0.8125rem', color: S.onSurfaceVariant, marginTop: '0.25rem', marginBottom: 0 }}>
                        {ev.clientName}
                        {ev.clientEmail ? ` · ${ev.clientEmail}` : ''}
                        {ev.clientPhone ? ` · ${ev.clientPhone}` : ''}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedEventForMedia(ev)}
                        style={{ ...btnPrimary, padding: '0.5rem 1rem', fontSize: '0.625rem', display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}
                      >
                        <span>📷</span> Manage Media ({ev.mediaIds?.length ?? 0})
                      </button>
                      <button
                        onClick={() => toggleVisibility(ev._id, ev.visibilityStatus)}
                        style={{ ...btnGhost, padding: '0.5rem 1rem', fontSize: '0.625rem' }}
                      >
                        {ev.visibilityStatus === 'hidden' ? 'Enable Gallery' : 'Disable Gallery'}
                      </button>
                      <a
                        href={`/gallery/${ev.urlToken}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ ...btnGhost, padding: '0.5rem 1rem', fontSize: '0.625rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                      >
                        View Gallery ↗
                      </a>
                    </div>
                  </div>

                  {/* Gallery URL strip */}
                  <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: S.containerLow, border: `1px solid ${S.outlineVariant}`, display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ ...S.label, fontSize: '0.625rem', color: S.onSurfaceVariant }}>Gallery URL:</span>
                    <code style={{ fontSize: '0.75rem', color: S.primary, flex: 1, wordBreak: 'break-all' }}>
                      /gallery/{ev.urlToken}
                    </code>
                    <button
                      onClick={() =>
                        navigator.clipboard
                          .writeText(`${window.location.origin}/gallery/${ev.urlToken}`)
                          .then(() => setActionMsg('Link copied to clipboard!'))
                      }
                      style={{ ...btnGhost, padding: '0.375rem 0.75rem', fontSize: '0.625rem' }}
                    >
                      Copy
                    </button>
                  </div>

                  {/* PIN management */}
                  <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ ...S.label, fontSize: '0.625rem', color: S.onSurfaceVariant }}>Set PIN:</span>
                    <input
                      type="text"
                      maxLength={4}
                      placeholder="4 digits"
                      value={pinInputs[ev._id] || ''}
                      onChange={e => setPinInputs(p => ({ ...p, [ev._id]: e.target.value.replace(/\D/g, '') }))}
                      style={{ ...inputCls, width: '6rem', padding: '0.375rem 0.5rem' }}
                    />
                    <button onClick={() => updatePin(ev._id)} style={{ ...btnPrimary, padding: '0.375rem 0.75rem', fontSize: '0.625rem' }}>
                      Update PIN
                    </button>
                    <span style={{ fontSize: '0.75rem', color: S.secondary }}>
                      {ev.pinHash ? '🔒 PIN set' : '🔓 No PIN'}
                    </span>
                  </div>
                </div>
              ))}
              {!loading && events.length === 0 && (
                <p style={{ color: S.onSurfaceVariant, textAlign: 'center', padding: '3rem' }}>
                  No events yet. Create your first client event above.
                </p>
              )}

              {/* Event Media Manager Modal */}
              {selectedEventForMedia && (
                <EventMediaManagerModal
                  event={selectedEventForMedia}
                  isOpen={Boolean(selectedEventForMedia)}
                  onClose={() => setSelectedEventForMedia(null)}
                  onMediaChanged={() => load()}
                />
              )}
            </div>
          )}

          {/* ── STORIES MOSAIC ──────────────────────────────────────────────── */}
          {tab === 'stories' && (
            <StoriesManager stories={stories} onRefresh={load} />
          )}

          {/* ── PORTFOLIO ──────────────────────────────────────────────────── */}
          {tab === 'portfolio' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: `1px solid ${S.dim}`, paddingBottom: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <span style={{ ...S.label, color: S.secondary }}>Portfolio Manager</span>
                  <h2 style={{ ...S.bodoni, fontSize: '2rem', fontWeight: 400, color: S.primary, marginTop: '0.25rem', marginBottom: 0 }}>
                    Portfolio Media
                  </h2>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button onClick={() => setShowBulkUpload(v => !v)} style={btnPrimary}>⬆ Bulk Upload</button>
                  <button onClick={() => setShowAddMedia(v => !v)} style={{ ...btnPrimary, backgroundColor: 'transparent', color: S.primary, border: `1px solid ${S.primary}` }}>+ Add by URL</button>
                </div>
              </div>

              {showAddMedia && (
                <form onSubmit={addMedia} style={{ backgroundColor: S.containerLow, border: `1px solid ${S.outlineVariant}`, padding: '2rem', marginBottom: '2rem' }}>
                  <h3 style={{ ...S.bodoni, fontSize: '1.25rem', color: S.primary, marginBottom: '1.5rem', marginTop: 0 }}>
                    Add Portfolio Media
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                    <div>
                      <label style={{ ...S.label, color: S.primary, display: 'block', marginBottom: '0.375rem', fontSize: '0.6875rem' }}>Title *</label>
                      <input style={inputCls} value={newMedia.title} onChange={e => setNewMedia(p => ({ ...p, title: e.target.value }))} required placeholder="Rahul & Priya — Wedding" />
                    </div>
                    <div>
                      <label style={{ ...S.label, color: S.primary, display: 'block', marginBottom: '0.375rem', fontSize: '0.6875rem' }}>Description / Subtitle</label>
                      <input style={inputCls} value={newMedia.subtitle} onChange={e => setNewMedia(p => ({ ...p, subtitle: e.target.value }))} placeholder="Lake Como, Italy" />
                    </div>
                    <div>
                      <label style={{ ...S.label, color: S.primary, display: 'block', marginBottom: '0.375rem', fontSize: '0.6875rem' }}>Category</label>
                      <select style={inputCls} value={newMedia.category} onChange={e => setNewMedia(p => ({ ...p, category: e.target.value }))}>
                        {['Weddings', 'Pre-Wedding', 'Engagements', 'Birthdays', 'Events', 'Portraits', 'Films', 'Albums'].map(c => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ ...S.label, color: S.primary, display: 'block', marginBottom: '0.375rem', fontSize: '0.6875rem' }}>Type</label>
                      <select style={inputCls} value={newMedia.mediaType} onChange={e => setNewMedia(p => ({ ...p, mediaType: e.target.value }))}>
                        <option value="image">Image</option>
                        <option value="video">Video</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ ...S.label, color: S.primary, display: 'block', marginBottom: '0.375rem', fontSize: '0.6875rem' }}>Media URL *</label>
                      <input style={inputCls} value={newMedia.url} onChange={e => setNewMedia(p => ({ ...p, url: e.target.value }))} required placeholder="https://…" />
                    </div>
                    <div>
                      <label style={{ ...S.label, color: S.primary, display: 'block', marginBottom: '0.375rem', fontSize: '0.6875rem' }}>Thumbnail URL</label>
                      <input style={inputCls} value={newMedia.thumbnailUrl} onChange={e => setNewMedia(p => ({ ...p, thumbnailUrl: e.target.value }))} placeholder="https://… (optional)" />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingTop: '1.5rem' }}>
                      <input
                        type="checkbox"
                        id="featured"
                        checked={newMedia.isFeatured}
                        onChange={e => setNewMedia(p => ({ ...p, isFeatured: e.target.checked }))}
                        style={{ width: '1rem', height: '1rem', cursor: 'pointer' }}
                      />
                      <label htmlFor="featured" style={{ ...S.label, color: S.primary, fontSize: '0.6875rem', cursor: 'pointer' }}>
                        Mark as Featured
                      </label>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                    <button type="submit" style={btnPrimary}>Add to Portfolio</button>
                    <button type="button" onClick={() => setShowAddMedia(false)} style={btnGhost}>Cancel</button>
                  </div>
                </form>
              )}

              {showBulkUpload && (
                <div style={{ marginBottom: '2rem' }}>
                  <BulkUploadDropzone
                    endpoint="/api/portfolio/bulk-upload"
                    onComplete={(count) => {
                      setActionMsg(`${count} file${count !== 1 ? 's' : ''} uploaded to portfolio!`);
                      setShowBulkUpload(false);
                      load();
                    }}
                    onClose={() => setShowBulkUpload(false)}
                  />
                </div>
              )}

              {/* Media grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
                {portfolio.map((item) => (
                  <div key={item._id} style={{ backgroundColor: S.surface, border: `1px solid ${S.dim}`, overflow: 'hidden' }}>
                    <div style={{ aspectRatio: '4/3', overflow: 'hidden', backgroundColor: S.containerHigh, position: 'relative' }}>
                      {item.url && (
                        <img
                          src={item.thumbnailUrl || item.url}
                          alt={item.title || 'Portfolio item'}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                      )}
                      {!item.isPublished && (
                        <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', backgroundColor: 'rgba(0,0,0,0.7)', color: '#fff', padding: '0.25rem 0.5rem', fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.1em' }}>
                          DRAFT
                        </div>
                      )}
                    </div>
                    <div style={{ padding: '0.875rem' }}>
                      <p style={{ fontWeight: 600, fontSize: '0.875rem', color: S.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                        {item.title || '(untitled)'}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: S.secondary, marginTop: '0.25rem', marginBottom: 0 }}>
                        {item.category} · {item.mediaType}
                      </p>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                        <button
                          onClick={() => {
                            setCompositionItem(item);
                            setCompositionDraft((item as any).composition || { focalX: 50, focalY: 50, zoom: 1 });
                          }}
                          style={{ ...btnPrimary, padding: '0.375rem 0.75rem', fontSize: '0.625rem', flex: 1, backgroundColor: S.secondary }}
                        >
                          ⊙ Compose
                        </button>
                        <button
                          onClick={() => togglePublish(item._id, Boolean(item.isPublished))}
                          style={{ ...btnGhost, padding: '0.375rem 0.5rem', fontSize: '0.625rem' }}
                        >
                          {item.isPublished ? 'Hide' : 'Show'}
                        </button>
                        <button
                          onClick={() => setEditingMedia({ ...item })}
                          style={{ ...btnGhost, padding: '0.375rem 0.5rem', fontSize: '0.625rem' }}
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => deleteMedia(item._id)}
                          style={{ ...btnGhost, padding: '0.375rem 0.5rem', fontSize: '0.625rem', color: '#ba1a1a', borderColor: '#ba1a1a' }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {!loading && portfolio.length === 0 && (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: S.onSurfaceVariant }}>
                    No media yet. Add your first portfolio item.
                  </div>
                )}
              </div>

              {/* ── METADATA EDITOR MODAL ── */}
              {editingMedia && (
                <div
                  style={{
                    position: 'fixed', inset: 0, zIndex: 300,
                    backgroundColor: 'rgba(0,0,0,0.55)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                  onClick={() => setEditingMedia(null)}
                >
                  <div
                    style={{
                      width: '100%', maxWidth: '480px',
                      backgroundColor: S.surface,
                      border: `1px solid ${S.dim}`,
                      padding: '2rem',
                    }}
                    onClick={e => e.stopPropagation()}
                  >
                    <h3 style={{ ...S.bodoni, fontSize: '1.25rem', color: S.primary, marginBottom: '1.5rem', marginTop: 0 }}>
                      Edit Metadata
                    </h3>
                    <form onSubmit={updateMediaMetadata}>
                      <div style={{ display: 'grid', gap: '1.25rem', marginBottom: '2rem' }}>
                        <div>
                          <label style={{ ...S.label, color: S.primary, display: 'block', marginBottom: '0.375rem' }}>Title *</label>
                          <input style={inputCls} required value={editingMedia.title} onChange={e => setEditingMedia({ ...editingMedia, title: e.target.value })} />
                        </div>
                        <div>
                          <label style={{ ...S.label, color: S.primary, display: 'block', marginBottom: '0.375rem' }}>Description / Subtitle</label>
                          <input style={inputCls} value={editingMedia.subtitle || ''} onChange={e => setEditingMedia({ ...editingMedia, subtitle: e.target.value })} />
                        </div>
                        <div>
                          <label style={{ ...S.label, color: S.primary, display: 'block', marginBottom: '0.375rem' }}>Category</label>
                          <select style={inputCls} value={editingMedia.category} onChange={e => setEditingMedia({ ...editingMedia, category: e.target.value })}>
                            {['Weddings', 'Pre-Wedding', 'Engagements', 'Birthdays', 'Events', 'Portraits', 'Films', 'Albums'].map(c => (
                              <option key={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label style={{ ...S.label, color: S.primary, display: 'block', marginBottom: '0.375rem' }}>Camera (EXIF)</label>
                          <input style={inputCls} placeholder="e.g. Leica M11" value={editingMedia.exif?.camera || ''} onChange={e => setEditingMedia({ ...editingMedia, exif: { ...editingMedia.exif, camera: e.target.value } })} />
                        </div>
                        <div>
                          <label style={{ ...S.label, color: S.primary, display: 'block', marginBottom: '0.375rem' }}>Lens (EXIF)</label>
                          <input style={inputCls} placeholder="e.g. 35mm f/1.4" value={editingMedia.exif?.lens || ''} onChange={e => setEditingMedia({ ...editingMedia, exif: { ...editingMedia.exif, lens: e.target.value } })} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <button type="submit" style={btnPrimary}>Save Changes</button>
                        <button type="button" onClick={() => setEditingMedia(null)} style={btnGhost}>Cancel</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* ── COMPOSITION EDITOR MODAL ── */}
              {compositionItem && compositionItem.url && (
                <div
                  style={{
                    position: 'fixed', inset: 0, zIndex: 200,
                    backgroundColor: 'rgba(0,0,0,0.55)',
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
                  }}
                  onClick={() => { setCompositionItem(null); setCompositionDraft(null); }}
                >
                  <div
                    style={{
                      width: '100%', maxWidth: '680px', height: '100vh',
                      backgroundColor: S.surface,
                      borderLeft: `1px solid ${S.dim}`,
                      overflowY: 'auto',
                      padding: '2rem',
                      display: 'flex', flexDirection: 'column', gap: '1.5rem',
                    }}
                    onClick={e => e.stopPropagation()}
                  >
                    {/* Drawer header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span style={{ ...S.label, color: S.secondary }}>Image Composition Editor</span>
                        <h2 style={{ ...S.bodoni, fontSize: '1.5rem', fontWeight: 400, color: S.primary, marginTop: '0.25rem', marginBottom: 0 }}>
                          {compositionItem.title || '(untitled)'}
                        </h2>
                        <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.75rem', color: S.onSurfaceVariant, marginTop: '0.25rem' }}>
                          Set the focal point and zoom — previews below show exactly what visitors see on each page layout.
                        </p>
                      </div>
                      <button
                        onClick={() => { setCompositionItem(null); setCompositionDraft(null); }}
                        style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: S.onSurfaceVariant, lineHeight: 1, padding: '0.25rem', flexShrink: 0 }}
                      >
                        ✕
                      </button>
                    </div>

                    {/* Focal Point Picker */}
                    <FocalPointPicker
                      src={compositionItem.url}
                      composition={compositionDraft}
                      onChange={setCompositionDraft}
                    />

                    {/* Save button */}
                    <div style={{ position: 'sticky', bottom: 0, backgroundColor: S.surface, paddingTop: '1rem', borderTop: `1px solid ${S.dim}`, display: 'flex', gap: '0.75rem' }}>
                      <button
                        onClick={() => saveComposition(compositionItem._id)}
                        disabled={savingComposition}
                        style={{ ...btnPrimary, flex: 1, backgroundColor: savingComposition ? S.onSurfaceVariant : S.secondary }}
                      >
                        {savingComposition ? 'Saving…' : '✓ Save Composition — Go Live'}
                      </button>
                      <button
                        onClick={() => { setCompositionItem(null); setCompositionDraft(null); }}
                        style={{ ...btnGhost, padding: '0.75rem 1.25rem' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── ENQUIRIES ─────────────────────────────────────────────────── */}
          {tab === 'enquiries' && (
            <div>
              <div style={{ borderBottom: `1px solid ${S.dim}`, paddingBottom: '1.5rem', marginBottom: '2rem' }}>
                <span style={{ ...S.label, color: S.secondary }}>Archival Inquiries</span>
                <h2 style={{ ...S.bodoni, fontSize: '2rem', fontWeight: 400, color: S.primary, marginTop: '0.25rem', marginBottom: 0 }}>
                  All Enquiries
                </h2>
              </div>

              {loading ? (
                <p style={{ color: S.onSurfaceVariant }}>Loading…</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    <thead>
                      <tr style={{ backgroundColor: S.containerLow, borderBottom: `1px solid ${S.dim}` }}>
                        {['Name', 'Phone', 'Commission / Event', 'Date', 'Venue / Location', 'Status', 'Submitted'].map(h => (
                          <th key={h} style={{ ...S.label, padding: '0.75rem 1rem', textAlign: 'left', color: S.onSurfaceVariant, fontSize: '0.625rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {enquiries.map((e) => (
                        <tr
                          key={e._id}
                          style={{ borderBottom: `1px solid ${S.dim}`, backgroundColor: e.status === 'new' ? 'rgba(119,89,39,0.04)' : 'transparent' }}
                        >
                          <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem', fontWeight: 600, color: S.primary }}>
                            {e.fullName || e.name || '—'}
                          </td>
                          <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem', color: S.onSurfaceVariant }}>{e.phone || '—'}</td>
                          <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem', color: S.onSurfaceVariant }}>
                            {e.commissionNature || e.eventType || '—'}
                          </td>
                          <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem', color: S.onSurfaceVariant }}>
                            {(e.estimatedDate || e.eventDate)
                              ? new Date(e.estimatedDate || e.eventDate!).toLocaleDateString('en-IN')
                              : '—'}
                          </td>
                          <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem', color: S.onSurfaceVariant }}>
                            {e.venue || e.location || '—'}
                          </td>
                          <td style={{ padding: '0.875rem 1rem' }}>
                            <span style={{
                              ...S.label,
                              fontSize: '0.625rem',
                              padding: '0.25rem 0.625rem',
                              borderRadius: '9999px',
                              backgroundColor: e.status === 'new' ? '#fff3e0' : '#f0f0f0',
                              color: e.status === 'new' ? '#e65100' : S.onSurfaceVariant,
                              border: `1px solid ${e.status === 'new' ? '#ffcc02' : S.outlineVariant}`,
                            }}>
                              {e.status || 'new'}
                            </span>
                          </td>
                          <td style={{ padding: '0.875rem 1rem', fontSize: '0.75rem', color: S.onSurfaceVariant, whiteSpace: 'nowrap' }}>
                            {new Date(e.createdAt).toLocaleDateString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {enquiries.length === 0 && (
                    <p style={{ textAlign: 'center', padding: '3rem', color: S.onSurfaceVariant }}>No enquiries yet.</p>
                  )}
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
