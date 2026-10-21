Add-Type -AssemblyName System.Drawing

function Create-ApexBanner {
    param(
        [int]$width,
        [int]$height,
        [string]$outputPath,
        [bool]$isMobile = $false
    )

    $bmp = [System.Drawing.Bitmap]::new($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

    # 1. Base Dark Charcoal / Onyx Background
    $rect = [System.Drawing.Rectangle]::new(0, 0, $width, $height)
    $bgBrush = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
        [System.Drawing.Point]::new(0, 0),
        [System.Drawing.Point]::new($width, $height),
        [System.Drawing.Color]::FromArgb(255, 14, 14, 18),
        [System.Drawing.Color]::FromArgb(255, 6, 6, 8)
    )
    $g.FillRectangle($bgBrush, $rect)
    $bgBrush.Dispose()

    # 2. Tech Ambient Red Spotlight behind Products (Right)
    $glowPath = [System.Drawing.Drawing2D.GraphicsPath]::new()
    $glowW = [int]($width * 0.55)
    $glowH = [int]($height * 1.8)
    $glowX = [int]($width * 0.52)
    $glowY = [int](-$height * 0.4)
    $glowPath.AddEllipse($glowX, $glowY, $glowW, $glowH)
    $pathBrush = [System.Drawing.Drawing2D.PathGradientBrush]::new($glowPath)
    $pathBrush.CenterColor = [System.Drawing.Color]::FromArgb(60, 220, 38, 38)
    $pathBrush.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 0, 0, 0))
    $g.FillPath($pathBrush, $glowPath)
    $glowPath.Dispose()
    $pathBrush.Dispose()

    # Subtle ambient red glow under title (Left)
    $leftGlowPath = [System.Drawing.Drawing2D.GraphicsPath]::new()
    $leftGlowPath.AddEllipse([int](-$width * 0.05), [int]($height * 0.2), [int]($width * 0.4), [int]($height * 1.1))
    $leftGlowBrush = [System.Drawing.Drawing2D.PathGradientBrush]::new($leftGlowPath)
    $leftGlowBrush.CenterColor = [System.Drawing.Color]::FromArgb(30, 220, 38, 38)
    $leftGlowBrush.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 0, 0, 0))
    $g.FillPath($leftGlowBrush, $leftGlowPath)
    $leftGlowPath.Dispose()
    $leftGlowBrush.Dispose()

    # Subtle sleek cyber grid
    $gridPen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(10, 255, 255, 255), 1)
    $gridStep = $(if ($isMobile) { 22 } else { 34 })
    for ($x = 0; $x -lt $width; $x += $gridStep) {
        $g.DrawLine($gridPen, $x, 0, $x, $height)
    }
    for ($y = 0; $y -lt $height; $y += $gridStep) {
        $g.DrawLine($gridPen, 0, $y, $width, $y)
    }
    $gridPen.Dispose()

    # 3. Draw Authentic APEX Product Setup (from src/assets/download.png)
    $productImg = [System.Drawing.Bitmap]::FromFile("src/assets/download.png")
    $prodAspect = $productImg.Width / $productImg.Height
    $scaleRatio = $(if ($isMobile) { 0.94 } else { 0.92 })
    $prodTargetH = [int]($height * $scaleRatio)
    $prodTargetW = [int]($prodTargetH * $prodAspect)
    $prodY = [int](($height - $prodTargetH) / 2)
    $prodMargin = $(if ($isMobile) { 12 } else { 40 })
    $prodX = [int]($width - $prodTargetW - $prodMargin)

    # Soft ambient drop shadow underneath products
    $shadowBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(140, 0, 0, 0))
    $g.FillEllipse($shadowBrush, $prodX - 10, [int]($height * 0.78), $prodTargetW + 20, [int]($height * 0.24))
    $shadowBrush.Dispose()

    # Draw product image
    $destRect = [System.Drawing.Rectangle]::new($prodX, $prodY, $prodTargetW, $prodTargetH)
    $g.DrawImage($productImg, $destRect, 0, 0, $productImg.Width, $productImg.Height, [System.Drawing.GraphicsUnit]::Pixel)
    $productImg.Dispose()

    # 4. Helper for perfect rounded pills
    function Draw-Pill($gfx, $fillBrush, $borderPen, $x, $y, $w, $h) {
        $p = [System.Drawing.Drawing2D.GraphicsPath]::new()
        $r = [int]($h / 2)
        $d = $r * 2
        $p.AddArc($x, $y, $d, $d, 90, 180)
        $p.AddArc($x + $w - $d, $y, $d, $d, 270, 180)
        $p.CloseFigure()
        if ($fillBrush) { $gfx.FillPath($fillBrush, $p) }
        if ($borderPen) { $gfx.DrawPath($borderPen, $p) }
        $p.Dispose()
    }

    # 5. Draw APEX Logo & Campaign Copy
    $logoImg = [System.Drawing.Bitmap]::FromFile("src/assets/logo-bg.png")
    $logoAspect = $logoImg.Width / $logoImg.Height

    $bullet = [char]0x2022
    $arrow = [char]0x2192

    if ($isMobile) {
        # Mobile Layout (800 x 180)
        $logoH = 26
        $logoW = [int]($logoH * $logoAspect)
        $logoX = 24
        $logoY = 16
        $g.DrawImage($logoImg, $logoX, $logoY, $logoW, $logoH)

        # Eyebrow Pill
        $badgePillX = $logoX + $logoW + 12
        $badgePillY = $logoY + 2
        $badgePillW = 126
        $badgePillH = 22
        $badgeFill = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(40, 220, 38, 38))
        $badgeBorder = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(120, 220, 38, 38), 1)
        Draw-Pill $g $badgeFill $badgeBorder $badgePillX $badgePillY $badgePillW $badgePillH
        $badgeFill.Dispose()
        $badgeBorder.Dispose()

        $badgeFont = [System.Drawing.Font]::new("Segoe UI", 7.5, [System.Drawing.FontStyle]::Bold)
        $badgeBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 255, 90, 90))
        $g.DrawString("OFFICIAL DROP", $badgeFont, $badgeBrush, [float]($badgePillX + 16), [float]($badgePillY + 3.5))
        $badgeFont.Dispose()
        $badgeBrush.Dispose()

        # Headline
        $headFont1 = [System.Drawing.Font]::new("Arial Black", 16, [System.Drawing.FontStyle]::Bold)
        $headFont2 = [System.Drawing.Font]::new("Arial Black", 16, [System.Drawing.FontStyle]::Bold)
        $whiteBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::White)
        $redBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 239, 68, 68))

        $line1Y = 48
        $g.DrawString("TECH FOR EVERY", $headFont1, $whiteBrush, [float]$logoX, [float]$line1Y)
        $line2Y = 72
        $g.DrawString("MOMENT.", $headFont2, $redBrush, [float]$logoX, [float]$line2Y)

        # Subtitle
        $subFont = [System.Drawing.Font]::new("Segoe UI", 8.5, [System.Drawing.FontStyle]::Regular)
        $subBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(210, 180, 185, 190))
        $g.DrawString("Spatial Audio $bullet Titanium Wearables", $subFont, $subBrush, [float]$logoX, [float]103)

        # CTA Button Pill
        $ctaX = $logoX
        $ctaY = 130
        $ctaW = 124
        $ctaH = 30
        $ctaFill = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 220, 38, 38))
        $ctaBorder = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(255, 255, 100, 100), 1)
        Draw-Pill $g $ctaFill $ctaBorder $ctaX $ctaY $ctaW $ctaH
        $ctaFill.Dispose()
        $ctaBorder.Dispose()

        $ctaFont = [System.Drawing.Font]::new("Segoe UI", 8.5, [System.Drawing.FontStyle]::Bold)
        $ctaTextBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::White)
        $g.DrawString("SHOP NOW  $arrow", $ctaFont, $ctaTextBrush, [float]($ctaX + 16), [float]($ctaY + 6.5))

        $headFont1.Dispose()
        $headFont2.Dispose()
        $whiteBrush.Dispose()
        $redBrush.Dispose()
        $subFont.Dispose()
        $subBrush.Dispose()
        $ctaFont.Dispose()
        $ctaTextBrush.Dispose()
    } else {
        # Desktop Layout (1600 x 360)
        $logoH = 46
        $logoW = [int]($logoH * $logoAspect)
        $logoX = 64
        $logoY = 38
        $g.DrawImage($logoImg, $logoX, $logoY, $logoW, $logoH)

        # Eyebrow Pill
        $badgePillX = $logoX + $logoW + 20
        $badgePillY = $logoY + 6
        $badgePillW = 200
        $badgePillH = 34
        $badgeFill = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(40, 220, 38, 38))
        $badgeBorder = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(120, 220, 38, 38), 1)
        Draw-Pill $g $badgeFill $badgeBorder $badgePillX $badgePillY $badgePillW $badgePillH
        $badgeFill.Dispose()
        $badgeBorder.Dispose()

        $badgeFont = [System.Drawing.Font]::new("Segoe UI", 11, [System.Drawing.FontStyle]::Bold)
        $badgeBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 255, 90, 90))
        $g.DrawString("OFFICIAL CAMPAIGN", $badgeFont, $badgeBrush, [float]($badgePillX + 22), [float]($badgePillY + 7))
        $badgeFont.Dispose()
        $badgeBrush.Dispose()

        # Headline
        $headFont1 = [System.Drawing.Font]::new("Arial Black", 33, [System.Drawing.FontStyle]::Bold)
        $headFont2 = [System.Drawing.Font]::new("Arial Black", 33, [System.Drawing.FontStyle]::Bold)
        $whiteBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::White)
        $redBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 239, 68, 68))

        $line1Y = 104
        $g.DrawString("TECH FOR EVERY", $headFont1, $whiteBrush, [float]$logoX, [float]$line1Y)
        $line2Y = 156
        $g.DrawString("MOMENT.", $headFont2, $redBrush, [float]$logoX, [float]$line2Y)

        # Subtitle
        $subFont = [System.Drawing.Font]::new("Segoe UI", 15, [System.Drawing.FontStyle]::Regular)
        $subBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(210, 185, 190, 195))
        $g.DrawString("Spatial Audio  $bullet  Titanium Wearables  $bullet  High-Speed Charging", $subFont, $subBrush, [float]$logoX, [float]218)

        # CTA Button Pill
        $ctaX = $logoX
        $ctaY = 266
        $ctaW = 210
        $ctaH = 46
        $ctaFill = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 220, 38, 38))
        $ctaBorder = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(255, 255, 120, 120), 1)
        Draw-Pill $g $ctaFill $ctaBorder $ctaX $ctaY $ctaW $ctaH
        $ctaFill.Dispose()
        $ctaBorder.Dispose()

        $ctaFont = [System.Drawing.Font]::new("Segoe UI", 13, [System.Drawing.FontStyle]::Bold)
        $ctaTextBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::White)
        $g.DrawString("EXPLORE GEAR  $arrow", $ctaFont, $ctaTextBrush, [float]($ctaX + 24), [float]($ctaY + 12))

        $headFont1.Dispose()
        $headFont2.Dispose()
        $whiteBrush.Dispose()
        $redBrush.Dispose()
        $subFont.Dispose()
        $subBrush.Dispose()
        $ctaFont.Dispose()
        $ctaTextBrush.Dispose()
    }

    $logoImg.Dispose()

    # Subtle sleek outer hairline border
    $edgePen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(35, 255, 255, 255), 1)
    $g.DrawRectangle($edgePen, 0, 0, $width - 1, $height - 1)
    $edgePen.Dispose()

    $g.Dispose()
    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Created $outputPath ($width x $height)"
}

Create-ApexBanner -width 1600 -height 360 -outputPath "public/banners/apex-campaign-banner.png" -isMobile $false
Create-ApexBanner -width 800 -height 180 -outputPath "public/banners/apex-campaign-mobile.png" -isMobile $true
