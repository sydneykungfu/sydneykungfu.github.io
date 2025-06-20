#!/bin/bash
# Convert all PNG and JPG images in a given directory (and subfolders) to WebP

IMG_DIR="${1:-assets/images}"
DEST_DIR="${2:-}"

find "$IMG_DIR" \( -iname '*.png' -o -iname '*.jpg' -o -iname '*.jpeg' \) | while read img; do
  # Preserve subdirectory structure in DEST_DIR or use IMG_DIR if DEST_DIR is not set
  if [ -z "$DEST_DIR" ]; then
    dest_path="${img%.*}.webp"
  else
    rel_path="${img#$IMG_DIR/}"
    dest_path="$DEST_DIR/${rel_path%.*}.webp"
    mkdir -p "$(dirname "$dest_path")"
  fi
  cwebp -q 80 "$img" -o "$dest_path"
  echo "Converted $img -> $dest_path"
done
