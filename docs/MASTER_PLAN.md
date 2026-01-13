# Tag Scanner — Jewelry Ticket Scanner

**URL:** `scan.shop-royalgold.com`

Internal tool for jewelry pricing calculations — scan tags, calculate sell/buy/trade prices, handle multi-piece transactions with adjustable markup.

---

## Core Pricing Logic (UPDATED)

**Formula:**
```
Floor       = GoldValue + COGS     (break-even point)
Margin      = Markup × Multiplier  (your profit)
SellPrice   = Floor + Margin       (rounded up to nearest 10)
BuyPrice    = GoldValue × (1 - deduction)  (rounded down to nearest 10)
```

**Multiplier (slider):**
- 0% = break-even (selling at floor, no profit)
- 100% = standard pricing (full markup)
- 150% = premium pricing

**Multiple pieces:** Sum of all IN items, sum of all OUT items

---

## Piece Types

| Type | COGS Source | Default COGS |
|------|-------------|--------------|
| **Italian (IT)** | USD × FX rate | 50 USD/g |
| **Egyptian (EG)** | EGP direct | 100 EGP/g |
| **Lux (LX)** | EGP direct | 120 EGP/g |
| **Used** | Predefined average | 150 EGP/g |

### Light Piece Modifier
- Light pieces (low weight) get 2× markup multiplier
- Compensates for proportionally higher handling costs

---

## Karat Defaults

| Item | Default Karat |
|------|---------------|
| **Jewelry** | 18K |
| **Coins** | 21K |
| **Ingots** | 24K |

---

## Transaction Types

| Type | Description | IN/OUT |
|------|-------------|--------|
| **SELL** | Shop sells to customer | OUT only |
| **BUY** | Shop buys from customer | IN only |
| **TRADE** | Exchange (0% deduction on IN) | IN + OUT |
| **FIX** | Repair service | Flat fee + added gold |

### Deduction (BUY transactions)
- Default: 2%
- Range: 0-3%
- Trade: 0% (halal)

---

## Simplified Slider Model (CHANGED)

**Previous (removed):**
- Per-item sliders + locks
- Smart distribution when items hit floor
- Master slider affecting unlocked items only

**Current:**
- Single `markupMultiplier` slider (0-150%)
- Affects ALL OUT items proportionally
- Slider only controls markup, not gold value or COGS
- Floor (gold + COGS) is always preserved

**Rationale:** Simpler for staff, fewer mistakes, consistent behavior.

---

## Warning Levels

| Level | Condition | Color |
|-------|-----------|-------|
| **safe** | Margin > 3% | Green |
| **warning** | Margin 1-3% | Yellow |
| **danger** | Margin < 1% | Orange |
| **loss** | Margin ≤ 0 | Red |

---

## Customer Mode

Toggle to hide:
- Markup slider
- Margin display
- Internal pricing details

Shows only final price to customer.

---

## Tech Stack

### Frontend
- **Framework:** Next.js 16 (TypeScript)
- **UI:** Tailwind + shadcn/ui
- **Camera:** Browser getUserMedia API
- **i18n:** next-intl (Arabic RTL + English)
- **Theme:** Dark/Light mode

### Backend
- **Platform:** Convex
- **Auth:** BetterAuth (email/password, Google OAuth pending)
- **OCR:** Gemini 2.0 Flash (structured output)

### Deployment
- **Frontend:** Dokploy (auto-deploy on push)
- **Backend:** Convex Cloud

---

## Config Values

```typescript
export const GOLD_CONFIG = {
  italianCogsUsd: 50,
  egyptianCogsEgp: 100,
  luxCogsEgp: 120,
  
  lightPieceMarkupMultiplier: 2.0,
  standardMarkupEgp: 150,
  
  usedGold: {
    avgCogsEgp: 150,
    avgMarkupEgp: 100,
  },
  
  deduction: {
    default: 0.02,  // 2%
    min: 0.00,
    max: 0.03,      // 3%
    trade: 0.00,
  },
  
  markup: {
    min: 0.0,       // 0% = break-even
    max: 1.5,       // 150% = premium
    default: 1.0,   // 100% = standard
  },
  
  fixes: {
    minEgp: 250,
    maxEgp: 500,
    defaultEgp: 350,
  },
  
  rounding: {
    nearest: 10,
  },
  
  goldPriceMaxAgeHours: 24,
} as const;
```

---

## NOT Implemented (V2)

| Feature | Status | Notes |
|---------|--------|-------|
| BTC coin/ingot lookup | ❌ | Need price table |
| Gold price API | ❌ | Manual input only |
| FX rate API | ❌ | Manual input only |
| Transaction history | ❌ | No persistence yet |
| Receipts | ❌ | No printing |
| Per-item locks | ❌ | Removed (simplified) |

---

## OCR Pipeline

1. Camera captures tag
2. Gemini 2.0 Flash extracts: weight, karat, origin, COGS, SKU
3. User confirms/edits in dialog
4. Item added to transaction

### Origin Detection
- From tag text: IT, T (=IT), EG, LX
- From COGS value: < 100 likely IT (USD), > 100 likely EG (EGP)
- User can override

---

## Known Issues to Fix

1. **COGS unit ambiguity** - Is cogsFromTag per-gram or total?
2. **Category handling** - FIX/COIN/INGOT need explicit paths
3. **Missing gold price** - Can produce NaN, needs validation
4. **No audit trail** - Should snapshot pricing context per transaction
