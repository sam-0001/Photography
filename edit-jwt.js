const fs = require('fs');

function updateJwtSecret(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  const oldSecret = "const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'super_secret_fallback_key_that_should_be_changed');";
  const newSecret = `const getJwtSecret = () => {
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

  if (content.includes(oldSecret)) {
    content = content.replace(oldSecret, newSecret);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated ' + filePath);
  }
}

updateJwtSecret('/Users/sohamchaudhari/Downloads/photo/brothers-photography/src/proxy.ts');
updateJwtSecret('/Users/sohamchaudhari/Downloads/photo/brothers-photography/src/app/api/admin/login/route.ts');
