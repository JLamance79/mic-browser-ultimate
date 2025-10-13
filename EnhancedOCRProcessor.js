/**
 * Enhanced OCR Processor for MIC Browser Ultimate
 * Advanced document scanning with preprocessing, multiple engines, and result optimization
 */

const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

class EnhancedOCRProcessor {
    constructor(options = {}) {
        this.options = {
            // Engine settings
            engineMode: options.engineMode || Tesseract.OEM.LSTM_ONLY,
            
            // Language settings
            defaultLanguage: options.defaultLanguage || 'eng',
            supportedLanguages: options.supportedLanguages || [
                'eng', 'spa', 'fra', 'deu', 'ita', 'por', 'rus',
                'chi_sim', 'chi_tra', 'jpn', 'kor', 'ara', 'hin'
            ],
            
            // Performance settings
            maxImageSize: options.maxImageSize || 4096, // Max width/height
            jpegQuality: options.jpegQuality || 95,
            preprocessImages: options.preprocessImages !== false,
            
            // Result settings
            minConfidence: options.minConfidence || 0.60,
            preserveFormatting: options.preserveFormatting !== false,
            
            // Debug settings
            debug: options.debug || false,
            savePreprocessed: options.savePreprocessed || false
        };
        
        this.workers = new Map(); // Language-specific workers
        this.processingQueue = [];
        this.isInitialized = false;
        this.progressCallback = null;
    }

