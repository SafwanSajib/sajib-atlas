# Commerce Foundation (Phase 7C)

**Architecture Baseline:** V10.6  
**Status:** Implemented  
**Code:** `src/lib/commerce/`  
**Verifier:** `npm run verify:phase7c`

Commerce records commercial intent and acquisition. It is not payment
processing, not checkout, and not the access authority.

```text
Product
        ↓
Order  →  Payment   (supports the order; never grants access)
        ↓
Purchase
        ↓
Entitlement Grant Proposal
        ↓
Entitlement  (Phase 7B)
        ↓
Access Decision
```

## Identities

| Record | Id | Status |
| --- | --- | --- |
| Product | opaque Phase 1I token | `draft` \| `active` \| `archived` |
| Order | `order/{opaque}` | `pending` \| `confirmed` \| `cancelled` \| `failed` |
| Purchase | `purchase/{opaque}` | `completed` \| `cancelled` \| `failed` |
| Payment | `payment/{opaque}` | `initiated` \| `authorized` \| `captured` \| `failed` \| `cancelled` \| `refunded` |

Product types: `one_time` | `subscription` (no recurring billing).

Learner identity is Phase 7A `learner/local`.

## Grant proposal

Only a **completed** purchase of a **confirmed** order for an **active**
product may call `proposeEntitlementGrantFromPurchase`. The result is a
Phase 7B `EntitlementGrantProposal` with `source: purchase` or
`subscription`. It does not persist and does not call `decideAccess`.

## Invariants

- Payment ≠ Access
- Purchase ≠ Access
- Commerce ≠ Identity
- Entitlement remains access authority
- Orders have no amount, currency, or card fields
- Public payment reads omit provider, amount, and secrets

## What it does not do

- Payment gateway / SDK
- Checkout UI, pricing UI, subscriptions billing
- Webhooks, invoices, refunds
- Database persistence
- HTTP `/api/products`, `/api/orders`, `/api/checkout`
- Authentication
