# Perde — AI Öncesi Kişisel Veri Maskeleme

Perde; dilekçe, tutanak ve diğer hukuki evrakları ChatGPT, Claude, Gemini veya başka bir yapay zekâ aracına göndermeden önce kişisel verileri bulup maskelemenize yardımcı olur.

> Uygulamayı kullanmak için kodlama bilmeniz veya bilgisayarınıza bir program kurmanız gerekmez.

## Uygulamayı aç

**[Perde uygulamasını aç](https://perde-uyap-maskele.barancan86.chatgpt.site/)**

## Nasıl kullanılır?

1. Yukarıdaki bağlantıdan uygulamayı açın.
2. **Evrak seç** alanına tıklayın veya dosyanızı kutunun üzerine sürükleyin.
3. Uygulamanın bulduğu ad-soyad, T.C. kimlik numarası, adres, doğum tarihi ve diğer kişisel verileri inceleyin.
4. Maskelenmesini istemediğiniz bir bulgu varsa yanındaki seçimi kapatın. Atlanan bir isim görürseniz **manuel isim ekleme** alanından ekleyin.
5. Ön izlemede belgenin doğru şekilde maskelendiğini mutlaka kontrol edin.
6. **AI için PDF kaydet** veya **AI için maskeli metni indir** seçeneğini kullanın. Yapay zekâ aracına yalnızca bu maskeli kopyayı yükleyin.

PDF kaydederken tarayıcının yazdırma penceresi açılır. Hedef/yazıcı bölümünden **PDF olarak kaydet** seçeneğini seçin.

## Desteklenen dosyalar

- PDF (`.pdf`)
- UYAP Doküman Editörü dosyası (`.udf`)
- Word belgesi (`.docx`)
- Metin dosyası (`.txt`)

Taranmış veya fotoğraf olarak oluşturulmuş PDF'lerde metin, OCR ile okunmaya çalışılır. Belgenin kalitesi düşükse bazı bilgiler bulunamayabilir.

## Önemli güvenlik notları

- Otomatik maskeleme yüzde yüz hatasız değildir. İndirdiğiniz kopyayı paylaşmadan önce mutlaka gözden geçirin.
- Özellikle kişi adları, adresler, imza alanları, telefon numaraları ve dosyaya özgü hassas bilgileri ayrıca kontrol edin.
- Orijinal evrakınız değiştirilmez. Güvenli bir yerde saklamaya devam edin.
- Yapay zekâ aracına orijinal belgeyi değil, yalnızca kontrol ettiğiniz maskeli kopyayı yükleyin.
- Bu araç hukuki danışmanlık veya mevzuata uygunluk garantisi vermez; son kontrol kullanıcıya aittir.

## Geliştiriciler için yerel kurulum

Bu bölüm yalnızca projeyi kendi bilgisayarında çalıştırmak isteyen geliştiriciler içindir.

Gereksinim: Node.js `>=22.13.0`

```bash
npm install
npm run dev
```

Üretim derlemesini kontrol etmek için:

```bash
npm run build
```

## Lisans

Bu repoda henüz açık kaynak lisansı tanımlanmamıştır. Kaynak kodun kamuya açık olması, otomatik olarak yeniden kullanım izni verildiği anlamına gelmez.
