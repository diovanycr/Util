# Sistema de Gerenciamento de Terminais FUTURA
# Versao 2.6.0 - Com Melhorias de Robustez e Tratamento de Erros
# Compativel com Windows 7/8/10/11
# PowerShell 2.0+

param(
    [string]$PastaFutura = "C:\FUTURA",
    [switch]$Silencioso
)

# ============================================================================
# CONFIGURACOES GLOBAIS
# ============================================================================

$script:VersaoScript = "2.6.0"
$script:UrlDlls = "https://repositorio.futurasistemas.com.br/download.php?dirfisico=D:/Backup//repositorio//01%20-%20DLLs%20Sistema/atual/32/DLLx86.zip&caminho=https://repositorio.futurasistemas.com.br/repositorio/01%20-%20DLLs%20Sistema/atual/32/DLLx86.zip&filename=DLLx86.zip"
$script:UrlAtualizador = "https://repositorio.futurasistemas.com.br/download.php?dirfisico=D:/Backup//repositorio//00%20-%20Atualizador/Atualizador.exe&caminho=https://repositorio.futurasistemas.com.br/repositorio/00%20-%20Atualizador/Atualizador.exe&filename=Atualizador.exe"
$script:ArquivoIni = "Futura.ini"
$script:ExecutaveisParaBaixar = @("FuturaServer.exe", "PDV.exe")
$script:PastaBackup = "$PastaFutura\Backup_Atualizacao"
$script:ArquivoLog = "$PastaFutura\instalacao_futura.log"

# Cores
$script:CorPrimaria = "Cyan"
$script:CorSucesso = "Green"
$script:CorAviso = "Yellow"
$script:CorErro = "Red"
$script:CorInfo = "White"
$script:CorDestaque = "Magenta"

# Constantes
$script:EspacoMinimoMB = 500
$script:MaxTentativasDownload = 3
$script:TimeoutDownloadSegundos = 300

# ============================================================================
# FUNCOES DE INTERFACE
# ============================================================================

function Show-Banner {
    Clear-Host
    Write-Host ""
    Write-Host "  ================================================================" -ForegroundColor Cyan
    Write-Host "          SISTEMA DE GERENCIAMENTO DE TERMINAIS - FUTURA         " -ForegroundColor Cyan
    Write-Host "                          Versao $script:VersaoScript                          " -ForegroundColor Gray
    Write-Host "  ================================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Show-Linha {
    param([string]$Char = "-")
    Write-Host ("  " + ($Char * 64)) -ForegroundColor Cyan
}

function Show-Titulo {
    param([string]$Texto)
    Write-Host ""
    Show-Linha "="
    Write-Host "  $Texto" -ForegroundColor Magenta
    Show-Linha "="
    Write-Host ""
}

function Show-Item {
    param([string]$Texto, [string]$Tipo = "info")
    
    $cor = "White"
    $prefixo = "*"
    
    if ($Tipo -eq "sucesso") { $cor = "Green"; $prefixo = "[OK]" }
    if ($Tipo -eq "erro") { $cor = "Red"; $prefixo = "[X]" }
    if ($Tipo -eq "aviso") { $cor = "Yellow"; $prefixo = "[!]" }
    
    Write-Host "  $prefixo $Texto" -ForegroundColor $cor
}

function Write-Log {
    param([string]$Mensagem, [string]$Tipo = "INFO")
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Tipo] $Mensagem"
    
    if (-not $Silencioso) {
        Show-Item $Mensagem $Tipo.ToLower()
    }
    
    try {
        # Garantir que a pasta do log existe
        $logDir = Split-Path $ArquivoLog -Parent
        if ($logDir -and -not (Test-Path $logDir)) {
            New-Item -ItemType Directory -Path $logDir -Force | Out-Null
        }
        
        Add-Content -Path $ArquivoLog -Value $logEntry -Encoding UTF8 -ErrorAction SilentlyContinue
    } catch {
        # Fallback para log no TEMP se falhar
        try {
            $tempLog = Join-Path $env:TEMP "futura_install.log"
            Add-Content -Path $tempLog -Value $logEntry -Encoding UTF8 -ErrorAction SilentlyContinue
        } catch {}
    }
}

function Show-Menu {
    Show-Banner
    
    Write-Host "  Selecione a operacao:" -ForegroundColor White
    Write-Host ""
    
    Write-Host "  [1] Criar Novo Terminal Local" -ForegroundColor Green
    Write-Host "      - Configurar servidor de dados" -ForegroundColor Gray
    Write-Host "      - Baixar executaveis" -ForegroundColor Gray
    Write-Host "      - Instalar DLLs" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "  [2] Atualizar Terminal Existente" -ForegroundColor Yellow
    Write-Host "      - Atualizar executaveis" -ForegroundColor Gray
    Write-Host "      - Atualizar DLLs" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "  [3] Atualizar Sistema Completo" -ForegroundColor Magenta
    Write-Host "      - Preparar banco de dados" -ForegroundColor Gray
    Write-Host "      - Executar atualizador oficial" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "  [0] Sair" -ForegroundColor Red
    Write-Host ""
    Show-Linha
    Write-Host ""
    Write-Host "  Opcao: " -NoNewline -ForegroundColor White
    
    return Read-Host
}

function Request-Confirmacao {
    param([string]$Mensagem, [switch]$PermitirVoltar)
    
    while ($true) {
        Write-Host ""
        Write-Host "  $Mensagem" -ForegroundColor Yellow
        
        if ($PermitirVoltar) {
            Write-Host "  [S]im, [N]ao ou [0] Voltar: " -NoNewline -ForegroundColor White
        } else {
            Write-Host "  [S]im ou [N]ao: " -NoNewline -ForegroundColor White
        }
        
        $resp = Read-Host
        
        if ($resp -eq "0" -and $PermitirVoltar) {
            return "VOLTAR"
        }
        
        if ($resp -eq "S" -or $resp -eq "s") {
            return $true
        }
        
        if ($resp -eq "N" -or $resp -eq "n") {
            return $false
        }
        
        Write-Host "  Opcao invalida! Digite S, N" -NoNewline -ForegroundColor Red
        if ($PermitirVoltar) {
            Write-Host " ou 0" -ForegroundColor Red
        } else {
            Write-Host "" -ForegroundColor Red
        }
    }
}

function Select-FromList {
    param(
        [string]$Titulo,
        [array]$Itens,
        [switch]$PermitirVoltar
    )
    
    while ($true) {
        Write-Host ""
        Write-Host "  $Titulo" -ForegroundColor Cyan
        Write-Host ""
        
        for ($i = 0; $i -lt $Itens.Count; $i++) {
            Write-Host "  [$($i+1)] $($Itens[$i])" -ForegroundColor White
        }
        
        Write-Host ""
        if ($PermitirVoltar) {
            Write-Host "  [0] Voltar ao menu principal" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "  Escolha (0-$($Itens.Count)): " -NoNewline -ForegroundColor White
        } else {
            Write-Host "  Escolha (1-$($Itens.Count)): " -NoNewline -ForegroundColor White
        }
        
        $escolha = Read-Host
        
        if ($escolha -eq "0" -and $PermitirVoltar) {
            return "VOLTAR"
        }
        
        try {
            $idx = [int]$escolha - 1
            
            if ($idx -ge 0 -and $idx -lt $Itens.Count) {
                return $idx
            } else {
                Write-Host ""
                Write-Host "  Opcao invalida! Digite um numero entre " -NoNewline -ForegroundColor Red
                if ($PermitirVoltar) {
                    Write-Host "0 e $($Itens.Count)" -ForegroundColor Red
                } else {
                    Write-Host "1 e $($Itens.Count)" -ForegroundColor Red
                }
                Start-Sleep -Seconds 2
            }
        } catch {
            Write-Host ""
            Write-Host "  Entrada invalida! Digite apenas numeros" -ForegroundColor Red
            Start-Sleep -Seconds 2
        }
    }
}

function Show-Erro {
    param([string]$Titulo, [string[]]$Msgs)
    Write-Host ""
    Write-Host "  ================================================================" -ForegroundColor Red
    Write-Host "  ERRO: $Titulo" -ForegroundColor Red
    Write-Host "  ================================================================" -ForegroundColor Red
    Write-Host ""
    foreach ($m in $Msgs) {
        Write-Host "  [X] $m" -ForegroundColor Red
    }
    Write-Host ""
}

function Show-Sucesso {
    param([string]$Titulo, [string[]]$Msgs)
    Write-Host ""
    Write-Host "  ================================================================" -ForegroundColor Green
    Write-Host "  SUCESSO: $Titulo" -ForegroundColor Green
    Write-Host "  ================================================================" -ForegroundColor Green
    Write-Host ""
    foreach ($m in $Msgs) {
        Write-Host "  [OK] $m" -ForegroundColor Green
    }
    Write-Host ""
}

# ============================================================================
# FUNCOES AUXILIARES
# ============================================================================

function Test-IsAdmin {
    try {
        $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
        $principal = New-Object Security.Principal.WindowsPrincipal($identity)
        return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    } catch {
        return $false
    }
}

function Test-EspacoDisco {
    param(
        [string]$Caminho,
        [long]$EspacoNecessarioMB = 500
    )
    
    try {
        # Extrair drive do caminho
        $driveLetter = Split-Path $Caminho -Qualifier
        if (-not $driveLetter) {
            $driveLetter = "C:"
        }
        
        $drive = Get-PSDrive -Name $driveLetter.TrimEnd(':') -ErrorAction Stop
        $espacoLivre = [math]::Round($drive.Free / 1MB, 2)
        
        Write-Log "Espaco livre no drive $($drive.Name): ${espacoLivre} MB" "INFO"
        
        if ($espacoLivre -lt $EspacoNecessarioMB) {
            Write-Host ""
            Write-Host "  [!] AVISO: Pouco espaco em disco!" -ForegroundColor Yellow
            Write-Host "      Disponivel: ${espacoLivre} MB" -ForegroundColor Yellow
            Write-Host "      Recomendado: ${EspacoNecessarioMB} MB" -ForegroundColor Yellow
            Write-Log "Espaco insuficiente: ${espacoLivre}MB < ${EspacoNecessarioMB}MB" "AVISO"
            
            $continuar = Request-Confirmacao "Continuar mesmo assim?"
            return $continuar
        }
        
        return $true
        
    } catch {
        Write-Log "Erro ao verificar espaco em disco: $($_.Exception.Message)" "AVISO"
        return $true  # Continuar em caso de erro na verificação
    }
}

