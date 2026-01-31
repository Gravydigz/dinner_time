# Recipe Upload & Processing Automation Guide

This guide explains how to automate the process of extracting recipes from uploaded images/PDFs and adding them to your master recipe database.

## Upload Repository Structure

```
dinner_time/
├── uploads/
│   ├── images/          # Uploaded recipe images (JPG, PNG)
│   ├── pdfs/            # Uploaded recipe PDFs
│   └── processed/       # Moved here after processing
```

## Method 1: Manual Processing with Claude Code (Simplest)

### Step 1: Upload Recipe Files
1. Open `web/upload.html` in your browser
2. Drag and drop recipe images or PDFs
3. Files are tracked in the upload interface

### Step 2: Process with Claude Code
1. Open Claude Code in your terminal in the `dinner_time` directory
2. For each uploaded file:
   ```
   Read the file at uploads/images/recipe_screenshot.jpg
   ```
3. Ask Claude:
   ```
   Extract the recipe from this image including:
   - Recipe name
   - Source and URL (if visible)
   - Ingredients with amounts and units
   - Instructions
   - Prep time, cook time, servings
   - Category (Beef, Chicken, Pasta, etc.)

   Then add it to recipes/master_recipes.json following the existing format.
   ```

### Step 3: Verify
1. Claude will read the image/PDF using its vision capabilities
2. Claude will extract the recipe data
3. Claude will add it to `master_recipes.json`
4. The recipe will automatically appear in your planner and rating system

### Step 4: Move Processed Files
```bash
mv uploads/images/recipe_screenshot.jpg uploads/processed/
```

## Method 2: Automation with n8n (Advanced)

### Overview
n8n can watch the uploads folder and automatically trigger Claude Code when new files appear.

