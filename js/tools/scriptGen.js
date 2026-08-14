// ============================================================
//  scriptGen.js — Gerador de Scripts & Comandos Dinâmicos
// ============================================================
//  Gerador de comandos SQL (reset de caixa, liberação de terminal,
//  correção de status de NFe/NFCe/Ponto) e CMD/PowerShell com
//  variáveis dinâmicas ({ip_pdv}, {cnpj}, {porta_impressora})

import { escapeHtml, escapeAttr } from '../core/utils.js';

const TEMPLATES = {
    sql_reset_caixa: {
        name: 'SQL — Reset de Caixa (PDV)',
        lang: 'sql',
        description: 'Reseta o caixa de um PDV (fecha movimento e libera para novo)',
        template: `-- ============================================
-- RESET DE CAIXA PDV
-- Substitua as variaveis abaixo antes de executar
-- ============================================

DECLARE @codigo_pdv     INT = {codigo_pdv};
DECLARE @data_caixa      DATE = '{data_caixa}';

-- 1. Verifica caixa aberto
SELECT * FROM caixa_movimento
 WHERE codigo_pdv = @codigo_pdv
   AND data = @data_caixa
   AND status = 'A';

-- 2. Fecha o caixa (ATENCAO: confirme com tesorista antes)
UPDATE caixa_movimento
   SET status = 'F',
       data_fechamento = GETDATE(),
       usuario_fechamento = 'admin'
 WHERE codigo_pdv = @codigo_pdv
   AND data = @data_caixa
   AND status = 'A';

-- 3. Libera terminal
UPDATE terminal_pdv
   SET bloqueado = 0,
       motivo_bloqueio = NULL
 WHERE codigo_pdv = @codigo_pdv;

PRINT 'Caixa resetado com sucesso para o PDV ' + CAST(@codigo_pdv AS VARCHAR);`,
        vars: ['codigo_pdv:1', 'data_caixa:2024-01-01'],
    },
    sql_libera_terminal: {
        name: 'SQL — Liberação de Terminal',
        lang: 'sql',
        description: 'Desbloqueia terminal PDV que está travado',
        template: `-- ============================================
-- LIBERACAO DE TERMINAL PDV
-- Substitua {codigo_pdv} pelo codigo do terminal
-- ============================================

DECLARE @codigo_pdv INT = {codigo_pdv};

-- 1. Verifica bloqueio
SELECT t.codigo_pdv, t.bloqueado, t.motivo_bloqueio, t.data_bloqueio
  FROM terminal_pdv t
 WHERE t.codigo_pdv = @codigo_pdv;

-- 2. Desbloqueia
UPDATE terminal_pdv
   SET bloqueado = 0,
       motivo_bloqueio = NULL,
       data_bloqueio = NULL,
       usuario_desbloqueio = SYSTEM_USER
 WHERE codigo_pdv = @codigo_pdv;

-- 3. Limpa sessao ativa (se houver)
DELETE FROM sessao_pdv WHERE codigo_pdv = @codigo_pdv AND status = 'ATIVA';

PRINT 'Terminal ' + CAST(@codigo_pdv AS VARCHAR) + ' liberado com sucesso!';`,
        vars: ['codigo_pdv:1'],
    },
    sql_corrigir_nfe: {
        name: 'SQL — Corrigir Status NFe',
        lang: 'sql',
        description: 'Corrige status de NF-e travada em processamento',
        template: `-- ============================================
-- CORRECAO DE STATUS NFe/NFCe
-- Use apenas quando a NFe estiver travada e nao for rejeitada
-- ============================================

DECLARE @cnpj_emitente      VARCHAR(14) = '{cnpj}';
DECLARE @numero_nfe        INT = {numero_nfe};
DECLARE @serie             INT = {serie};

-- 1. Verifica status atual
SELECT n.id, n.numero, n.serie, n.status, n.data_emissao, n.protocolo
  FROM nfe n
 WHERE n.cnpj_emitente = @cnpj_emitente
   AND n.numero = @numero_nfe
   AND n.serie = @serie;

-- 2. Corrige status (ex: 100 = Autorizada)
UPDATE nfe
   SET status = '100',
       data_autorizacao = GETDATE(),
       observacao = 'Status corrigido via script admin'
 WHERE cnpj_emitente = @cnpj_emitente
   AND numero = @numero_nfe
   AND serie = @serie;

PRINT 'Status da NFe ' + CAST(@numero_nfe AS VARCHAR) + ' serie ' + CAST(@serie AS VARCHAR) + ' corrigido.';`,
        vars: ['cnpj:00000000000000', 'numero_nfe:1', 'serie:1'],
    },
    sql_corrigir_ponto: {
        name: 'SQL — Corrigir Marcação Ponto',
        lang: 'sql',
        description: 'Corrige marcações de ponto que não foram coletadas',
        template: `-- ============================================
-- CORRECAO DE MARCACOES DE PONTO (REP)
-- Substitua as variaveis antes de executar
-- ============================================

DECLARE @pis           VARCHAR(11) = '{pis}';
DECLARE @data_inicio    DATE = '{data_inicio}';
DECLARE @data_fim       DATE = '{data_fim}';

-- 1. Verifica marcacoes do periodo
SELECT m.id, m.pis, m.data, m.hora, m.tipo
  FROM marcacoes m
 WHERE m.pis = @pis
   AND m.data BETWEEN @data_inicio AND @data_fim
 ORDER BY m.data, m.hora;

-- 2. Corrige marcacoes pendentes (status = 0 para coletada = 1)
UPDATE marcacoes
   SET status = 1,
       data_correcao = GETDATE(),
       observacao = 'Marcacao corrigida via script admin'
 WHERE pis = @pis
   AND data BETWEEN @data_inicio AND @data_fim
   AND status = 0;

PRINT 'Marcacoes corrigidas para o PIS ' + @pis;`,
        vars: ['pis:00000000000', 'data_inicio:2024-01-01', 'data_fim:2024-12-31'],
    },
    cmd_test_impressora: {
        name: 'BAT — Teste de Impressora (Rede)',
        lang: 'bat',
        description: 'Testa comunicação com impressora térmica via rede (porta 9100)',
        template: `@echo off
:: ========================================
:: TESTE DE IMPRESSORA TERMICA (REDE)
:: Substitua {ip} e {porta} conforme seu cenario
:: ========================================

SET IP_IMPRESSORA={ip_impressora}
SET PORTA={porta_impressora}

echo Testando impressora %IP_IMPRESSORA%:%PORTA%...

:: Verifica se o host responde
ping -n 2 %IP_IMPRESSORA% | find "Resposta" >nul
if %errorLevel% neq 0 (
    echo [FAIL] Impressora nao responde ao ping.
    echo Verifique: cabo de rede, IP, ou se o dispositivo esta ligado.
    pause & exit /b 1
)

:: Envia comando de teste ESC/POS (corte + gaveta)
echo [OK] Host responde. Enviando comando de teste...
echo|set /p="?<GS>V<0>" >%IP_IMPRESSORA%:%PORTA%
echo|set /p="?<ESC>p<0><25><250>" >%IP_IMPRESSORA%:%PORTA%

echo [OK] Comando enviado. Verifique se a impressora cortou e abriu a gaveta.
pause`,
        vars: ['ip_impressora:192.168.1.100', 'porta_impressora:9100'],
    },
    cmd_libera_porta: {
        name: 'BAT — Libera Porta (Firewall)',
        lang: 'bat',
        description: 'Libera porta no Firewall do Windows para PDV/ Banco',
        template: `@echo off
:: ========================================
:: LIBERAR PORTA NO FIREWALL
:: Substitua {porta} e {nome_regra} conforme necessario
:: ========================================

SET PORTA={porta}
SET NOME_REGRA={nome_regra}

:: Verifica se e administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERRO] Execute como Administrador.
    pause & exit /b 1
)

echo Liberando porta %PORTA% no Firewall do Windows...
netsh advfirewall firewall add rule name="%NOME_REGRA%_%PORTA%" dir=in action=allow protocol=TCP localport=%PORTA% enable=yes profile=any
netsh advfirewall firewall add rule name="%NOME_REGRA%_%PORTA%_OUT" dir=out action=allow protocol=TCP localport=%PORTA% enable=yes profile=any

echo.
echo [OK] Porta %PORTA% liberada para entrada e saida.
echo.
echo Para remover as regras depois:
echo   netsh advfirewall firewall delete rule name="%NOME_REGRA%_%PORTA%"
echo   netsh advfirewall firewall delete rule name="%NOME_REGRA%_%PORTA%_OUT"
pause`,
        vars: ['porta:1433', 'nome_regra:Banco_SQL'],
    },
    ps1_backup_config: {
        name: 'PS1 — Backup de Configurações PDV',
        lang: 'ps1',
        description: 'Faz backup das configurações de um PDV para uma pasta compartilhada',
        template: `# ========================================
# BACKUP DE CONFIGURACOES PDV
# Substitua {ip_pdv} e {pasta_backup} conforme seu cenario
# ========================================

$ipPdv = "{ip_pdv}"
$pastaBackup = "{pasta_backup}"

# Verifica admin
$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Error "Execute como Administrador!" ; exit 1
}

# Verifica conectividade
if (-not (Test-Connection -ComputerName $ipPdv -Count 2 -Quiet)) {
    Write-Error "PDV $ipPdv nao responde. Verifique rede e ligacao."
    exit 1
}

Write-Host "Iniciando backup do PDV $ipPdv..." -ForegroundColor Cyan

# Cria pasta de backup com data
$dataHoje = Get-Date -Format "yyyyMMdd_HHmmss"
$pastaDestino = Join-Path $pastaBackup "$ipPdv_$dataHoje"
New-Item -ItemType Directory -Path $pastaDestino -Force | Out-Null

# Copia configuracoes do PDV (ajuste os caminhos conforme o sistema)
$pastaConfigPDV = "\\$ipPdv\\c$\\PDV\\config"
if (Test-Path $pastaConfigPDV) {
    Copy-Item -Path "$pastaConfigPDV\\*" -Destination $pastaDestino -Recurse -Force
    Write-Host "[OK] Configuracoes copiadas para: $pastaDestino" -ForegroundColor Green
} else {
    Write-Warning "Pasta de configuracao nao encontrada: $pastaConfigPDV"
}

# Compacta backup
$arquivoZip = "$pastaDestino.zip"
Compress-Archive -Path $pastaDestino -DestinationPath $arquivoZip -Force
Remove-Item $pastaDestino -Recurse -Force

Write-Host "Backup concluido: $arquivoZip" -ForegroundColor Green`,
        vars: ['ip_pdv:192.168.1.50', 'pasta_backup:C:\\Backups\\PDV'],
    },
};

