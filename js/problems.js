import { 
    db, el,
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc
} from './firebase.js';

import { showModal } from './modal.js';
import { showToast } from './toast.js';

let currentUserId = null;
let allProblems = [];

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

    // Paste de imagens no campo de solução
    setupRichEditor(el('problemSolution'));

    el('btnAddProblem').onclick = async () => {
        const title = el('problemTitle').value.trim();
        const description = el('problemDesc').value.trim();
        const solution = el('problemSolution').innerHTML.trim();

        if (!title) return showModal("O título do problema é obrigatório.");
        if (!solution || solution === '<br>') return showModal("A solução é obrigatória.");

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

    // Pesquisa
    el('problemSearch').oninput = () => {
        const query = el('problemSearch').value.trim().toLowerCase();
        filterProblems(query);
    };
}

function setupRichEditor(editor) {
    editor.addEventListener('paste', (e) => {
        const items = (e.clipboardData || e.originalEvent.clipboardData).items;
        for (const item of items) {
            if (item.type.startsWith('image/')) {
                e.preventDefault();
                const file = item.getAsFile();
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const img = document.createElement('img');
                    img.src = ev.target.result;
                    const selection = window.getSelection();
                    if (selection.rangeCount > 0) {
                        const range = selection.getRangeAt(0);
                        range.deleteContents();
                        range.insertNode(img);
                        range.collapse(false);
                    } else {
                        editor.appendChild(img);
                    }
                };
                reader.readAsDataURL(file);
                return;
            }
        }
    });
}

function clearProblemForm() {
    el('problemTitle').value = '';
    el('problemDesc').value = '';
    el('problemSolution').innerHTML = '';
}

function filterProblems(query) {
    const list = el('problemList');
    const cards = list.querySelectorAll('.problem-card');

    if (!query) {
        cards.forEach(c => c.style.display = '');
        return;
    }

    cards.forEach((card, i) => {
        const item = allProblems[i];
        if (!item) return;
        const text = `${item.title} ${item.description} ${item.solution.replace(/<[^>]*>/g, '')}`.toLowerCase();
        card.style.display = text.includes(query) ? '' : 'none';
    });
}

async function loadProblems(userId) {
    const list = el('problemList');
    if (!list) return;

    try {
        const snap = await getDocs(collection(db, 'users', userId, 'problems'));
        list.innerHTML = '';

        allProblems = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        if (allProblems.length === 0) {
            list.innerHTML = '<p class="sub center">Nenhum problema cadastrado.</p>';
            return;
        }

        allProblems.forEach(item => {
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
                    <div class="solution-text">${sanitizeHtml(item.solution)}</div>
                </div>
            `;

            card.querySelector('.solution-text').onclick = async () => {
                const textOnly = item.solution.replace(/<[^>]*>/g, '').trim();
                if (textOnly) {
                    try {
                        await navigator.clipboard.writeText(textOnly);
                        showToast("Solução copiada!");
                    } catch (err) {
                        console.error("Erro ao copiar:", err);
                    }
                }
            };

            card.querySelector('.btn-edit-problem').onclick = () => {
                enterEditMode(card, item, userId);
            };

            card.querySelector('.btn-del-problem').onclick = async () => {
                try {
                    await deleteDoc(doc(db, 'users', userId, 'problems', item.id));
                    showToast("Problema excluído!");
                    loadProblems(userId);
                } catch (err) {
                    console.error("Erro ao excluir problema:", err);
                    showModal("Erro ao excluir o problema.");
                }
            };

            list.appendChild(card);
        });

        // Re-aplicar filtro se houver pesquisa ativa
        const searchQuery = el('problemSearch')?.value.trim().toLowerCase();
        if (searchQuery) filterProblems(searchQuery);
    } catch (err) {
        console.error("Erro ao carregar problemas:", err);
    }
}

function enterEditMode(card, item, userId) {
    card.innerHTML = `
        <input class="edit-title" type="text" value="${escapeAttr(item.title)}" placeholder="Título do problema..." />
        <textarea class="edit-desc" rows="3" placeholder="Descreva o problema...">${escapeHtml(item.description || '')}</textarea>
        <label class="field-label">Solução <span class="sub">(cole imagens com Ctrl+V)</span></label>
        <div class="rich-editor edit-solution" contenteditable="true">${sanitizeHtml(item.solution)}</div>
        <div class="flex-end mt-10">
            <button class="btn ghost btn-cancel-edit">Cancelar</button>
            <button class="btn primary btn-save-edit">Salvar</button>
        </div>
    `;

    setupRichEditor(card.querySelector('.edit-solution'));
    card.querySelector('.edit-title').focus();

    card.querySelector('.btn-save-edit').onclick = async () => {
        const title = card.querySelector('.edit-title').value.trim();
        const description = card.querySelector('.edit-desc').value.trim();
        const solution = card.querySelector('.edit-solution').innerHTML.trim();

        if (!title) return showModal("O título do problema é obrigatório.");
        if (!solution || solution === '<br>') return showModal("A solução é obrigatória.");

        try {
            await updateDoc(doc(db, 'users', userId, 'problems', item.id), {
                title, description, solution
            });
            showToast("Problema atualizado!");
            loadProblems(userId);
        } catch (err) {
            console.error("Erro ao atualizar problema:", err);
            showModal("Erro ao atualizar o problema.");
        }
    };

    card.querySelector('.btn-cancel-edit').onclick = () => loadProblems(userId);
}

function sanitizeHtml(html) {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    const allowed = new Set(['IMG', 'BR', 'P', 'DIV', '#text']);
    function clean(node) {
        [...node.childNodes].forEach(child => {
            if (child.nodeType === Node.ELEMENT_NODE) {
                if (!allowed.has(child.tagName)) {
                    const text = document.createTextNode(child.textContent);
                    node.replaceChild(text, child);
                } else {
                    if (child.tagName === 'IMG') {
                        const src = child.getAttribute('src');
                        [...child.attributes].forEach(a => child.removeAttribute(a.name));
                        if (src) child.setAttribute('src', src);
                    } else {
                        [...child.attributes].forEach(a => child.removeAttribute(a.name));
                    }
                    clean(child);
                }
            }
        });
    }
    clean(temp);
    return temp.innerHTML;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function escapeAttr(text) {
    return text.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
