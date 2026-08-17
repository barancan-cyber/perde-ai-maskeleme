# Perde — AI Öncesi Kişisel Veri Maskeleme

Perde; dilekçe, tutanak ve diğer hukuki evrakları ChatGPT, Claude, Gemini veya başka bir yapay zekâ aracına göndermeden önce kişisel verileri bulup maskelemenize yardımcı olur.

Uygulama her kullanıcının kendi bilgisayarında `http://localhost:3000` adresinde çalışır. Evraklarınızı kullanmak için bir internet sitesine yüklemeniz gerekmez.

## Kodlama bilmeyenler için kurulum

### 1. Node.js'i kurun

[Node.js indirme sayfasını](https://nodejs.org/en/download) açın, **LTS** yazan 22.13 veya daha yeni bir sürümü indirip normal bir program gibi kurun. Bu işlem yalnızca bir kez yapılır. Windows'ta Node.js'i yeni kurduysanız kurulumu tamamladıktan sonra bilgisayarı yeniden başlatın.

### 2. Perde'yi indirin

GitHub sayfasının üst kısmındaki **Code** düğmesine, ardından **Download ZIP** seçeneğine basın. İnen ZIP dosyasını klasöre çıkarın.

### 3. Perde'yi açın

- **Windows:** `Perdeyi-Baslat.bat` dosyasına çift tıklayın.
- **macOS:** `Perdeyi-Baslat.command` dosyasına çift tıklayın. macOS ilk çalıştırmada engellerse dosyaya sağ tıklayıp **Aç** seçeneğini kullanın.

İlk çalıştırmada gerekli parçalar otomatik kurulur; bu işlem internet hızınıza göre birkaç dakika sürebilir. Hazır olduğunda tarayıcıda `http://localhost:3000` otomatik açılır.

Başlatıcı penceresini kapattığınızda Perde de kapanır. Yeniden kullanmak için aynı başlatıcıya çift tıklamanız yeterlidir.

### Windows'ta açılmazsa

1. ZIP dosyasını mutlaka klasöre çıkarın; uygulamayı ZIP penceresinin içinden çalıştırmayın.
2. `Perdeyi-Baslat.bat` dosyasına sağ tıklayıp **Yönetici olarak çalıştır** seçeneğini deneyin.
3. Başlatıcı artık hata olduğunda kapanmaz. Siyah pencerede yazan Node.js sürümünü ve hata mesajını kontrol edin.
4. Node.js sürümü 22'den eski görünüyorsa güncel LTS sürümünü kurup Windows'u yeniden başlatın.
5. Windows Defender uyarı gösterirse **Daha fazla bilgi → Yine de çalıştır** seçeneğini yalnızca dosyayı bu resmi repodan indirdiyseniz kullanın.

Tarayıcı otomatik açılmaz fakat siyah pencerede `ready` benzeri bir mesaj görünürse tarayıcınıza elle `http://localhost:3000` yazın.

## Nasıl kullanılır?

1. **Evrak seç** alanına tıklayın veya dosyanızı kutunun üzerine sürükleyin.
2. Uygulamanın bulduğu ad-soyad, T.C. kimlik numarası, adres, doğum tarihi ve diğer kişisel verileri inceleyin.
3. Maskelenmesini istemediğiniz bir bulgu varsa yanındaki seçimi kapatın. Atlanan bir isim görürseniz **manuel isim ekleme** alanından ekleyin.
4. Ön izlemede belgenin doğru şekilde maskelendiğini mutlaka kontrol edin.
5. **Maskeli PDF indir** veya **Maskeli Word indir** seçeneğini kullanın.
6. Yapay zekâ aracına yalnızca kontrol ettiğiniz maskeli kopyayı yükleyin.

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

## Geliştiriciler için

Gereksinim: Node.js `>=22.13.0`

```bash
npm ci
npm run dev -- --host 127.0.0.1 --port 3000
```

Üretim derlemesini kontrol etmek için:

```bash
npm run build
```

## Lisans

Bu repoda henüz açık kaynak lisansı tanımlanmamıştır. Kaynak kodun kamuya açık olması, otomatik olarak yeniden kullanım izni verildiği anlamına gelmez.
