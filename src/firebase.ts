import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCSyV1KHm43RuHKr-HuG5K4GkSi_A83gHY",
  authDomain: "gen-lang-client-0763773108.firebaseapp.com",
  projectId: "gen-lang-client-0763773108",
  storageBucket: "gen-lang-client-0763773108.firebasestorage.app",
  messagingSenderId: "82007339814",
  appId: "1:82007339814:web:f9554ab4cbe4995ea807e7"
};

const app = initializeApp(firebaseConfig);

// Use the databaseId "ai-studio-ec47a02a-6323-4b12-9c36-6080da22f684" specified in config
export const db = getFirestore(app, "ai-studio-ec47a02a-6323-4b12-9c36-6080da22f684");
