Add-Type -AssemblyName System.Drawing

$srcPath = 'C:\Users\bot\.gemini\antigravity-ide\brain\f7bcb208-7a92-4349-a105-8d68f50531df\.user_uploaded\media_1792580958906.png'
$img = [System.Drawing.Bitmap]::FromFile($srcPath)

# Check horizontal at y=200 to find card left and right
for ($x = 10; $x -lt 40; $x++) {
    $c = $img.GetPixel($x, 200)
    if ($c.R -gt 150) {
        Write-Host "Card left edge at x=$x"
        break
    }
}

for ($x = 320; $x -gt 290; $x--) {
    $c = $img.GetPixel($x, 200)
    if ($c.R -gt 150) {
        Write-Host "Card right edge at x=$x"
        break
    }
}

# Check bottom at x=168 from y=450 to 490
for ($y = 450; $y -lt 490; $y++) {
    $c = $img.GetPixel(168, $y)
    if ($c.R -lt 150) {
        Write-Host "Card bottom edge at y=$y"
        break
    }
}

$img.Dispose()
