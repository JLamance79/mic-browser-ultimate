/**
 * CommandParser - Advanced Command Processing System
 * Parses natural language and structured commands for MIC Browser Ultimate
 */

class CommandParser {
    constructor(browser) {
        this.browser = browser;
        this.commands = new Map();
        this.aliases = new Map();
        this.context = {
            lastCommand: null,
            currentTab: null,
            history: [],
            variables: new Map()
        };
        
        this.initializeCommands();
        this.initializeAliases();
    }

    /**
     * Initialize built-in commands
     */
    initializeCommands() {
        // Navigation Commands
        this.registerCommand('navigate', {
            aliases: ['go', 'open', 'visit', 'browse'],
            description: 'Navigate to a URL or search',
            usage: 'navigate <url|search term>',
            category: 'navigation',
            handler: this.handleNavigate.bind(this)
        });

        this.registerCommand('back', {
            aliases: ['previous', 'goback'],
            description: 'Go back in browser history',
            usage: 'back [steps]',
            category: 'navigation',
            handler: this.handleBack.bind(this)
        });

        this.registerCommand('forward', {
            aliases: ['next', 'goforward'],
            description: 'Go forward in browser history',
            usage: 'forward [steps]',
            category: 'navigation',
            handler: this.handleForward.bind(this)
        });

        this.registerCommand('reload', {
            aliases: ['refresh', 'refresh-page', 'f5'],
            description: 'Reload current page',
            usage: 'reload [hard]',
            category: 'navigation',
            handler: this.handleReload.bind(this)
        });

        this.registerCommand('home', {
            aliases: ['homepage'],
            description: 'Go to homepage',
            usage: 'home',
            category: 'navigation',
            handler: this.handleHome.bind(this)
        });

        // Tab Management Commands
        this.registerCommand('newtab', {
            aliases: ['new-tab', 'tab-new', 'create-tab', 'nt'],
            description: 'Create a new tab',
            usage: 'newtab [url]',
            category: 'tabs',
            handler: this.handleNewTab.bind(this)
        });

        this.registerCommand('closetab', {
            aliases: ['close-tab', 'tab-close', 'ct'],
            description: 'Close current or specified tab',
            usage: 'closetab [tab-id]',
            category: 'tabs',
            handler: this.handleCloseTab.bind(this)
        });

        this.registerCommand('switchtab', {
            aliases: ['switch-tab', 'tab-switch', 'tab', 'st'],
            description: 'Switch to a specific tab',
            usage: 'switchtab <tab-id|tab-number>',
            category: 'tabs',
            handler: this.handleSwitchTab.bind(this)
        });

        this.registerCommand('pinnedtab', {
            aliases: ['pin-tab', 'tab-pin'],
            description: 'Pin or unpin a tab',
            usage: 'pintab [tab-id]',
            category: 'tabs',
            handler: this.handlePinTab.bind(this)
        });

        this.registerCommand('duplicatetab', {
            aliases: ['duplicate-tab', 'clone-tab'],
            description: 'Duplicate current tab',
            usage: 'duplicatetab',
            category: 'tabs',
            handler: this.handleDuplicateTab.bind(this)
        });

        // Search Commands
        this.registerCommand('search', {
            aliases: ['find', 'google', 'bing'],
            description: 'Search the web',
            usage: 'search <query>',
            category: 'search',
            handler: this.handleSearch.bind(this)
        });

        this.registerCommand('findinpage', {
            aliases: ['find-in-page', 'search-page', 'ctrl+f'],
            description: 'Find text in current page',
            usage: 'findinpage <text>',
            category: 'search',
            handler: this.handleFindInPage.bind(this)
        });

        // Document & OCR Commands
        this.registerCommand('scan', {
            aliases: ['ocr', 'scan-document', 'extract-text'],
            description: 'Open document scanner',
            usage: 'scan [image-path]',
            category: 'ocr',
            handler: this.handleScan.bind(this)
        });

        this.registerCommand('screenshot', {
            aliases: ['capture', 'print-screen'],
            description: 'Take a screenshot',
            usage: 'screenshot [full|visible]',
            category: 'capture',
            handler: this.handleScreenshot.bind(this)
        });

        // AI Commands
        this.registerCommand('ai', {
            aliases: ['assistant', 'ask', 'chatgpt', 'claude'],
            description: 'Interact with AI assistant',
            usage: 'ai <prompt>',
            category: 'ai',
            handler: this.handleAI.bind(this)
        });

        this.registerCommand('summarize', {
            aliases: ['summary', 'tldr', 'summarize-page'],
            description: 'Summarize current page with AI',
            usage: 'summarize [length]',
            category: 'ai',
            handler: this.handleSummarize.bind(this)
        });

        // Page Analysis Commands
        this.registerCommand('analyze', {
            aliases: ['analyze-page', 'audit', 'scan', 'check-page'],
            description: 'Analyze current page for SEO, accessibility, performance, etc.',
            usage: 'analyze [category]',
            category: 'analysis',
            handler: this.handleAnalyze.bind(this)
        });

        this.registerCommand('seo', {
            aliases: ['seo-check', 'search-optimization'],
            description: 'Analyze page for SEO optimization',
            usage: 'seo',
            category: 'analysis',
            handler: this.handleSEOAnalysis.bind(this)
        });

        this.registerCommand('accessibility', {
            aliases: ['a11y', 'accessibility-check', 'wcag'],
            description: 'Check page accessibility compliance',
            usage: 'accessibility',
            category: 'analysis',
            handler: this.handleAccessibilityAnalysis.bind(this)
        });

        this.registerCommand('performance', {
            aliases: ['perf', 'speed', 'performance-check'],
            description: 'Analyze page performance metrics',
            usage: 'performance',
            category: 'analysis',
            handler: this.handlePerformanceAnalysis.bind(this)
        });

        this.registerCommand('readability', {
            aliases: ['reading-score', 'text-analysis'],
            description: 'Analyze page readability and content quality',
            usage: 'readability',
            category: 'analysis',
            handler: this.handleReadabilityAnalysis.bind(this)
        });

        // Settings Commands
        this.registerCommand('settings', {
            aliases: ['preferences', 'config', 'options'],
            description: 'Open settings panel',
            usage: 'settings [category]',
            category: 'system',
            handler: this.handleSettings.bind(this)
        });

        this.registerCommand('theme', {
            aliases: ['dark-mode', 'light-mode'],
            description: 'Change theme',
            usage: 'theme <dark|light|auto>',
            category: 'appearance',
            handler: this.handleTheme.bind(this)
        });

        // System Commands
        this.registerCommand('help', {
            aliases: ['commands', 'man', '?'],
            description: 'Show available commands',
            usage: 'help [command]',
            category: 'system',
            handler: this.handleHelp.bind(this)
        });

        this.registerCommand('history', {
            aliases: ['browsing-history', 'hist'],
            description: 'Show browsing history',
            usage: 'history [days]',
            category: 'system',
            handler: this.handleHistory.bind(this)
        });

        this.registerCommand('bookmarks', {
            aliases: ['favorites', 'saved'],
            description: 'Manage bookmarks',
            usage: 'bookmarks [add|remove|list]',
            category: 'system',
            handler: this.handleBookmarks.bind(this)
        });

        this.registerCommand('update', {
            aliases: ['check-update', 'upgrade', 'check-for-updates'],
            description: 'Check for application updates',
            usage: 'update [check|download|install]',
            category: 'system',
            handler: this.handleUpdate.bind(this)
        });

        // Voice Commands
        this.registerCommand('voice', {
            aliases: ['mic', 'listen', 'voice-command'],
            description: 'Start voice command mode',
            usage: 'voice [start|stop]',
            category: 'voice',
            handler: this.handleVoice.bind(this)
        });

        // Advanced Commands
        this.registerCommand('execute', {
            aliases: ['run', 'exec'],
            description: 'Execute a sequence of commands',
            usage: 'execute <command1; command2; ...>',
            category: 'advanced',
            handler: this.handleExecute.bind(this)
        });

        this.registerCommand('macro', {
            aliases: ['script', 'automation'],
            description: 'Run saved macro or automation',
            usage: 'macro <name>',
            category: 'advanced',
            handler: this.handleMacro.bind(this)
        });
    }

