// Direct test of external link opening from main process
const { shell } = require('electron');

console.log('🔧 Testing direct shell.openExternal...');

const testUrl = 'https://www.google.com';

shell.openExternal(testUrl)
  .then(() => {
    console.log(`✅ Direct shell.openExternal SUCCESS for: ${testUrl}`);
    process.exit(0);
  })
  .catch(error => {
    console.error(`❌ Direct shell.openExternal FAILED for: ${testUrl}`, error);
    process.exit(1);
  });

// Timeout fallback
setTimeout(() => {
  console.log('⏰ Test timeout - shell.openExternal may have hung');
  process.exit(2);
}, 5000);