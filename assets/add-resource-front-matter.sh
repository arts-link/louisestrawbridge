#!/bin/bash

# Function to extract the title from the front matter of index.md
get_title_from_front_matter() {
    # Extract the title from the index.md file (assuming TOML front matter)
    local index_file=$1
    # title=$(sed -n 's/^title = "\(.*\)"/\1/p' "$index_file")
    # title=$(sed -n 's/^title = \(["\x27][^"]*\1\)/\1/p' "$index_file")
    # title=$(sed -n 's/^title = \(["'\''"][^"'\'']*\)["'\''"]/ \1/p' "$index_file")
    # title=$(sed -n 's/^title = \(["'\''"][^"'\'']*\)["'\''"]$/\1/p' "$index_file" | xargs)
    # title=$(sed -n 's/^title = \(["'\''"][^"'\'']*\)["'\''"]/\1/p' "$index_file" | sed 's/^ *//;s/ *$//')
    title=$(sed -n 's/^title = ["'\''"]\([^"'\'']*\)["'\''"]$/\1/p' "$index_file")
    echo "$title"
}

# Loop through all directories recursively
find . -type f -name 'index.md' | while read -r index_file; do
    # Get the title from front matter
    title=$(get_title_from_front_matter "$index_file")
    
    # If a title was found, loop through all images in the directory
    if [ -n "$title" ]; then
        dir=$(dirname "$index_file")
        echo "Processing directory: $dir"
        
        # Loop through each image in the directory (e.g., jpg, png, etc.)
        find "$dir" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.gif" \) | while read -r image; do
            # Run exiftool on each image with the title as the ImageDescription
            echo "Setting ImageDescription for $image to \"$title\""
            exiftool -overwrite_original -ImageDescription="$title" "$image"
        done
    else
        echo "No title found in front matter for $index_file"
    fi
done