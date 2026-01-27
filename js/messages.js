import { db, el } from './firebase.js';
import { collection, getDocs, addDoc, updateDoc, doc, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { openConfirmModal, showModal } from './modal.js';

let currentUserId = null;
let dragSrc = null;

export function initMessages(uid) {
    currentUserId = uid;
    loadMessages(uid);
    updateTrashCount(uid);
    setupUserInterface();
}

function setupUserInterface() {
    el('btnNewMsg').onclick = () => {
        el('newMsgBox').classList.remove('hidden');
        el('msgText').focus();
    };

    el('btnCancelMsg').onclick = () => {
        el('msgText').value = '';
        el('newMsgBox').classList.add('hidden');
    };

    el('btnAddMsg').onclick = async () => {
        const text = el('msgText').value.trim();
        if (!text) return showModal("Digite uma mensagem.");

        const snap = await getDocs(collection(db, 'users', currentUserId, 'messages'));
        const maxOrder = snap.docs.reduce((m, d) => Math.max(m, d.data().order || 0), 0);

        await addDoc(collection(db, 'users', currentUserId, 'messages'), {
            text,
            order: maxOrder + 1,
            deleted: false,
            createdAt: Date.now()
        });

        el('msgText').value = '';
        el('newMsgBox').classList.add('hidden');
        loadMessages(currentUserId);
    };

    el('btnTrashToggle').onclick = () => el('trashActions').classList.toggle('hidden');
}

export async function loadMessages(userId) {
    el('msgList').innerHTML = '';
    const snap = await getDocs(collection(db, 'users', userId, 'messages'));
    
    const docs = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(d => !d.deleted)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

    docs.forEach(item => {
        const row = document.createElement('div');
        row.className = 'user-row';
        row.draggable = true;
        row.dataset.id = item.id;

        row.innerHTML = `
            <span class="drag-handle">&#9776;</span>
            <div class="msg-text" style="flex:1; cursor:pointer">${item.text}</div>
            <button class="btn danger"><i class="fa-solid fa-trash"></i></button>
        `;

        // Lógica de Copiar original
        row.querySelector('.msg-text').onclick = () => {
            navigator.clipboard.writeText(item.text);
            showToast("Copiado!");
        };

        // Lógica de Deletar original (Abre seu ConfirmModal)
        row.querySelector('.btn.danger').onclick = () => {
            openConfirmModal(async () => {
                await updateDoc(doc(db, 'users', userId, 'messages', item.id), { 
                    deleted: true, 
                    deletedAt: Date.now() 
                });
                loadMessages(userId);
                updateTrashCount(userId);
            });
        };

        // Drag & Drop original
        row.addEventListener('dragstart', () => { dragSrc = row; row.style.opacity = '0.5'; });
        row.addEventListener('dragend', () => { row.style.opacity = '1'; saveOrder(userId); });
        row.addEventListener('dragover', (e) => {
            e.preventDefault();
            const list = el('msgList');
            const rect = row.getBoundingClientRect();
            if (e.clientY > rect.top + rect.height / 2) list.insertBefore(dragSrc, row.nextSibling);
            else list.insertBefore(dragSrc, row);
        });

        el('msgList').appendChild(row);
    });
}

async function saveOrder(userId) {
    const rows = [...el('msgList').children];
    for (let i = 0; i < rows.length; i++) {
        const id = rows[i].dataset.id;
        if (id) await updateDoc(doc(db, 'users', userId, 'messages', id), { order: i + 1 });
    }
}

async function updateTrashCount(userId) {
    const snap = await getDocs(collection(db, 'users', userId, 'messages'));
    const count = snap.docs.filter(d => d.data().deleted).length;
    const badge = el('trashCount');
    if (count > 0) {
        badge.textContent = count;
        badge.style.display = 'inline-block';
    } else {
        badge.style.display = 'none';
    }
}

function showToast(msg) {
    // Sua lógica de toast original
    alert(msg); 
}
