# FLUFFY — Your Little World of Fluff 🐾✨

[![MIT License](https://img.shields.io/badge/License-MIT-ff5c8d.svg)](LICENSE)
[![Engine](https://img.shields.io/badge/3D%20Engine-Three.js%20%2B%20WebGL2-9b6bff.svg)](#architecture)
[![Offline Ready](https://img.shields.io/badge/Offline-PWA%20%26%20Standalone%20HTML-00d68f.svg)](#offline--mobile-download)
[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-tejapriyan-ffdd00.svg?logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/tejapriyan)

> **YOUR LITTLE WORLD OF FLUFF.**
> An adorable, real-time interactive 3D furry companion living inside your browser—featuring **38,000 hardware-instanced Bézier silk hair filaments**, **64 Verlet/spring physics guides**, a **3D Hair Salon**, **Bath & Wet-Fur physics**, **Autonomous 3D Toys**, and **100% offline mobile & desktop play**.

---

## 🎮 Play in Browser & Offline Download

- **Play Instantly in Browser:** Open `index.html` (or `fluffy.html`) in any modern browser and click **"▶ Play in Browser Now"**.
- **Download for Offline Mobile & Desktop Play:** Click **"⬇ Download Offline App (`fluffy_offline_app.html`)"** on the showcase website to save the self-contained HTML5 file to your Android phone, iPhone/iPad, Windows PC, Mac, or Linux machine. Zero internet connection, zero API keys, and zero backend servers required!

---

## ✨ Key Features

| Module | Description |
| :--- | :--- |
| **38,000 Bézier Silk Hair Engine** | WebGL2 hardware-instanced 10-segment quadratic Bézier hair ribbons with Kajiya-Kay / Marschner dual-lobe anisotropic sheen and a 3D facial repulsion shield that keeps the eyes 100% clear. |
| **64 Real-Time Physics Guides** | Spring & Verlet integration across 5 skeletal zones (`torso`, `head`, `leftEar`, `rightEar`, `tail`) responding to head turns, jumps, shakes, wind, and blow-drying. |
| **3D Hair Salon (`Trim`, `Grow`, `Dryer`)** | Trim hair locally with animated **3D Salon Scissors (`X`)**, regrow with the **Magic Grow Potion (`G`)**, blast directional air waves with the **3D Blow-Dryer (`D`)**, and apply **Ombré / Rainbow Tip Dye**. |
| **Bath & Wet-Fur Physics** | Lather clinging 3D soap bubbles, rinse under a water shower that dynamically weighs down the fur, and shake or blow-dry back to full cloud volume. |
| **3D Toys, Snacks & Dance Party** | Toss a bouncing **3D Yarn Ball** or shine a **3D Laser Pointer** for Fluffy to chase, feed a **3D Berry Macaron**, or start a Web Audio chiptune **Dance Party (`M`)**. |
| **9 Wearable 3D Accessories & Pet Bed** | Dress Fluffy in a `Bow`, `Royal Crown`, `Gold Glasses`, `Flapping Angel Wings`, `DJ Headphones`, `Tiny Hat`, `Bell Collar`, or `Scarf`, plus a **Cozy 3D Quilted Pet Bed**. |
| **Desktop & Mobile Portrait Views** | Switch seamlessly between widescreen **Desktop Mode** and **Mobile Portrait View** with automatic camera FOV framing. |

---

## 📁 Repository Structure

```text
fluffy/
├── index.html                        # Official Showcase Website + Full 3D Interactive App
├── fluffy.html                       # Standalone Offline-Ready 3D App & Website Bundle
├── manifest.json                     # PWA Web App Manifest for Mobile Home Screen Install
├── sw.js                             # Service Worker for 100% Offline Caching
├── package.json                      # NPM Metadata & Local Dev Scripts
├── robots.txt                        # Search Engine Crawler Rules (SEO)
├── sitemap.xml                       # XML Sitemap (SEO)
├── llms.txt                          # Generative Engine Optimization (GEO) AI Summary
├── LICENSE                           # MIT Open-Source License
├── PRIVACY_POLICY.md                 # 100% Client-Side Privacy Policy
├── CONTRIBUTING.md                   # Contributor Guidelines
├── CODE_OF_CONDUCT.md                # Contributor Covenant Code of Conduct
├── SECURITY.md                       # Security & Vulnerability Reporting Policy
├── CHANGELOG.md                      # Version History & Release Notes
├── .gitignore                        # Git Ignore Rules
├── .github/
│   ├── FUNDING.yml                   # Sponsor Link (https://buymeacoffee.com/tejapriyan)
│   ├── workflows/pages.yml           # GitHub Pages Automated Deployment Workflow
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   └── PULL_REQUEST_TEMPLATE.md
└── src/                              # Modular Source Architecture (Engine, Shaders, Physics, UI)
```

---

## ☕ Support the Creator

If you enjoy **FLUFFY** or use this codebase to learn real-time 3D WebGL2 hair and physics rendering, please consider supporting **Teja Priyan**:

👉 **[Buy Me a Coffee — https://buymeacoffee.com/tejapriyan](https://buymeacoffee.com/tejapriyan)**

---

## ⚖️ License

Released under the [MIT License](LICENSE). Copyright © 2026 Teja Priyan.
