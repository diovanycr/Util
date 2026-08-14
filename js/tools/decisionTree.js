// ============================================================
//  decisionTree.js — Árvore de Decisão & Triagem Interativa
// ============================================================
//  Guias passo a passo para diagnosticar falhas comuns:
//  PDV não conecta no banco, Impressora não corta papel,
//  Ponto não coleta marcação, E-commerce não sincroniza estoque

import { escapeHtml, escapeAttr } from '../core/utils.js';

const TREES = {
    pdv_db: {
        title: 'PDV não conecta no banco de dados',
        icon: '🖥️',
        root: 'q1',
        nodes: {
            q1: { question: 'O PDV exibe alguma mensagem de erro?', options: [
                { label: 'Sim, mostra erro de conexão', next: 'q2' },
                { label: 'Sim, mas é outro erro', next: 'q3' },
                { label: 'Não, apenas fica travado/pensando', next: 'q4' },
            ]},
            q2: { question: 'Qual tipo de erro aparece?', options: [
                { label: 'Timeout / Connection refused', next: 'a1' },
                { label: 'Login failed / Usuário inválido', next: 'a2' },
                { label: 'Cannot open database', next: 'a3' },
            ]},
            q3: { question: 'O erro menciona qual problema?', options: [
                { label: 'DLL ou driver não encontrado', next: 'a4' },
                { label: 'Erro de rede/firewall', next: 'a5' },
                { label: 'Outro erro não listado', next: 'a6' },
            ]},
            q4: { question: 'O servidor do banco está acessível pela rede?', options: [
                { label: 'Sim, consigo pingar o servidor', next: 'q5' },
                { label: 'Não, o ping falha', next: 'a7' },
                { label: 'Não sei verificar', next: 'a8' },
            ]},
            q5: { question: 'A porta do banco (ex: 1433 SQL, 3306 MySQL) está aberta?', options: [
                { label: 'Sim, a porta responde', next: 'a9' },
                { label: 'Não, a porta não responde', next: 'a10' },
            ]},
            a1: { answer: 'Solução', solution: 'O servidor do banco não está aceitando conexões na porta especificada.\n\nPassos:\n1. Verifique se o serviço do banco está rodando no servidor\n2. Confirme o IP e porta nas configurações do PDV\n3. Verifique se o Firewall do servidor permite a porta\n4. Use o Port Opener (aba Sistemas) para liberar a porta se necessário\n5. Teste a conexão com: telnet <ip> <porta>' },
            a2: { answer: 'Solução', solution: 'As credenciais de acesso ao banco estão incorretas.\n\nPassos:\n1. Verifique o usuário e senha configurados no PDV\n2. Confirme se o usuário tem permissão de acesso ao banco\n3. Se necessário, redefina a senha no banco\n4. Verifique se não há caracteres especiais ou espaços na senha' },
            a3: { answer: 'Solução', solution: 'O banco de dados não existe ou o usuário não tem permissão.\n\nPassos:\n1. Confirme se o banco existe no servidor\n2. Verifique se o nome do banco está correto na string de conexão\n3. Verifique se o usuário tem permissão de acesso ao banco específico\n4. Se foi restaurado de backup, confirme se a restauração foi concluída' },
            a4: { answer: 'Solução', solution: 'Falta instalar o driver/cliente do banco de dados no PDV.\n\nPassos:\n1. Instale o cliente SQL correspondente (SQL Server Native Client, MySQL Connector, etc.)\n2. Verifique se as DLLs necessárias estão na pasta do PDV\n3. Reinicie o PDV após instalar o driver\n4. Se persistir, reinstale o PDV com opção de reparação' },
            a5: { answer: 'Solução', solution: 'Há um bloqueio de rede ou firewall impedindo a conexão.\n\nPassos:\n1. Verifique o Firewall do Windows no PDV e no servidor\n2. Verifique regras de firewall do roteador/switch\n3. Confirme se o PDV e o servidor estão na mesma rede/VLAN\n4. Use o Port Opener para liberar a porta\n5. Verifique se não há VPN ou proxy bloqueando' },
            a6: { answer: 'Solução', solution: 'Erro não identificado. Colete mais informações.\n\nPassos:\n1. Anote a mensagem de erro completa\n2. Verifique os logs do PDV (geralmente em %APPDATA% ou pasta de instalação)\n3. Tire um print da tela de erro\n4. Consulte a documentação do sistema ou o suporte do fabricante\n5. Use o Gerador de Sumário de Atendimento para registrar o chamado' },
            a7: { answer: 'Solução', solution: 'O servidor não está acessível na rede.\n\nPassos:\n1. Verifique se o servidor está ligado\n2. Confirme o IP do servidor com: ping <ip>\n3. Verifique o cabo de rede ou conexão Wi-Fi\n4. Confirme se o servidor não reiniciou ou está em manutenção\n5. Verifique com o responsável pela infraestrutura' },
            a8: { answer: 'Solução', solution: 'Para verificar acessibilidade do servidor:\n\nPassos:\n1. Abra o CMD no PDV\n2. Digite: ping <ip_do_servidor>\n3. Se responder, o servidor está acessível\n4. Se não responder, verifique rede ou servidor\n5. Use o utilitário de Diagnóstico de Redes (aba Sistemas) para mais testes\n6. Teste a porta com: telnet <ip> <porta>' },
            a9: { answer: 'Solução', solution: 'O banco está acessível mas o PDV não conecta.\n\nPassos:\n1. Verifique as configurações de conexão no PDV (IP, porta, instância)\n2. Confirme se o nome da instância está correto (ex: SERVIDOR\\SQLEXPRESS)\n3. Verifique se o serviço SQL Browser está rodando (para instâncias nomeadas)\n4. Tente reconectar; se persistir, reinicie o serviço do banco' },
            a10: { answer: 'Solução', solution: 'A porta do banco está bloqueada ou o serviço não está rodando.\n\nPassos:\n1. No servidor, verifique se o serviço do banco está em execução\n2. Verifique o Firewall do servidor\n3. Confirme se o banco está escutando na porta correta\n4. Use: netstat -an | findstr <porta> no servidor\n5. Libere a porta no Firewall com o Port Opener' },
        }
    },
    printer_cut: {
        title: 'Impressora não corta o papel',
        icon: '🖨️',
        root: 'q1',
        nodes: {
            q1: { question: 'A impressora imprime normalmente, mas não corta?', options: [
                { label: 'Sim, imprime mas não corta', next: 'q2' },
                { label: 'Não imprime também', next: 'q3' },
            ]},
            q2: { question: 'O modelo da impressora tem guilhotina (corte automático)?', options: [
                { label: 'Sim, tem guilhotina', next: 'q4' },
                { label: 'Não, é corte manual', next: 'a1' },
                { label: 'Não sei', next: 'a2' },
            ]},
            q3: { question: 'A impressora liga e tem papel?', options: [
                { label: 'Sim, liga e tem papel', next: 'q5' },
                { label: 'Não liga', next: 'a3' },
                { label: 'Liga mas sem papel', next: 'a4' },
            ]},
            q4: { question: 'O comando de corte está configurado no sistema?', options: [
                { label: 'Sim, está configurado', next: 'q6' },
                { label: 'Não sei / não configurado', next: 'a5' },
                { label: 'Está configurado mas não funciona', next: 'a6' },
            ]},
            q5: { question: 'A impressora é reconhecida pelo Windows?', options: [
                { label: 'Sim, aparece em Dispositivos e Impressoras', next: 'q7' },
                { label: 'Não aparece', next: 'a7' },
            ]},
            q6: { question: 'A impressora é USB ou Serial/Paralela?', options: [
                { label: 'USB', next: 'a8' },
                { label: 'Serial (COM) ou Paralela (LPT)', next: 'a9' },
            ]},
            q7: { question: 'O driver instalado é o correto para o modelo?', options: [
                { label: 'Sim, é o driver correto', next: 'a10' },
                { label: 'Não sei', next: 'a11' },
            ]},
            a1: { answer: 'Solução', solution: 'Sua impressora não tem corte automático (guilhotina).\n\nPassos:\n1. Modelos como Bematech MP-4200 TH têm guilhotina\n2. Modelos como MP-100 não têm corte automático\n3. Para validar corte, use o Gerador de Comandos ESC/POS (aba Sistemas)\n4. Envie o comando de corte: 1D 56 00\n5. Se a impressora não tem guilhotina, o corte é manual' },
            a2: { answer: 'Solução', solution: 'Para identificar se sua impressora tem corte automático:\n\nPassos:\n1. Verifique o manual do modelo\n2. Modelos comuns com guilhotina: Epson TM-T20, TM-T81, Bematech MP-4200, MP-2800, Elgin i9\n3. Ou tente enviar o comando de corte via ESC/POS\n4. Use o Gerador de Comandos ESC/POS (aba Sistemas)\n5. Se cortar, tem guilhotina; se não cortar, é manual' },
            a3: { answer: 'Solução', solution: 'A impressora não liga.\n\nPassos:\n1. Verifique a fonte de alimentação e o cabo de energia\n2. Teste em outra tomada\n3. Verifique se há luz no painel/botão liga\n4. Se não liga, pode ser problema na fonte ou placa\n5. Encaminhe para assistência técnica' },
            a4: { answer: 'Solução', solution: 'A impressora está sem papel.\n\nPassos:\n1. Abra a tampa e coloque o rolo de papel\n2. Verifique se o papel está na posição correta\n3. Feche a tampa firmemente\n4. A impressora deve avançar o papel automaticamente\n5. Se não avançar, verifique o sensor de papel' },
            a5: { answer: 'Solução', solution: 'O comando de corte não está configurado no sistema.\n\nPassos:\n1. Nas configurações do sistema/PDV, procure "Comandos de Impressão"\n2. Procure a opção de corte automático\n3. Ative o corte de papel\n4. Se o sistema permite comandos personalizados, configure:\n   - Corte total: ESC/POS 1D 56 00\n   - Corte parcial: 1D 56 01\n5. Use o Gerador de Comandos ESC/POS (aba Sistemas) para testar' },
            a6: { answer: 'Solução', solution: 'O comando de corte está configurado mas não funciona.\n\nPassos:\n1. Verifique se a impressora suporta o comando configurado\n2. Teste o comando diretamente com o Gerador de Comandos ESC/POS\n3. Se não cortar, o comando pode estar errado para o modelo\n4. Verifique se não há conflito com o driver Windows\n5. Tente usar impressora em modo raw (sem driver Windows)' },
            a7: { answer: 'Solução', solution: 'A impressora não é reconhecida pelo Windows.\n\nPassos:\n1. Verifique o cabo USB (troque se possível)\n2. Tente outra porta USB\n3. Instale o driver correto do fabricante\n4. Verifique em Gerenciador de Dispositivos se há erro\n5. Se houver erro amarelo, reinstale o driver\n6. Reinicie o computador após instalar' },
            a8: { answer: 'Solução', solution: 'Para impressoras USB que não cortam:\n\nPassos:\n1. Verifique se o driver é o genérico/ESC-POS\n2. Tente imprimir em modo raw (pass-through)\n3. Use o Gerador de Comandos ESC/POS (aba Sistemas) para enviar comando direto\n4. Se cortar via comando direto, o problema está no driver/sistema\n5. Reinstale o driver correto do fabricante' },
            a9: { answer: 'Solução', solution: 'Para impressoras Serial/Paralela que não cortam:\n\nPassos:\n1. Verifique a porta COM/LPT nas configurações\n2. Confirme o baud rate (geralmente 9600)\n3. Verifique o cabo serial — pinos de fluxo (CTS/RTS)\n4. Use o Gerador de Comandos ESC/POS (aba Sistemas) para testar\n5. Se a porta não enviar, use o Diagnóstico de Redes para testar a porta COM' },
            a10: { answer: 'Solução', solution: 'O driver está correto mas a impressora não funciona.\n\nPassos:\n1. Imprima uma página de teste do Windows (Dispositivos e Impressoras → Test page)\n2. Se imprimir a página de teste, o problema está no sistema/PDV\n3. Reinstale o sistema/PDV ou verifique configurações\n4. Se não imprimir a página de teste, reinstale o driver\n5. Reinicie o serviço de spool: net stop spooler && net start spooler' },
            a11: { answer: 'Solução', solution: 'Para verificar se o driver está correto:\n\nPassos:\n1. Identifique o modelo exato da impressora (etiqueta atrás)\n2. Baixe o driver do site do fabricante (Epson, Bematech, Elgin, Daruma)\n3. Desinstale o driver atual (Gerenciador de Dispositivos)\n4. Instale o driver correto\n5. Reinicie o computador\n6. Imprima uma página de teste' },
        }
    },
    point_clock: {
        title: 'Ponto não coleta marcação',
        icon: '🕐',
        root: 'q1',
        nodes: {
            q1: { question: 'O relógio de ponto liga e exibe a tela normal?', options: [
                { label: 'Sim, liga normalmente', next: 'q2' },
                { label: 'Não liga', next: 'a1' },
                { label: 'Liga mas com erro na tela', next: 'a2' },
            ]},
            q2: { question: 'Quando o funcionário coloca o dedo/cartão, acontece algo?', options: [
                { label: 'Reconhece mas não registra', next: 'q3' },
                { label: 'Não reconhece (nenhuma reação)', next: 'q4' },
                { label: 'Biometria não funciona', next: 'q5' },
            ]},
            q3: { question: 'Erro aparece na tela do relógio?', options: [
                { label: 'Sim, erro de comunicação', next: 'a3' },
                { label: 'Sim, erro de memória cheia', next: 'a4' },
                { label: 'Não, parece registrar mas não salva', next: 'a5' },
            ]},
            q4: { question: 'O leitor (cartão/biometria) está ativo?', options: [
                { label: 'Sim, luz acesa/ativo', next: 'q6' },
                { label: 'Não, desligado', next: 'a6' },
            ]},
            q5: { question: 'O leitor biométrico está limpo?', options: [
                { label: 'Sim, está limpo', next: 'q7' },
                { label: 'Não, está sujo/embaçado', next: 'a7' },
            ]},
            q6: { question: 'O cartão/cartão RFID está funcionando?', options: [
                { label: 'Sim, em outro relógio funciona', next: 'a8' },
                { label: 'Não sei testar', next: 'a9' },
            ]},
            q7: { question: 'O funcionário está cadastrado no relógio?', options: [
                { label: 'Sim, está cadastrado', next: 'a10' },
                { label: 'Não sei verificar', next: 'a11' },
            ]},
            a1: { answer: 'Solução', solution: 'O relógio de ponto não liga.\n\nPassos:\n1. Verifique a fonte de alimentação\n2. Teste em outra tomada\n3. Verifique o cabo de energia\n4. Se não liga, pode ser problema na fonte ou placa interna\n5. Encaminhe para assistência técnica autorizada' },
            a2: { answer: 'Solução', solution: 'O relógio liga mas exibe erro.\n\nPassos:\n1. Anote o código/mensagem de erro\n2. Consulte o manual do fabricante (Henry, Datacron, Madis, etc.)\n3. Tente reiniciar o relógio (desligue e religue)\n4. Se persistir, verifique se há atualização de firmware\n5. Contate o suporte do fabricante com o código do erro' },
            a3: { answer: 'Solução', solution: 'Erro de comunicação no relógio.\n\nPassos:\n1. Verifique o cabo de rede do relógio\n2. Confirme o IP do relógio e do servidor\n3. Teste a conexão com ping <ip_do_relogio>\n4. Verifique se o serviço de coleta está rodando no servidor\n5. Use o utilitário de Diagnóstico de Redes (aba Sistemas) para testar a porta\n6. Reinicie o serviço de coleta do ponto' },
            a4: { answer: 'Solução', solution: 'A memória do relógio está cheia.\n\nPassos:\n1. Faça a coleta/exportação das marcações (AFD/AFDT)\n2. Use o Validador de Arquivos Fiscais/Ponto (aba Sistemas) para validar o arquivo\n3. Após a coleta, limpe a memória do relógio\n4. Configure coleta automática para evitar acúmulo\n5. Verifique o espaço de armazenamento no servidor' },
            a5: { answer: 'Solução', solution: 'O relógio parece registrar mas não salva.\n\nPassos:\n1. Verifique se há espaço na memória do relógio\n2. Reinicie o relógio\n3. Verifique a data e hora do relógio (se está correta)\n4. Se data/hora errada, ajuste e reconfigure\n5. Verifique se o relógio não está em modo de configuração\n6. Faça coleta manual para ver se as marcações estão lá' },
            a6: { answer: 'Solução', solution: 'O leitor não está ativo.\n\nPassos:\n1. Reinicie o relógio de ponto\n2. Verifique se o leitor não foi desativado nas configurações\n3. Verifique se há atualização de firmware\n4. Se persistir, pode ser problema no leitor Hardware\n5. Contate o suporte do fabricante' },
            a7: { answer: 'Solução', solution: 'O leitor biométrico está sujo.\n\nPassos:\n1. Limpe o sensor com pano macio levemente umedecido\n2. Não use álcool ou produtos abrasivos\n3. Peça ao funcionário para limpar os dedos antes de registrar\n4. Se persistir, tente cadastrar a digital novamente\n5. Se ainda não funcionar, o sensor pode estar danificado' },
            a8: { answer: 'Solução', solution: 'O cartão funciona em outro relógio.\n\nPassos:\n1. O leitor deste relógio pode estar com problema\n2. Verifique se o tipo de cartão é compatível (proximity, RFID, etc.)\n3. Tente limpar o leitor\n4. Se outro cartão funcionar, pode ser incompatibilidade específica\n5. Contate o suporte do fabricante' },
            a9: { answer: 'Solução', solution: 'Para testar o cartão RFID:\n\nPassos:\n1. Tente o cartão em outro relógio da mesmaMarca/modelo\n2. Se não houver outro relógio, teste com um cartão mestre/conhecido\n3. Verifique se o cartão não está danificado (rachaduras, dobras)\n4. Se possível,grave uma nova informação no cartão\n5. Contate o suporte do fabricante se nada funcionar' },
            a10: { answer: 'Solução', solution: 'O funcionário está cadastrado mas a biometria não funciona.\n\nPassos:\n1. Re-enrole (cadastre novamente) a digital do funcionário\n2. Cadastre mais de um dedo para redundância\n3. Verifique se a digital não está muito ressecada/cortada\n4. Se persistir, pode ser problema no sensor biométrico\n5. Use login por senha como contingência' },
            a11: { answer: 'Solução', solution: 'Para verificar se o funcionário está cadastrado:\n\nPassos:\n1. Acesse o software de gerenciamento do ponto\n2. Vá em Cadastro → Funcionários\n3. Verifique se o funcionário está na lista\n4. Confirme se a digital está cadastrada\n5. Se não estiver, cadastre a digital\n6. Envie o cadastro para o relógio (sincroniza)' },
        }
    },
    ecommerce_sync: {
        title: 'E-commerce não sincroniza estoque',
        icon: '🛒',
        root: 'q1',
        nodes: {
            q1: { question: ' quando você atualiza o estoque, nada muda no site?', options: [
                { label: 'Sim, estoque do site não atualiza', next: 'q2' },
                { label: 'Atualiza mas com atraso/demora', next: 'q3' },
                { label: 'Atualiza parcialmente (alguns produtos)', next: 'q4' },
            ]},
            q2: { question: 'A integração está configurada no e-commerce?', options: [
                { label: 'Sim, está configurada', next: 'q5' },
                { label: 'Não sei', next: 'a1' },
            ]},
            q3: { question: 'A sincronização é manual ou automática?', options: [
                { label: 'Automática (por tempo)', next: 'q6' },
                { label: 'Manual (preciso clicar)', next: 'q7' },
            ]},
            q4: { question: 'Os produtos não sincronizados têm algo em comum?', options: [
                { label: 'Sim, mesma categoria/marca', next: 'a2' },
                { label: 'Não, é aleatório', next: 'a3' },
            ]},
            q5: { question: 'Há erro nos logs da integração?', options: [
                { label: 'Sim, erro de API', next: 'a4' },
                { label: 'Sim, erro de autenticação', next: 'a5' },
                { label: 'Não há erros nos logs', next: 'a6' },
            ]},
            q6: { question: 'Qual o intervalo configurado?', options: [
                { label: 'Menos de 1 hora', next: 'a7' },
                { label: 'Mais de 1 hora', next: 'a8' },
            ]},
            q7: { question: 'Ao clicar em sincronizar, o que acontece?', options: [
                { label: 'Aparece erro', next: 'a9' },
                { label: 'Aparece sucesso mas nada muda', next: 'a10' },
                { label: 'Fica processando infinitamente', next: 'a11' },
            ]},
            a1: { answer: 'Solução', solution: 'Verificar e configurar a integração de estoque.\n\nPassos:\n1. Acesse as configurações do e-commerce\n2. Verifique a aba de Integração/ERP\n3. Confirme se a URL da API do ERP está correta\n4. Verifique se o token/credenciais estão válidos\n5. Use a Central de Testes de APIs (aba Sistemas) para testar a URL\n6. Se não souber a URL, consulte a documentação do ERP' },
            a2: { answer: 'Solução', solution: 'Produtos da mesma categoria/marca não sincronizam.\n\nPassos:\n1. Verifique se há filtro de categoria configurado\n2. Confirme se o mapeamento de categorias está correto\n3. Verifique se os produtos têm o código/SKU correto no ERP e no site\n4. Se produtos da categoria não existem no site, cadaastre-os primeiro\n5. Verifique regras de exclusão por categoria' },
            a3: { answer: 'Solução', solution: 'A sincronização é aleatória.\n\nPassos:\n1. Verifique se o SKU dos produtos está correto e idêntico\n2. Confirme se não há caracteres especiais no SKU\n3. Verifique o limite de produtos por batch na integração\n4. Se há muitos produtos, pode estar atingindo limite\n5. Divida em lotes menores se necessário\n6. Verifique logs para identificar quais falharam' },
            a4: { answer: 'Solução', solution: 'Erro de API na integração.\n\nPassos:\n1. Anote o erro exato da API\n2. Verifique se a URL está acessível (use a Central de Testes de APIs)\n3. Confirme se o formato do JSON está correto\n4. Verifique limites de rate (quantas requisições por minuto)\n5. Se erro 429, aguarde e tente com intervalo maior\n6. Se erro 500, contate o suporte da plataforma' },
            a5: { answer: 'Solução', solution: 'Erro de autenticação na API.\n\nPassos:\n1. Verifique se o token/API key não expirou\n2. Solicite um novo token se necessário\n3. Confirme se as credenciais são as corretas para o ambiente (produção/teste)\n4. Use a Central de Testes de APIs (aba Sistemas) para testar a autenticação\n5. Verifique se o header Authorization está correto' },
            a6: { answer: 'Solução', solution: 'Não há erros nos logs mas a sincronização falha.\n\nPassos:\n1. Verifique se o job/cron de sincronização está rodando\n2. Confirme se o servidor tem clock correto (NTP)\n3. Verifique se não há lock/cache impedindo a atualização\n4. Limpe o cache do e-commerce\n5. Tente uma sincronização manual forçada\n6. Verifique se o webhook de retorno está configurado' },
            a7: { answer: 'Solução', solution: 'A sincronização automática em intervalo curto pode falhar.\n\nPassos:\n1. Intervalos muito curtos podem sobrecarregar o servidor\n2. Aumente o intervalo para 15-30 minutos\n3. Verifique se está atingindo rate limit da API\n4. Considere sincronização por webhook (evento)\n5. Se usa WooCommerce, verifique o Action Scheduler\n6. Se usa VTEX, verifique o nuvem de integração' },
            a8: { answer: 'Solução', solution: 'A sincronização automática com intervalo longo está correta.\n\nPassos:\n1. Se precisa de atualização em tempo real, considere webhook\n2. Webhook atualiza o estoque imediatamente após venda\n3. Para WooCommerce: use o plugin de webhook de estoque\n4. Para VTEX: configure o endpoint de atualização\n5. Para Mercado Livre: use a API de estoque síncrona\n6. Teste o webhook com a Central de Testes de APIs' },
            a9: { answer: 'Solução', solution: 'Erro ao sincronizar manualmente.\n\nPassos:\n1. Anote o erro exibido\n2. Se erro de timeout, o servidor pode estar lento\n3. Se erro de memória, aumente o limite de memória do PHP\n4. Verifique o log de erro do servidor (error.log)\n5. Se erro de banco, verifique espaço em disco\n6. Contate o suporte da plataforma com o erro' },
            a10: { answer: 'Solução', solution: 'Sucesso mas nada muda no site.\n\nPassos:\n1. Limpe o cache do e-commerce (plugins de cache)\n2. Verifique se nao ha cache CDN bloqueando (Cloudflare, etc.)\n3. Confirme se os SKUs batem entre ERP e site\n4. Verifique se o produto esta ativo no site\n5. Se o produto esta como "esgotado" no site, verifique o estoque real\n6. Faca uma alteracao manual no site para confirmar que o front atualiza' },
            a11: { answer: 'Solução', solution: 'Sincronização fica processando infinitamente.\n\nPassos:\n1. Pode estar esperando resposta do ERP que não chega\n2. Verifique timeout da requisição\n3. Confirme se o ERP está online e respondendo\n4. Reinicie o serviço de sincronização\n5. Se persistir, reinicie o servidor web\n6. Use a Central de Testes de APIs (aba Sistemas) para testar a endpoint do ERP' },
        }
    },
};

