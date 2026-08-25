# 📈 IDX Swing Analyzer & Trading Copilot

Aplikasi web modern analisis swing trading saham **Bursa Efek Indonesia (BEI / IHSG)** dengan engine kalkulasi teknikal deterministik presisi, kalkulator manajemen lot & risiko portofolio, chart TradingView multi-timeframe interaktif, serta sintesis naratif bertenaga AI (Google Gemini).

---

## 🌟 Fitur Utama

- 🎯 **Plan Swing Trading Otomatis**: Menentukan *Area Beli (Buy Zone)*, *Target Profit 1 (TP1)*, *Target Profit 2 (TP2)*, dan *Stop Loss (Cut Loss)* objektif berbasis level support/resistance dan rata-rata volatilitas harian (ATR 14).
- ⏱️ **Dynamic Time Horizon**: Estimasi durasi *holding period* bursa (misal: `3 - 7 hari bursa (Fast Momentum)`, `5 - 12 hari (Pullback)`, `8 - 18 hari (Base Breakout)`) yang dihitung secara matematis.
- 🎚️ **Kalkulator Lot & Manajemen Risiko Portofolio**:
  - **Mode Otomatis (Berdasar Risiko)**: Menghitung alokasi lot presisi berdasarkan toleransi risiko per trade (0.1% - 20%) dan dikunci aman pada 100% kapasitas modal tunai cash (*Cash Buying Power*).
  - **Mode Manual (Input Lot)**: Stepper lot interaktif dengan estimasi skenario rugi/untung bersih dan simulasi fee broker IDX (~0.15% beli, 0.25% jual).
- 📊 **Konsensus Sinyal Indikator (11 Indikator)**:
  - Rangkuman sinyal objektif: **🟢 X BUY**, **⚪ Y NEUTRAL**, **🔴 Z SELL**.
  - Visual Bar Meter persentase Bullish vs Bearish (TradingView Style) mencakup EMA 20/50/200, MA Alignment, RSI 14, Stochastic (14,3,3), MACD, MFI 14, Bollinger Bands, Volume Spike, dan Pola Candlestick.
- 🕯️ **Interactive TradingView Candlestick Chart**:
  - Multi-Timeframe interaktif: **`15m`** (Intraday), **`1h`** (Short Swing), **`1D`** (Harian), **`1W`** (Mingguan), dan **`1M`** (Bulanan).
  - Overlay EMA 20 (Amber), EMA 50 (Cyan), EMA 200 (Purple), Bollinger Bands 20,2 (Squeeze detection), serta garis horizontal SL/TP.
- 🤖 **AI Copilot Synthesis (Anti-Halusinasi)**:
  - Sintesis analisa bertenaga **Google Gemini Free API** yang bertumpu pada data teknikal matematis terverifikasi.
  - *Algorithmic Fallback Engine*: Aplikasi tetap berfungsi 100% normal meskipun tanpa API key Gemini.

---

## 🚀 Panduan Deploy ke Vercel (Langkah demi Langkah)

Aplikasi ini dibangun menggunakan **Next.js 16 (App Router)** dan siap di-deploy ke Vercel dalam hitungan menit secara gratis.

### Opsi 1: Deploy via GitHub & Vercel Dashboard (Direkomendasikan)

1. **Push Project ke Repository GitHub**:
   Jika belum di-push ke GitHub:
   ```bash
   git add .
   git commit -m "feat: ready for production deployment"
   # Buat repository baru di github.com, lalu hubungkan:
   git remote add origin https://github.com/USERNAME/stock-analyzer.git
   git branch -M main
   git push -u origin main
   ```

2. **Buka Dashboard Vercel**:
   - Masuk ke [vercel.com](https://vercel.com) dan login dengan akun GitHub kamu.
   - Klik tombol **"Add New..."** ➔ pilih **"Project"**.
   - Pilih repository `stock-analyzer` yang baru kamu push, lalu klik **"Import"**.

3. **Konfigurasi Project Settings**:
   - **Framework Preset**: `Next.js` (terdeteksi otomatis).
   - **Root Directory**: `./` (default).
   - **Build Command**: `next build` (default).
   - **Output Directory**: `.next` (default).

4. **Tambahkan Environment Variables (Opsional)**:
   Di bagian **"Environment Variables"**, tambahkan key berikut jika ingin mengaktifkan sintesis AI Gemini:
   | Key | Value | Keterangan |
   |---|---|---|
   | `GEMINI_API_KEY` | `AIzaSy...` | Dapatkan gratis di [Google AI Studio](https://aistudio.google.com/app/apikey) |

   *(Catatan: Jika dikosongkan, aplikasi akan otomatis menggunakan Deterministic Algorithmic Fallback Engine tanpa error).*

5. **Klik "Deploy"**:
   - Tunggu proses build selama ~1 menit.
   - Vercel akan memberikan link domain live gratis, misalnya: `https://stock-analyzer-xxx.vercel.app`. 🎉

---

### Opsi 2: Deploy Cepat via Vercel CLI

Jika kamu menyukai terminal:

1. Install Vercel CLI global:
   ```bash
   npm i -g vercel
   ```

2. Login ke akun Vercel:
   ```bash
   vercel login
   ```

3. Jalankan perintah deploy dari folder project:
   ```bash
   vercel
   ```
   *(Ikuti petunjuk di terminal: pilih scope, set project name, tekan enter untuk default settings).*

4. Untuk deploy ke production domain:
   ```bash
   vercel --prod
   ```

---

## 💻 Menjalankan di Komputer Lokal (Local Development)

1. **Clone repository & install dependencies**:
   ```bash
   git clone https://github.com/USERNAME/stock-analyzer.git
   cd stock-analyzer
   npm install
   ```

2. **Buat file konfigurasi `.env.local` (opsional)**:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **Jalankan development server**:
   ```bash
   npm run dev
   ```
   Buka browser di [http://localhost:3000](http://localhost:3000).

4. **Uji coba build produksi**:
   ```bash
   npm run build
   npm run start
   ```

---

## 🛠️ Tech Stack & Library

- **Framework**: [Next.js 16 (Turbopack, App Router)](https://nextjs.org/)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Charts**: [TradingView Lightweight Charts 5](https://tradingview.github.io/lightweight-charts/)
- **Market Data**: Yahoo Finance API (`yahoo-finance2`)
- **AI Model**: Google Gemini API (`@google/genai`)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## ⚠️ Disclaimer Finansial

Aplikasi ini dibuat murni untuk tujuan **riset, edukasi, dan kalkulasi alat bantu teknikal saham**. Seluruh parameter, sinyal, dan skenario yang dihasilkan bukanlah ajakan mutlak untuk membeli atau menjual efek tertentu. Keputusan investasi dan trading sepenuhnya berada di tangan masing-masing trader (*Do Your Own Research / DYOR*).
