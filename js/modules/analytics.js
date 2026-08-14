/**
 * analytics.js — Dashboard de Métricas, KPIs e Gráficos de Atendimento
 *
 * Funcionalidades:
 * - Leitura e agregação de dados de mensagens (copyCount, categorias), problemas (departamentos)
 * - Renderização de KPI Cards (Total Cópias, Problemas, Departamentos, Categoria Líder)
 * - Geração de Gráfico Donut SVG para Distribuição de Problemas por Departamento
 * - Geração de Gráfico de Barras para Atendimentos por Categoria de Mensagem
 * - Exportação de relatório impresso / PDF de Analytics
 */

import { db, el, collection, getDocs, query } from '../core/firebase.js';
import { escapeHtml } from '../core/utils.js';
import { showToast } from '../core/toast.js';
import { getDepartments, DEPT_COLORS } from './problems/departments.js';

let _currentUserId = null;
let _analyticsInitialized = false;

// Cores padrão para categorias sem cor de departamento
const CATEGORY_COLORS = ['#3b82f6', '#a855f7', '#22c55e', '#f97316', '#06b6d4', '#ec4899', '#6b7280', '#eab308'];

export function initAnalytics(uid) {
    _currentUserId = uid;

    if (!_analyticsInitialized) {
        _analyticsInitialized = true;
        document.addEventListener('copy-count-updated', () => loadAnalyticsData());
    }

    const btnExport = el('btnExportAnalytics');
    if (btnExport) btnExport.onclick = () => exportAnalyticsReport();

    loadAnalyticsData();
}

export function resetAnalytics() {
    _currentUserId = null;
    _analyticsInitialized = false;
}

/**
 * Carrega e agrega todos os dados de estatísticas do usuário no Firestore.
 */
export async function loadAnalyticsData() {
    if (!_currentUserId) return;

    try {
        // Fetch mensagens
        const msgsSnap = await getDocs(query(collection(db, 'users', _currentUserId, 'messages')));
        let totalCopies = 0;
        const categoryMap = {}; // { categoryName: totalCopies }

        msgsSnap.forEach(d => {
            const data = d.data();
            if (data.deleted) return;
            const count = data.copyCount || 0;
            const cat = data.category || 'Geral';

            totalCopies += count;
            categoryMap[cat] = (categoryMap[cat] || 0) + count;
        });

        // Fetch problemas
        const probsSnap = await getDocs(query(collection(db, 'users', _currentUserId, 'problems')));
        let totalProblems = 0;
        const deptMap = {}; // { deptId: count }

        probsSnap.forEach(d => {
            const data = d.data();
            totalProblems++;
            const deptId = data.department || '__sem_dept__';
            deptMap[deptId] = (deptMap[deptId] || 0) + 1;
        });

        // Fetch departamentos
        const depts = getDepartments();
        const totalDepts = depts.length;

        // Identifica Categoria Líder
        let topCategory = '—';
        let maxCategoryCount = -1;
        Object.entries(categoryMap).forEach(([cat, count]) => {
            if (count > maxCategoryCount && count > 0) {
                maxCategoryCount = count;
                topCategory = cat;
            }
        });

        const stats = {
            totalCopies,
            totalProblems,
            totalDepts,
            topCategory,
            categoryMap,
            deptMap,
            depts
        };

        // Renderiza interface
        _renderKPICards(stats);
        _renderDeptDonutChart(stats);
        _renderCategoryBarChart(stats);

    } catch (err) {
        console.error('[Analytics] Erro ao carregar métricas:', err);
    }
}

// ── KPI Cards ──────────────────────────────────────────────────────────────

function _renderKPICards(stats) {
    const elCopies = el('kpiTotalCopies');
    const elProbs  = el('kpiTotalProblems');
    const elDepts  = el('kpiTotalDepts');
    const elTop    = el('kpiTopMsgCategory');

    if (elCopies) elCopies.textContent = stats.totalCopies.toLocaleString('pt-BR');
    if (elProbs)  elProbs.textContent  = stats.totalProblems.toLocaleString('pt-BR');
    if (elDepts)  elDepts.textContent  = stats.totalDepts.toLocaleString('pt-BR');
    if (elTop)    elTop.textContent    = stats.topCategory;
}

// ── Gráfico Donut SVG (Problemas por Departamento) ──────────────────────────

