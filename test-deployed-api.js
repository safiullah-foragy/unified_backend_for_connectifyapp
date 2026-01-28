import axios from 'axios';

const API_BASE_URL = 'https://unified-backend-for-connectifyapp.onrender.com';
const API_KEY = 'f4c8d1a7e92b6c3f5a1d8e2f9b7c4a6d8e1f2b3c9d7a8e6f1b2c3d4e5f6a7b8c'; // Your API key

console.log('🧪 Testing Unified Backend API...\n');

// Test 1: Root endpoint
async function testRoot() {
  try {
    console.log('1️⃣ Testing root endpoint (/)...');
    const response = await axios.get(`${API_BASE_URL}/`);
    console.log('✅ Success:', response.data);
    console.log('');
  } catch (error) {
    console.error('❌ Failed:', error.message);
    console.log('');
  }
}

// Test 2: Health check
async function testHealth() {
  try {
    console.log('2️⃣ Testing health endpoint (/api/health)...');
    const response = await axios.get(`${API_BASE_URL}/api/health`);
    console.log('✅ Success:', response.data);
    console.log('');
  } catch (error) {
    console.error('❌ Failed:', error.message);
    console.log('');
  }
}

// Test 3: Agora endpoint (protected)
async function testAgora() {
  try {
    console.log('3️⃣ Testing Agora token generation (/api/agora/token)...');
    const response = await axios.post(
      `${API_BASE_URL}/api/agora/token`,
      {
        channelName: 'test-channel',
        uid: 12345,
        role: 'publisher'
      },
      {
        headers: {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ Success:', response.data);
    console.log('');
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
    console.log('');
  }
}

// Test 4: AI endpoint (protected)
async function testAI() {
  try {
    console.log('4️⃣ Testing AI health check (/api/ai/health)...');
    const response = await axios.get(
      `${API_BASE_URL}/api/ai/health`,
      {
        headers: {
          'X-API-Key': API_KEY
        }
      }
    );
    console.log('✅ Success:', response.data);
    console.log('');
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
    console.log('');
  }
}

// Test 5: Job API endpoint (protected)
async function testJobs() {
  try {
    console.log('5️⃣ Testing Jobs endpoint (/api/jobs/health)...');
    const response = await axios.get(
      `${API_BASE_URL}/api/jobs/health`,
      {
        headers: {
          'X-API-Key': API_KEY
        }
      }
    );
    console.log('✅ Success:', response.data);
    console.log('');
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
    console.log('');
  }
}

// Test 6: Storage endpoint (protected)
async function testStorage() {
  try {
    console.log('6️⃣ Testing Storage health check (/api/storage/health)...');
    const response = await axios.get(
      `${API_BASE_URL}/api/storage/health`,
      {
        headers: {
          'X-API-Key': API_KEY
        }
      }
    );
    console.log('✅ Success:', response.data);
    console.log('');
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
    console.log('');
  }
}

// Run all tests
async function runTests() {
  await testRoot();
  await testHealth();
  await testAgora();
  await testAI();
  await testJobs();
  await testStorage();
  
  console.log('🎉 Testing complete!');
}

runTests();
