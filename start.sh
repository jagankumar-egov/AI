#!/bin/bash

echo "🚀 Starting Service Config Generator AI..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "server/node_modules" ]; then
    echo "📦 Installing server dependencies..."
    cd server && npm install && cd ..
fi

if [ ! -d "client/node_modules" ]; then
    echo "📦 Installing client dependencies..."
    cd client && npm install && cd ..
fi

# Check if .env file exists in server
if [ ! -f "server/.env" ]; then
    echo "⚠️  No .env file found in server directory."
    echo "📝 Please create server/.env file with your OpenAI API key:"
    echo "   OPENAI_API_KEY=your_openai_api_key_here"
    echo "   PORT=3001"
    echo "   NODE_ENV=development"
fi

# Start the application
echo "🎯 Starting development servers..."
npm run dev
