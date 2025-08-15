#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const envFile = path.join(__dirname, 'src/config/environment.js');

function switchEnvironment(env) {
  if (!['local', 'production'].includes(env)) {
    console.error('❌ Invalid environment. Use "local" or "production"');
    process.exit(1);
  }

  const content = `// Environment Configuration
// Change this value to switch between environments:
// 'local' - for development with local server (localhost:5000)
// 'production' - for production with Render server
export const ENVIRONMENT = '${env}';

// You can also set this via environment variable
// export const ENVIRONMENT = process.env.REACT_APP_ENVIRONMENT || 'local';

console.log(\`Environment set to: \${ENVIRONMENT}\`);`;

  try {
    fs.writeFileSync(envFile, content);
    console.log(`✅ Environment switched to: ${env}`);
    console.log(`📡 API will use: ${env === 'local' ? 'http://localhost:5000/api' : 'https://oops-checkmate-web.onrender.com/api'}`);
  } catch (error) {
    console.error('❌ Error switching environment:', error.message);
    process.exit(1);
  }
}

const env = process.argv[2];

if (!env) {
  console.log('🔧 Environment Switcher');
  console.log('');
  console.log('Usage:');
  console.log('  node switch-env.js local     # Switch to local development');
  console.log('  node switch-env.js production # Switch to production');
  console.log('');
  console.log('Current environment:');
  try {
    const currentContent = fs.readFileSync(envFile, 'utf8');
    const match = currentContent.match(/ENVIRONMENT = '([^']+)'/);
    if (match) {
      console.log(`  ${match[1]}`);
    } else {
      console.log('  unknown');
    }
  } catch (error) {
    console.log('  file not found');
  }
} else {
  switchEnvironment(env);
} 