### Prerequisites
- n8n installed ([https://n8n.io](https://n8n.io))
- Claude API key (if using Claude API instead of Claude Code)
- Node.js installed

### n8n Workflow Setup

#### 1. Create New Workflow in n8n

#### 2. Add "Watch Folder" Node
- **Node Type:** "Local File Trigger" or "Watch Folder"
- **Folder Path:** `/Users/travisrobertson/Code/dinner_time/uploads/images`
- **Watch for:** New files
- **File Filter:** `*.jpg, *.png, *.pdf`

#### 3. Add "Read Binary File" Node
- Reads the uploaded file content

#### 4. Add "Claude API" Node (Option A: Using Claude API)
Configure:
```json
{
  "method": "POST",
  "url": "https://api.anthropic.com/v1/messages",
  "headers": {
    "x-api-key": "YOUR_API_KEY",
    "anthropic-version": "2023-06-01",
    "content-type": "application/json"
  },
  "body": {
    "model": "claude-3-sonnet-20240229",
    "max_tokens": 4096,
    "messages": [{
      "role": "user",
      "content": [
        {
          "type": "image",
          "source": {
            "type": "base64",
            "media_type": "{{ $binary.data.mimeType }}",
            "data": "{{ $binary.data.data }}"
          }
        },
        {
          "type": "text",
          "text": "Extract this recipe and format as JSON with: id, name, source, url, prepTime, cookTime, servings, category, ingredients (array with item, amount, unit), instructions (array of strings)"
        }
      ]
    }]
  }
}
```

#### 5. Add "Execute Command" Node (Option B: Using Claude Code CLI)
Configure:
```bash
cd /Users/travisrobertson/Code/dinner_time && echo "Read uploads/images/{{ $json.fileName }} and extract the recipe, then add it to recipes/master_recipes.json" | claude-code
```

#### 6. Add "Parse JSON" Node
- Parse Claude's response to extract recipe JSON

#### 7. Add "Edit File" Node
- **Action:** Append to file
- **File Path:** `/Users/travisrobertson/Code/dinner_time/recipes/master_recipes.json`
- **Content:** Add the new recipe to the recipes array

#### 8. Add "Move File" Node
- **Source:** `/Users/travisrobertson/Code/dinner_time/uploads/images/{{ $json.fileName }}`
- **Destination:** `/Users/travisrobertson/Code/dinner_time/uploads/processed/{{ $json.fileName }}`

### Example n8n Workflow JSON
```json
{
  "name": "Recipe Upload Processor",
  "nodes": [
    {
      "type": "n8n-nodes-base.localFileTrigger",
      "name": "Watch Uploads Folder",
      "parameters": {
        "path": "/Users/travisrobertson/Code/dinner_time/uploads/images",
        "triggerOn": "add"
      }
    },
    {
      "type": "n8n-nodes-base.executeCommand",
      "name": "Process with Claude",
      "parameters": {
        "command": "cd /Users/travisrobertson/Code/dinner_time && claude-code process-recipe {{ $json.path }}"
      }
    },
    {
      "type": "n8n-nodes-base.moveFile",
      "name": "Move to Processed",
      "parameters": {
        "sourcePath": "{{ $json.path }}",
        "destinationPath": "/Users/travisrobertson/Code/dinner_time/uploads/processed/{{ $json.fileName }}"
      }
    }
  ]
}
```

## Method 3: Simple Shell Script Automation

Create a script to batch process uploaded files:

```bash
#!/bin/bash
# process_recipes.sh

UPLOAD_DIR="/Users/travisrobertson/Code/dinner_time/uploads/images"
PROCESSED_DIR="/Users/travisrobertson/Code/dinner_time/uploads/processed"

for file in "$UPLOAD_DIR"/*; do
  if [ -f "$file" ]; then
    echo "Processing $file..."

    # Use Claude Code to process the file
    cd /Users/travisrobertson/Code/dinner_time
    echo "Read the file $file and extract the recipe, then add it to recipes/master_recipes.json" | claude-code

    # Move to processed folder
    mv "$file" "$PROCESSED_DIR/"

    echo "Completed: $(basename $file)"
  fi
done
```

Make executable:
```bash
chmod +x process_recipes.sh
```

Run manually or set up a cron job:
```bash
# Edit crontab
crontab -e

# Add line to run every hour
0 * * * * /Users/travisrobertson/Code/dinner_time/process_recipes.sh
```

## Best Practices

### File Naming
Name your uploaded files descriptively:
- ✅ `bourbon-steak-tips.jpg`
- ✅ `marry-me-chicken-recipe.pdf`
- ❌ `IMG_1234.jpg`

### Image Quality
- Use clear, well-lit photos
- Ensure text is readable
- Capture full recipe including ingredients and instructions
- Higher resolution is better (but within reasonable file sizes)

### PDF Requirements
- Text-based PDFs work better than scanned images
- Ensure recipe is complete on one or a few pages
- Remove unnecessary pages to speed processing

### Verification
After automated processing:
1. Check `master_recipes.json` for the new entry
2. Verify ingredient amounts and units are correct
3. Review instructions for completeness
4. Test in the web planner to ensure it appears correctly

## Troubleshooting

### Files Not Processing
- Check file permissions in uploads folder
- Verify Claude Code is accessible from command line
- Check n8n workflow logs for errors

### Incorrect Recipe Extraction
- Provide clearer images
- Manually correct in `master_recipes.json`
- Improve the Claude prompt to be more specific

### Database Format Issues
- Validate JSON syntax: `cat recipes/master_recipes.json | python -m json.tool`
- Ensure commas between recipe entries
- Check for duplicate recipe IDs

## Integration Points

### Claude Code Integration
Claude Code can:
- Read images using vision API
- Extract structured recipe data
- Edit JSON files directly
- Follow instructions to format correctly

### n8n Integration
n8n can:
- Watch folders for changes
- Trigger on file uploads
- Call external APIs
- Execute shell commands
- Move/organize files

### Future Enhancements
- Webhook endpoint for mobile uploads
- OCR preprocessing for difficult images
- Duplicate recipe detection
- Automatic categorization
- Nutrition API integration
- Recipe URL scraping

---

## Quick Start Checklist

- [ ] Upload recipe files to `web/upload.html`
- [ ] Files appear in `uploads/images/` or `uploads/pdfs/`
- [ ] Open Claude Code in terminal
- [ ] Use Read command to view file
- [ ] Ask Claude to extract and add to database
- [ ] Verify recipe appears in `master_recipes.json`
- [ ] Move file to `uploads/processed/`
- [ ] Recipe automatically available in planner!

For questions or issues, refer to the main README.md file.
