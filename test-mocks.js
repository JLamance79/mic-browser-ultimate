/**
 * Mock Electron environment for security testing
 */

const path = require('path');
const fs = require('fs');

// Mock Electron app object
const mockApp = {
    getPath: (name) => {
        const userDataPath = path.join(__dirname, 'test-data');
        
        // Ensure directory exists
        if (!fs.existsSync(userDataPath)) {
            fs.mkdirSync(userDataPath, { recursive: true });
        }
        
        switch (name) {
            case 'userData':
                return userDataPath;
            case 'appData':
                return userDataPath;
            case 'home':
                return require('os').homedir();
            default:
                return userDataPath;
        }
    }
};

// Mock crypto.randomUUID if not available
if (!require('crypto').randomUUID) {
    require('crypto').randomUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };
}

// Set up global mocks immediately
global.mockElectron = {
    app: mockApp
};

// Override require to return mock for electron
const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function(id) {
    if (id === 'electron') {
        return {
            app: mockApp,
            session: {
                defaultSession: {
                    webRequest: {
                        onHeadersReceived: () => {},
                        onBeforeRequest: () => {}
                    }
                }
            }
        };
    }
    return originalRequire.apply(this, arguments);
};

module.exports = { mockApp };