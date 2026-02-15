# n8n + Ollama Recipe Processing Setup

This guide covers setting up the automated recipe extraction pipeline: upload a recipe image/PDF in the app, click "Process with AI", and n8n + Ollama extract the recipe for review.

## Architecture

The workflow supports two input paths — file uploads and URL imports — that converge at the same parse and callback steps.

```
                                    Webhook
                                       │
                              ┌── IF recipeUrl? ──┐
                              │                    │
                         [URL path]          [File path]
                              │                    │
                      Fetch URL (GET)     Fetch File (GET)
                              │                    │
                      Clean HTML (Code)   Base64 (Code)
                              │                    │
                      Ollama Text (HTTP)  Ollama Vision (HTTP)
                              │                    │
                              └────────┬───────────┘
                                       │
                               Parse Response (Code)
                                       │
                               Callback to dinner-time (HTTP)
                                       │
                         Recipe appears in "Pending Review"
```

### File upload path
```
User uploads image → dinner-time app → webhook POST to n8n → fetch file → base64 → Ollama vision → parse → callback
```

### URL import path
```
User pastes URL → dinner-time app → webhook POST to n8n → fetch webpage → clean HTML → Ollama text → parse → callback
```

## Prerequisites

- dinner-time app running (Docker or local)
- n8n instance (can be on a different host)
- Ollama instance with a vision-capable model (e.g., `llama3.2-vision:11b`)

**Note:** n8n and dinner-time do NOT need shared storage. n8n fetches uploaded files over HTTP.

## 1. Verify Ollama Has a Vision Model

Check available models:
```bash
curl http://ollama.gravydigz.net:11434/api/tags
```

Pull a vision model if needed:
```bash
curl http://ollama.gravydigz.net:11434/api/pull -d '{"name": "llama3.2-vision:11b"}'
```

Other vision model options: `llava`, `bakllava`, `moondream`.

## 2. Configure Environment Variables

dinner-time needs two environment variables for the integration:

| Variable | Description | Example |
|----------|-------------|---------|
| `N8N_WEBHOOK_URL` | Full URL to the n8n webhook trigger | `http://n8n-host:5678/webhook/recipe-process` |
| `CALLBACK_BASE_URL` | Externally-reachable URL for dinner-time (n8n must be able to reach this) | `https://dt.gravydigz.net` or `http://192.168.1.50:3010` |

### Option A: `.env` file in `docker/`
```env
N8N_WEBHOOK_URL=http://n8n-host:5678/webhook/recipe-process
CALLBACK_BASE_URL=https://dt.gravydigz.net
```

### Option B: Inline
```bash
N8N_WEBHOOK_URL=http://n8n-host:5678/webhook/recipe-process \
CALLBACK_BASE_URL=https://dt.gravydigz.net \
docker-compose up -d
```

Both variables are already wired into `docker-compose.yml` and `docker-compose.generic`.

## 3. Build the n8n Workflow

Open n8n and create a new workflow. The workflow branches based on whether the incoming request is a file upload or a URL import.

### Node 1: Webhook (Trigger)

- **Method:** POST
- **Path:** `recipe-process` (becomes `/webhook/recipe-process`)
- **Response Mode:** Respond immediately with 200

This receives one of two payload formats:

**File upload payload:**
```json
{
  "filename": "recipe-photo-1234.jpg",
  "fileUrl": "https://dt.gravydigz.net/data/uploads/images/recipe-photo-1234.jpg",
  "mimeType": "image/jpeg",
  "callbackUrl": "https://dt.gravydigz.net/api/process/result"
}
```

**URL import payload:**
```json
{
  "filename": "url-bourbon-glazed-steak-1739123456789",
  "recipeUrl": "https://www.allrecipes.com/recipe/bourbon-glazed-steak/",
  "callbackUrl": "https://dt.gravydigz.net/api/process/result"
}
```

### Node 2: IF Node (Branch)

- **Condition:** `{{ $json.body.recipeUrl }}` is not empty
- **True output** → URL path (Node 2a)
- **False output** → File path (Node 2b)

### Node 2a: HTTP Request (Fetch URL) — URL path

- **Method:** GET
- **URL:** `{{ $json.body.recipeUrl }}`
- **Response Format:** Text
- **Headers:** Add `User-Agent: Mozilla/5.0 (compatible; DinnerTime/1.0)` to avoid bot blocks

### Node 2a-2: Code Node (Clean HTML) — URL path

- **Mode:** Run Once for Each Item
- **Language:** JavaScript
- **Code:**
```javascript
const html = $input.first().json.data || $input.first().json.body || '';

// Strip non-content tags
let text = html
  .replace(/<script[\s\S]*?<\/script>/gi, '')
  .replace(/<style[\s\S]*?<\/style>/gi, '')
  .replace(/<nav[\s\S]*?<\/nav>/gi, '')
  .replace(/<footer[\s\S]*?<\/footer>/gi, '')
  .replace(/<header[\s\S]*?<\/header>/gi, '');

// Strip remaining HTML tags
text = text.replace(/<[^>]+>/g, ' ');

// Decode common HTML entities
text = text
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/&nbsp;/g, ' ');

// Collapse whitespace and truncate
text = text.replace(/\s+/g, ' ').trim().substring(0, 8000);

const webhook = $('Webhook').first().json.body;

return {
  json: {
    cleanedText: text,
    webhook: webhook
  }
};
```

