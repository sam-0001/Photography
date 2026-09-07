const fs = require('fs');
const path = '/Users/sohamchaudhari/Downloads/photo/brothers-photography/src/app/components/admin/EventMediaManagerModal.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace preview state logic
const oldImg = /{qrPreview \? \(\s*<img src=\{qrPreview\} alt="QR Code".*?\/>\s*\) : \(\s*<div.*?>\s*<span.*?>QR<br \/>Preview<\/span>\s*<\/div>\s*\)}/s;
const newImg = `<img 
                  src={\`/api/events/\${event._id}/qr?preview=1\`} 
                  alt="QR Code" 
                  style={{ width: '120px', height: '120px', border: \`1px solid \${S.outlineVariant}\`, display: 'block', marginBottom: '0.5rem' }} 
                />`;
content = content.replace(oldImg, newImg);

// Add the aesthetic download button
const buttonsRegex = /<button\s+onClick=\{\(\) => downloadQR\('svg'\)\}[\s\S]*?<\/button>\s*<\/div>/;
const newButtons = `<button
                    onClick={() => downloadQR('svg')}
                    disabled={qrLoading}
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.375rem 0.75rem', border: \`1px solid \${S.primary}\`, backgroundColor: 'transparent', color: qrLoading ? S.onSurfaceVariant : S.primary, cursor: qrLoading ? 'not-allowed' : 'pointer' }}
                  >
                    {qrLoading ? '…' : '↓ SVG'}
                  </button>
                  <a
                    href={\`/api/events/\${event._id}/qr-card\`}
                    download
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.375rem 0.75rem', border: 'none', backgroundColor: '#775927', color: '#fff', textDecoration: 'none', display: 'inline-block', marginTop: '4px' }}
                  >
                    ✨ Download Aesthetic Card
                  </a>
                </div>`;
content = content.replace(buttonsRegex, newButtons);

fs.writeFileSync(path, content, 'utf8');
