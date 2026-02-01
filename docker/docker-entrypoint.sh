#!/bin/sh
# Check if the configuration files exists in the mounted volume

if [ ! -f /app/data/master_recipes.json ]; then
  echo "Master recipe file not found in /app/data, copying from image..."
  cp /app/tmp/master_recipes.json /app/data/master_recipes.json
  echo "Copy complete."
else
  echo "Master recipe file exists, removing temp file..."
  rm -f /app/tmp/master_recipes.json
  echo "File removed."
fi

if [ ! -f /app/data/ratings.json ]; then
  echo "Ratings file not found in /app/data, copying from image..."
  cp /app/tmp/ratings.json /app/data/ratings.json
  echo "Copy complete."
else
  echo "Ratings file exists, removing temp file..."
  rm -f /app/tmp/ratings.json
  echo "File removed."
fi

if [ ! -f /app/data/weekly_plans.json ]; then
  echo "Weekly plans file not found in /app/data, copying from image..."
  cp /app/tmp/weekly_plans.json /app/data/weekly_plans.json
  echo "Copy complete."
else
  echo "Weekly plans file exists, removing temp file..."
  rm -f /app/tmp/weekly_plans.json
  echo "File removed."
fi

if [ ! -f /app/data/members.json ]; then
  echo "Members file not found in /app/data, copying from image..."
  cp /app/tmp/members.json /app/data/members.json
  echo "Copy complete."
else
  echo "Members file exists, removing temp file..."
  rm -f /app/tmp/members.json
  echo "File removed."
fi

# Execute the main application command (passed as arguments to the script)
exec "$@"