### Node 2a-3: HTTP Request (Ollama Text) — URL path

- **Method:** POST
- **URL:** `http://ollama.gravydigz.net:11434/api/chat`
- **Body Content Type:** JSON
- **JSON Body:**
```json
{
  "model": "llama3.2-vision:11b",
  "messages": [
    {
      "role": "user",
      "content": "Extract the recipe from the following webpage text into structured JSON with these fields: name (string), source (string), url (string, empty if unknown), prepTime (number in minutes), cookTime (number in minutes), servings (number), category (one of: Chicken, Beef, Pork, Seafood, Pasta, Vegetarian, Soup, Salad, Side, Dessert, Breakfast, Other), ingredients (array of objects with item, amount, unit, additional fields), instructions (array of step strings), notes (string). Return ONLY valid JSON, no markdown or explanation.\n\nWebpage text:\n{{ $json.cleanedText }}"
    }
  ],
  "stream": false,
  "options": {
    "temperature": 0.1
  }
}
```

**Note:** No `images` field — this is text-only mode with the same model.

### Node 2b: HTTP Request (Fetch File) — File path

- **Method:** GET
- **URL:** `{{ $json.body.fileUrl }}`
- **Response Format:** File
- **Put Output in Field:** `data`

This downloads the uploaded image/PDF from dinner-time over HTTP as binary data.

### Node 2b-2: Code Node (Convert File to Base64) — File path

This node converts the binary file data into a base64 string that Ollama's API requires.

- **Mode:** Run Once for Each Item
- **Language:** JavaScript
- **Code:**
```javascript
const binaryData = await this.helpers.getBinaryDataBuffer(0, 'data');
const base64String = binaryData.toString('base64');

return {
  json: {
    base64Image: base64String,
    webhook: $('Webhook').first().json.body
  }
};
```

**Why this is needed:** n8n's newer versions do not expose binary data as `.base64` directly in expressions. This Code node uses the helper API to access the raw binary buffer and convert it to a base64 string.

### Node 2b-3: HTTP Request (Ollama Vision) — File path

- **Method:** POST
- **URL:** `http://ollama.gravydigz.net:11434/api/chat`
- **Body Content Type:** JSON
- **Specify Body:** Using JSON
- **JSON Body:**
```json
{
  "model": "llama3.2-vision:11b",
  "messages": [
    {
      "role": "user",
      "content": "Extract this recipe into structured JSON with these fields: name (string), source (string), url (string, empty if unknown), prepTime (number in minutes), cookTime (number in minutes), servings (number), category (one of: Chicken, Beef, Pork, Seafood, Pasta, Vegetarian, Soup, Salad, Side, Dessert, Breakfast, Other), ingredients (array of objects with item, amount, unit, additional fields), instructions (array of step strings), notes (string). Return ONLY valid JSON, no markdown or explanation.",
      "images": ["{{ $json.base64Image }}"]
    }
  ],
  "stream": false,
  "options": {
    "temperature": 0.1
  }
}
```

**Important:** The `images` field references `$json.base64Image` from the Code node output, NOT `$binary.data.base64`.

### Node 3: Code Node (Parse Response) — shared

Parse Ollama's response and extract the recipe JSON:

- **Mode:** Run Once for Each Item
- **Language:** JavaScript
- **Code:**
```javascript
const response = $input.first().json;
const content = response.message.content;

// Extract JSON from the response (handle possible markdown wrapping)
let jsonStr = content;
const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
if (jsonMatch) {
  jsonStr = jsonMatch[1];
}

// Try to find JSON object in the response
const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
if (objectMatch) {
  jsonStr = objectMatch[0];
}

let recipe;
try {
  recipe = JSON.parse(jsonStr.trim());
} catch (e) {
  throw new Error('Ollama did not return valid recipe JSON. Response: ' + content.substring(0, 200));
}

const webhook = $('Webhook').first().json.body;

// Auto-populate recipe URL from webhook if not extracted by Ollama
if (webhook.recipeUrl && !recipe.url) {
  recipe.url = webhook.recipeUrl;
}

return {
  json: {
    filename: webhook.filename,
    recipe: recipe,
    callbackUrl: webhook.callbackUrl
  }
};
```

### Node 4: HTTP Request (Callback to dinner-time) — shared

- **Method:** POST
- **URL:** `{{ $json.callbackUrl }}`
- **Body Content Type:** JSON
- **Specify Body:** Using JSON
- **JSON Body:**
```json
{
  "filename": "{{ $json.filename }}",
  "recipe": {{ JSON.stringify($json.recipe) }}
}
```

