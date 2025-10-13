/**
 * PageAnalyzer - Advanced Page Analysis System for MIC Browser Ultimate
 * Analyzes web pages for content, SEO, accessibility, performance, and insights
 */

class PageAnalyzer {
    constructor() {
        this.analysisCache = new Map();
        this.observers = new Map();
        this.currentAnalysis = null;
        
        this.initializeAnalyzer();
    }

    /**
     * Initialize the page analyzer
     */
    initializeAnalyzer() {
        // Set up mutation observer for dynamic content
        this.setupMutationObserver();
        
        // Set up performance observer
        this.setupPerformanceObserver();
        
        // Initialize analysis categories
        this.analysisCategories = {
            content: true,
            seo: true,
            accessibility: true,
            performance: true,
            security: true,
            social: true,
            technical: true,
            readability: true
        };
    }

    /**
     * Analyze current page or specific URL
     */
    async analyzePage(options = {}) {
        try {
            const analysis = {
                url: window.location.href,
                title: document.title,
                timestamp: new Date().toISOString(),
                categories: {}
            };

            // Run all analysis categories if enabled
            if (this.analysisCategories.content) {
                analysis.categories.content = await this.analyzeContent();
            }
            
            if (this.analysisCategories.seo) {
                analysis.categories.seo = await this.analyzeSEO();
            }
            
            if (this.analysisCategories.accessibility) {
                analysis.categories.accessibility = await this.analyzeAccessibility();
            }
            
            if (this.analysisCategories.performance) {
                analysis.categories.performance = await this.analyzePerformance();
            }
            
            if (this.analysisCategories.security) {
                analysis.categories.security = await this.analyzeSecurity();
            }
            
            if (this.analysisCategories.social) {
                analysis.categories.social = await this.analyzeSocialMedia();
            }
            
            if (this.analysisCategories.technical) {
                analysis.categories.technical = await this.analyzeTechnical();
            }
            
            if (this.analysisCategories.readability) {
                analysis.categories.readability = await this.analyzeReadability();
            }

            // Generate overall score and recommendations
            analysis.overallScore = this.calculateOverallScore(analysis.categories);
            analysis.recommendations = this.generateRecommendations(analysis.categories);
            analysis.insights = this.generateInsights(analysis.categories);

            // Cache the analysis
            this.analysisCache.set(analysis.url, analysis);
            this.currentAnalysis = analysis;

            return analysis;
        } catch (error) {
            console.error('Page analysis failed:', error);
            return {
                success: false,
                error: error.message,
                url: window.location.href,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Analyze extracted page content from webview
     */
    async analyzeExtractedContent(pageContent) {
        try {
            const analysis = {
                url: pageContent.url,
                title: pageContent.title,
                timestamp: new Date().toISOString(),
                categories: {}
            };

            // Analyze content using extracted data
            analysis.categories.content = this.analyzeExtractedContentStructure(pageContent);
            analysis.categories.seo = this.analyzeExtractedSEO(pageContent);
            analysis.categories.accessibility = this.analyzeExtractedAccessibility(pageContent);
            analysis.categories.performance = this.analyzeExtractedPerformance(pageContent);
            analysis.categories.security = this.analyzeExtractedSecurity(pageContent);

            // Generate overall score and recommendations
            analysis.overallScore = this.calculateOverallScore(analysis.categories);
            analysis.recommendations = this.generateRecommendations(analysis.categories);
            analysis.insights = this.generateInsights(analysis.categories);

            // Cache the analysis
            this.analysisCache.set(analysis.url, analysis);
            this.currentAnalysis = analysis;

            return analysis;
        } catch (error) {
            console.error('Extracted content analysis failed:', error);
            return {
                success: false,
                error: error.message,
                url: pageContent.url || 'unknown',
                timestamp: new Date().toISOString(),
                overallScore: 0
            };
        }
    }

    /**
     * Analyze page content structure and quality
     */
    async analyzeContent() {
        const content = {
            score: 0,
            metrics: {},
            issues: [],
            recommendations: []
        };

        try {
            // Text analysis
            const textContent = document.body.textContent || '';
            const wordCount = textContent.trim().split(/\s+/).length;
            const characterCount = textContent.length;
            const paragraphs = document.querySelectorAll('p').length;
            const sentences = textContent.split(/[.!?]+/).filter(s => s.trim().length > 0).length;

            content.metrics = {
                wordCount,
                characterCount,
                paragraphs,
                sentences,
                averageWordsPerSentence: sentences > 0 ? Math.round(wordCount / sentences) : 0,
                averageWordsPerParagraph: paragraphs > 0 ? Math.round(wordCount / paragraphs) : 0
            };

            // Heading structure analysis
            const headings = {
                h1: document.querySelectorAll('h1').length,
                h2: document.querySelectorAll('h2').length,
                h3: document.querySelectorAll('h3').length,
                h4: document.querySelectorAll('h4').length,
                h5: document.querySelectorAll('h5').length,
                h6: document.querySelectorAll('h6').length
            };

            content.metrics.headings = headings;

            // Images analysis
            const images = document.querySelectorAll('img');
            const imagesWithAlt = document.querySelectorAll('img[alt]');
            const imagesWithoutAlt = images.length - imagesWithAlt.length;

            content.metrics.images = {
                total: images.length,
                withAlt: imagesWithAlt.length,
                withoutAlt: imagesWithoutAlt,
                altCoverage: images.length > 0 ? Math.round((imagesWithAlt.length / images.length) * 100) : 100
            };

            // Links analysis
            const links = document.querySelectorAll('a[href]');
            const internalLinks = Array.from(links).filter(link => 
                link.href.startsWith(window.location.origin) || link.href.startsWith('/')
            );
            const externalLinks = links.length - internalLinks.length;

            content.metrics.links = {
                total: links.length,
                internal: internalLinks.length,
                external: externalLinks,
                nofollow: document.querySelectorAll('a[rel*="nofollow"]').length
            };

            // Content quality scoring
            let score = 0;
            
            // Word count scoring
            if (wordCount >= 300) score += 20;
            else if (wordCount >= 150) score += 10;
            
            // Heading structure scoring
            if (headings.h1 === 1) score += 15;
            else if (headings.h1 > 1) content.issues.push('Multiple H1 tags found');
            
            if (headings.h2 > 0) score += 10;
            
            // Image alt text scoring
            if (content.metrics.images.altCoverage >= 90) score += 15;
            else if (content.metrics.images.altCoverage >= 70) score += 10;
            else content.issues.push('Many images missing alt text');
            
            // Paragraph structure
            if (paragraphs >= 3) score += 10;
            
            // Reading flow
            if (content.metrics.averageWordsPerSentence <= 25) score += 10;
            else content.issues.push('Sentences are too long on average');

            content.score = Math.min(score, 100);

            // Generate recommendations
            if (wordCount < 300) {
                content.recommendations.push('Consider adding more content (current: ' + wordCount + ' words)');
            }
            
            if (headings.h1 === 0) {
                content.recommendations.push('Add an H1 heading for better structure');
            }
            
            if (content.metrics.images.altCoverage < 90) {
                content.recommendations.push('Add alt text to all images');
            }

        } catch (error) {
            content.issues.push('Content analysis error: ' + error.message);
        }

        return content;
    }

    /**
     * Analyze SEO factors
     */
    async analyzeSEO() {
        const seo = {
            score: 0,
            metrics: {},
            issues: [],
            recommendations: []
        };

        try {
            // Title analysis
            const title = document.title;
            const titleLength = title.length;
            
            seo.metrics.title = {
                text: title,
                length: titleLength,
                optimal: titleLength >= 30 && titleLength <= 60
            };

            // Meta description
            const metaDesc = document.querySelector('meta[name="description"]');
            const metaDescContent = metaDesc ? metaDesc.getAttribute('content') : '';
            const metaDescLength = metaDescContent.length;

            seo.metrics.metaDescription = {
                text: metaDescContent,
                length: metaDescLength,
                exists: !!metaDesc,
                optimal: metaDescLength >= 120 && metaDescLength <= 160
            };

            // Meta keywords (deprecated but still check)
            const metaKeywords = document.querySelector('meta[name="keywords"]');
            seo.metrics.metaKeywords = {
                exists: !!metaKeywords,
                content: metaKeywords ? metaKeywords.getAttribute('content') : ''
            };

            // Canonical URL
            const canonical = document.querySelector('link[rel="canonical"]');
            seo.metrics.canonical = {
                exists: !!canonical,
                url: canonical ? canonical.getAttribute('href') : ''
            };

            // Open Graph tags
            const ogTags = {};
            const ogElements = document.querySelectorAll('meta[property^="og:"]');
            ogElements.forEach(tag => {
                const property = tag.getAttribute('property');
                const content = tag.getAttribute('content');
                ogTags[property] = content;
            });

            seo.metrics.openGraph = {
                tags: ogTags,
                hasTitle: !!ogTags['og:title'],
                hasDescription: !!ogTags['og:description'],
                hasImage: !!ogTags['og:image'],
                hasUrl: !!ogTags['og:url']
            };

            // Twitter Card tags
            const twitterTags = {};
            const twitterElements = document.querySelectorAll('meta[name^="twitter:"]');
            twitterElements.forEach(tag => {
                const name = tag.getAttribute('name');
                const content = tag.getAttribute('content');
                twitterTags[name] = content;
            });

            seo.metrics.twitterCard = {
                tags: twitterTags,
                hasCard: !!twitterTags['twitter:card'],
                hasTitle: !!twitterTags['twitter:title'],
                hasDescription: !!twitterTags['twitter:description'],
                hasImage: !!twitterTags['twitter:image']
            };

            // Schema.org structured data
            const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
            const structuredData = [];
            jsonLdScripts.forEach(script => {
                try {
                    const data = JSON.parse(script.textContent);
                    structuredData.push(data);
                } catch (e) {
                    // Invalid JSON-LD
                }
            });

            seo.metrics.structuredData = {
                jsonLd: structuredData,
                count: structuredData.length,
                types: structuredData.map(data => data['@type']).filter(Boolean)
            };

            // Robots meta
            const robotsMeta = document.querySelector('meta[name="robots"]');
            seo.metrics.robots = {
                exists: !!robotsMeta,
                content: robotsMeta ? robotsMeta.getAttribute('content') : 'index,follow'
            };

            // Calculate SEO score
            let score = 0;

            // Title scoring
            if (title) {
                if (seo.metrics.title.optimal) score += 20;
                else if (titleLength > 0) score += 10;
            } else {
                seo.issues.push('Missing page title');
            }

            // Meta description scoring
            if (seo.metrics.metaDescription.exists) {
                if (seo.metrics.metaDescription.optimal) score += 20;
                else score += 10;
            } else {
                seo.issues.push('Missing meta description');
            }

            // Headings scoring
            const h1Count = document.querySelectorAll('h1').length;
            if (h1Count === 1) score += 15;
            else if (h1Count === 0) seo.issues.push('Missing H1 heading');
            else seo.issues.push('Multiple H1 headings found');

            // Open Graph scoring
            if (seo.metrics.openGraph.hasTitle && seo.metrics.openGraph.hasDescription) score += 15;
            else seo.recommendations.push('Add Open Graph tags for social sharing');

            // Canonical URL scoring
            if (seo.metrics.canonical.exists) score += 10;
            else seo.recommendations.push('Add canonical URL');

            // Structured data scoring
            if (seo.metrics.structuredData.count > 0) score += 10;
            else seo.recommendations.push('Add structured data markup');

            seo.score = Math.min(score, 100);

            // Generate recommendations
            if (!seo.metrics.title.optimal) {
                seo.recommendations.push('Optimize title length (30-60 characters)');
            }
            
            if (!seo.metrics.metaDescription.optimal) {
                seo.recommendations.push('Optimize meta description (120-160 characters)');
            }

        } catch (error) {
            seo.issues.push('SEO analysis error: ' + error.message);
        }

        return seo;
    }

    /**
     * Analyze accessibility
     */
    async analyzeAccessibility() {
        const accessibility = {
            score: 0,
            metrics: {},
            issues: [],
            recommendations: []
        };

        try {
            // Alt text analysis
            const images = document.querySelectorAll('img');
            const imagesWithoutAlt = Array.from(images).filter(img => !img.hasAttribute('alt'));
            
            accessibility.metrics.images = {
                total: images.length,
                missingAlt: imagesWithoutAlt.length,
                altCoverage: images.length > 0 ? Math.round(((images.length - imagesWithoutAlt.length) / images.length) * 100) : 100
            };

            // Form labels
            const inputs = document.querySelectorAll('input, select, textarea');
            const inputsWithoutLabels = Array.from(inputs).filter(input => {
                const id = input.id;
                const hasLabel = id && document.querySelector(`label[for="${id}"]`);
                const hasAriaLabel = input.hasAttribute('aria-label');
                const hasAriaLabelledBy = input.hasAttribute('aria-labelledby');
                const hasTitle = input.hasAttribute('title');
                
                return !hasLabel && !hasAriaLabel && !hasAriaLabelledBy && !hasTitle;
            });

            accessibility.metrics.forms = {
                totalInputs: inputs.length,
                missingLabels: inputsWithoutLabels.length,
                labelCoverage: inputs.length > 0 ? Math.round(((inputs.length - inputsWithoutLabels.length) / inputs.length) * 100) : 100
            };

            // Heading hierarchy
            const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
            const headingLevels = headings.map(h => parseInt(h.tagName.charAt(1)));
            let hierarchyIssues = 0;
            
            for (let i = 1; i < headingLevels.length; i++) {
                if (headingLevels[i] > headingLevels[i-1] + 1) {
                    hierarchyIssues++;
                }
            }

            accessibility.metrics.headings = {
                total: headings.length,
                hierarchyIssues: hierarchyIssues,
                properHierarchy: hierarchyIssues === 0
            };

            // ARIA attributes
            const elementsWithAria = document.querySelectorAll('*[aria-*]');
            const landmarks = document.querySelectorAll('[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"], [role="complementary"], main, nav, header, footer, aside');

            accessibility.metrics.aria = {
                elementsWithAria: elementsWithAria.length,
                landmarks: landmarks.length,
                hasMainLandmark: document.querySelector('[role="main"], main') !== null
            };

            // Color contrast (basic check for common patterns)
            const contrastIssues = this.checkBasicContrast();
            accessibility.metrics.contrast = {
                potentialIssues: contrastIssues.length,
                issues: contrastIssues
            };

            // Keyboard navigation
            const focusableElements = document.querySelectorAll('a, button, input, select, textarea, [tabindex]');
            const elementsWithTabIndex = document.querySelectorAll('[tabindex]');
            const negativeTabIndex = document.querySelectorAll('[tabindex="-1"]');

            accessibility.metrics.keyboard = {
                focusableElements: focusableElements.length,
                customTabIndex: elementsWithTabIndex.length,
                negativeTabIndex: negativeTabIndex.length
            };

            // Calculate accessibility score
            let score = 0;

            // Alt text scoring
            if (accessibility.metrics.images.altCoverage >= 95) score += 25;
            else if (accessibility.metrics.images.altCoverage >= 80) score += 15;
            else if (accessibility.metrics.images.altCoverage >= 60) score += 5;

            // Form labels scoring
            if (accessibility.metrics.forms.labelCoverage >= 95) score += 25;
            else if (accessibility.metrics.forms.labelCoverage >= 80) score += 15;
            else if (accessibility.metrics.forms.labelCoverage >= 60) score += 5;

            // Heading hierarchy scoring
            if (accessibility.metrics.headings.properHierarchy) score += 20;
            else score += 10;

            // ARIA and landmarks scoring
            if (accessibility.metrics.aria.hasMainLandmark) score += 15;
            if (accessibility.metrics.aria.landmarks >= 3) score += 10;

            // Keyboard navigation scoring
            if (focusableElements.length > 0) score += 15;

            accessibility.score = Math.min(score, 100);

            // Generate issues and recommendations
            if (imagesWithoutAlt.length > 0) {
                accessibility.issues.push(`${imagesWithoutAlt.length} images missing alt text`);
                accessibility.recommendations.push('Add descriptive alt text to all images');
            }

            if (inputsWithoutLabels.length > 0) {
                accessibility.issues.push(`${inputsWithoutLabels.length} form inputs missing labels`);
                accessibility.recommendations.push('Add labels to all form inputs');
            }

            if (hierarchyIssues > 0) {
                accessibility.issues.push('Heading hierarchy has gaps');
                accessibility.recommendations.push('Fix heading hierarchy (don\'t skip levels)');
            }

            if (!accessibility.metrics.aria.hasMainLandmark) {
                accessibility.recommendations.push('Add main landmark for screen readers');
            }

        } catch (error) {
            accessibility.issues.push('Accessibility analysis error: ' + error.message);
        }

        return accessibility;
    }

    /**
     * Analyze page performance
     */
    async analyzePerformance() {
        const performance = {
            score: 0,
            metrics: {},
            issues: [],
            recommendations: []
        };

        try {
            // Get performance timing data
            const perfData = window.performance.timing;
            const navigation = window.performance.getEntriesByType('navigation')[0];
            
            if (navigation) {
                performance.metrics.timing = {
                    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                    loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
                    domInteractive: navigation.domInteractive - navigation.fetchStart,
                    firstPaint: null,
                    firstContentfulPaint: null
                };

                // Get paint timing if available
                const paintEntries = window.performance.getEntriesByType('paint');
                paintEntries.forEach(entry => {
                    if (entry.name === 'first-paint') {
                        performance.metrics.timing.firstPaint = entry.startTime;
                    }
                    if (entry.name === 'first-contentful-paint') {
                        performance.metrics.timing.firstContentfulPaint = entry.startTime;
                    }
                });
            }

            // Analyze resources
            const resources = window.performance.getEntriesByType('resource');
            const resourceAnalysis = {
                total: resources.length,
                images: resources.filter(r => r.initiatorType === 'img').length,
                scripts: resources.filter(r => r.initiatorType === 'script').length,
                stylesheets: resources.filter(r => r.initiatorType === 'link' || r.initiatorType === 'css').length,
                fonts: resources.filter(r => r.initiatorType === 'font' || r.name.includes('.woff')).length,
                totalSize: 0,
                largeResources: []
            };

            // Estimate resource sizes and find large ones
            resources.forEach(resource => {
                if (resource.transferSize) {
                    resourceAnalysis.totalSize += resource.transferSize;
                    if (resource.transferSize > 100000) { // > 100KB
                        resourceAnalysis.largeResources.push({
                            name: resource.name,
                            size: resource.transferSize,
                            type: resource.initiatorType
                        });
                    }
                }
            });

            performance.metrics.resources = resourceAnalysis;

            // DOM analysis
            const domElements = document.querySelectorAll('*').length;
            const domDepth = this.calculateMaxDOMDepth(document.body);
            
            performance.metrics.dom = {
                elements: domElements,
                depth: domDepth,
                excessive: domElements > 1500 || domDepth > 32
            };

            // Memory usage (if available)
            if (window.performance.memory) {
                performance.metrics.memory = {
                    usedJSHeapSize: window.performance.memory.usedJSHeapSize,
                    totalJSHeapSize: window.performance.memory.totalJSHeapSize,
                    jsHeapSizeLimit: window.performance.memory.jsHeapSizeLimit
                };
            }

            // Calculate performance score
            let score = 100;

            // Timing penalties
            if (performance.metrics.timing) {
                if (performance.metrics.timing.domInteractive > 3000) score -= 20;
                else if (performance.metrics.timing.domInteractive > 1500) score -= 10;

                if (performance.metrics.timing.firstContentfulPaint > 2500) score -= 15;
                else if (performance.metrics.timing.firstContentfulPaint > 1500) score -= 5;
            }

            // Resource penalties
            if (resourceAnalysis.total > 100) score -= 10;
            if (resourceAnalysis.largeResources.length > 5) score -= 15;
            if (resourceAnalysis.totalSize > 2000000) score -= 10; // > 2MB

            // DOM penalties
            if (performance.metrics.dom.excessive) score -= 15;

            performance.score = Math.max(score, 0);

            // Generate recommendations
            if (resourceAnalysis.largeResources.length > 0) {
                performance.issues.push(`${resourceAnalysis.largeResources.length} large resources found`);
                performance.recommendations.push('Optimize large resources (images, scripts, etc.)');
            }

            if (performance.metrics.dom.excessive) {
                performance.issues.push('DOM is too large or deep');
                performance.recommendations.push('Reduce DOM complexity');
            }

            if (resourceAnalysis.images > 20) {
                performance.recommendations.push('Consider lazy loading for images');
            }

        } catch (error) {
            performance.issues.push('Performance analysis error: ' + error.message);
        }

        return performance;
    }

    /**
     * Analyze security aspects
     */
    async analyzeSecurity() {
        const security = {
            score: 0,
            metrics: {},
            issues: [],
            recommendations: []
        };

        try {
            // HTTPS check
            const isHTTPS = window.location.protocol === 'https:';
            security.metrics.https = {
                enabled: isHTTPS,
                protocol: window.location.protocol
            };

            // Content Security Policy
            const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
            security.metrics.csp = {
                exists: !!cspMeta,
                content: cspMeta ? cspMeta.getAttribute('content') : null
            };

            // Mixed content check
            const mixedContentIssues = [];
            if (isHTTPS) {
                const httpResources = Array.from(document.querySelectorAll('img, script, link, iframe')).filter(element => {
                    const src = element.src || element.href;
                    return src && src.startsWith('http://');
                });
                
                if (httpResources.length > 0) {
                    mixedContentIssues.push(...httpResources.map(el => el.src || el.href));
                }
            }

            security.metrics.mixedContent = {
                issues: mixedContentIssues,
                count: mixedContentIssues.length
            };

            // Form security
            const forms = document.querySelectorAll('form');
            const insecureForms = Array.from(forms).filter(form => {
                const action = form.getAttribute('action');
                const method = form.getAttribute('method');
                return action && action.startsWith('http://') && method && method.toLowerCase() === 'post';
            });

            security.metrics.forms = {
                total: forms.length,
                insecure: insecureForms.length,
                secure: forms.length - insecureForms.length
            };

            // External scripts and resources
            const externalScripts = Array.from(document.querySelectorAll('script[src]')).filter(script => {
                const src = script.getAttribute('src');
                return src && !src.startsWith(window.location.origin) && !src.startsWith('/');
            });

            security.metrics.externalScripts = {
                count: externalScripts.length,
                scripts: externalScripts.map(script => script.src)
            };

            // Cookie analysis (basic)
            const cookies = document.cookie.split(';').filter(cookie => cookie.trim().length > 0);
            security.metrics.cookies = {
                count: cookies.length,
                present: cookies.length > 0
            };

            // Calculate security score
            let score = 0;

            // HTTPS scoring
            if (isHTTPS) score += 30;
            else security.issues.push('Site not using HTTPS');

            // CSP scoring
            if (security.metrics.csp.exists) score += 20;
            else security.recommendations.push('Implement Content Security Policy');

            // Mixed content scoring
            if (security.metrics.mixedContent.count === 0) score += 20;
            else security.issues.push(`${security.metrics.mixedContent.count} mixed content issues`);

            // Form security scoring
            if (security.metrics.forms.insecure === 0) score += 15;
            else security.issues.push(`${security.metrics.forms.insecure} insecure forms found`);

            // External scripts scoring
            if (security.metrics.externalScripts.count <= 5) score += 15;
            else security.recommendations.push('Minimize external script dependencies');

            security.score = Math.min(score, 100);

            // Generate recommendations
            if (!isHTTPS) {
                security.recommendations.push('Enable HTTPS for secure communication');
            }
            
            if (security.metrics.mixedContent.count > 0) {
                security.recommendations.push('Fix mixed content issues (HTTP resources on HTTPS page)');
            }

        } catch (error) {
            security.issues.push('Security analysis error: ' + error.message);
        }

        return security;
    }

    /**
     * Analyze social media integration
     */
    async analyzeSocialMedia() {
        const social = {
            score: 0,
            metrics: {},
            issues: [],
            recommendations: []
        };

        try {
            // Open Graph tags
            const ogTags = {};
            document.querySelectorAll('meta[property^="og:"]').forEach(meta => {
                ogTags[meta.getAttribute('property')] = meta.getAttribute('content');
            });

            social.metrics.openGraph = {
                tags: ogTags,
                count: Object.keys(ogTags).length,
                hasTitle: !!ogTags['og:title'],
                hasDescription: !!ogTags['og:description'],
                hasImage: !!ogTags['og:image'],
                hasUrl: !!ogTags['og:url'],
                hasType: !!ogTags['og:type']
            };

            // Twitter Card tags
            const twitterTags = {};
            document.querySelectorAll('meta[name^="twitter:"]').forEach(meta => {
                twitterTags[meta.getAttribute('name')] = meta.getAttribute('content');
            });

            social.metrics.twitter = {
                tags: twitterTags,
                count: Object.keys(twitterTags).length,
                hasCard: !!twitterTags['twitter:card'],
                hasTitle: !!twitterTags['twitter:title'],
                hasDescription: !!twitterTags['twitter:description'],
                hasImage: !!twitterTags['twitter:image']
            };

            // Social sharing buttons
            const socialButtons = document.querySelectorAll('a[href*="facebook.com/sharer"], a[href*="twitter.com/intent"], a[href*="linkedin.com/sharing"], a[href*="pinterest.com/pin"]');
            social.metrics.sharingButtons = {
                count: socialButtons.length,
                present: socialButtons.length > 0
            };

            // Calculate social score
            let score = 0;

            // Open Graph scoring
            const ogEssentials = ['og:title', 'og:description', 'og:image'];
            const ogEssentialsPresent = ogEssentials.filter(tag => ogTags[tag]).length;
            score += (ogEssentialsPresent / ogEssentials.length) * 40;

            // Twitter Card scoring
            const twitterEssentials = ['twitter:card', 'twitter:title', 'twitter:description'];
            const twitterEssentialsPresent = twitterEssentials.filter(tag => twitterTags[tag]).length;
            score += (twitterEssentialsPresent / twitterEssentials.length) * 30;

            // Sharing buttons scoring
            if (social.metrics.sharingButtons.present) score += 30;

            social.score = Math.min(score, 100);

            // Generate recommendations
            if (!social.metrics.openGraph.hasTitle) {
                social.recommendations.push('Add Open Graph title tag');
            }
            
            if (!social.metrics.openGraph.hasDescription) {
                social.recommendations.push('Add Open Graph description tag');
            }
            
            if (!social.metrics.openGraph.hasImage) {
                social.recommendations.push('Add Open Graph image tag');
            }
            
            if (!social.metrics.twitter.hasCard) {
                social.recommendations.push('Add Twitter Card meta tags');
            }

        } catch (error) {
            social.issues.push('Social media analysis error: ' + error.message);
        }

        return social;
    }

    /**
     * Analyze technical aspects
     */
    async analyzeTechnical() {
        const technical = {
            score: 0,
            metrics: {},
            issues: [],
            recommendations: []
        };

        try {
            // Doctype check
            const doctype = document.doctype;
            technical.metrics.doctype = {
                exists: !!doctype,
                type: doctype ? doctype.name : null,
                isHTML5: doctype && doctype.name.toLowerCase() === 'html'
            };

            // Language attribute
            const htmlLang = document.documentElement.getAttribute('lang');
            technical.metrics.language = {
                specified: !!htmlLang,
                lang: htmlLang
            };

            // Charset
            const charset = document.characterSet || document.charset;
            technical.metrics.charset = {
                encoding: charset,
                isUTF8: charset && charset.toLowerCase() === 'utf-8'
            };

            // Viewport meta tag
            const viewport = document.querySelector('meta[name="viewport"]');
            technical.metrics.viewport = {
                exists: !!viewport,
                content: viewport ? viewport.getAttribute('content') : null,
                responsive: viewport && viewport.getAttribute('content').includes('width=device-width')
            };

            // Favicon
            const favicon = document.querySelector('link[rel*="icon"]') || document.querySelector('link[rel="shortcut icon"]');
            technical.metrics.favicon = {
                exists: !!favicon,
                href: favicon ? favicon.getAttribute('href') : null
            };

            // JavaScript errors (from console)
            const jsErrors = this.getJavaScriptErrors();
            technical.metrics.javascript = {
                errors: jsErrors,
                errorCount: jsErrors.length
            };

            // HTML validation (basic checks)
            const validationIssues = this.performBasicHTMLValidation();
            technical.metrics.validation = {
                issues: validationIssues,
                issueCount: validationIssues.length
            };

            // Calculate technical score
            let score = 0;

            // Doctype scoring
            if (technical.metrics.doctype.isHTML5) score += 15;
            else if (technical.metrics.doctype.exists) score += 10;

            // Language scoring
            if (technical.metrics.language.specified) score += 10;

            // Charset scoring
            if (technical.metrics.charset.isUTF8) score += 10;

            // Viewport scoring
            if (technical.metrics.viewport.responsive) score += 20;
            else if (technical.metrics.viewport.exists) score += 10;

            // Favicon scoring
            if (technical.metrics.favicon.exists) score += 15;

            // JavaScript errors penalty
            score -= Math.min(jsErrors.length * 5, 20);

            // Validation issues penalty
            score -= Math.min(validationIssues.length * 2, 20);

            technical.score = Math.max(score, 0);

            // Generate recommendations
            if (!technical.metrics.doctype.isHTML5) {
                technical.recommendations.push('Use HTML5 doctype');
            }
            
            if (!technical.metrics.language.specified) {
                technical.recommendations.push('Add lang attribute to html element');
            }
            
            if (!technical.metrics.viewport.responsive) {
                technical.recommendations.push('Add responsive viewport meta tag');
            }
            
            if (!technical.metrics.favicon.exists) {
                technical.recommendations.push('Add favicon');
            }

        } catch (error) {
            technical.issues.push('Technical analysis error: ' + error.message);
        }

        return technical;
    }

    /**
     * Analyze readability
     */
    async analyzeReadability() {
        const readability = {
            score: 0,
            metrics: {},
            issues: [],
            recommendations: []
        };

        try {
            const textContent = document.body.textContent || '';
            const words = textContent.trim().split(/\s+/).filter(word => word.length > 0);
            const sentences = textContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
            const paragraphs = document.querySelectorAll('p').length;

            // Basic metrics
            readability.metrics.basic = {
                wordCount: words.length,
                sentenceCount: sentences.length,
                paragraphCount: paragraphs,
                averageWordsPerSentence: sentences.length > 0 ? Math.round(words.length / sentences.length) : 0,
                averageSentencesPerParagraph: paragraphs > 0 ? Math.round(sentences.length / paragraphs) : 0
            };

            // Flesch Reading Ease (simplified)
            const avgWordsPerSentence = readability.metrics.basic.averageWordsPerSentence;
            const avgSyllablesPerWord = this.estimateAverageSyllables(words);
            
            const fleschScore = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
            const fleschLevel = this.getFleschLevel(fleschScore);

            readability.metrics.flesch = {
                score: Math.round(fleschScore),
                level: fleschLevel,
                avgSyllablesPerWord: Math.round(avgSyllablesPerWord * 10) / 10
            };

            // Text formatting analysis
            const strongElements = document.querySelectorAll('strong, b').length;
            const emElements = document.querySelectorAll('em, i').length;
            const listElements = document.querySelectorAll('ul, ol').length;
            const listItems = document.querySelectorAll('li').length;

            readability.metrics.formatting = {
                strongText: strongElements,
                emphasizedText: emElements,
                lists: listElements,
                listItems: listItems,
                hasFormatting: strongElements > 0 || emElements > 0 || listElements > 0
            };

            // Calculate readability score
            let score = 0;

            // Flesch score conversion (0-100 scale)
            if (fleschScore >= 90) score += 40;
            else if (fleschScore >= 80) score += 35;
            else if (fleschScore >= 70) score += 30;
            else if (fleschScore >= 60) score += 25;
            else if (fleschScore >= 50) score += 20;
            else if (fleschScore >= 30) score += 15;
            else score += 10;

            // Sentence length scoring
            if (avgWordsPerSentence <= 20) score += 20;
            else if (avgWordsPerSentence <= 25) score += 15;
            else if (avgWordsPerSentence <= 30) score += 10;

            // Paragraph structure scoring
            if (paragraphs >= 3) score += 20;
            else if (paragraphs >= 1) score += 10;

            // Formatting scoring
            if (readability.metrics.formatting.hasFormatting) score += 20;

            readability.score = Math.min(score, 100);

            // Generate recommendations
            if (avgWordsPerSentence > 25) {
                readability.issues.push('Sentences are too long on average');
                readability.recommendations.push('Break up long sentences for better readability');
            }
            
            if (fleschScore < 60) {
                readability.recommendations.push('Simplify language for better readability');
            }
            
            if (paragraphs < 3) {
                readability.recommendations.push('Break content into more paragraphs');
            }
            
            if (!readability.metrics.formatting.hasFormatting) {
                readability.recommendations.push('Use formatting (bold, italic, lists) to improve readability');
            }

        } catch (error) {
            readability.issues.push('Readability analysis error: ' + error.message);
        }

        return readability;
    }

    /**
     * Helper methods
     */
    calculateMaxDOMDepth(element, depth = 0) {
        if (!element.children || element.children.length === 0) {
            return depth;
        }
        
        let maxDepth = depth;
        for (let child of element.children) {
            const childDepth = this.calculateMaxDOMDepth(child, depth + 1);
            maxDepth = Math.max(maxDepth, childDepth);
        }
        
        return maxDepth;
    }

    checkBasicContrast() {
        // This is a simplified contrast check
        const issues = [];
        const elementsToCheck = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, a, button');
        
        // This would need a more sophisticated implementation in a real scenario
        // For now, just return empty array
        return issues;
    }

    getJavaScriptErrors() {
        // In a real implementation, you'd capture console errors
        // For this demo, return empty array
        return [];
    }

    performBasicHTMLValidation() {
        const issues = [];
        
        // Check for common validation issues
        const imgsWithoutAlt = document.querySelectorAll('img:not([alt])');
        if (imgsWithoutAlt.length > 0) {
            issues.push(`${imgsWithoutAlt.length} images without alt attributes`);
        }
        
        const linksWithoutHref = document.querySelectorAll('a:not([href])');
        if (linksWithoutHref.length > 0) {
            issues.push(`${linksWithoutHref.length} links without href attributes`);
        }
        
        return issues;
    }

    estimateAverageSyllables(words) {
        if (words.length === 0) return 0;
        
        let totalSyllables = 0;
        words.forEach(word => {
            totalSyllables += this.countSyllables(word);
        });
        
        return totalSyllables / words.length;
    }

    countSyllables(word) {
        // Simple syllable counting algorithm
        word = word.toLowerCase();
        if (word.length <= 3) return 1;
        
        word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
        word = word.replace(/^y/, '');
        const matches = word.match(/[aeiouy]{1,2}/g);
        
        return matches ? matches.length : 1;
    }

    getFleschLevel(score) {
        if (score >= 90) return 'Very Easy';
        if (score >= 80) return 'Easy';
        if (score >= 70) return 'Fairly Easy';
        if (score >= 60) return 'Standard';
        if (score >= 50) return 'Fairly Difficult';
        if (score >= 30) return 'Difficult';
        return 'Very Difficult';
    }

    calculateOverallScore(categories) {
        const scores = Object.values(categories).map(cat => cat.score || 0);
        return scores.length > 0 ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
    }

    generateRecommendations(categories) {
        const allRecommendations = [];
        Object.values(categories).forEach(category => {
            if (category.recommendations) {
                allRecommendations.push(...category.recommendations);
            }
        });
        
        // Return top 10 most important recommendations
        return allRecommendations.slice(0, 10);
    }

    generateInsights(categories) {
        const insights = [];
        
        // Generate insights based on analysis results
        const overallScore = this.calculateOverallScore(categories);
        
        if (overallScore >= 80) {
            insights.push('This page follows most web best practices');
        } else if (overallScore >= 60) {
            insights.push('This page has room for improvement in several areas');
        } else {
            insights.push('This page needs significant optimization');
        }
        
        // Category-specific insights
        if (categories.seo && categories.seo.score < 50) {
            insights.push('SEO optimization is needed for better search visibility');
        }
        
        if (categories.accessibility && categories.accessibility.score < 50) {
            insights.push('Accessibility improvements needed for better user experience');
        }
        
        if (categories.performance && categories.performance.score < 50) {
            insights.push('Performance optimization could significantly improve user experience');
        }
        
        return insights;
    }

    setupMutationObserver() {
        // Set up observer for dynamic content changes
        const observer = new MutationObserver((mutations) => {
            // Invalidate cache if significant changes occur
            if (mutations.length > 10) {
                this.analysisCache.clear();
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true
        });
        
        this.observers.set('mutation', observer);
    }

    setupPerformanceObserver() {
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    // Track performance entries for analysis
                });
                
                observer.observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
                this.observers.set('performance', observer);
            } catch (error) {
                console.warn('Performance observer not supported:', error);
            }
        }
    }

