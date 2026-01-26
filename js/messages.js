import { db } from './firebase.js';
import { collection, addDoc, getDocs } from 
"https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function loadMessages(uid){
  const area = document.getElementById('userArea');
  area.innerHTML = '<h2>Mensagens</h2>';

  const snap = await getDocs(collection(db,'users',uid,'messages'));
  snap.forEach(d=>{
    const div = document.createElement('div');
    div.className='card';
    div.textContent = d.data().text;
    div.onclick = ()=>navigator.clipboard.writeText(d.data().text);
    area.appendChild(div);
  });

  const btn = document.createElement('button');
  btn.className='btn primary';
  btn.textContent='Nova mensagem';
  btn.onclick = async ()=>{
    const text = prompt('Mensagem');
    if(text) await addDoc(collection(db,'users',uid,'messages'),{text});
    loadMessages(uid);
  };
  area.appendChild(btn);
}

