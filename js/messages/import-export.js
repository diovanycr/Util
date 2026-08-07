// ============================================================
//  messages/import-export.js — Importação e exportação de mensagens
// ============================================================

import {
    db,
    collection, doc, query, limit
} from '../firebase.js';
import { getDocs, writeBatch } from '../firebase-retry.js';
import { openConfirmModal, showModal } from '../modal.js';
import { showToast } from '../toast.js';
import { allMessages } from './state.js';

export async function importFromTxt(event, userId, callbacks) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const rawContent = e.target.result;
            const content = rawContent.trim();

            let messagesToImport = [];

            if (content.startsWith('[') && content.endsWith(']')) {
                const parsed = JSON.parse(content);
                messagesToImport = parsed.map(item => ({
                    text: item.text || '',
                    title: item.title || '',
                    category: item.category || 'Geral',
                    order: item.order || 999
                })).filter(item => item.text);
            } else {
                const newLines = rawContent.split('\n').map(l => l.trim()).filter(Boolean);
                messagesToImport = newLines.map(line => ({
                    text: line.replace(/\\n/g, '\n').replace(/\\r/g, '\r'),
                    title: '',
                    category: 'Geral',
                    order: 999
                }));
            }

            if (messagesToImport.length === 0) return showModal("O arquivo está vazio ou inválido.");

            // Limita a busca de duplicatas a 500 registros para não degradar em bases grandes.
            const snap = await getDocs(query(collection(db, 'users', userId, 'messages'), limit(500)));
            const existingItems = snap.docs.map(d => ({ id: d.id, text: d.data().text }));
            const duplicates = messagesToImport.filter(item => existingItems.some(ext => ext.text === item.text));

            const processImport = async (replaceDuplicates) => {
                let added = 0;
                const operations = [];

                for (const item of messagesToImport) {
                    const existing = existingItems.find(ext => ext.text === item.text);
                    if (existing) {
                        if (replaceDuplicates) {
                            operations.push({
                                type: 'update',
                                ref: doc(db, 'users', userId, 'messages', existing.id),
                                data: {
                                    deleted: false,
                                    title: item.title || '',
                                    category: item.category || 'Geral',
                                    updatedAt: Date.now()
                                }
                            });
                            added++;
                        }
                    } else {
                        const newDocRef = doc(collection(db, 'users', userId, 'messages'));
                        operations.push({
                            type: 'set',
                            ref: newDocRef,
                            data: {
                                text: item.text,
                                title: item.title || '',
                                category: item.category || 'Geral',
                                order: item.order || 999,
                                deleted: false,
                                createdAt: Date.now()
                            }
                        });
                        added++;
                    }
                }

                const BATCH_SIZE = 500;
                for (let i = 0; i < operations.length; i += BATCH_SIZE) {
                    const batch = writeBatch(db);
                    const chunk = operations.slice(i, i + BATCH_SIZE);
                    chunk.forEach(op => {
                        if (op.type === 'update') {
                            batch.update(op.ref, op.data);
                        } else if (op.type === 'set') {
                            batch.set(op.ref, op.data);
                        }
                    });
                    await batch.commit();
                    const processed = Math.min(i + BATCH_SIZE, operations.length);
                    showToast(`Importando... ${processed}/${operations.length}`);
                }

                showToast(`${added} mensagens processadas!`);
                callbacks.onDone();
            };

            if (duplicates.length > 0) {
                openConfirmModal(
                    () => processImport(true), () => processImport(false),
                    `Encontramos ${duplicates.length} mensagens repetidas. Deseja substituir as existentes?`
                );
            } else { processImport(false); }
        } catch (err) { showModal("Erro ao ler o arquivo."); }
    };
    reader.readAsText(file);
}

export function exportAsFile(content, filename, mimeType) {
    try {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    } catch (e) { showModal("Erro ao exportar."); }
}

export function exportToTxt() {
    if (allMessages.length === 0) return showModal("Não há mensagens para exportar.");
    const lines = allMessages.map(d => d.text.replace(/\n/g, '\\n').replace(/\r/g, '\\r'));
    const filename = `backup_mensagens_${new Date().toISOString().slice(0, 10)}.txt`;
    exportAsFile(lines.join('\n'), filename, 'text/plain;charset=utf-8');
    showToast("Exportado como TXT!");
}

export function exportToJson() {
    if (allMessages.length === 0) return showModal("Não há mensagens para exportar.");
    const exportData = allMessages.map(({ text, title, category }) => ({ text, title: title || '', category: category || 'Geral' }));
    const filename = `backup_mensagens_${new Date().toISOString().slice(0, 10)}.json`;
    exportAsFile(JSON.stringify(exportData, null, 2), filename, 'application/json;charset=utf-8');
    showToast("Exportado como JSON!");
}