function _renderDeptDonutChart(stats) {
    const container = el('deptDonutChartContainer');
    if (!container) return;

    const { deptMap, depts, totalProblems } = stats;

    if (totalProblems === 0) {
        container.innerHTML = `
            <p class="sub text-center" style="width:100%;padding:20px 0;">
                <i class="fa-solid fa-folder-open" style="margin-right:6px"></i> Nenhuma solução cadastrada na Base de Conhecimento.
            </p>
        `;
        return;
    }

    // Monta itens formatados
    const items = [];
    depts.forEach((d, idx) => {
        const count = deptMap[d.id] || 0;
        if (count > 0) {
            const colorObj = DEPT_COLORS.find(c => c.id === d.color);
            items.push({
                label: d.name,
                count,
                hex: colorObj?.hex || CATEGORY_COLORS[idx % CATEGORY_COLORS.length]
            });
        }
    });

    const semDeptCount = deptMap['__sem_dept__'] || 0;
    if (semDeptCount > 0) {
        items.push({
            label: 'Sem departamento',
            count: semDeptCount,
            hex: '#6b7280'
        });
    }

    if (items.length === 0) {
        container.innerHTML = `<p class="sub text-center" style="width:100%;">Nenhum problema vinculado.</p>`;
        return;
    }

    // Geometria do SVG Donut
    const size = 140;
    const r = 50;
    const cx = size / 2;
    const cy = size / 2;
    const circumference = 2 * Math.PI * r;

    let cumulativePercent = 0;
    let svgSegments = '';

    items.forEach((item) => {
        const percent = item.count / totalProblems;
        const strokeDasharray = `${percent * circumference} ${circumference}`;
        const strokeDashoffset = -cumulativePercent * circumference;

        svgSegments += `
            <circle class="donut-segment"
                cx="${cx}" cy="${cy}" r="${r}"
                fill="none" stroke="${item.hex}" stroke-width="16"
                stroke-dasharray="${strokeDasharray}"
                stroke-dashoffset="${strokeDashoffset}">
                <title>${escapeHtml(item.label)}: ${item.count} (${Math.round(percent * 100)}%)</title>
            </circle>
        `;

        cumulativePercent += percent;
    });

    const svgHtml = `
        <svg class="donut-chart-svg" viewBox="0 0 ${size} ${size}">
            ${svgSegments}
            <text x="${cx}" y="${cy}" class="donut-center-text">${totalProblems}</text>
        </svg>
    `;

    const legendHtml = `
        <div class="donut-legend">
            ${items.map(it => `
                <div class="legend-item">
                    <span class="legend-dot" style="background-color:${it.hex}"></span>
                    <span class="legend-label" title="${escapeHtml(it.label)}">${escapeHtml(it.label)}</span>
                    <span class="legend-val">${it.count} (${Math.round((it.count / totalProblems) * 100)}%)</span>
                </div>
            `).join('')}
        </div>
    `;

    container.innerHTML = svgHtml + legendHtml;
}

// ── Gráfico de Barras (Atendimentos por Categoria de Mensagens) ─────────────

function _renderCategoryBarChart(stats) {
    const container = el('categoryBarChartContainer');
    if (!container) return;

    const { categoryMap, totalCopies } = stats;
    const entries = Object.entries(categoryMap).filter(([_, count]) => count > 0);

    if (entries.length === 0) {
        container.innerHTML = `
            <p class="sub text-center" style="padding:20px 0;">
                <i class="fa-solid fa-chart-column" style="margin-right:6px"></i> Nenhuma cópia registrada ainda.
            </p>
        `;
        return;
    }

    // Ordena da maior para a menor contagem
    entries.sort((a, b) => b[1] - a[1]);

    const maxCount = entries[0][1] || 1;

    const barsHtml = entries.slice(0, 6).map(([catName, count], idx) => {
        const percentOfMax = Math.round((count / maxCount) * 100);
        const percentOfTotal = totalCopies > 0 ? Math.round((count / totalCopies) * 100) : 0;
        const colorClass = idx === 0 ? '' : idx === 1 ? 'purple' : idx === 2 ? 'green' : 'orange';

        return `
            <div class="bar-item">
                <div class="bar-header">
                    <span class="bar-title" title="${escapeHtml(catName)}">${escapeHtml(catName)}</span>
                    <span class="bar-count">${count} cópia${count !== 1 ? 's' : ''} (${percentOfTotal}%)</span>
                </div>
                <div class="bar-track">
                    <div class="bar-fill ${colorClass}" style="width: ${percentOfMax}%"></div>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = barsHtml;
}

// ── Exportação do Relatório de Analytics ───────────────────────────────────

export function exportAnalyticsReport() {
    const elCopies = el('kpiTotalCopies')?.textContent || '0';
    const elProbs  = el('kpiTotalProblems')?.textContent || '0';
    const elDepts  = el('kpiTotalDepts')?.textContent || '0';
    const elTop    = el('kpiTopMsgCategory')?.textContent || '—';

    const printWin = window.open('', '_blank');
    if (!printWin) return showToast('Não foi possível abrir janela de exportação. Permita pop-ups.');

    const htmlContent = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <title>Relatório de Analytics de Atendimento — PainelAtende</title>
            <style>
                body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #1e293b; padding: 40px; max-width: 800px; margin: 0 auto; }
                h1 { color: #0f172a; border-bottom: 2px solid #2563eb; padding-bottom: 12px; font-size: 24px; }
                .meta { font-size: 13px; color: #64748b; margin-bottom: 24px; }
                .kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
                .kpi-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; text-align: center; }
                .kpi-num { font-size: 24px; font-weight: 800; color: #2563eb; }
                .kpi-txt { font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b; margin-top: 4px; }
                @media print {
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="no-print" style="margin-bottom:20px;text-align:right;">
                <button onclick="window.print()" style="background:#2563eb;color:#fff;border:none;padding:10px 20px;border-radius:8px;font-weight:600;cursor:pointer;">🖨️ Imprimir / PDF</button>
            </div>
            <h1>Relatório de Desempenho do Atendimento</h1>
            <p class="meta">Gerado pelo PainelAtende em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
            
            <div class="kpi-row">
                <div class="kpi-box"><div class="kpi-num">${elCopies}</div><div class="kpi-txt">Cópias Totais</div></div>
                <div class="kpi-box"><div class="kpi-num">${elProbs}</div><div class="kpi-txt">Base de Conhecimento</div></div>
                <div class="kpi-box"><div class="kpi-num">${elDepts}</div><div class="kpi-txt">Departamentos</div></div>
                <div class="kpi-box"><div class="kpi-num" style="font-size:16px">${elTop}</div><div class="kpi-txt">Categoria Líder</div></div>
            </div>
        </body>
        </html>
    `;

    printWin.document.open();
    printWin.document.write(htmlContent);
    printWin.document.close();
    showToast('Relatório gerado com sucesso!');
}
