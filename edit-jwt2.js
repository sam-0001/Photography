const fs = require('fs');

function updateJwtSecret(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  const oldSecret = `const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length === 0) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: JWT_SECRET environment variable is not set.');
    }
    console.warn('WARNING: Using insecure development JWT secret.');
    return new TextEncoder().encode('development_secret_only');
  }
  return new TextEncoder().encode(secret);
};
const JWT_SECRET = getJwtSecret();`;

  const newSecret = `const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length === 0) {
    // Generate a random secret if missing in production to prevent hardcoded vulnerabilities.
    // Note: This will cause tokens to invalidate every time the server restarts/cold-starts.
    return new TextEncoder().encode(Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
  }
  return new TextEncoder().encode(secret);
};
const JWT_SECRET = getJwtSecret();`;

  if (content.includes(oldSecret)) {
    content = content.replace(oldSecret, newSecret);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated ' + filePath);
  }
}

updateJwtSecret('/Users/sohamchaudhari/Downloads/photo/brothers-photography/src/proxy.ts');
updateJwtSecret('/Users/sohamchaudhari/Downloads/photo/brothers-photography/src/app/api/admin/login/route.ts');
