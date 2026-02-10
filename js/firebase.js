import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import { 
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    GoogleAuthProvider,
    signInWithRedirect,
    getRedirectResult
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { 
    getFirestore,
    collection,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    setDoc,
    query,
    where,
    writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB3nb-CDShDxKnN-naZdLWlyaXZfI6wvmY",
  authDomain: "respostas-automaticas-35aea.firebaseapp.com",
  projectId: "respostas-automaticas-35aea",
  storageBucket: "respostas-automaticas-35aea.firebasestorage.app",
  messagingSenderId: "61793341031",
  appId: "1:61793341031:web:572601dfa18fbf88248ec2"
};

// App principal
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// App secundário para criação de usuários (Admin)
export const secondaryApp = initializeApp(firebaseConfig, 'Secondary');
export const secondaryAuth = getAuth(secondaryApp);

// Atalho útil
export const el = id => document.getElementById(id);

// Provider do Google
export const googleProvider = new GoogleAuthProvider();

// Re-exporta tudo do Auth
export {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    signInWithRedirect,
    getRedirectResult
};

// Re-exporta tudo do Firestore
export {
    collection,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    setDoc,
    query,
    where,
    writeBatch
};
