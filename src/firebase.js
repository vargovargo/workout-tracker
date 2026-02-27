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
  apiKey: "AIzaSyA-BVe-XAkexaOejvP-v-7U5PllAybWl0U",
  authDomain: "vargo-88ad4.firebaseapp.com",
  projectId: "vargo-88ad4",
  storageBucket: "vargo-88ad4.firebasestorage.app",
  messagingSenderId: "387632472914",
  appId: "1:387632472914:web:3f06d98ccd1a6cce6f908b",
  measurementId: "G-SRB673JHCY"
};

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
