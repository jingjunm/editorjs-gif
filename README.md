# EditorJS GIF Plugin

A customizable GIF search and embed plugin for EditorJS that allows users to search and embed GIFs from any GIF provider through a secure server-side API endpoint.

[Live demo](https://www.oddsrabbit.com)

## Features

- 🔍 **Search GIFs**: Search for GIFs using any provider (Tenor, Giphy, etc.)
- ⚙️ **Highly Configurable**: Customize API endpoints, UI text, styling, and behavior
- 🎨 **Responsive Design**: Works on desktop and mobile devices
- 🖱️ **Horizontal Scrolling**: Mouse wheel support for easy browsing
- 🎯 **Drag Prevention**: Prevents conflicts with EditorJS drag operations
- 📱 **Touch Friendly**: Optimized for touch devices
- 🔌 **Provider Agnostic**: Works with any GIF API that returns JSON

## Installation

### NPM

```bash
npm install @jingjunma/editorjs-gif
```

> **Note**: This is a scoped package under `@jingjunma`. Scoped packages help avoid naming conflicts and clearly identify the author.

### CDN

```html
<script src="https://cdn.jsdelivr.net/npm/@jingjunma/editorjs-gif@latest/src/editorjs-gif.js"></script>
```

## Usage

### Basic Setup

```javascript
const editor = new EditorJS({
  holder: 'editorjs',
  tools: {
    gif: {
      class: EditorJSGifPlugin,
      config: {
        endpoint: '/api/gifs/search', // Your server-side proxy endpoint
      }
    }
  }
});
```

### Why Server-Side Endpoint Required?

This plugin **requires** a server-side endpoint because:

1. **🔐 Security**: GIF provider APIs (Tenor, Giphy) require API keys that must never be exposed in client-side code
2. **🛡️ Rate Limiting**: Server-side control prevents API abuse and quota exhaustion  
3. **🎛️ Control**: Filter content, add caching, implement custom business logic
4. **💰 Cost Control**: Monitor and control API usage to manage costs

The plugin sends requests to **your server**, which then securely communicates with the GIF provider.

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Browser       │    │   Your Server   │    │  GIF Provider   │
│   (EditorJS)    │    │   (Proxy)       │    │  (Tenor/Giphy)  │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│                 │    │                 │    │                 │
│ 🔍 User types   │───▶│ 🛡️ Validates    │───▶│ 🎬 Returns GIFs │
│ "funny cats"    │    │ + Adds API key  │    │ + metadata      │
│                 │    │ + Rate limits   │    │                 │
│ 🖼️ Displays     │◀───│ 📦 Processes    │◀───│                 │
│ GIF results     │    │ response        │    │                 │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
   ❌ No API Key           ✅ API Key Secure       🔐 API Key Required
```

## 🔒 Security Requirements

- **🚨 CRITICAL: Never expose API keys in client-side code**
- **✅ REQUIRED: Always use a server-side proxy for API requests**
- **✅ REQUIRED: Validate and sanitize all user inputs**
- **✅ RECOMMENDED: Implement rate limiting on your API endpoint**
- **✅ RECOMMENDED: Use HTTPS for all API communications**
- **✅ RECOMMENDED: Store API keys securely (never in code)**
- **✅ RECOMMENDED: Add request logging for monitoring**

### Complete Example

```javascript
const editor = new EditorJS({
  holder: 'editorjs',
  tools: {
    gif: {
      class: EditorJSGifPlugin,
      config: {
        endpoint: '/api/gifs/search', // Your server-side proxy endpoint
        limit: 20,
        poweredByText: 'Powered by Tenor'
      }
    }
  }
});
```

### TypeScript Usage

```typescript
import EditorJS from '@editorjs/editorjs';
import EditorJSGifPlugin, { EditorJSGifConfig } from '@jingjunma/editorjs-gif';

const gifConfig: EditorJSGifConfig = {
  endpoint: '/api/gifs/search',
  limit: 20,
  poweredByText: 'Powered by Tenor',
  previewHeight: 200
};

const editor = new EditorJS({
  holder: 'editorjs',
  tools: {
    gif: {
      class: EditorJSGifPlugin,
      config: gifConfig
    }
  }
});
```

### With Custom API

```javascript
const editor = new EditorJS({
  holder: 'editorjs',
  tools: {
    gif: {
      class: EditorJSGifPlugin,
      config: {
        endpoint: 'https://your-custom-api.com/search',
        headers: {
          'Authorization': 'Bearer YOUR_TOKEN'
        },
        responseParser: (response) => {
          // Transform your API response to the expected format
          return response.data.map(gif => ({
            id: gif.id,
            previewUrl: gif.thumbnail_url,
            fullUrl: gif.gif_url,
            width: gif.width,
            height: gif.height,
            title: gif.title,
            alt: gif.description || gif.title
          }));
        }
      }
    }
  }
});
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `endpoint` | `string` | `null` | **Required** - Your server-side API endpoint for GIF search |
| `limit` | `number` | `15` | Number of GIFs to fetch per search |
| `placeholder` | `string` | `'Search for GIFs...'` | Search input placeholder text |
| `buttonText` | `string` | `'Search'` | Search button text |
| `removeButtonText` | `string` | `'Remove GIF'` | Remove button text |
| `poweredByText` | `string` | `''` | Optional branding text (e.g., "Powered by Tenor") |
| `previewHeight` | `number` | `200` | Height of preview GIFs in pixels |
| `enableHorizontalScroll` | `boolean` | `true` | Enable mouse wheel horizontal scrolling |
| `debounceDelay` | `number` | `300` | Debounce delay in milliseconds for search input |
| `headers` | `object` | `{}` | Additional headers for API requests |
| `responseParser` | `function` | Built-in parser | Custom function to parse API responses |

## API Response Format

The plugin expects your API to return GIF data in a specific format. You can either:

1. **Use the default format** (compatible with Tenor API):
```json
{
  "results": [
    {
      "id": "gif_id",
      "content_description": "Description",
      "media_formats": {
        "gif": {
          "url": "https://example.com/full.gif",
          "dims": [width, height]
        },
        "tinygif": {
          "url": "https://example.com/preview.gif"
        }
      }
    }
  ]
}
```

2. **Use a custom responseParser** to transform your API response:
```javascript
config: {
  endpoint: 'https://your-api.com/search',
  responseParser: (response) => {
    return response.gifs.map(gif => ({
      id: gif.id,
      previewUrl: gif.preview_url,
      fullUrl: gif.full_url,
      width: gif.dimensions.width,
      height: gif.dimensions.height,
      title: gif.title,
      alt: gif.description
    }));
  }
}
```

## Required: Server-Side Implementation

**You MUST implement a server-side proxy to use this plugin securely.** Here are examples:

### Node.js/Express with Tenor API

```javascript
// server.js
app.get('/api/gifs/search', async (req, res) => {
  const { q, limit = 15 } = req.query;
  const apiKey = 'YOUR_TENOR_API_KEY'; // Store securely (env vars, config, etc.)
  
  // Validate input
  if (!q || q.trim().length === 0) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }
  
  try {
    const response = await fetch(
      `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(q)}&key=${apiKey}&limit=${limit}&media_filter=gif`
    );
    
    if (!response.ok) {
      throw new Error(`Tenor API error: ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('GIF search error:', error);
    res.status(500).json({ error: 'Failed to fetch GIFs' });
  }
});
```

### PHP with Tenor API

```php
<?php
// api/gifs/search.php
function searchGifs($query, $limit = 15) {
    $apiKey = 'YOUR_TENOR_API_KEY'; // Store securely in your preferred way
    
    // Validate input
    if (empty(trim($query))) {
        http_response_code(400);
        echo json_encode(['error' => 'Query parameter is required']);
        return;
    }
    
    $url = "https://tenor.googleapis.com/v2/search?" . http_build_query([
        'q' => $query,
        'key' => $apiKey,
        'limit' => $limit,
        'media_filter' => 'gif'
    ]);
    
    $context = stream_context_create([
        'http' => [
            'timeout' => 10,
            'user_agent' => 'YourApp/1.0'
        ]
    ]);
    
    $response = file_get_contents($url, false, $context);
    
    if ($response === false) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch GIFs']);
        return;
    }
    
    return json_decode($response, true);
}

