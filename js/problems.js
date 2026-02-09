import { db, el } from './firebase.js';
import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { showModal } from './modal.js';

let currentUserId = null;

export function initProblems(uid) {
    currentUserId = uid;
    loadProblems(uid);
    setupProblemInterface();
}

function setupProblemInterface() {
    el('btnNewProblem').onclick = () => {
        el('newProblemBox').classList.remove('hidden');
        el('problemTitle').focus();
    };

    el('btnCancelProblem').onclick = () => {
        clearProblemForm();
        el('newProblemBox').classList.add('hidden');
    };

    el('btnAddProblem').onclick = async () => {
        const title = el('problemTitle').value.trim();
        const description = el('problemDesc').value.trim();
        const solution = el('problemSolution').value.trim();

        if (!title) return showModal("O título do problema é obrigatório.");
        if (!solution) return showModal("A solução é obrigatória.");

        try {
            await addDoc(collection(db, 'users', currentUserId, 'problems'), {
                title,
                description,
                solution,
                createdAt: Date.now()
            });
            clearProblemForm();
            el('newProblemBox').classList.add('hidden');
            showToast("Problema salvo!");
            loadProblems(currentUserId);
        } catch (e) {
            console.error(e);
            showModal("Erro ao salvar o problema.");
        }
    };
}

function clearProblemForm() {
    el('problemTitle').value = '';
    el('problemDesc').value = '';
    el('problemSolution').value = '';
}

async function loadProblems(userId) {
    const list = el('problemList');
    if (!list) return;

    const snap = await getDocs(collection(db, 'users', userId, 'problems'));
    list.innerHTML = '';

    const docs = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    if (docs.length === 0) {
        list.innerHTML = '<p class="sub center">Nenhum problema cadastrado.</p>';
        return;
    }

    docs.forEach(item => {
        const card = document.createElement('div');
        card.className = 'problem-card card';
        card.innerHTML = `
            <div class="problem-header">
                <h3 class="problem-title">${escapeHtml(item.title)}</h3>
                <div class="problem-actions">
                    <button class="btn ghost btn-edit-problem"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn ghost btn-del-problem"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
            ${item.description ? `<p class="problem-desc">${escapeHtml(item.description)}</p>` : ''}
            <div class="problem-solution">
                <span class="solution-label"><i class="fa-solid fa-lightbulb"></i> Solução</span>
                <p class="solution-text">${escapeHtml(item.solution)}</p>
            </div>
        `;

        // Copiar solução ao clicar
        card.querySelector('.solution-text').onclick = async () => {
            await navigator.clipboard.writeText(item.solution);
            showToast("Solução copiada!");
        };
        card.querySelector('.solution-text').style.cursor = 'pointer';

        // Editar
        card.querySelector('.btn-edit-problem').onclick = () => {
            enterEditMode(card, item, userId);
        };

        // Excluir
        card.querySelector('.btn-del-problem').onclick = async () => {
            await deleteDoc(doc(db, 'users', userId, 'problems', item.id));
            showToast("Problema excluído!");
            loadProblems(userId);
        };

        list.appendChild(card);
    });
}

function enterEditMode(card, item, userId) {
    const header = card.querySelector('.problem-header');
    const desc = card.querySelector('.problem-desc');
    const solutionBlock = card.querySelector('.problem-solution');

    card.innerHTML = `
        <input class="edit-title" type="text" value="${escapeAttr(item.title)}" placeholder="Título do problema..." />
        <textarea class="edit-desc" rows="3" placeholder="Descreva o problema...">${escapeHtml(item.description || '')}</textarea>
        <textarea class="edit-solution" rows="3" placeholder="Solução...">${escapeHtml(item.solution)}</textarea>
        <div class="flex-end mt-10">
            <button class="btn ghost btn-cancel-edit">Cancelar</button>
            <button class="btn primary btn-save-edit">Salvar</button>
        </div>
    `;

    card.querySelector('.edit-title').focus();

    card.querySelector('.btn-save-edit').onclick = async () => {
        const title = card.querySelector('.edit-title').value.trim();
        const description = card.querySelector('.edit-desc').value.trim();
        const solution = card.querySelector('.edit-solution').value.trim();

        if (!title) return showModal("O título do problema é obrigatório.");
        if (!solution) return showModal("A solução é obrigatória.");

        await updateDoc(doc(db, 'users', userId, 'problems', item.id), {
            title, description, solution
        });
        showToast("Problema atualizado!");
        loadProblems(userId);
    };

    card.querySelector('.btn-cancel-edit').onclick = () => loadProblems(userId);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function escapeAttr(text) {
    return text.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function showToast(message) {
    const old = document.querySelector('.toast-success');
    if (old) old.remove();
    const t = document.createElement('div');
    t.className = 'toast-success';
    t.innerText = message;
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 500); }, 2000);
}