function Test-ServidorAcessivel {
    param(
        [string]$Servidor,
        [int]$TimeoutSegundos = 10
    )
    
    Write-Host "  Testando conexao com $Servidor (timeout: ${TimeoutSegundos}s)..." -ForegroundColor Gray
    Write-Log "Testando conectividade com servidor: $Servidor" "INFO"
    
    # Primeiro: testar ping (apenas informativo)
    try {
        $pingResult = $null
        
        # PowerShell 2.0 compatível - usar Test-Connection básico
        try {
            $pingResult = Test-Connection -ComputerName $Servidor -Count 1 -Quiet -ErrorAction Stop
        } catch {
            # Fallback para ping.exe se Test-Connection falhar
            $pingOutput = ping -n 1 -w 1000 $Servidor 2>$null
            $pingResult = $LASTEXITCODE -eq 0
        }
        
        if ($pingResult) {
            Write-Log "Servidor responde a ping" "INFO"
        } else {
            Write-Log "Servidor nao responde a ping (pode ser bloqueado por firewall)" "AVISO"
        }
    } catch {
        Write-Log "Nao foi possivel pingar o servidor: $($_.Exception.Message)" "AVISO"
    }
    
    # Segundo: testar acesso ao compartilhamento (decisivo)
    $caminho = "\\$Servidor\Futura"
    
    $scriptBlock = {
        param($path)
        Test-Path $path
    }
    
    try {
        $job = Start-Job -ScriptBlock $scriptBlock -ArgumentList $caminho
        $result = Wait-Job $job -Timeout $TimeoutSegundos
        
        if ($result) {
            $acessivel = Receive-Job $job
            Remove-Job $job -Force
            
            if ($acessivel) {
                Write-Log "Compartilhamento acessivel: $caminho" "INFO"
            } else {
                Write-Log "Compartilhamento nao encontrado: $caminho" "AVISO"
            }
            
            return $acessivel
        } else {
            Remove-Job $job -Force
            Write-Host "  [!] Timeout ao acessar $caminho" -ForegroundColor Yellow
            Write-Log "Timeout ao acessar compartilhamento" "ERRO"
            return $false
        }
    } catch {
        Write-Log "Erro ao testar acesso: $($_.Exception.Message)" "ERRO"
        return $false
    }
}

function Get-ContentIni {
    param([string]$Caminho)
    
    try {
        if (-not (Test-Path $Caminho)) {
            Write-Log "Arquivo INI nao encontrado: $Caminho" "ERRO"
            return $null
        }
        
        # Tentar detectar encoding
        $bytes = [System.IO.File]::ReadAllBytes($Caminho)
        $encoding = [System.Text.Encoding]::Default
        
        # Verificar BOM UTF-8
        if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
            $encoding = [System.Text.Encoding]::UTF8
            Write-Log "Arquivo INI detectado como UTF-8" "INFO"
        }
        
        return Get-Content $Caminho -Encoding Default
    } catch {
        Write-Log "Erro ao ler arquivo INI: $($_.Exception.Message)" "ERRO"
        return $null
    }
}

function Set-ContentIni {
    param(
        [string]$Caminho,
        [array]$Conteudo
    )
    
    try {
        # Criar backup antes de modificar
        if (Test-Path $Caminho) {
            $backup = "$Caminho.bak"
            Copy-Item $Caminho $backup -Force -ErrorAction SilentlyContinue
            Write-Log "Backup criado: $backup" "INFO"
        }
        
        # Usar encoding Default para compatibilidade
        $Conteudo | Out-File $Caminho -Encoding default -Force
        Write-Log "Arquivo INI gravado com sucesso: $Caminho" "INFO"
        return $true
    } catch {
        Write-Log "Erro ao gravar arquivo INI: $($_.Exception.Message)" "ERRO"
        return $false
    }
}

function Get-Servidor {
    param([string]$Ini)
    
    if (-not (Test-Path $Ini)) { 
        Write-Log "Arquivo INI nao encontrado: $Ini" "ERRO"
        return $null 
    }
    
    try {
        $linhas = Get-ContentIni $Ini
        
        if (-not $linhas) {
            Write-Log "Nao foi possivel ler o arquivo INI" "ERRO"
            return $null
        }
        
        foreach ($l in $linhas) {
            if ($l -match "^\s*DADOS_IP\s*=\s*(.+)") {
                $servidor = $matches[1].Trim()
                Write-Log "Servidor encontrado no INI: $servidor" "INFO"
                return $servidor
            }
        }
    } catch {
        Write-Log "Erro ao ler arquivo INI: $($_.Exception.Message)" "ERRO"
    }
    
    Write-Log "Servidor nao encontrado no arquivo INI" "AVISO"
    return $null
}

function Update-IniSecao {
    param(
        [array]$Linhas,
        [string]$Secao,
        [hashtable]$Valores
    )
    
    $linhasAtualizadas = @()
    $dentroSecao = $false
    $camposAtualizados = @{}
    $secaoEncontrada = $false
    
    foreach ($linha in $Linhas) {
        # Detectar início de seção
        if ($linha -match "^\s*\[$Secao\]") {
            $dentroSecao = $true
            $secaoEncontrada = $true
            $linhasAtualizadas += $linha
            continue
        }
        
        # Detectar outra seção (fim da seção atual)
        if ($linha -match '^\s*\[([^\]]+)\]' -and $matches[1] -ne $Secao) {
            # Se estava na seção, adicionar campos faltantes antes de sair
            if ($dentroSecao) {
                foreach ($chave in $Valores.Keys) {
                    if (-not $camposAtualizados.ContainsKey($chave)) {
                        $linhasAtualizadas += "$chave=$($Valores[$chave])"
                        $camposAtualizados[$chave] = $true
                        Write-Log "Campo adicionado ao final da secao [$Secao]: $chave" "INFO"
                    }
                }
            }
            $dentroSecao = $false
        }
        
        # Se estiver dentro da seção, tentar atualizar valores
        if ($dentroSecao) {
            $atualizada = $false
            
            foreach ($chave in $Valores.Keys) {
                if ($linha -match "^\s*$chave\s*=") {
                    $linhasAtualizadas += "$chave=$($Valores[$chave])"
                    $camposAtualizados[$chave] = $true
                    $atualizada = $true
                    Write-Log "Campo atualizado em [$Secao]: $chave=$($Valores[$chave])" "INFO"
                    break
                }
            }
            
            if (-not $atualizada) {
                $linhasAtualizadas += $linha
            }
        } else {
            $linhasAtualizadas += $linha
        }
    }
    
    # Se a seção não foi encontrada, adicionar ao final
    if (-not $secaoEncontrada) {
        $linhasAtualizadas += ""
        $linhasAtualizadas += "[$Secao]"
        foreach ($chave in $Valores.Keys) {
            $linhasAtualizadas += "$chave=$($Valores[$chave])"
            $camposAtualizados[$chave] = $true
            Write-Log "Secao [$Secao] criada com campo: $chave" "INFO"
        }
    }
    # Se estava na seção até o fim do arquivo, adicionar campos faltantes
    elseif ($dentroSecao) {
        foreach ($chave in $Valores.Keys) {
            if (-not $camposAtualizados.ContainsKey($chave)) {
                $linhasAtualizadas += "$chave=$($Valores[$chave])"
                $camposAtualizados[$chave] = $true
                Write-Log "Campo adicionado ao final do arquivo em [$Secao]: $chave" "INFO"
            }
        }
    }
    
    return @{
        Linhas = $linhasAtualizadas
        CamposAtualizados = $camposAtualizados
    }
}

function Create-PesquisaINI {
    param(
        [string]$PastaInstalacao,
        [string]$PastaFirebird,
        [string]$CaminhoBanco
    )
    
    Write-Host "  Configurando arquivo PESQUISA.INI..." -ForegroundColor Cyan
    Write-Log "Iniciando configuracao de PESQUISA.INI" "INFO"
    
    try {
        # Caminho do arquivo
        $arquivoPesquisa = Join-Path $PastaInstalacao "PESQUISA.INI"
        
        # Determinar pasta do Firebird (detecta versão instalada)
        if (-not $PastaFirebird) {
            $possiveisCaminhos = @(
                "C:\Program Files\Firebird\Firebird_5_0",
                "C:\Program Files\Firebird\Firebird_4_0",
                "C:\Program Files\Firebird\Firebird_3_0",
                "C:\Program Files (x86)\Firebird\Firebird_5_0",
                "C:\Program Files (x86)\Firebird\Firebird_4_0",
                "C:\Program Files (x86)\Firebird\Firebird_3_0"
            )
            
            foreach ($caminho in $possiveisCaminhos) {
                if (Test-Path $caminho) {
                    $PastaFirebird = $caminho
                    Write-Log "Firebird encontrado em: $PastaFirebird" "INFO"
                    break
                }
            }
            
            if (-not $PastaFirebird) {
                $PastaFirebird = "C:\Program Files\Firebird\Firebird_3_0"
                Write-Log "Firebird nao encontrado, usando padrao: $PastaFirebird" "AVISO"
            }
        }
        
        # PASTA_BACKUP sempre baseada na PASTA_SISTEMA
        $pastaBackup = Join-Path $PastaInstalacao "backup"
        if (-not (Test-Path $pastaBackup)) {
            New-Item -ItemType Directory -Path $pastaBackup -Force | Out-Null
            Write-Log "Pasta de backup criada: $pastaBackup" "INFO"
        }
        
        # BASE_IP sempre "localhost" (FIXO)
        $baseIP = "localhost"
        
        # Valores a serem atualizados
        $valoresNovos = @{
            "PASTA_FIREBIRD" = $PastaFirebird
            "PASTA_BACKUP" = $pastaBackup
            "PASTA_SISTEMA" = $PastaInstalacao
            "BASE_IP" = $baseIP
            "BASE_PATH" = $CaminhoBanco
        }
        
        # Verificar se arquivo existe
        if (Test-Path $arquivoPesquisa) {
            Write-Host "  Arquivo PESQUISA.INI ja existe, atualizando..." -ForegroundColor Yellow
            Write-Log "PESQUISA.INI existe, atualizando valores" "INFO"
            
            # Ler todas as linhas
            $linhas = Get-ContentIni $arquivoPesquisa
            
            if (-not $linhas) {
                Write-Log "Erro ao ler PESQUISA.INI existente, criando novo" "AVISO"
                # Criar novo se não conseguir ler
                $conteudo = @"
[ATUALIZADO_AUTOMATICO]
PASTA_FIREBIRD=$PastaFirebird
PASTA_BACKUP=$pastaBackup
PASTA_SISTEMA=$PastaInstalacao
BASE_IP=$baseIP
BASE_PATH=$CaminhoBanco
"@
                $sucesso = Set-ContentIni $arquivoPesquisa $conteudo.Split("`n")
                if ($sucesso) {
                    Show-Item "PESQUISA.INI criado com sucesso" "sucesso"
                }
                return $sucesso
            }
            
            # Atualizar seção usando função modular
            $resultado = Update-IniSecao -Linhas $linhas -Secao "ATUALIZADO_AUTOMATICO" -Valores $valoresNovos
            
            # Salvar arquivo atualizado
            $sucesso = Set-ContentIni $arquivoPesquisa $resultado.Linhas
            
            if ($sucesso) {
                Show-Item "PESQUISA.INI atualizado (backup em .bak)" "sucesso"
                Write-Log "PESQUISA.INI atualizado. Campos modificados: $($resultado.CamposAtualizados.Count)" "INFO"
            }
            
            return $sucesso
            
        } else {
            # Arquivo não existe - criar novo
            Write-Host "  Criando novo arquivo PESQUISA.INI..." -ForegroundColor Cyan
            Write-Log "Criando novo PESQUISA.INI" "INFO"
            
            $conteudo = @"
[ATUALIZADO_AUTOMATICO]
PASTA_FIREBIRD=$PastaFirebird
PASTA_BACKUP=$pastaBackup
PASTA_SISTEMA=$PastaInstalacao
BASE_IP=$baseIP
BASE_PATH=$CaminhoBanco
"@
            
            $sucesso = Set-ContentIni $arquivoPesquisa $conteudo.Split("`n")
            
            if ($sucesso) {
                Show-Item "PESQUISA.INI criado com sucesso" "sucesso"
                Write-Log "PESQUISA.INI criado: $arquivoPesquisa" "INFO"
            }
            
            return $sucesso
        }
        
    } catch {
        Show-Item "Erro ao configurar PESQUISA.INI: $($_.Exception.Message)" "erro"
        Write-Log "Erro ao configurar PESQUISA.INI: $($_.Exception.Message)" "ERRO"
        return $false
    } finally {
        # Mostrar resumo sempre
        if (Test-Path (Join-Path $PastaInstalacao "PESQUISA.INI")) {
            Write-Host ""
            Write-Host "  Configuracoes aplicadas:" -ForegroundColor Cyan
            Write-Host "  - Firebird: $PastaFirebird" -ForegroundColor Gray
            Write-Host "  - Backup: $pastaBackup" -ForegroundColor Gray
            Write-Host "  - Sistema: $PastaInstalacao" -ForegroundColor Gray
            Write-Host "  - IP: localhost (fixo)" -ForegroundColor Gray
            Write-Host "  - Banco: $CaminhoBanco" -ForegroundColor Gray
            Write-Host ""
        }
    }
}