    /**
     * Get current analysis or run new analysis
     */
    getCurrentAnalysis() {
        return this.currentAnalysis;
    }

    /**
     * Clear analysis cache
     */
    clearCache() {
        this.analysisCache.clear();
    }

    /**
     * Export analysis data
     */
    exportAnalysis(format = 'json') {
        if (!this.currentAnalysis) return null;
        
        if (format === 'json') {
            return JSON.stringify(this.currentAnalysis, null, 2);
        }
        
        // Could add other formats like CSV, HTML report, etc.
        return this.currentAnalysis;
    }

    /**
     * Analyze extracted content structure
     */
    analyzeExtractedContentStructure(pageContent) {
        const content = {
            score: 0,
            metrics: {},
            issues: [],
            recommendations: []
        };

        try {
            // Text analysis
            const wordCount = pageContent.text ? pageContent.text.trim().split(/\s+/).length : 0;
            const characterCount = pageContent.text ? pageContent.text.length : 0;
            
            content.metrics.wordCount = wordCount;
            content.metrics.characterCount = characterCount;

            // Heading analysis
            const headingCounts = {};
            pageContent.headings.forEach(h => {
                headingCounts[h.tag] = (headingCounts[h.tag] || 0) + 1;
            });
            content.metrics.headings = headingCounts;

            // Image analysis
            const totalImages = pageContent.images.length;
            const imagesWithAlt = pageContent.images.filter(img => img.alt).length;
            content.metrics.images = {
                total: totalImages,
                withAlt: imagesWithAlt,
                altCoverage: totalImages > 0 ? Math.round((imagesWithAlt / totalImages) * 100) : 100
            };

            // Scoring
            let score = 0;
            if (wordCount >= 300) score += 20;
            else if (wordCount >= 150) score += 10;

            if (headingCounts.h1 === 1) score += 15;
            if (headingCounts.h2 > 0) score += 10;
            if (content.metrics.images.altCoverage >= 90) score += 15;

            content.score = Math.min(score, 100);

            // Recommendations
            if (wordCount < 300) {
                content.recommendations.push('Consider adding more content (aim for 300+ words)');
            }
            if (headingCounts.h1 !== 1) {
                content.recommendations.push('Page should have exactly one H1 heading');
            }
            if (content.metrics.images.altCoverage < 90) {
                content.recommendations.push('Add alt text to all images for better accessibility');
            }

        } catch (error) {
            console.error('Content structure analysis failed:', error);
        }

        return content;
    }

