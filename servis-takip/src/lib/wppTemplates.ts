/**
 * WPPConnect üzerinden gönderilen serbest metin mesaj şablonları.
 *
 * Meta Cloud API şablon onayına ihtiyaç duymaz — bağlı WhatsApp hesabı olduğu
 * sürece her şablon doğrudan gönderilir.
 */

export type WppTemplateOrder = {
  customer: { name: string };
  serialNo?: string | null;
  deviceModel?: { name: string } | null;
  brand?: { name: string } | null;
  deviceType?: { name: string } | null;
  repairFailedReason?: string | null;
  totalPrice?: number | null;
};

function deviceLabel(o: WppTemplateOrder): string {
  return (
    o.deviceModel?.name ||
    o.brand?.name ||
    o.deviceType?.name ||
    "cihaz"
  );
}

function serialLabel(o: WppTemplateOrder): string {
  return o.serialNo?.trim() ? o.serialNo.trim() : "belirtilmemiş";
}

export const WPP_TEMPLATES: Record<string, (order: WppTemplateOrder) => string> = {
  in_service: (o) =>
    `Sayın ${o.customer.name}, ${serialLabel(o)} seri numaralı ${deviceLabel(o)} cihazınız teknik servisimize teslim alınmıştır. Cihazınızla ilgili gelişmeleri size bildireceğiz.`,

  returned_device: (o) =>
    `Sayın ${o.customer.name}, ${serialLabel(o)} seri numaralı ${deviceLabel(o)} cihazınız teknik servisimize teslim alınmıştır. Cihazınızla ilgili gelişmeleri size bildireceğiz.`,

  waiting_approval: (o) =>
    `Sayın ${o.customer.name}, ${serialLabel(o)} seri numaralı ${deviceLabel(o)} cihazınız için onayınızı bekliyoruz. Onaylıyorsanız lütfen bu mesajı sadece "onaylıyorum" yazarak yanıtlayın.`,

  approval_given: (o) =>
    `Sayın ${o.customer.name}, ${serialLabel(o)} seri numaralı ${deviceLabel(o)} cihazınız için onay verdiniz. Cihazınızın onarımıyla ilgili sizi bilgilendireceğiz.`,

  waiting_part: (o) =>
    `Sayın ${o.customer.name}, ${serialLabel(o)} seri numaralı ${deviceLabel(o)} cihazınız için gerekli parçayı bekliyoruz. Parça temin edildiğinde cihazınızın onarımıyla ilgili sizi bilgilendireceğiz.`,

  repair_failed: (o) =>
    `Sayın ${o.customer.name}, ${serialLabel(o)} seri numaralı ${deviceLabel(o)} cihazınızın onarımı maalesef yapılamıyor. Teknik servisimizin belirlediği neden: ${o.repairFailedReason || "belirtilmemiş"} Daha fazla bilgi için teknik servisimizle iletişime geçebilirsiniz.`,

  no_problem_found: (o) =>
    `Sayın ${o.customer.name}, ${serialLabel(o)} seri numaralı ${deviceLabel(o)} cihazınızın arıza tespitinde herhangi bir sorun görülmedi. Cihazınızı teslim alabilirsiniz.`,

  customer_return_request: (o) =>
    `Sayın ${o.customer.name}, ${serialLabel(o)} seri numaralı ${deviceLabel(o)} cihazınızı iade almak istediğinizi belirttiniz. Cihazınızı teslim alabilirsiniz.`,

  completed: (o) =>
    `Sayın ${o.customer.name}, ${serialLabel(o)} seri numaralı ${deviceLabel(o)} cihazınızın onarımı tamamlanmıştır. Cihazınızı teslim alabilirsiniz.`,

  delivered: (o) =>
    `Sayın ${o.customer.name}, ${serialLabel(o)} seri numaralı ${deviceLabel(o)} cihazınız teslim edilmiştir. Bizi tercih ettiğiniz için teşekkür ederiz.`,

  delivered_repair_failed: (o) =>
    `Sayın ${o.customer.name}, ${serialLabel(o)} seri numaralı ${deviceLabel(o)} cihazınız tamiri yapılamamış olup teslim edilmiştir. Bizi tercih ettiğiniz için teşekkür ederiz.`,

  delivered_no_problem: (o) =>
    `Sayın ${o.customer.name}, ${serialLabel(o)} seri numaralı ${deviceLabel(o)} cihazınızın arıza tespitinde herhangi bir sorun görülmemiş olup teslim edilmiştir. Bizi tercih ettiğiniz için teşekkür ederiz.`,

  delivered_customer_return: (o) =>
    `Sayın ${o.customer.name}, ${serialLabel(o)} seri numaralı ${deviceLabel(o)} cihazınızı iade almak istediğinizi belirttiniz ve herhangi bir işlem yapılmadan teslim edilmiştir. Bizi tercih ettiğiniz için teşekkür ederiz.`,

  fiyat_bildirimi: (o) =>
    `Sayın ${o.customer.name}, ${serialLabel(o)} seri numaralı ${deviceLabel(o)} cihazınızın ${(o.totalPrice ?? 0).toLocaleString("tr-TR")} TL masrafı vardır. Onaylamak için lütfen bu mesajı yanıtlayın.`,
};
