import { api } from "../utils/axios";

export const createPayment = async (plan) => {
  const { data } = await api.post("/api/payment/create", { plan });
  return data;
};

export const verifyPayment = async ({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
}) => {
  const { data } = await api.post("/api/payment/verify", {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  });
  return data;
};
