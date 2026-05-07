/**
 * İlk kullanıcıya bağlı dükkan için örnek veriler (userId dolu shop).
 *
 * Çalıştır (proje kökünden):
 *   npx tsx src/scripts/seed-demo.ts
 */

import type { Customer, DeviceModel } from "@prisma/client";

import { prisma } from "../lib/prisma";

async function seedDemo() {
  const shops = await prisma.shop.findMany();
  console.log(
    "Mevcut shop'lar:",
    shops.map((s) => ({ id: s.id, name: s.name, userId: s.userId })),
  );

  const shop = await prisma.shop.findFirst({
    where: { userId: { not: null } },
  });

  if (!shop) {
    console.log("Shop bulunamadı!");
    return;
  }

  console.log(`Shop bulundu: ${shop.name} (${shop.id})`);

  console.log("Demo veriler ekleniyor...");

  // ==================
  // 1. CİHAZ TÜRLERİ & MARKALAR & MODELLER
  // ==================

  let oyunKonsolu = await prisma.deviceType.findFirst({
    where: { shopId: shop.id, name: "Oyun Konsolu" },
  });
  if (!oyunKonsolu) {
    oyunKonsolu = await prisma.deviceType.create({
      data: { shopId: shop.id, name: "Oyun Konsolu" },
    });
  }

  let playstation = await prisma.brand.findFirst({
    where: { shopId: shop.id, name: "Playstation" },
  });
  if (!playstation) {
    playstation = await prisma.brand.create({
      data: {
        shopId: shop.id,
        name: "Playstation",
        deviceTypeId: oyunKonsolu.id,
      },
    });
  }
  const psModels = ["Playstation 3", "Playstation 4", "Playstation 5"];
  const psModelRecords: DeviceModel[] = [];
  for (const name of psModels) {
    let m = await prisma.deviceModel.findFirst({
      where: { shopId: shop.id, brandId: playstation.id, name },
    });
    if (!m) {
      m = await prisma.deviceModel.create({
        data: { shopId: shop.id, brandId: playstation.id, name },
      });
    }
    psModelRecords.push(m);
  }

  let xbox = await prisma.brand.findFirst({
    where: { shopId: shop.id, name: "XBOX" },
  });
  if (!xbox) {
    xbox = await prisma.brand.create({
      data: {
        shopId: shop.id,
        name: "XBOX",
        deviceTypeId: oyunKonsolu.id,
      },
    });
  }
  const xboxModels = ["XBOX 360", "XBOX Series S", "XBOX Series X"];
  const xboxModelRecords: DeviceModel[] = [];
  for (const name of xboxModels) {
    let m = await prisma.deviceModel.findFirst({
      where: { shopId: shop.id, brandId: xbox.id, name },
    });
    if (!m) {
      m = await prisma.deviceModel.create({
        data: { shopId: shop.id, brandId: xbox.id, name },
      });
    }
    xboxModelRecords.push(m);
  }

  let nintendo = await prisma.brand.findFirst({
    where: { shopId: shop.id, name: "Nintendo" },
  });
  if (!nintendo) {
    nintendo = await prisma.brand.create({
      data: {
        shopId: shop.id,
        name: "Nintendo",
        deviceTypeId: oyunKonsolu.id,
      },
    });
  }
  const nintendoModels = ["Wii", "Switch"];
  const nintendoModelRecords: DeviceModel[] = [];
  for (const name of nintendoModels) {
    let m = await prisma.deviceModel.findFirst({
      where: { shopId: shop.id, brandId: nintendo.id, name },
    });
    if (!m) {
      m = await prisma.deviceModel.create({
        data: { shopId: shop.id, brandId: nintendo.id, name },
      });
    }
    nintendoModelRecords.push(m);
  }

  let psp = await prisma.brand.findFirst({
    where: { shopId: shop.id, name: "PSP" },
  });
  if (!psp) {
    psp = await prisma.brand.create({
      data: {
        shopId: shop.id,
        name: "PSP",
        deviceTypeId: oyunKonsolu.id,
      },
    });
  }
  const pspModels = ["PSP 2000", "PSP 3000", "PSP Slim"];
  const pspModelRecords: DeviceModel[] = [];
  for (const name of pspModels) {
    let m = await prisma.deviceModel.findFirst({
      where: { shopId: shop.id, brandId: psp.id, name },
    });
    if (!m) {
      m = await prisma.deviceModel.create({
        data: { shopId: shop.id, brandId: psp.id, name },
      });
    }
    pspModelRecords.push(m);
  }

  console.log("Tanımlar eklendi");

  // ==================
  // 2. MÜŞTERİLER
  // ==================
  const customers = [
    {
      name: "Ahmet Yılmaz",
      phone: "+90 532 111 22 33",
      phoneDigits: "905321112233",
    },
    {
      name: "Fatma Kaya",
      phone: "+90 541 222 33 44",
      phoneDigits: "905412223344",
    },
    {
      name: "Mehmet Demir",
      phone: "+90 555 333 44 55",
      phoneDigits: "905553334455",
    },
    {
      name: "Ayşe Çelik",
      phone: "+90 542 444 55 66",
      phoneDigits: "905424445566",
    },
    {
      name: "Mustafa Şahin",
      phone: "+90 553 555 66 77",
      phoneDigits: "905535556677",
    },
    {
      name: "Zeynep Arslan",
      phone: "+90 544 666 77 88",
      phoneDigits: "905446667788",
    },
    {
      name: "Ali Koç",
      phone: "+90 532 777 88 99",
      phoneDigits: "905327778899",
    },
    {
      name: "Elif Yıldız",
      phone: "+90 541 888 99 00",
      phoneDigits: "905418889900",
    },
  ];

  const createdCustomers: Customer[] = [];
  for (const c of customers) {
    let customer = await prisma.customer.findFirst({
      where: { shopId: shop.id, name: c.name },
    });
    if (!customer) {
      customer = await prisma.customer.create({
        data: { shopId: shop.id, ...c },
      });
    }
    createdCustomers.push(customer);
  }
  console.log("Müşteriler eklendi");

  // ==================
  // 3. SERVİS KAYITLARI
  // ==================
  const getNextOrderNumber = async () => {
    const year = 2026;
    const month = "05";
    const prefix = `${year}${month}`;
    const last = await prisma.serviceOrder.findFirst({
      where: {
        shopId: shop.id,
        orderNumber: { startsWith: prefix },
      },
      orderBy: { orderNumber: "desc" },
    });
    const seq = last?.orderNumber
      ? String(parseInt(last.orderNumber.slice(-3), 10) + 1).padStart(3, "0")
      : "001";
    return `${prefix}${seq}`;
  };

  const orders = [
    {
      customer: createdCustomers[0],
      brandId: playstation.id,
      deviceTypeId: oyunKonsolu.id,
      deviceModelId: psModelRecords[2].id,
      serialNo: "PS5-XA234567",
      status: "in_service",
      complaint: "Disk okuyucu çalışmıyor",
      warrantyStatus: "no_warranty",
      totalPrice: 0,
      estimatedPrice: 3500,
      arrivedAt: new Date(2026, 4, 1),
    },
    {
      customer: createdCustomers[1],
      brandId: xbox.id,
      deviceTypeId: oyunKonsolu.id,
      deviceModelId: xboxModelRecords[2].id,
      serialNo: "XSX-BF789012",
      status: "waiting_approval",
      complaint: "Açılmıyor, güç sorunu var",
      warrantyStatus: "no_warranty",
      totalPrice: 0,
      estimatedPrice: 2800,
      arrivedAt: new Date(2026, 4, 2),
    },
    {
      customer: createdCustomers[2],
      brandId: nintendo.id,
      deviceTypeId: oyunKonsolu.id,
      deviceModelId: nintendoModelRecords[1].id,
      serialNo: "NSW-GH345678",
      status: "approval_given",
      complaint: "Joy-Con drift sorunu, sol analog çalışmıyor",
      warrantyStatus: "no_warranty",
      totalPrice: 0,
      estimatedPrice: 1200,
      arrivedAt: new Date(2026, 4, 3),
    },
    {
      customer: createdCustomers[3],
      brandId: playstation.id,
      deviceTypeId: oyunKonsolu.id,
      deviceModelId: psModelRecords[1].id,
      serialNo: "PS4-JK901234",
      status: "waiting_part",
      complaint: "HDMI çıkışı görüntü vermiyor",
      warrantyStatus: "no_warranty",
      totalPrice: 0,
      estimatedPrice: 1800,
      arrivedAt: new Date(2026, 4, 3),
    },
    {
      customer: createdCustomers[4],
      brandId: psp.id,
      deviceTypeId: oyunKonsolu.id,
      deviceModelId: pspModelRecords[1].id,
      serialNo: "PSP3-MN567890",
      status: "completed",
      complaint: "Ekran yarısı karanlık, arka ışık sorunu",
      warrantyStatus: "no_warranty",
      totalPrice: 950,
      estimatedPrice: 950,
      arrivedAt: new Date(2026, 4, 4),
    },
    {
      customer: createdCustomers[5],
      brandId: playstation.id,
      deviceTypeId: oyunKonsolu.id,
      deviceModelId: psModelRecords[2].id,
      serialNo: "PS5-PQ123456",
      status: "delivered",
      complaint: "Fan aşırı gürültü yapıyor",
      warrantyStatus: "no_warranty",
      totalPrice: 1500,
      estimatedPrice: 1500,
      arrivedAt: new Date(2026, 4, 1),
    },
    {
      customer: createdCustomers[6],
      brandId: xbox.id,
      deviceTypeId: oyunKonsolu.id,
      deviceModelId: xboxModelRecords[0].id,
      serialNo: "X360-RS234567",
      status: "repair_failed",
      complaint: "Kırmızı ışık hatası (RROD)",
      warrantyStatus: "no_warranty",
      repairFailedReason:
        "GPU bağlantı noktaları tamamen yanmış, ekonomik tamir mümkün değil",
      totalPrice: 0,
      estimatedPrice: 0,
      arrivedAt: new Date(2026, 4, 2),
    },
    {
      customer: createdCustomers[7],
      brandId: nintendo.id,
      deviceTypeId: oyunKonsolu.id,
      deviceModelId: nintendoModelRecords[0].id,
      serialNo: "WII-TU345678",
      status: "returned_device",
      complaint: "Disk okuyucu motor arızası",
      warrantyStatus: "no_warranty",
      totalPrice: 0,
      estimatedPrice: 800,
      arrivedAt: new Date(2026, 4, 5),
    },
    {
      customer: createdCustomers[0],
      brandId: psp.id,
      deviceTypeId: oyunKonsolu.id,
      deviceModelId: pspModelRecords[0].id,
      serialNo: "PSP2-VW456789",
      status: "sent_to_external",
      complaint: "UMD kapağı kırık, menteşe tamiri",
      warrantyStatus: "no_warranty",
      totalPrice: 0,
      estimatedPrice: 600,
      arrivedAt: new Date(2026, 4, 4),
    },
    {
      customer: createdCustomers[2],
      brandId: xbox.id,
      deviceTypeId: oyunKonsolu.id,
      deviceModelId: xboxModelRecords[1].id,
      serialNo: "XSS-XY567890",
      status: "customer_return_request",
      complaint: "Oyun yüklenmiyor, SSD sorunu şüphesi",
      warrantyStatus: "no_warranty",
      totalPrice: 0,
      estimatedPrice: 2200,
      arrivedAt: new Date(2026, 4, 5),
    },
  ];

  for (const orderData of orders) {
    const orderNumber = await getNextOrderNumber();
    const { customer, ...rest } = orderData;
    await prisma.serviceOrder.create({
      data: {
        shopId: shop.id,
        customerId: customer.id,
        orderNumber,
        isTampered: false,
        arrivedByCargo: false,
        ...rest,
      },
    });
    console.log(`Kayıt oluşturuldu: ${orderNumber}`);
  }

  // ==================
  // 4. STOK
  // ==================
  const spareParts = [
    {
      name: "PS5 Disk Okuyucu",
      partCode: "PS5-DSK-001",
      cost: 1200,
      stock: 2,
      brandId: playstation.id,
      deviceTypeId: oyunKonsolu.id,
    },
    {
      name: "PS5 Fan",
      partCode: "PS5-FAN-001",
      cost: 350,
      stock: 5,
      brandId: playstation.id,
      deviceTypeId: oyunKonsolu.id,
    },
    {
      name: "PS4 HDMI Port",
      partCode: "PS4-HDMI-001",
      cost: 180,
      stock: 0,
      brandId: playstation.id,
      deviceTypeId: oyunKonsolu.id,
    },
    {
      name: "XBOX Series X Güç Kartı",
      partCode: "XSX-PWR-001",
      cost: 800,
      stock: 1,
      brandId: xbox.id,
      deviceTypeId: oyunKonsolu.id,
    },
    {
      name: "XBOX 360 GPU Soğutucu",
      partCode: "X360-GPU-001",
      cost: 250,
      stock: 3,
      brandId: xbox.id,
      deviceTypeId: oyunKonsolu.id,
    },
    {
      name: "Switch Joy-Con Sol",
      partCode: "NSW-JCL-001",
      cost: 650,
      stock: 4,
      brandId: nintendo.id,
      deviceTypeId: oyunKonsolu.id,
    },
    {
      name: "Switch Joy-Con Sağ",
      partCode: "NSW-JCR-001",
      cost: 650,
      stock: 4,
      brandId: nintendo.id,
      deviceTypeId: oyunKonsolu.id,
    },
    {
      name: "PSP 3000 Ekran",
      partCode: "PSP3-SCR-001",
      cost: 420,
      stock: 2,
      brandId: psp.id,
      deviceTypeId: oyunKonsolu.id,
    },
    {
      name: "PSP 2000 UMD Kapak",
      partCode: "PSP2-UMD-001",
      cost: 150,
      stock: 0,
      brandId: psp.id,
      deviceTypeId: oyunKonsolu.id,
    },
    {
      name: "PS5 Ana Kart",
      partCode: "PS5-MB-001",
      cost: 4500,
      stock: 1,
      brandId: playstation.id,
      deviceTypeId: oyunKonsolu.id,
    },
  ];

  for (const part of spareParts) {
    const exists = await prisma.sparePart.findFirst({
      where: { shopId: shop.id, partCode: part.partCode },
    });
    if (!exists) {
      await prisma.sparePart.create({
        data: { shopId: shop.id, ...part },
      });
    }
  }
  console.log("Stok eklendi");

  // ==================
  // 5. İKİNCİ EL
  // ==================
  const secondHandItems = [
    {
      deviceCode: "S202605001",
      sellerName: "Oğuz Karan",
      sellerPhone: "+90 532 100 20 30",
      sellerPhoneDigits: "905321002030",
      sellerTcNo: "12345678901",
      deviceTypeId: oyunKonsolu.id,
      brandId: playstation.id,
      deviceModelId: psModelRecords[2].id,
      serialNo: "PS5-2EL-001234",
      hasInvoice: true,
      hasWarranty: false,
      hasBox: true,
      purchasePrice: 18000,
      isSold: true,
      soldPrice: 22000,
      buyerName: "Serkan Doğan",
      buyerPhone: "+90 541 200 30 40",
      buyerPhoneDigits: "905412003040",
      soldAt: new Date(2026, 4, 3),
      notes: "İyi durumda, hafif çizik var kasada",
    },
    {
      deviceCode: "S202605002",
      sellerName: "Burak Aydın",
      sellerPhone: "+90 553 200 30 40",
      sellerPhoneDigits: "905532003040",
      sellerTcNo: "98765432109",
      deviceTypeId: oyunKonsolu.id,
      brandId: nintendo.id,
      deviceModelId: nintendoModelRecords[1].id,
      serialNo: "NSW-2EL-005678",
      hasInvoice: false,
      hasWarranty: false,
      hasBox: true,
      purchasePrice: 8500,
      isSold: false,
      notes: "Joy-Con sağ analog sorunlu",
    },
    {
      deviceCode: "S202605003",
      sellerName: "Canan Yılmaz",
      sellerPhone: "+90 542 300 40 50",
      sellerPhoneDigits: "905423004050",
      sellerTcNo: "45678901234",
      deviceTypeId: oyunKonsolu.id,
      brandId: xbox.id,
      deviceModelId: xboxModelRecords[1].id,
      serialNo: "XSS-2EL-009012",
      hasInvoice: true,
      hasWarranty: true,
      hasBox: true,
      purchasePrice: 12000,
      isSold: false,
      notes: "Temiz, hiç çizik yok, garantisi devam ediyor",
    },
  ];

  for (const item of secondHandItems) {
    const exists = await prisma.secondHandDevice.findFirst({
      where: { shopId: shop.id, deviceCode: item.deviceCode },
    });
    if (!exists) {
      await prisma.secondHandDevice.create({
        data: { shopId: shop.id, ...item },
      });
    }
  }
  console.log("İkinci el eklendi");

  // ==================
  // 6. PLANLARIM
  // ==================
  const plans = [
    {
      title: "Mağaza Kirası",
      amount: 35000,
      dueDate: new Date(2026, 4, 10),
      category: "kira",
      isRecurring: true,
      recurringDay: 10,
      notes: "Her ayın 10'unda ödeniyor",
    },
    {
      title: "KSK Sony Ödeme",
      amount: 12000,
      dueDate: new Date(2026, 4, 15),
      category: "transfer",
      isRecurring: false,
      notes: "Dış servise gönderilen cihazların ödemesi",
    },
    {
      title: "Elektrik Faturası",
      amount: 4500,
      dueDate: new Date(2026, 4, 20),
      category: "fatura",
      isRecurring: true,
      recurringDay: 20,
    },
  ];

  for (const plan of plans) {
    const exists = await prisma.paymentPlan.findFirst({
      where: { shopId: shop.id, title: plan.title },
    });
    if (!exists) {
      await prisma.paymentPlan.create({
        data: { shopId: shop.id, isCompleted: false, ...plan },
      });
    }
  }
  console.log("Planlar eklendi");

  // ==================
  // 7. CARİ
  // ==================
  const cariList = [
    {
      cariCode: "C202605001",
      name: "Teknoloji Market A.Ş.",
      phone: "+90 232 400 50 60",
      phoneDigits: "902324005060",
      email: "info@teknoloji-market.com",
      address: "Karşıyaka, İzmir",
      taxOrTcNo: "1234567890",
      taxOffice: "Karşıyaka",
      cargoInfo: "MNG Kargo",
      cargoCode: "MNG-TM-2024001",
    },
    {
      cariCode: "C202605002",
      name: "Dijital Aksesuar Ltd.",
      phone: "+90 232 500 60 70",
      phoneDigits: "902325006070",
      email: "siparis@dijitalaksesuar.com",
      address: "Bornova, İzmir",
      taxOrTcNo: "9876543210",
      taxOffice: "Bornova",
      cargoInfo: "Yurtiçi Kargo",
      cargoCode: "YK-DA-2024002",
    },
  ];

  for (const cari of cariList) {
    const exists = await prisma.cari.findFirst({
      where: { shopId: shop.id, cariCode: cari.cariCode },
    });
    if (!exists) {
      await prisma.cari.create({
        data: { shopId: shop.id, ...cari },
      });
    }
  }
  console.log("Cari eklendi");

  console.log("✅ Tüm demo veriler başarıyla eklendi!");
}

seedDemo()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
