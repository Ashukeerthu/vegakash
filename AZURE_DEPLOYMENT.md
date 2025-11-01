# Azure App Service Deployment Guide for VegaKash Backend

## Prerequisites
1. Azure account with active subscription
2. GitHub account (ashukeerthu@outlook.com)
3. Git installed locally ✅

## Step 1: Create Azure App Service

### Option A: Using Azure Portal
1. Go to [Azure Portal](https://portal.azure.com)
2. Create a new **App Service**
3. Configuration:
   - **Name**: `vegakash-backend` (or your preferred name)
   - **Runtime stack**: Python 3.11
   - **Operating System**: Linux
   - **Region**: Choose closest to your users
   - **Pricing tier**: F1 (Free) for testing, B1 (Basic) for production

### Option B: Using Azure CLI
```bash
# Login to Azure
az login

# Create resource group
az group create --name vegakash-rg --location eastus

# Create App Service plan
az appservice plan create --name vegakash-plan --resource-group vegakash-rg --sku B1 --is-linux

# Create Web App
az webapp create --resource-group vegakash-rg --plan vegakash-plan --name vegakash-backend --runtime "PYTHON|3.11"
```

## Step 2: Configure Environment Variables

In Azure Portal → App Service → Configuration → Application settings:

```
DATABASE_URL=sqlite:///./vegakash.db
OPENAI_API_KEY=your_openai_api_key_here
CORS_ORIGINS=https://your-frontend-domain.com,https://vegakash-frontend.azurewebsites.net
ENVIRONMENT=production
DEBUG=False
LOG_LEVEL=INFO
SECRET_KEY=your-super-secret-key-change-this
```

## Step 3: Configure Startup Command

In Azure Portal → App Service → Configuration → General settings:
- **Startup Command**: `python -m uvicorn app.main:app --host 0.0.0.0 --port 8000`

## Step 4: Set up CI/CD with GitHub Actions

1. In Azure Portal → App Service → Deployment Center
2. Choose **GitHub** as source
3. Authorize GitHub access
4. Select repository: `Ashukeerthu/vegakash`
5. Select branch: `feature/azure-backend-deploy`
6. Azure will automatically create the publish profile

Alternatively, download the publish profile manually:
1. Azure Portal → App Service → Overview → Get publish profile
2. Add it to GitHub repository secrets as `AZURE_WEBAPP_PUBLISH_PROFILE`

## Step 5: GitHub Repository Setup

1. Push this branch to GitHub:
```bash
git add .
git commit -m "Add Azure deployment configuration"
git push origin feature/azure-backend-deploy
```

2. Create repository on GitHub: `vegakash`
3. Add remote and push:
```bash
git remote add origin https://github.com/Ashukeerthu/vegakash.git
git push -u origin feature/azure-backend-deploy
```

## Step 6: Database Setup (Production)

### Option A: Continue with SQLite (Simple)
- SQLite database will be created automatically
- Data will persist across deployments

### Option B: Upgrade to Azure Database for PostgreSQL
```bash
# Create PostgreSQL server
az postgres server create --resource-group vegakash-rg --name vegakash-db --location eastus --admin-user vegakashuser --admin-password YourPassword123! --sku-name GP_Gen5_2

# Create database
az postgres db create --resource-group vegakash-rg --server-name vegakash-db --name vegakashdb

# Update DATABASE_URL in App Service:
# postgresql://vegakashuser:YourPassword123!@vegakash-db.postgres.database.azure.com:5432/vegakashdb
```

## Step 7: Frontend Deployment (Optional)

For complete setup, deploy React frontend to Azure Static Web Apps:
1. Create Azure Static Web App
2. Connect to GitHub repository
3. Configure build settings for React
4. Update CORS_ORIGINS in backend

## Step 8: Custom Domain & SSL (Optional)

1. Azure Portal → App Service → Custom domains
2. Add your domain
3. SSL certificates are automatically provided by Azure

## Step 9: Monitoring & Scaling

### Enable Application Insights
```bash
az monitor app-insights component create --app vegakash-insights --location eastus --resource-group vegakash-rg --application-type web
```

### Configure Auto-scaling
1. Azure Portal → App Service → Scale up/out
2. Set rules based on CPU, memory, or HTTP queue length

## Troubleshooting

### Common Issues:
1. **Import errors**: Ensure all dependencies are in requirements.txt
2. **Database connection**: Check DATABASE_URL format
3. **CORS errors**: Update CORS_ORIGINS with frontend URL
4. **Startup failures**: Check logs in Azure Portal → Log stream

### Useful Commands:
```bash
# View logs
az webapp log tail --name vegakash-backend --resource-group vegakash-rg

# Restart app
az webapp restart --name vegakash-backend --resource-group vegakash-rg

# Update configuration
az webapp config appsettings set --resource-group vegakash-rg --name vegakash-backend --settings ENVIRONMENT=production
```

## Cost Optimization

- **Free Tier**: F1 (limited hours per day)
- **Basic Tier**: B1 (~$13/month) - recommended for small applications
- **Standard Tier**: S1 (~$56/month) - includes staging slots and auto-scaling

## Security Best Practices

1. ✅ Use environment variables for secrets
2. ✅ Enable HTTPS only
3. ✅ Configure proper CORS origins
4. ✅ Use managed identity for Azure services
5. ✅ Regular security updates

## Next Steps

1. Create Azure App Service
2. Configure environment variables
3. Set up GitHub repository
4. Enable CI/CD
5. Test deployment
6. Monitor and optimize

---

**Repository**: https://github.com/Ashukeerthu/vegakash
**Branch**: feature/azure-backend-deploy
**Azure Documentation**: https://docs.microsoft.com/en-us/azure/app-service/