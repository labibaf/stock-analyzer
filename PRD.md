# 📄 Product Requirements Document (PRD)
## Project: IDX Swing Analyzer (Saham Indonesia)

| Parameter | Detail |
|---|---|
| **Product Name** | **IDX Swing Analyzer** |
| **Target Market** | Bursa Efek Indonesia (IDX / BEI) |
| **Strategy Focus** | Swing Trading (Holding period 3 – 15 hari bursa) |
| **Tech Stack** | Next.js 15+ (App Router, TypeScript), Tailwind CSS, Lightweight Charts, `@google/genai`, `yahoo-finance2` |
| **Deployment Target** | Vercel (Hobby Plan — 100% Free Tier) |
| **AI Model** | Google Gemini 2.0 / 1.5 Flash (Google AI Studio — Free Tier) |
| **Document Version** | v1.0.0 (MVP Release) |

---

## 1. 🎯 Product Overview & Vision

### 1.1 Visi Produk
Menjadi asisten analisis *Swing Trading* saham Indonesia yang cepat, objektif, berorientasi pada manajemen risiko (*risk-to-reward*), serta **bebas dari halusinasi data harga** dengan menggabungkan komputasi matematika deterministik dan sintesis cerdas kecerdasan buatan (AI).

### 1.2 Target Pengguna (User Persona)
* **Retail Swing Trader**: Trader saham IDX yang memiliki kesibukan harian (pekerja kantoran / wirausaha) dan tidak bisa memantau pergerakan harga (*ticker tape*) setiap detik.
* **Kebutuhan Utama**:
  * Mengetahui apakah saham yang diincar sedang berada dalam posisi ideal untuk dibeli (*Buy on Weakness* di EMA/Support atau *Buy on Breakout*).
  * Memperoleh *trading plan* yang jelas: **Area Beli (Entry)**, **Target Profit 1 (TP1)**, **Target Profit 2 (TP2)**, dan **Titik Cut Loss (Stop Loss)** yang terukur.
  * Angka rekomendasi yang realistis dan mematuhi aturan fraksi harga bursa resmi (BEI).

---

## 2. ⚡ Masalah & Solusi (Problem & Value Proposition)

| Masalah yang Dihadapi Trader | Solusi dari IDX Swing Analyzer |
|---|---|
| **Analisis manual memakan waktu** (harus menarik garis trendline, cek RSI, MACD, dan EMA satu per satu). | **Instant Automated Technical Engine**: Menghitung seluruh indikator teknikal & level support/resistance kunci dalam < 1 detik. |
| **AI konvensional sering halu** (mengarang harga saham, keliru tanggal bursa, atau memberi harga di luar fraksi BEI). | **5-Layer Anti-Hallucination Framework**: AI tidak pernah menebak angka. Semua data dihitung secara matematis di server sebelum AI membuat narasi. |
| **Trading tanpa *Risk Management*** (sering boncos karena cut loss terlalu jauh atau target profit tidak rasional). | **ATR-Based Dynamic Risk Engine**: Menentukan Stop Loss berdasarkan volatilitas riil saham dan menghitung *Risk-to-Reward Ratio* (minimal 1:1.5 - 1:3). |
| **Biaya tools & AI mahal**. | **100% Free Stack**: Memanfaatkan free tier Next.js di Vercel, data Yahoo Finance, dan Gemini Flash Free API. |

---

## 3. 🧩 Cakupan Fitur (Scope of Features)

### 3.1 Phase 1: MVP (Current Scope)
1. **Search & Quick Ticker Selection**:
   * Input kode saham IDX (misal `BBRI`, `MEDC`, `ADRO`, `BBCA`).
   * Auto-formatting ke format Yahoo Finance (`.JK`).
   * Quick-access chips untuk saham-saham likuid populer (LQ45 / Big Caps).
