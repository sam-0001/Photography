'use client';
import { useState } from 'react';

export default function InquireForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  const inputStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '1px solid var(--color-primary)',
    padding: '0.75rem 0',
    fontFamily: 'var(--font-jakarta)',
    fontSize: '0.9375rem',
    color: 'var(--color-on-surface)',
    outline: 'none',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: 'var(--font-jakarta)',
    fontSize: '0.6875rem',
    fontWeight: 600,
    letterSpacing: '0.15em',
    color: 'var(--color-primary)',
    textTransform: 'uppercase',
    marginBottom: '0.5rem',
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('loading');
    const fd = new FormData(e.currentTarget);
    const raw = Object.fromEntries(fd.entries()) as Record<string, string>;
    const payload = {
      fullName: raw.name || raw.fullName || '',
      name: raw.name || raw.fullName || '',
      email: raw.email || '',
      phone: raw.phone || '',
      commissionNature: raw.eventType || raw.commissionNature || '',
      eventType: raw.eventType || raw.commissionNature || '',
      estimatedDate: raw.eventDate || raw.estimatedDate || '',
      eventDate: raw.eventDate || raw.estimatedDate || '',
      venue: raw.location || raw.venue || '',
      location: raw.location || raw.venue || '',
      visionNotes: raw.message || raw.visionNotes || '',
      message: raw.message || raw.visionNotes || '',
    };

    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        setStatus('success');
        setMsg('Your enquiry has been submitted. We will contact you shortly!');
      } else {
        const d = await res.json();
        setStatus('error');
        setMsg(d.error || 'Something went wrong.');
      }
    } catch {
      setStatus('error');
      setMsg('Network error. Please try again.');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto" style={{ maxWidth: '48rem', backgroundColor: 'var(--color-surface-container-low)', padding: '3rem', border: '1px solid var(--color-outline-variant)' }}>
      {status === 'success' ? (
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
          <p style={{ fontFamily: 'var(--font-bodoni)', fontSize: '1.75rem', color: 'var(--color-primary)' }}>Thank You!</p>
          <p style={{ fontFamily: 'var(--font-jakarta)', color: 'var(--color-on-surface-variant)', marginTop: '0.75rem' }}>{msg}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <label style={labelStyle}>Full Name *</label>
              <input style={inputStyle} name="name" placeholder="Your name" required />
            </div>
            <div>
              <label style={labelStyle}>Phone Number *</label>
              <input style={inputStyle} name="phone" placeholder="+91 99999 99999" required />
            </div>
            <div>
              <label style={labelStyle}>Email Address *</label>
              <input style={inputStyle} name="email" type="email" placeholder="you@email.com" required />
            </div>
            <div>
              <label style={labelStyle}>Event Type *</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} name="eventType" required>
                <option value="">Select event type</option>
                {['Wedding', 'Pre-Wedding', 'Engagement', 'Birthday', 'Event / Party', 'Portrait Session', 'Album / Print', 'Other'].map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Event Date *</label>
              <input style={inputStyle} name="eventDate" type="date" required />
            </div>
            <div>
              <label style={labelStyle}>Location *</label>
              <input style={inputStyle} name="location" placeholder="City, Venue" required />
            </div>
          </div>
          <div className="mb-8">
            <label style={labelStyle}>Message / Vision</label>
            <textarea
              style={{ ...inputStyle, resize: 'none', minHeight: '5rem' }}
              name="message"
              placeholder="Tell us about your event and what you are looking for..."
              rows={4}
            />
          </div>
          {status === 'error' && (
            <p style={{ color: 'var(--color-error)', fontFamily: 'var(--font-jakarta)', fontSize: '0.8125rem', marginBottom: '1rem' }}>{msg}</p>
          )}
          <div className="flex items-center justify-between">
            <p style={{ fontFamily: 'var(--font-jakarta)', fontSize: '0.75rem', color: 'var(--color-on-surface-variant)' }}>We respond within 24 hours.</p>
            <button
              type="submit"
              disabled={status === 'loading'}
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-on-primary)',
                fontFamily: 'var(--font-jakarta)',
                fontSize: '0.6875rem',
                fontWeight: 600,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                padding: '1rem 2.5rem',
                border: 'none',
                cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                opacity: status === 'loading' ? 0.7 : 1,
              }}>
              {status === 'loading' ? 'Sending...' : 'Submit Inquire'}
            </button>
          </div>
        </>
      )}
    </form>
  );
}
