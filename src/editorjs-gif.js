/**
 * EditorJS GIF Plugin
 * 
 * A customizable GIF search plugin for EditorJS that allows users to search and embed GIFs
 * from any GIF provider through a secure server-side API endpoint.
 * 
 * SECURITY NOTE: This plugin requires a server-side proxy to handle GIF API requests.
 * Never expose GIF provider API keys in client-side code.
 * 
 * @author Jing Jun Ma
 * @license MIT
 */

class EditorJSGifPlugin {
    static instanceCounter = 0;

    constructor({ data, api, config, readOnly }) {
        this.data = data;
        this.api = api;
        this.config = this.mergeConfig(config);
        this.container = null;
        this.instanceId = `editorjs-gif-${EditorJSGifPlugin.instanceCounter++}`;
        this.readOnly = readOnly;
        
        // For cleanup and debouncing
        this.wheelHandler = null;
        this.searchTimeout = null;
        this.eventListeners = new Map(); // Track event listeners for cleanup
    }

    /**
     * Merge user config with defaults
     */
    mergeConfig(config = {}) {
        return {
            // API Configuration
            endpoint: config.endpoint || null, // Required: Server-side API endpoint for GIF search
            limit: config.limit || 15, // Number of GIFs to fetch per search
            
            // UI Configuration
            placeholder: config.placeholder || 'Search for GIFs...',
            buttonText: config.buttonText || 'Search',
            removeButtonText: config.removeButtonText || 'Remove GIF',
            poweredByText: config.poweredByText || '', // Optional branding text
            
            // Response Configuration
            responseParser: config.responseParser || this.defaultResponseParser,
            
            // Display Configuration
            previewHeight: config.previewHeight || 200, // Height of preview GIFs
            enableHorizontalScroll: config.enableHorizontalScroll !== false, // Default true
            
            // Search Configuration
            debounceDelay: config.debounceDelay || 300, // Debounce delay in milliseconds
            
            // Additional headers for API requests
            headers: config.headers || {},
            
            ...config
        };
    }

    /**
     * Default response parser for Tenor API format
     * Users can override this to handle different API response formats
     */
    defaultResponseParser(response) {
        // Default expects Tenor API format
        if (response.results) {
            return response.results.map(gif => ({
                id: gif.id,
                previewUrl: gif.media_formats?.tinygif?.url || gif.media_formats?.gif?.url,
                fullUrl: gif.media_formats?.gif?.url,
                width: gif.media_formats?.gif?.dims?.[0],
                height: gif.media_formats?.gif?.dims?.[1],
                title: gif.content_description || gif.title || '',
                alt: gif.content_description || gif.title || 'GIF'
            }));
        }
        
        // Fallback for simple array format
        return response.map(gif => ({
            id: gif.id || Math.random().toString(36),
            previewUrl: gif.preview_url || gif.url,
            fullUrl: gif.url,
            width: gif.width,
            height: gif.height,
            title: gif.title || '',
            alt: gif.alt || gif.title || 'GIF'
        }));
    }

    static get toolbox() {
        return {
            title: 'GIF',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm0-560v560-560Zm140 360h40q17 0 28.5-11.5T420-440v-20q0-8-6-14t-14-6q-8 0-14 6t-6 14v20h-40v-80h60q8 0 14-6t6-14q0-8-6-14t-14-6h-60q-17 0-28.5 11.5T300-520v80q0 17 11.5 28.5T340-400Zm140 0q8 0 14-6t6-14v-120q0-8-6-14t-14-6q-8 0-14 6t-6 14v120q0 8 6 14t14 6Zm80 0q8 0 14-6t6-14v-40h40q8 0 14-6t6-14q0-8-6-14t-14-6h-40v-20h60q8 0 14-6t6-14q0-8-6-14t-14-6h-80q-8 0-14 6t-6 14v120q0 8 6 14t14 6Z"/></svg>'
        };
    }

    render() {
        if (!this.config.endpoint) {
            return this.renderError('GIF Plugin Error: No server-side endpoint configured. Please set up a secure API proxy first.');
        }

        this.container = document.createElement('div');
        this.container.id = this.instanceId;
        this.container.classList.add('editorjs-gif-plugin');

        if (this.data && this.data.url) {
            this.renderSelectedGif();
        } else {
            this.renderSearchInterface();
        }

        return this.container;
    }

    renderError(message) {
        const errorContainer = document.createElement('div');
        errorContainer.classList.add('editorjs-gif-plugin', 'editorjs-gif-error');
        errorContainer.style.cssText = 'padding: 1em; border: 1px solid #ff4757; background: #ffe6e6; border-radius: 4px; color: #c44569;';
        errorContainer.textContent = message;
        return errorContainer;
    }

