import mongoose from "mongoose";

export type OrderChannel = "website" | "amazon" | "blinkit";
export type OrderStatus = "PLACED" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export interface IOrderItem {
  sku: string;
  name: string;
  qty: number;
  price: number;
}

export interface IOrder extends mongoose.Document {
  externalId: string;
  channel: OrderChannel;
  createdAt: Date;
  updatedAt: Date;
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  items: IOrderItem[];
  total: number;
  currency: string;
  status: OrderStatus;
  statusHistory: Array<{
    status: OrderStatus;
    changedAt: Date;
    changedBy?: string;
  }>;
}

const orderItemSchema = new mongoose.Schema<IOrderItem>(
  {
    sku: { type: String, required: true },
    name: { type: String, required: true },
    qty: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema<IOrder>(
  {
    externalId: { type: String, required: true, index: true },
    channel: { type: String, enum: ["website", "amazon", "blinkit"], required: true, index: true },
    customer: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String }
    },
    items: { type: [orderItemSchema], required: true },
    total: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: "INR" },
    status: {
      type: String,
      enum: ["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"],
      required: true,
      default: "PLACED",
      index: true
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        changedAt: { type: Date, required: true, default: Date.now },
        changedBy: { type: String }
      }
    ]
  },
  { timestamps: true }
);

orderSchema.index({ externalId: 1, channel: 1 }, { unique: true });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ channel: 1, createdAt: -1 });

export const Order = mongoose.model<IOrder>("Order", orderSchema);