    /**
     * Initialize command aliases
     */
    initializeAliases() {
        this.commands.forEach((command, name) => {
            if (command.aliases) {
                command.aliases.forEach(alias => {
                    this.aliases.set(alias.toLowerCase(), name);
                });
            }
        });
    }

    /**
     * Register a new command
     */
    registerCommand(name, config) {
        this.commands.set(name.toLowerCase(), {
            name: name,
            ...config,
            registered: new Date()
        });
    }

    /**
     * Parse and execute a command
     */
    async parseCommand(input, context = {}) {
        try {
            // Clean and normalize input
            const cleanInput = input.trim();
            if (!cleanInput) {
                return { success: false, error: 'Empty command' };
            }

            // Update context
            this.context = { ...this.context, ...context };
            this.context.currentTab = this.browser.tabManager?.activeTabId || null;

            // Check for natural language patterns first
            const naturalCommand = this.parseNaturalLanguage(cleanInput);
            if (naturalCommand) {
                return await this.executeCommand(naturalCommand.command, naturalCommand.args, naturalCommand.flags);
            }

            // Parse structured command
            const parsed = this.parseStructuredCommand(cleanInput);
            if (!parsed) {
                return { success: false, error: 'Invalid command format' };
            }

            // Execute command
            const result = await this.executeCommand(parsed.command, parsed.args, parsed.flags);
            
            // Store in history
            this.context.history.push({
                input: cleanInput,
                command: parsed.command,
                timestamp: new Date(),
                result: result
            });

            this.context.lastCommand = parsed;
            return result;

        } catch (error) {
            return {
                success: false,
                error: error.message,
                stack: error.stack
            };
        }
    }