// Handle the request
$query = $_GET['q'] ?? '';
$limit = min((int)($_GET['limit'] ?? 15), 50); // Cap at 50

$result = searchGifs($query, $limit);
if ($result) {
    header('Content-Type: application/json');
    echo json_encode($result);
}
?>
```

## Performance Features

### Debounced Search
The plugin automatically debounces search input to prevent excessive API calls. By default, it waits 300ms after the user stops typing before making the search request. You can customize this:

```javascript
config: {
  endpoint: '/api/gifs/search',
  debounceDelay: 500 // Wait 500ms instead of default 300ms
}
```

### Memory Management
The plugin includes automatic cleanup to prevent memory leaks. If you need to manually clean up (e.g., when destroying the editor programmatically), you can call:

```javascript
// Assuming you have access to the plugin instance
gifPluginInstance.destroy();
```

This will:
- Clear any pending search timeouts
- Remove all event listeners
- Clean up DOM references

## Styling

The plugin includes default styles, but you can customize the appearance:

```css
/* Customize the search input */
.editorjs-gif-search-input {
  border: 2px solid #your-color !important;
  border-radius: 8px !important;
}

/* Customize the search button */
.editorjs-gif-search-button {
  background: linear-gradient(45deg, #your-color1, #your-color2) !important;
}

/* Customize GIF previews */
.editorjs-gif-wrapper > img {
  border-radius: 12px !important;
  height: 250px !important; /* Override default height */
}

/* Customize the container */
.editorjs-gif-container {
  border: 2px dashed #your-color !important;
  background: #your-bg-color !important;
}
```

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Development

This plugin follows the **simple, single-file approach** common to many EditorJS plugins. No build process is required - the plugin works directly as a standalone JavaScript file.

### Setup

```bash
git clone https://github.com/jingjunma/editorjs-gif.git
cd editorjs-gif
npm install
```



### Testing

Set up a simple HTML file to test the plugin (after implementing your server-side proxy):

```html
<!DOCTYPE html>
<html>
<head>
    <title>EditorJS GIF Plugin Test</title>
    <script src="https://cdn.jsdelivr.net/npm/@editorjs/editorjs@latest"></script>
    <script src="./src/editorjs-gif.js"></script>
</head>
<body>
    <div id="editorjs"></div>
    <script>
        const editor = new EditorJS({
            holder: 'editorjs',
            tools: {
                gif: {
                    class: EditorJSGifPlugin,
                    config: {
                        endpoint: '/api/gifs/search' // Your server-side endpoint
                    }
                }
            }
        });
    </script>
</body>
</html>
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built for the amazing [EditorJS](https://editorjs.io/) community
- Inspired by the need for better GIF integration in modern editors
- Thanks to all contributors and testers
- Created by [Jing Jun Ma](https://github.com/jingjunm)

## Changelog

### 1.1.0 (Upcoming)
- Added debounced search to prevent excessive API calls
- Added destroy() method for proper cleanup and memory management
- Improved input validation (minimum 2 characters, max 100 characters)
- Enhanced event listener management to prevent memory leaks
- Added TypeScript definitions for debounceDelay configuration

### 1.0.0
- Initial release
- Configurable API endpoints
- Tenor API support out-of-the-box
- Horizontal mouse wheel scrolling
- Responsive design
- Custom response parser support 
