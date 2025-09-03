# Nastavitve
$ErrorActionPreference = "Stop"
$base = "http://localhost:3000"
$email = "test+$([guid]::NewGuid().ToString('N').Substring(0,8))@mail.test"
$password = "Geslo123"

Write-Host ">> Registracija: $email"
$regBody = @{ email = $email; password = $password } | ConvertTo-Json
$reg = Invoke-RestMethod "$base/auth/register" -Method Post -ContentType 'application/json' -Body $regBody
if (-not $reg.access_token) { throw "Registracija ni vrnila access_token" }

Write-Host ">> Prijava"
$loginBody = @{ email = $email; password = $password } | ConvertTo-Json
$login = Invoke-RestMethod "$base/auth/login" -Method Post -ContentType 'application/json' -Body $loginBody
$TOKEN = $login.access_token
if (-not $TOKEN) { throw "Prijava ni vrnila access_token" }
Write-Host "Token (skrajšan): $($TOKEN.Substring(0,20))..."

$headers = @{ Authorization = "Bearer $TOKEN" }

Write-Host ">> POST /uploads (metapodatki)"
$uploadBody = @{ source = "manual"; fileMetadata = @{ naziv = "primer"; tip = "json" } } | ConvertTo-Json
$upload = Invoke-RestMethod "$base/uploads" -Method Post -Headers $headers -ContentType 'application/json' -Body $uploadBody
$upload | Format-List

Write-Host ">> GET /uploads"
$list = Invoke-RestMethod "$base/uploads" -Method Get -Headers $headers
"Število uploadov: $($list.Count)"

# (opcijsko) multipart upload, če želiš preizkusiti datoteko – nastavi pot do datoteke:
# $filePath = "A:\slika.jpg"
# if (Test-Path $filePath) {
#   Write-Host ">> POST /uploads/file (multipart)"
#   $body = @{ source = "manual" }
#   $resp = Invoke-RestMethod "$base/uploads/file" -Method Post -Headers $headers -Form $body -InFile $filePath -ContentType "multipart/form-data"
#   $resp | Format-List
# }
