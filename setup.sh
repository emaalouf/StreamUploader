#!/bin/bash

echo "Setting up Cloudflare Stream & R2 Upload API..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Create necessary directories
echo "Creating necessary directories..."
mkdir -p public src/middleware src/services src/routes src/utils src/scripts

# Check if .env file exists
if [ ! -f ".env" ]; then
  echo "Creating .env file..."
  cp .env.example .env
  echo ".env file created. Please update it with your Cloudflare credentials."
else
  echo ".env file already exists."
fi

# Make scripts executable
chmod +x src/scripts/generateKey.js

# Generate API key
echo "Generating API key..."
node src/scripts/generateKey.js --update-env

echo "Setup complete! Run 'npm run dev' to start the development server." 