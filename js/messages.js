import { db } from './firebase.js';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { openConfirmModal, showModal } from './modal.js';

export async function loadMessages(userId){
  msgList.innerHTML = '';
  const snap = await getDocs(collection(db,'users',userId,'messages'));

  const docs = snap.docs
    .map(d=>({id:d.id,...d.data()}))
    .filter(d=>!d.deleted)
    .sort((a,b)=>(a.order||0)-(b.order||0));

  docs.forEach(item=>{
    const row = document.createElement('div');
    row.className = 'user-row';

    const text = document.createElement('div');
    text.textContent = item.text;
    text.onclick = ()=>copy(item.text);

    const del = document.createElement('button');
    del.className = 'btn danger';
    del.innerHTML = '<i class="fa fa-trash"></i>';
    del.onclick = ()=>openConfirmModal(async()=>{
      await updateDoc(doc(db,'users',userId,'messages',item.id),{deleted:true});
      loadMessages(userId);
    });

    row.append(text, del);
    msgList.appendChild(row);
  });
}

function copy(text){
  navigator.clipboard.writeText(text);
}
