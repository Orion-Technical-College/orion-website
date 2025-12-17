# Troubleshooting Deployment Issues

## Issue: Deployment Succeeds But Updates Not Visible

If your deployment shows as successful in GitHub Actions but you don't see the changes in production, try these steps:

### 1. Clear Browser Cache
- Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- Or open in incognito/private mode
- Browser may be caching old JavaScript/CSS files

### 2. Check App Service Status
```bash
az webapp show \
  --name emc-workspace \
  --resource-group orion-website-rg \
  --query "{state:state,lastModifiedTimeUtc:lastModifiedTimeUtc}"
```

### 3. Manually Restart App Service
```bash
az webapp restart \
  --name emc-workspace \
  --resource-group orion-website-rg
```

Or via Azure Portal:
- Go to App Service → emc-workspace
- Click "Restart" button

### 4. Check Deployment Logs
```bash
az webapp log tail \
  --name emc-workspace \
  --resource-group orion-website-rg
```

Or view in Azure Portal:
- App Service → Log stream
- Look for errors or startup issues

### 5. Verify Deployment Package
Check if the deployment actually updated files:
- Azure Portal → App Service → Deployment Center
- Check "Deployment history" to see if new files were deployed
- Verify the deployment timestamp matches your commit

### 6. Check Application Settings
Ensure environment variables are correct:
```bash
az webapp config appsettings list \
  --name emc-workspace \
  --resource-group orion-website-rg \
  --query "[?name=='DATABASE_URL' || name=='NODE_ENV'].{name:name,value:value}"
```

### 7. Force Cache Clear
If using CDN or caching:
- Clear CDN cache if configured
- Check if there's a reverse proxy caching responses

### 8. Check Build Output
Verify the build actually included your changes:
- Check GitHub Actions logs for the build step
- Verify the deployment package size (should be ~20MB)
- Check if any files were excluded

### 9. Verify Code Changes
Make sure your changes were actually committed and pushed:
```bash
git log --oneline -5
git show HEAD --stat
```

### 10. Check Next.js Cache
Next.js may be serving cached pages. The deployment should clear this, but you can verify:
- Check if `.next` directory was included in deployment
- Verify `NODE_ENV=production` is set
- Check if static pages need regeneration

## Common Issues

### Issue: Deployment Shows "In Progress" in Azure Portal
**Cause:** When using direct zip deployment (not Deployment Center), Azure Portal's Deployment Center section doesn't properly track deployment status. The "In Progress" message is a stale UI state.

**Solution:** 
- This can be safely ignored if:
  - GitHub Actions shows deployment as successful
  - App is responding (HTTP 200)
  - App was restarted after deployment
- To clear the status: Stop and start the app, or refresh the portal page
- The actual deployment status is tracked in GitHub Actions, not Azure Portal

### Issue: Old JavaScript/CSS Files
**Solution:** Hard refresh browser or clear cache

### Issue: App Not Restarting
**Solution:** Manually restart via Azure Portal or CLI

### Issue: Environment Variables Not Updated
**Solution:** Check app settings and restart app after updating

### Issue: Database Connection Issues
**Solution:** Verify DATABASE_URL is correct and database is accessible

### Issue: Build Errors Not Caught
**Solution:** Check build logs in GitHub Actions for warnings that didn't fail the build

## Quick Fix Script

```bash
#!/bin/bash
# Quick restart and verification script

APP_NAME="emc-workspace"
RESOURCE_GROUP="orion-website-rg"

echo "Restarting app..."
az webapp restart --name $APP_NAME --resource-group $RESOURCE_GROUP

echo "Waiting 15 seconds..."
sleep 15

echo "Checking app status..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://$APP_NAME.azurewebsites.net)
echo "HTTP Status: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ]; then
  echo "✓ App is responding"
else
  echo "⚠️  App may still be starting. Check logs:"
  echo "az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP"
fi
```
