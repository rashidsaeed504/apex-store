Add-Type -AssemblyName System.Drawing

$img = [System.Drawing.Bitmap]::FromFile("src/assets/download.png")
$p0 = $img.GetPixel(0, 0)
$pCenter = $img.GetPixel([int]($img.Width / 2), [int]($img.Height / 2))
Write-Host "Pixel 0,0: Alpha = $($p0.A), R = $($p0.R), G = $($p0.G), B = $($p0.B)"
Write-Host "Pixel Center: Alpha = $($pCenter.A), R = $($pCenter.R), G = $($pCenter.G), B = $($pCenter.B)"
$img.Dispose()
