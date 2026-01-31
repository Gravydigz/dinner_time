#!/bin/sh
# Check if the configuration files exists in the mounted volume

if [ ! -f /data/master_recipes.json ]; then
  echo "Master recipe file not found in /data, copying from image..."
  cp /tmp/master_recipes.json /data/master_recipes.json
  echo "Copy complete."
else
  echo "Master recipe file exist removing temp file..."
  rm /tmp/master_recipes.json
  echo "File removed."
fi

if [ ! -f /data/ratings.json ]; then
  echo "Ratings file not found in /data, copying from image..."
  cp /tmp/ratings.json /data/ratings.json
  echo "Copy complete."
else
  echo "Ratings file exist removing temp file..."
  rm /tmp/ratings.json
  echo "File removed."
fi

if [ ! -f /data/weekly_plans.json ]; then
  echo "Weekly plans file not found in /data, copying from image..."
  cp /tmp/weekly_plans.json /data/weekly_plans.json
  echo "Copy complete."
else
  echo "Weekly plans file exist removing temp file..."
  rm /tmp/weekly_plans.json
  echo "File removed."
fi

# Execute the main application command (passed as arguments to the script)
exec "$@"
