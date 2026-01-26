// ===== FIREBASE =====
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js'
import { getAuth, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js'
import { getFirestore, collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'

// 🔴 COLE AQUI SUA CONFIG DO FIREBASE
const firebaseConfig = {
  // apiKey: "",
  // authDomain: "",
  // projectId: "",
  // storageBucket: "",
  // messagingSenderId: "",
  // appId: ""
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

// ===== ELEMENTOS =====
const loginBox = document.getElementById('loginBox')
const appBox = document.getElementById('app')
const btnLogin = document.getElementById('btnLogin')
const btnLogout = document.getElementById('btnLogout')
const loggedUser = document.getElementById('loggedUser')

// ===== LOGIN =====
btnLogin.addEventListener('click', async () => {
  const user = loginUser.value.trim()
  const pass = loginPass.value

  if (!user || !pass) {
    alert('Preencha todos os campos')
    return
  }

  try {
    const snap = await getDocs(collection(db, 'users'))
    let found = null

    snap.forEach(doc => {
      if (doc.data().username === user) {
        found = doc.data()
      }
    })

    if (!found) {
      alert('Usuário não encontrado')
      return
    }

    await signInWithEmailAndPassword(auth, found.email, pass)

    loginBox.classList.add('hidden')
    appBox.classList.remove('hidden')
    loggedUser.innerText = found.username

  } catch (err) {
    console.error(err)
    alert('Erro ao logar')
  }
})

// ===== LOGOUT =====
btnLogout.addEventListener('click', async () => {
  await signOut(auth)
  location.reload()
})

