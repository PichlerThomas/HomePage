#!/bin/bash

# Download all images from original Cerulean Circle site
# Test-First: These are the exact images identified by automated tests

set -e

BASE_URL="https://ceruleancircle.com/images"
OUTPUT_DIR="images"

# Create images directory
mkdir -p "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR/books"

echo "📥 Downloading images from $BASE_URL..."

# Logo images (5 instances, but only need 1)
echo "Downloading logo..."
curl -L "$BASE_URL/logo-white-o.webp" -o "$OUTPUT_DIR/logo-white-o.webp" || echo "⚠️  Failed: logo-white-o.webp"
curl -L "$BASE_URL/logo.webp" -o "$OUTPUT_DIR/logo.webp" || echo "⚠️  Failed: logo.webp"

# Technology highlights
echo "Downloading technology highlights..."
curl -L "$BASE_URL/tech-metastructures.png" -o "$OUTPUT_DIR/tech-metastructures.png" || echo "⚠️  Failed: tech-metastructures.png"
curl -L "$BASE_URL/tech-metaverses.jpg" -o "$OUTPUT_DIR/tech-metaverses.jpg" || echo "⚠️  Failed: tech-metaverses.jpg"
curl -L "$BASE_URL/tech-intralogistics.png" -o "$OUTPUT_DIR/tech-intralogistics.png" || echo "⚠️  Failed: tech-intralogistics.png"

# Transformations
echo "Downloading transformations image..."
curl -L "$BASE_URL/abound.webp" -o "$OUTPUT_DIR/abound.webp" || echo "⚠️  Failed: abound.webp"

# Methods
echo "Downloading method images..."
curl -L "$BASE_URL/method-design.webp" -o "$OUTPUT_DIR/method-design.webp" || echo "⚠️  Failed: method-design.webp"
curl -L "$BASE_URL/method-ecologies.webp" -o "$OUTPUT_DIR/method-ecologies.webp" || echo "⚠️  Failed: method-ecologies.webp"
curl -L "$BASE_URL/method-metamodeling.webp" -o "$OUTPUT_DIR/method-metamodeling.webp" || echo "⚠️  Failed: method-metamodeling.webp"

# Technology stack
echo "Downloading technology stack images..."
curl -L "$BASE_URL/woda-component.webp" -o "$OUTPUT_DIR/woda-component.webp" || echo "⚠️  Failed: woda-component.webp"
curl -L "$BASE_URL/woda-stack.webp" -o "$OUTPUT_DIR/woda-stack.webp" || echo "⚠️  Failed: woda-stack.webp"
curl -L "$BASE_URL/woda-m2m.webp" -o "$OUTPUT_DIR/woda-m2m.webp" || echo "⚠️  Failed: woda-m2m.webp"

# Currency
echo "Downloading currency image..."
curl -L "$BASE_URL/2cu.gif" -o "$OUTPUT_DIR/2cu.gif" || echo "⚠️  Failed: 2cu.gif"

# Partners
echo "Downloading partner images..."
curl -L "$BASE_URL/gunther.webp" -o "$OUTPUT_DIR/gunther.webp" || echo "⚠️  Failed: gunther.webp"
curl -L "$BASE_URL/marcel.webp" -o "$OUTPUT_DIR/marcel.webp" || echo "⚠️  Failed: marcel.webp"

# Books
echo "Downloading book cover images..."
curl -L "$BASE_URL/book-surviving.webp" -o "$OUTPUT_DIR/books/book-surviving.webp" || echo "⚠️  Failed: book-surviving.webp"
curl -L "$BASE_URL/book-lean.webp" -o "$OUTPUT_DIR/books/book-lean.webp" || echo "⚠️  Failed: book-lean.webp"
curl -L "$BASE_URL/book-vaclav.webp" -o "$OUTPUT_DIR/books/book-vaclav.webp" || echo "⚠️  Failed: book-vaclav.webp"
curl -L "$BASE_URL/book-energy.webp" -o "$OUTPUT_DIR/books/book-energy.webp" || echo "⚠️  Failed: book-energy.webp"
curl -L "$BASE_URL/book-perilous.webp" -o "$OUTPUT_DIR/books/book-perilous.webp" || echo "⚠️  Failed: book-perilous.webp"
curl -L "$BASE_URL/book-abiogenesis.webp" -o "$OUTPUT_DIR/books/book-abiogenesis.webp" || echo "⚠️  Failed: book-abiogenesis.webp"
curl -L "$BASE_URL/book-pekka.webp" -o "$OUTPUT_DIR/books/book-pekka.webp" || echo "⚠️  Failed: book-pekka.webp"
curl -L "$BASE_URL/book-primal.webp" -o "$OUTPUT_DIR/books/book-primal.webp" || echo "⚠️  Failed: book-primal.webp"
curl -L "$BASE_URL/book-voice.webp" -o "$OUTPUT_DIR/books/book-voice.webp" || echo "⚠️  Failed: book-voice.webp"
curl -L "$BASE_URL/book-daniele.webp" -o "$OUTPUT_DIR/books/book-daniele.webp" || echo "⚠️  Failed: book-daniele.webp"
curl -L "$BASE_URL/book-matthieu.webp" -o "$OUTPUT_DIR/books/book-matthieu.webp" || echo "⚠️  Failed: book-matthieu.webp"
curl -L "$BASE_URL/book-crypto.webp" -o "$OUTPUT_DIR/books/book-crypto.webp" || echo "⚠️  Failed: book-crypto.webp"

# Contact
echo "Downloading contact section image..."
curl -L "$BASE_URL/evolution.png" -o "$OUTPUT_DIR/evolution.png" || echo "⚠️  Failed: evolution.png"

echo ""
echo "✅ Download complete!"
echo "📊 Verifying downloads..."
ls -lh "$OUTPUT_DIR" | grep -E "\.(webp|png|jpg|gif)$" | wc -l | xargs echo "Images downloaded:"

