# Azure Deployment Guide

This project is a React + Vite + TypeScript app located in `web/`. Below are two supported deployment strategies to Azure, with a primary recommendation to use **Azure Static Web Apps (SWA)** for integrated CI/CD and free SSL. An alternative using **Azure Storage Static Website + CDN/Front Door** is also outlined.

> Temporary Access Gate: A soft client-side password gate (`haslam`) was added in `web/index.html`. It is **NOT** security—just obfuscation during a private preview. Remove before public launch.

---
## 1. Prerequisites
- Azure subscription (Contributor permissions on target resource group)
- GitHub repository (recommended: push this code before creating SWA)
- Node.js LTS installed locally (for initial build checks)
- (Optional) Custom domain DNS access for `humanaiconvention.com`

---
## 2. Build Artifacts
Production build output directory: `web/dist`

Build command (run at repo root):
```
npm run build
```
This executes `tsc -b` then `vite build` inside the `web` workspace.

---
## 3. Option A (Recommended): Azure Static Web Apps
**Why**: Fast provisioning, GitHub Actions workflow auto-generated, free SSL certificates (including custom domains), global edge distribution.

### 3.1 Create Static Web App (Portal)
1. Go to Azure Portal → Create resource → "Static Web App"
2. Select subscription & resource group (create new like `rg-hac-web` if needed)
3. Name: `human-ai-convention` (unique globally; adjust if taken)
4. Plan type: Free (upgrade later if needed)
5. Deployment source: GitHub
6. Authorize GitHub → select org/user + repo + branch (`main`)
7. Build Details:
   - Build Preset: `Custom`
   - App location: `web`
   - Api location: (leave blank for now)
   - Output location: `dist`
8. Review + Create.

Azure will inject a GitHub Actions workflow similar to the one we add manually (see `.github/workflows/azure-static-web-app.yml`). If you prefer to keep infra-as-code under version control, you can also create the workflow first (next section) then use `az` CLI to link it.

### 3.2 (Alternate) Create via Azure CLI
Install Azure CLI then:
```
az login
az group create -n rg-hac-web -l eastus
az staticwebapp create \
  -n human-ai-convention \
  -g rg-hac-web \
  --source https://github.com/<YOUR_ORG_OR_USER>/humanaiconvention \
  --branch main \
  --login-with-github \
  --location eastus2 \
  --app-location web \
  --output-location dist
```

### 3.3 GitHub Actions Workflow Expectations
The workflow:
- Checks out repo
- Sets up Node (use version from `.nvmrc` if added, else LTS)
- Installs dependencies (root and workspace) with `npm ci`
- Builds
- Uploads artifacts to SWA using Azure's deploy action

### 3.4 Custom Domain `humanaiconvention.com`
1. In the SWA resource → Custom Domains → Add
2. Enter `humanaiconvention.com` (apex) and optionally `www.humanaiconvention.com`.
3. Azure provides a verification record (TXT) and an A/ALIAS or CNAME target.
4. In your DNS provider add the TXT record first; wait for validation.
5. Add A (apex) or ALIAS/ANAME pointing to the SWA endpoint; add CNAME for `www`.
6. After validation Azure provisions SSL automatically (can take ~15 mins).

### 3.5 Remove Temporary Password Gate (Later)
Edit `web/index.html` and delete the `<div id="access-gate">...</div>` block and the inline gate `<script>` wrapper. Rebuild & push.

Search hint to locate block:
```
access-gate
```

### 3.6 Environment Variables
For a pure static site you likely need none yet. When adding APIs or keys (e.g. feature flags) use SWA portal → Configuration or GitHub secrets consumed in the workflow.

---
## 4. Option B: Azure Storage Static Website + CDN (or Front Door)
Use if you prefer granular control or already have infra standards. Adds more manual steps.

### 4.1 Provision Resources
```
az group create -n rg-hac-web -l eastus
az storage account create -n stgacpreview -g rg-hac-web -l eastus --sku Standard_LRS --kind StorageV2 --https-only true
az storage blob service-properties update --account-name stgacpreview --static-website --404-document index.html --index-document index.html
```
Grab the web endpoint output after enabling static website.

### 4.2 Upload Build
```
npm run build
az storage blob upload-batch \
  -s web/dist \
  -d '$web' \
  --account-name stgacpreview \
  --no-progress
```

### 4.3 Add CDN / Front Door (Recommended)
Provision an Azure Front Door (Standard/Premium) or Azure CDN endpoint targeting the Storage static website endpoint for global performance + HTTPS on custom domain.

### 4.4 Custom Domain & SSL
- Map domain in Front Door/CDN first (TXT/CNAME verification) then enable managed certificate.
- Point apex using ALIAS/ANAME (if supported) or use an intermediary like Azure DNS + zone apex record.

### 4.5 Cache Invalidation
When redeploying:
```
# Rebuild + upload
npm run build
az storage blob upload-batch -s web/dist -d '$web' --account-name stgacpreview --pattern "*" --overwrite
# Purge CDN/Front Door
az afd endpoint purge --resource-group rg-hac-web --profile-name <afdProfile> --endpoint-name <endpoint> --content-paths '/*'
```

---
## 5. CI/CD (Manual Storage Path)
If you adopt Storage + Front Door, create a GitHub Actions workflow that builds then uses `azure/login` + `azure/cli` actions to upload.

Key steps snippet:
```yaml
- name: Azure Login
  uses: azure/login@v2
  with:
    creds: ${{ secrets.AZURE_CREDENTIALS }}
- name: Build
  run: npm run build
- name: Upload to Storage
  run: |
    az storage blob upload-batch -s web/dist -d '$web' --account-name stgacpreview --overwrite
```

`AZURE_CREDENTIALS` is a JSON service principal created with:
```
az ad sp create-for-rbac --name hac-storage-deployer --role Contributor --scopes /subscriptions/<SUB_ID>/resourceGroups/rg-hac-web --sdk-auth
```

---
## 6. Verifying Deployment
- Hit the SWA `*.azurestaticapps.net` URL (or Storage endpoint) directly first.
- Confirm password gate renders and accepts `haslam`.
- Test React routes still load (if adding client-side routing later, ensure 404 fallback set to `index.html`).

---
## 7. Observability & Next Steps
| Phase | Recommendation |
|-------|---------------|
| Preview | Keep gate; basic uptime check (GitHub Action scheduled curl) |
| Pre-Public | Remove gate; add analytics (privacy-focused) |
| Growth | Add App Insights or custom logging via edge/API |

Future Enhancements:
- Add accessibility & performance CI checks (Lighthouse CI / axe)
- Add CSP & security headers (via SWA `staticwebapp.config.json` or Front Door rules)
- Introduce real auth (GitHub / Entra ID) for collaborator-only areas
- Automated visual regression tests (Playwright)

---
## 8. Rollback Strategy
Because builds are immutable artifacts, rollback is just re-running a prior commit’s workflow. For Storage, keep previous `dist` zips and re-upload.

---
## 9. FAQ
**Is the password gate secure?** No. Anyone can view source and bypass it.

**How do I add API functions later?** In SWA add an `api/` folder (Node Azure Functions) and set `api-location` during config.

**Can I script custom headers?** Yes—create `web/staticwebapp.config.json` (SWA) with `globalHeaders`.

---
## 10. Remove This Guide From Build
This markdown file does not ship—only `web/dist` is deployed.

---
**Maintainer Note:** Update this file whenever deployment stack changes.
