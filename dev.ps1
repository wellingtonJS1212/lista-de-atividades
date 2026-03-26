# =============================================================================
# dev.ps1 — Script de desenvolvimento e release
# Lista de Atividades — com.listaatividades.app
# =============================================================================
#
# SOBRE O APP
# -----------
# Aplicativo Android de lista de tarefas com lembretes visuais e contagem
# regressiva. Construído com Capacitor 7 + HTML/CSS/JS puro.
# Sem framework frontend, sem backend obrigatório.
#
# Pacote:    com.listaatividades.app
# Repo:      github.com/wellingtonJS1212/lista-de-atividades
# Download:  https://wellingtonjs1212.github.io/lista-de-atividades/download.html
#
# FUNCIONALIDADES PRINCIPAIS
# --------------------------
# - Cadastro de tarefas com tempo de lembrete (horas + minutos)
# - Contagem regressiva em tempo real por tarefa
# - Notificações nativas no momento exato em que a tarefa vence
# - Som personalizado para lembretes (seletor de sons do sistema)
# - Histórico de tarefas finalizadas, excluídas e não concluídas no tempo
# - Gráfico de desempenho dos últimos 7, 15 ou 30 dias
# - Relatório em PDF salvo direto na pasta Downloads do celular
# - Toast de confirmação após salvar PDF com botão Abrir Downloads
# - Autenticação local por nome + senha (dados salvos no dispositivo)
# - Modal de atualização automático quando uma nova versão é publicada
# - Animação suave na troca entre abas Tarefas e Histórico
#
# ARQUITETURA
# -----------
# index.html          — estrutura principal do app
# style.css           — estilos e animações
# scripts.js          — toda a lógica do app (APP_VERSION aqui)
# native-sound-picker.js — ponte JS para o plugin nativo de som
# backend-config.js   — configuração do Supabase (opcional)
# remote-api.js       — sincronização remota de tarefas (opcional)
# update.json         — versão publicada, lida pelo app para checar updates
# download.html       — página pública de download do APK
#
# PLUGIN NATIVO (Java)
# --------------------
# android/app/src/main/java/com/listaatividades/app/SystemSoundPickerPlugin.java
#   - pickSystemSound    → abre seletor de sons do Android
#   - playSystemSound    → reproduz som do sistema por URI
#   - savePdfToDownloads → salva PDF em Downloads via MediaStore (Android 10+)
#   - openDownloadsFolder → abre gerenciador de arquivos em Downloads
#
# FLUXO DE BUILD
# --------------
# 1. prepare:web   — copia arquivos para www/
# 2. cap sync      — copia www/ para android/app/src/main/assets/public/
# 3. normalize-assets — copia arquivos críticos direto (evita trava do OneDrive)
# 4. gradlew assembleRelease — gera app-release.apk
# 5. apksigner     — assina com lista-de-atividades-release.jks
# 6. adb install   — instala no dispositivo
#
# KEYSTORE
# --------
# Arquivo:  android/app/release/lista-de-atividades-release.jks
# Alias:    osapostoloseram
# Config:   android/keystore.properties
#
# ATENÇÃO — PROBLEMA CONHECIDO
# -----------------------------
# O OneDrive pode travar arquivos abertos no VS Code durante o cap sync,
# fazendo com que index.html e outros sejam ignorados silenciosamente.
# O passo normalize-assets corrige isso copiando diretamente os arquivos críticos.
# SEMPRE feche os arquivos no editor antes de fazer o build, ou use este script
# que normaliza os assets automaticamente.
#
# HISTÓRICO DE VERSÕES
# --------------------
# 1.0.5 (2025-03)  PDF salvo em Downloads, toast de confirmação, animações de aba,
#                  botões do topbar redesenhados, filtros do gráfico lado a lado
# 1.0.4            Notificações nativas em segundo plano, seletores 24h, sons do sistema
# 1.0.2            Release final da primeira versão estável
# 1.0.0            Primeira versão do app
#
# CHECKLIST PARA NOVA VERSÃO
# --------------------------
# [ ] Alterar APP_VERSION em scripts.js
# [ ] Alterar "version" em package.json
# [ ] Alterar "version" e "download_url" em update.json
# [ ] Atualizar "Novidades" em download.html
# [ ] Atualizar GITHUB_RELEASE_NOTES.md
# [ ] Rodar este script (opção 3 — build completo)
# [ ] Criar release no GitHub com tag vX.X.X e anexar o APK assinado
# [ ] Fazer push do update.json para o GitHub Pages (git push)
# =============================================================================

param(
    [ValidateSet("install", "build", "release", "devices", "log")]
    [string]$Acao = ""
)

