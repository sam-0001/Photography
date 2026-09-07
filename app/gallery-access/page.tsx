import Link from 'next/link';

export const metadata = {
  title: "Client Gallery Access — Brother's Photography",
};

export default function GalleryAccessPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#FAF8F5',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1
          style={{
            fontFamily: "'Bodoni Moda', serif",
            fontSize: '2.25rem',
            fontWeight: 400,
            color: '#000',
            letterSpacing: '-0.01em',
          }}
        >
          Brother&apos;s Photography
        </h1>
        <p
          style={{
            fontSize: '0.6875rem',
            fontWeight: 600,
            letterSpacing: '0.2em',
            color: '#775927',
            textTransform: 'uppercase',
            marginTop: '0.5rem',
          }}
        >
          Client Gallery Access
        </p>
      </div>

      <div
        style={{
          backgroundColor: '#fef9f2',
          border: '1px solid #ccc5bd',
          padding: '2.5rem',
          maxWidth: '24rem',
          width: '100%',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontSize: '0.9375rem',
            color: '#4a4640',
            lineHeight: 1.65,
            marginBottom: '1.5rem',
          }}
        >
          Your photographer will provide you with a unique gallery link. Please
          use that link to access your photos and videos.
        </p>
        <p style={{ fontSize: '0.8125rem', color: '#7b766f', lineHeight: 1.6 }}>
          If you have a gallery link, click it directly or paste it in your
          browser&apos;s address bar.
        </p>
        <div
          style={{
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid #ccc5bd',
          }}
        >
          <p style={{ fontSize: '0.75rem', color: '#7b766f' }}>
            Need help? Contact us:
          </p>
          <a
            href="https://wa.me/919999999999"
            style={{
              display: 'inline-block',
              marginTop: '0.75rem',
              backgroundColor: '#128C7E',
              color: '#fff',
              padding: '0.625rem 1.5rem',
              fontSize: '0.6875rem',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              textDecoration: 'none',
            }}
          >
            WhatsApp Us
          </a>
        </div>
      </div>

      <Link
        href="/"
        style={{
          marginTop: '2rem',
          fontSize: '0.75rem',
          color: '#7b766f',
          textDecoration: 'none',
        }}
      >
        ← Back to Website
      </Link>
    </div>
  );
}
