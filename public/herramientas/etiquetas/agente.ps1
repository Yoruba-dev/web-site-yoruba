# Agente de etiquetas de Pedro Yoruba Jewelry
# ------------------------------------------------------------------
# Corre escondido en la PC de la impresora. Cada 30 segundos pregunta a la
# web si hay algo que hacer:
#   pdf    -> imprime la etiqueta USPS en la impresora termica, sin preguntar.
#   abrir  -> avisa en la esquina de la pantalla y abre el pedido en Chrome
#             (perfil "PYJ Imprimir", que imprime sin ventana): un clic en
#             "Imprimir etiqueta" y sale.
#   aviso  -> solo el mensaje.
# No guarda nada de clientas: el PDF se borra al imprimirse.
# Compatible con Windows PowerShell 5.1 (el que trae Windows 10/11).

$ErrorActionPreference = 'Stop'
$VERSION = '1.1.0'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$base = Join-Path $env:LOCALAPPDATA 'PYJ-Etiquetas'
$cfg = Get-Content (Join-Path $base 'config.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$registro = Join-Path $base 'agente.log'
$hechos = Join-Path $base 'hechos.txt'
if (-not (Test-Path $hechos)) { New-Item -ItemType File -Path $hechos | Out-Null }

# Una sola copia: dos agentes a la vez imprimirian cada etiqueta dos veces.
# (El Programador de tareas lo relanza cada 5 min; si ya hay uno, este sale.)
$mutex = New-Object System.Threading.Mutex($false, 'Local\PYJ-Etiquetas-Agente')
if (-not $mutex.WaitOne(0)) { exit 0 }

# Nada de lo que sigue puede tumbar el bucle: anotar, avisar y abrir el
# pedido son ayudas; si fallan, se sigue.
function Anotar($texto) {
  try {
    if ((Test-Path $registro) -and ((Get-Item $registro).Length -gt 1MB)) {
      Move-Item $registro "$registro.1" -Force
    }
    Add-Content -Path $registro -Value ('{0:yyyy-MM-dd HH:mm:ss} {1}' -f (Get-Date), $texto) -Encoding UTF8
  } catch { }
}

try {
  Add-Type -AssemblyName System.Windows.Forms
  Add-Type -AssemblyName System.Drawing
  $icono = New-Object System.Windows.Forms.NotifyIcon
  $icono.Icon = [System.Drawing.SystemIcons]::Information
  $icono.Text = 'PYJ Etiquetas'
  $icono.Visible = $true
} catch { $icono = $null }

function Avisar($titulo, $texto) {
  try {
    if (-not $icono) { return }
    $icono.BalloonTipTitle = $titulo
    $icono.BalloonTipText = $texto
    $icono.ShowBalloonTip(15000)
  } catch { }
}

function AbrirPedido($url) {
  try {
    if (-not $url) { return }
    $argumentos = @("--user-data-dir=`"$($cfg.perfilChrome)`"", '--kiosk-printing', $url)
    Start-Process -FilePath $cfg.chrome -ArgumentList $argumentos | Out-Null
  } catch { Anotar "No se pudo abrir Chrome: $($_.Exception.Message)" }
}

$cabeceras = @{
  'Authorization'       = "Bearer $($cfg.token)"
  'X-Agente-Impresora'  = $cfg.impresora
  'X-Agente-Version'    = $VERSION
}

# Respuestas leidas como UTF-8 a mano: PowerShell 5.1 las trata como Latin-1
# y los acentos saldrian rotos en los avisos.
function Llamar($metodo, $ruta, $cuerpo) {
  $p = @{ Method = $metodo; Uri = ($cfg.servidor + $ruta); Headers = $cabeceras; TimeoutSec = 50; UseBasicParsing = $true }
  if ($cuerpo) {
    $p.Body = [Text.Encoding]::UTF8.GetBytes(($cuerpo | ConvertTo-Json -Compress))
    $p.ContentType = 'application/json; charset=utf-8'
  }
  $r = Invoke-WebRequest @p
  $texto = [Text.Encoding]::UTF8.GetString($r.RawContentStream.ToArray())
  if ($texto) { return $texto | ConvertFrom-Json }
}

function YaHecho($id) { (Get-Content $hechos -Encoding UTF8) -contains $id }

# Una impresora apagada, sin papel o en pausa: SumatraPDF igual devuelve 0
# (Windows acepta el trabajo en la cola), asi que se mira antes de imprimir.
function ImpresoraLista() {
  try {
    $imp = Get-Printer -Name $cfg.impresora -ErrorAction Stop
    if ($imp.WorkOffline) { return $false }
    return ([string]$imp.PrinterStatus -eq 'Normal')
  } catch { return $false }
}

$intentos = @{}       # id -> intentos de bajar/imprimir en esta sesion
$avisadoSinImpresora = $false

function Imprimir($trabajo) {
  if ($trabajo.formato -eq 'ZPL') { throw (New-Object System.InvalidOperationException 'Llego en formato ZPL; imprimela desde el pedido.') }
  $archivo = Join-Path $base ('etiqueta-' + ($trabajo.id -replace '[^\w-]', '') + '.pdf')
  try {
    $p = @{ Uri = ($cfg.servidor + $trabajo.archivo); Headers = $cabeceras; OutFile = $archivo; UseBasicParsing = $true; TimeoutSec = 60 }
    Invoke-WebRequest @p
    $inicio = [IO.File]::ReadAllBytes($archivo)[0..3]
    if ([Text.Encoding]::ASCII.GetString($inicio) -ne '%PDF') { throw 'El archivo bajado no es un PDF.' }
    $argumentos = @('-print-to', "`"$($cfg.impresora)`"", '-print-settings', 'fit', '-silent', "`"$archivo`"")
    $proc = Start-Process -FilePath $cfg.sumatra -ArgumentList $argumentos -PassThru -WindowStyle Hidden
    $null = $proc.Handle
    if (-not $proc.WaitForExit(120000)) {
      try { $proc.Kill() } catch { }
      throw 'SumatraPDF no respondio en 2 minutos.'
    }
    if ($proc.ExitCode -ne 0) { throw "SumatraPDF devolvio el codigo $($proc.ExitCode)." }
  } finally {
    Remove-Item $archivo -Force -ErrorAction SilentlyContinue
  }
}

function Cerrar($t, $estado, $falla) {
  Llamar 'POST' "/api/etiquetas/trabajos/$($t.id)/hecho" @{ estado = $estado; error = $falla } | Out-Null
}

Anotar "Agente $VERSION iniciado. Impresora: $($cfg.impresora)"
Avisar 'PYJ Etiquetas' 'Listo: escuchando pedidos.'

while ($true) {
  try {
    $r = Llamar 'GET' '/api/etiquetas/trabajos' $null
    foreach ($t in @($r.trabajos)) {
      if (-not $t) { continue }
      if (YaHecho $t.id) {
        # Ya se hizo pero la web no se entero (se corto la conexion): solo confirmar.
        Cerrar $t 'hecho' $null
        continue
      }

      if ($t.tipo -eq 'pdf') {
        if (-not (ImpresoraLista)) {
          # No se marca nada: la etiqueta sigue en cola y sale al volver la impresora.
          if (-not $avisadoSinImpresora) {
            Avisar 'Impresora no lista' "Hay etiquetas esperando. Revisa que '$($cfg.impresora)' este encendida y con papel."
            Anotar "Impresora no lista; $($t.pedido) espera."
            $avisadoSinImpresora = $true
          }
          continue
        }
        $avisadoSinImpresora = $false
        try {
          Imprimir $t
          Add-Content -Path $hechos -Value $t.id -Encoding UTF8
          Anotar "OK pdf $($t.pedido)"
          Avisar $t.titulo 'Impresa.'
          Cerrar $t 'hecho' $null
        } catch {
          $falla = $_.Exception.Message
          $n = 1 + [int]$intentos[$t.id]
          $intentos[$t.id] = $n
          Anotar "FALLO pdf $($t.pedido) (intento $n): $falla"
          # Errores de red o del momento: se reintenta en la proxima vuelta.
          # A los 5, o si el problema no se arregla reintentando, se rinde y
          # la web deja un aviso de etiqueta YA PAGADA para imprimirla a mano.
          if ($n -ge 5 -or $_.Exception -is [System.InvalidOperationException]) {
            Avisar "No se pudo imprimir: $($t.titulo)" "$falla Imprimela desde el pedido."
            AbrirPedido $t.adminUrl
            Add-Content -Path $hechos -Value $t.id -Encoding UTF8
            Cerrar $t 'fallido' $falla
          }
        }
        continue
      }

      # abrir / aviso: no pueden fallar de forma que convenga repetir.
      if ($t.tipo -eq 'abrir') { Avisar $t.titulo $t.mensaje; AbrirPedido $t.adminUrl }
      else { Avisar $t.titulo $t.mensaje }
      Add-Content -Path $hechos -Value $t.id -Encoding UTF8
      Anotar "OK $($t.tipo) $($t.pedido)"
      Cerrar $t 'hecho' $null
    }
  } catch {
    Anotar "Sin conexion con la web: $($_.Exception.Message)"
  }
  Start-Sleep -Seconds ([int]$cfg.intervaloSegundos)
}