export function buildScriptGenPanel() {
    return `
      <div id="poTool-scriptgen" class="po-tool-panel hidden">
        <div class="card">
          <div class="po-card-header">
            <span class="po-card-icon">⚡</span>
            <div>
              <h3 class="po-card-title">Gerador de Scripts & Comandos</h3>
              <p class="sub">Gere comandos SQL, BAT e PowerShell com variáveis dinâmicas para suporte rápido</p>
            </div>
          </div>
        </div>

        <div class="card">
          <p class="po-section-label">Escolha um modelo</p>
          <div class="sg-template-grid">
            ${Object.entries(TEMPLATES).map(([key, t]) => `
              <button class="sg-template-btn" data-template="${key}">
                <span class="sg-template-name">${t.name}</span>
                <span class="sg-template-desc">${t.description}</span>
                <span class="sg-template-lang sg-lang-${t.lang}">${t.lang}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <div id="sgEditor" class="hidden">
          <div class="card">
            <p class="po-section-label">Variáveis dinâmicas</p>
            <p class="po-hint">Substitua os valores abaixo e clique em Gerar</p>
            <div id="sgVars" class="sg-vars"></div>
          </div>

          <div class="card" style="padding:16px 24px;">
            <button id="sgBtnGenerate" class="btn primary" style="width:100%;padding:13px;font-size:15px;justify-content:center;">
              <i class="fa-solid fa-wand-magic-sparkles"></i> Gerar Script
            </button>
          </div>

          <div id="sgOutput" class="card hidden">
            <div class="at-result-header">
              <span id="sgBadge" class="po-badge po-badge-blue"></span>
              <button class="btn ghost po-btn-copy" data-id="sgRawOutput"><i class="fa-solid fa-copy"></i> Copiar</button>
              <button id="sgBtnDownload" class="btn ghost"><i class="fa-solid fa-download"></i> Baixar</button>
            </div>
            <pre id="sgRawOutput" class="po-pre"></pre>
          </div>
        </div>
      </div>
    `;
}

export function bindScriptGenEvents(container) {
    let currentTemplateKey = null;

    container.addEventListener('click', e => {
        const tplBtn = e.target.closest('.sg-template-btn');
        if (tplBtn) {
            currentTemplateKey = tplBtn.dataset.template;
            _renderEditor(container, currentTemplateKey);
        }

        if (e.target.closest('#sgBtnGenerate') && currentTemplateKey) {
            _generate(container, TEMPLATES[currentTemplateKey]);
        }

        const copyBtn = e.target.closest('.po-btn-copy');
        if (copyBtn && copyBtn.dataset.id === 'sgRawOutput') {
            const el = container.querySelector('#sgRawOutput');
            navigator.clipboard.writeText(el._raw || el.textContent).then(() => {
                const prev = copyBtn.innerHTML;
                copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copiado';
                setTimeout(() => { copyBtn.innerHTML = prev; }, 2000);
            });
        }

        const dlBtn = e.target.closest('#sgBtnDownload');
        if (dlBtn && currentTemplateKey) {
            const el = container.querySelector('#sgRawOutput');
            const text = el._raw || el.textContent;
            const tpl = TEMPLATES[currentTemplateKey];
            const ext = tpl.lang === 'bat' ? '.bat' : tpl.lang === 'ps1' ? '.ps1' : '.sql';
            const name = tpl.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
            const a = Object.assign(document.createElement('a'), {
                href: URL.createObjectURL(new Blob([text], { type: 'text/plain' })),
                download: name + ext,
            });
            a.click(); URL.revokeObjectURL(a.href);
        }
    });
}

function _renderEditor(container, key) {
    const tpl = TEMPLATES[key];
    if (!tpl) return;

    const editor = container.querySelector('#sgEditor');
    const varsEl = container.querySelector('#sgVars');
    editor.classList.remove('hidden');
    container.querySelector('#sgOutput')?.classList.add('hidden');

    varsEl.innerHTML = tpl.vars.map(v => {
        const [name, defaultVal] = v.split(':');
        const safeName = escapeHtml(name);
        const safeAttr = escapeAttr(name);
        const safeDefault = escapeAttr(defaultVal || '');
        return `
          <div class="sg-var-row">
            <label class="field-label">{${safeName}}</label>
            <input type="text" class="dv-input sg-var-input" data-var="${safeAttr}" value="${safeDefault}" placeholder="${safeAttr}" />
          </div>
        `;
    }).join('');
}

function _generate(container, tpl) {
    let result = tpl.template;
    const vars = container.querySelectorAll('.sg-var-input');
    vars.forEach(input => {
        const name = input.dataset.var;
        const value = input.value;
        result = result.split('{' + name + '}').join(value);
    });

    const output = container.querySelector('#sgOutput');
    const pre = container.querySelector('#sgRawOutput');
    const badge = container.querySelector('#sgBadge');

    output.classList.remove('hidden');
    pre._raw = result;
    pre.textContent = result;
    badge.textContent = tpl.lang.toUpperCase();

    setTimeout(() => output.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
}