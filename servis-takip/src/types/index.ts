import type {
  Brand,
  Customer,
  DeviceModel,
  DeviceType,
  Prisma,
  ServiceOrder,
  Shop,
  StatusLog,
} from "@prisma/client";

export type {
  Brand,
  Customer,
  DeviceModel,
  DeviceType,
  ServiceOrder,
  Shop,
  StatusLog,
};

export type ServiceOrderWithRelations = Prisma.ServiceOrderGetPayload<{
  include: {
    shop: true;
    customer: true;
    deviceType: true;
    brand: true;
    deviceModel: true;
    statusLogs: true;
  };
}>;

export type CustomerWithOrders = Prisma.CustomerGetPayload<{
  include: {
    orders: true;
  };
}>;

export type ShopWithRelations = Prisma.ShopGetPayload<{
  include: {
    customers: true;
    orders: true;
    deviceTypes: true;
    brands: true;
    models: true;
  };
}>;