    /**
     * Parse natural language commands
     */
    parseNaturalLanguage(input) {
        const patterns = [
            // Navigation patterns
            { pattern: /^(go to|open|visit|navigate to)\s+(.+)$/i, command: 'navigate', argIndex: 2 },
            { pattern: /^search for\s+(.+)$/i, command: 'search', argIndex: 1 },
            { pattern: /^find\s+(.+)\s+(on this page|in page)$/i, command: 'findinpage', argIndex: 1 },
            { pattern: /^(create|open|make)\s+(a\s+)?new tab$/i, command: 'newtab' },
            { pattern: /^close\s+(this\s+)?tab$/i, command: 'closetab' },
            { pattern: /^go back$/i, command: 'back' },
            { pattern: /^go forward$/i, command: 'forward' },
            { pattern: /^(reload|refresh)\s+(this\s+)?page$/i, command: 'reload' },
            { pattern: /^go\s+(to\s+)?home$/i, command: 'home' },
            
            // AI patterns
            { pattern: /^(ask ai|ai|assistant)\s+(.+)$/i, command: 'ai', argIndex: 2 },
            { pattern: /^summarize\s+(this\s+)?page$/i, command: 'summarize' },
            
            // OCR patterns
            { pattern: /^(scan|ocr|extract text from)\s+(.+)$/i, command: 'scan', argIndex: 2 },
            { pattern: /^(take|capture)\s+(a\s+)?screenshot$/i, command: 'screenshot' },
            
            // Settings patterns
            { pattern: /^(open|show|display)\s+settings$/i, command: 'settings' },
            { pattern: /^(switch to|change to|set)\s+(dark|light)\s+(mode|theme)$/i, command: 'theme', argIndex: 2 },
            
            // Voice patterns
            { pattern: /^(start|begin|activate)\s+voice\s+(commands?|mode)$/i, command: 'voice', args: ['start'] },
            { pattern: /^(stop|end|deactivate)\s+voice\s+(commands?|mode)$/i, command: 'voice', args: ['stop'] },
            
            // Help patterns
            { pattern: /^(help|show commands|what can you do)$/i, command: 'help' }
        ];

        for (const pattern of patterns) {
            const match = input.match(pattern.pattern);
            if (match) {
                let args = [];
                if (pattern.argIndex && match[pattern.argIndex]) {
                    args = [match[pattern.argIndex]];
                } else if (pattern.args) {
                    args = pattern.args;
                }
                
                return {
                    command: pattern.command,
                    args: args,
                    flags: {},
                    natural: true
                };
            }
        }

        return null;
    }