$ADB       = "C:\Users\welli\AppData\Local\Android\Sdk\platform-tools\adb.exe"
$APKSIGNER = "C:\Users\welli\AppData\Local\Android\Sdk\build-tools\36.0.0\apksigner.bat"
$KEYSTORE  = "$PSScriptRoot\android\app\release\lista-de-atividades-release.jks"
$APK_RAW   = "C:\gradle-builds\lista-de-atividades\app\outputs\apk\release\app-release.apk"
$APK_SIGNED = "C:\gradle-builds\lista-de-atividades\app\outputs\apk\release\app-release-signed.apk"

function Mostrar-Menu {
    Write-Host ""
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host "  Lista de Atividades — Dev Script" -ForegroundColor Cyan
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host ""

    # Versão atual
    $ver = (Get-Content "$PSScriptRoot\package.json" | ConvertFrom-Json).version
    Write-Host "  Versao atual: $ver" -ForegroundColor Yellow
    Write-Host ""

    # Dispositivos conectados
    $devs = & $ADB devices 2>&1 | Select-String "device$"
    Write-Host "  Dispositivos ADB:" -ForegroundColor Gray
    if ($devs) {
        $devs | ForEach-Object { Write-Host "    $_" -ForegroundColor Green }
    } else {
        Write-Host "    Nenhum dispositivo conectado" -ForegroundColor Red
    }
    Write-Host ""

    Write-Host "  Escolha uma opcao:" -ForegroundColor White
    Write-Host "  [1] Instalar APK assinado no(s) dispositivo(s)" -ForegroundColor White
    Write-Host "  [2] Build rapido (sync + normalize, sem assinar)" -ForegroundColor White
    Write-Host "  [3] Build completo + assinar + instalar" -ForegroundColor White
    Write-Host "  [4] Ver dispositivos ADB" -ForegroundColor White
    Write-Host "  [5] Ver log do app (logcat filtrado)" -ForegroundColor White
    Write-Host "  [0] Sair" -ForegroundColor Gray
    Write-Host ""
}

function Instalar-APK {
    if (-not (Test-Path $APK_SIGNED)) {
        Write-Host "APK assinado nao encontrado. Rode a opcao 3 primeiro." -ForegroundColor Red
        return
    }
    $devs = & $ADB devices 2>&1 | Select-String "device$" | ForEach-Object { ($_ -split "\s+")[0] }
    if (-not $devs) {
        Write-Host "Nenhum dispositivo conectado." -ForegroundColor Red
        return
    }
    foreach ($dev in $devs) {
        Write-Host "Instalando em $dev..." -ForegroundColor Cyan
        & $ADB -s $dev install -r $APK_SIGNED
    }
}

function Build-Rapido {
    Write-Host "Sincronizando assets..." -ForegroundColor Cyan
    Set-Location $PSScriptRoot
    npm run cap:sync:android
    npm run android:normalize-assets
    Write-Host "Build rapido concluido." -ForegroundColor Green
}

function Build-Completo {
    Write-Host "Iniciando build completo..." -ForegroundColor Cyan
    Set-Location $PSScriptRoot
    npm run release:apk
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Build falhou." -ForegroundColor Red
        return
    }
    Write-Host "Assinando APK..." -ForegroundColor Cyan
    & $APKSIGNER sign --ks $KEYSTORE --ks-pass pass:143727 --key-pass pass:143727 --ks-key-alias osapostoloseram --out $APK_SIGNED $APK_RAW
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Assinatura falhou." -ForegroundColor Red
        return
    }
    $tamanho = [math]::Round((Get-Item $APK_SIGNED).Length / 1MB, 2)
    Write-Host "APK assinado: $APK_SIGNED ($tamanho MB)" -ForegroundColor Green
    Instalar-APK
}

function Ver-Dispositivos {
    & $ADB devices
}

function Ver-Log {
    $devs = & $ADB devices 2>&1 | Select-String "device$" | ForEach-Object { ($_ -split "\s+")[0] }
    if (-not $devs) { Write-Host "Nenhum dispositivo conectado." -ForegroundColor Red; return }
    $dev = $devs | Select-Object -First 1
    Write-Host "Logcat de $dev (Ctrl+C para parar)..." -ForegroundColor Cyan
    & $ADB -s $dev logcat -s "Capacitor" "chromium" "SystemWebViewClient" 2>&1
}

# Se passou parametro direto, executa sem menu
switch ($Acao) {
    "install" { Instalar-APK; exit }
    "build"   { Build-Rapido; exit }
    "release" { Build-Completo; exit }
    "devices" { Ver-Dispositivos; exit }
    "log"     { Ver-Log; exit }
}

# Menu interativo
do {
    Mostrar-Menu
    $opcao = Read-Host "  Opcao"
    switch ($opcao) {
        "1" { Instalar-APK }
        "2" { Build-Rapido }
        "3" { Build-Completo }
        "4" { Ver-Dispositivos }
        "5" { Ver-Log }
        "0" { break }
        default { Write-Host "Opcao invalida." -ForegroundColor Red }
    }
} while ($opcao -ne "0")
