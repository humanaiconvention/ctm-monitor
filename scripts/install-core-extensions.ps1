param(
  [switch]$Force
)

$extensions = @(
  'dbaeumer.vscode-eslint',
  'esbenp.prettier-vscode',
  'wakatime.vscode-wakatime',
  'ms-vscode.powershell',
  'eamodio.gitlens'
)

foreach ($ext in $extensions) {
  Write-Host "Installing $ext" -ForegroundColor Cyan
  code --install-extension $ext | Out-Null
}

Write-Host "Core extensions installed." -ForegroundColor Green
