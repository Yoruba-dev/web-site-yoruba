# Instalador del agente de etiquetas de Pedro Yoruba Jewelry
# ------------------------------------------------------------------
# Uso (PowerShell normal, NO hace falta administrador):
#   powershell -ExecutionPolicy Bypass -File instalar.ps1
# o, sin bajar nada a mano (la primera parte activa TLS 1.2, que Netlify exige
# y que algunos Windows no traen encendido):
#   [Net.ServicePointManager]::SecurityProtocol = 'Tls12'; irm https://pedroyorubajewelry.netlify.app/herramientas/etiquetas/instalar.ps1 | iex
#
# Que hace:
#   1. Pide la clave del agente y te deja elegir la impresora termica.
#   2. Comprueba que esten SumatraPDF (imprime sin ventanas) y Chrome.
#   3. Copia el agente a %LOCALAPPDATA%\PYJ-Etiquetas y guarda la config.
#   4. Lo deja arrancando solo cada vez que inicias sesion (Programador de tareas).
#   5. Crea en el escritorio "Shopify - Imprimir etiquetas": un Chrome aparte
#      que imprime sin preguntar. Entra a Shopify ahi UNA vez.

$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$SERVIDOR = 'https://pedroyorubajewelry.netlify.app'
$base = Join-Path $env:LOCALAPPDATA 'PYJ-Etiquetas'
New-Item -ItemType Directory -Force -Path $base | Out-Null

Write-Host ''
Write-Host '=== Agente de etiquetas PYJ ===' -ForegroundColor Yellow

# --- SumatraPDF -------------------------------------------------------------
$sumatra = @(
  "$env:ProgramFiles\SumatraPDF\SumatraPDF.exe",
  "${env:ProgramFiles(x86)}\SumatraPDF\SumatraPDF.exe",
  "$env:LOCALAPPDATA\SumatraPDF\SumatraPDF.exe"
) | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1
if (-not $sumatra) {
  Write-Host ''
  Write-Host 'Falta SumatraPDF (gratis, imprime PDFs sin abrir ventanas).' -ForegroundColor Red
  Write-Host 'Bajalo de la pagina oficial, instalalo y vuelve a correr este instalador:'
  Write-Host '  https://www.sumatrapdfreader.org/download-free-pdf-viewer'
  Start-Process 'https://www.sumatrapdfreader.org/download-free-pdf-viewer'
  return
}

# --- Chrome -----------------------------------------------------------------
$chrome = @(
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
  "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
) | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1
if (-not $chrome) {
  Write-Host 'Falta Google Chrome. Instalalo y vuelve a correr este instalador.' -ForegroundColor Red
  return
}

# --- Impresora --------------------------------------------------------------
$impresoras = @(Get-Printer | Select-Object -ExpandProperty Name)
if (-not $impresoras) { Write-Host 'No hay impresoras instaladas.' -ForegroundColor Red; return }
Write-Host ''
Write-Host 'Impresoras en esta PC:'
for ($i = 0; $i -lt $impresoras.Count; $i++) { Write-Host ("  {0}. {1}" -f ($i + 1), $impresoras[$i]) }
do {
  $n = Read-Host 'Numero de la impresora TERMICA 4x6'
} until ($n -match '^\d+$' -and [int]$n -ge 1 -and [int]$n -le $impresoras.Count)
$impresora = $impresoras[[int]$n - 1]

# --- Clave ------------------------------------------------------------------
Write-Host ''
$token = (Read-Host 'Clave del agente (te la da quien monto el sistema)').Trim()
if ($token.Length -lt 20) { Write-Host 'Esa clave es demasiado corta.' -ForegroundColor Red; return }

# Probar la clave antes de guardar nada.
try {
  Invoke-RestMethod -Uri "$SERVIDOR/api/etiquetas/trabajos" -Headers @{ Authorization = "Bearer $token"; 'X-Agente-Impresora' = $impresora; 'X-Agente-Version' = 'instalador' } -TimeoutSec 45 | Out-Null
  Write-Host 'Clave correcta: la web responde.' -ForegroundColor Green
} catch {
  Write-Host "La web no acepto la clave: $($_.Exception.Message)" -ForegroundColor Red
  return
}