    /**
     * Analyze extracted SEO data
     */
    analyzeExtractedSEO(pageContent) {
        const seo = {
            score: 0,
            metrics: {},
            issues: [],
            recommendations: []
        };

        try {
            // Title analysis
            const titleLength = pageContent.title ? pageContent.title.length : 0;
            seo.metrics.title = {
                length: titleLength,
                optimal: titleLength >= 30 && titleLength <= 60
            };

            // Meta description analysis
            const metaDesc = pageContent.meta.find(m => m.name === 'description');
            const descLength = metaDesc ? metaDesc.content.length : 0;
            seo.metrics.metaDescription = {
                length: descLength,
                optimal: descLength >= 120 && descLength <= 160,
                present: !!metaDesc
            };

            // Scoring
            let score = 0;
            if (seo.metrics.title.optimal) score += 25;
            else if (titleLength > 0) score += 10;

            if (seo.metrics.metaDescription.optimal) score += 25;
            else if (seo.metrics.metaDescription.present) score += 10;

            if (pageContent.headings.length > 0) score += 20;
            if (pageContent.images.filter(img => img.alt).length > 0) score += 15;
            if (pageContent.links.length > 0) score += 15;

            seo.score = Math.min(score, 100);

            // Recommendations
            if (!seo.metrics.title.optimal) {
                seo.recommendations.push('Optimize title length (30-60 characters)');
            }
            if (!seo.metrics.metaDescription.optimal) {
                seo.recommendations.push('Add meta description (120-160 characters)');
            }

        } catch (error) {
            console.error('SEO analysis failed:', error);
        }

        return seo;
    }

