# Security Specification — AMORA Unlocked Endings Persistence

## 1. Data Invariants
1. Every document at `/userProgress/{userId}` belongs strictly to the verified authenticated user whose `request.auth.uid == userId`.
2. `unlockedEndings` may never exceed 4 elements and may only contain values from `['ALL_FIGHT', 'ALL_SPARE', 'MIXED', 'SECRET_PIRATE']`.
3. `uid` is immutable after creation (`incoming().uid == existing().uid`) and must match `request.auth.uid`.
4. `updatedAt` must always equal `request.time` (server timestamp).

## 2. Dirty Dozen Adversarial Payloads (Expected: PERMISSION_DENIED)
1. Unauthenticated read on `/userProgress/user123`.
2. Unauthenticated write on `/userProgress/user123`.
3. Cross-user read: user A reading `/userProgress/userB`.
4. Cross-user create: user A creating `/userProgress/userB` with `uid: 'userB'`.
5. Identity spoofing: user A creating `/userProgress/userA` with `uid: 'userB'`.
6. Ghost shadow field injection: `{ uid: 'userA', playerName: 'AMORA', unlockedEndings: [], updatedAt: serverTime, isAdmin: true }`.
7. Invalid ending enum poisoning: `unlockedEndings: ['HACKED_ENDING']`.
8. Unbounded array exhaustion: `unlockedEndings` with 5+ entries.
9. Oversized `playerName` (> 24 chars) or empty string (`""`).
10. Client-forged `updatedAt` timestamp instead of `request.time`.
11. Modifying `uid` on update (`{ uid: 'otherUser' }`).
12. Collection-wide `list` query on `/userProgress` or oversized `userId` (> 128 chars / invalid characters).