    /**
     * Parse structured command (command arg1 arg2 --flag)
     */
    parseStructuredCommand(input) {
        // Split by spaces, respecting quotes
        const parts = this.splitCommandLine(input);
        if (parts.length === 0) return null;

        const command = parts[0].toLowerCase();
        const args = [];
        const flags = {};

        for (let i = 1; i < parts.length; i++) {
            const part = parts[i];
            if (part.startsWith('--')) {
                // Long flag (--flag=value or --flag value)
                const flagMatch = part.match(/^--([^=]+)(?:=(.*))?$/);
                if (flagMatch) {
                    const flagName = flagMatch[1];
                    let flagValue = flagMatch[2];
                    
                    if (flagValue === undefined && i + 1 < parts.length && !parts[i + 1].startsWith('-')) {
                        flagValue = parts[++i];
                    }
                    
                    flags[flagName] = flagValue || true;
                }
            } else if (part.startsWith('-') && part.length > 1) {
                // Short flag (-f)
                const shortFlag = part.substring(1);
                flags[shortFlag] = true;
            } else {
                // Regular argument
                args.push(part);
            }
        }

        return { command, args, flags };
    }

    /**
     * Split command line respecting quotes
     */
    splitCommandLine(input) {
        const parts = [];
        let current = '';
        let inQuotes = false;
        let quoteChar = '';

        for (let i = 0; i < input.length; i++) {
            const char = input[i];
            
            if ((char === '"' || char === "'") && !inQuotes) {
                inQuotes = true;
                quoteChar = char;
            } else if (char === quoteChar && inQuotes) {
                inQuotes = false;
                quoteChar = '';
            } else if (char === ' ' && !inQuotes) {
                if (current) {
                    parts.push(current);
                    current = '';
                }
            } else {
                current += char;
            }
        }

        if (current) {
            parts.push(current);
        }

        return parts;
    }

    /**
     * Execute a parsed command
     */
    async executeCommand(commandName, args = [], flags = {}) {
        // Resolve command name (handle aliases)
        const resolvedName = this.aliases.get(commandName.toLowerCase()) || commandName.toLowerCase();
        const command = this.commands.get(resolvedName);

        if (!command) {
            return {
                success: false,
                error: `Unknown command: ${commandName}. Type 'help' to see available commands.`
            };
        }

        try {
            const result = await command.handler(args, flags, this.context);
            return {
                success: true,
                command: resolvedName,
                result: result
            };
        } catch (error) {
            return {
                success: false,
                error: `Command failed: ${error.message}`
            };
        }
    }

    // Command Handlers
    async handleNavigate(args, flags, context) {
        if (args.length === 0) {
            throw new Error('URL or search term required');
        }

        const query = args.join(' ');
        const isUrl = this.isValidUrl(query);
        
        if (isUrl) {
            this.browser.navigateToUrl(query);
            return `Navigating to: ${query}`;
        } else {
            this.browser.search(query);
            return `Searching for: ${query}`;
        }
    }

    async handleBack(args, flags, context) {
        const steps = parseInt(args[0]) || 1;
        this.browser.goBackActiveTab(steps);
        return `Went back ${steps} step(s)`;
    }

    async handleForward(args, flags, context) {
        const steps = parseInt(args[0]) || 1;
        this.browser.goForwardActiveTab(steps);
        return `Went forward ${steps} step(s)`;
    }

    async handleReload(args, flags, context) {
        const hard = flags.hard || args.includes('hard');
        this.browser.refreshActiveTab(hard);
        return hard ? 'Hard reload completed' : 'Page reloaded';
    }

