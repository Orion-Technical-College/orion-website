# Production Readiness Checklist

## Azure App Service Configuration

### Environment Variables Setup

1. Navigate to Azure Portal → App Service `emc-workspace` → Settings → Environment variables

2. Add required NextAuth variables:
   - **NEXTAUTH_URL**: `https://emc-workspace.azurewebsites.net`
   - **NEXTAUTH_SECRET**: Generate with `openssl rand -base64 32` (must be unique, not in git)

3. Verify existing variables:
   - **DATABASE_URL**: Azure SQL connection string (already set)
   - **NODE_ENV**: Should be `production` in prod

4. Click **Apply** and restart the App Service

### Verification Steps

After configuration:

1. Test login page: `https://emc-workspace.azurewebsites.net/login`
   - Should display login form
   - Login with seeded Platform Admin credentials

2. Test session endpoint: `https://emc-workspace.azurewebsites.net/api/auth/session`
   - Should return JSON with `user` object including `role` and `clientId`
   - If `null`, check NEXTAUTH_URL and NEXTAUTH_SECRET configuration

3. Test middleware protection:
   - Open `/admin` in incognito window
   - Should redirect to `/login` (unauthenticated access blocked)

### Troubleshooting

If you see:
- 500 errors on `/api/auth/*`
- Login loops
- `/api/auth/session` always returns `null`

Check:
- App Service Log stream for errors
- Environment variables are correctly set
- NEXTAUTH_URL matches actual deployed URL
- NEXTAUTH_SECRET is set and not empty

## Configuration Validation

- [ ] NEXTAUTH_URL set to actual deployed URL (`https://emc-workspace.azurewebsites.net`)
- [ ] NEXTAUTH_SECRET is unique per environment and not in git
- [ ] DATABASE_URL user has minimal required privileges
- [ ] Cookie settings: secure=true, sameSite=lax (or stricter) in production
- [ ] NODE_ENV is `production` in production environment
- [ ] Run `npm run validate:config` to verify configuration

## Security

- [ ] Seed admin password changed (forced on first login)
- [ ] Rate limiting enabled and tested (5 attempts per 15 minutes)
- [ ] Account lockout working
- [ ] Audit logging verified (check AuditLog table)
- [ ] Password complexity enforced (8+ chars, uppercase, lowercase, number, special char)

## Testing

- [ ] RBAC sanity tests passing (`npm run test:rbac`)
- [ ] Tenant isolation verified
- [ ] All API routes protected
- [ ] Admin dashboard accessible only to Platform Admins
- [ ] Login flow works in production
- [ ] Session management works correctly
- [ ] Password change flow works

## Monitoring

- [ ] Auth metrics being collected (check auth-metrics.ts)
- [ ] Audit logs being written (check AuditLog table)
- [ ] Error logging configured
- [ ] App Service logs accessible
- [ ] Failed login attempts logged
- [ ] Tenant violations logged

## Database

- [ ] Schema migrated successfully (`npm run db:push`)
- [ ] Initial Platform Admin seeded (`npm run db:seed`)
- [ ] All indexes created
- [ ] Foreign key constraints working
- [ ] AuditLog table populated with initial actions

## Pre-Deployment Checklist

Before deploying to production:

1. [ ] Run `npm run validate:config` - Configuration validation passes
2. [ ] Run `npm run test:rbac` - RBAC sanity tests pass
3. [ ] Run `npm run lint` - No linting errors
4. [ ] Run `npm run build` - Build succeeds
5. [ ] Verify environment variables in Azure App Service
6. [ ] Test login flow in staging environment
7. [ ] Verify audit logging is working
8. [ ] Check rate limiting is active
9. [ ] Verify password change enforcement

## Post-Deployment Verification

After deployment:

1. [ ] Login with Platform Admin credentials
2. [ ] Change default password (should be forced)
3. [ ] Verify password change is logged in AuditLog
4. [ ] Test rate limiting (try 6 failed logins)
5. [ ] Verify session persists across page refreshes
6. [ ] Test admin dashboard access (Platform Admin only)
7. [ ] Verify API routes require authentication
8. [ ] Check App Service logs for any errors

## Rollback Plan

If issues occur:

1. Check App Service Log stream for errors
2. Verify environment variables are correct
3. Check database connection
4. Review audit logs for authentication failures
5. If needed, rollback to previous deployment
6. Clear browser cookies and retry

## Support Contacts

- **Database Issues**: Check Azure SQL firewall rules and connection string
- **Auth Issues**: Verify NEXTAUTH_URL and NEXTAUTH_SECRET
- **Deployment Issues**: Check GitHub Actions workflow logs

