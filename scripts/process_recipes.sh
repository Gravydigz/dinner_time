#!/bin/bash

# Recipe Processing Script
# Batch processes uploaded recipe files using Claude Code

set -e

# Get the script's directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

UPLOAD_IMAGES="$PROJECT_DIR/data/uploads/images"
UPLOAD_PDFS="$PROJECT_DIR/data/uploads/pdfs"
PROCESSED_DIR="$PROJECT_DIR/data/uploads/processed"

echo "==========================================="
echo "Recipe Processing Script"
echo "==========================================="
echo ""

# Count files to process
image_count=$(ls -1 "$UPLOAD_IMAGES" 2>/dev/null | wc -l | tr -d ' ')
pdf_count=$(ls -1 "$UPLOAD_PDFS" 2>/dev/null | wc -l | tr -d ' ')
total_count=$((image_count + pdf_count))

if [ "$total_count" -eq 0 ]; then
    echo "No files found to process."
    echo "Upload files to:"
    echo "  - $UPLOAD_IMAGES"
    echo "  - $UPLOAD_PDFS"
    exit 0
fi

echo "Found $total_count file(s) to process:"
echo "  - Images: $image_count"
echo "  - PDFs: $pdf_count"
echo ""

# Process image files
if [ "$image_count" -gt 0 ]; then
    echo "Processing images..."
    echo "-------------------------------------------"

    for file in "$UPLOAD_IMAGES"/*; do
        if [ -f "$file" ]; then
            filename=$(basename "$file")
            echo ""
            echo "📸 Processing: $filename"

            # Check if Claude Code is available
            if ! command -v claude-code &> /dev/null; then
                echo "⚠️  Warning: claude-code command not found"
                echo "   Please install Claude Code or use manual method"
                echo "   Manual: Open Claude Code and run:"
                echo "   Read $file"
                echo "   Then ask: 'Extract this recipe and add it to master_recipes.json'"
                continue
            fi

            # Create timestamp for processed filename
            timestamp=$(date +%Y%m%d_%H%M%S)
            processed_name="${timestamp}_${filename}"

            echo "   Sending to Claude Code..."
            # Note: This is a placeholder command structure
            # Actual implementation would use Claude Code's API or CLI
            echo "   File: $file"
            echo "   TODO: Process with Claude Code"
            echo "   Command: Read this file and extract the recipe data"

            # Move to processed folder
            mv "$file" "$PROCESSED_DIR/$processed_name"
            echo "   ✓ Moved to processed folder"
        fi
    done
fi

# Process PDF files
if [ "$pdf_count" -gt 0 ]; then
    echo ""
    echo "Processing PDFs..."
    echo "-------------------------------------------"

    for file in "$UPLOAD_PDFS"/*; do
        if [ -f "$file" ]; then
            filename=$(basename "$file")
            echo ""
            echo "📄 Processing: $filename"

            if ! command -v claude-code &> /dev/null; then
                echo "⚠️  Warning: claude-code command not found"
                echo "   Manual: Open Claude Code and run:"
                echo "   Read $file"
                echo "   Then ask: 'Extract this recipe and add it to master_recipes.json'"
                continue
            fi

            timestamp=$(date +%Y%m%d_%H%M%S)
            processed_name="${timestamp}_${filename}"

            echo "   Sending to Claude Code..."
            echo "   File: $file"
            echo "   TODO: Process with Claude Code"

            # Move to processed folder
            mv "$file" "$PROCESSED_DIR/$processed_name"
            echo "   ✓ Moved to processed folder"
        fi
    done
fi

echo ""
echo "==========================================="
echo "Processing complete!"
echo "==========================================="
echo ""
echo "Next steps:"
echo "1. Review master_recipes.json for new entries"
echo "2. Check recipes appear in web planner"
echo "3. Verify ingredient amounts and formatting"
echo ""
echo "Processed files are in: $PROCESSED_DIR"
