#!/usr/bin/env node

const generateApiKey = require('../utils/generateApiKey');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Generate a new API key
const apiKey = generateApiKey();

console.log('\n======================================');
console.log('Generated API key:', apiKey);
console.log('======================================\n');

// Ask if user wants to update the .env file
const args = process.argv.slice(2);
const updateEnv = args.includes('--update-env') || args.includes('-u');

if (updateEnv) {
  const envPath = path.join(process.cwd(), '.env');
  
  try {
    // Check if .env exists
    if (fs.existsSync(envPath)) {
      // Read the .env file
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      // Check if API_KEY exists in the file
      if (envContent.includes('API_KEY=')) {
        // Replace the API_KEY value
        envContent = envContent.replace(/API_KEY=.*$/m, `API_KEY=${apiKey}`);
      } else {
        // Append the API_KEY to the file
        envContent += `\nAPI_KEY=${apiKey}\n`;
      }
      
      // Write the updated content back to the .env file
      fs.writeFileSync(envPath, envContent);
      console.log('✅ .env file updated with the new API key.');
    } else {
      console.log('❌ .env file not found. Please create one and add your API key manually.');
    }
  } catch (error) {
    console.error('Error updating .env file:', error.message);
  }
  
  console.log('\nMake sure to update your clients to use this API key in the "x-api-key" header.');
} else {
  console.log('To automatically update your .env file with this key, run:');
  console.log('node src/scripts/generateKey.js --update-env');
} 