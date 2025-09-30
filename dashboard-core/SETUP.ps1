<#
PowerShell setup script snippets for dashboard-core environment.
You can dot-source or copy commands as needed.
#>

Write-Host '--- VS Code Extension Check ---' -ForegroundColor Cyan
code --list-extensions | Select-String -Pattern 'copilot|azure|prettier|live-server|rest-client'

Write-Host '--- (Optional) Install Extensions ---' -ForegroundColor Cyan
# Uncomment if missing (idempotent)
# code --install-extension GitHub.copilot
# code --install-extension ms-vscode.azure-account
# code --install-extension ms-vscode.azure-appservice
# code --install-extension esbenp.prettier-vscode
# code --install-extension ritwickdey.LiveServer
# code --install-extension humao.rest-client

Write-Host '--- Git Identity (skip if global already) ---' -ForegroundColor Cyan
git config --global user.name 'Ben'
git config --global user.email 'your-email@example.com'

gh auth status || gh auth login

Write-Host '--- Azure CLI Status ---' -ForegroundColor Cyan
az account show --output table 2>$null
az webapp list --output table 2>$null | Select-Object -First 5
az functionapp list --output table 2>$null | Select-Object -First 5

Write-Host '--- (Optional) Initialize Repo (if standalone) ---' -ForegroundColor Cyan
# if (-Not (Test-Path .git)) {
#   git init
#   gh repo create HumanAIConvention/dashboard-core --public --source=. --remote=origin --push
# }

Write-Host 'Done.' -ForegroundColor Green
