# Contributing to EMC Workspace

## Code Style Guidelines

### Tenant Isolation Rules

**CRITICAL**: All tenant-scoped queries MUST use `tenantWhere()` or helper functions.

#### Tenant-Scoped Models

The following models are tenant-scoped and require tenant filtering:
- `Candidate` - Always belongs to a client
- `Campaign` - References tenant-scoped candidates
- Future client-specific models

#### Required Pattern

**❌ WRONG:**
```typescript
// Direct Prisma query without tenant filtering
const candidates = await prisma.candidate.findMany({
  where: { status: "ACTIVE" }
});
```

**✅ CORRECT:**
```typescript
// Using tenantWhere helper
import { tenantWhere } from "@/lib/tenant";

const user = await getCurrentUser();
const candidates = await prisma.candidate.findMany({
  where: {
    ...tenantWhere(user),
    status: "ACTIVE",
  },
});
```

**✅ ALSO CORRECT:**
```typescript
// Using tenant helper function
import { findManyCandidates } from "@/lib/tenant";

const user = await getCurrentUser();
const candidates = await findManyCandidates(user, {
  status: "ACTIVE",
});
```

#### Code Review Checklist

When reviewing code that queries tenant-scoped models:

- [ ] Does the query use `tenantWhere(user)` or a tenant helper function?
- [ ] Is the user object validated (not null)?
- [ ] Are global scope users (Platform Admin, Recruiter) handled correctly?
- [ ] Is tenant validation logged if violations occur?

### RBAC Permission Guidelines

#### Permission Checking

**❌ WRONG:**
```typescript
// Direct role checking
if (user.role === "PLATFORM_ADMIN") {
  // do something
}
```

**✅ CORRECT:**
```typescript
// Using permission system
import { requirePermission, PERMISSIONS } from "@/lib/auth";

requirePermission(user, PERMISSIONS.MANAGE_USERS);
```

#### Role Validation

Always validate roles from external sources (database, session, API):

```typescript
import { isValidRole } from "@/lib/permissions";

if (!isValidRole(roleFromDB)) {
  throw new Error("Invalid role");
}
```

### Authentication Patterns

#### API Route Protection

**Required pattern for all API routes:**

```typescript
import { requireAuth, requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { tenantWhere } from "@/lib/tenant";

export async function GET(request: NextRequest) {
  const user = await requireAuth();
  requirePermission(user, PERMISSIONS.VIEW_CLIENT_CANDIDATES);
  
  const where = {
    ...tenantWhere(user),
    // additional filters
  };
  
  // ... rest of handler
}
```

#### Error Handling

Always return appropriate HTTP status codes:

```typescript
try {
  const user = await requireAuth();
  requirePermission(user, PERMISSIONS.SOME_PERMISSION);
} catch (error: any) {
  if (error.message === "Authentication required") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (error.message.includes("Permission")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({ error: "Internal error" }, { status: 500 });
}
```

## Phase 2 Integration Guidelines

### Adding Azure AD B2C Provider

When implementing Phase 2:

1. **Do NOT modify existing Credentials provider** - It must remain unchanged
2. **Add B2C provider alongside Credentials** - Use array spread
3. **Validate external user roles** - B2C users can only be CLIENT_ADMIN, CLIENT_USER, or CANDIDATE
4. **Set authProvider correctly** - B2C users must have `authProvider = "azureadb2c"`
5. **Map provider identity** - Use `sub` or `oid` as `authProviderId`

### External User Restrictions

External users (B2C) have these restrictions:

- Cannot be assigned internal roles (PLATFORM_ADMIN, RECRUITER)
- Must have `clientId` set (except during initial registration)
- Cannot access `/admin` routes
- Cannot manage platform users or clients

### Code Example: Creating External User

```typescript
// When B2C user signs in for first time
const newUser = await prisma.user.create({
  data: {
    email: profile.email,
    name: profile.name,
    role: Role.CLIENT_ADMIN, // External role only
    authProvider: "azureadb2c",
    authProviderId: profile.sub,
    isInternal: false, // Must be false
    clientId: invite.clientId, // From invite
    emailVerified: new Date(),
    isActive: true,
  },
});
```

## Testing Requirements

### Before Submitting PR

1. **Run RBAC tests**: `npm run test:rbac`
2. **Validate config**: `npm run validate:config`
3. **Run linter**: `npm run lint`
4. **Test tenant isolation**: Verify queries use `tenantWhere()`
5. **Test permissions**: Verify permission checks are in place

### Test Coverage

- All API routes must have authentication tests
- Tenant isolation must be tested for each tenant-scoped query
- Permission checks must be tested for each protected action
- RBAC sanity tests must pass

## Security Guidelines

### Secrets Management

- **Never commit secrets** to git
- Use environment variables for all secrets
- Validate secrets on application startup
- Rotate secrets periodically

### Audit Logging

Log these actions to `AuditLog`:

- User creation, update, deactivation
- Client creation, update, deactivation
- Password changes
- Login failures
- Permission denials
- Tenant violations
- Impersonation (if implemented)

### Rate Limiting

- All authentication endpoints must have rate limiting
- Track by email and IP address
- Log rate limit violations

## Database Guidelines

### Schema Changes

- Always create migrations for schema changes
- Never modify existing migrations
- Test migrations on development database first
- Document breaking changes

### Query Patterns

- Use Prisma query builder (never raw SQL)
- Always use parameterized queries (Prisma handles this)
- Use indexes for frequently queried fields
- Consider query performance for large datasets

## Documentation Requirements

### Code Comments

- Document complex permission logic
- Explain tenant isolation decisions
- Document why certain roles have specific permissions
- Add TODO comments for future enhancements

### API Documentation

- Document all API routes
- Include authentication requirements
- Document permission requirements
- Include example requests/responses

## Pull Request Process

1. Create feature branch from `main`
2. Implement changes following guidelines
3. Run all tests and validation scripts
4. Update documentation if needed
5. Create PR with clear description
6. Request review from team
7. Address review feedback
8. Merge after approval

## Questions?

If you're unsure about:
- Tenant isolation patterns
- Permission requirements
- Authentication flows
- Phase 2 integration

Please ask before implementing. It's better to clarify than to introduce security vulnerabilities.

