# Vectis MCP Sunucusu

Vectis, AI ajanlarını [skills.sh](https://skills.sh) dizinine bağlayan güçlü bir Model Context Protocol (MCP) sunucusudur. Ajanların doğrudan iş akışları içinde uzman taslaklarını (blueprints) ve talimatları aramasına, indirmesine ve yürütmesine olanak tanır.

## 🚀 Özellikler

- **Uzman Blueprint'ler**: skills.sh üzerindeki 4000'den fazla özel yeteneğe erişim.
- **Esnek Arama ve Sıralama**: Popülerlik (liderlik tablosu) destekli gelişmiş puanlama sistemi.
- **İzole Çalıştırma**: Güvenlik için yetenekleri geçici oturum dizinlerine kurar.
- **Otomatik Temizleme**: Disk doluluğunu önlemek için işlemden sonra geçici dosyaları otomatik olarak siler.

## 🛠️ Kurulum

### Hızlı Başlangıç
```bash
git clone https://github.com/xenitV1/vectis.git
cd vectis
npm install
npm run build
```

### Önkoşullar
- [Node.js](https://nodejs.org/) (v18+)
- [skills-cli](https://skills.sh) (`npm install -g @skills/cli`)

### Yapılandırma

Vectis'i MCP ayarlarınıza (örn. Claude Desktop veya Cursor) ekleyin:

```json
{
  "mcpServers": {
    "vectis": {
      "command": "node",
      "args": [
        "[VECTIS_TAM_YOLU]/dist/index.js"
      ]
    }
  }
}
```

> [!IMPORTANT]
> `[VECTIS_TAM_YOLU]` kısmını, depoyu bilgisayarınıza kopyaladığınız gerçek tam yol ile değiştirin.

## 🔧 Araçlar (Tools)

### `search_skills`
Profesyonel taslakları ve uzman talimatlarını arar.
- **Girdi**: `query` (string)
- **Çıktı**: Alakalılık ve popülerliğe göre sıralanmış yetenek listesi.

### `execute_skill`
Belirli bir yeteneğin tam uzman talimatlarını getirir.
- **Girdi**: `repoUrl`, `skillName`, `keepSandbox` (opsiyonel)
- **Çıktı**: İstenen yeteneğin `SKILL.md` içeriği.

### `clear_cache`
Tüm geçici çalışma alanlarını siler.

## 🛡️ Lisans

Bu proje MIT Lisansı ile lisanslanmıştır - detaylar için [LICENSE](LICENSE) dosyasına bakınız.

## 📈 Yıldız Geçmişi (Star History)

[![Star History Chart](https://api.star-history.com/svg?repos=xenitV1/vectis&type=Date)](https://star-history.com/#xenitV1/vectis&Date)
