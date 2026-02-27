import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

// ---------------------------------------------------------------------------
// SETUP INSTRUCTIONS
// 1. Go to https://console.firebase.google.com and create a new project.
// 2. In the project, click "Firestore Database" → Create database → Start in
//    test mode (allows open read/write while you're getting started).
// 3. Click the gear icon → Project Settings → Your apps → Add app (Web).
//    Copy the firebaseConfig object and replace the values below.
// 4. (Optional, recommended later) Lock down Firestore Rules so only your
//    own data is accessible. A simple personal-use rule:
//
//    rules_version = '2';
//    service cloud.firestore {
//      match /databases/{database}/documents {
//        match /{document=**} {
//          allow read, write: if true;
//        }
//      }
//    }
// ---------------------------------------------------------------------------
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT_ID.appspot.com',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID',
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
