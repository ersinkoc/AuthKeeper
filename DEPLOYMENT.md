# 🚀 GitHub Pages Deployment Rehberi

AuthKeeper website'ini GitHub Pages'e deploy etmek için adım adım talimatlar.

## ✅ Hazır Olan Dosyalar

Deployment için gerekli tüm dosyalar hazır:

- ✅ `.github/workflows/deploy.yml` - GitHub Actions workflow
- ✅ `website/public/CNAME` - Custom domain config (authkeeper.oxog.dev)
- ✅ `website/vite.config.ts` - Vite configuration (base: '/')
- ✅ `website/dist/` - Production build

## 📋 Deployment Adımları

### 1️⃣ GitHub Repository'de Pages'i Aktifleştir

1. GitHub'da repository'ye git: https://github.com/ersinkoc/authkeeper
2. **Settings** sekmesine tıkla
3. Sol menüden **Pages** seçeneğini bul
4. **Build and deployment** bölümünde:
   - **Source**: `GitHub Actions` seç (Deploy from a branch DEĞİL!)
   - Bu önemli çünkü custom workflow kullanıyoruz

### 2️⃣ Değişiklikleri GitHub'a Push Et

```bash
# Ana dizinde
cd d:/Codebox/__NPM__/AuthKeeper

# Git'e ekle
git add .

# Commit yap
git commit -m "Add website with GitHub Pages deployment"

# Push et
git push origin master
```

### 3️⃣ GitHub Actions'ı İzle

1. Repository'de **Actions** sekmesine git
2. "Deploy to GitHub Pages" workflow'unun çalıştığını göreceksin
3. Workflow tamamlanınca (yaklaşık 1-2 dakika):
   - ✅ Build job: Website'i build eder
   - ✅ Deploy job: GitHub Pages'e deploy eder

### 4️⃣ Custom Domain Ayarları (authkeeper.oxog.dev)

#### A) DNS Ayarları (oxog.dev domain yöneticinizde)

CNAME record ekle:
```
Type: CNAME
Name: authkeeper
Value: ersinkoc.github.io
TTL: 3600 (veya Auto)
```

#### B) GitHub Pages'te Domain Onayı

1. Repository Settings → Pages
2. **Custom domain** bölümünde `authkeeper.oxog.dev` yaz
3. **Save** butonuna tıkla
4. DNS kontrolü yapılacak (1-2 dakika)
5. ✅ **Enforce HTTPS** seçeneğini aktif et (önemli!)

## 🎯 Deployment Sonrası

### Website URL'leri:

- **Custom Domain**: https://authkeeper.oxog.dev (öncelikli)
- **GitHub Pages**: https://ersinkoc.github.io/authkeeper (fallback)

### Otomatik Deployment:

Her `master` branch'e push ettiğinde:
1. GitHub Actions otomatik tetiklenir
2. Website build edilir
3. GitHub Pages'e deploy edilir
4. 1-2 dakika içinde canlıya alınır

## 🔧 Troubleshooting

### ❌ Actions çalışmıyor?

**Çözüm**: Repository Settings → Actions → General
- "Allow all actions and reusable workflows" seçili olmalı
- Workflow permissions: "Read and write permissions" seçili olmalı

### ❌ Pages çalışmıyor?

**Çözüm**: Settings → Pages
- Source: "GitHub Actions" seçili olmalı
- NOT "Deploy from a branch"!

### ❌ Custom domain çalışmıyor?

**Çözüm**:
1. DNS ayarlarını kontrol et (CNAME: authkeeper → ersinkoc.github.io)
2. DNS propagation için 5-10 dakika bekle
3. GitHub'da domain onayını kontrol et
4. HTTPS enforce et

### ❌ 404 hatası?

**Çözüm**:
1. `website/vite.config.ts`'de `base: '/'` olmalı
2. CNAME dosyası `website/public/CNAME`'de olmalı
3. Build'i kontrol et: `cd website && npm run build`

## 📊 Build Testi (Local)

Deployment öncesi test etmek için:

```bash
cd website

# Build yap
npm run build

# Build çıktısını kontrol et
ls -lh dist/

# Local'de test et (opsiyonel)
npm install -g serve
serve dist
```

## 🔄 Güncelleme Workflow'u

Website'de değişiklik yaptıktan sonra:

```bash
# Değişiklikleri yap
# cd website/src/...

# Build test et
cd website
npm run build

# Git'e ekle
git add .
git commit -m "Update website: [değişiklik açıklaması]"
git push origin master

# GitHub Actions otomatik deploy eder
```

## 📝 Deployment Checklist

Deploy etmeden önce kontrol et:

- [ ] Website local'de çalışıyor (`npm run dev`)
- [ ] Build başarılı (`npm run build`)
- [ ] `.github/workflows/deploy.yml` var
- [ ] `website/public/CNAME` var ve doğru
- [ ] GitHub Pages Settings → Source: "GitHub Actions"
- [ ] DNS CNAME record ayarlandı
- [ ] Git push yapıldı
- [ ] Actions başarıyla tamamlandı
- [ ] Website açılıyor (authkeeper.oxog.dev)

## ✅ İlk Deployment Sonrası

Website canlıya aldıktan sonra:

1. ✅ `https://authkeeper.oxog.dev` adresini test et
2. ✅ Tüm sayfaları kontrol et (Home, Docs, API, Examples, Playground)
3. ✅ Dark/Light theme toggle'ı test et
4. ✅ Responsive design'ı test et (mobile, tablet, desktop)
5. ✅ Link'lerin çalıştığını doğrula

## 🎉 Başarılı Deployment!

Website şu adreste canlı olacak:
**https://authkeeper.oxog.dev**

Her değişiklik otomatik olarak deploy edilecek! 🚀