    /**
     * Initialize OCR workers for specified languages
     */
    async initialize(languages = [this.options.defaultLanguage]) {
        try {
            this.log('Initializing Enhanced OCR Processor...');
            
            for (const lang of languages) {
                await this.initializeWorker(lang);
            }
            
            this.isInitialized = true;
            this.log(`OCR Processor initialized with ${languages.length} language(s)`);
            
            return { success: true };
        } catch (error) {
            this.log(`OCR initialization failed: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }

    /**
     * Initialize a worker for a specific language
     */
    async initializeWorker(language) {
        if (this.workers.has(language)) {
            return this.workers.get(language);
        }

        this.log(`Initializing ${language} OCR worker...`);
        
        try {
            const worker = await Tesseract.createWorker();

            // Reinitialize worker for the specific language with timeout
            await Promise.race([
                worker.reinitialize([language]),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error(`Worker initialization timeout for ${language}`)), 30000)
                )
            ]);
            
            // Set runtime parameters (excluding initialization-only parameters)
            try {
                await worker.setParameters({
                    preserve_interword_spaces: '1',
                    tessedit_pageseg_mode: Tesseract.PSM.AUTO,
                    tessedit_char_whitelist: '', // Allow all characters by default
                    tessedit_char_blacklist: '', // No blacklist by default
                });
            } catch (paramError) {
                this.log(`Parameter setting failed for ${language}, continuing with defaults: ${paramError.message}`, 'warn');
            }

            this.workers.set(language, worker);
            this.log(`${language} worker initialized successfully`);
            
            return worker;
        } catch (error) {
            this.log(`Failed to initialize ${language} worker: ${error.message}`, 'error');
            throw new Error(`OCR worker initialization failed for ${language}: ${error.message}`);
        }
    }

    /**
     * Enhanced image preprocessing for better OCR accuracy
     */
    async preprocessImage(imageBuffer, options = {}) {
        try {
            const preprocessing = {
                enhance: options.enhance !== false,
                denoise: options.denoise !== false,
                deskew: options.deskew !== false,
                sharpen: options.sharpen !== false,
                contrast: options.contrast !== false,
                ...options
            };

            let image = sharp(imageBuffer);
            
            // Get image metadata
            const metadata = await image.metadata();
            this.log(`Original image: ${metadata.width}x${metadata.height}, format: ${metadata.format}`);

            // Resize if too large
            if (metadata.width > this.options.maxImageSize || metadata.height > this.options.maxImageSize) {
                image = image.resize(this.options.maxImageSize, this.options.maxImageSize, {
                    fit: 'inside',
                    withoutEnlargement: true
                });
                this.log('Image resized for optimal processing');
            }

            // Convert to grayscale for better OCR
            if (preprocessing.enhance) {
                image = image.grayscale();
            }

            // Enhance contrast
            if (preprocessing.contrast) {
                image = image.normalize().linear(1.2, -(128 * 1.2) + 128);
            }

            // Sharpen for text clarity
            if (preprocessing.sharpen) {
                image = image.sharpen(1.0, 1.0, 1.5);
            }

            // Denoise
            if (preprocessing.denoise) {
                image = image.median(1);
            }

            // Convert to PNG for best OCR results
            const processedBuffer = await image
                .png({ quality: 100, compressionLevel: 0 })
                .toBuffer();

            // Save preprocessed image for debugging if enabled
            if (this.options.savePreprocessed) {
                const debugPath = path.join(__dirname, 'debug_preprocessed.png');
                await fs.promises.writeFile(debugPath, processedBuffer);
                this.log(`Preprocessed image saved to: ${debugPath}`);
            }

            this.log('Image preprocessing completed');
            return processedBuffer;

        } catch (error) {
            this.log(`Image preprocessing failed: ${error.message}`, 'error');
            return imageBuffer; // Return original if preprocessing fails
        }
    }

    /**
     * Process document with enhanced OCR
     */
    async processDocument(imageData, options = {}) {
        try {
            const processingOptions = {
                language: options.language || this.options.defaultLanguage,
                psm: options.psm || Tesseract.PSM.AUTO,
                preprocessImage: options.preprocessImage !== false,
                enhanceResults: options.enhanceResults !== false,
                detectOrientation: options.detectOrientation !== false,
                ...options
            };

            this.log(`Starting document processing with language: ${processingOptions.language}`);

            // Ensure worker is initialized for the requested language
            if (!this.workers.has(processingOptions.language)) {
                await this.initializeWorker(processingOptions.language);
            }

            const worker = this.workers.get(processingOptions.language);

            // Convert image data to buffer
            let imageBuffer;
            if (typeof imageData === 'string') {
                // Data URL
                const base64Data = imageData.split(',')[1];
                imageBuffer = Buffer.from(base64Data, 'base64');
            } else {
                imageBuffer = imageData;
            }

            // Preprocess image if enabled
            if (processingOptions.preprocessImage) {
                imageBuffer = await this.preprocessImage(imageBuffer, processingOptions);
            }

            // Set PSM mode for this recognition
            try {
                await worker.setParameters({
                    tessedit_pageseg_mode: processingOptions.psm
                });
            } catch (paramError) {
                this.log(`Failed to set PSM mode, using default: ${paramError.message}`, 'warn');
            }

            // Perform OCR with timeout and error handling
            const startTime = Date.now();
            let result;
            try {
                result = await Promise.race([
                    worker.recognize(imageBuffer),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('OCR processing timeout')), 60000)
                    )
                ]);
            } catch (ocrError) {
                throw new Error(`OCR recognition failed: ${ocrError.message}`);
            }
            const processingTime = Date.now() - startTime;

            // Enhance results
            let enhancedResult = result.data;
            if (processingOptions.enhanceResults) {
                enhancedResult = await this.enhanceResults(result.data, processingOptions);
            }

            this.log(`OCR completed in ${processingTime}ms with ${enhancedResult.confidence.toFixed(2)}% confidence`);

            return {
                success: true,
                text: enhancedResult.text,
                confidence: enhancedResult.confidence,
                words: enhancedResult.words,
                lines: enhancedResult.lines,
                paragraphs: enhancedResult.paragraphs,
                blocks: enhancedResult.blocks,
                symbols: enhancedResult.symbols,
                processingTime,
                language: processingOptions.language,
                psm: processingOptions.psm,
                metadata: {
                    wordCount: enhancedResult.words ? enhancedResult.words.length : 0,
                    lineCount: enhancedResult.lines ? enhancedResult.lines.length : 0,
                    averageWordConfidence: this.calculateAverageWordConfidence(enhancedResult.words),
                    preprocessed: processingOptions.preprocessImage
                }
            };

        } catch (error) {
            this.log(`Document processing failed: ${error.message}`, 'error');
            return {
                success: false,
                error: error.message,
                details: error.stack
            };
        }
    }

    /**
     * Enhance OCR results with post-processing
     */
    async enhanceResults(ocrData, options = {}) {
        try {
            let enhancedData = { ...ocrData };

            // Filter low-confidence results
            if (options.filterLowConfidence !== false && enhancedData.words) {
                enhancedData.words = enhancedData.words.filter(word => 
                    word.confidence >= this.options.minConfidence * 100
                );
            }

            // Fix common OCR errors
            if (options.fixCommonErrors !== false) {
                enhancedData.text = this.fixCommonOCRErrors(enhancedData.text);
            }

            // Preserve formatting
            if (options.preserveFormatting !== false) {
                enhancedData.text = this.preserveFormatting(enhancedData);
            }

            return enhancedData;

        } catch (error) {
            this.log(`Result enhancement failed: ${error.message}`, 'error');
            return ocrData; // Return original if enhancement fails
        }
    }

    /**
     * Fix common OCR recognition errors
     */
    fixCommonOCRErrors(text) {
        const corrections = [
            // Common character substitutions
            [/\|/g, 'I'],              // Pipe to I
            [/0/g, 'O'],               // Zero to O (in appropriate contexts)
            [/5/g, 'S'],               // 5 to S (in appropriate contexts)
            [/1/g, 'l'],               // 1 to l (in appropriate contexts)
            [/rn/g, 'm'],              // rn to m
            [/vv/g, 'w'],              // vv to w
            [/\s+/g, ' '],             // Multiple spaces to single space
            [/^\s+|\s+$/g, ''],        // Trim whitespace
        ];

        let correctedText = text;
        for (const [pattern, replacement] of corrections) {
            correctedText = correctedText.replace(pattern, replacement);
        }

        return correctedText;
    }

    /**
     * Preserve document formatting based on OCR structure
     */
    preserveFormatting(ocrData) {
        if (!ocrData.paragraphs) return ocrData.text;

        let formattedText = '';
        
        for (const paragraph of ocrData.paragraphs) {
            if (paragraph.lines) {
                for (const line of paragraph.lines) {
                    if (line.words) {
                        const lineText = line.words.map(word => word.text).join(' ');
                        formattedText += lineText + '\n';
                    }
                }
                formattedText += '\n'; // Extra line break between paragraphs
            }
        }

        return formattedText.trim();
    }

    /**
     * Calculate average word confidence
     */
    calculateAverageWordConfidence(words) {
        if (!words || words.length === 0) return 0;
        
        const totalConfidence = words.reduce((sum, word) => sum + word.confidence, 0);
        return totalConfidence / words.length;
    }

    /**
     * Process multiple documents in batch
     */
    async processBatch(documents, options = {}) {
        const results = [];
        const batchOptions = {
            concurrency: options.concurrency || 2,
            ...options
        };

        this.log(`Processing batch of ${documents.length} documents`);

        // Process documents with limited concurrency
        for (let i = 0; i < documents.length; i += batchOptions.concurrency) {
            const batch = documents.slice(i, i + batchOptions.concurrency);
            const batchPromises = batch.map(async (doc, index) => {
                const docResult = await this.processDocument(doc.data, {
                    ...batchOptions,
                    filename: doc.filename || `document_${i + index + 1}`
                });
                return { ...docResult, filename: doc.filename };
            });

            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
        }

        this.log(`Batch processing completed: ${results.length} documents processed`);
        return results;
    }

    /**
     * Set progress callback
     */
    setProgressCallback(callback) {
        this.progressCallback = callback;
    }

    /**
     * Get available languages
     */
    getAvailableLanguages() {
        return this.options.supportedLanguages;
    }

    /**
     * Cleanup resources
     */
    async cleanup() {
        this.log('Cleaning up OCR workers...');
        
        const cleanupPromises = [];
        for (const [language, worker] of this.workers) {
            cleanupPromises.push(
                Promise.race([
                    worker.terminate(),
                    new Promise((resolve) => setTimeout(resolve, 5000)) // 5s timeout
                ]).then(() => {
                    this.log(`${language} worker terminated`);
                }).catch((error) => {
                    this.log(`Error terminating ${language} worker: ${error.message}`, 'error');
                })
            );
        }
        
        try {
            await Promise.allSettled(cleanupPromises);
        } catch (error) {
            this.log(`Cleanup error: ${error.message}`, 'error');
        }
        
        this.workers.clear();
        this.isInitialized = false;
        this.log('OCR cleanup completed');
    }

    /**
     * Logging utility
     */
    log(message, level = 'info') {
        if (this.options.debug) {
            const timestamp = new Date().toISOString();
            const emoji = {
                info: '📄',
                error: '❌',
                warn: '⚠️',
                success: '✅'
            };
            console.log(`${emoji[level] || '📄'} [OCR] ${timestamp} ${message}`);
        }
    }
}

module.exports = { EnhancedOCRProcessor };