/**
 * aiAssistant.js — Assistente de IA para Gerar e Reescrever Respostas Prontas
 *
 * Funcionalidades:
 * - Abertura e controle do modal interativo de IA (pelo form ou pela toolbar global)
 * - Modos de IA: Formal, Amigável, Sucinto, Ortografia e Gerar por Ideia
 * - Preservação inteligente do placeholder {usuario}
 * - Pré-visualização, cópia direta (WhatsApp) e criação rápida de mensagem
 */

import { el } from '../core/firebase.js';
import { escapeHtml } from '../core/utils.js';
import { showToast } from '../core/toast.js';

let _activeTargetEl = null;
let _generatedText = '';
let _currentMode = 'formal';

export function initAIAssistant() {
    const modalEl = el('aiAssistantModal');
    if (!modalEl) return;

    // Botões de fechar e cancelar
    el('btnCloseAiModal')?.addEventListener('click', closeAIAssistantModal);
    el('btnCancelAi')?.addEventListener('click', closeAIAssistantModal);
    modalEl.addEventListener('click', (e) => {
        if (e.target === modalEl) closeAIAssistantModal();
    });

    // Botão Global da Toolbar Principal
    const globalBtn = el('btnGlobalAiAssist');
    if (globalBtn) {
        globalBtn.onclick = () => openAIAssistantModal(null);
    }

    // Seleção de Pills de Modos
    const pillsContainer = el('aiModePills');
    if (pillsContainer) {
        pillsContainer.querySelectorAll('.ai-mode-pill').forEach(pill => {
            pill.addEventListener('click', () => {
                pillsContainer.querySelectorAll('.ai-mode-pill').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');

                _currentMode = pill.dataset.mode;
                const promptContainer = el('aiPromptContainer');

                if (_currentMode === 'prompt') {
                    promptContainer?.classList.remove('hidden');
                    el('aiPromptInput')?.focus();
                } else {
                    promptContainer?.classList.add('hidden');
                    _triggerAITransformation();
                }
            });
        });
    }

    // Input de Rascunho Livre no Modal (quando aberto via toolbar)
    el('aiInputText')?.addEventListener('input', () => {
        _triggerAITransformation();
    });

    // Input de Prompt (ao pressionar Enter ou digitar)
    el('aiPromptInput')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            _triggerAITransformation();
        }
    });

    // Botão 1: Aplicar no Campo (para quando aberto a partir de um textarea)
    el('btnApplyAiText')?.addEventListener('click', () => {
        if (!_activeTargetEl || !_generatedText) return;
        _activeTargetEl.value = _generatedText;
        _activeTargetEl.dispatchEvent(new Event('input', { bubbles: true }));
        showToast('Texto aplicado com sucesso!');
        closeAIAssistantModal();
    });

    // Botão 2: Copiar para Área de Transferência (direto para WhatsApp)
    el('btnCopyAiText')?.addEventListener('click', async () => {
        if (!_generatedText) return;
        try {
            await navigator.clipboard.writeText(_generatedText);
            showToast('Copiado para a área de transferência!');
        } catch (err) {
            console.error('Erro ao copiar:', err);
        }
    });

    // Botão 3: Criar Novo Card de Mensagem a partir da IA
    el('btnCreateMsgFromAi')?.addEventListener('click', () => {
        if (!_generatedText) return;
        closeAIAssistantModal();

        // Abre o form de nova mensagem
        const newMsgBox = el('newMsgBox');
        if (newMsgBox) {
            newMsgBox.classList.remove('hidden');
            const msgInput = el('msgText');
            if (msgInput) {
                msgInput.value = _generatedText;
                msgInput.focus();
            }
        }
    });
}

/**
 * Abre o modal do Assistente de IA.
 * @param {HTMLTextAreaElement|HTMLInputElement|null} targetEl Elemento que receberá o texto final, ou null para uso avulso
 */
export function openAIAssistantModal(targetEl = null) {
    _activeTargetEl = targetEl;
    _generatedText = '';
    _currentMode = 'formal';

    const modalEl = el('aiAssistantModal');
    if (!modalEl) return;

    // Se aberto de um campo específico ou da toolbar global
    const inputContainer = el('aiInputTextContainer');
    const applyBtn       = el('btnApplyAiText');

    if (targetEl) {
        // Vinculado a um campo específico
        if (inputContainer) inputContainer.classList.add('hidden');
        if (applyBtn) {
            applyBtn.classList.remove('hidden');
            applyBtn.style.display = 'inline-flex';
        }
    } else {
        // Uso avulso (toolbar global)
        if (inputContainer) {
            inputContainer.classList.remove('hidden');
            const inputText = el('aiInputText');
            if (inputText) inputText.value = '';
        }
        if (applyBtn) {
            applyBtn.classList.add('hidden');
            applyBtn.style.display = 'none';
        }
    }

    // Reset de pills
    const pillsContainer = el('aiModePills');
    if (pillsContainer) {
        pillsContainer.querySelectorAll('.ai-mode-pill').forEach(p => {
            p.classList.toggle('active', p.dataset.mode === 'formal');
        });
    }

    el('aiPromptContainer')?.classList.add('hidden');
    if (el('aiPromptInput')) el('aiPromptInput').value = '';

    _updateActionButtons(false);

    modalEl.classList.remove('hidden');
    modalEl.style.display = 'flex';

    // Se houver texto existente no target ou no input livre, processa
    const existingText = targetEl ? targetEl.value.trim() : '';
    if (existingText) {
        _triggerAITransformation();
    } else {
        const previewBox = el('aiPreviewBox');
        if (previewBox) {
            previewBox.innerHTML = `<div class="ai-preview-placeholder">Escolha um estilo acima ou digite uma ideia para gerar a resposta.</div>`;
        }
    }
}

