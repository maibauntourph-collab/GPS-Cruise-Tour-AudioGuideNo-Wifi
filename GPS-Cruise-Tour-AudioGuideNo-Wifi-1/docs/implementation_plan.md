# Admin Site & Backend Debugging Plan (Avengers)

This plan addresses several critical issues discovered during the initial diagnostic:
1. **Massive Hardcoded Storage**: `storage.ts` is 1.1MB with 8,000+ lines of hardcoded data.
2. **Hybrid Storage Risks**: Mixing `MemStorage` for core data and `db` (Drizzle) for session-based data.
3. **Admin API Security**: Verification of authentication/authorization for critical `/api/admin` routes.

## User Review Required

> [!IMPORTANT]
> **Technical Debt Warning**: The system currently uses an 8,000-line hardcoded data file (`storage.ts`). While functional, this slows down development and increases the risk of memory exhaustion. We plan to fix bugs within this structure for now but suggest moving this data to a proper database in the future.

## Proposed Changes

### Backend Recovery (AI Avengers)

#### [MODIFY] [storage.ts](file:///Users/kwangseobpark/skills-gps/skills-nowifigps.tours/GPS-Cruise-Tour-AudioGuideNo-Wifi-1/server/storage.ts)
- **Query Master Audit**: Check for ID collisions and redundant data.
- **Server Park Check**: Ensure `MemStorage` methods correctly handle DB failures as fallbacks.
- **Dr. Automation**: Research ways to modularize the 8,000 lines if performance degrades.

#### [MODIFY] [routes.ts](file:///Users/kwangseobpark/skills-gps/skills-nowifigps.tours/GPS-Cruise-Tour-AudioGuideNo-Wifi-1/server/routes.ts)
- Verify that only `admin` users can access `/api/admin/*` routes.
- Fix any potential logic errors in the `import/export` and `audio-generation` endpoints.

### Admin UI Polishing

#### [MODIFY] [Admin.tsx](file:///Users/kwangseobpark/skills-gps/skills-nowifigps.tours/GPS-Cruise-Tour-AudioGuideNo-Wifi-1/client/src/pages/Admin.tsx)
- Ensure the CRUD operations correctly reflect the backend state.
- Improve error handling for large data imports.

## Verification Plan

### Automated Tests
- `npm run test` (if available)
- Verify `/api/admin/stats` returns consistent data.

### Manual Verification
1. Log in as Admin.
2. Create/Update a city and landmark.
3. Restart server and verify persistence (Note: `MemStorage` data might reset for hardcoded items, but DB items should persist).
4. Run an Export and verify the JSON structure.