    renderSearchInterface() {
        this.container.style.display = 'flex';

        const searchWrapper = document.createElement('div');
        searchWrapper.classList.add('editorjs-gif-search-wrapper');
        
        const input = document.createElement('input');
        input.placeholder = this.config.placeholder;
        input.type = 'text';
        input.classList.add('editorjs-gif-search-input');
        
        const searchButton = document.createElement('button');
        searchButton.textContent = this.config.buttonText;
        searchButton.type = 'button';
        searchButton.classList.add('editorjs-gif-search-button');
        
        const gifContainer = document.createElement('div');
        gifContainer.id = `${this.instanceId}-container`;
        gifContainer.classList.add('editorjs-gif-container');
        
        const gifWrapper = document.createElement('div');
        gifWrapper.id = `${this.instanceId}-wrapper`;
        gifWrapper.classList.add('editorjs-gif-wrapper');

        // Create loader element
        const loader = document.createElement('div');
        loader.classList.add('editorjs-gif-loader');
        loader.style.display = 'none';

        // Add event listeners with tracking for cleanup
        const searchButtonHandler = () => this.searchGifs(input.value, gifWrapper, loader);
        const inputKeydownHandler = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.searchGifs(input.value, gifWrapper, loader);
            }
        };
        const inputHandler = () => this.debouncedSearch(input.value, gifWrapper, loader);
        
        searchButton.addEventListener('click', searchButtonHandler);
        input.addEventListener('keydown', inputKeydownHandler);
        input.addEventListener('input', inputHandler);
        
        // Track event listeners for cleanup
        this.eventListeners.set(searchButton, [['click', searchButtonHandler]]);
        this.eventListeners.set(input, [
            ['keydown', inputKeydownHandler],
            ['input', inputHandler]
        ]);

        // Build DOM
        searchWrapper.appendChild(input);
        gifContainer.appendChild(gifWrapper);
        searchWrapper.appendChild(gifContainer);
        searchWrapper.appendChild(searchButton);

        this.container.appendChild(searchWrapper);
        
        // Add powered by text if configured
        if (this.config.poweredByText) {
            const poweredBy = document.createElement('p');
            poweredBy.classList.add('editorjs-gif-powered-by');
            poweredBy.textContent = this.config.poweredByText;
            this.container.appendChild(poweredBy);
        }
        
        this.container.appendChild(loader);

        // Add styles
        this.addStyles();
    }

    addStyles() {
        if (document.getElementById('editorjs-gif-plugin-styles')) {
            return; // Styles already added
        }

        const style = document.createElement('style');
        style.id = 'editorjs-gif-plugin-styles';
        style.textContent = `
            .editorjs-gif-plugin {
                display: flex;
                flex-direction: column;
                gap: 8px;
                margin-bottom: 1em;
            }

            .editorjs-gif-plugin img {
                display: block;
            }

            .editorjs-gif-search-wrapper {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .editorjs-gif-search-input {
                width: 100%;
                padding: 8px 12px;
                border: 1px solid #ccc;
                border-radius: 4px;
                font-size: 14px;
            }

            .editorjs-gif-search-button {
                padding: 8px 16px;
                background: #3498db;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
            }

            .editorjs-gif-search-button:hover {
                background: #2980b9;
            }

            .editorjs-gif-container {
                display: none;
                border: 1px solid #ccc;
                padding: 0.75em 0.75em 0 0.75em;
                overflow-x: auto;
                overscroll-behavior-x: contain;
                -webkit-overflow-scrolling: touch;
            }

            .editorjs-gif-wrapper {
                display: flex;
                gap: 8px;
                flex-wrap: nowrap;
                padding-bottom: 0.5em;
            }

            .editorjs-gif-wrapper > img {
                border-radius: 0.5em;
                cursor: pointer;
                object-fit: contain;
                height: ${this.config.previewHeight}px;
                flex-shrink: 0;
                -webkit-user-drag: none;
                -khtml-user-drag: none;
                -moz-user-drag: none;
                -o-user-drag: none;
                user-drag: none;
                pointer-events: auto;
            }

            .editorjs-gif-wrapper > img:hover {
                opacity: 0.8;
            }

            .editorjs-gif-remove-btn {
                margin-top: 0.5em;
                cursor: pointer;
                color: #666;
                font-size: 12px;
                text-decoration: underline;
            }

            .editorjs-gif-remove-btn:hover {
                color: #333;
            }

            .editorjs-gif-powered-by {
                margin: 0;
                text-align: center;
                font-size: 12px;
                color: #666;
            }

            .editorjs-gif-loader {
                border: 4px solid #f3f3f3;
                border-top: 4px solid #3498db;
                border-radius: 50%;
                width: 30px;
                height: 30px;
                animation: editorjs-gif-spin 1s linear infinite;
                margin: 20px auto;
            }

            @keyframes editorjs-gif-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            .editorjs-gif-error {
                color: red;
                font-size: 14px;
                margin-top: 8px;
            }
        `;
        document.head.appendChild(style);
    }

    renderSelectedGif() {
        this.container.style.display = 'block';

        const img = document.createElement('img');
        img.src = this.data.url;
        img.alt = this.data.title || 'GIF';
        img.style.maxWidth = '100%';
        img.draggable = false;
        
        const removeButton = document.createElement('div');
        removeButton.textContent = this.config.removeButtonText;
        removeButton.classList.add('editorjs-gif-remove-btn');
        
        const removeHandler = () => this.removeGif();
        removeButton.addEventListener('click', removeHandler);
        
        // Track event listener for cleanup
        this.eventListeners.set(removeButton, [['click', removeHandler]]);

        this.container.innerHTML = '';
        this.container.appendChild(img);
        this.container.appendChild(removeButton);
    }

    /**
     * Debounced search to prevent excessive API calls
     */
    debouncedSearch(query, container, loader) {
        // Clear any existing timeout
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        
        // Set new timeout
        this.searchTimeout = setTimeout(() => {
            this.searchGifs(query, container, loader);
        }, this.config.debounceDelay);
    }

    async searchGifs(query, container, loader) {
        query = query.trim();
        if (!query || query.length < 2) {
            return; // Require at least 2 characters
        }
        
        // Sanitize query length
        if (query.length > 100) {
            query = query.substring(0, 100);
        }

        try {
            this.clearErrorMessages();
            loader.style.display = 'block';

            const gifs = await this.fetchGifs(query);

            const gifContainer = document.getElementById(`${this.instanceId}-container`);
            if (gifContainer) {
                gifContainer.style.display = "block";
            }

            // Clear previous GIF event listeners before adding new ones
            const previousImages = container.querySelectorAll('img');
            previousImages.forEach(img => {
                if (this.eventListeners.has(img)) {
                    const listeners = this.eventListeners.get(img);
                    listeners.forEach(([event, handler]) => {
                        img.removeEventListener(event, handler);
                    });
                    this.eventListeners.delete(img);
                }
            });
            
            container.innerHTML = '';

            gifs.forEach(gif => {
                const img = document.createElement('img');
                img.src = gif.previewUrl;
                img.alt = gif.alt;
                img.draggable = false;
                
                const clickHandler = () => this.selectGif(gif);
                img.addEventListener('click', clickHandler);
                
                // Track event listener for cleanup
                if (!this.eventListeners.has(img)) {
                    this.eventListeners.set(img, []);
                }
                this.eventListeners.get(img).push(['click', clickHandler]);
                
                container.appendChild(img);
            });

            // Add horizontal scroll handler if enabled
            if (this.config.enableHorizontalScroll) {
                this.addHorizontalScrollHandler(gifContainer);
            }
        } catch (error) {
            console.error('Error fetching GIFs:', error);
            container.innerHTML = '<div class="editorjs-gif-error">Error fetching GIFs. Please try again.</div>';
        } finally {
            loader.style.display = 'none';
        }
    }

    async fetchGifs(query) {
        const url = new URL(this.config.endpoint);
        url.searchParams.append('q', query);
        url.searchParams.append('limit', this.config.limit);

        const headers = {
            'Content-Type': 'application/json',
            ...this.config.headers
        };

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return this.config.responseParser(data);
    }

    selectGif(gif) {
        this.data = {
            url: gif.fullUrl,
            width: gif.width,
            height: gif.height,
            title: gif.title,
            alt: gif.alt
        };

        this.renderSelectedGif();
    }

    removeGif() {
        this.data = {};
        this.destroy(); // Clean up before re-rendering
        this.container.innerHTML = '';
        this.renderSearchInterface();
    }

    addHorizontalScrollHandler(scrollContainer) {
        // Remove any existing wheel listeners
        if (this.wheelHandler) {
            scrollContainer.removeEventListener('wheel', this.wheelHandler);
        }
        
        this.wheelHandler = (e) => {
            if (scrollContainer.scrollWidth > scrollContainer.clientWidth) {
                e.preventDefault();
                scrollContainer.scrollLeft += e.deltaY;
            }
        };
        
        scrollContainer.addEventListener('wheel', this.wheelHandler, { passive: false });
    }

    showErrorMessage(message) {
        const errorElement = document.createElement('div');
        errorElement.classList.add('editorjs-gif-error');
        errorElement.textContent = message;
        this.container.appendChild(errorElement);
    }

    clearErrorMessages() {
        const errorElements = this.container.querySelectorAll('.editorjs-gif-error');
        errorElements.forEach(element => element.remove());
    }

    /**
     * Cleanup method to prevent memory leaks
     * Call this when the plugin is being destroyed
     */
    destroy() {
        // Clear any pending search timeout
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = null;
        }
        
        // Remove all tracked event listeners
        this.eventListeners.forEach((listeners, element) => {
            listeners.forEach(([event, handler]) => {
                element.removeEventListener(event, handler);
            });
        });
        this.eventListeners.clear();
        
        // Remove wheel handler if it exists
        if (this.wheelHandler) {
            const containers = document.querySelectorAll(`#${this.instanceId}-container`);
            containers.forEach(container => {
                container.removeEventListener('wheel', this.wheelHandler);
            });
            this.wheelHandler = null;
        }
        
        // Clear container
        if (this.container) {
            this.container.innerHTML = '';
        }
    }

    save() {
        return this.data;
    }

    onReadOnlyChange(readOnly) {
        this.readOnly = readOnly;
    }

    static get isReadOnlySupported() {
        return true;
    }
}

// Support both CommonJS and ES6 modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EditorJSGifPlugin;
} else if (typeof window !== 'undefined') {
    window.EditorJSGifPlugin = EditorJSGifPlugin;
} 