2. **Interactive Candlestick Chart (Lightweight Charts)**:
   * Candlestick Chart harian interaktif berbasis HTML5 Canvas 60 FPS.
   * Overlay EMA 20 (kuning), EMA 50 (cyan), EMA 200 (ungu).
   * Volume Histogram dengan indikasi *Volume Surge*.
   * Garis Support dan Resistance kunci yang ditarik otomatis.
3. **Deterministic Technical Scorecard**:
   * **Trend Status**: *Strong Uptrend / Pullback in Uptrend / Sideways / Downtrend*.
   * **Momentum**: RSI 14 (Oversold, Bullish Zone, Overbought) & MACD Crossover status.
   * **Volume Confirmation**: Rasio volume terhadap SMA 20 (deteksi lonjakan volume).
   * **Volatility Risk**: Nilai ATR 14 (Average True Range) untuk menghitung batas nafas saham.
4. **Automated Swing Trade Plan Card**:
   * **Rekomendasi Aksi**: `BUY ON WEAKNESS`, `BUY ON BREAKOUT`, `WAIT AND SEE`, atau `AVOID`.
   * **Buy Zone**: Rentang harga beli ideal.
   * **Take Profit 1 & 2**: Target realistis berdasarkan resistance terdekat.
   * **Stop Loss**: Batas cut loss terukur berdasarkan level support dan fraksi ATR.
   * **Risk-to-Reward Ratio (R:R)**: Rasio keuntungan vs potensi kerugian (minimal 1:1.5).
   * **IDX Tick Size Compliance**: Semua angka dibulatkan sesuai aturan fraksi harga resmi BEI.
5. **AI Swing Copilot (Gemini Flash Free)**:
   * Menghasilkan sintesis narasi *Trading Thesis* dalam Bahasa Indonesia yang lugas.
   * Memberikan catatan *Key Catalysts & Warnings* (contoh: waspada rilis laporan keuangan, korelasi komoditas, dll.).
   * **Algorithmic Fallback**: Tetap berfungsi 100% menghasilkan trading plan meskipun tanpa API Key atau kuota habis.

### 3.2 Phase 2: Future Roadmap (Post-MVP)
* **Multi-Stock Screener**: Screening otomatis 800+ saham IDX (misal filter "EMA 20 Pullback + RSI < 50 + Volume Spike").
* **Foreign Flow Tracker**: Integrasi akumulasi/distribusi dana asing harian & mingguan.
* **Watchlist & Trading Journal**: Simpan setup saham favorit ke browser local storage.
* **Price Alert Webhook**: Notifikasi ke Telegram ketika harga menyentuh Buy Zone atau Cut Loss.

---

## 4. ⚙️ Spesifikasi Fungsional (Functional Requirements)

### FR-1: Ticker Parsing & Validation
* Sistem menerima input ticker 4 huruf kapital.
* Mengubah otomatis input (misal `bbri` -> `BBRI.JK`).
* Menampilkan pesan ramah jika kode saham tidak ditemukan di BEI.

### FR-2: Data Ingestion (OHLCV)
* Menarik minimal **200 hari bursa historis** untuk memastikan keakuratan perhitungan EMA 200.
* Format data: `time (timestamp/date)`, `open`, `high`, `low`, `close`, `volume`.

### FR-3: Mathematical Technical Calculations
* **EMA**:
  $$\text{EMA}_{\text{today}} = (\text{Price} \times \alpha) + (\text{EMA}_{\text{yesterday}} \times (1 - \alpha)), \quad \alpha = \frac{2}{N + 1}$$
* **RSI (14)**:
  $$\text{RSI} = 100 - \left(\frac{100}{1 + \text{RS}}\right)$$
* **ATR (14)**:
  $$\text{TR} = \max[(\text{High} - \text{Low}), |\text{High} - \text{Close}_{\text{prev}}|, |\text{Low} - \text{Close}_{\text{prev}}|]$$
* **Support / Resistance**:
  * Deteksi Swing Low terendah 20-60 hari untuk Support 1 & 2.
  * Deteksi Swing High tertinggi 20-60 hari untuk Resistance 1 & 2.

