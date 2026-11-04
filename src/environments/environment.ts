// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: "AIzaSyBep2CT6vA6x23M0Ici5WlyESgqvYEz1B0",
  authDomain: "ionic-78303.firebaseapp.com",
  projectId: "ionic-78303",
  storageBucket: "ionic-78303.firebasestorage.app",
  messagingSenderId: "762609466738",
  appId: "1:762609466738:web:fb2ec695144253d0bb71eb",
  measurementId: "G-0ZP0KTCDVY"
};

export const environment = {
  production: false,
  firebaseConfig: firebaseConfig,
};

export const firebaseApp = initializeApp(firebaseConfig);