    async handleHome(args, flags, context) {
        this.browser.goHome();
        return 'Navigated to homepage';
    }

    async handleNewTab(args, flags, context) {
        const url = args.length > 0 ? args.join(' ') : undefined;
        const tabId = this.browser.tabManager.createTab({ url });
        this.browser.tabManager.switchToTab(tabId);
        return `Created new tab${url ? ` with URL: ${url}` : ''}`;
    }

    async handleCloseTab(args, flags, context) {
        const tabId = args[0] || context.currentTab;
        if (!tabId) {
            throw new Error('No tab to close');
        }
        
        this.browser.tabManager.closeTab(tabId);
        return `Closed tab: ${tabId}`;
    }

    async handleSwitchTab(args, flags, context) {
        if (args.length === 0) {
            throw new Error('Tab ID or number required');
        }

        const identifier = args[0];
        let tabId;

        // Check if it's a number (tab index)
        if (/^\d+$/.test(identifier)) {
            const tabIndex = parseInt(identifier) - 1;
            const tabIds = Array.from(this.browser.tabManager.tabs.keys());
            tabId = tabIds[tabIndex];
        } else {
            tabId = identifier;
        }

        if (!tabId || !this.browser.tabManager.tabs.has(tabId)) {
            throw new Error(`Tab not found: ${identifier}`);
        }

        this.browser.tabManager.switchToTab(tabId);
        return `Switched to tab: ${tabId}`;
    }

    async handlePinTab(args, flags, context) {
        const tabId = args[0] || context.currentTab;
        if (!tabId) {
            throw new Error('No tab specified');
        }

        const tab = this.browser.tabManager.tabs.get(tabId);
        if (!tab) {
            throw new Error(`Tab not found: ${tabId}`);
        }

        const wasPinned = tab.isPinned;
        this.browser.tabManager.pinTab(tabId, !wasPinned);
        return wasPinned ? `Unpinned tab: ${tabId}` : `Pinned tab: ${tabId}`;
    }

    async handleDuplicateTab(args, flags, context) {
        const sourceTabId = args[0] || context.currentTab;
        if (!sourceTabId) {
            throw new Error('No tab to duplicate');
        }

        const newTabId = this.browser.tabManager.duplicateTab(sourceTabId);
        return `Duplicated tab: ${sourceTabId} → ${newTabId}`;
    }

    async handleSearch(args, flags, context) {
        if (args.length === 0) {
            throw new Error('Search query required');
        }

        const query = args.join(' ');
        this.browser.search(query);
        return `Searching for: ${query}`;
    }

    async handleFindInPage(args, flags, context) {
        if (args.length === 0) {
            throw new Error('Search text required');
        }

        const text = args.join(' ');
        this.browser.findInPage(text);
        return `Finding in page: ${text}`;
    }

    async handleScan(args, flags, context) {
        if (args.length > 0) {
            // Scan specific file
            const imagePath = args.join(' ');
            return await this.browser.scanDocument(imagePath);
        } else {
            // Open scanner interface
            this.browser.openDocumentScanner();
            return 'Document scanner opened';
        }
    }

    async handleScreenshot(args, flags, context) {
        const type = args[0] || 'visible';
        const result = await this.browser.takeScreenshot(type);
        return `Screenshot taken: ${result.path}`;
    }

    async handleAI(args, flags, context) {
        if (args.length === 0) {
            throw new Error('AI prompt required');
        }

        const prompt = args.join(' ');
        const response = await this.browser.sendAIRequest(prompt);
        return response;
    }

    async handleSummarize(args, flags, context) {
        const length = args[0] || 'medium';
        const result = await this.browser.summarizePage(length);
        return result;
    }

    async handleSettings(args, flags, context) {
        const category = args[0];
        this.browser.openSettings(category);
        return `Settings opened${category ? ` (${category})` : ''}`;
    }

