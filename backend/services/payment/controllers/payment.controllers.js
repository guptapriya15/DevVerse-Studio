import razorpay from "../config/razorpay.js";
import Payment from "../models/payment.model.js";
import crypto from "crypto";
import { addCredits } from "../utils/updateCredits.js";

const Plans = {
  pro: {
    name: "Pro",
    amount: 29900,
    credits: 500,
  },

  team: {
    name: "Team",
    amount: 79900,
    credits: 2000,
  },
};

export const createOrder = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];

    if (!userId) {
      return res.status(400).json({
        message: "userid not found",
      });
    }

    const { plan } = req.body;

    const selectedPlan = Plans[plan];

    if (!selectedPlan) {
      return res.status(400).json({
        message: "plan not found",
      });
    }

    const order = await razorpay.orders.create({
      amount: selectedPlan.amount,
      currency: "INR",
      receipt: `receipt-${Date.now()}`,
      notes: {
        userId,
        plan,
      },
    });

    const payment = await Payment.create({
      userId,
      plan,
      credits: selectedPlan.credits,
      amount: selectedPlan.amount,
      credits: selectedPlan.credits,
      razorpayOrderId: order.id,
      currency: "INR",
      status: "created",
    });

    return res.status(201).json({
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },

      plan: {
        name: selectedPlan.name,
        credits: selectedPlan.credits,
      },

      key_id: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Create order error:", error);

    return res.status(500).json({
      message: "Create order error",
    });
  }
};

export const verify = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];

    if (!userId) {
      return res.status(400).json({
        message: "userid not found",
      });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        message:
          "razorpay_order_id, razorpay_payment_id, razorpay_signature not found",
      });
    }

    const payment = await Payment.findOne({
      razorpayOrderId: razorpay_order_id,
      userId,
    });

    if (!payment) {
      return res.status(404).json({
        message: "payment not found",
      });
    }

    if (payment.status === "paid") {
      return res.status(400).json({
        message: "payment already verified",
      });
    }

    // Generate Razorpay signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    // Check signature
    if (razorpay_signature !== generatedSignature) {
      payment.status = "failed";

      await payment.save();

      return res.status(400).json({
        message: "Invalid payment signature",
      });
    }

    // Payment successfully verified
    payment.status = "paid";
    payment.razorpayPaymentId = razorpay_payment_id;

    await payment.save();

    // Add credits through Auth Service
    await addCredits({
      userId,
      credits: payment.credits,
    });

    return res.status(200).json({
      message: "Payment verified successfully",
      credits: payment.credits,
    });
  } catch (error) {
    console.error("Verify payment error:", error);

    return res.status(500).json({
      message: "Verify payment error",
    });
  }
};
