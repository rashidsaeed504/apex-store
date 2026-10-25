Add-Type -AssemblyName System.Drawing

$src = 'C:\Users\bot\.gemini\antigravity-ide\brain\ff666ed6-1c59-407a-b226-eec92e6940ed\.user_uploaded\media_1792963693660.png'
$bmp = New-Object System.Drawing.Bitmap($src)

# Precise coordinates for just the product cutout inside each card:
# Each card x-span:
# Card 1 (Earbuds): x=20, width=115. Product: y=80, h=105
# Card 2 (Headphones): x=160, width=115. Product: y=80, h=105
# Card 3 (Smart Watches): x=300, width=115. Product: y=80, h=105
# Card 4 (Chargers & Cables): x=440, width=115. Product: y=80, h=105
# Card 5 (Speakers): x=580, width=115. Product: y=80, h=105

$products = @(
    @{ Name = "earbuds-product.png"; Rect = New-Object System.Drawing.Rectangle(20, 80, 115, 105) },
    @{ Name = "headphones-product.png"; Rect = New-Object System.Drawing.Rectangle(160, 80, 115, 105) },
    @{ Name = "smartwatches-product.png"; Rect = New-Object System.Drawing.Rectangle(302, 80, 115, 105) },
    @{ Name = "chargers-product.png"; Rect = New-Object System.Drawing.Rectangle(440, 80, 115, 105) },
    @{ Name = "speakers-product.png"; Rect = New-Object System.Drawing.Rectangle(580, 80, 115, 105) }
)

foreach ($p in $products) {
    $crop = $bmp.Clone($p.Rect, $bmp.PixelFormat)
    $outPath = "public/categories/" + $p.Name
    $crop.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $crop.Dispose()
    Write-Host "Saved $($p.Name)"
}

$bmp.Dispose()
