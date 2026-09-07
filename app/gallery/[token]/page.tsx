'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

type GalleryMeta = {
  eventName: string; clientName: string; eventDate: string;
  venue: string; hasPin: boolean; mediaCount: number;
  visibilityStatus: string; downloadsEnabled: boolean;
};
type MediaItem = { _id: string; url: string; mediaType: 'image' | 'video'; caption?: string; thumbnailUrl?: string; };
type GalleryData = { eventName: string; clientName: string; eventDate: string; venue: string; media: MediaItem[]; downloadsEnabled: boolean; };

export default function GalleryPage() {
  const { token } = useParams<{ token: string }>();
  const [meta, setMeta] = useState<GalleryMeta | null>(null);
  const [gallery, setGallery] = useState<GalleryData | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [phase, setPhase] = useState<'loading' | 'pin' | 'open' | 'error'>('loading');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all');
  const [submitting, setSubmitting] = useState(false);
  const baseFont = "'Plus Jakarta Sans', system-ui, sans-serif";
  const displayFont = "'Bodoni Moda', Georgia, serif";

  async function openGallery(pinValue: string) {
    setSubmitting(true); setError('');
    try {
      const res = await fetch(`/api/gallery/${token}`, { method: 'POST', body: JSON.stringify({ pin: pinValue }), headers: { 'Content-Type': 'application/json' } });
      const d = await res.json();
      if (res.ok) { setGallery(d); setPhase('open'); }
      else { setError(d.error || 'Incorrect PIN.'); setSubmitting(false); }
    } catch { setError('Network error.'); setSubmitting(false); }
  }

  useEffect(() => {
    if (!token) return;
    fetch(`/api/gallery/${token}`).then(r => r.json()).then(d => {
      if (d.error) { setError(d.error); setPhase('error'); return; }
      setMeta(d);
      if (d.hasPin) setPhase('pin');
      else openGallery('');
    }).catch(() => { setError('Failed to load gallery.'); setPhase('error'); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const globalStyles = (
    <style dangerouslySetInnerHTML={{__html: `
      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(15px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `}} />
  );

  if (phase === 'loading') return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAF8F5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: baseFont }}>
      {globalStyles}
      <p style={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#7b766f' }}>Loading Gallery…</p>
    </div>
  );

  if (phase === 'error') return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAF8F5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center', fontFamily: baseFont }}>
      <h1 style={{ fontFamily: displayFont, fontSize: '2rem', fontWeight: 400, color: '#000', marginBottom: '0.75rem' }}>Gallery Not Available</h1>
      <p style={{ fontSize: '0.9375rem', color: '#4a4640', lineHeight: 1.65 }}>{error}</p>
      <Link href="/" style={{ marginTop: '2rem', fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#775927', textDecoration: 'none' }}>← Back to Website</Link>
    </div>
  );

  if (phase === 'pin') return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAF8F5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', fontFamily: baseFont }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <Link href="/" style={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#7b766f', textDecoration: 'none', display: 'block', marginBottom: '1rem' }}>Brother&apos;s Photography</Link>
        {meta && (<>
          <h1 style={{ fontFamily: displayFont, fontSize: 'clamp(1.75rem,5vw,2.5rem)', fontWeight: 400, color: '#000', lineHeight: 1.15 }}>{meta.clientName}</h1>
          <p style={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#775927', marginTop: '0.5rem' }}>{meta.eventName}</p>
          {meta.eventDate && <p style={{ fontSize: '0.8125rem', color: '#7b766f', marginTop: '0.375rem' }}>{new Date(meta.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}{meta.venue ? ' · ' + meta.venue : ''}</p>}
        </>)}
      </div>
      <div style={{ backgroundColor: '#fef9f2', border: '1px solid #ccc5bd', padding: '2.5rem', maxWidth: '22rem', width: '100%', textAlign: 'center' }}>
        <p style={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#4a4640', marginBottom: '1.75rem' }}>Enter Gallery PIN</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {[0,1,2,3].map(i => (
            <input key={i} id={`pin-${i}`} type="text" inputMode="numeric" maxLength={1} value={pin[i] || ''}
              style={{ width: '3rem', height: '3.5rem', textAlign: 'center', border: '1px solid #ccc5bd', backgroundColor: '#fff', fontFamily: displayFont, fontSize: '1.5rem', fontWeight: 500, color: '#000', outline: 'none' }}
              onChange={e => {
                const v = e.target.value.replace(/\D/g,'');
                const arr = (pin.padEnd(4,' ')).split(''); arr[i] = v[v.length-1] || '';
                const np = arr.join('').trimEnd();
                setPin(np.slice(0,4));
                if (v && i < 3) document.getElementById(`pin-${i+1}`)?.focus();
              }}
              onKeyDown={e => {
                if (e.key === 'Backspace' && !pin[i] && i > 0) document.getElementById(`pin-${i-1}`)?.focus();
                if (e.key === 'Enter' && pin.length === 4) openGallery(pin);
              }}
            />
          ))}
        </div>
        {error && <p style={{ color: '#ba1a1a', fontSize: '0.8125rem', marginBottom: '1rem' }}>{error}</p>}
        <button onClick={() => openGallery(pin)} disabled={pin.length < 4 || submitting}
          style={{ width: '100%', backgroundColor: pin.length < 4 ? '#ded9d3' : '#000000', color: '#ffffff', fontFamily: baseFont, fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', padding: '0.875rem', border: 'none', cursor: pin.length < 4 ? 'not-allowed' : 'pointer' }}>
          {submitting ? 'Verifying…' : 'View My Gallery'}
        </button>
        <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #e7e2db' }}>
          <a href="https://wa.me/919999999999" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: '#775927', textDecoration: 'none' }}>Need help? Contact via WhatsApp →</a>
        </div>
      </div>
    </div>
  );

  if (phase === 'open' && gallery) {
    const photos = gallery.media.filter(m => m.mediaType === 'image');
    const videos = gallery.media.filter(m => m.mediaType === 'video');
    const items = gallery.media.filter(m => filter === 'all' || m.mediaType === filter);
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#FAF8F5', fontFamily: baseFont }}>
        {globalStyles}
        <header style={{ backgroundColor: '#fef9f2', borderBottom: '1px solid #ccc5bd', padding: '2rem 1.25rem', textAlign: 'center' }}>
          <Link href="/" style={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#7b766f', textDecoration: 'none', display: 'block', marginBottom: '1rem' }}>Brother&apos;s Photography</Link>
          <h1 style={{ fontFamily: displayFont, fontSize: 'clamp(1.75rem,5vw,3rem)', fontWeight: 400, color: '#000', lineHeight: 1.15 }}>{gallery.clientName}</h1>
          <p style={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#775927', marginTop: '0.5rem' }}>{gallery.eventName}</p>
          {gallery.eventDate && <p style={{ fontSize: '0.8125rem', color: '#7b766f', marginTop: '0.375rem' }}>{new Date(gallery.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}{gallery.venue ? ' · ' + gallery.venue : ''}</p>}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            {[[String(gallery.media.length),'Total'],[String(photos.length),'Photos'],[String(videos.length),'Videos']].map(([n,l]) => (
              <div key={l} style={{ backgroundColor: '#f8f3ec', border: '1px solid #e7e2db', padding: '0.5rem 1rem', textAlign: 'center' }}>
                <p style={{ fontFamily: displayFont, fontSize: '1.25rem', fontWeight: 400, color: '#000', lineHeight: 1 }}>{n}</p>
                <p style={{ fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7b766f', marginTop: '0.25rem' }}>{l}</p>
              </div>
            ))}
          </div>
        </header>
        <div style={{ backgroundColor: '#fef9f2', borderBottom: '1px solid #e7e2db', padding: '0.75rem 1.25rem', display: 'flex', justifyContent: 'center', gap: '0.5rem', position: 'sticky', top: 0, zIndex: 10 }}>
          {(['all','image','video'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.375rem 1rem', borderRadius: '9999px', border: '1px solid #ccc5bd', backgroundColor: filter===f?'#000':'#f8f3ec', color: filter===f?'#fff':'#4a4640', cursor: 'pointer' }}>
              {f==='all'?`All (${gallery.media.length})`:f==='image'?`📷 Photos (${photos.length})`:`🎥 Videos (${videos.length})`}
            </button>
          ))}
        </div>
        <div style={{ padding: '2rem 1.25rem', maxWidth: '1440px', margin: '0 auto' }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
              <p style={{ fontFamily: displayFont, fontSize: '1.75rem', color: '#000' }}>No media yet</p>
              <p style={{ fontSize: '0.875rem', color: '#7b766f', marginTop: '0.75rem' }}>Your photographer hasn&apos;t added media yet. Check back soon!</p>
            </div>
          ) : (
            <div style={{ columns: 'auto 280px', gap: '1rem' }}>
              {items.map((item, idx) => (
                <div 
                  key={item._id} 
                  className="group relative overflow-hidden cursor-pointer"
                  style={{ 
                    breakInside: 'avoid', 
                    marginBottom: '1rem', 
                    backgroundColor: '#f2ede7',
                    borderRadius: '4px',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                    animation: `fadeInUp 0.6s ease-out forwards ${Math.min(idx * 0.05, 1.5)}s`,
                    opacity: 0,
                    transform: 'translateY(15px)'
                  }} 
                  onClick={() => setLightboxIndex(idx)}
                >
                  <div style={{ overflow: 'hidden' }}>
                    {item.mediaType === 'image' ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={item.thumbnailUrl || item.url} 
                        alt={item.caption || 'Gallery photo'} 
                        className="w-full block object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]" 
                        loading="lazy" 
                      />
                    ) : (
                      <div className="w-full aspect-video bg-[#1d1b18] flex items-center justify-center relative transition-transform duration-700 ease-out group-hover:scale-[1.03]">
                        {item.thumbnailUrl && <img src={item.thumbnailUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />}
                        <div className="relative z-10 w-14 h-14 rounded-full border border-white/50 bg-black/50 flex items-center justify-center text-white text-2xl group-hover:bg-black/80 transition-colors">▶</div>
                      </div>
                    )}
                  </div>
                  {item.caption && <p style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: '#7b766f', lineHeight: 1.4, margin: 0, backgroundColor: '#fff' }}>{item.caption}</p>}
                  
                  {/* Subtle hover overlay gradient to add depth */}
                  <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05), inset 0 0 20px rgba(0,0,0,0.1)' }} />
                </div>
              ))}
            </div>
          )}
        </div>
        {lightboxIndex !== null && (
          <LightboxOverlay 
            items={items} 
            initialIndex={lightboxIndex} 
            onClose={() => setLightboxIndex(null)}
            downloadsEnabled={gallery.downloadsEnabled}
          />
        )}
        <footer style={{ borderTop: '1px solid #ccc5bd', padding: '2rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#7b766f' }}>Brother&apos;s Photography · Your memories are private and secure.</p>
        </footer>
      </div>
    );
  }
  return null;
}

