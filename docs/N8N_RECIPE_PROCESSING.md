# n8n + Ollama Recipe Processing Setup

This guide covers setting up the automated recipe extraction pipeline: upload a recipe image/PDF in the app, click "Process with AI", and n8n + Ollama extract the recipe for review.

## Architecture

```
User uploads image → dinner-time app → webhook POST to n8n
                                              ↓
                              n8n fetches image via HTTP from dinner-time
                                              ↓
                              n8n sends image to Ollama vision model
                                              ↓
                              Ollama extracts recipe JSON
                                              ↓
                              n8n POSTs recipe back to dinner-time callback
                                              ↓
                         Recipe appears in "Pending Review" for user to edit & save
```

## Prerequisites

- dinner-time app running (Docker or local)
- n8n instance (can be on a different host)
- Ollama instance with a vision-capable model

**Note:** n8n and dinner-time do NOT need shared storage. n8n fetches uploaded files over HTTP.

## 1. Verify Ollama Has a Vision Model

Check available models:
```bash
curl http://ollama.gravydigz.net:11434/api/tags
```

Pull a vision model if needed:
```bash
curl http://ollama.gravydigz.net:11434/api/pull -d '{"name": "llama3.2-vision"}'
```

Other vision model options: `llava`, `bakllava`, `moondream`.

## 2. Configure Environment Variables

dinner-time needs two environment variables for the integration:

| Variable | Description | Example |
|----------|-------------|---------|
| `N8N_WEBHOOK_URL` | Full URL to the n8n webhook trigger | `http://n8n-host:5678/webhook/recipe-process` |
| `CALLBACK_BASE_URL` | Externally-reachable URL for dinner-time (n8n must be able to reach this) | `https://dt.lab.local` or `http://192.168.1.50:3010` |

### Option A: `.env` file in `docker/`
```env
N8N_WEBHOOK_URL=http://n8n-host:5678/webhook/recipe-process
CALLBACK_BASE_URL=https://dt.lab.local
```

### Option B: Inline
```bash
N8N_WEBHOOK_URL=http://n8n-host:5678/webhook/recipe-process \
CALLBACK_BASE_URL=https://dt.lab.local \
docker-compose up -d
```

Both variables are already wired into `docker-compose.yml` and `docker-compose.generic`.

## 3. Build the n8n Workflow

Open n8n and create a new workflow with 5 nodes:

### Node 1: Webhook (Trigger)

- **Method:** POST
- **Path:** `recipe-process` (becomes `/webhook/recipe-process`)
- **Response Mode:** Respond immediately with 200

This receives the payload from dinner-time:
```json
{
  "filename": "recipe-photo-1234.jpg",
  "fileUrl": "https://dt.lab.local/data/uploads/images/recipe-photo-1234.jpg",
  "mimeType": "image/jpeg",
  "callbackUrl": "https://dt.lab.local/api/process/result"
}
```

### Node 2: HTTP Request (Fetch File)

- **Method:** GET
- **URL:** `{{ $json.body.fileUrl }}`
- **Response Format:** File (binary)

This downloads the uploaded image/PDF from dinner-time over HTTP.

### Node 3: HTTP Request (Ollama)

- **Method:** POST
- **URL:** `http://ollama.gravydigz.net:11434/api/chat`
- **Body Type:** JSON
- **JSON Body:**
```json
{
  "model": "llama3.2-vision",
  "messages": [
    {
      "role": "user",
      "content": "Extract this recipe into structured JSON with these fields: name (string), source (string), url (string, empty if unknown), prepTime (number in minutes), cookTime (number in minutes), servings (number), category (one of: Chicken, Beef, Pork, Seafood, Pasta, Vegetarian, Soup, Salad, Side, Dessert, Breakfast, Other), ingredients (array of objects with item, amount, unit, additional fields), instructions (array of step strings), notes (string). Return ONLY valid JSON, no markdown or explanation.",
      "images": ["{{ $binary.data.base64 }}"]
    }
  ],
  "stream": false,
  "options": {
    "temperature": 0.1
  }
}
```

**Note:** The exact expression for the base64 image data depends on what the HTTP Request node outputs. Check the output of Node 2 in n8n's debug panel and adjust the `images` expression if needed.

### Node 4: Code Node (Parse Response)

Parse Ollama's response and extract the recipe JSON:
```javascript
const response = $input.first().json;
const content = response.message.content;

// Extract JSON from the response (handle possible markdown wrapping)
let jsonStr = content;
const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
if (jsonMatch) {
  jsonStr = jsonMatch[1];
}

const recipe = JSON.parse(jsonStr.trim());

// Pass along the original filename and callback URL
const webhook = $('Webhook').first().json.body;

return [{
  json: {
    filename: webhook.filename,
    recipe: recipe,
    callbackUrl: webhook.callbackUrl
  }
}];
```

### Node 5: HTTP Request (Callback to dinner-time)

- **Method:** POST
- **URL:** `{{ $json.callbackUrl }}`
- **Content Type:** JSON
- **Body:**
```json
{
  "filename": "{{ $json.filename }}",
  "recipe": {{ JSON.stringify($json.recipe) }}
}
```

Or use an expression for the full body: `{{ JSON.stringify({ filename: $json.filename, recipe: $json.recipe }) }}`

### Workflow Connections

```
Webhook → HTTP Request (Fetch File) → HTTP Request (Ollama) → Code (Parse) → HTTP Request (Callback)
```

**Activate the workflow** once all nodes are connected.

## 4. Test the Pipeline

### Full end-to-end test:
1. Start dinner-time with both env vars set
2. Upload a recipe image via the upload page
3. Click "Process with AI" on the uploaded file
4. Watch n8n execution log for the workflow run
5. Recipe should appear in "Pending Review" on the upload page
6. Edit and save — recipe is added to `master_recipes.json`

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

## Troubleshooting

| Issue | Check |
|-------|-------|
| "N8N_WEBHOOK_URL not configured" | Env var not set — verify with `docker exec dinner-time-web env \| grep N8N` |
| "Failed to reach n8n" | dinner-time can't reach n8n — check URL and network/firewall |
| n8n can't fetch the file (HTTP 404/timeout) | `CALLBACK_BASE_URL` is wrong or n8n can't reach dinner-time — test with `curl <fileUrl>` from the n8n host |
| Ollama returns errors | Model not pulled, or model doesn't support vision (use a vision model like `llama3.2-vision`) |
| Callback fails (n8n → dinner-time) | `CALLBACK_BASE_URL` is not reachable from n8n — test with `curl <callbackUrl>` from n8n host |
| Recipe JSON parse error in Code node | Ollama returned markdown-wrapped JSON — the Code node handles ```` ```json ``` ```` wrapping, but check raw output for other formats |
| Pending recipe doesn't appear | Check n8n execution succeeded, verify callback hit dinner-time logs |
