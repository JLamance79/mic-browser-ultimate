// Test contextBridge isolation
console.log('🔧 Testing contextBridge directly...');

try {
  const { contextBridge } = require('electron');
  console.log('🔧 contextBridge available:', !!contextBridge);
  
  if (contextBridge) {
    // Test simple exposure
    contextBridge.exposeInMainWorld('testAPI', {
      test: () => 'Hello from contextBridge!'
    });
    console.log('🔧 Test API exposed successfully');
  }
} catch (error) {
  console.error('🔧 contextBridge test failed:', error);
}