    async handleTheme(args, flags, context) {
        if (args.length === 0) {
            throw new Error('Theme required (dark, light, auto)');
        }

        const theme = args[0].toLowerCase();
        if (!['dark', 'light', 'auto'].includes(theme)) {
            throw new Error('Invalid theme. Use: dark, light, auto');
        }

        this.browser.setTheme(theme);
        return `Theme set to: ${theme}`;
    }

    async handleHelp(args, flags, context) {
        if (args.length > 0) {
            // Help for specific command
            const commandName = args[0].toLowerCase();
            const resolvedName = this.aliases.get(commandName) || commandName;
            const command = this.commands.get(resolvedName);
            
            if (!command) {
                throw new Error(`Unknown command: ${commandName}`);
            }

            return `${command.name}: ${command.description}\nUsage: ${command.usage}`;
        } else {
            // List all commands by category
            const categories = {};
            this.commands.forEach((command, name) => {
                const category = command.category || 'other';
                if (!categories[category]) {
                    categories[category] = [];
                }
                categories[category].push(`${name} - ${command.description}`);
            });

            let help = 'Available Commands:\n';
            Object.keys(categories).sort().forEach(category => {
                help += `\n${category.toUpperCase()}:\n`;
                categories[category].forEach(cmd => {
                    help += `  ${cmd}\n`;
                });
            });

            return help;
        }
    }

    async handleHistory(args, flags, context) {
        const days = parseInt(args[0]) || 7;
        const history = await this.browser.getHistory(days);
        return `Showing history for last ${days} days (${history.length} entries)`;
    }

    async handleBookmarks(args, flags, context) {
        const action = args[0] || 'list';
        
        switch (action.toLowerCase()) {
            case 'add':
                const url = args[1] || this.browser.getCurrentUrl();
                const title = args.slice(2).join(' ') || this.browser.getCurrentTitle();
                await this.browser.addBookmark(url, title);
                return `Bookmark added: ${title}`;
                
            case 'remove':
                const bookmarkId = args[1];
                if (!bookmarkId) throw new Error('Bookmark ID required');
                await this.browser.removeBookmark(bookmarkId);
                return `Bookmark removed: ${bookmarkId}`;
                
            case 'list':
            default:
                const bookmarks = await this.browser.getBookmarks();
                return `${bookmarks.length} bookmarks found`;
        }
    }

    async handleUpdate(args, flags, context) {
        const action = args[0] || 'check';
        
        try {
            switch (action.toLowerCase()) {
                case 'check':
                    if (window.checkForUpdates) {
                        await window.checkForUpdates();
                        return 'Checking for updates...';
                    } else {
                        return 'Update checking not available';
                    }
                    
                case 'download':
                    if (window.downloadUpdate) {
                        await window.downloadUpdate();
                        return 'Starting update download...';
                    } else {
                        return 'Update download not available';
                    }
                    
                case 'install':
                    if (window.restartAndUpdate) {
                        await window.restartAndUpdate();
                        return 'Installing update and restarting...';
                    } else {
                        return 'Update installation not available';
                    }
                    
                default:
                    return 'Usage: update [check|download|install]';
            }
        } catch (error) {
            return `Update command failed: ${error.message}`;
        }
    }

    async handleVoice(args, flags, context) {
        const action = args[0] || 'start';
        
        if (action === 'start') {
            this.browser.startVoiceCommand();
            return 'Voice command mode started';
        } else if (action === 'stop') {
            this.browser.stopVoiceCommand();
            return 'Voice command mode stopped';
        } else {
            throw new Error('Invalid voice action. Use: start, stop');
        }
    }

    async handleExecute(args, flags, context) {
        if (args.length === 0) {
            throw new Error('Command sequence required');
        }

        const sequence = args.join(' ');
        const commands = sequence.split(';').map(cmd => cmd.trim());
        const results = [];

        for (const cmd of commands) {
            if (cmd) {
                const result = await this.parseCommand(cmd, context);
                results.push(result);
                if (!result.success) break;
            }
        }

        return `Executed ${results.length} commands`;
    }