Or use an expression for the full body: `{{ JSON.stringify({ filename: $json.filename, recipe: $json.recipe }) }}`

### Workflow Connections

```
Webhook → IF Node
  ├─ True (URL):  Fetch URL → Clean HTML → Ollama Text ─┐
  │                                                       ├→ Parse Response → Callback
  └─ False (File): Fetch File → Base64 → Ollama Vision ──┘
```

Both the URL path (Ollama Text) and file path (Ollama Vision) connect their outputs to the shared Parse Response node.

**Activate the workflow** once all nodes are connected.

## 4. Test the Pipeline

### Full end-to-end test:
1. Start dinner-time with both env vars set
2. Upload a recipe image via the upload page
3. Click "Process with AI" on the uploaded file
4. Watch n8n execution log for the workflow run
5. Recipe should appear in "Pending Review" on the upload page
6. Edit and save — recipe is added to `master_recipes.json`

### Test URL import endpoint:
```bash
curl -X POST http://localhost:3010/api/process-url \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.allrecipes.com/recipe/bourbon-glazed-steak/"}'
```

### Test the callback independently (skip n8n):
```bash
curl -X POST http://localhost:3010/api/process/result \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "test-recipe-123.jpg",
    "recipe": {
      "name": "Test Recipe",
      "category": "Chicken",
      "servings": 4,
      "prepTime": 10,
      "cookTime": 30,
      "source": "Test",
      "url": "",
      "ingredients": [{"item": "chicken breast", "amount": "2", "unit": "lbs", "additional": ""}],
      "instructions": ["Season chicken", "Cook at 400F for 30 min"],
      "notes": ""
    }
  }'
```

Then refresh the upload page to see the pending recipe.

### Test Ollama connectivity from n8n:
```bash
docker exec n8n wget -qO- --timeout=5 http://ollama.gravydigz.net:11434/api/version
```

### Test dinner-time connectivity from n8n:
```bash
docker exec n8n wget -qO- --timeout=5 https://dt.gravydigz.net/api/uploads
```

## Troubleshooting

| Issue | Check |
|-------|-------|
| "N8N_WEBHOOK_URL not configured" | Env var not set — verify with `docker exec dinner-time printenv N8N_WEBHOOK_URL` |
| "Failed to reach n8n" | dinner-time can't reach n8n — check URL and network/firewall |
| n8n can't fetch the file (HTTP 404/timeout) | `CALLBACK_BASE_URL` is wrong or n8n can't reach dinner-time — test with `curl <fileUrl>` from the n8n host |
| "Connection refused" from n8n to dinner-time | Check port (3010 internal), verify both containers are on the same Docker network, test with `docker exec n8n wget -qO- http://dinner-time:3010/` |
| Ollama returns "unknown format" for image | The base64 data may include a data URI prefix — ensure the Code (Base64) node outputs raw base64 without `data:image/...;base64,` prefix |
| Ollama returns errors | Model not pulled, or model doesn't support vision (use `llama3.2-vision:11b` or similar) |
| Callback fails (n8n → dinner-time) | `CALLBACK_BASE_URL` is not reachable from n8n — test with `docker exec n8n wget -qO- <callbackUrl>` |
| Recipe JSON parse error in Code node | Ollama returned text instead of JSON — the Parse node handles markdown-wrapped JSON and extracts JSON objects, but check raw output if it fails |
| Pending recipe doesn't appear | Check n8n execution succeeded, verify callback hit dinner-time logs |
| `$binary.data.base64` is undefined | n8n version does not expose base64 directly — use the Code (Base64) node with `this.helpers.getBinaryDataBuffer()` instead |
| URL import returns empty/bad recipe | Site may use JavaScript rendering (SPA) — the fetch gets raw HTML only. Try a different URL or use file upload with a screenshot instead |
| URL fetch blocked (403/captcha) | Site has anti-scraping protection — the User-Agent header helps but some sites block non-browser requests. Use file upload as fallback |
| URL response is too large / truncated | The Clean HTML node truncates to ~8000 chars. For very long pages, the recipe content may be cut off — ensure key recipe content is near the top of the page |
| IF node routes to wrong branch | Verify the condition checks `$json.body.recipeUrl` — file uploads don't include this field, URL imports always do |

### Docker Networking Notes

- If n8n and dinner-time are on the same Docker network, they can communicate using container names (e.g., `http://dinner-time:3010`)
- If using Traefik for TLS termination, n8n can reach dinner-time via the external domain (e.g., `https://dt.gravydigz.net`)
- **Do NOT** add Docker network aliases matching external domain names (e.g., `dt.gravydigz.net`) — this causes Docker to resolve the domain to the container IP directly, bypassing Traefik's TLS termination
- If n8n and Ollama are on different hosts, use the Ollama host's FQDN (e.g., `http://ollama.gravydigz.net:11434`)
- If DNS resolution fails inside containers, use `extra_hosts` in docker-compose or Docker network aliases for service discovery
