# Dirilis: Obanin Kalbi Oyun Prototipi

Turk orf ve adetlerini cocuklara hikaye, gorev, muzik ve secimler yoluyla yasatan kulturel macera oyunu prototipi.

## Icerik

- Mario benzeri 2D oyun hissi: yurume, ziplama, toplama, yardim etme, hedefe ulasma
- Uc bolumluk oynanabilir akış: Oba Uyaniyor, Kervan Yolu, Toy Meydani
- Deger odakli ilerleme: azik, emanet parcasi, misafire yardim, kucugu sevindirme, buyugu dinleme
- Profesyonel HUD: bolum, azik, emanet, itibar, dayaniklilik ve rozet takibi
- Gorev gunlugu ve saha paneli: ana vazife, vakit, ruzgar, tehdit ve eksik hedefler
- Emanet sualleri: altin/emanet parcalarinda soru acilir, dogru cevap parcanin alinmasini saglar
- Dogru cevap etkilesimi: parilti, kayan odul yazisi, itibar ve dayaniklilik kazanimi
- Buyuk odul toreni: bolum sonunda rozet, yildiz, unvan ve basari dokumu
- Pirzola guclendirmesi: kisa sureligine daha hizli ve daha direncli hareket
- Yol kesenler: ustlerine ziplayarak, pirzola gucuyle veya at uzerindeyken bertaraf edilir
- At binme sistemi: yol guven verdikten sonra E ile ata binilir, at uzerindeyken E ile inilir
- Rozet sistemi: Misafir Dostu, Yol Eri, Obanin Kalbi
- Canvas ile cizilen sinematik oba dunyasi: paralaks daglar, sis, kuslar, ates, kivilcimlar, cadirlar, sancak, at ve platformlar
- Dayaniklilik sistemi: hareket temposu karakterin hizini etkiler
- Itibar sistemi: toplama ve yardim puan kazandirir, tehlikeye dusmek puan eksiltir
- Suno uzerinden baglanan `Ertugrul'un Yolculugu` arka plan muzigi
- Suno parcasi yuklenemezse tarayicida uretilen ozgun destansi oyun muzigi
- Mobil ve masaustu uyumlu arayuz

## Kontroller

- Sol/Sag veya A/D: yurume
- Space/W/Yukari: ziplama
- E: yakindaki kisiyle konusma, yardim etme, ata binme veya attan inme. Tam hizalamak gerekmez; oyun en yakin etkilesimi secer
- 1/2/3 veya ekrandaki secenekler: emanet suallerini cevaplama

## Calistirma

Bu klasorde yerel sunucu acildi:

```bash
python3 -m http.server 8017
```

Tarayicida su adresi acilir:

```text
http://127.0.0.1:8017/
```

Alternatif olarak `index.html` dosyasi dogrudan da acilabilir.

## Muzik

Oyun muzik butonuna basilinca Suno uzerinden `Ertugrul'un Yolculugu` parcasi calar:

```text
https://suno.com/s/TXtY1SMbDd0Q1XDO
```

Suno/CDN erisimi olmazsa tarayicida uretilen ozgun destansi oyun muzigi devreye girer.

## Sonraki Surum Fikirleri

- Karakter secimi: kiz ve erkek cocuk karakterleri, esit gorev akisi
- Bolum 2: Buyugun Sozu, dede/nine anlatimini dikkatle dinleme gorevi
- Bolum 3: Toyda Her Soz Tartilir, saygili konusma ve karar verme
- Seslendirme: Oba Anasi, Yolcu, Cocuk, Toy Beyi, Bilge Anlatici
- Gercek enstrumanlarla ozgun muzik paketi: kopuz, baglama, ney, davul
- Harita uzerinde acilan yeni oba alanlari
- Kultur sandigi: atasozu, deyim, sofra adabi, misafirlik, toy, emanet kavramlari