    async handleMacro(args, flags, context) {
        if (args.length === 0) {
            throw new Error('Macro name required');
        }

        const macroName = args[0];
        const macro = await this.browser.getMacro(macroName);
        
        if (!macro) {
            throw new Error(`Macro not found: ${macroName}`);
        }

        await this.browser.executeMacro(macro);
        return `Executed macro: ${macroName}`;
    }

    /**
     * Utility functions
     */
    isValidUrl(string) {
        try {
            const url = new URL(string.includes('://') ? string : `https://${string}`);
            return ['http:', 'https:', 'file:', 'ftp:'].includes(url.protocol);
        } catch {
            return false;
        }
    }

    /**
     * Get command suggestions based on partial input
     */
    getSuggestions(partialInput) {
        const input = partialInput.toLowerCase();
        const suggestions = [];

        // Command name suggestions
        this.commands.forEach((command, name) => {
            if (name.startsWith(input)) {
                suggestions.push({
                    type: 'command',
                    text: name,
                    description: command.description,
                    usage: command.usage
                });
            }
        });

        // Alias suggestions
        this.aliases.forEach((commandName, alias) => {
            if (alias.startsWith(input)) {
                const command = this.commands.get(commandName);
                suggestions.push({
                    type: 'alias',
                    text: alias,
                    description: `Alias for ${commandName}`,
                    usage: command.usage
                });
            }
        });

        return suggestions.slice(0, 10); // Limit to 10 suggestions
    }

    /**
     * Get command categories
     */
    getCategories() {
        const categories = new Set();
        this.commands.forEach(command => {
            categories.add(command.category || 'other');
        });
        return Array.from(categories).sort();
    }

    // Page Analysis Handlers
    async handleAnalyze(args, flags, context) {
        try {
            const category = args[0] ? args[0].toLowerCase() : 'all';
            
            // Initialize page analyzer if not already done
            if (!window.pageAnalyzer) {
                // Load the PageAnalyzer script
                const script = document.createElement('script');
                script.src = './PageAnalyzer.js';
                document.head.appendChild(script);
                
                await new Promise((resolve) => {
                    script.onload = () => {
                        window.pageAnalyzer = new PageAnalyzer();
                        resolve();
                    };
                });
            }

            // Perform analysis
            const analysis = await window.pageAnalyzer.analyzePage();
            
            // Save analysis results
            await window.electronAPI.pageAnalysis.saveAnalysis(window.location.href, analysis);
            
            // Display results based on category
            if (category === 'all') {
                this.browser.showAnalysisResults(analysis);
                return `Page analysis complete. Overall score: ${analysis.overallScore}/100`;
            } else if (analysis.categories[category]) {
                this.browser.showCategoryAnalysis(category, analysis.categories[category]);
                return `${category.toUpperCase()} analysis complete. Score: ${analysis.categories[category].score}/100`;
            } else {
                const availableCategories = Object.keys(analysis.categories).join(', ');
                throw new Error(`Invalid category. Available: ${availableCategories}`);
            }
        } catch (error) {
            console.error('Analysis error:', error);
            return `Analysis failed: ${error.message}`;
        }
    }

    async handleSEOAnalysis(args, flags, context) {
        try {
            if (!window.pageAnalyzer) {
                const script = document.createElement('script');
                script.src = './PageAnalyzer.js';
                document.head.appendChild(script);
                
                await new Promise((resolve) => {
                    script.onload = () => {
                        window.pageAnalyzer = new PageAnalyzer();
                        resolve();
                    };
                });
            }

            const seoAnalysis = await window.pageAnalyzer.analyzeSEO();
            
            // Save to full analysis cache
            const existingAnalysis = await window.electronAPI.pageAnalysis.getAnalysis(window.location.href) || {
                url: window.location.href,
                categories: {}
            };
            existingAnalysis.categories.seo = seoAnalysis;
            await window.electronAPI.pageAnalysis.saveAnalysis(window.location.href, existingAnalysis);
            
            this.browser.showCategoryAnalysis('seo', seoAnalysis);
            return `SEO analysis complete. Score: ${seoAnalysis.score}/100`;
        } catch (error) {
            console.error('SEO analysis error:', error);
            return `SEO analysis failed: ${error.message}`;
        }
    }

