# Admin Dashboard Tests

## Overview

Comprehensive test suite for the Admin Dashboard implementation, covering API routes, helper functions, and integration scenarios.

## Test Files

### Integration Tests

1. **`admin-users.test.ts`** - User Management API
   - GET /api/admin/users (list, filter, search, pagination)
   - POST /api/admin/users (create with validation)
   - PATCH /api/admin/users/[id] (update with dependency checks)
   - DELETE /api/admin/users/[id] (soft delete with validation)
   - POST /api/admin/users/[id]/reset-password (OAuth detection)

2. **`admin-clients.test.ts`** - Client Management API
   - GET /api/admin/clients (list with counts)
   - POST /api/admin/clients (create with validation)
   - PATCH /api/admin/clients/[id] (update)
   - DELETE /api/admin/clients/[id] (soft delete with dependency validation)

3. **`admin-audit-logs.test.ts`** - Audit Log Viewer API
   - GET /api/admin/audit-logs (filtering, search, pagination, PII redaction)
   - GET /api/admin/audit-logs/export (CSV export with rate limiting)

4. **`admin-system.test.ts`** - System Settings API
   - GET /api/admin/system/config (feature flags, Azure config)
   - GET /api/admin/system/health (database and Azure OpenAI health)
   - PATCH /api/admin/system/feature-flags/[key] (toggle feature flags)

5. **`admin-stats.test.ts`** - Dashboard Statistics API
   - GET /api/admin/stats (aggregated statistics, health checks)

### Unit Tests

1. **`admin-helpers.test.ts`** - Admin Helper Functions
   - `adminWhere()` - Tenant isolation bypass
   - `canDeleteUser()` - User deletion validation
   - `canDeleteClient()` - Client deletion validation
   - `getSystemSetting()` - Feature flag retrieval with caching
   - `setSystemSetting()` - Feature flag updates

## Test Coverage

### Authorization
- ✅ Platform Admin access required
- ✅ Non-admin users receive 403
- ✅ Role-based access control

### Validation
- ✅ Required fields
- ✅ Email format validation
- ✅ Unique email constraint
- ✅ Client assignment for CLIENT_ADMIN/CLIENT_USER
- ✅ Domain format validation
- ✅ Name length validation

### Business Logic
- ✅ Soft delete (deletedAt timestamp)
- ✅ Dependency checks (active campaigns, users, candidates)
- ✅ OAuth user password reset prevention
- ✅ Self-deletion prevention
- ✅ Role change validation

### Data Integrity
- ✅ PII redaction in audit logs
- ✅ Rate limiting on exports
- ✅ Pagination and filtering
- ✅ Search functionality

### System Features
- ✅ Feature flag caching
- ✅ Health monitoring
- ✅ Configuration masking

## Running Tests

```bash
# Run all admin tests
npm test -- --testPathPattern="admin"

# Run specific test file
npm test -- src/__tests__/integration/admin-users.test.ts

# Run with coverage
npm test -- --coverage --testPathPattern="admin"
```

## Test Structure

All tests follow the existing patterns:
- Use `@jest-environment node` for API route tests
- Mock Prisma, auth, and audit logging
- Use `createTestUser()` helper for test users
- Test both success and error cases
- Verify audit logging calls
- Check authorization and validation

## Notes

- Tests use mocked Prisma client (no real database)
- Audit logging is mocked to avoid side effects
- Rate limiting is mocked for predictable tests
- Environment variables are mocked for system config tests








