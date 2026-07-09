# Security Specification for CSCM Portal (Firestore Rules Validation)

This specification defines the data invariants, 12 malicious payloads ("Dirty Dozen") designed to compromise the database, and the rules needed to block them.

## 1. Data Invariants

1. **Required Authentication**: All reads and writes to `enterprises` and `users` require a valid Firebase Auth session (`request.auth != null`).
2. **Enterprise Schema Integrity**:
   - `id` must be an integer (stored as `number` in rules).
   - `name` must be a string with a size between 1 and 256 characters.
   - `memberNo` must be a string with a size between 1 and 64 characters.
   - Optional fields like `email`, `telephone`, `ville`, `secteur` must conform to strict size constraints (e.g., `< 256` characters) to prevent Denial of Wallet memory/storage exhaustion.
3. **User Profile Schema Integrity**:
   - `id` must match the document ID.
   - `role` must be one of `'ADMIN'`, `'MODERATEUR'`, or `'MEMBRE'`.
   - Modifying own role from client SDKs is strictly forbidden.
4. **No Blanket Reads**: Every query or snapshot listener must run under an authenticated session context. No public/anonymous unauthenticated API key scraper can download the database.

---

## 2. The "Dirty Dozen" Malicious Payloads

The following 12 attack vectors are designed to compromise data or exhaust database storage. All 12 MUST return `PERMISSION_DENIED` under the new security rules.

### Vector 1: Anonymous Write (Identity Spoofing)
An attacker tries to create a new company document without being authenticated.
- **Payload**: `{ "id": 999, "name": "Hacker Corp", "memberNo": "M999" }`
- **Context**: `request.auth == null`

### Vector 2: Role Escalation (Privilege Spoofing)
A standard member user tries to write a user profile with an `ADMIN` role.
- **Payload**: `{ "id": "u_attacker", "nom": "Attacker", "prenom": "User", "email": "attacker@cscm.com", "role": "ADMIN" }`
- **Context**: `request.auth.uid == "u_attacker"` but they are not an approved administrator.

### Vector 3: Giant String Injection (Denial of Wallet / Resource Exhaustion)
An attacker injects a 5MB string into the `name` field of an enterprise to exhaust the Firestore free storage limits.
- **Payload**: `{ "id": 100, "name": "[5MB of repeating characters...]", "memberNo": "M100" }`

### Vector 4: Ghost Field Injection (Shadow Update)
An attacker tries to inject unapproved properties (`isVerified_hack: true`) to bypass enterprise portal validation.
- **Payload**: `{ "id": 1, "name": "SeneAgro Sahel", "memberNo": "M001", "isVerified_hack": true }`

### Vector 5: ID Poisoning (Path Variable Attack)
An attacker tries to create a document with an extremely long ID containing malicious path traversal or special characters.
- **Path**: `/enterprises/../../maliciousPath` or a 10KB string document ID.

### Vector 6: Negative Treasury / Zero Amount Exploit (Value Poisoning)
An attacker tries to submit a negative amount or a null value for a cotisation.
- **Payload**: `{ "id": 1, "name": "SeneAgro Sahel", "memberNo": "M001", "cotisations": [{ "date": "2026-07-09", "label": "Cotisation Hack", "amount": -100000 }] }`

### Vector 7: User Status Privilege Bypass
An attacker tries to transition their user status to `'Actif'` without administrative approval.
- **Payload**: `{ "id": "u_attacker", "nom": "Attacker", "prenom": "User", "email": "attacker@cscm.com", "role": "MEMBRE", "status": "Actif" }`

### Vector 8: Enterprise Overwrite by Non-Owner / Unverified Account
An unverified user tries to delete an active enterprise from the database.
- **Operation**: `delete` on `/enterprises/1`
- **Context**: Unverified email or not authenticated.

### Vector 9: Orphaned Record Creation
Creating an enterprise with an empty or non-existent Member ID.
- **Payload**: `{ "id": 101, "name": "Ghost Corp" }` (missing `memberNo`).

### Vector 10: Timestamp Spoofing
Injecting a future client timestamp for `dateAdhesion` instead of a server-validated timestamp structure.

### Vector 11: PII Leakage (Unrestricted Read)
An unauthenticated viewer attempts to perform a raw collection-wide download of all user details including emails and passwords.
- **Operation**: `list` on `/users`
- **Context**: `request.auth == null`

### Vector 12: Type Substitution (Booleans for Strings)
Replacing the `name` text field with a boolean `true` value.
- **Payload**: `{ "id": 1, "name": true, "memberNo": "M001" }`

---

## 3. Test Cases (Verification Blueprint)

We will verify that these return `PERMISSION_DENIED` through our highly hardened Firestore security rules using:
1. Complete validation helper checks for both `create` and `update`.
2. Exact map key-size restrictions.
3. Size limits on strings.