export function closeAIAssistantModal() {
    const modalEl = el('aiAssistantModal');
    if (!modalEl) return;
    modalEl.classList.add('hidden');
    modalEl.style.display = 'none';
}

function _updateActionButtons(hasText) {
    const applyBtn  = el('btnApplyAiText');
    const copyBtn   = el('btnCopyAiText');
    const createBtn = el('btnCreateMsgFromAi');

    if (applyBtn)  applyBtn.disabled  = !hasText;
    if (copyBtn)   copyBtn.disabled   = !hasText;
    if (createBtn) createBtn.disabled = !hasText;
}

function _triggerAITransformation() {
    const previewBox = el('aiPreviewBox');
    if (!previewBox) return;

    previewBox.innerHTML = `
        <div class="ai-loading-state">
            <span class="spinner"></span>
            <span>A IA está aprimorando seu texto...</span>
        </div>
    `;
    _updateActionButtons(false);

    // Pega o texto do target ou do rascunho livre
    const originalText = _activeTargetEl
        ? _activeTargetEl.value.trim()
        : (el('aiInputText')?.value.trim() || '');

    const customPrompt = el('aiPromptInput')?.value.trim() || '';

    // Simulação assíncrona de IA (150ms para sensação fluida)
    setTimeout(() => {
        _generatedText = processTextWithAI(originalText, _currentMode, customPrompt);
        previewBox.innerHTML = escapeHtml(_generatedText);
        _updateActionButtons(!!_generatedText);
    }, 150);
}

/**
 * Algoritmo de transformação de texto por regras de IA e preservação de placeholders.
 */
export function processTextWithAI(originalText, mode, customPrompt = '') {
    // 1. Modo Prompt (Gerar a partir de ideia)
    if (mode === 'prompt') {
        if (!customPrompt) return 'Por favor, digite um tópico ou ideia no campo acima para gerar a mensagem.';
        return `Olá, {usuario}!\n\nInformamos que referente a "${customPrompt}", o procedimento foi registrado e estamos à disposição para auxiliar no que for necessário.\n\nQualquer dúvida, basta nos responder por aqui!`;
    }

    if (!originalText) {
        return 'Digite algum texto no campo de rascunho ou utilize a opção "Gerar por Ideia".';
    }

    let result = originalText;

    // Preserva {usuario} temporariamente
    const hasUserTag = result.includes('{usuario}');

    switch (mode) {
        case 'formal':
            result = result
                .replace(/voce/gi, 'o(a) senhor(a)')
                .replace(/pra/gi, 'para')
                .replace(/ta/gi, 'está')
                .replace(/blz/gi, 'perfeito')
                .replace(/oi/gi, 'Prezado(a)')
                .replace(/comprovante/gi, 'comprovante de pagamento');
            if (!result.toLowerCase().startsWith('prezado') && !result.toLowerCase().startsWith('estimado')) {
                result = `Prezado(a) {usuario},\n\n${result}\n\nAtenciosamente,\nEquipe de Atendimento.`;
            }
            break;

        case 'friendly':
            result = result
                .replace(/prezado\(a\)/gi, 'Olá')
                .replace(/atenciosamente/gi, 'Tenha um ótimo dia!');
            if (!result.toLowerCase().includes('olá') && !result.toLowerCase().includes('bom dia')) {
                result = `Olá, {usuario}! 😊\n\n${result}\n\nQualquer dúvida, estamos super à disposição!`;
            }
            break;

        case 'succinct':
            // Remove saudações longas e reduz frases
            result = result
                .replace(/estamos à disposição para auxiliar no que for necessário/gi, 'Estamos à disposição.')
                .replace(/qualquer dúvida, basta nos responder por aqui/gi, 'Dúvidas, estamos à disposição.');
            if (result.length > 80) {
                result = result.split('\n').filter(l => l.trim()).join(' ');
            }
            break;

        case 'grammar':
            // Correções ortográficas e acentuação comum
            result = result
                .replace(/\bvc\b/gi, 'você')
                .replace(/\btmb\b/gi, 'também')
                .replace(/\bnao\b/gi, 'não')
                .replace(/\bduvida\b/gi, 'dúvida')
                .replace(/\bduvidas\b/gi, 'dúvidas')
                .replace(/\bja\b/gi, 'já')
                .replace(/\bboleo\b/gi, 'boleto')
                .replace(/\ate\b/gi, 'até');
            break;
    }

    // Garante que {usuario} permaneça se existia ou foi incluído
    if (!hasUserTag && !result.includes('{usuario}')) {
        result = result.replace(/Prezado\(a\),/gi, 'Prezado(a) {usuario},');
    }

    return result.trim();
}
