// ============================================================
//  networkDiag.js — Diagnóstico de Redes & Dispositivos PDV/Ponto
// ============================================================
//  Calculadora IP/Subrede e testador de porta/comunicação
//  para impressoras térmicas, balanças, leitores e REPs

const DEVICE_PRESETS = [
  { name: 'Impressora Térmica (Rede)',  port: 9100, proto: 'TCP' },
  { name: 'Balança Toledo',             port: 3000, proto: 'TCP' },
  { name: 'Leitor Código Barras IP',    port: 9100, proto: 'TCP' },
  { name: 'Relógio de Ponto (REP)',     port: 1818, proto: 'TCP' },
  { name: 'Banco SQL Server',           port: 1433, proto: 'TCP' },
  { name: 'Banco MySQL',                port: 3306, proto: 'TCP' },
  { name: 'PDV Web (HTTP)',             port: 80,   proto: 'TCP' },
  { name: 'PDV Web (HTTPS)',            port: 443,  proto: 'TCP' },
];

export function buildNetworkDiagPanel() {
  return `
    <div id="poTool-networkdiag" class="po-tool-panel hidden">
      <div class="card">
        <div class="po-card-header">
          <span class="po-card-icon">🌐</span>
          <div>
            <h3 class="po-card-title">Diagnóstico de Redes & Dispositivos</h3>
            <p class="sub">Teste portas TCP e calcule IP/Subrede para dispositivos PDV, balanças e REPs</p>
          </div>
        </div>
      </div>

      <div class="card">
        <p class="po-section-label">Presets de dispositivos</p>
        <div class="nd-presets">
          ${DEVICE_PRESETS.map((p, i) =>
            `<button class="btn ghost nd-preset-btn" data-preset="${i}">${p.name}</button>`
          ).join('')}
        </div>
      </div>

      <div class="card">
        <p class="po-section-label">Teste de comunicação (TCP)</p>
        <div class="nd-input-row">
          <input id="ndHost" type="text" class="dv-input" placeholder="IP ou hostname" />
          <input id="ndPort" type="number" class="dv-input" placeholder="Porta" style="max-width:110px;" min="1" max="65535" />
          <button id="ndBtnTest" class="btn primary"><i class="fa-solid fa-play"></i> Testar</button>
        </div>
        <p class="po-hint">Clique em um preset acima ou digite IP/porta manualmente</p>
        <div id="ndResult" class="nd-result hidden">
          <div id="ndResultStatus" class="nd-result-row"></div>
          <pre id="ndResultInfo" class="nd-result-pre"></pre>
        </div>
      </div>

      <div class="card">
        <p class="po-section-label">Calculadora IP / Subrede</p>
        <div class="nd-input-row">
          <input id="ndCalcIP" type="text" class="dv-input" placeholder="Ex: 192.168.1.0/24" />
          <button id="ndBtnCalc" class="btn primary"><i class="fa-solid fa-calculator"></i> Calcular</button>
        </div>
        <pre id="ndCalcResult" class="nd-calc-pre"></pre>
      </div>
    </div>
  `;
}

export function bindNetworkDiagEvents(container) {
  let testRunning = false;

  container.addEventListener('click', e => {
    const presetBtn = e.target.closest('.nd-preset-btn');
    if (presetBtn) {
      const p = DEVICE_PRESETS[parseInt(presetBtn.dataset.preset)];
      if (p) {
        container.querySelector('#ndHost').value = '';
        container.querySelector('#ndHost').placeholder = `IP do dispositivo (${p.name})`;
        container.querySelector('#ndPort').value = p.port;
      }
    }
    if (e.target.closest('#ndBtnTest') && !testRunning) {
      testRunning = true;
      _testPort(container).finally(() => { testRunning = false; });
    }
    if (e.target.closest('#ndBtnCalc')) _calcSubnet(container);
  });
}