function Validate-ServidorInput {
    param([string]$Servidor)
    
    if ([string]::IsNullOrWhiteSpace($Servidor)) {
        Write-Log "Validacao servidor: entrada vazia" "AVISO"
        return $false
    }
    
    # Validar formato basico (IP ou hostname)
    if ($Servidor -notmatch '^[\w\.-]+$') {
        Write-Log "Validacao servidor: formato invalido ($Servidor)" "AVISO"
        return $false
    }
    
    Write-Log "Validacao servidor: OK ($Servidor)" "INFO"
    return $true
}

function Test-IntegridadeInstalacao {
    param([string]$PastaInstalacao)
    
    Write-Host "  Verificando integridade da instalacao..." -ForegroundColor Cyan
    Write-Log "Iniciando verificacao de integridade em: $PastaInstalacao" "INFO"
    
    $problemas = @()
    
    # Verificar se pasta existe
    if (-not (Test-Path $PastaInstalacao)) {
        $problemas += "Pasta de instalacao nao existe: $PastaInstalacao"
        Write-Log "Pasta de instalacao nao encontrada" "ERRO"
        
        Write-Host ""
        Write-Host "  Problemas encontrados:" -ForegroundColor Red
        foreach ($p in $problemas) {
            Write-Host "  - $p" -ForegroundColor Red
        }
        return $false
    }
    
    # Verificar arquivos essenciais
    $arquivosEssenciais = @("Futura.ini")
    
    foreach ($arq in $arquivosEssenciais) {
        $caminho = Join-Path $PastaInstalacao $arq
        if (-not (Test-Path $caminho)) {
            $problemas += "Arquivo nao encontrado: $arq"
            Write-Log "Arquivo essencial ausente: $arq" "AVISO"
        }
    }
    
    # Verificar configuração do servidor (apenas aviso)
    $ini = Join-Path $PastaInstalacao "Futura.ini"
    if (Test-Path $ini) {
        $servidor = Get-Servidor $ini
        if (-not $servidor) {
            $problemas += "Servidor nao configurado em Futura.ini (pode ser normal)"
            Write-Log "Servidor nao encontrado no INI" "AVISO"
        }
    }
    
    # Retornar resultado
    if ($problemas.Count -gt 0) {
        Write-Host ""
        Write-Host "  Avisos encontrados:" -ForegroundColor Yellow
        foreach ($p in $problemas) {
            Write-Host "  - $p" -ForegroundColor Yellow
        }
        Write-Log "Verificacao de integridade encontrou $($problemas.Count) aviso(s)" "AVISO"
        
        # Perguntar se deseja continuar
        $continuar = Request-Confirmacao "Continuar mesmo assim?"
        return $continuar
    } else {
        Show-Item "Instalacao integra" "sucesso"
        Write-Log "Verificacao de integridade OK" "INFO"
        return $true
    }
}

# ============================================================================
# FUNCOES DE FIREBIRD
# ============================================================================

function Stop-FirebirdServices {
    param([bool]$IsAdmin)
    
    $servicosParados = @()
    
    if (-not $IsAdmin) {
        Write-Host ""
        Write-Host "  [!] AVISO: Script nao esta executando como Administrador!" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "  Para parar os servicos do Firebird, e necessario executar como Admin." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "  Opcoes:" -ForegroundColor White
        Write-Host "  [1] Continuar mesmo assim (pode falhar ao renomear o banco)" -ForegroundColor Gray
        Write-Host "  [2] Parar servicos manualmente e continuar" -ForegroundColor Gray
        Write-Host "  [3] Cancelar e reiniciar como Administrador" -ForegroundColor Gray
        Write-Host ""
        Write-Host "  Escolha (1/2/3): " -NoNewline -ForegroundColor White
        $opcaoAdmin = Read-Host
        
        if ($opcaoAdmin -eq "3") {
            Write-Host ""
            Write-Host "  Operacao cancelada." -ForegroundColor Yellow
            Write-Host ""
            Write-Host "  Para executar como Administrador:" -ForegroundColor Cyan
            Write-Host "  1. Clique com botao direito no arquivo .bat" -ForegroundColor Gray
            Write-Host "  2. Selecione 'Executar como administrador'" -ForegroundColor Gray
            Write-Host ""
            throw "Operacao cancelada pelo usuario"
        }
        elseif ($opcaoAdmin -eq "2") {
            Write-Host ""
            Write-Host "  Por favor, pare os servicos do Firebird manualmente:" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "  1. Abra o Gerenciador de Servicos (services.msc)" -ForegroundColor Gray
            Write-Host "  2. Pare os servicos:" -ForegroundColor Gray
            Write-Host "     - Firebird Server - DefaultInstance" -ForegroundColor Gray
            Write-Host "     - Firebird Guardian - DefaultInstance" -ForegroundColor Gray
            Write-Host ""
            Write-Host "  Pressione ENTER quando os servicos estiverem parados..." -ForegroundColor Cyan
            pause
        }
        else {
            Write-Host ""
            Write-Host "  [!] Continuando sem parar servicos automaticamente..." -ForegroundColor Yellow
            Write-Host "  Se houver erro, feche o Firebird manualmente e tente novamente." -ForegroundColor Gray
        }
        
        return $servicosParados
    }
    
    # Executando como admin - parar servicos
    Write-Host ""
    Write-Host "  Parando servicos do Firebird..." -ForegroundColor Cyan
    Write-Log "Tentando parar servicos do Firebird (executando como admin)" "INFO"
    
    $servicos = @("FirebirdServerDefaultInstance", "FirebirdGuardianDefaultInstance")
    
    foreach ($s in $servicos) {
        try {
            $svc = Get-Service -Name $s -ErrorAction SilentlyContinue
            if ($svc -and $svc.Status -eq "Running") {
                Stop-Service -Name $s -Force -ErrorAction Stop -WarningAction SilentlyContinue
                Show-Item "Servico $s parado" "sucesso"
                Write-Log "Servico $s parado com sucesso" "INFO"
                $servicosParados += $s
                Start-Sleep -Seconds 2
            }
            elseif ($svc) {
                Show-Item "Servico $s ja estava parado" "info"
                Write-Log "Servico $s ja estava parado" "INFO"
            } else {
                Write-Log "Servico $s nao encontrado (pode nao estar instalado)" "INFO"
            }
        } catch {
            Show-Item "Erro ao parar $s : $($_.Exception.Message)" "aviso"
            Write-Log "Erro ao parar servico $s : $($_.Exception.Message)" "ERRO"
        }
    }
    
    if ($servicosParados.Count -eq 0) {
        Write-Host ""
        Write-Host "  [!] Nenhum servico do Firebird foi parado" -ForegroundColor Yellow
        Write-Host "  Os servicos podem nao estar instalados ou ja estavam parados" -ForegroundColor Gray
        Write-Log "Nenhum servico do Firebird foi parado" "AVISO"
    }
    
    # Aguardar liberacao de arquivos
    Write-Host ""
    Write-Host "  Aguardando liberacao de arquivos do banco..." -ForegroundColor Cyan
    Start-Sleep -Seconds 5
    
    return $servicosParados
}

function Restore-FirebirdServices {
    param([array]$Servicos, [bool]$IsAdmin)
    
    if (-not $IsAdmin) {
        Write-Host ""
        Write-Host "  [!] Lembre-se de reiniciar os servicos do Firebird manualmente" -ForegroundColor Yellow
        Write-Host "  Ou reinicie o computador" -ForegroundColor Gray
        Write-Log "Servicos do Firebird devem ser reiniciados manualmente" "AVISO"
        return
    }
    
    if ($Servicos.Count -eq 0) {
        Write-Host ""
        Write-Host "  Nenhum servico para reiniciar" -ForegroundColor Gray
        Write-Log "Nenhum servico para reiniciar" "INFO"
        return
    }
    
    Write-Host ""
    Write-Host "  Reiniciando servicos do Firebird..." -ForegroundColor Cyan
    Write-Log "Tentando reiniciar servicos do Firebird" "INFO"
    
    # Reiniciar em ordem inversa (Guardian por ultimo)
    $Servicos = $Servicos | Sort-Object -Descending
    
    foreach ($s in $Servicos) {
        try {
            Start-Service -Name $s -ErrorAction Stop -WarningAction SilentlyContinue
            Show-Item "Servico $s reiniciado" "sucesso"
            Write-Log "Servico $s reiniciado com sucesso" "INFO"
            Start-Sleep -Seconds 2
        } catch {
            Show-Item "Erro ao reiniciar $s : $($_.Exception.Message)" "aviso"
            Write-Log "Erro ao reiniciar servico $s : $($_.Exception.Message)" "ERRO"
            
            Write-Host ""
            Write-Host "  [!] Reinicie manualmente o servico: $s" -ForegroundColor Yellow
        }
    }
}

# ============================================================================
# FUNCOES DE DOWNLOAD E EXTRACAO
# ============================================================================

