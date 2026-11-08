# Dexter.pw 4K Stream Provider for SkyStream

Provider plugin untuk **SkyStream** yang mengekstrak katalog film, series, dan video streaming HLS 4K dari [dexter.pw](https://dexter.pw/).

---

## 📁 Struktur File Plugin

```text
dexter-plugin/
├── src/
│   ├── plugin.json       # Metadata ekstensi (org.stream.dexter)
│   └── plugin.js         # Logic getHome, search, load, loadStreams
├── dist/
│   ├── org.stream.dexter.sky   # Plugin bundle (ZIP)
│   └── plugins.json            # Daftar plugin
├── build.py              # Script packager
├── repo.json             # Manifest repository SkyStream
└── README.md
```

---

## 🚀 Cara Pemasangan di SkyStream (Android / Android TV)

### 1. Pasang Aplikasi SkyStream
* Unduh APK SkyStream rilis terbaru dari [SkyStream Releases](https://github.com/akashdh11/skystream/releases).
* Install di perangkat Android kamu (Smartphone atau Android TV).

### 2. Cara Menambahkan Plugin ke SkyStream

#### Opsi A: Melalui GitHub (Paling Direkomendasikan)
1. Buat repository baru di GitHub kamu (misal: `dexter-skystream-plugin`).
2. Push semua file di folder ini ke GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: Dexter.pw provider for SkyStream"
   git remote add origin https://github.com/<USERNAME>/dexter-skystream-plugin.git
   git branch -M main
   git push -u origin main
   ```
3. Update `build.py` dengan URL username GitHub kamu:
   ```bash
   REPO_URL="https://raw.githubusercontent.com/<USERNAME>/dexter-skystream-plugin/main" python3 build.py
   git commit -am "chore: update repo url" && git push
   ```
4. Buka aplikasi **SkyStream**:
   * Masuk ke **Settings** → **Extensions**.
   * Klik ikon **+** (Add Repository).
   * Masukkan link `repo.json` raw GitHub kamu:
     `https://raw.githubusercontent.com/<USERNAME>/dexter-skystream-plugin/main/repo.json`
   * Klik **Install** pada **Dexter Stream**.

#### Opsi B: Local Test (Langsung dari Android/Local Network)
Jika ingin coba langsung di satu jaringan WiFi atau HP yang sama:
1. Jalankan web server mini di folder `dexter-plugin`:
   ```bash
   python3 -m http.server 8080
   ```
2. Ganti link di `repo.json` menjadi IP lokal kamu (contoh `http://192.168.1.10:8080/dist/plugins.json`).
3. Masukkan `http://192.168.1.10:8080/repo.json` ke menu Extensions SkyStream.

---

## ✨ Fitur Provider
* **Resolusi 4K & Adaptif:** Otomatis membaca master playlist HLS dexter.pw dengan pilihan 4K, 1080p, 720p, dan Auto Adaptive.
* **Katalog Lengkap:** Mendukung kategori Trending Hero, Top 10 Movies & Shows, Series, dan Genre.
* **Pencarian Cepat:** Pencarian langsung via API search dexter.pw.
* **Full TV Series & Episodes:** Menampilkan semua episode per season lengkap dengan poster dan sinopsis.