### FR-4: IDX Tick Size Rounding (Aturan BEI)
Setiap angka Entry, TP, dan SL wajib dibulatkan sesuai tabel:
```typescript
function roundToIDXTick(price: number): number {
  if (price < 200) return Math.round(price);
  if (price < 500) return Math.round(price / 2) * 2;
  if (price < 2000) return Math.round(price / 5) * 5;
  if (price < 5000) return Math.round(price / 10) * 10;
  return Math.round(price / 25) * 25;
}
```

### FR-5: AI Response Schema (Gemini API)
Respons AI diatur ketat dengan JSON Schema:
```json
{
  "recommendation": "BUY_ON_WEAKNESS | BUY_ON_BREAKOUT | WAIT_AND_SEE | AVOID",
  "setup_title": "string",
  "confidence_score": 85,
  "thesis": "string",
  "action_plan": {
    "buy_zone": "string",
    "tp1": 1950,
    "tp2": 2050,
    "sl": 1780,
    "risk_reward": "1:2.4",
    "est_days": "5-10 hari bursa"
  },
  "catalysts_and_risks": [
    "string"
  ]
}
```

---

## 5. 🚀 Kebutuhan Non-Fungsional (Non-Functional Requirements)

* **Performance & Speed**: Response time backend < 1 detik untuk kalkulasi teknikal; rendering grafik 60 FPS tanpa stutter.
* **Cost Efficiency**: Rp 0 operational cost (Vercel Serverless + Google AI Studio Free Tier).
* **Data Accuracy**: 0% Price Hallucination rate; semua level divalidasi silang terhadap harga penutupan aktual.
* **UI/UX Design**: Tema gelap modern (*Dark Theme Financial Terminal*), ramah pengguna di Smartphone & Desktop.
* **Resilience**: *Graceful Fallback* — Aplikasi tidak boleh crash jika koneksi AI terputus.

---

## 6. 📊 Data Structures & Model Types

```typescript
export interface CandleData {
  time: string; // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalSummary {
  ticker: string;
  name: string;
  currentPrice: number;
  change: number;
  changePct: number;
  ema20: number;
  ema50: number;
  ema200: number;
  trend: 'STRONG_UPTREND' | 'PULLBACK_UPTREND' | 'SIDEWAYS' | 'DOWNTREND';
  rsi14: number;
  macd: {
    macdLine: number;
    signalLine: number;
    histogram: number;
    crossStatus: 'BULLISH_CROSS' | 'BEARISH_CROSS' | 'NEUTRAL';
  };
  atr14: number;
  volumeRatio20: number;
  support1: number;
  support2: number;
  resistance1: number;
  resistance2: number;
}

export interface SwingPlan {
  recommendation: 'BUY_ON_WEAKNESS' | 'BUY_ON_BREAKOUT' | 'WAIT_AND_SEE' | 'AVOID';
  setupTitle: string;
  confidenceScore: number;
  buyZone: string;
  tp1: number;
  tp2: number;
  sl: number;
  riskReward: string;
  estHoldingDays: string;
  thesis: string;
  catalystsAndRisks: string[];
  isAIGenerated: boolean;
}
```

---

## 7. 🏁 Kriteria Penerimaan (Acceptance Criteria)

- [x] Input sembarang saham IDX valid (misal `BBCA`, `TLKM`, `MEDC`) berhasil menampilkan grafik candlestick dan indikator.
- [x] EMA 20, EMA 50, dan EMA 200 ter-overlay sempurna pada grafik.
- [x] Angka Entry, TP1, TP2, dan SL mematuhi aturan fraksi harga BEI.
- [x] Rasio Risk-to-Reward selalu di atas 1:1.5 untuk setup Buy.
- [x] AI Copilot menghasilkan insight dalam Bahasa Indonesia yang relevan.
- [x] Jika API key kosong / offline, aplikasi tetap berjalan lancar menampilkan analisa algoritmik.
- [x] Aplikasi berhasil di-build dan siap di-deploy ke Vercel tanpa error.
