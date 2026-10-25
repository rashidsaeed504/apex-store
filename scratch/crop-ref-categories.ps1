Add-Type -AssemblyName System.Drawing

$src = 'C:\Users\bot\.gemini\antigravity-ide\brain\ff666ed6-1c59-407a-b226-eec92e6940ed\.user_uploaded\media_1792963693660.png'
$bmp = New-Object System.Drawing.Bitmap($src)

Write-Host "Image size: $($bmp.Width) x $($bmp.Height)"

# Each card is roughly 705 / 5 = 141 px wide.
# Let's inspect the cards:
# y range for the cards is from around y=70 to y=250.
# Card 1 (Earbuds): roughly x=18 to x=140
# Card 2 (Headphones): roughly x=155 to x=280
# Card 3 (Smart Watches): roughly x=295 to x=420
# Card 4 (Chargers & Cables): roughly x=435 to x=560
# Card 5 (Speakers): roughly x=575 to x=700

# Let's crop the product images inside each card:
# Product area inside each card is roughly:
# Card 1 product: x=30 to x=130, y=90 to y=190
# Let's crop each card's product visual:
$cards = @(
    @{ Name = "earbuds-ref.png"; Rect = New-Object System.Drawing.Rectangle(15, 75, 125, 175) },
    @{ Name = "headphones-ref.png"; Rect = New-Object System.Drawing.Rectangle(155, 75, 125, 175) },
    @{ Name = "smartwatches-ref.png"; Rect = New-Object System.Drawing.Rectangle(298, 75, 125, 175) },
    @{ Name = "chargers-ref.png"; Rect = New-Object System.Drawing.Rectangle(435, 75, 125, 175) },
    @{ Name = "speakers-ref.png"; Rect = New-Object System.Drawing.Rectangle(575, 75, 125, 175) }
)

foreach ($c in $cards) {
    $crop = $bmp.Clone($c.Rect, $bmp.PixelFormat)
    $outPath = "public/categories/" + $c.Name
    $crop.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $crop.Dispose()
    Write-Host "Saved $($c.Name)"
}

$bmp.Dispose()
