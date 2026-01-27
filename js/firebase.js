import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB3nb-CDShDxKnN-naZdLWlyaXZfI6wvmY",
  authDomain: "respostas-automaticas-35aea.firebaseapp.com",
  projectId: "respostas-automaticas-35aea",
  storageBucket: "respostas-automaticas-35aea.appspot.com",
  messagingSenderId: "61793341031",
  appId: "1:61793341031:web:572601dfa18fbf88248ec2"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
