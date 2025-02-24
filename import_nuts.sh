#!/bin/bash
echo "Importing NUTS GeoJSON file into MongoDB..."
# Variables
GEOJSON_FILE="data/nuts_features.json"
DATABASE_NAME="onbird"
COLLECTION_NAME="nuts"

# check if the file exists
if [ ! -f $GEOJSON_FILE ]; then
    echo "GeoJSON file not found!"
    exit 1
fi

# Import GeoJSON file into MongoDB
mongoimport --db $DATABASE_NAME --collection $COLLECTION_NAME --file $GEOJSON_FILE --jsonArray

echo "GeoJSON file imported successfully into MongoDB."
