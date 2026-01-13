# Tag — Jewelry Ticket Scanner

**URL:** `tag.ourdomain.com`

Internal tool for jewelry pricing calculations — scan tags, calculate sell/buy/trade prices, handle multi-piece transactions with smart margin optimization.

---

## Core Pricing Logic

**Sell:** `(Gold Price + Manufacturing + Markup) × Weight`

**Buy:** `(Gold Price × Weight) − deduction %`

**Trade:** Sell + Buy combined, deduction typically 0% (to stay halal)

**Multiple pieces:** Sum of all ins, sum of all outs

---

## Piece Types

| Type | COGS Source | Notes |
|------|-------------|-------|
| **Italian** | USD (converted to EGP) | Default ~50 USD, can use live FX API |
| **Egyptian** | EGP (direct) | Directly on ticket |
| **Used** | Predefined average | Uses avg COGS + Markup of Italian/Egyptian (no ERP API access) |

### Light Piece Modifier

- **Checkbox: "Light Piece"**
- Light pieces have very low weight → need higher markup to maintain sane margins
- When checked, uses predefined higher markup values

---

## Karat Defaults

| Item | Default Karat |
|------|---------------|
| **Pieces (jewelry)** | 18K |
| **Coins** | 21K |
| **Ingots** | 24K |

*All karat values overridable per piece in confirmation form*

---

## Coins & Ingots: BTC vs Others

| Source | Buy Deduction | Sell Pricing | Notes |
|--------|---------------|--------------|-------|
| **BTC (Bullion Trading Center)** | 0% | Fixed markup + cashback | Has buyback program, packaged vs unpackaged matters |
| **Other** | Treated as scrap | Standard calc | Normal deduction applies |

### BTC Price Data Schema

Will be stored in DB/CSV with columns:
- `category` (السبائك, خواتم, كيلو, هدايا, etc.)
- `weight_grams`
- `markup` (المصنعية + الدمغة)
- `cashback_packaged`
- `cashback_unpackaged`
- `karat` (default 24K for most)

*Source: BTC publishes price sheets — will need periodic updates*

---

## Inputs

- **Today's Gold Price:** Manual input (Egyptian market can deviate), but can pull from API as a starting suggestion
- **FX Rate (USD/EGP):** Live API or manual override

---

## Rounding Rules

| Transaction | Direction | Target | Example |
|-------------|-----------|--------|---------|
| **Sell** | Round UP | Nearest 10 | 4,823 → 4,830 |
| **Buy** | Round DOWN | Nearest 10 | 4,837 → 4,830 |

Goal: Clean numbers, not aggressive — just enough to safeguard margins on sell, fair on buy.

---

## Multi-Piece Transactions

### Master Slider + Locks

- **Master slider:** Adjusts all unlocked pieces together
- **Lock toggle per piece:** Lock a price when customer has agreed/negotiated
- Only unlocked pieces move with master slider

### Smart Distribution Logic

When moving master slider down:
1. All unlocked pieces decrease together proportionally
2. When a piece hits its COGS floor → it locks automatically
3. Remaining unlocked pieces move faster to compensate
4. Warning shown when approaching/hitting floors

*(Same logic in reverse when sliding up)*

### View Modes

| Mode | Shows | Use Case |
|------|-------|----------|
| **Customer view** | Total gross price + recommended markup/profit | Less friction, customer-facing |
| **Internal view** | COGS vs Markup breakdown per piece | Seller knows real floor, can go below recommended but rarely below COGS |

### Enforcement

- **No hard blocks** — this is an assistant, not connected to ERP
- **Warnings only:**
  - Below recommended price
  - At/near COGS (danger zone)
  - Below COGS (losing money)

---

## Trade Transactions Summary