let currentTree = null;
let currentStep = null;
let pathHistory = [];

export function buildDecisionTreePanel() {
    return `
      <div id="poTool-decisiontree" class="po-tool-panel hidden">
        <div class="card">
          <div class="po-card-header">
            <span class="po-card-icon">🌳</span>
            <div>
              <h3 class="po-card-title">Árvore de Decisão & Triagem</h3>
              <p class="sub">Guias passo a passo para diagnosticar falhas comuns</p>
            </div>
          </div>
        </div>

        <div class="card">
          <p class="po-section-label">Selecione o problema</p>
          <div class="dt-problem-grid">
            ${Object.entries(TREES).map(([key, tree]) => `
              <button class="dt-problem-btn" data-tree="${escapeAttr(key)}">
                <span class="dt-problem-icon">${escapeHtml(tree.icon)}</span>
                <span class="dt-problem-title">${escapeHtml(tree.title)}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <div id="dtFlow" class="hidden">
          <div class="card">
            <div class="dt-breadcrumb" id="dtBreadcrumb"></div>
            <div id="dtContent"></div>
          </div>
        </div>
      </div>
    `;
}

export function bindDecisionTreeEvents(container) {
    container.addEventListener('click', e => {
        const btn = e.target.closest('.dt-problem-btn');
        if (btn) {
            currentTree = TREES[btn.dataset.tree];
            currentStep = currentTree.root;
            pathHistory = [];
            _renderStep(container);
        }
        const optBtn = e.target.closest('.dt-option-btn');
        if (optBtn) {
            pathHistory.push(currentStep);
            currentStep = optBtn.dataset.next;
            _renderStep(container);
        }
        const backBtn = e.target.closest('#dtBtnBack');
        if (backBtn) {
            if (pathHistory.length > 0) {
                currentStep = pathHistory.pop();
                _renderStep(container);
            }
        }
        const restartBtn = e.target.closest('#dtBtnRestart');
        if (restartBtn) {
            currentStep = currentTree.root;
            pathHistory = [];
            _renderStep(container);
        }
    });

    container.addEventListener('keydown', e => {
        if (e.target.matches('.dt-option-btn') && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            e.target.click();
            return;
        }
        const num = parseInt(e.key, 10);
        if (num >= 1 && num <= 9 && !e.target.matches('input, textarea, select')) {
            const optBtns = container.querySelectorAll('.dt-option-btn');
            if (optBtns[num - 1]) {
                e.preventDefault();
                optBtns[num - 1].click();
            }
        }
    });
}

function _renderStep(container) {
    const flow = container.querySelector('#dtFlow');
    const content = container.querySelector('#dtContent');
    const breadcrumb = container.querySelector('#dtBreadcrumb');
    if (!flow || !content || !currentTree) return;

    flow.classList.remove('hidden');
    const node = currentTree.nodes[currentStep];
    if (!node) {
        console.error('decisionTree: node not found for step:', currentStep);
        currentStep = currentTree.root;
        pathHistory = [];
        _renderStep(container);
        return;
    }

    breadcrumb.innerHTML = `<span class="dt-breadcrumb-title">${escapeHtml(currentTree.icon)} ${escapeHtml(currentTree.title)}</span>`;

    if (node.answer) {
        content.innerHTML = `
            <div class="dt-answer">
                <div class="dt-answer-header">
                    <span class="dt-answer-icon">💡</span>
                    <h3>${escapeHtml(node.answer)}</h3>
                </div>
                <pre class="dt-solution-pre">${escapeHtml(node.solution)}</pre>
                <div class="dt-actions">
                    <button id="dtBtnBack" class="btn ghost" ${pathHistory.length === 0 ? 'disabled' : ''}><i class="fa-solid fa-arrow-left"></i> Voltar</button>
                    <button id="dtBtnRestart" class="btn primary"><i class="fa-solid fa-rotate-right"></i> Recomeçar</button>
                </div>
            </div>
        `;
    } else {
        content.innerHTML = `
            <div class="dt-question">
                <h3>${escapeHtml(node.question)}</h3>
                <div class="dt-options">
                    ${node.options.map((opt, i) => `
                        <button class="btn ghost dt-option-btn" data-next="${escapeAttr(opt.next)}">
                            <span class="dt-option-num">${i + 1}</span>
                            <span>${escapeHtml(opt.label)}</span>
                            <i class="fa-solid fa-chevron-right dt-option-arrow"></i>
                        </button>
                    `).join('')}
                </div>
                <div class="dt-actions">
                    <button id="dtBtnBack" class="btn ghost" ${pathHistory.length === 0 ? 'disabled' : ''}><i class="fa-solid fa-arrow-left"></i> Voltar</button>
                </div>
            </div>
        `;
    }
}