function LightboxOverlay({ items, initialIndex, onClose, downloadsEnabled }: { items: MediaItem[], initialIndex: number, onClose: () => void, downloadsEnabled: boolean }) {
  const [index, setIndex] = useState(initialIndex);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const prev = () => setIndex(i => (i > 0 ? i - 1 : items.length - 1));
  const next = () => setIndex(i => (i < items.length - 1 ? i + 1 : 0));

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden'; // prevent scrolling behind lightbox
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    if (diff > 50) next(); // Swipe left -> next
    if (diff < -50) prev(); // Swipe right -> prev
    setTouchStart(null);
  };

  const item = items[index];
  if (!item) return null;

  return (
    <div 
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.98)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Header */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)', zIndex: 10 }}>
        <p style={{ color: '#fff', fontSize: '0.8125rem', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{index + 1} / {items.length}</p>
        <button style={{ background: 'none', border: 'none', color: '#fff', fontSize: '2.5rem', cursor: 'pointer', lineHeight: 0.5, padding: '0.5rem' }} onClick={onClose}>×</button>
      </div>

      {/* Desktop Arrows (hidden on small screens usually, but we'll just show them always, or rely on swipe on mobile) */}
      <div className="hidden md:flex" style={{ position: 'absolute', inset: '0', pointerEvents: 'none', justifyContent: 'space-between', alignItems: 'center', padding: '0 2rem', zIndex: 10 }}>
        <button onClick={e => { e.stopPropagation(); prev(); }} style={{ pointerEvents: 'auto', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', width: '3rem', height: '3rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1.25rem', transition: 'background 0.2s' }}>←</button>
        <button onClick={e => { e.stopPropagation(); next(); }} style={{ pointerEvents: 'auto', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', width: '3rem', height: '3rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1.25rem', transition: 'background 0.2s' }}>→</button>
      </div>

      {/* Media Content */}
      <div style={{ width: '100%', height: '100%', padding: '4rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={e => e.stopPropagation()}>
        {item.mediaType === 'image' ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.url} alt={item.caption||''} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', userSelect: 'none' }} draggable={false} />
        ) : (
          <iframe 
            src={item.url} 
            allow="autoplay" 
            style={{ width: '90vw', height: '80vh', border: 'none', backgroundColor: '#000' }} 
          />
        )}
      </div>

      {/* Bottom Footer / Download */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)', zIndex: 10, pointerEvents: 'none' }}>
        <div style={{ pointerEvents: 'auto' }}>
          {item.caption && <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem', fontFamily: "'Plus Jakarta Sans', sans-serif", margin: 0, maxWidth: '600px' }}>{item.caption}</p>}
        </div>
        {downloadsEnabled && (
          <a href={item.url} download style={{ pointerEvents: 'auto', fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#fff', textDecoration: 'none', backgroundColor: 'rgba(255,255,255,0.15)', padding: '0.625rem 1.25rem', border: '1px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(4px)' }} onClick={e => e.stopPropagation()}>
            ↓ Download
          </a>
        )}
      </div>
    </div>
  );
}
