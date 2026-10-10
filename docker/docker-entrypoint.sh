#!/bin/sh
# Check if the configuration files exists in the mounted volume.
# On first run, copy a default from the image. Real data files are not shipped
# in the image (they are encrypted in the repo), so fall back to the fake
# .example.json samples.

init_data_file() {
  name="$1"
  example="${name%.json}.example.json"

  if [ ! -f "/app/data/$name" ]; then
    if [ -f "/app/tmp/$name" ]; then
      echo "$name not found in /app/data, copying from image..."
      cp "/app/tmp/$name" "/app/data/$name"
    elif [ -f "/app/tmp/$example" ]; then
      echo "$name not found in /app/data, copying template $example..."
      cp "/app/tmp/$example" "/app/data/$name"
    else
      echo "WARNING: no default available for $name"
      return
    fi
    echo "Copy complete."
  else
    echo "$name exists, removing temp file..."
    rm -f "/app/tmp/$name"
    echo "File removed."
  fi
}

init_data_file master_recipes.json
init_data_file ratings.json
init_data_file weekly_plans.json
init_data_file members.json

# Execute the main application command (passed as arguments to the script)
exec "$@"