    async handleAccessibilityAnalysis(args, flags, context) {
        try {
            if (!window.pageAnalyzer) {
                const script = document.createElement('script');
                script.src = './PageAnalyzer.js';
                document.head.appendChild(script);
                
                await new Promise((resolve) => {
                    script.onload = () => {
                        window.pageAnalyzer = new PageAnalyzer();
                        resolve();
                    };
                });
            }

            const a11yAnalysis = await window.pageAnalyzer.analyzeAccessibility();
            
            // Save to full analysis cache
            const existingAnalysis = await window.electronAPI.pageAnalysis.getAnalysis(window.location.href) || {
                url: window.location.href,
                categories: {}
            };
            existingAnalysis.categories.accessibility = a11yAnalysis;
            await window.electronAPI.pageAnalysis.saveAnalysis(window.location.href, existingAnalysis);
            
            this.browser.showCategoryAnalysis('accessibility', a11yAnalysis);
            return `Accessibility analysis complete. Score: ${a11yAnalysis.score}/100`;
        } catch (error) {
            console.error('Accessibility analysis error:', error);
            return `Accessibility analysis failed: ${error.message}`;
        }
    }

    async handlePerformanceAnalysis(args, flags, context) {
        try {
            if (!window.pageAnalyzer) {
                const script = document.createElement('script');
                script.src = './PageAnalyzer.js';
                document.head.appendChild(script);
                
                await new Promise((resolve) => {
                    script.onload = () => {
                        window.pageAnalyzer = new PageAnalyzer();
                        resolve();
                    };
                });
            }

            const perfAnalysis = await window.pageAnalyzer.analyzePerformance();
            
            // Save to full analysis cache
            const existingAnalysis = await window.electronAPI.pageAnalysis.getAnalysis(window.location.href) || {
                url: window.location.href,
                categories: {}
            };
            existingAnalysis.categories.performance = perfAnalysis;
            await window.electronAPI.pageAnalysis.saveAnalysis(window.location.href, existingAnalysis);
            
            this.browser.showCategoryAnalysis('performance', perfAnalysis);
            return `Performance analysis complete. Score: ${perfAnalysis.score}/100`;
        } catch (error) {
            console.error('Performance analysis error:', error);
            return `Performance analysis failed: ${error.message}`;
        }
    }

    async handleReadabilityAnalysis(args, flags, context) {
        try {
            if (!window.pageAnalyzer) {
                const script = document.createElement('script');
                script.src = './PageAnalyzer.js';
                document.head.appendChild(script);
                
                await new Promise((resolve) => {
                    script.onload = () => {
                        window.pageAnalyzer = new PageAnalyzer();
                        resolve();
                    };
                });
            }

            const readabilityAnalysis = await window.pageAnalyzer.analyzeReadability();
            
            // Save to full analysis cache
            const existingAnalysis = await window.electronAPI.pageAnalysis.getAnalysis(window.location.href) || {
                url: window.location.href,
                categories: {}
            };
            existingAnalysis.categories.readability = readabilityAnalysis;
            await window.electronAPI.pageAnalysis.saveAnalysis(window.location.href, existingAnalysis);
            
            this.browser.showCategoryAnalysis('readability', readabilityAnalysis);
            return `Readability analysis complete. Score: ${readabilityAnalysis.score}/100 (${readabilityAnalysis.metrics.flesch?.level || 'Unknown'})`;
        } catch (error) {
            console.error('Readability analysis error:', error);
            return `Readability analysis failed: ${error.message}`;
        }
    }

    /**
     * Get commands by category
     */
    getCommandsByCategory(category) {
        const commands = [];
        this.commands.forEach((command, name) => {
            if ((command.category || 'other') === category) {
                commands.push({ name, ...command });
            }
        });
        return commands;
    }
}

// Export for use in main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CommandParser;
}