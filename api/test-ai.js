import dotenv from 'dotenv';
import ModelClient, { isUnexpected } from '@azure-rest/ai-inference';
import { AzureKeyCredential } from '@azure/core-auth';

dotenv.config();

const token = process.env['GITHUB_TOKEN'];
const endpoint = 'https://models.github.ai/inference';
const modelName = 'meta/Llama-3.1-8B-Instruct';

async function testAI() {
  console.log('🔍 Testing GitHub Models AI Integration...\n');
  
  // Check token
  if (!token) {
    console.error('❌ GITHUB_TOKEN not found!');
    console.log('💡 Please add GITHUB_TOKEN to your .env file');
    console.log('📖 Get your token from: https://github.com/settings/tokens');
    process.exit(1);
  }
  
  console.log('✅ GITHUB_TOKEN found');
  console.log(`🔑 Token length: ${token.length} characters`);
  console.log(`🌐 Endpoint: ${endpoint}`);
  console.log(`🤖 Model: ${modelName}\n`);
  
  try {
    const client = ModelClient(endpoint, new AzureKeyCredential(token));
    
    console.log('🚀 Sending test request...\n');
    
    const response = await client.path('/chat/completions').post({
      body: {
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Say "Hello, AI is working!" and add a fun emoji' }
        ],
        temperature: 1.0,
        top_p: 1.0,
        model: modelName
      }
    });

    if (isUnexpected(response)) {
      throw response.body.error;
    }

    const answer = response.body.choices[0].message.content;
    
    console.log('✅ SUCCESS! AI is working correctly!\n');
    console.log('💬 AI Response:');
    console.log('─'.repeat(50));
    console.log(answer);
    console.log('─'.repeat(50));
    
  } catch (error) {
    console.error('\n❌ ERROR: AI test failed!\n');
    console.error('📛 Error Message:', error.message);
    
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      console.error('\n💡 Your token might be invalid or expired.');
      console.log('📖 Get a new token from: https://github.com/settings/tokens');
    }
    
    if (error.message.includes('404')) {
      console.error('\n💡 The model or endpoint might be incorrect.');
      console.log('📖 Check available models at: https://github.com/marketplace/models');
    }
    
    process.exit(1);
  }
}

testAI();
