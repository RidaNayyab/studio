
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAt0Y1P-anoPxGb6DfUmOcYbZCqvxrrGbE",
  authDomain: "taskflow-jdsd9.firebaseapp.com",
  projectId: "taskflow-jdsd9",
  storageBucket: "taskflow-jdsd9.appspot.com",
  messagingSenderId: "895372371819",
  appId: "1:895372371819:web:26bf14b41d2707bb504e2e",
  measurementId: ""
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
