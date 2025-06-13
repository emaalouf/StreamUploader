#!/bin/bash

echo "Setting up Cloudflare Stream & R2 Upload API..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Check if .env file exists
if [ ! -f ".env" ]; then
  echo "Creating .env file..."
  cp .env.example .env
  echo ".env file created. Please update it with your Cloudflare credentials."
else
  echo ".env file already exists."
fi

# Create necessary directories
echo "Creating necessary directories..."
mkdir -p public

echo "Setup complete! Run 'npm run dev' to start the development server." 