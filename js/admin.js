import { db } from './firebase.js';
import { collection, getDocs, deleteDoc, doc } from 
"https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const el = id => document.getElementById(id);

export async function loadAdmin(){
  el('adminArea').classList.remove('hidden');
  el('userArea').classList.add('hidden');
  el('adminArea').innerHTML = '<h2>Administração</h2>';

  const snap = await getDocs(collection(db,'users'));
  snap.forEach(d=>{
    const div = document.createElement('div');
    div.className='card';
    div.innerHTML = `${d.data().email}
      <button class="btn danger">Excluir</button>`;
    div.querySelector('button').onclick = async()=>{
      await deleteDoc(doc(db,'users',d.id));
      loadAdmin();
    };
    el('adminArea').appendChild(div);
  });
}
