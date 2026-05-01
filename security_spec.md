# Security Specification - Lexis Workspace

## 1. Data Invariants
- A `User` profile can only be created and managed by the authenticated user matching the UID.
- A `Page` must have an `ownerId`.
- Only the `ownerId` of a `Page` can archive, delete, or change its `isPublished` status.
- If a `Page` is NOT `isPublished`, only the `ownerId` can read or write to it and its subcollections (`updates`, `presences`).
- If a `Page` IS `isPublished`, any authenticated or anonymous user can read and write to its `updates` and `presences` subcollections.
- `updates` must contain a valid `userId` matching `request.auth.uid`.
- `presences` must contain a valid `uid` matching `request.auth.uid`.

## 2. The "Dirty Dozen" Payloads (Red Team Test Cases)

1. **Identity Spoofing**: Attempt to create a user profile with a different UID.
2. **Page Hijacking**: Attempt to update another user's page `ownerId`.
3. **Unauthorized Read**: Attempt to read a private `isPublished: false` page from another account.
4. **Unauthorized Update**: Attempt to change `isPublished` to `true` on another user's page.
5. **Ghost Update**: Attempt to push a Yjs update with a `userId` that doesn't match the current user.
6. **Presence Forgery**: Attempt to create a presence document for another user's UID.
7. **Junk ID Poisoning**: Attempt to create a page with a 1MB string as the ID.
8. **Shadow Field Injection**: Attempt to add `isAdmin: true` to a page document.
9. **Relational Sync Bypass**: Attempt to create an `update` for a page that doesn't exist.
10. **Immutable Field Attack**: Attempt to change the `createdAt` timestamp on an existing page.
11. **PII Leak**: Attempt to list all users in the `users` collection.
12. **Status Shortcutting**: Attempt to un-archive a page without being the owner.

## 3. Test Runner Plan
The `firestore.rules.test.ts` will verify these 12 cases return `PERMISSION_DENIED`.