    /**
     * Analyze extracted accessibility data
     */
    analyzeExtractedAccessibility(pageContent) {
        const accessibility = {
            score: 0,
            metrics: {},
            issues: [],
            recommendations: []
        };

        try {
            // Image alt text coverage
            const imagesWithAlt = pageContent.images.filter(img => img.alt).length;
            const altCoverage = pageContent.images.length > 0 ? (imagesWithAlt / pageContent.images.length) * 100 : 100;

            // Heading structure
            const hasH1 = pageContent.headings.some(h => h.tag === 'h1');
            const headingStructure = pageContent.headings.length > 0;

            accessibility.metrics = {
                altTextCoverage: Math.round(altCoverage),
                hasH1: hasH1,
                headingStructure: headingStructure
            };

            // Scoring
            let score = 0;
            if (altCoverage >= 90) score += 40;
            else if (altCoverage >= 70) score += 20;

            if (hasH1) score += 30;
            if (headingStructure) score += 30;

            accessibility.score = Math.min(score, 100);

            // Recommendations
            if (altCoverage < 90) {
                accessibility.recommendations.push('Add alt text to all images');
            }
            if (!hasH1) {
                accessibility.recommendations.push('Add an H1 heading to the page');
            }

        } catch (error) {
            console.error('Accessibility analysis failed:', error);
        }

        return accessibility;
    }

    /**
     * Analyze extracted performance data
     */
    analyzeExtractedPerformance(pageContent) {
        const performance = {
            score: 75, // Default score since we can't measure from extracted content
            metrics: {
                imageCount: pageContent.images.length,
                linkCount: pageContent.links.length,
                contentSize: pageContent.html ? pageContent.html.length : 0
            },
            issues: [],
            recommendations: []
        };

        // Basic performance recommendations
        if (pageContent.images.length > 20) {
            performance.recommendations.push('Consider optimizing or lazy-loading images');
            performance.score -= 10;
        }

        return performance;
    }

    /**
     * Analyze extracted security data
     */
    analyzeExtractedSecurity(pageContent) {
        const security = {
            score: 80, // Default score
            metrics: {
                httpsLinks: pageContent.links.filter(link => link.href.startsWith('https:')).length,
                externalLinks: pageContent.links.filter(link => !link.href.includes(pageContent.url)).length
            },
            issues: [],
            recommendations: []
        };

        return security;
    }
}

// Initialize page analyzer when DOM is ready
if (typeof window !== 'undefined') {
    window.PageAnalyzer = PageAnalyzer;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PageAnalyzer;
}