const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

/**
 * Generate a secure API key
 * @returns {string} The generated API key
 */
function generateApiKey() {
  // Generate a UUID
  const uuid = uuidv4();
  
  // Generate a random buffer
  const randomBytes = crypto.randomBytes(16).toString('hex');
  
  // Combine and hash the values
  const combinedValue = `${uuid}-${randomBytes}-${Date.now()}`;
  const hash = crypto.createHash('sha256').update(combinedValue).digest('hex');
  
  // Return a subset of the hash for a more manageable API key
  return hash.slice(0, 32);
}

module.exports = generateApiKey; 