# --- Archivos ---------------------------------------------------------------
$perfil = Join-Path $base 'chrome-imprimir'
@{
  servidor          = $SERVIDOR
  token             = $token
  impresora         = $impresora
  sumatra           = $sumatra
  chrome            = $chrome
  perfilChrome      = $perfil
  intervaloSegundos = 30
} | ConvertTo-Json | Set-Content -Path (Join-Path $base 'config.json') -Encoding UTF8

$agente = Join-Path $base 'agente.ps1'
Invoke-WebRequest -Uri "$SERVIDOR/herramientas/etiquetas/agente.ps1" -OutFile $agente -UseBasicParsing

# --- Arranque automatico ----------------------------------------------------
# Si ya habia un agente (reinstalacion), se para antes: si no, seguiria
# corriendo con la clave o la impresora de antes.
Stop-ScheduledTask -TaskName 'PYJ Etiquetas' -ErrorAction SilentlyContinue
Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" -ErrorAction SilentlyContinue |
  Where-Object { $_.CommandLine -like '*PYJ-Etiquetas*agente.ps1*' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

# Un lanzador .vbs: es la forma fiable de arrancar PowerShell SIN ventana en
# Windows 10 y 11 (en Windows 11, -WindowStyle Hidden deja ver la consola).
$lanzador = Join-Path $base 'arrancar.vbs'
@"
CreateObject("WScript.Shell").Run "powershell.exe -NoProfile -ExecutionPolicy Bypass -File ""$agente""", 0, False
"@ | Set-Content -Path $lanzador -Encoding Unicode

$accion = New-ScheduledTaskAction -Execute 'wscript.exe' -Argument "`"$lanzador`""
# Al iniciar sesion y, ademas, cada 5 minutos: si el agente se cerro, vuelve.
# Si ya esta corriendo, el nuevo sale solo (el agente lleva un candado).
$usuario = [Security.Principal.WindowsIdentity]::GetCurrent().Name
$alEntrar = New-ScheduledTaskTrigger -AtLogOn -User $usuario
$cada5 = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 5)
$ajustes = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
  -StartWhenAvailable -ExecutionTimeLimit ([TimeSpan]::Zero) -MultipleInstances IgnoreNew
Register-ScheduledTask -TaskName 'PYJ Etiquetas' -Action $accion -Trigger @($alEntrar, $cada5) `
  -Settings $ajustes -Description 'Imprime las etiquetas de envio de la tienda' -Force | Out-Null

# --- Acceso directo al Chrome que imprime sin ventana -----------------------
$escritorio = [Environment]::GetFolderPath('Desktop')
$ws = New-Object -ComObject WScript.Shell
$atajo = $ws.CreateShortcut((Join-Path $escritorio 'Shopify - Imprimir etiquetas.lnk'))
$atajo.TargetPath = $chrome
$atajo.Arguments = "--user-data-dir=`"$perfil`" --kiosk-printing https://admin.shopify.com/store/pedroyorubajewelry/shipping_labels"
$atajo.Save()

# --- Que la PC no se duerma enchufada ---------------------------------------
$r = Read-Host 'Evitar que esta PC se suspenda mientras esta enchufada? (S/N)'
if ($r -match '^[sS]') { powercfg /change standby-timeout-ac 0; Write-Host 'Listo: no se suspendera enchufada.' }

$marca = Get-Date
Start-ScheduledTask -TaskName 'PYJ Etiquetas'
Write-Host 'Arrancando el agente...'
$arranco = $false
for ($i = 0; $i -lt 20 -and -not $arranco; $i++) {
  Start-Sleep -Seconds 1
  $log = Join-Path $base 'agente.log'
  if ((Test-Path $log) -and ((Get-Item $log).LastWriteTime -ge $marca) -and
      (Select-String -Path $log -Pattern 'iniciado' -SimpleMatch -Quiet)) { $arranco = $true }
}
Write-Host ''
if (-not $arranco) {
  Write-Host 'El agente NO arranco. Prueba a correrlo a mano para ver el error:' -ForegroundColor Red
  Write-Host "  powershell -ExecutionPolicy Bypass -File `"$agente`""
  return
}
Write-Host 'Instalado y funcionando.' -ForegroundColor Green
Write-Host 'Ultimo paso: abre "Shopify - Imprimir etiquetas" en el escritorio, entra a tu Shopify,'
Write-Host 'y en Windows pon la impresora termica como PREDETERMINADA.'
Write-Host "Registro del agente: $base\agente.log"
