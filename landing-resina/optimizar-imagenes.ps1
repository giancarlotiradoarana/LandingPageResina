# =====================================================================
#  OPTIMIZADOR DE IMÁGENES PARA LA GALERÍA DE TRABAJOS
# =====================================================================
#  QUÉ HACE:
#    - Toma todas las imágenes de la carpeta "img\trabajos-original"
#    - Las redimensiona a un ancho máximo (por defecto 1200px)
#    - Las recomprime como JPG de calidad 72
#    - Las guarda en "img\" con los nombres trabajo-1.jpg, trabajo-2.jpg, ...
#
#  CÓMO USARLO:
#    1. Crea la carpeta:  landing-resina\img\trabajos-original
#    2. Copia ahí tus 46 fotos (en cualquier formato: jpg, png, etc.)
#    3. Haz clic derecho en este archivo > "Ejecutar con PowerShell"
#       (o desde una terminal:  powershell -ExecutionPolicy Bypass -File optimizar-imagenes.ps1)
#    4. Espera. Al terminar tendrás trabajo-1.jpg ... trabajo-46.jpg en img\
# =====================================================================

$maxWidth = 1200      # ancho máximo en píxeles
$calidad  = 72        # calidad JPG (0-100). 70-75 es el punto ideal.

Add-Type -AssemblyName System.Drawing

# Rutas (relativas a la ubicación de este script)
$base    = Split-Path -Parent $MyInvocation.MyCommand.Path
$origen  = Join-Path $base "img\trabajos-original"
$destino = Join-Path $base "img"

if (-not (Test-Path $origen)) {
    Write-Host "ERROR: no existe la carpeta '$origen'." -ForegroundColor Red
    Write-Host "Crea 'img\trabajos-original' y copia ahí tus fotos." -ForegroundColor Yellow
    exit
}

# Configurar el codificador JPG con la calidad deseada
$jpgCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$encParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]$calidad)

$archivos = Get-ChildItem $origen -Include *.jpg,*.jpeg,*.png,*.webp,*.bmp -Recurse
if ($archivos.Count -eq 0) {
    Write-Host "No se encontraron imágenes en '$origen'." -ForegroundColor Yellow
    exit
}

$i = 0
foreach ($archivo in $archivos) {
    $i++
    try {
        $img = [System.Drawing.Image]::FromFile($archivo.FullName)

        # Calcular nuevo tamaño manteniendo proporción
        $ratio = 1.0
        if ($img.Width -gt $maxWidth) { $ratio = $maxWidth / $img.Width }
        $nuevoAncho = [int]($img.Width * $ratio)
        $nuevoAlto  = [int]($img.Height * $ratio)

        $bmp = New-Object System.Drawing.Bitmap($nuevoAncho, $nuevoAlto)
        $g = [System.Drawing.Graphics]::FromImage($bmp)
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.DrawImage($img, 0, 0, $nuevoAncho, $nuevoAlto)

        $salida = Join-Path $destino ("trabajo-$i.jpg")
        $bmp.Save($salida, $jpgCodec, $encParams)

        $g.Dispose(); $bmp.Dispose(); $img.Dispose()

        $kb = [math]::Round((Get-Item $salida).Length / 1KB, 0)
        Write-Host ("OK  trabajo-$i.jpg  ($kb KB)") -ForegroundColor Green
    }
    catch {
        Write-Host ("ERROR con " + $archivo.Name + ": " + $_.Exception.Message) -ForegroundColor Red
    }
}

Write-Host ""
Write-Host ("Listo. Se optimizaron $i imagenes en la carpeta 'img'.") -ForegroundColor Cyan
Write-Host "Ahora conéctalas en index.html (bloque 'AQUÍ VAN TUS FOTOS DE TRABAJOS')." -ForegroundColor Cyan