function Download-Arquivo {
    param(
        [string]$Url, 
        [string]$Destino,
        [string]$Descricao = "Baixando arquivo"
    )
    
    try {
        # Validar URL
        if ([string]::IsNullOrWhiteSpace($Url)) {
            throw "URL nao pode ser vazia"
        }
        
        # Validar destino
        if ([string]::IsNullOrWhiteSpace($Destino)) {
            throw "Caminho de destino nao pode ser vazio"
        }
        
        Write-Host "  $Descricao..." -ForegroundColor Cyan
        Write-Log "Iniciando download: $Url -> $Destino" "INFO"
        
        # Garantir pasta de destino
        $pastaDestino = Split-Path $Destino -Parent
        if ($pastaDestino -and -not (Test-Path $pastaDestino)) {
            New-Item -ItemType Directory -Path $pastaDestino -Force -ErrorAction Stop | Out-Null
        }
        
        # Forcar TLS 1.2 se disponivel
        try {
            [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12
            Write-Log "TLS 1.2 configurado" "INFO"
        } catch {
            Write-Log "TLS 1.2 nao disponivel, usando protocolo padrao" "AVISO"
        }
        
        # Windows 7 compativel - usar System.Net.WebClient
        $wc = New-Object System.Net.WebClient
        $wc.Headers.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
        
        # Download
        $wc.DownloadFile($Url, $Destino)
        $wc.Dispose()
        
        # Verificar se arquivo foi criado e tem tamanho > 0
        if (-not (Test-Path $Destino)) {
            throw "Arquivo nao foi criado: $Destino"
        }
        
        $tamanho = (Get-Item $Destino).Length
        if ($tamanho -eq 0) {
            throw "Arquivo baixado esta vazio"
        }
        
        $tamanhoMB = [math]::Round($tamanho/1MB, 2)
        Show-Item "Download concluido ($tamanhoMB MB)" "sucesso"
        Write-Log "Download concluido com sucesso ($tamanho bytes)" "INFO"
        
        return $true
        
    } catch {
        Show-Item "Erro no download: $($_.Exception.Message)" "erro"
        Write-Log "Erro no download: $($_.Exception.Message)" "ERRO"
        
        # Limpar arquivo parcial se existir
        if (Test-Path $Destino) {
            try {
                Remove-Item $Destino -Force -ErrorAction SilentlyContinue
                Write-Log "Arquivo parcial removido: $Destino" "INFO"
            } catch {
                Write-Log "Erro ao remover arquivo parcial: $($_.Exception.Message)" "AVISO"
            }
        }
        
        return $false
    }
}

function Download-ArquivoComRetry {
    param(
        [string]$Url,
        [string]$Destino,
        [string]$Descricao = "Baixando arquivo",
        [int]$MaxTentativas = 3
    )
    
    Write-Log "Iniciando download com retry: max $MaxTentativas tentativas" "INFO"
    
    for ($tentativa = 1; $tentativa -le $MaxTentativas; $tentativa++) {
        if ($tentativa -gt 1) {
            Write-Host ""
            Write-Host "  Tentativa $tentativa de $MaxTentativas..." -ForegroundColor Yellow
            Write-Log "Tentativa $tentativa de download" "AVISO"
            Start-Sleep -Seconds 3
        }
        
        $sucesso = Download-Arquivo -Url $Url -Destino $Destino -Descricao $Descricao
        
        if ($sucesso) {
            Write-Log "Download bem-sucedido na tentativa $tentativa" "INFO"
            return $true
        }
    }
    
    Write-Log "Falha apos $MaxTentativas tentativas de download" "ERRO"
    return $false
}

function Extrair-Zip {
    param([string]$ZipFile, [string]$Destino)
    
    Write-Log "Extraindo ZIP: $ZipFile -> $Destino" "INFO"
    
    # Validar arquivo ZIP
    if (-not (Test-Path $ZipFile)) {
        Write-Log "Arquivo ZIP nao encontrado: $ZipFile" "ERRO"
        return $false
    }
    
    $tamanhoZip = (Get-Item $ZipFile).Length
    if ($tamanhoZip -eq 0) {
        Write-Log "Arquivo ZIP esta vazio" "ERRO"
        return $false
    }
    
    Write-Log "Tamanho do ZIP: $tamanhoZip bytes" "INFO"
    
    # Verificar versao do PowerShell
    $psVersion = $PSVersionTable.PSVersion.Major
    Write-Log "Versao do PowerShell: $psVersion" "INFO"
    
    try {
        if ($psVersion -ge 5) {
            # PowerShell 5+ tem Expand-Archive nativo
            Write-Log "Usando Expand-Archive (PowerShell 5+)" "INFO"
            Expand-Archive -Path $ZipFile -DestinationPath $Destino -Force
            Write-Log "ZIP extraido com Expand-Archive" "INFO"
        } 
        else {
            # PowerShell 2.0-4.0 - usar Shell.Application (Windows 7)
            Write-Log "Usando Shell.Application para extrair ZIP (PS $psVersion)" "INFO"
            
            $shell = New-Object -ComObject Shell.Application
            $zip = $shell.NameSpace($ZipFile)
            
            if (-not $zip) {
                throw "Nao foi possivel abrir o arquivo ZIP"
            }
            
            if (-not (Test-Path $Destino)) {
                New-Item -ItemType Directory -Path $Destino -Force | Out-Null
            }
            
            $destination = $shell.NameSpace($Destino)
            
            # Opção 16 = Sim para Todos (sem diálogos)
            $destination.CopyHere($zip.Items(), 16)
            
            # Aguardar extracao completa
            $esperado = $zip.Items().Count
            $timeout = 60  # 60 segundos maximo
            
            Write-Host "  Aguardando extracao de $esperado arquivos..." -ForegroundColor Gray
            Write-Log "Esperando extracao de $esperado arquivos" "INFO"
            
            for ($i = 0; $i -lt $timeout; $i++) {
                Start-Sleep -Seconds 1
                
                try {
                    $atual = (Get-ChildItem -Path $Destino -Recurse -File -ErrorAction SilentlyContinue).Count
                    
                    if ($atual -ge $esperado) {
                        Write-Log "Extracao concluida: $atual/$esperado arquivos" "INFO"
                        break
                    }
                    
                    # Mostrar progresso a cada 5 segundos
                    if ($i % 5 -eq 0 -and $i -gt 0) {
                        Write-Host "  Extraidos $atual de $esperado arquivos..." -ForegroundColor Gray
                    }
                } catch {
                    # Ignorar erros durante contagem
                }
            }
            
            # Aguardar mais um pouco para garantir
            Start-Sleep -Seconds 2
        }
        
        # Verificar se arquivos foram extraídos
        $arquivosExtraidos = Get-ChildItem -Path $Destino -Recurse -File -ErrorAction SilentlyContinue
        $quantidadeExtraida = $arquivosExtraidos.Count
        
        if ($quantidadeExtraida -eq 0) {
            Write-Log "Nenhum arquivo foi extraido" "ERRO"
            return $false
        }
        
        Write-Log "Extracao concluida: $quantidadeExtraida arquivos" "INFO"
        return $true
        
    } catch {
        Write-Log "Erro ao extrair ZIP: $($_.Exception.Message)" "ERRO"
        return $false
    }
}

function Download-Dlls {
    param([string]$Destino)
    
    Write-Log "Iniciando download de DLLs para: $Destino" "INFO"
    
    try {
        $timestamp = Get-Date -Format 'yyyyMMddHHmmss'
        $temp = Join-Path $env:TEMP "dlls_$timestamp.zip"
        
        # Download com retry
        $downloadOk = Download-ArquivoComRetry -Url $script:UrlDlls -Destino $temp -Descricao "Baixando DLLs" -MaxTentativas $script:MaxTentativasDownload
        
        if (-not $downloadOk) {
            Write-Log "Falha no download das DLLs apos todas as tentativas" "ERRO"
            return $false
        }
        
        # Verificar se arquivo foi baixado
        if (-not (Test-Path $temp)) {
            Show-Item "Arquivo de DLLs nao foi baixado" "erro"
            Write-Log "Arquivo ZIP nao encontrado apos download" "ERRO"
            return $false
        }
        
        Write-Host ""
        Write-Host "  Extraindo DLLs..." -ForegroundColor Cyan
        
        $extract = Join-Path $env:TEMP "dlls_extract_$timestamp"
        if (Test-Path $extract) { 
            Remove-Item $extract -Recurse -Force -ErrorAction SilentlyContinue
        }
        
        # Extrair ZIP
        $extractOk = Extrair-Zip $temp $extract
        
        if (-not $extractOk) {
            Show-Item "Erro ao extrair DLLs" "erro"
            Write-Log "Falha na extracao das DLLs" "ERRO"
            
            # Limpar arquivo ZIP
            if (Test-Path $temp) {
                Remove-Item $temp -Force -ErrorAction SilentlyContinue
            }
            
            return $false
        }
        
        # Copiar arquivos extraidos
        Write-Host "  Instalando DLLs..." -ForegroundColor Cyan
        Write-Log "Iniciando copia de DLLs para: $Destino" "INFO"
        
        $arqs = Get-ChildItem -Path $extract -Recurse -File -ErrorAction SilentlyContinue
        $n = 0
        $erros = 0
        
        foreach ($a in $arqs) {
            try {
                $rel = $a.FullName.Substring($extract.Length + 1)
                $dest = Join-Path $Destino $rel
                $dir = Split-Path $dest -Parent
                
                if (-not (Test-Path $dir)) {
                    New-Item -ItemType Directory -Path $dir -Force | Out-Null
                }
                
                Copy-Item -Path $a.FullName -Destination $dest -Force -ErrorAction Stop
                $n++
            } catch {
                Write-Log "Erro ao copiar DLL $($a.Name): $($_.Exception.Message)" "AVISO"
                $erros++
            }
        }
        
        # Limpar temporarios
        Write-Log "Limpando arquivos temporarios" "INFO"
        Remove-Item $extract -Recurse -Force -ErrorAction SilentlyContinue
        Remove-Item $temp -Force -ErrorAction SilentlyContinue
        
        if ($n -gt 0) {
            Show-Item "DLLs instaladas: $n arquivos" "sucesso"
            Write-Log "DLLs instaladas com sucesso: $n arquivos, $erros erros" "INFO"
            return $true
        } else {
            Show-Item "Nenhuma DLL foi instalada" "erro"
            Write-Log "Nenhuma DLL foi copiada" "ERRO"
            return $false
        }
        
    } catch {
        Show-Item "Erro ao processar DLLs: $($_.Exception.Message)" "erro"
        Write-Log "Erro ao processar DLLs: $($_.Exception.Message)" "ERRO"
        return $false
    }
}

# ============================================================================
# FUNCOES DE DETECCAO - MODULARIZADAS
# ============================================================================

function Find-Instalacoes {
    Write-Host "  Procurando instalacoes do sistema..." -ForegroundColor Cyan
    Write-Log "Iniciando busca de instalacoes" "INFO"
    
    $pastas = @()
    
    # Buscar em multiplos drives
    $drives = Get-PSDrive -PSProvider FileSystem -ErrorAction SilentlyContinue | Where-Object { 
        $_.Root -match '^[C-Z]:\\$' 
    }
    
    Write-Log "Drives encontrados para busca: $($drives.Count)" "INFO"
    
    foreach ($drive in $drives) {
        Write-Host "  Verificando $($drive.Root)..." -ForegroundColor Gray
        
        try {
            # Busca no nivel raiz
            Get-ChildItem -Path $drive.Root -Directory -ErrorAction SilentlyContinue | ForEach-Object {
                $iniPath = Join-Path $_.FullName "Futura.ini"
                if (Test-Path $iniPath) {
                    $pastas += $_.FullName
                    Write-Log "Instalacao encontrada: $($_.FullName)" "INFO"
                }
            }
            
            # Busca recursiva limitada (ate 2 niveis) - APENAS no drive C
            if ($drive.Name -eq "C") {
                Write-Log "Executando busca profunda no drive C:" "INFO"
                Get-ChildItem -Path $drive.Root -Filter "Futura.ini" -Recurse -Depth 2 -ErrorAction SilentlyContinue | ForEach-Object {
                    $pasta = $_.DirectoryName
                    if ($pastas -notcontains $pasta) {
                        $pastas += $pasta
                        Write-Log "Instalacao encontrada (busca profunda): $pasta" "INFO"
                    }
                }
            }
        } catch {
            Write-Log "Erro ao buscar em $($drive.Root): $($_.Exception.Message)" "AVISO"
        }
    }
    
    Write-Log "Total de instalacoes encontradas: $($pastas.Count)" "INFO"
    return $pastas
}

function Find-BancoAlternativo {
    param([string]$CaminhoOriginal)
    
    $pasta = Split-Path $CaminhoOriginal -Parent
    $nomeOriginal = Split-Path $CaminhoOriginal -Leaf
    $nomeBase = [System.IO.Path]::GetFileNameWithoutExtension($nomeOriginal)
    
    if (-not (Test-Path $pasta)) { 
        Write-Log "Pasta do banco nao existe: $pasta" "AVISO"
        return $null 
    }
    
    Write-Log "Procurando banco alternativo para: $nomeOriginal" "INFO"
    
    # Primeiro: tentar versão _temp específica
    $nomeTemp = "${nomeBase}_temp.fdb"
    $caminhoTemp = Join-Path $pasta $nomeTemp
    
    if (Test-Path $caminhoTemp) {
        Write-Log "Encontrada versao _temp do banco: $caminhoTemp" "INFO"
        return $caminhoTemp
    }
    
    # Segundo: procurar qualquer variação com o nome base
    $variacoes = Get-ChildItem -Path $pasta -Filter "*.fdb" -ErrorAction SilentlyContinue | 
                 Where-Object { $_.Name -like "$nomeBase*" } |
                 Select-Object -First 1
    
    if ($variacoes) {
        Write-Log "Encontrada variacao do banco: $($variacoes.FullName)" "INFO"
        return $variacoes.FullName
    }
    
    Write-Log "Nenhum banco alternativo encontrado" "INFO"
    return $null
}

function Get-BancosFirebird {
    param([switch]$ExcluirTemp)
    
    Write-Log "Procurando bancos no Firebird (ExcluirTemp: $ExcluirTemp)" "INFO"
    
    $bancos = @()
    $caminhos = @(
        "C:\Program Files\Firebird\Firebird_5_0\databases.conf",
        "C:\Program Files\Firebird\Firebird_4_0\databases.conf",
        "C:\Program Files\Firebird\Firebird_3_0\databases.conf",
        "C:\Program Files (x86)\Firebird\Firebird_5_0\databases.conf",
        "C:\Program Files (x86)\Firebird\Firebird_4_0\databases.conf",
        "C:\Program Files (x86)\Firebird\Firebird_3_0\databases.conf"
    )
    
    foreach ($conf in $caminhos) {
        if (-not (Test-Path $conf)) { continue }
        
        Write-Log "Lendo arquivo Firebird: $conf" "INFO"
        
        try {
            $linhas = Get-Content $conf -ErrorAction Stop
            $dentroLiveDB = $false
            
            foreach ($linha in $linhas) {
                if ($linha -match "Live\s+Databases") {
                    $dentroLiveDB = $true
                    continue
                }
                
                if (-not $dentroLiveDB) { continue }
                if ($linha -match "^\s*#" -or $linha -match "^\s*$") { continue }
                
                if ($linha -match "^\s*(\S+)\s*=\s*(.+\.fdb)") {
                    $alias = $matches[1].Trim()
                    $caminho = $matches[2].Trim()
                    
                    # Filtrar _temp se solicitado
                    if ($ExcluirTemp -and $caminho -match "_temp\.fdb$") {
                        Write-Log "Banco _temp ignorado (ExcluirTemp ativo): $caminho" "INFO"
                        continue
                    }
                    
                    # Verificar existência
                    $caminhoFinal = $caminho
                    $status = "OK"
                    
                    if (-not (Test-Path $caminho)) {
                        $caminhoAlternativo = Find-BancoAlternativo $caminho
                        if ($caminhoAlternativo) {
                            # Verificar se alternativo também deve ser filtrado
                            if ($ExcluirTemp -and $caminhoAlternativo -match "_temp\.fdb$") {
                                Write-Log "Banco alternativo _temp ignorado: $caminhoAlternativo" "INFO"
                                continue
                            }
                            $caminhoFinal = $caminhoAlternativo
                            $status = "Renomeado"
                        } else {
                            $status = "NaoExiste"
                        }
                    }
                    
                    $bancos += @{
                        Alias = $alias
                        Caminho = $caminhoFinal
                        Status = $status
                        Fonte = "Firebird"
                    }
                    
                    Write-Log "Banco encontrado: $alias -> $caminhoFinal (Status: $status)" "INFO"
                }
            }
            
            # Se encontrou bancos neste arquivo, parar busca
            if ($bancos.Count -gt 0) { 
                Write-Log "Encontrados $($bancos.Count) banco(s) em $conf" "INFO"
                break 
            }
            
        } catch {
            Write-Log "Erro ao ler $conf : $($_.Exception.Message)" "AVISO"
        }
    }
    
    return $bancos
}

function Get-BancosLocaisPadroes {
    param(
        [string]$PastaInstalacao,
        [switch]$ExcluirTemp
    )
    
    Write-Log "Procurando bancos em locais padroes" "INFO"
    
    $bancos = @()
    $locaisComuns = @(
        (Join-Path $PastaInstalacao "dados\dados.fdb"),
        (Join-Path $PastaInstalacao "dados.fdb"),
        (Join-Path $PastaInstalacao "FuturaDados\dados.fdb"),
        (Join-Path $PastaInstalacao "Database\dados.fdb"),
        (Join-Path $PastaInstalacao "DB\dados.fdb")
    )
    
    foreach ($loc in $locaisComuns) {
        if (Test-Path $loc) {
            # Filtrar _temp se solicitado
            if ($ExcluirTemp -and $loc -match "_temp\.fdb$") {
                Write-Log "Banco _temp ignorado em local padrao: $loc" "INFO"
                continue
            }
            
            Write-Log "Banco encontrado em local padrao: $loc" "INFO"
            
            $bancos += @{
                Alias = Split-Path $loc -Leaf
                Caminho = $loc
                Status = "OK"
                Fonte = "Local Padrao"
            }
        }
    }
    
    return $bancos
}

function Get-BancosRecursivo {
    param(
        [string]$PastaInstalacao,
        [switch]$ExcluirTemp
    )
    
    Write-Log "Executando busca recursiva por arquivos .fdb" "INFO"
    
    $bancos = @()
    
    try {
        $encontrados = Get-ChildItem -Path $PastaInstalacao -Filter "*.fdb" -Recurse -ErrorAction SilentlyContinue
        
        foreach ($f in $encontrados) {
            # Filtrar _temp se solicitado
            if ($ExcluirTemp -and $f.Name -match "_temp\.fdb$") {
                Write-Log "Banco _temp ignorado (busca recursiva): $($f.FullName)" "INFO"
                continue
            }
            
            Write-Log "Banco encontrado (busca recursiva): $($f.FullName)" "INFO"
            
            $bancos += @{
                Alias = $f.Name
                Caminho = $f.FullName
                Status = "OK"
                Fonte = "Busca Recursiva"
            }
        }
    } catch {
        Write-Log "Erro na busca recursiva: $($_.Exception.Message)" "AVISO"
    }
    
    return $bancos
}

function Show-BancosEncontrados {
    param([array]$Bancos)
    
    if ($Bancos.Count -eq 0) { return }
    
    Write-Host "  ================================================================" -ForegroundColor Cyan
    Write-Host "  BANCOS ENCONTRADOS:" -ForegroundColor Yellow
    Write-Host "  ================================================================" -ForegroundColor Cyan
    Write-Host ""
    
    foreach ($b in $Bancos) {
        $cor = "Green"
        $prefixo = "[OK]"
        
        if ($b.Status -eq "Renomeado") {
            $cor = "Yellow"
            $prefixo = "[RENOMEADO]"
        } elseif ($b.Status -eq "NaoExiste") {
            $cor = "Red"
            $prefixo = "[NAO EXISTE]"
        }
        
        Write-Host "  $prefixo Alias: $($b.Alias)" -ForegroundColor $cor
        Write-Host "       Caminho: $($b.Caminho)" -ForegroundColor Gray
        Write-Host "       Fonte: $($b.Fonte)" -ForegroundColor Gray
        Write-Host ""
    }
    
    Write-Host "  ================================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Find-BancoDados {
    param(
        [string]$PastaInstalacao,
        [switch]$ExcluirTemp
    )
    
    Write-Host "  Procurando banco de dados..." -ForegroundColor Cyan
    Write-Log "Iniciando busca de banco de dados em: $PastaInstalacao" "INFO"
    
    if ($ExcluirTemp) {
        Write-Log "Modo: Excluindo bancos _temp.fdb" "INFO"
    }
    
    # PASSO 1: Procurar no Firebird
    Write-Host "  * Verificando configuracao do Firebird..." -ForegroundColor Gray
    $bancosFirebird = Get-BancosFirebird -ExcluirTemp:$ExcluirTemp
    
    if ($bancosFirebird.Count -gt 0) {
        Show-BancosEncontrados $bancosFirebird
    } else {
        Write-Host "  * Nenhum banco encontrado no Firebird" -ForegroundColor Yellow
    }
    
    # PASSO 2: Procurar em locais comuns
    if ($bancosFirebird.Count -eq 0) {
        Write-Host "  * Procurando em locais padroes..." -ForegroundColor Gray
        $bancosLocais = Get-BancosLocaisPadroes -PastaInstalacao $PastaInstalacao -ExcluirTemp:$ExcluirTemp
        
        if ($bancosLocais.Count -gt 0) {
            Show-BancosEncontrados $bancosLocais
            $bancosFirebird = $bancosLocais
        }
    }
    
    # PASSO 3: Busca recursiva
    if ($bancosFirebird.Count -eq 0) {
        Write-Host "  * Fazendo busca completa na instalacao..." -ForegroundColor Gray
        $bancosRecursivos = Get-BancosRecursivo -PastaInstalacao $PastaInstalacao -ExcluirTemp:$ExcluirTemp
        
        if ($bancosRecursivos.Count -gt 0) {
            Show-BancosEncontrados $bancosRecursivos
            $bancosFirebird = $bancosRecursivos
        }
    }
    
    # PASSO 4: Selecionar banco
    $bancosValidos = $bancosFirebird | Where-Object { $_.Status -ne "NaoExiste" }
    
    if ($bancosValidos.Count -eq 0) {
        Write-Host "  * Nenhum banco .fdb encontrado!" -ForegroundColor Red
        Write-Log "Nenhum banco de dados foi encontrado automaticamente" "AVISO"
        Write-Host ""
        
        $respManual = Request-Confirmacao "Deseja informar o caminho manualmente?" -PermitirVoltar
        
        if ($respManual -is [string] -and $respManual -eq "VOLTAR") {
            return $null
        }
        
        if ($respManual -eq $true) {
            Write-Host ""
            Write-Host "  Digite o caminho completo do arquivo .fdb:" -ForegroundColor White
            Write-Host "  Exemplo: C:\Dados\FUTURA\dados.fdb" -ForegroundColor Gray
            Write-Host "  (Digite 0 para voltar)" -ForegroundColor Gray
            Write-Host ""
            Write-Host "  Caminho: " -NoNewline -ForegroundColor White
            $caminhoManual = Read-Host
            
            if ($caminhoManual -eq "0") {
                return $null
            }
            
            if (Test-Path $caminhoManual) {
                Write-Host ""
                Write-Host "  [OK] Banco validado!" -ForegroundColor Green
                Write-Log "Banco informado manualmente: $caminhoManual" "INFO"
                return $caminhoManual
            } else {
                Write-Host ""
                Write-Host "  [X] Arquivo nao existe neste caminho!" -ForegroundColor Red
                Write-Log "Caminho manual invalido: $caminhoManual" "ERRO"
                return $null
            }
        } else {
            return $null
        }
    }
    elseif ($bancosValidos.Count -eq 1) {
        $banco = $bancosValidos[0].Caminho
        Write-Host "  Usando banco encontrado automaticamente" -ForegroundColor Green
        Write-Log "Banco selecionado automaticamente: $banco" "INFO"
        Write-Host ""
        return $banco
    }
    else {
        # Multiplos bancos - usar Select-FromList
        $descricoes = @()
        foreach ($b in $bancosValidos) {
            $statusText = ""
            if ($b.Status -eq "Renomeado") {
                $statusText = " [RENOMEADO]"
            }
            $descricoes += "$($b.Alias)$statusText - $($b.Caminho)"
        }
        
        Write-Host "  ================================================================" -ForegroundColor Cyan
        Write-Host "  MULTIPLOS BANCOS ENCONTRADOS:" -ForegroundColor Yellow
        Write-Host "  ================================================================" -ForegroundColor Cyan
        Write-Host ""
        
        $idx = Select-FromList -Titulo "Selecione o banco de dados:" -Itens $descricoes -PermitirVoltar
        
        if ($idx -eq "VOLTAR") {
            return $null
        }
        
        $banco = $bancosValidos[$idx].Caminho
        Write-Host ""
        Write-Host "  [OK] Banco selecionado!" -ForegroundColor Green
        Write-Log "Banco selecionado pelo usuario: $banco" "INFO"
        return $banco
    }
}

# ============================================================================
# FUNCOES PRINCIPAIS
# ============================================================================

function New-Terminal {
    Show-Banner
    Show-Titulo "CRIAR NOVO TERMINAL LOCAL"
    Write-Log "=== INICIANDO CRIACAO DE NOVO TERMINAL ===" "INFO"
    
    Write-Host "  PASSO 1: Definir pasta de instalacao" -ForegroundColor Cyan
    Write-Host ""
    
    $respPasta = Request-Confirmacao "Usar pasta padrao C:\FUTURA?" -PermitirVoltar
    
    if ($respPasta -is [string] -and $respPasta -eq "VOLTAR") {
        Write-Host "  Voltando ao menu principal..." -ForegroundColor Yellow
        Start-Sleep -Seconds 1
        return
    }
    
    if ($respPasta -eq $true) {
        $script:PastaFutura = "C:\FUTURA"
    } else {
        Write-Host "  Nome da nova pasta em C:\: " -NoNewline -ForegroundColor White
        $nome = Read-Host
        
        if ([string]::IsNullOrWhiteSpace($nome)) {
            Show-Erro "Nome Invalido" @("Nome da pasta nao pode ser vazio")
            Write-Log "Nome de pasta vazio fornecido" "ERRO"
            pause
            return
        }
        
        $nome = $nome -replace '[\\/:*?"<>|]', '_'
        $script:PastaFutura = "C:\$nome"
    }
    
    $script:PastaBackup = "$PastaFutura\Backup_Atualizacao"
    $script:ArquivoLog = "$PastaFutura\instalacao_futura.log"
    
    Write-Host ""
    Show-Item "Pasta: $PastaFutura" "sucesso"
    Write-Log "Pasta de instalacao definida: $PastaFutura" "INFO"
    
    # Verificar espaço em disco
    Write-Host ""
    $espacoOk = Test-EspacoDisco -Caminho $PastaFutura -EspacoNecessarioMB $script:EspacoMinimoMB
    
    if (-not $espacoOk) {
        Write-Host "  Operacao cancelada por falta de espaco" -ForegroundColor Yellow
        Write-Log "Criacao cancelada - espaco insuficiente" "AVISO"
        pause
        return
    }
    
    Write-Host ""
    Write-Host "  PASSO 2: Configurar servidor" -ForegroundColor Cyan
    Write-Host "  Endereco do servidor (IP ou nome): " -NoNewline -ForegroundColor White
    Write-Host ""
    Write-Host "  (Digite 0 para voltar): " -NoNewline -ForegroundColor Gray
    $servidor = Read-Host
    
    if ($servidor -eq "0") {
        Write-Host "  Voltando ao menu principal..." -ForegroundColor Yellow
        Start-Sleep -Seconds 1
        return
    }
    
    if (-not (Validate-ServidorInput $servidor)) {
        Show-Erro "Servidor Invalido" @(
            "Endereco do servidor e obrigatorio",
            "Use apenas letras, numeros, pontos e hifens"
        )
        Write-Log "Servidor invalido fornecido: $servidor" "ERRO"
        pause
        return
    }
    
    Write-Host ""
    Show-Item "Servidor: $servidor" "sucesso"
    Write-Log "Servidor definido: $servidor" "INFO"
    Write-Host ""
    
    $respConfirm = Request-Confirmacao "Confirmar criacao do terminal?" -PermitirVoltar
    
    if ($respConfirm -is [string] -and $respConfirm -eq "VOLTAR") {
        Write-Host "  Voltando ao menu principal..." -ForegroundColor Yellow
        Start-Sleep -Seconds 1
        return
    }
    
    if ($respConfirm -eq $false) {
        Write-Host "  Operacao cancelada" -ForegroundColor Yellow
        Write-Log "Criacao de terminal cancelada pelo usuario" "INFO"
        pause
        return
    }
    
    Write-Host ""
    Write-Host "  PASSO 3: Criando pastas..." -ForegroundColor Cyan
    
    try {
        if (-not (Test-Path $PastaFutura)) {
            New-Item -ItemType Directory -Path $PastaFutura -Force | Out-Null
            Show-Item "Pasta criada" "sucesso"
            Write-Log "Pasta criada: $PastaFutura" "INFO"
        } else {
            Show-Item "Pasta ja existe" "info"
            Write-Log "Pasta ja existente: $PastaFutura" "INFO"
        }
        
        if (-not (Test-Path $PastaBackup)) {
            New-Item -ItemType Directory -Path $PastaBackup -Force | Out-Null
            Write-Log "Pasta de backup criada: $PastaBackup" "INFO"
        }
    } catch {
        Show-Erro "Erro ao Criar Pastas" @($_.Exception.Message)
        Write-Log "Erro ao criar pastas: $($_.Exception.Message)" "ERRO"
        pause
        return
    }
    
    Write-Host ""
    Write-Host "  PASSO 4: Testando servidor..." -ForegroundColor Cyan
    
    $acessivel = Test-ServidorAcessivel $servidor
    
    if (-not $acessivel) {
        Show-Erro "Servidor Inacessivel" @(
            "Nao foi possivel conectar a \\$servidor\Futura",
            "Verifique se o servidor esta ligado",
            "Confirme se a pasta Futura esta compartilhada",
            "Verifique se ha firewall bloqueando"
        )
        Write-Log "Servidor inacessivel: $servidor" "ERRO"
        pause
        return
    }
    
    Show-Item "Servidor acessivel" "sucesso"
    Write-Log "Servidor acessivel confirmado" "INFO"
    Write-Host ""
    
    Write-Host "  PASSO 5: Copiando arquivos..." -ForegroundColor Cyan
    
    $caminho = "\\$servidor\Futura"
    $arquivos = @("Futura.ini", "FuturaServer.exe", "PDV.exe")
    $copiados = 0
    
    foreach ($arq in $arquivos) {
        $origem = Join-Path $caminho $arq
        $destino = Join-Path $PastaFutura $arq
        
        if (Test-Path $origem) {
            try {
                Copy-Item -Path $origem -Destination $destino -Force -ErrorAction Stop
                Show-Item "$arq copiado" "sucesso"
                Write-Log "Arquivo copiado: $arq" "INFO"
                $copiados++
            } catch {
                Show-Item "Erro ao copiar $arq : $($_.Exception.Message)" "erro"
                Write-Log "Erro ao copiar $arq : $($_.Exception.Message)" "ERRO"
            }
        } else {
            if ($arq -eq "Futura.ini") {
                # Criar INI básico
                $ini = "[CONFIGURACAO]`r`nDADOS_IP=$servidor"
                try {
                    [System.IO.File]::WriteAllText($destino, $ini, [System.Text.Encoding]::Default)
                    Show-Item "Futura.ini criado" "sucesso"
                    Write-Log "Futura.ini criado com servidor: $servidor" "INFO"
                    $copiados++
                } catch {
                    Show-Item "Erro ao criar Futura.ini" "erro"
                    Write-Log "Erro ao criar Futura.ini: $($_.Exception.Message)" "ERRO"
                }
            } else {
                Show-Item "$arq nao encontrado no servidor" "aviso"
                Write-Log "$arq nao encontrado no servidor" "AVISO"
            }
        }
    }
    
    Write-Host ""
    
    $respDlls = Request-Confirmacao "Baixar DLLs agora?" -PermitirVoltar
    
    if ($respDlls -is [string] -and $respDlls -eq "VOLTAR") {
        Write-Host ""
        Write-Host "  Terminal criado sem DLLs. Execute opcao 2 para baixar depois." -ForegroundColor Yellow
    } elseif ($respDlls -eq $true) {
        Write-Host ""
        Write-Host "  PASSO 6: Baixando DLLs..." -ForegroundColor Cyan
        $dllsOk = Download-Dlls $PastaFutura
        
        if (-not $dllsOk) {
            Write-Host ""
            Write-Host "  [!] Falha ao instalar DLLs" -ForegroundColor Yellow
            Write-Host "  O sistema pode nao funcionar corretamente" -ForegroundColor Yellow
            Write-Host "  Tente executar a opcao 2 (Atualizar Terminal) posteriormente" -ForegroundColor Gray
        }
    }
    
    Show-Sucesso "Terminal Criado" @(
        "Localizacao: $PastaFutura",
        "Servidor: $servidor",
        "Arquivos copiados: $copiados"
    )
    
    Write-Log "=== TERMINAL CRIADO COM SUCESSO ===" "INFO"
    
    pause
}

function Update-Terminal {
    Show-Banner
    Show-Titulo "ATUALIZAR TERMINAL EXISTENTE"
    Write-Log "=== INICIANDO ATUALIZACAO DE TERMINAL ===" "INFO"
    
    $pastas = Find-Instalacoes
    
    if ($pastas.Count -eq 0) {
        Show-Erro "Nenhuma Instalacao" @("Sistema nao encontrado")
        Write-Log "Nenhuma instalacao encontrada" "ERRO"
        pause
        return
    }
    
    if ($pastas.Count -eq 1) {
        $script:PastaFutura = $pastas[0]
        Show-Item "Instalacao: $PastaFutura" "sucesso"
        Write-Log "Instalacao unica encontrada: $PastaFutura" "INFO"
    } else {
        $idx = Select-FromList -Titulo "Multiplas instalacoes encontradas. Selecione:" -Itens $pastas -PermitirVoltar
        
        if ($idx -eq "VOLTAR") {
            Write-Host "  Voltando ao menu principal..." -ForegroundColor Yellow
            Start-Sleep -Seconds 1
            return
        }
        
        $script:PastaFutura = $pastas[$idx]
        Write-Log "Instalacao selecionada: $PastaFutura" "INFO"
    }
    
    $script:PastaBackup = "$PastaFutura\Backup_Atualizacao"
    $script:ArquivoLog = "$PastaFutura\instalacao_futura.log"
    
    # Verificar integridade
    Write-Host ""
    $integro = Test-IntegridadeInstalacao $PastaFutura
    
    if (-not $integro) {
        Write-Host "  Operacao cancelada" -ForegroundColor Yellow
        Write-Log "Atualizacao cancelada - falha na integridade" "AVISO"
        pause
        return
    }
    
    Write-Host ""
    Write-Host "  Atualizando terminal..." -ForegroundColor Cyan
    Write-Host ""
    
    Start-Atualizacao
    
    Write-Log "=== ATUALIZACAO DE TERMINAL CONCLUIDA ===" "INFO"
    
    pause
}

function Start-Atualizacao {
    $ini = Join-Path $PastaFutura "Futura.ini"
    $srv = Get-Servidor $ini
    
    if (-not $srv) {
        Show-Erro "Configuracao Invalida" @(
            "Servidor nao encontrado no arquivo Futura.ini",
            "Verifique se o arquivo existe e contem DADOS_IP"
        )
        return
    }
    
    Write-Host "  Servidor configurado: $srv" -ForegroundColor Cyan
    Write-Host ""
    
    $acessivel = Test-ServidorAcessivel $srv
    
    if (-not $acessivel) {
        Show-Erro "Servidor Inacessivel" @(
            "Nao foi possivel conectar a \\$srv\Futura",
            "Verifique se o servidor esta ligado"
        )
        return
    }
    
    $caminho = "\\$srv\Futura"
    $total = 0
    
    Write-Host "  Copiando executaveis..." -ForegroundColor Cyan
    Write-Host ""
    
    foreach ($exe in $script:ExecutaveisParaBaixar) {
        $o = Join-Path $caminho $exe
        $d = Join-Path $PastaFutura $exe
        
        if (Test-Path $o) {
            try {
                # Criar backup antes de substituir
                if (Test-Path $d) {
                    $backup = "$d.bak"
                    Copy-Item $d $backup -Force -ErrorAction SilentlyContinue
                    Write-Log "Backup criado: $backup" "INFO"
                }
                
                Copy-Item -Path $o -Destination $d -Force -ErrorAction Stop
                Show-Item "$exe atualizado" "sucesso"
                Write-Log "Executavel atualizado: $exe" "INFO"
                $total++
            } catch {
                Show-Item "Erro ao atualizar $exe : $($_.Exception.Message)" "erro"
                Write-Log "Erro ao atualizar $exe : $($_.Exception.Message)" "ERRO"
            }
        } else {
            Show-Item "$exe nao encontrado no servidor" "aviso"
            Write-Log "$exe nao encontrado no servidor" "AVISO"
        }
    }
    
    Write-Host ""
    $respDlls = Request-Confirmacao "Atualizar DLLs?" -PermitirVoltar
    
    if ($respDlls -is [string] -and $respDlls -eq "VOLTAR") {
        Write-Host ""
        Write-Host "  Atualizacao concluida sem baixar DLLs" -ForegroundColor Yellow
    } elseif ($respDlls -eq $true) {
        Write-Host ""
        $dllsOk = Download-Dlls $PastaFutura
        
        if (-not $dllsOk) {
            Write-Host ""
            Write-Host "  [!] Falha ao atualizar DLLs" -ForegroundColor Yellow
            Write-Host "  Tente novamente mais tarde" -ForegroundColor Gray
        }
    }
    
    Show-Sucesso "Atualizacao Concluida" @(
        "Executaveis atualizados: $total",
        "Localizacao: $PastaFutura"
    )
}

function Update-Sistema {
    Show-Banner
    Show-Titulo "ATUALIZACAO COMPLETA DO SISTEMA"
    Write-Log "=== INICIANDO ATUALIZACAO COMPLETA ===" "INFO"
    
    $pastas = Find-Instalacoes
    
    if ($pastas.Count -eq 0) {
        Show-Erro "Sistema Nao Encontrado" @("Nenhuma instalacao detectada")
        Write-Log "Nenhuma instalacao encontrada para atualizacao completa" "ERRO"
        pause
        return
    }
    
    if ($pastas.Count -eq 1) {
        $pasta = $pastas[0]
        Write-Log "Instalacao unica encontrada: $pasta" "INFO"
    } else {
        $idx = Select-FromList -Titulo "Multiplas instalacoes encontradas. Selecione:" -Itens $pastas -PermitirVoltar
        
        if ($idx -eq "VOLTAR") {
            Write-Host "  Voltando ao menu principal..." -ForegroundColor Yellow
            Start-Sleep -Seconds 1
            return
        }
        
        $pasta = $pastas[$idx]
        Write-Log "Instalacao selecionada: $pasta" "INFO"
    }
    
    # Verificar integridade
    Write-Host ""
    $integro = Test-IntegridadeInstalacao $pasta
    
    if (-not $integro) {
        Write-Host "  Operacao cancelada" -ForegroundColor Yellow
        Write-Log "Atualizacao completa cancelada - falha na integridade" "AVISO"
        pause
        return
    }
    
    Write-Host ""
    
    # Buscar banco de dados - MOSTRA TODOS (incluindo _temp)
    $banco = Find-BancoDados $pasta
    
    if (-not $banco) {
        Write-Host ""
        Show-Erro "Banco Nao Encontrado" @(
            "Nao foi possivel localizar o arquivo de banco de dados (.fdb)",
            "Instalacao: $pasta"
        )
        Write-Host "  Sugestoes:" -ForegroundColor Yellow
        Write-Host "  1. Verifique se o Firebird esta instalado" -ForegroundColor Gray
        Write-Host "  2. Confirme se o banco existe na instalacao" -ForegroundColor Gray
        Write-Host "  3. Execute novamente e informe o caminho manualmente" -ForegroundColor Gray
        Write-Host ""
        Write-Log "Banco de dados nao encontrado" "ERRO"
        pause
        return
    }
    
    Write-Host ""
    Write-Host "  Banco selecionado: $banco" -ForegroundColor Green
    Write-Log "Banco de dados selecionado: $banco" "INFO"
    
    # Verificar se banco já está renomeado (_temp.fdb) APÓS seleção
    $bancoJaRenomeado = $false
    $continuarFluxo = $false
    
    while (-not $continuarFluxo) {
        if ($banco -match "_temp\.fdb$") {
            $bancoJaRenomeado = $true
            Write-Host ""
            Write-Host "  ================================================================" -ForegroundColor Yellow
            Write-Host "  ATENCAO: Banco ja esta renomeado!" -ForegroundColor Yellow
            Write-Host "  ================================================================" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "  O banco selecionado ja termina com '_temp.fdb':" -ForegroundColor Yellow
            Write-Host "  $banco" -ForegroundColor Gray
            Write-Host ""
            Write-Host "  Isso indica que pode ter havido uma atualizacao anterior." -ForegroundColor Yellow
            Write-Host ""
            Write-Host "  Opcoes:" -ForegroundColor White
            Write-Host "  [1] Pular etapa de renomear (usar como esta)" -ForegroundColor Green
            Write-Host "  [2] Renomear mesmo assim (adicionar outro _temp)" -ForegroundColor Yellow
            Write-Host "  [0] Voltar e selecionar outro banco" -ForegroundColor Red
            Write-Host ""
            Write-Host "  Escolha (0-2): " -NoNewline -ForegroundColor White
            
            $opcaoBanco = Read-Host
            
            if ($opcaoBanco -eq "0") {
                Write-Host ""
                Write-Host "  Voltando para selecionar outro banco..." -ForegroundColor Yellow
                Write-Log "Usuario optou por voltar e selecionar outro banco" "INFO"
                
                # Buscar novamente SEM filtro (mostra todos)
                $novoBanco = Find-BancoDados $pasta
                
                # Se retornou $null, usuário cancelou
                if (-not $novoBanco) {
                    Write-Host ""
                    Write-Host "  Operacao cancelada" -ForegroundColor Yellow
                    Write-Log "Selecao de banco cancelada" "INFO"
                    pause
                    return
                }
                
                Write-Host ""
                Write-Host "  Novo banco selecionado: $novoBanco" -ForegroundColor Green
                Write-Log "Novo banco selecionado: $novoBanco" "INFO"
                
                # Atualizar variável principal e continuar o loop
                $banco = $novoBanco
                # Loop continua para verificar se o novo banco também é _temp
                
            }
            elseif ($opcaoBanco -eq "1") {
                Write-Host ""
                Write-Host "  Pulando etapa de renomear banco..." -ForegroundColor Green
                Write-Log "Usuario optou por pular renomeacao (banco ja _temp)" "INFO"
                $bancoJaRenomeado = $true
                $continuarFluxo = $true
            }
            elseif ($opcaoBanco -eq "2") {
                Write-Host ""
                Write-Host "  Renomeando banco mesmo ja sendo _temp..." -ForegroundColor Yellow
                Write-Log "Usuario optou por renomear banco _temp novamente" "AVISO"
                $bancoJaRenomeado = $false
                $continuarFluxo = $true
            }
            else {
                Write-Host ""
                Write-Host "  Opcao invalida! Pulando renomeacao..." -ForegroundColor Yellow
                Write-Log "Opcao invalida, pulando renomeacao" "AVISO"
                $bancoJaRenomeado = $true
                $continuarFluxo = $true
            }
        } else {
            # Banco não é _temp, continua fluxo normal
            $bancoJaRenomeado = $false
            $continuarFluxo = $true
        }
    }
    
    Write-Host ""
    
    # Só pede confirmação se vai REALMENTE renomear o banco
    if (-not $bancoJaRenomeado) {
        $respConfirm = Request-Confirmacao "Renomear banco e continuar com a atualizacao?" -PermitirVoltar
        
        if ($respConfirm -is [string] -and $respConfirm -eq "VOLTAR") {
            Write-Host "  Voltando ao menu principal..." -ForegroundColor Yellow
            Start-Sleep -Seconds 1
            return
        }
        
        if ($respConfirm -eq $false) {
            Write-Host "  Operacao cancelada pelo usuario" -ForegroundColor Yellow
            Write-Log "Atualizacao cancelada pelo usuario" "INFO"
            pause
            return
        }
    } else {
        # Banco já renomeado, usuário escolheu pular renomeação
        Write-Host "  Continuando com atualizacao (banco ja renomeado)..." -ForegroundColor Green
        Write-Log "Continuando atualizacao - banco ja esta renomeado" "INFO"
    }
    
    # Verificar permissoes de admin
    $isAdmin = Test-IsAdmin
    Write-Log "Executando como administrador: $isAdmin" "INFO"
    
    $servicosParados = @()
    
    try {
        # Parar servicos do Firebird APENAS se for renomear
        if (-not $bancoJaRenomeado) {
            $servicosParados = Stop-FirebirdServices $isAdmin
            
            # Renomear banco
            Write-Host ""
            Write-Host "  Renomeando banco de dados..." -ForegroundColor Cyan
            Write-Log "Tentando renomear banco: $banco" "INFO"
            
            $temp = $banco -replace "\.fdb$", "_temp.fdb"
            
            try {
                if (Test-Path $temp) { 
                    Write-Log "Removendo arquivo temporario anterior: $temp" "INFO"
                    Remove-Item $temp -Force -ErrorAction Stop
                }
                
                Rename-Item -Path $banco -NewName (Split-Path $temp -Leaf) -ErrorAction Stop
                Show-Item "Banco renomeado com sucesso" "sucesso"
                Write-Log "Banco renomeado: $banco -> $temp" "INFO"
                
            } catch {
                # Erro ao renomear - restaurar servicos
                Write-Host ""
                Show-Erro "Erro ao Renomear Banco" @(
                    $_.Exception.Message,
                    "Possivel causa: arquivo ainda em uso",
                    "Tentando restaurar servicos..."
                )
                Write-Log "Erro ao renomear banco: $($_.Exception.Message)" "ERRO"
                
                Restore-FirebirdServices $servicosParados $isAdmin
                
                pause
                return
            }
            
            # Reiniciar Firebird logo após renomear o banco
            Write-Host ""
            Write-Host "  Banco renomeado com sucesso!" -ForegroundColor Green
            Write-Host "  Reiniciando Firebird para liberar o banco..." -ForegroundColor Cyan
            Restore-FirebirdServices $servicosParados $isAdmin
            
            Write-Host ""
            Write-Host "  Firebird reiniciado e pronto para uso." -ForegroundColor Green
            Write-Log "Firebird reiniciado apos renomear banco" "INFO"
            
        } else {
            # Banco já renomeado - NÃO para Firebird
            Write-Host ""
            Write-Host "  Banco ja esta renomeado (_temp.fdb)" -ForegroundColor Green
            Write-Host "  Firebird permanece em execucao." -ForegroundColor Green
            Write-Log "Banco ja renomeado - Firebird nao foi parado" "INFO"
        }
        
        # Preparar atualizador
        Write-Host ""
        Write-Host "  Preparando atualizador..." -ForegroundColor Cyan
        Write-Log "Preparando pasta do atualizador" "INFO"
        
        $atDir = Join-Path $pasta "Atualizador"
        if (Test-Path $atDir) { 
            Write-Log "Removendo pasta de atualizador anterior" "INFO"
            Remove-Item $atDir -Recurse -Force -ErrorAction SilentlyContinue
        }
        
        New-Item -ItemType Directory -Path $atDir -Force | Out-Null
        Write-Log "Pasta de atualizador criada: $atDir" "INFO"
        
        Write-Host ""
        Write-Host "  Baixando atualizador..." -ForegroundColor Cyan
        
        $exe = Join-Path $atDir "Atualizador.exe"
        
        $downloadOk = Download-ArquivoComRetry -Url $script:UrlAtualizador -Destino $exe -Descricao "Baixando Atualizador" -MaxTentativas $script:MaxTentativasDownload
        
        if (-not $downloadOk) {
            Show-Erro "Erro no Download" @("Nao foi possivel baixar o atualizador")
            Write-Log "Falha ao baixar atualizador" "ERRO"
            
            pause
            return
        }
        
        Write-Host ""
        Write-Host "  Baixando DLLs para o atualizador..." -ForegroundColor Cyan
        $dllsOk = Download-Dlls $atDir
        
        if (-not $dllsOk) {
            Write-Host ""
            Write-Host "  [!] Aviso: Falha ao baixar DLLs" -ForegroundColor Yellow
            Write-Host "  O atualizador pode nao funcionar corretamente" -ForegroundColor Yellow
            Write-Log "Falha ao baixar DLLs para atualizador" "AVISO"
        }
        
        # Criar arquivo PESQUISA.INI com configurações
        Write-Host ""
        Write-Host "  Configurando atualizador..." -ForegroundColor Cyan
        
        # Descobrir caminho do Firebird através do databases.conf ou usar padrão
        $pastaFirebird = $null
        $caminhosPossiveisConf = @(
            "C:\Program Files\Firebird\Firebird_5_0\databases.conf",
            "C:\Program Files\Firebird\Firebird_4_0\databases.conf",
            "C:\Program Files\Firebird\Firebird_3_0\databases.conf",
            "C:\Program Files (x86)\Firebird\Firebird_5_0\databases.conf",
            "C:\Program Files (x86)\Firebird\Firebird_4_0\databases.conf",
            "C:\Program Files (x86)\Firebird\Firebird_3_0\databases.conf"
        )
        
        foreach ($conf in $caminhosPossiveisConf) {
            if (Test-Path $conf) {
                $pastaFirebird = Split-Path $conf -Parent
                Write-Log "Caminho do Firebird detectado: $pastaFirebird" "INFO"
                break
            }
        }
        
        $pesquisaOk = Create-PesquisaINI -PastaInstalacao $pasta -PastaFirebird $pastaFirebird -CaminhoBanco $banco
        
        if (-not $pesquisaOk) {
            Write-Host ""
            Write-Host "  [!] Aviso: Falha ao criar PESQUISA.INI" -ForegroundColor Yellow
            Write-Host "  Voce tera que configurar o atualizador manualmente" -ForegroundColor Yellow
            Write-Log "Falha ao criar PESQUISA.INI" "AVISO"
        }
        
        Show-Sucesso "Preparacao Concluida" @(
            "Banco preparado e renomeado",
            "Atualizador pronto em: $atDir",
            "Servicos do Firebird restaurados",
            "Executando atualizador automaticamente..."
        )
        
        Write-Log "=== PREPARACAO PARA ATUALIZACAO CONCLUIDA ===" "INFO"
        
        # Executar atualizador automaticamente
        Write-Host ""
        Write-Host "  Iniciando atualizador em 3 segundos..." -ForegroundColor Cyan
        Start-Sleep -Seconds 3
        
        try {
            Start-Process -FilePath $exe -WorkingDirectory $atDir
            Show-Item "Atualizador iniciado com sucesso" "sucesso"
            Write-Log "Atualizador executado: $exe" "INFO"
            
            Write-Host ""
            Write-Host "  O atualizador foi aberto em uma nova janela." -ForegroundColor Green
            Write-Host "  Siga as instrucoes na tela do atualizador." -ForegroundColor Yellow
            Write-Host ""
            
        } catch {
            Show-Item "Erro ao executar atualizador: $($_.Exception.Message)" "erro"
            Write-Log "Erro ao executar atualizador: $($_.Exception.Message)" "ERRO"
            Write-Host ""
            Write-Host "  Tente executar manualmente:" -ForegroundColor Yellow
            Write-Host "  $exe" -ForegroundColor Gray
        }
        
    } catch {
        # Erro geral - tentar restaurar servicos
        Write-Host ""
        Show-Erro "Erro na Atualizacao" @($_.Exception.Message)
        Write-Log "Erro geral na atualizacao: $($_.Exception.Message)" "ERRO"
        
        if ($servicosParados.Count -gt 0) {
            Write-Host ""
            Write-Host "  Tentando restaurar servicos..." -ForegroundColor Yellow
            Restore-FirebirdServices $servicosParados $isAdmin
        }
    }
    
    Write-Host ""
    pause
}

# ============================================================================
# MENU PRINCIPAL
# ============================================================================

function Start-Menu {
    while ($true) {
        $op = Show-Menu
        
        switch ($op) {
            "1" { 
                try {
                    New-Terminal 
                } catch {
                    Write-Host ""
                    Show-Erro "Erro Inesperado" @($_.Exception.Message)
                    Write-Log "Erro em New-Terminal: $($_.Exception.Message)" "ERRO"
                    Write-Log "Stack Trace: $($_.ScriptStackTrace)" "ERRO"
                    pause
                }
            }
            "2" { 
                try {
                    Update-Terminal 
                } catch {
                    Write-Host ""
                    Show-Erro "Erro Inesperado" @($_.Exception.Message)
                    Write-Log "Erro em Update-Terminal: $($_.Exception.Message)" "ERRO"
                    Write-Log "Stack Trace: $($_.ScriptStackTrace)" "ERRO"
                    pause
                }
            }
            "3" { 
                try {
                    Update-Sistema 
                } catch {
                    Write-Host ""
                    Show-Erro "Erro Inesperado" @($_.Exception.Message)
                    Write-Log "Erro em Update-Sistema: $($_.Exception.Message)" "ERRO"
                    Write-Log "Stack Trace: $($_.ScriptStackTrace)" "ERRO"
                    pause
                }
            }
            "0" {
                Write-Host ""
                Write-Host "  Encerrando sistema..." -ForegroundColor Yellow
                Write-Log "=== SISTEMA ENCERRADO PELO USUARIO ===" "INFO"
                Start-Sleep -Seconds 1
                return
            }
            default {
                Write-Host ""
                Write-Host "  Opcao invalida! Escolha 0, 1, 2 ou 3" -ForegroundColor Red
                Write-Log "Opcao de menu invalida: $op" "AVISO"
                Start-Sleep -Seconds 2
            }
        }
    }
}

# ============================================================================
# INICIALIZACAO
# ============================================================================

# Exibir informacoes do sistema
$osVersion = [System.Environment]::OSVersion.Version
Write-Host ""
Write-Host "  ================================================================" -ForegroundColor Cyan
Write-Host "  Sistema detectado: Windows $($osVersion.Major).$($osVersion.Minor)" -ForegroundColor Cyan
Write-Host "  PowerShell: $($PSVersionTable.PSVersion)" -ForegroundColor Cyan
Write-Host "  Versao do Script: $script:VersaoScript" -ForegroundColor Cyan
Write-Host "  Executando como Admin: $(Test-IsAdmin)" -ForegroundColor Cyan
Write-Host "  ================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Log "=== SISTEMA INICIADO ===" "INFO"
Write-Log "Windows: $($osVersion.Major).$($osVersion.Minor)" "INFO"
Write-Log "PowerShell: $($PSVersionTable.PSVersion)" "INFO"
Write-Log "Usuario: $env:USERNAME" "INFO"
Write-Log "Executando como Admin: $(Test-IsAdmin)" "INFO"

Start-Sleep -Seconds 2

try {
    Start-Menu
} catch {
    Write-Host ""
    Write-Host "  ================================================================" -ForegroundColor Red
    Write-Host "  ERRO CRITICO NO SISTEMA" -ForegroundColor Red
    Write-Host "  ================================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Mensagem: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Detalhes tecnicos:" -ForegroundColor Gray
    Write-Host "  $($_.Exception.GetType().FullName)" -ForegroundColor Gray
    Write-Host ""
    
    Write-Log "ERRO CRITICO: $($_.Exception.Message)" "ERRO"
    Write-Log "Tipo: $($_.Exception.GetType().FullName)" "ERRO"
    Write-Log "Stack Trace: $($_.ScriptStackTrace)" "ERRO"
    
    pause
    exit 1
}

Write-Host ""
Write-Host "  Sistema encerrado normalmente." -ForegroundColor Green
Write-Host ""
exit 0
