export type KurulumTanim = {
  ad: string;
};

export type KurulumModel = {
  ad: string;
};

export type KurulumMarka = {
  ad: string;
  modeller: KurulumModel[];
};

export type KurulumTur = {
  id: string;
  ad: string;
  emoji: string;
  tanimlar: KurulumTanim[];
  markalar: KurulumMarka[];
};

export const KURULUM_TURLERI: KurulumTur[] = [
  {
    id: "telefon",
    ad: "Telefon / Tablet",
    emoji: "📱",
    tanimlar: [
      { ad: "Telefon" }, { ad: "Tablet" }, { ad: "Akıllı Saat" },
      { ad: "Kablosuz Kulaklık" }, { ad: "Şarj Aleti" },
    ],
    markalar: [
      { ad: "Apple", modeller: [{ ad: "iPhone 16 Pro Max" }, { ad: "iPhone 16 Pro" }, { ad: "iPhone 16" }, { ad: "iPhone 15 Pro Max" }, { ad: "iPhone 15" }, { ad: "iPhone 14" }, { ad: "iPhone 13" }, { ad: "iPhone 12" }, { ad: "iPhone 11" }, { ad: "iPhone SE" }, { ad: "iPad Pro 13" }, { ad: "iPad Air M2" }, { ad: "iPad Mini 7" }] },
      { ad: "Samsung", modeller: [{ ad: "Galaxy S25 Ultra" }, { ad: "Galaxy S25+" }, { ad: "Galaxy S25" }, { ad: "Galaxy S24" }, { ad: "Galaxy A55" }, { ad: "Galaxy A35" }, { ad: "Galaxy A15" }, { ad: "Galaxy Z Fold 6" }, { ad: "Galaxy Z Flip 6" }, { ad: "Tab S9 Ultra" }, { ad: "Tab S9" }, { ad: "Tab A9+" }] },
      { ad: "Xiaomi", modeller: [{ ad: "14 Ultra" }, { ad: "14T Pro" }, { ad: "14T" }, { ad: "Redmi Note 13 Pro" }, { ad: "Redmi Note 13" }, { ad: "Redmi 13C" }, { ad: "Poco X6 Pro" }, { ad: "Poco X6" }, { ad: "Poco M6 Pro" }] },
      { ad: "Huawei", modeller: [{ ad: "Pura 70 Pro" }, { ad: "Pura 70" }, { ad: "P60 Pro" }, { ad: "Nova 12 Pro" }, { ad: "Nova 11" }, { ad: "Mate 60 Pro" }, { ad: "Mate 50 Pro" }, { ad: "MatePad Pro 13" }] },
      { ad: "Oppo", modeller: [{ ad: "Find X8 Pro" }, { ad: "Find X7" }, { ad: "Reno 12 Pro" }, { ad: "Reno 11 Pro" }, { ad: "Reno 11" }, { ad: "A98" }, { ad: "A78" }] },
      { ad: "OnePlus", modeller: [{ ad: "12 Pro" }, { ad: "12" }, { ad: "Nord 4" }, { ad: "Nord 3" }, { ad: "Nord CE 4" }] },
      { ad: "Realme", modeller: [{ ad: "GT 6" }, { ad: "GT 6T" }, { ad: "C67" }, { ad: "12 Pro+" }, { ad: "12 Pro" }, { ad: "Narzo 70 Pro" }] },
      { ad: "Motorola", modeller: [{ ad: "Edge 50 Pro" }, { ad: "Edge 50" }, { ad: "Moto G85" }, { ad: "Moto G54" }, { ad: "Razr 50 Ultra" }] },
      { ad: "Nokia", modeller: [{ ad: "G42" }, { ad: "G22" }, { ad: "C32" }, { ad: "XR21" }, { ad: "G60" }] },
      { ad: "Sony", modeller: [{ ad: "Xperia 1 VI" }, { ad: "Xperia 5 VI" }, { ad: "Xperia 10 VI" }, { ad: "Xperia 1 V" }] },
    ],
  },
  {
    id: "oyun-konsolu",
    ad: "Oyun Konsolu",
    emoji: "🎮",
    tanimlar: [
      { ad: "Oyun Konsolu" }, { ad: "Kontrolcü" }, { ad: "Joystick" },
      { ad: "El Konsolu" }, { ad: "Aksesuar" },
    ],
    markalar: [
      {
        ad: "Sony",
        modeller: [
          { ad: "PlayStation 5 Pro" },
          { ad: "PlayStation 5 Fat" },
          { ad: "PlayStation 5 Slim CD" },
          { ad: "PlayStation 5 Slim Digital" },
          { ad: "PlayStation 4 Fat" },
          { ad: "PlayStation 4 Slim" },
          { ad: "PlayStation 3 Fat" },
          { ad: "PlayStation 3 Slim" },
          { ad: "PlayStation 3 SuperSlim" },
          { ad: "PSP 1000" },
          { ad: "PSP 2000" },
          { ad: "PSP 3000" },
        ],
      },
      {
        ad: "XBOX",
        modeller: [
          { ad: "Xbox 360" },
          { ad: "Xbox One" },
          { ad: "Xbox One S" },
          { ad: "Xbox Series S" },
          { ad: "Xbox Series X" },
        ],
      },
      { ad: "Nintendo", modeller: [{ ad: "Switch OLED" }, { ad: "Switch" }, { ad: "Switch Lite" }, { ad: "Wii U" }, { ad: "3DS XL" }, { ad: "New 3DS" }, { ad: "Joy-Con" }] },
      { ad: "Valve", modeller: [{ ad: "Steam Deck OLED" }, { ad: "Steam Deck 512GB" }, { ad: "Steam Deck 256GB" }] },
      { ad: "ASUS ROG", modeller: [{ ad: "ROG Ally X" }, { ad: "ROG Ally" }, { ad: "ROG Phone 8 Pro" }, { ad: "ROG Phone 8" }] },
      { ad: "Sega", modeller: [{ ad: "Mega Drive Mini" }, { ad: "Game Gear Micro" }] },
      { ad: "Atari", modeller: [{ ad: "Atari 2600+" }, { ad: "Atari VCS" }] },
      { ad: "8BitDo", modeller: [{ ad: "Pro 2" }, { ad: "Ultimate 2C" }, { ad: "SN30 Pro" }] },
    ],
  },
  {
    id: "televizyon",
    ad: "Televizyon / Görüntü",
    emoji: "📺",
    tanimlar: [
      { ad: "Televizyon" }, { ad: "Monitör" }, { ad: "Projeksiyon" },
      { ad: "Set Üstü Kutu" }, { ad: "Uzaktan Kumanda" },
    ],
    markalar: [
      { ad: "Samsung", modeller: [{ ad: "Neo QLED 8K QN900D" }, { ad: "Neo QLED 4K QN90D" }, { ad: "QLED Q80D" }, { ad: "Crystal UHD AU8000" }, { ad: "The Frame LS03D" }, { ad: "The Sero" }, { ad: "Odyssey G9" }] },
      { ad: "LG", modeller: [{ ad: "OLED evo G4" }, { ad: "OLED C4" }, { ad: "OLED B4" }, { ad: "QNED99 8K" }, { ad: "NanoCell NANO91" }, { ad: "UHD UR9000" }, { ad: "UltraGear OLED" }] },
      { ad: "Sony", modeller: [{ ad: "Bravia XR A95L" }, { ad: "Bravia XR A80L" }, { ad: "Bravia X90L" }, { ad: "Bravia X85L" }, { ad: "Bravia 9" }] },
      { ad: "Vestel", modeller: [{ ad: "4K Smart 55\" " }, { ad: "4K Smart 65\" " }, { ad: "Full HD 43\" " }, { ad: "Neo QLED 55\" " }] },
      { ad: "Arçelik", modeller: [{ ad: "A65 C 895 B" }, { ad: "A55 C 895 A" }, { ad: "Çerçeveli 4K" }, { ad: "Smart Full HD 43\" " }] },
      { ad: "Philips", modeller: [{ ad: "OLED 908" }, { ad: "OLED 807" }, { ad: "PUS8519" }, { ad: "PUS7609" }] },
      { ad: "TCL", modeller: [{ ad: "QM891G Mini LED" }, { ad: "C845 QLED" }, { ad: "P745 4K" }, { ad: "43P635" }] },
      { ad: "Hisense", modeller: [{ ad: "U8N Mini LED" }, { ad: "U7N" }, { ad: "A7N 4K" }, { ad: "E7NQ QLED" }] },
      { ad: "Panasonic", modeller: [{ ad: "MZ2000 OLED" }, { ad: "MX950 Mini LED" }, { ad: "LX940" }] },
      { ad: "Grundig", modeller: [{ ad: "55 GHU 8590" }, { ad: "65 GHU 7914" }, { ad: "43 GFB 6855" }] },
    ],
  },
  {
    id: "klima",
    ad: "Klima / Isıtma / Soğutma",
    emoji: "❄️",
    tanimlar: [
      { ad: "Klima" }, { ad: "Isı Pompası" }, { ad: "VRF Sistem" },
      { ad: "Kaset Tipi Klima" }, { ad: "Kanal Tipi Klima" },
      { ad: "Fan Coil" }, { ad: "Kompresör" },
    ],
    markalar: [
      { ad: "Daikin", modeller: [{ ad: "Perfera FTXM" }, { ad: "Emura FTXJ" }, { ad: "Stylish FTXA" }, { ad: "Sensira FTXC" }, { ad: "Ururu Sarara" }, { ad: "VRV IV" }] },
      { ad: "Mitsubishi Electric", modeller: [{ ad: "MSZ-AP" }, { ad: "MSZ-EF Kirigamine" }, { ad: "MSZ-LN Ruby" }, { ad: "MXZ Çoklu Split" }, { ad: "City Multi VRF" }] },
      { ad: "Arçelik", modeller: [{ ad: "Inverter A+++" }, { ad: "Neo Inverter" }, { ad: "Arctic Inverter" }, { ad: "Wi-Fi Inverter" }] },
      { ad: "Vestel", modeller: [{ ad: "Inverter Gold A+++" }, { ad: "İklimArt Inverter" }, { ad: "Platinum Inverter" }] },
      { ad: "Bosch", modeller: [{ ad: "Climate 5000" }, { ad: "Climate 8000" }, { ad: "Compress 7000i" }] },
      { ad: "Samsung", modeller: [{ ad: "WindFree Elite" }, { ad: "WindFree Comfort" }, { ad: "AR9500T" }, { ad: "DVM S2 VRF" }] },
      { ad: "LG", modeller: [{ ad: "ARTCOOL Gallery" }, { ad: "DualCool Inverter" }, { ad: "DUALCOOL Premium" }, { ad: "Multi V 5 VRF" }] },
      { ad: "Toshiba", modeller: [{ ad: "Haori" }, { ad: "Shorai Edge" }, { ad: "Seiya" }, { ad: "VRF Super Modular" }] },
      { ad: "Fujitsu", modeller: [{ ad: "ASYG-KETA" }, { ad: "ASYG-LMCA" }, { ad: "Airstage VRF" }] },
      { ad: "Gree", modeller: [{ ad: "Pular Inverter" }, { ad: "Bora Inverter" }, { ad: "Lomo Inverter" }] },
    ],
  },
  {
    id: "beyaz-esya",
    ad: "Beyaz Eşya",
    emoji: "🏠",
    tanimlar: [
      { ad: "Çamaşır Makinesi" }, { ad: "Bulaşık Makinesi" }, { ad: "Buzdolabı" },
      { ad: "Fırın" }, { ad: "Kurutma Makinesi" }, { ad: "Derin Dondurucu" },
      { ad: "Davlumbaz" }, { ad: "Mikrodalga" },
    ],
    markalar: [
      { ad: "Arçelik", modeller: [{ ad: "10 kg Inverter B10 P" }, { ad: "9 kg ProSmart B9" }, { ad: "NoFrost Buzdolabı 580L" }, { ad: "6 Programlı Bulaşık" }, { ad: "Çekmeceli Derin Dondurucu" }] },
      { ad: "Bosch", modeller: [{ ad: "Serie 8 WAX32EH0TR" }, { ad: "Serie 6 WGG14200TR" }, { ad: "Serie 4 SMS4HVW33T" }, { ad: "KGN56XLEA NoFrost" }, { ad: "HBA578BS0" }] },
      { ad: "Samsung", modeller: [{ ad: "EcoBubble 9 kg" }, { ad: "QuickDrive 10 kg" }, { ad: "WD10T534DBX" }, { ad: "Family Hub Buzdolabı" }, { ad: "SpaceMax Buzdolabı" }] },
      { ad: "LG", modeller: [{ ad: "F4WV910P2SE 10.5 kg" }, { ad: "F4DV910H2SE Kurutmalı" }, { ad: "V9 F4V909BTSE" }, { ad: "GBP62PZNBC NoFrost" }, { ad: "InstaView Buzdolabı" }] },
      { ad: "Vestel", modeller: [{ ad: "8 kg Çamaşır EKO" }, { ad: "A+++ Bulaşık" }, { ad: "NoFrost 560L" }, { ad: "Slim Buzdolabı" }] },
      { ad: "Beko", modeller: [{ ad: "ProSmart Inverter 9 kg" }, { ad: "SteamCure 10 kg" }, { ad: "B5WFTU79429WB" }, { ad: "GN163120X NoFrost" }] },
      { ad: "Siemens", modeller: [{ ad: "WM16XK75TR iQ700" }, { ad: "WN54C2A0TR iQ500" }, { ad: "SN63HX36TE" }, { ad: "KG56NXWF0N" }] },
      { ad: "Miele", modeller: [{ ad: "WWG 780 WCS" }, { ad: "WCR 890 WPS" }, { ad: "G 7600 SCi AutoDos" }, { ad: "KFN 7795 D" }] },
      { ad: "Whirlpool", modeller: [{ ad: "FSCR 12440" }, { ad: "FFB 9458 WV" }, { ad: "WBC 3C26 PF X" }] },
      { ad: "Electrolux", modeller: [{ ad: "EW8F2944QB" }, { ad: "EW7F349SP" }, { ad: "ESF5512LOX" }] },
    ],
  },
  {
    id: "ofis-ekipmani",
    ad: "Ofis Ekipmanı",
    emoji: "🖨️",
    tanimlar: [
      { ad: "Yazıcı" }, { ad: "Fotokopi Makinesi" }, { ad: "Tarayıcı" },
      { ad: "Faks" }, { ad: "Projeksiyon Cihazı" }, { ad: "UPS" },
      { ad: "Barkod Yazıcı" }, { ad: "Plotter" }, { ad: "Laminasyon Makinesi" },
    ],
    markalar: [
      { ad: "HP", modeller: [{ ad: "LaserJet Pro M404dn" }, { ad: "LaserJet Pro MFP M428fdw" }, { ad: "OfficeJet Pro 9010e" }, { ad: "DeskJet 4120e" }, { ad: "Color LaserJet Pro M454dw" }] },
      { ad: "Canon", modeller: [{ ad: "i-SENSYS MF657Cdw" }, { ad: "i-SENSYS LBP6030" }, { ad: "PIXMA G3470" }, { ad: "imageRUNNER 2630i" }, { ad: "MAXIFY GX6050" }] },
      { ad: "Epson", modeller: [{ ad: "EcoTank ET-4850" }, { ad: "EcoTank L3560" }, { ad: "WorkForce WF-7840" }, { ad: "SureColor SC-P700" }, { ad: "EcoTank ET-16650" }] },
      { ad: "Brother", modeller: [{ ad: "DCP-L3550CDW" }, { ad: "MFC-L8900CDW" }, { ad: "HL-L2350DW" }, { ad: "MFC-J6945DW" }] },
      { ad: "Xerox", modeller: [{ ad: "VersaLink C405" }, { ad: "WorkCentre 6515" }, { ad: "VersaLink B405" }, { ad: "AltaLink C8145" }] },
      { ad: "Ricoh", modeller: [{ ad: "IM C2010" }, { ad: "IM 2702" }, { ad: "SP 230DNw" }, { ad: "IM C300F" }] },
      { ad: "Kyocera", modeller: [{ ad: "ECOSYS M2640idw" }, { ad: "ECOSYS P2235dn" }, { ad: "TASKalfa 2553ci" }] },
      { ad: "Konica Minolta", modeller: [{ ad: "bizhub C257i" }, { ad: "bizhub 4752" }, { ad: "bizhub C3350i" }] },
      { ad: "Lexmark", modeller: [{ ad: "MX622ade" }, { ad: "CS521dn" }, { ad: "MB2650adwe" }] },
      { ad: "Zebra", modeller: [{ ad: "ZD420" }, { ad: "ZD621" }, { ad: "ZT411" }, { ad: "ZD230" }] },
    ],
  },
  {
    id: "kamera",
    ad: "Kamera / Optik",
    emoji: "📷",
    tanimlar: [
      { ad: "Fotoğraf Makinesi" }, { ad: "Video Kamera" }, { ad: "Güvenlik Kamerası" },
      { ad: "Drone" }, { ad: "Lens" }, { ad: "Aksiyon Kamera" }, { ad: "360 Kamera" },
    ],
    markalar: [
      { ad: "Canon", modeller: [{ ad: "EOS R6 Mark II" }, { ad: "EOS R50" }, { ad: "EOS R8" }, { ad: "EOS R5" }, { ad: "EOS M50 Mark II" }, { ad: "PowerShot V10" }] },
      { ad: "Sony", modeller: [{ ad: "Alpha A7R V" }, { ad: "Alpha A7 IV" }, { ad: "Alpha A6700" }, { ad: "ZV-E10 II" }, { ad: "FX3" }, { ad: "RX100 VII" }] },
      { ad: "Nikon", modeller: [{ ad: "Z8" }, { ad: "Z6 III" }, { ad: "Z50 II" }, { ad: "Z30" }, { ad: "Zfc" }, { ad: "D3500" }] },
      { ad: "Fujifilm", modeller: [{ ad: "X-T5" }, { ad: "X-S20" }, { ad: "X100VI" }, { ad: "GFX100S II" }, { ad: "Instax Mini 12" }] },
      { ad: "DJI", modeller: [{ ad: "Mavic 3 Pro" }, { ad: "Mini 4 Pro" }, { ad: "Air 3" }, { ad: "Osmo Action 4" }, { ad: "Osmo Pocket 3" }, { ad: "Avata 2" }] },
      { ad: "GoPro", modeller: [{ ad: "Hero 13 Black" }, { ad: "Hero 12 Black" }, { ad: "Hero 11 Black" }, { ad: "Max" }] },
      { ad: "Panasonic", modeller: [{ ad: "Lumix S5 II" }, { ad: "Lumix G9 II" }, { ad: "HC-X2000" }] },
      { ad: "Olympus / OM System", modeller: [{ ad: "OM-1 Mark II" }, { ad: "OM-5" }, { ad: "OM-10 Mark IV" }] },
      { ad: "Insta360", modeller: [{ ad: "X4" }, { ad: "ONE X3" }, { ad: "GO 3S" }, { ad: "Ace Pro" }] },
      { ad: "Leica", modeller: [{ ad: "Q3" }, { ad: "M11" }, { ad: "SL3" }, { ad: "D-Lux 8" }] },
    ],
  },
  {
    id: "kucuk-ev-aletleri",
    ad: "Küçük Ev Aletleri",
    emoji: "🔧",
    tanimlar: [
      { ad: "Süpürge" }, { ad: "Robot Süpürge" }, { ad: "Blender" },
      { ad: "Kahve Makinesi" }, { ad: "Ütü" }, { ad: "Saç Kurutma Makinesi" },
      { ad: "Tost Makinesi" }, { ad: "Fritöz" }, { ad: "Su Isıtıcı" }, { ad: "Çay Makinesi" },
    ],
    markalar: [
      { ad: "Philips", modeller: [{ ad: "Series 3000 Süpürge" }, { ad: "Airfryer XL HD9270" }, { ad: "3200 Kahve Makinesi" }, { ad: "SpeedPro Max Süpürge" }, { ad: "GC9682 Buharlı Ütü" }] },
      { ad: "Tefal", modeller: [{ ad: "Express Steam GV9620" }, { ad: "Turbo Pro FV5688" }, { ad: "Blendforce BL968" }, { ad: "ActiFry Genius XL" }, { ad: "Principio Tost" }] },
      { ad: "Dyson", modeller: [{ ad: "V15 Detect" }, { ad: "V12 Detect Slim" }, { ad: "V8 Absolute" }, { ad: "Airwrap Multi-Styler" }, { ad: "Supersonic Saç Kurutma" }, { ad: "360 Vis Nav Robot" }] },
      { ad: "Bosch", modeller: [{ ad: "Serie 8 BCS812KA2" }, { ad: "Tassimo Finesse" }, { ad: "ErgoMixx MS6CM4160" }, { ad: "VitaBoost MMB6172S" }] },
      { ad: "Arçelik", modeller: [{ ad: "Robotic 8302 Robot Süpürge" }, { ad: "Barista 3600 Espresso" }, { ad: "K 7340 Kettle" }, { ad: "ÇD 9344 Çay Makinesi" }] },
      { ad: "Rowenta", modeller: [{ ad: "X-Force Flex 14.60" }, { ad: "DW9230 Perfect Steam" }, { ad: "RO8371 Silence Force" }] },
      { ad: "Braun", modeller: [{ ad: "MultiQuick 9 MQ9135" }, { ad: "CareStyle 7 IS7156" }, { ad: "Satin Hair 7 HD785" }] },
      { ad: "Karcher", modeller: [{ ad: "VC 5 Premium" }, { ad: "WD 3 P Extension" }, { ad: "DS 5.800" }] },
      { ad: "Electrolux", modeller: [{ ad: "EFP51408" }, { ad: "PERFECTCARE 900" }, { ad: "Explore 8 Robot" }] },
      { ad: "Fakir", modeller: [{ ad: "Cruiser X Robot" }, { ad: "Veyron Turbo Pro" }, { ad: "Barista Espresso" }] },
    ],
  },
  {
    id: "ses-sistemleri",
    ad: "Ses / Müzik Ekipmanları",
    emoji: "🔊",
    tanimlar: [
      { ad: "Amplifikatör" }, { ad: "Hoparlör" }, { ad: "Soundbar" },
      { ad: "Ev Sinema Sistemi" }, { ad: "Mikser" }, { ad: "Subwoofer" },
      { ad: "Pikap" }, { ad: "Müzik Seti" },
    ],
    markalar: [
      { ad: "Sony", modeller: [{ ad: "HT-A9M2" }, { ad: "HT-A7000" }, { ad: "HT-S2000" }, { ad: "STR-AN1000" }, { ad: "SRS-XG500" }] },
      { ad: "Samsung", modeller: [{ ad: "HW-Q990D" }, { ad: "HW-Q800D" }, { ad: "HW-S800D" }, { ad: "MX-T70" }] },
      { ad: "Bose", modeller: [{ ad: "Smart Soundbar 900" }, { ad: "Smart Soundbar 600" }, { ad: "Smart Soundbar 300" }, { ad: "QuietComfort Headphones" }] },
      { ad: "Yamaha", modeller: [{ ad: "RX-V6A" }, { ad: "RX-A4A" }, { ad: "MusicCast BAR 400" }, { ad: "NS-800A" }] },
      { ad: "JBL", modeller: [{ ad: "Bar 1000" }, { ad: "Bar 500" }, { ad: "Xtreme 4" }, { ad: "Charge 5" }, { ad: "PartyBox 310" }] },
      { ad: "Denon", modeller: [{ ad: "AVR-X3800H" }, { ad: "AVR-X1800H" }, { ad: "DHT-S517" }] },
      { ad: "Pioneer", modeller: [{ ad: "SC-LX904" }, { ad: "VSX-935" }, { ad: "PLX-1000 Pikap" }] },
      { ad: "Harman Kardon", modeller: [{ ad: "Onyx Studio 8" }, { ad: "Citation 300" }, { ad: "AVR 1710S" }] },
      { ad: "Sonos", modeller: [{ ad: "Arc Ultra" }, { ad: "Era 300" }, { ad: "Era 100" }, { ad: "Sub Mini" }] },
      { ad: "Marshall", modeller: [{ ad: "Woburn III" }, { ad: "Stanmore III" }, { ad: "Acton III" }, { ad: "Emberton III" }] },
    ],
  },
  {
    id: "bilgisayar",
    ad: "Bilgisayar / Laptop",
    emoji: "💻",
    tanimlar: [
      { ad: "Laptop" }, { ad: "Masaüstü Bilgisayar" }, { ad: "All-in-One" },
      { ad: "Tablet PC" }, { ad: "Mini PC" }, { ad: "İş İstasyonu" },
    ],
    markalar: [
      { ad: "Apple", modeller: [{ ad: "MacBook Pro 16 M4" }, { ad: "MacBook Pro 14 M4" }, { ad: "MacBook Air 15 M3" }, { ad: "MacBook Air 13 M3" }, { ad: "Mac Mini M4" }, { ad: "iMac 24 M4" }, { ad: "Mac Pro M2 Ultra" }] },
      { ad: "Dell", modeller: [{ ad: "XPS 15 9530" }, { ad: "XPS 13 9340" }, { ad: "Inspiron 15 3535" }, { ad: "Latitude 5540" }, { ad: "Alienware m18 R2" }, { ad: "OptiPlex 7010" }] },
      { ad: "HP", modeller: [{ ad: "EliteBook 840 G11" }, { ad: "ProBook 450 G10" }, { ad: "Spectre x360 14" }, { ad: "Envy x360 15" }, { ad: "Pavilion 15" }, { ad: "OMEN 16" }] },
      { ad: "Lenovo", modeller: [{ ad: "ThinkPad X1 Carbon Gen 12" }, { ad: "ThinkPad E14 Gen 6" }, { ad: "IdeaPad Slim 5" }, { ad: "Legion 5 Pro" }, { ad: "Yoga 9i" }, { ad: "LOQ 15IRH8" }] },
      { ad: "Asus", modeller: [{ ad: "ZenBook 14 OLED" }, { ad: "VivoBook 15" }, { ad: "ROG Strix G16" }, { ad: "ProArt Studiobook 16" }, { ad: "ExpertBook B9" }] },
      { ad: "Acer", modeller: [{ ad: "Swift Go 14" }, { ad: "Aspire 5" }, { ad: "Nitro 5" }, { ad: "Predator Helios 16" }, { ad: "ConceptD 7" }] },
      { ad: "MSI", modeller: [{ ad: "Titan GT77 HX" }, { ad: "Raider GE78 HX" }, { ad: "Stealth 15M" }, { ad: "Creator Z17 HX" }, { ad: "Prestige 16" }] },
      { ad: "Microsoft", modeller: [{ ad: "Surface Pro 10" }, { ad: "Surface Laptop 6" }, { ad: "Surface Laptop Studio 2" }, { ad: "Surface Go 4" }] },
      { ad: "Huawei", modeller: [{ ad: "MateBook X Pro 2024" }, { ad: "MateBook D 16" }, { ad: "MateBook 14s" }] },
      { ad: "Samsung", modeller: [{ ad: "Galaxy Book4 Ultra" }, { ad: "Galaxy Book4 Pro" }, { ad: "Galaxy Book4 360" }] },
    ],
  },
  {
    id: "endustriyel",
    ad: "Elektronik Devre / Endüstriyel",
    emoji: "🔌",
    tanimlar: [
      { ad: "Frekans İnvertörü" }, { ad: "PLC" }, { ad: "Servo Motor" },
      { ad: "Güç Kaynağı" }, { ad: "Trafo" }, { ad: "Akü" },
      { ad: "Solar Panel İnvertörü" }, { ad: "Şarj Kontrol Cihazı" }, { ad: "Enerji Analizörü" },
    ],
    markalar: [
      { ad: "Siemens", modeller: [{ ad: "SINAMICS G120" }, { ad: "SINAMICS V20" }, { ad: "SIMATIC S7-1200" }, { ad: "SIMATIC S7-300" }, { ad: "SITOP PSU100S" }] },
      { ad: "Schneider Electric", modeller: [{ ad: "Altivar ATV312" }, { ad: "Altivar ATV630" }, { ad: "Modicon M221" }, { ad: "Modicon M340" }, { ad: "APC Smart-UPS" }] },
      { ad: "ABB", modeller: [{ ad: "ACS550" }, { ad: "ACS880" }, { ad: "AC500 PLC" }, { ad: "IRC5 Robot Kontrolcü" }] },
      { ad: "Omron", modeller: [{ ad: "3G3MX2 İnvertör" }, { ad: "CP1H PLC" }, { ad: "NX1P2 PLC" }, { ad: "S8VK Güç Kaynağı" }] },
      { ad: "Mitsubishi Electric", modeller: [{ ad: "FR-A800 İnvertör" }, { ad: "FR-E800" }, { ad: "MELSEC iQ-R" }, { ad: "MELSERVO MR-J4" }] },
      { ad: "Delta", modeller: [{ ad: "VFD-MS300" }, { ad: "VFD-C200" }, { ad: "AS200 PLC" }, { ad: "DVP28SV PLC" }] },
      { ad: "Legrand", modeller: [{ ad: "Keor LP UPS" }, { ad: "Daker DK" }, { ad: "Niky S UPS" }] },
      { ad: "Eaton", modeller: [{ ad: "9PX UPS" }, { ad: "5P UPS" }, { ad: "EllipseECO" }, { ad: "PowerWare 9130" }] },
      { ad: "Huawei Solar", modeller: [{ ad: "SUN2000-5KTL" }, { ad: "SUN2000-10KTL" }, { ad: "LUNA2000 Batarya" }] },
      { ad: "SMA", modeller: [{ ad: "Sunny Boy 5.0" }, { ad: "Sunny Tripower 15" }, { ad: "Sunny Island 6.0" }] },
    ],
  },
  {
    id: "oto-elektronik",
    ad: "Oto Elektronik",
    emoji: "🚗",
    tanimlar: [
      { ad: "Oto Teyp" }, { ad: "Navigasyon" }, { ad: "Oto Amplifikatör" },
      { ad: "Oto Hoparlör" }, { ad: "Araç Kamerası" }, { ad: "Park Sensörü" },
      { ad: "OBD Cihazı" }, { ad: "Alarm Sistemi" }, { ad: "Ekran" }, { ad: "Akü Şarj Cihazı" },
    ],
    markalar: [
      { ad: "Pioneer", modeller: [{ ad: "SPH-DA160DAB" }, { ad: "AVH-Z9200DAB" }, { ad: "DMH-A3300DAB" }, { ad: "TS-G1720F Hoparlör" }] },
      { ad: "Sony", modeller: [{ ad: "XAV-AX8150D" }, { ad: "XAV-AX5650D" }, { ad: "XAV-1550D" }] },
      { ad: "JVC", modeller: [{ ad: "KW-M785DBW" }, { ad: "KD-X472DBT" }, { ad: "KW-V960BW" }] },
      { ad: "Kenwood", modeller: [{ ad: "DMX8021DABS" }, { ad: "DMX7722DABS" }, { ad: "DDX9020DABS" }] },
      { ad: "Alpine", modeller: [{ ad: "iLX-W690D" }, { ad: "iLX-705D" }, { ad: "X209-WRA" }] },
      { ad: "Garmin", modeller: [{ ad: "DriveSmart 76" }, { ad: "DriveSmart 66" }, { ad: "Camper 895" }, { ad: "DriveAssist 51" }] },
      { ad: "Blaupunkt", modeller: [{ ad: "Madrid 990" }, { ad: "Oslo 590" }, { ad: "Toronto 600" }] },
      { ad: "Clarion", modeller: [{ ad: "NX302E" }, { ad: "CX503E" }, { ad: "NX502E" }] },
      { ad: "Viper", modeller: [{ ad: "5906V Alarm" }, { ad: "5706V Alarm" }, { ad: "4806V Alarm" }] },
      { ad: "CTEK", modeller: [{ ad: "MXS 5.0" }, { ad: "MXS 10" }, { ad: "CS FREE" }, { ad: "MULTI XT 14000" }] },
    ],
  },
  {
    id: "medikal",
    ad: "Medikal / Sağlık Cihazları",
    emoji: "🏥",
    tanimlar: [
      { ad: "Tansiyon Aleti" }, { ad: "Nabız Oksimetre" }, { ad: "Kan Şekeri Ölçer" },
      { ad: "Nebülizatör" }, { ad: "İşitme Cihazı" }, { ad: "TENS Cihazı" },
      { ad: "Terapi Lambası" }, { ad: "Sterilizatör" }, { ad: "Beden Analiz Tartısı" }, { ad: "Termometre" },
    ],
    markalar: [
      { ad: "Omron", modeller: [{ ad: "M6 Comfort HEM-7360-E" }, { ad: "M3 HEM-7154-E" }, { ad: "NE-C803 Nebülizatör" }, { ad: "HBF-514C Tartı" }] },
      { ad: "Beurer", modeller: [{ ad: "BM 81 Tansiyon" }, { ad: "BM 96 Cardio" }, { ad: "IH 50 Nebülizatör" }, { ad: "EM 95 TENS" }, { ad: "BF 1000 Tartı" }] },
      { ad: "Microlife", modeller: [{ ad: "BP A7 Touch" }, { ad: "BP A3 Plus" }, { ad: "NEB 400" }] },
      { ad: "Philips", modeller: [{ ad: "InnoSpire Go Nebülizatör" }, { ad: "DL8765 Işık Terapi" }, { ad: "Sonicare DiamondClean" }] },
      { ad: "A&D Medical", modeller: [{ ad: "UA-611" }, { ad: "UA-651BLE" }, { ad: "TM-2441" }] },
      { ad: "Welch Allyn", modeller: [{ ad: "ProBP 3400" }, { ad: "Connex Spot Monitor" }, { ad: "Otoscope 3.5V" }] },
      { ad: "Contec", modeller: [{ ad: "CMS50D Oksimetre" }, { ad: "CMS60C Holter" }, { ad: "CMS8000 Monitör" }] },
      { ad: "Yuwell", modeller: [{ ad: "YE660D" }, { ad: "YE690A" }, { ad: "YU300 Oksimetre" }] },
      { ad: "iHealth", modeller: [{ ad: "Track BP5" }, { ad: "Clear BP3L" }, { ad: "Feel BP3" }] },
      { ad: "ResMed", modeller: [{ ad: "AirSense 11 CPAP" }, { ad: "AirMini CPAP" }, { ad: "AirCurve 10 BiPAP" }] },
    ],
  },
  {
    id: "guvenlik",
    ad: "Güvenlik Sistemleri",
    emoji: "🔑",
    tanimlar: [
      { ad: "IP Kamera" }, { ad: "DVR / NVR Kayıt Cihazı" }, { ad: "Alarm Paneli" },
      { ad: "Hareket Sensörü" }, { ad: "Kartlı Geçiş Sistemi" }, { ad: "Parmak İzi Okuyucu" },
      { ad: "Interkom" }, { ad: "Flaşör Siren" }, { ad: "Güvenlik Güç Kaynağı" }, { ad: "Video Kapı Zili" },
    ],
    markalar: [
      { ad: "Hikvision", modeller: [{ ad: "DS-2CD2T47G2-L" }, { ad: "DS-2CD2143G2-I" }, { ad: "DS-7208HGHI-K1 DVR" }, { ad: "DS-9616NI-M8 NVR" }, { ad: "DS-K1T342MIWX" }] },
      { ad: "Dahua", modeller: [{ ad: "IPC-HDW2849H-S-IL" }, { ad: "IPC-HFW2849S-S-IL" }, { ad: "XVR5108HS-4KL-I3 DVR" }, { ad: "DHI-ASI3214Y" }] },
      { ad: "Bosch", modeller: [{ ad: "FLEXIDOME 5100i" }, { ad: "DINION 5100i IR" }, { ad: "Solution 3000 Alarm" }, { ad: "B915F PIR Sensör" }] },
      { ad: "Honeywell", modeller: [{ ad: "HQA Series Kamera" }, { ad: "Vista 20P Alarm" }, { ad: "Pro-Watch Geçiş" }, { ad: "DT8035 Sensör" }] },
      { ad: "Axis", modeller: [{ ad: "P3265-V" }, { ad: "M3106-L Mk II" }, { ad: "Q6135-LE PTZ" }, { ad: "A1001 Geçiş" }] },
      { ad: "Ajax", modeller: [{ ad: "Hub 2 Plus" }, { ad: "MotionCam Outdoor" }, { ad: "DoorProtect Plus" }, { ad: "KeyPad TouchScreen" }] },
      { ad: "Paradox", modeller: [{ ad: "EVO192 Panel" }, { ad: "SP6000 Panel" }, { ad: "K641R Klavye" }, { ad: "PMD75 Sensör" }] },
      { ad: "Risco", modeller: [{ ad: "LightSYS+" }, { ad: "ProSYS Plus" }, { ad: "iPROX Okuyucu" }] },
      { ad: "Hanwha", modeller: [{ ad: "QNV-8080R" }, { ad: "XNV-8080R" }, { ad: "HRX-1635" }] },
      { ad: "Uniview", modeller: [{ ad: "IPC3614SB-ADF28KM" }, { ad: "IPC3618SB-ADF28KM" }, { ad: "NVR504-32B NVR" }] },
    ],
  },
];
