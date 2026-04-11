
import path from 'path';
import dotenv from 'dotenv';
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

import { GoogleWalletService } from './services/googleWalletService';

async function test() {
  const ticketId = 'acf0c6fe-3b8c-4a15-9064-8712dd2186e2'; // From DB
  console.log('Testing Google Wallet Link Generation for ticket:', ticketId);
  
  try {
    const url = await GoogleWalletService.generateSaveLink(ticketId);
    console.log('\nGenerated Link:');
    console.log(url);
    
    if (url.startsWith('https://pay.google.com/gp/v/save/')) {
        console.log('\n✅ Link generated successfully!');
        const jwtPart = url.split('/save/')[1];
        console.log('Token length:', jwtPart.length);
    } else {
        console.log('\n❌ Link generation failed or returned a placeholder:', url);
    }
  } catch (error) {
    console.error('\n❌ ERROR:', error);
  }
}

test();
