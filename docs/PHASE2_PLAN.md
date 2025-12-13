# Phase 2: Azure AD B2C Integration Plan

## Overview

Phase 2 extends the authentication system to support external users (Client Admins, Client Users, and Candidates) using Azure AD B2C. This phase builds on the solid foundation of Phase 1 without disrupting existing internal user authentication.

## Goals

- Enable external user authentication via Azure AD B2C
- Support Client Admin and Client User roles (B2B)
- Prepare for Candidate portal (B2C)
- Maintain strict tenant isolation
- Ensure external users cannot access internal roles

## Architecture

### User Flows

**B2B Flow (Client Admins & Client Users):**
- Sign-up: Invite-based registration
- Sign-in: Standard B2C sign-in flow
- Password reset: B2C password reset flow

**B2C Flow (Candidates - Future):**
- Sign-up: Public self-registration
- Sign-in: Standard B2C sign-in flow
- Password reset: B2C password reset flow

### Token Claims Mapping

Azure AD B2C provides these claims:
- `sub` or `oid`: Stable user identifier (use as `authProviderId`)
- `email`: User email address
- `name`: User display name
- Custom claims (if configured):
  - `clientId`: For tenant assignment
  - `role`: For role assignment (if using custom policies)

### Identity Mapping

When a B2C user signs in:

1. Extract `sub` or `oid` from B2C token
2. Look up User by `authProvider = "azureadb2c"` and `authProviderId = sub/oid`
3. If not found, create new User:
   - Set `authProvider = "azureadb2c"`
   - Set `authProviderId = sub/oid`
   - Set `emailVerified = current timestamp`
   - Set `isInternal = false`
   - Assign role based on user flow or invite
   - Assign `clientId` based on invite or custom claim

## Implementation Steps

### Step 1: Azure AD B2C Tenant Setup

1. Create Azure AD B2C tenant
2. Register application in B2C
3. Configure user flows:
   - `B2C_1_signup_signin_client` - For Client Admins/Users
   - `B2C_1_signup_signin_candidate` - For Candidates (future)
4. Configure application claims:
   - Email
   - Display name
   - Object ID (sub)
   - Custom claims (clientId, role) - if needed

### Step 2: NextAuth.js B2C Provider

**File:** `src/app/api/auth/[...nextauth]/route.ts`

Add Azure AD B2C provider alongside existing Credentials provider:

```typescript
import AzureADB2CProvider from "next-auth/providers/azure-ad-b2c";

providers: [
  CredentialsProvider({ /* existing */ }),
  AzureADB2CProvider({
    tenantId: process.env.AZURE_AD_B2C_TENANT_ID,
    clientId: process.env.AZURE_AD_B2C_CLIENT_ID,
    clientSecret: process.env.AZURE_AD_B2C_CLIENT_SECRET,
    primaryUserFlow: process.env.AZURE_AD_B2C_PRIMARY_USER_FLOW,
  }),
]
```

### Step 3: User Creation/Linking Logic

**File:** `src/app/api/auth/[...nextauth]/route.ts` (signIn callback)

```typescript
async signIn({ user, account, profile }) {
  if (account?.provider === "azure-ad-b2c") {
    const providerId = profile?.sub || profile?.oid;
    
    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        authProvider: "azureadb2c",
        authProviderId: providerId,
      },
    });

    if (!existingUser) {
      // Create new user (invite-based for Client Admins)
      // Or link to existing Candidate record
    }
  }
  return true;
}
```

### Step 4: Client Portal Routes

**Files:**
- `src/app/client/page.tsx` - Client dashboard
- `src/app/client/users/page.tsx` - User management (Client Admin only)
- `src/app/client/candidates/page.tsx` - Candidate management

### Step 5: Invite Flow for Client Admins

**File:** `src/app/api/admin/invite-client-admin/route.ts`

- Platform Admin creates invite
- Invite contains clientId and role
- B2C user signs up with invite code
- User is automatically assigned to client

### Step 6: Role Restrictions

**File:** `src/lib/auth.ts` (extend)

```typescript
export function isExternalUser(user: SessionUser): boolean {
  return !user.isInternal;
}

export function validateExternalUserRole(role: Role): void {
  const externalRoles = [Role.CLIENT_ADMIN, Role.CLIENT_USER, Role.CANDIDATE];
  if (!externalRoles.includes(role)) {
    throw new Error("External users cannot have internal roles");
  }
}
```

## Environment Variables

```env
# Azure AD B2C
AZURE_AD_B2C_TENANT_ID="your-tenant-id"
AZURE_AD_B2C_CLIENT_ID="your-client-id"
AZURE_AD_B2C_CLIENT_SECRET="your-client-secret"
AZURE_AD_B2C_PRIMARY_USER_FLOW="B2C_1_signup_signin_client"
AZURE_AD_B2C_AUTHORITY="https://your-tenant.b2clogin.com/your-tenant.onmicrosoft.com/B2C_1_signup_signin_client"
```

## Security Considerations

1. **Role Restrictions**: External users (B2C) can only be assigned external roles
2. **Tenant Isolation**: Client Admins can only manage users within their client
3. **Invite-Only**: Client Admins created via invite flow only
4. **Email Verification**: B2C handles email verification automatically
5. **Password Policy**: Enforced by B2C user flows

## Testing Strategy

1. **B2C Sign-up Flow**: Test Client Admin invite and registration
2. **B2C Sign-in Flow**: Test existing B2C user login
3. **Tenant Isolation**: Verify Client Admin cannot access other clients
4. **Role Restrictions**: Verify external users cannot be promoted to internal roles
5. **Multi-Provider**: Verify Credentials and B2C can coexist

## Migration Path

1. Phase 1 remains unchanged (Credentials provider for internal users)
2. B2C provider added alongside Credentials
3. Existing internal users continue using Credentials
4. New external users use B2C
5. No disruption to Phase 1 functionality

## Future Enhancements

- Candidate self-registration portal
- SSO for internal users (optional)
- Multi-factor authentication
- Custom B2C policies for role assignment
- Client-specific branding in B2C flows

## Dependencies

- Azure AD B2C tenant (to be created)
- B2C application registration
- User flow configuration
- Custom claims (if needed for clientId/role)

## Timeline Estimate

- **B2C Setup**: 1-2 days (Azure configuration)
- **NextAuth Integration**: 2-3 days
- **Client Portal**: 3-4 days
- **Invite Flow**: 2-3 days
- **Testing & Polish**: 2-3 days
- **Total**: ~10-15 days

## Success Criteria

- ✅ Client Admins can register via B2C invite
- ✅ Client Admins can manage Client Users (within their client)
- ✅ Client data isolation working
- ✅ External users cannot access internal roles
- ✅ Credentials provider still works for internal users
- ✅ Multi-provider authentication working correctly

