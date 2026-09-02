# Identity Foundation (Phase 7A)

**Architecture Baseline:** V10.6  
**Status:** Implemented  
**Code:** `src/lib/identity/`  
**Verifier:** `npm run verify:identity`

Identity is the canonical learner-identity boundary. It is not
authentication, not `LearnerProfile`, not learner state, not entitlement,
and not commerce.

```text
Authentication Provider (not implemented)
        ↓
Authentication Result
        ↓
Identity Resolution
        ↓
Canonical Learner Identity
        ↓
Learner Profile / Goals / Intelligence
```

## Authority

Canonical local identity remains `learner/local`. Phase 1G
`LearnerProfile` / `LearnerGoal` consume that id. Learner Intelligence
continues to use `learner/local`. Local state remains
`sajib_atlas_learner_state`.

Identity owns `LOCAL_LEARNER_ID`. `src/lib/learner/` re-exports it.

## Active mode

Only `local` is active.

| Mode | Status in 7A |
| --- | --- |
| `local` | Active. Resolves to `learner/local` |
| `authenticated` | Structural only. `learner/{opaque-id}` is representable, not generated |
| `external` | Structural only. Provider subject is not canonical `learnerId` |

Lifecycle status vocabulary is `active` \| `disabled`. Local resolution
always returns `active`. Status does not change current local behavior.

## Public read

JSON-safe `{ learnerId, mode, status }`.

Not exposed: email, phone, provider subject, tokens, cookies, credentials,
secrets, session ids, or internal mappings.

## What it does not do

- Authentication providers, OAuth, Auth.js, Clerk, Firebase, Supabase
- Sessions, JWT, cookies for auth, login/logout/account UI
- User database, persistence, or replacement of `sajib_atlas_learner_state`
- Entitlement enforcement or commerce
- HTTP `/api/auth`, `/api/identity`, `/api/user`
- Local → authenticated state migration (contract only)

## Migration contract

`describeLocalToAuthenticatedMigration` describes a future local →
authenticated move. It does not copy, merge, delete, or persist state.
`implemented` is `false`.
