import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && values.length > 0) {
    env[key.trim()] = values.join('=').trim().replace(/['"]/g, '');
  }
});

const processEnv = env;

const firebaseConfig = {
  apiKey: processEnv.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: processEnv.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: processEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: processEnv.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: processEnv.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: processEnv.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fetchRoutes() {
  const snapshot = await getDocs(collection(db, 'routes'));
  const routes = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  
  routes.forEach(r => {
    console.log(`Route: ${r.name}`);
    console.log(`  fromLabel: ${r.fromLabel}`);
    console.log(`  toLabel: ${r.toLabel}`);
    console.log(`  fromPlaceholder: ${r.fromPlaceholder}`);
    console.log(`  toPlaceholder: ${r.toPlaceholder}`);
  });
}

fetchRoutes().then(() => process.exit(0)).catch(console.error);