For trades (sell + buy combined):
- **Total IN:** Sum of pieces coming in (customer's)
- **Total OUT:** Sum of pieces going out (yours)
- **Net difference:** What customer pays or receives
- **Overall margin:** Profit/loss on whole deal

### Slider/Bar

- **Default position:** Recommended price (calculated from formulas)
- **Adjustable:** Slide up/down to adjust final price

### Slider Markers

- **Gold price** — Base gold value
- **COGS** — Manufacturing/cost layer
- **Markup** — Your margin layer
- **% Gain/Loss** — Live indicator showing profit/loss at current slider position

### Customer Mode

- **Hideable controls** — Toggle to hide slider/adjustment UI when showing screen to customer
- Prevents customers from seeing flexibility and demanding pure breakeven/gross price
- Clean display shows only final price

---

## Tech Stack

### Frontend
- **Framework:** Next.js / React (TypeScript) — webapp, mobile-responsive
- **Camera:** Browser `getUserMedia` API (works on iOS Safari + Android Chrome)

### Backend
- **Platform:** Convex (TypeScript-native, real-time)
- **Auth:** Convex + Better Auth component
  - Email/password
  - Phone number
  - Username/password
  - Simple internal tool auth — can expand later if productized
- **OCR + AI Processing:** Gemini 2.0 Flash
  - Receives cropped tag image from frontend
  - Runs OCR + structured output extraction
  - Returns structured data to frontend

### External APIs

**Gold Price:**
| Option | Free Tier | Notes |
|--------|-----------|-------|
| **goldpricez.com** | 30-60 req/hr | Supports gram/oz/kg/tola, karat conversions (24K-10K) built-in |
| **metals.dev** | 100 req/month | 60s delay, simple REST |
| **MetalpriceAPI** | Free tier available | Gold + 150 currencies |

*Recommendation: goldpricez.com — request price per gram directly, with karat. Cache locally, user can override*

**FX Rate (USD → EGP):**
| Option | Free Tier | Notes |
|--------|-----------|-------|
| **ExchangeRate-API** | No key required, 1 req/day | Open access, simple |
| **exchangerate.host** | Free | Lightweight, reliable |
| **fawazahmed0/exchange-api** (GitHub) | Unlimited, no key | Community maintained |

*Recommendation: ExchangeRate-API open access — cache for 24hrs*

### Gold Price Override Logic

```
1. On app load / daily:
   - Fetch gold price from API
   - Store as "suggested price" with timestamp

2. User can:
   - Accept suggested price (auto-fills)
   - Manually override anytime from dashboard
   - Override persists until:
     a) 24 hours pass (then prompts to refresh)
     b) User manually changes again

3. Display:
   - Show "Last updated: X hours ago"
   - Warning if > 24 hours stale
   - "Refresh from API" button always available
```

---

## Constraints & Scope

- **Currency:** EGP only
- **Online required:** Webapp, core logic needs connectivity
- **Warnings:** Minimal — red warning block when below COGS
- **History/receipts:** V2 (not crucial for now)
- **Multi-user:** Yes — personal use first, others can join later (shared shop/team access)

---

## UI Requirements

### Localization (i18n)
- **Languages:** Arabic (RTL) + English (LTR)
- **Toggle:** Easy switch in header/settings, persists
- **Library:** `next-intl` or similar

### Theme
- **Light mode** + **Dark mode**
- **Toggle:** Easy switch, persists (localStorage)
- **Library:** Tailwind dark mode or CSS variables

---

## Predefined Values (Hardcoded Backend Globals)

*No .env needed — just hardcode in backend as global constants. Update in code when business values change.*

```typescript
// config.ts — hardcoded globals

export const GOLD_CONFIG = {
  // Italian COGS default (USD)
  italianCogsUsd: 50,
  
  // Light piece markup multiplier
  lightPieceMarkupMultiplier: 2.0, // TBD
  
  // Used gold defaults
  usedGold: {
    avgCogsEgp: 150,      // TBD - average of IT/EG
    avgMarkup: 100,       // TBD
  },
  
  // Deduction defaults
  deduction: {
    default: 0.02,        // 2%
    min: 0.01,            // 1%
    max: 0.03,            // 3%
    trade: 0.00,          // 0% for halal trades
  },
  
  // Fix pricing
  fixes: {
    min: 250,
    max: 500,
  },
  
  // Rounding
  rounding: {
    nearest: 10,
  },
  
  // Gold price staleness
  goldPriceMaxAgeHours: 24,
} as const;
```

---

## Decision Tree (Pricing Logic)

Core logic organized as case statements — but use `if`/`try`/helpers where it makes sense. The point is clarity, not rigidity.

### Data Models

```typescript
// Item — each piece in a transaction, mutable/live
interface Item {
  id: string;
  
  // From OCR / manual entry
  origin: 'IT' | 'EG' | 'LX' | 'USED';
  weight: number;          // grams
  karat: 18 | 21 | 24;
  cogsFromTag?: number;    // missing for used
  sku?: string;
  
  // Derived / adjustable
  category: 'JEWELRY' | 'COIN' | 'INGOT' | 'FIX';
  source?: 'BTC' | 'OTHER';  // for coins/ingots
  isLightPiece: boolean;
  isPackaged?: boolean;      // BTC only
  
  // Pricing state (live)
  calculatedPrice: number;
  adjustedPrice: number;     // after slider
  isLocked: boolean;         // locked from master slider
  
  // Reference
  tagImageUrl?: string;      // cropped tag image
}

// Transaction — mutable, holds items
interface Transaction {
  id: string;
  type: 'SELL' | 'BUY' | 'TRADE' | 'FIX';
  
  items: Item[];
  
  // For BUY/TRADE
  deductionPercent: number;  // 0-3%, 0 for trade
  
  // Totals (computed live)
  totalIn: number;           // what we receive
  totalOut: number;          // what we give
  netAmount: number;         // customer pays/receives
  totalMargin: number;       // our profit
  marginPercent: number;
  
  // State
  goldPricePerGram: Record<number, number>;  // karat -> price
  fxRate: number;            // USD -> EGP
}
```

### Main Logic (Case-Based)

```typescript
function calculateItemPrice(item: Item, tx: Transaction): number {
  const goldPrice = tx.goldPricePerGram[item.karat];
  
  switch (tx.type) {
    case 'SELL':
      return calculateSellPrice(item, goldPrice, tx.fxRate);
    
    case 'BUY':
      return calculateBuyPrice(item, goldPrice, tx.deductionPercent);
    
    case 'TRADE':
      // Sell + Buy combined, deduction = 0
      // handled at transaction level
      break;
    
    case 'FIX':
      return calculateFixPrice(item, goldPrice);
  }
}

function calculateSellPrice(item: Item, goldPrice: number, fxRate: number): number {
  let cogs: number;
  let markup: number;
  
  switch (item.origin) {
    case 'IT':
    case 'LX':  // LX treated as Egyptian
      if (item.origin === 'IT') {
        cogs = (item.cogsFromTag ?? CONFIG.italianCogsUsd) * fxRate;
      } else {
        cogs = item.cogsFromTag ?? CONFIG.usedGold.avgCogsEgp;
      }
      markup = item.isLightPiece ? CONFIG.lightPieceMarkup : CONFIG.standardMarkup;
      break;
    
    case 'EG':
      cogs = item.cogsFromTag ?? CONFIG.usedGold.avgCogsEgp;
      markup = item.isLightPiece ? CONFIG.lightPieceMarkup : CONFIG.standardMarkup;
      break;
    
    case 'USED':
      cogs = CONFIG.usedGold.avgCogsEgp;
      markup = CONFIG.usedGold.avgMarkup;
      break;
  }
  
  // Special handling for BTC coins/ingots
  if (item.source === 'BTC') {
    const btcData = lookupBtcPrice(item.category, item.weight);
    return (goldPrice + btcData.markup) * item.weight;  // no rounding for BTC
  }
  
  const rawPrice = (goldPrice + cogs + markup) * item.weight;
  return roundUp(rawPrice, CONFIG.rounding.nearest);
}

function calculateBuyPrice(item: Item, goldPrice: number, deduction: number): number {
  // BTC has 0% deduction + cashback
  if (item.source === 'BTC') {
    const btcData = lookupBtcPrice(item.category, item.weight);
    const cashback = item.isPackaged ? btcData.cashbackPackaged : btcData.cashbackUnpackaged;
    return (goldPrice - cashback) * item.weight;
  }
  
  const baseValue = goldPrice * item.weight;
  const afterDeduction = baseValue * (1 - deduction);
  return roundDown(afterDeduction, CONFIG.rounding.nearest);
}

function calculateFixPrice(item: Item, goldPrice: number): number {
  // Flat fee, no slider
  const flatFee = CONFIG.fixes.default;  // 250-500, user picks
  const addedGoldCost = (item.weightAdded ?? 0) * goldPrice;
  return flatFee + addedGoldCost;
}
```

*This is pseudocode — adapt as needed. The key: case statements for main branches, helpers for shared logic, everything operates on mutable Item/Transaction objects.*

---

## Features / Requirements

### Fixes / Custom Pieces

- **Basic fixes:** Flat fee 250–500 EGP (no slider needed)
- **If piece gets heavier:** Add extra gold price on top of fix fee
- **Custom work:** Deferred (much later)

---

## Tag Scanning Workflow

### Tag Colors (Validation)

| Color | Origin | Notes |
|-------|--------|-------|
| **White** | Italian | Standard |
| **Orange** | Italian | Legacy (expensive pieces), being phased out — treat same as IT |
| **Light Blue** | Egyptian | |
| **Pink** | Used gold | No COGS printed (pure profit margin). Can be EG or IT origin — rely on text + user confirmation. Starting point = predefined avg cost for Italian or Egyptian |

Colors used as validation warning only — user can override in confirmation form.

### Tag Data Fields (from OCR)

**Layout (consistent across all tags):**
```
W [weight]         K[karat]
  [barcode]        [origin]
[SKU]              [COGS]
```

| Field | Position | Example | Notes |
|-------|----------|---------|-------|
| **Weight** | Top left, after "W" | W 4.380, W 2.090, W 1.870 | Always has "W" prefix |
| **Karat** | Top right | K18 | Always has "K" prefix |
| **Origin** | Right of barcode | IT, EG, LX | See codes below |
| **SKU** | Bottom left | 16000093, 8001426, 46000035 | Barcode number |
| **COGS** | Bottom right | 12.50, 210, 15 | Missing on pink/used tags |

### Origin Codes

| Code | Meaning | Treatment |
|------|---------|-----------|
| **IT** | Italian | Italian pricing (COGS in USD) |
| **T** | Italian (partial read) | Treat as IT — barcode often obscures the "I" |
| **EG** | Egyptian | Egyptian pricing (COGS in EGP) |
| **LX** | Egyptian Lux | Internal code — treat as Egyptian |

*Note: Origin text can get obscured by barcode — OCR may need cleanup*

### OCR Pipeline

1. **Gemini OCR** — Extract structured data from tag image
2. **User confirmation** — All fields editable before calculation, cropped tag image visible

### OCR Hints for Auto-Detection

| Hint | Inference |
|------|-----------|
| Tag color = pink | Used gold |
| Tag color = white/orange | Italian |
| Tag color = light blue | Egyptian |
| COGS field missing/blank | Used gold |
| COGS present | New piece |

### Scanning Process

1. **Capture** — Camera captures tag
2. **Crop** — Auto-crop around tag to reduce OCR errors
3. **Save crop** — Store cropped tag image with transaction
4. **OCR** — Gemini extracts: weight, karat, origin, COGS, SKU
5. **Confirmation Dialog** — User reviews/edits all fields, cropped tag visible
6. **Confirm** — Proceed to pricing with sliders

### Tag Image in UI

- Cropped tag image displayed alongside form fields throughout transaction
- Helps user verify OCR results without looking back at physical piece
- Easier debugging if OCR completely missed or cropped out info
- Image persists through multi-piece transactions

### Fallback

- Manual entry mode (no camera) — always available as fallback