function _testPort(container) {
  const host = container.querySelector('#ndHost').value.trim();
  const portS = container.querySelector('#ndPort').value.trim();
  const result = container.querySelector('#ndResult');
  const status = container.querySelector('#ndResultStatus');
  const info = container.querySelector('#ndResultInfo');

  if (!host) { container.querySelector('#ndHost').style.borderColor = 'var(--danger)'; return Promise.resolve(); }
  container.querySelector('#ndHost').style.borderColor = '';

  result.classList.remove('hidden');
  const start = performance.now();
  status.className = 'nd-result-row nd-checking';
  status.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Testando...';
  info.textContent = `Conectando em ${host}...`;

  const port = parseInt(portS) || 80;
  const urls = port === 80
    ? [`http://${host}/`]
    : port === 443
      ? [`https://${host}/`]
      : [`http://${host}:${port}/`];

  let resolved = false;
  const done = (ok, msg) => {
    if (resolved) return; resolved = true;
    const elapsed = Math.round(performance.now() - start);
    status.className = `nd-result-row ${ok ? 'nd-success' : 'nd-error'}`;
    status.innerHTML = `<i class="fa-solid fa-circle-${ok ? 'check' : 'xmark'}"></i> ${ok ? 'Online' : 'Offline'} (${elapsed}ms)`;
    info.textContent = msg;
  };

  const tryFetch = (url, okMsg, errMsg) => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    fetch(url, { mode: 'no-cors', signal: ctrl.signal, redirect: 'follow' })
      .then(() => done(true, okMsg))
      .catch(() => {})
      .finally(() => clearTimeout(t));
  };

  urls.forEach(url => {
    tryFetch(
      url,
      `✅ Dispositivo respondeu!\n\nHost: ${host}\nPorta: ${port}\n\nO dispositivo esta online e acessivel na rede.\nComandos uteis:\n  ping ${host}\n  telnet ${host} ${port}`,
      `Sem resposta de ${host}:${port}`
    );
  });

  setTimeout(() => {
    if (!resolved) {
      const elapsed = Math.round(performance.now() - start);
      status.className = 'nd-result-row nd-error';
      status.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> Offline (${elapsed}ms)`;
      info.textContent = `Sem resposta de ${host}:${port}\n\nPossiveis causas:\n- Host offline ou IP incorreto\n- Firewall bloqueando a porta\n- Servico nao rodando no destino\n- Dispositivo na mesma rede?\n\nTeste manual:\n  ping ${host}\n  tracert ${host}`;
    }
  }, 6000);
}

function _calcSubnet(container) {
  const ipCidr = container.querySelector('#ndCalcIP').value.trim();
  const el = container.querySelector('#ndCalcResult');
  if (!ipCidr) { el.textContent = 'Digite um IP/CIDR (ex: 192.168.1.0/24)'; return; }

  const parts = ipCidr.split('/');
  const ipStr = parts[0];
  const cidr = parseInt(parts[1]) || 24;

  try {
    const nums = ipStr.split('.').map(n => parseInt(n));
    if (nums.length !== 4 || nums.some(n => isNaN(n) || n < 0 || n > 255))
      { el.textContent = 'IP invalido. Formato: x.x.x.x/xx'; return; }

    const ipBin = nums.map(n => n.toString(2).padStart(8, '0')).join('');
    const maskBin = '1'.repeat(cidr) + '0'.repeat(32 - cidr);
    const maskNums = [maskBin.slice(0,8), maskBin.slice(8,16), maskBin.slice(16,24), maskBin.slice(24,32)].map(b => parseInt(b, 2));
    const netBin = ipBin.slice(0, cidr) + '0'.repeat(32 - cidr);
    const netNums = [netBin.slice(0,8), netBin.slice(8,16), netBin.slice(16,24), netBin.slice(24,32)].map(b => parseInt(b, 2));
    const bcastBin = ipBin.slice(0, cidr) + '1'.repeat(32 - cidr);
    const bcastNums = [bcastBin.slice(0,8), bcastBin.slice(8,16), bcastBin.slice(16,24), bcastBin.slice(24,32)].map(b => parseInt(b, 2));

    const totalHosts = Math.pow(2, 32 - cidr);
    const usableHosts = totalHosts > 2 ? totalHosts - 2 : totalHosts;
    const firstUsable = [...netNums]; firstUsable[3] += cidr >= 31 ? 0 : 1;
    const lastUsable = [...bcastNums]; lastUsable[3] -= cidr >= 31 ? 0 : 1;

    el.textContent = [
      `IP:         ${ipStr}/${cidr}`,
      `Mascara:    ${maskNums.join('.')}`,
      `Rede:       ${netNums.join('.')}`,
      `Broadcast:  ${bcastNums.join('.')}`,
      `Range:      ${cidr >= 31 ? '(n/a)' : firstUsable.join('.') + ' - ' + lastUsable.join('.')}`,
      `Hosts:      ${totalHosts} total, ${usableHosts} uteis`,
      `Classe:     ${cidr <= 8 ? 'A' : cidr <= 16 ? 'B' : cidr <= 24 ? 'C' : cidr <= 30 ? 'C+' : cidr <= 32 ? 'D/E' : '?'}`,
      `Binario:    ${ipBin}`,
    ].join('\n');
  } catch (e) {
    el.textContent = `Erro: ${e.message}`;
  }
}