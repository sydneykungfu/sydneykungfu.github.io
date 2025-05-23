#!/bin/bash

# Directory containing PNG images
IMAGE_DIR="assets/images/moves"

# Create directory if it doesn't exist
mkdir -p "$IMAGE_DIR"

# Convert all PNG files to WebP
for png in "$IMAGE_DIR"/*.png; do
    if [ -f "$png" ]; then
        # Get filename without extension
        filename=$(basename -- "$png")
        filename="${filename%.*}"
        
        # Convert to WebP with quality 80
        cwebp -q 80 "$png" -o "$IMAGE_DIR/$filename.webp"
        
        echo "Converted: $filename.png -> $filename.webp"
    fi
done

echo "Conversion complete!"
