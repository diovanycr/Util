// ============================================================
//  docValidator.js — Validador/Calculador de Documentos Fiscais
// ============================================================
//  CNPJ, CPF, PIS, Inscrição Estadual (por UF), DV Chave NFe/NFCe

export const IE_FORMATS = {
    'AC': { name: 'Acre', mask: '##.###.###/####-##' },
    'AL': { name: 'Alagoas', mask: '#########' },
    'AP': { name: 'Amapá', mask: '#######' },
    'AM': { name: 'Amazonas', mask: '#########' },
    'BA': { name: 'Bahia', mask: '#######-##' },
    'CE': { name: 'Ceará', mask: '########-#' },
    'DF': { name: 'Distrito Federal', mask: '###########' },
    'ES': { name: 'Espírito Santo', mask: '#########' },
    'GO': { name: 'Goiás', mask: '########-#' },
    'MA': { name: 'Maranhão', mask: '#########' },
    'MT': { name: 'Mato Grosso', mask: '########-#' },
    'MS': { name: 'Mato Grosso do Sul', mask: '########' },
    'MG': { name: 'Minas Gerais', mask: '############' },
    'PA': { name: 'Pará', mask: '########-#' },
    'PB': { name: 'Paraíba', mask: '########-#' },
    'PR': { name: 'Paraná', mask: '########-##' },
    'PE': { name: 'Pernambuco', mask: '########-#' },
    'PI': { name: 'Piauí', mask: '#########' },
    'RJ': { name: 'Rio de Janeiro', mask: '#######-##' },
    'RN': { name: 'Rio Grande do Norte', mask: '#########' },
    'RS': { name: 'Rio Grande do Sul', mask: '########-#' },
    'RO': { name: 'Rondônia', mask: '#########' },
    'RR': { name: 'Roraima', mask: '#########' },
    'SC': { name: 'Santa Catarina', mask: '########' },
    'SP': { name: 'São Paulo', mask: '###########' },
    'SE': { name: 'Sergipe', mask: '########-#' },
    'TO': { name: 'Tocantins', mask: '#########' },
};

// ── CPF ────────────────────────────────────────────────────────────────────
export function validateCPF(cpf) {
    const digits = cpf.replace(/\D/g, '');
    if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
    let d1 = 11 - (sum % 11);
    if (d1 >= 10) d1 = 0;
    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
    let d2 = 11 - (sum % 11);
    if (d2 >= 10) d2 = 0;
    return d1 === parseInt(digits[9]) && d2 === parseInt(digits[10]);
}

export function generateCPF() {
    const n = () => Math.floor(Math.random() * 10);
    const digits = Array.from({ length: 9 }, n);
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += digits[i] * (10 - i);
    let d1 = 11 - (sum % 11);
    if (d1 >= 10) d1 = 0;
    digits.push(d1);
    sum = 0;
    for (let i = 0; i < 10; i++) sum += digits[i] * (11 - i);
    let d2 = 11 - (sum % 11);
    if (d2 >= 10) d2 = 0;
    digits.push(d2);
    return digits.join('');
}

// ── CNPJ ───────────────────────────────────────────────────────────────────
export function validateCNPJ(cnpj) {
    const digits = cnpj.replace(/\D/g, '');
    if (digits.length !== 14 || /^(\d)\1{13}$/.test(digits)) return false;
    const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 12; i++) sum += parseInt(digits[i]) * w1[i];
    let d1 = sum % 11;
    d1 = d1 < 2 ? 0 : 11 - d1;
    sum = 0;
    for (let i = 0; i < 13; i++) sum += parseInt(digits[i]) * w2[i];
    let d2 = sum % 11;
    d2 = d2 < 2 ? 0 : 11 - d2;
    return d1 === parseInt(digits[12]) && d2 === parseInt(digits[13]);
}

export function generateCNPJ() {
    const n = () => Math.floor(Math.random() * 10);
    const digits = Array.from({ length: 12 }, n);
    const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 12; i++) sum += digits[i] * w1[i];
    let d1 = sum % 11;
    d1 = d1 < 2 ? 0 : 11 - d1;
    digits.push(d1);
    const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    sum = 0;
    for (let i = 0; i < 13; i++) sum += digits[i] * w2[i];
    let d2 = sum % 11;
    d2 = d2 < 2 ? 0 : 11 - d2;
    digits.push(d2);
    return digits.join('');
}

// ── PIS ─────────────────────────────────────────────────────────────────────
export function validatePIS(pis) {
    const digits = pis.replace(/\D/g, '');
    if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;
    const w = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * w[i];
    let d = 11 - (sum % 11);
    if (d >= 10) d = 0;
    return d === parseInt(digits[10]);
}

export function generatePIS() {
    const n = () => Math.floor(Math.random() * 10);
    const digits = Array.from({ length: 10 }, n);
    const w = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 10; i++) sum += digits[i] * w[i];
    let d = 11 - (sum % 11);
    if (d >= 10) d = 0;
    digits.push(d);
    return digits.join('');
}

// ── Chave de Acesso NFe/NFCe (DV) ─────────────────────────────────────────
export function calculateNFeDV(chave) {
    const digits = chave.replace(/\D/g, '');
    if (digits.length !== 43) return null;
    const w = [4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 43; i++) sum += parseInt(digits[i]) * w[i];
    const dv = 11 - (sum % 11);
    return dv >= 11 ? 0 : dv === 10 ? 0 : dv;
}

export function generateNFeChave() {
    const ufs = Object.keys(IE_FORMATS);
    const uf = ufs[Math.floor(Math.random() * ufs.length)];
    const ufCode = String(Object.keys(IE_FORMATS).indexOf(uf) + 12).padStart(2, '0');
    const year = String(new Date().getFullYear());
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const cnpj = generateCNPJ();
    const model = '55';
    const series = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
    const nNF = String(Math.floor(Math.random() * 999999999) + 1).padStart(9, '0');
    const tpEmis = '1';
    const cNF = String(Math.floor(Math.random() * 99999999) + 1).padStart(8, '0');
    const base = `${ufCode}${year}${month}${cnpj}${model}${series}${nNF}${tpEmis}${cNF}`;
    if (base.length !== 43) return null;
    const dv = calculateNFeDV(base);
    return base + dv;
}

// ── Inscrição Estadual (validação parcial por UF) ──────────────────────────
export function validateIE(ie, uf) {
    const digits = ie.replace(/\D/g, '');
    if (!uf) return { valid: false, message: 'Selecione uma UF.' };
    const fmt = IE_FORMATS[uf];
    if (!fmt) return { valid: false, message: `UF "${uf}" não reconhecida.` };
    // Validação simplificada: verifica tamanho esperado
    const maskDigits = fmt.mask.replace(/\D/g, '').length;
    if (digits.length !== maskDigits) {
        return { valid: false, message: `IE para ${fmt.name} deve ter ${maskDigits} dígitos.` };
    }
    return { valid: true, message: `IE válida para ${fmt.name}.` };
}

// ── Formatação ─────────────────────────────────────────────────────────────
export function formatCPF(cpf) {
    const d = cpf.replace(/\D/g, '');
    return d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
}

export function formatCNPJ(cnpj) {
    const d = cnpj.replace(/\D/g, '');
    return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

export function formatNFeChave(chave) {
    const d = chave.replace(/\D/g, '');
    return d.replace(/^(\d{4})(\d{4})(\d{4})(\d{4})(\d{4})(\d{4})(\d{4})(\d{4})(\d{4})(\d{4})(\d{3})$/, '$1 $2 $3 $4 $5 $6 $7 $8 $9 $10 $11');
}