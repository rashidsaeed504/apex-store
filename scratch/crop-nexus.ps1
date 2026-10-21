Add-Type -AssemblyName System.Drawing

$srcPath = 'C:\Users\bot\.gemini\antigravity-ide\brain\f7bcb208-7a92-4349-a105-8d68f50531df\.user_uploaded\media_1792580958906.png'
$dstPath = 'f:\web journey\Projucts\apex-react\public\banners\nexus-pro-mobile.png'

$src = [System.Drawing.Bitmap]::FromFile($srcPath)
$rect = [System.Drawing.Rectangle]::new(25, 100, 295, 350)
$cropped = $src.Clone($rect, $src.PixelFormat)

$cropped.Save($dstPath, [System.Drawing.Imaging.ImageFormat]::Png)

$cropped.Dispose()
$src.Dispose()

Write-Host "Saved cropped banner to $dstPath"
