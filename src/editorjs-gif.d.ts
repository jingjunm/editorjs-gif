/**
 * EditorJS GIF Plugin TypeScript Definitions
 */

declare module '@jingjunma/editorjs-gif' {
  export interface GifData {
    id: string;
    previewUrl: string;
    fullUrl: string;
    width?: number;
    height?: number;
    title?: string;
    alt?: string;
  }

  export interface EditorJSGifConfig {
    /** Required: Your server-side API endpoint for GIF search */
    endpoint: string;
    /** Number of GIFs to fetch per search (default: 15) */
    limit?: number;
    /** Search input placeholder text (default: 'Search for GIFs...') */
    placeholder?: string;
    /** Search button text (default: 'Search') */
    buttonText?: string;
    /** Remove button text (default: 'Remove GIF') */
    removeButtonText?: string;
    /** Optional branding text (e.g., "Powered by Tenor") */
    poweredByText?: string;
    /** Height of preview GIFs in pixels (default: 200) */
    previewHeight?: number;
    /** Enable mouse wheel horizontal scrolling (default: true) */
    enableHorizontalScroll?: boolean;
    /** Debounce delay in milliseconds for search input (default: 300) */
    debounceDelay?: number;
    /** Additional headers for API requests */
    headers?: Record<string, string>;
    /** Custom function to parse API responses */
    responseParser?: (response: any) => GifData[];
  }

  export interface EditorJSGifSaveData {
    url: string;
    width?: number;
    height?: number;
    title?: string;
    alt?: string;
  }

  export interface EditorJSGifConstructorParams {
    data?: EditorJSGifSaveData;
    api: any; // EditorJS API
    config?: EditorJSGifConfig;
    readOnly?: boolean;
  }

  export class EditorJSGifPlugin {
    constructor(params: EditorJSGifConstructorParams);
    
    static get toolbox(): {
      title: string;
      icon: string;
    };

    static get isReadOnlySupported(): boolean;

    render(): HTMLElement;
    save(): EditorJSGifSaveData;
    onReadOnlyChange(readOnly: boolean): void;
    destroy(): void;
  }

  export default EditorJSGifPlugin;
}

// For users importing without module resolution
declare class EditorJSGifPlugin {
  constructor(params: {
    data?: {
      url: string;
      width?: number;
      height?: number;
      title?: string;
      alt?: string;
    };
    api: any;
    config?: {
      endpoint: string;
      limit?: number;
      placeholder?: string;
      buttonText?: string;
      removeButtonText?: string;
      poweredByText?: string;
      previewHeight?: number;
      enableHorizontalScroll?: boolean;
      debounceDelay?: number;
      headers?: Record<string, string>;
      responseParser?: (response: any) => Array<{
        id: string;
        previewUrl: string;
        fullUrl: string;
        width?: number;
        height?: number;
        title?: string;
        alt?: string;
      }>;
    };
    readOnly?: boolean;
  });

  static get toolbox(): {
    title: string;
    icon: string;
  };

  static get isReadOnlySupported(): boolean;

  render(): HTMLElement;
  save(): {
    url: string;
    width?: number;
    height?: number;
    title?: string;
    alt?: string;
  };
  onReadOnlyChange(readOnly: boolean): void;
  destroy(): void;
} 