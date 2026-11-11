param(
    [string]$Fecha = (Get-Date -Format 'yyyyMMdd'),
    [string]$Etiqueta = 'bloque6-pizarra-seguimiento'
)
$ErrorActionPreference = 'Stop'
if ($Fecha -notmatch '^\d{8}$' -or $Etiqueta -notmatch '^[a-z0-9-]+$') { throw 'Fecha o etiqueta no valida.' }
$root = $PSScriptRoot
$items = @('.github', 'assets', 'firebase', 'banco-problemas', 'tests', '.gitignore',
    'app.js', 'problemas.js', 'matematicas-extra.js', 'porcentajes.js', 'magnitudes.js',
    'geometria.js', 'ampliacion.js', 'seguimiento.js', 'aprendizaje-ui.js', 'sesiones.js', 'sesiones-ui.js', 'retos-calculo.js', 'lectura-problemas.js', 'espacio.js', 'buscador-operaciones.js', 'dinamica.js', 'dinamica-ui.js', 'PLAN-MEJORAS.md',
    'firebase-config.example.js', 'firebase-online.js', 'index.html', 'README.md',
    'SEGURIDAD.md', 'DINAMICA.md', 'PIZARRA-SEGUIMIENTO.md', 'styles.css', 'renovacion.css', 'pizarra.css',
    'accesibilidad.js', 'informes-contenido.js', 'informes-ui.js', 'crear-release.ps1')
$files = @($items | ForEach-Object {
    $item = Get-Item -LiteralPath (Join-Path $root $_) -Force
    if ($item.PSIsContainer) { Get-ChildItem -LiteralPath $item.FullName -File -Recurse -Force }
    else { $item }
} | Where-Object {
    $_.FullName -notmatch '[\\/]node_modules[\\/]|[\\/]\.firebase[\\/]|[\\/][^\\/]*-debug\.log' -and
    $_.Name -ne 'firebase-config.js'
})
$folder = Join-Path $root 'releases'
New-Item -ItemType Directory -Path $folder -Force | Out-Null
$target = Join-Path $folder "ninja-math-codigo-fuente-github-$Fecha-$Etiqueta.zip"
if (Test-Path -LiteralPath $target) { throw 'El release ya existe. Usa otra etiqueta para no sobrescribirlo.' }
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [IO.Compression.ZipFile]::Open($target, [IO.Compression.ZipArchiveMode]::Create)
try {
    foreach ($file in $files) {
        $relative = $file.FullName.Substring($root.Length + 1).Replace('\', '/')
        [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $file.FullName, $relative, [IO.Compression.CompressionLevel]::Optimal) | Out-Null
    }
} finally { $zip.Dispose() }
$zip = [IO.Compression.ZipFile]::OpenRead($target)
try {
    if ($zip.Entries.Count -ne $files.Count) { throw 'Numero de archivos incorrecto.' }
    foreach ($entry in $zip.Entries) {
        $original = Join-Path $root $entry.FullName.Replace('/', '\')
        $stream = $entry.Open()
        $sha = [Security.Cryptography.SHA256]::Create()
        try { $hash = [BitConverter]::ToString($sha.ComputeHash($stream)).Replace('-', '') }
        finally { $stream.Dispose(); $sha.Dispose() }
        if ($hash -ne (Get-FileHash -LiteralPath $original -Algorithm SHA256).Hash) { throw "Archivo distinto: $($entry.FullName)" }
    }
} finally { $zip.Dispose() }
Write-Output "Release verificado: $target ($($files.Count) archivos)"
