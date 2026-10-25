Add-Type -AssemblyName System.Drawing

$src = 'C:\Users\bot\.gemini\antigravity-ide\brain\ff666ed6-1c59-407a-b226-eec92e6940ed\.user_uploaded\media_1792963693660.png'
$bmp = New-Object System.Drawing.Bitmap($src)

$items = @(
    @{ Name = "earbuds-clean.png"; Rect = New-Object System.Drawing.Rectangle(26, 88, 103, 98) },
    @{ Name = "headphones-clean.png"; Rect = New-Object System.Drawing.Rectangle(166, 85, 103, 102) },
    @{ Name = "smartwatches-clean.png"; Rect = New-Object System.Drawing.Rectangle(308, 85, 103, 102) },
    @{ Name = "chargers-clean.png"; Rect = New-Object System.Drawing.Rectangle(448, 85, 103, 102) },
    @{ Name = "speakers-clean.png"; Rect = New-Object System.Drawing.Rectangle(588, 85, 103, 102) }
)

foreach ($item in $items) {
    $crop = $bmp.Clone($item.Rect, $bmp.PixelFormat)
    $outPath = "public/categories/" + $item.Name
    $crop.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $crop.Dispose()
    Write-Host "Saved $($item.Name)"
}

$bmp.Dispose()
