import { auth, db } from './firebase.js';
import { signInWithEmailAndPassword, signOut } from 
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, getDocs } from 
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { showModal } from './modal.js';
import { loadUsers } from './admin.js';
import { loadMessages } from './messages.js';

export let currentUserId = null;

export async function doLogin(){
  const username = loginUser.value.trim().toLowerCase();
  const password = loginPass.value.trim();

  if(!username || !password){
    showModal('Preencha usuário e senha');
    return;
  }

  const snap = await getDocs(collection(db,'users'));
  const userDoc = snap.docs.find(d =>
    (d.data().username||'').toLowerCase() === username
  );

  if(!userDoc){
    showModal('Usuário não encontrado');
    return;
  }

  const user = userDoc.data();
  if(user.blocked){
    showModal('Usuário bloqueado');
    return;
  }

  try{
    await signInWithEmailAndPassword(auth, user.email, password);
    currentUserId = auth.currentUser.uid;

    loginBox.classList.add('hidden');
    app.classList.remove('hidden');

    loggedUser.innerText = user.role === 'admin'
      ? `Logado como ADMIN (${user.username})`
      : `Logado como ${user.username}`;

    if(user.role === 'admin'){
      adminArea.style.display = 'block';
      userArea.classList.add('hidden');
      loadUsers();
    }else{
      adminArea.style.display = 'none';
      userArea.classList.remove('hidden');
      loadMessages(currentUserId);
    }

  }catch{
    showModal('Senha incorreta');
  }
}

export async function doLogout(){
  await signOut(auth);
  location.reload();
}
