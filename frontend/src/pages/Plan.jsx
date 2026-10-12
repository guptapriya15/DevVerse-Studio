import { ArrowLeft, Check, Crown, Loader2, Sparkles, Zap } from "lucide-react";
import { useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { createPayment, verifyPayment } from "../features/payment";
import { me } from "../features/me";
import { setUserData } from "../redux/userSlice";
import { getErrorMessage } from "../utils/errors";

const plans = [
  {
    key: "free",
    name: "Free",
    description: "For trying out the AI IDE.",
    price: "₹0",
    period: "/month",
    credits: "100 AI credits",
    icon: Zap,
    features: [
      "100 AI credits",
      "AI code generation",
      "Project editor",
      "HTML / CSS / JS preview",
      "React preview",
      "Basic project management",
    ],
    button: "Current Plan",
    current: true,
  },
  {
    key: "pro",
    name: "Pro",
    description: "For developers who build regularly.",
    price: "₹299",
    period: "/month",
    credits: "500 AI credits",
    icon: Sparkles,
    popular: true,
    features: [
      "500 AI credits",
      "Everything in Free",
      "Priority AI generation",
      "Larger projects",
      "Unlimited projects",
      "Advanced AI coding",
      "Priority support",
    ],
    button: "Upgrade to Pro",
  },
  {
    key: "team",
    name: "Team",
    description: "For teams building products together.",
    price: "₹799",
    period: "/month",
    credits: "2,000 AI credits",
    icon: Crown,
    features: [
      "2,000 AI credits",
      "Everything in Pro",
      "Team collaboration",
      "Shared projects",
      "Higher AI limits",
      "Priority processing",
      "Team support",
    ],
    button: "Upgrade to Team",
  },
];

const hasValidOrder = (data) =>
  typeof data?.key_id === "string" &&
  data.key_id.length > 0 &&
  typeof data.order?.id === "string" &&
  data.order.id.length > 0 &&
  Number.isFinite(Number(data.order.amount));

function Plan() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const attemptRef = useRef(0);
  const processingRef = useRef(false);
  const [processingPlan, setProcessingPlan] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState("");
  const [paymentError, setPaymentError] = useState("");

  const handlePayment = async (plan) => {
    if (
      plan.key === "free" ||
      plan.current ||
      processingPlan ||
      processingRef.current
    ) {
      return;
    }

    const attempt = attemptRef.current + 1;
    attemptRef.current = attempt;
    processingRef.current = true;
    const isCurrentAttempt = () => attemptRef.current === attempt;
    const finishAttempt = () => {
      if (!isCurrentAttempt()) return;
      processingRef.current = false;
      setProcessingPlan(null);
    };

    setProcessingPlan(plan.key);
    setPaymentStatus("Creating your secure payment order…");
    setPaymentError("");

    try {
      if (
        typeof window === "undefined" ||
        typeof window.Razorpay !== "function"
      ) {
        throw new Error("Payment checkout is currently unavailable.");
      }

      const orderData = await createPayment(plan.key);
      if (!hasValidOrder(orderData)) {
        throw new Error("The payment order response was invalid. Please try again.");
      }

      const handleVerification = async (response) => {
        if (!isCurrentAttempt()) return;

        setPaymentStatus("Verifying your payment…");
        setPaymentError("");

        try {
          const verification = await verifyPayment({
            razorpay_order_id: response?.razorpay_order_id,
            razorpay_payment_id: response?.razorpay_payment_id,
            razorpay_signature: response?.razorpay_signature,
          });

          if (!verification || typeof verification.message !== "string") {
            throw new Error("The payment verification response was invalid.");
          }

          if (!isCurrentAttempt()) return;

          setPaymentStatus(
            verification.credits
              ? `Payment verified successfully. ${verification.credits} AI credits were added.`
              : verification.message,
          );

          try {
            const refreshedUser = await me();
            if (!isCurrentAttempt()) return;

            if (refreshedUser) {
              dispatch(setUserData(refreshedUser));
            } else {
              setPaymentError(
                "Payment was verified, but your credit balance could not be refreshed. Reload the page to see the latest balance.",
              );
            }
          } catch (refreshError) {
            if (!isCurrentAttempt()) return;
            setPaymentError(
              `Payment was verified, but your credit balance could not be refreshed. ${getErrorMessage(refreshError, "Reload the page to see the latest balance.")}`,
            );
          }
        } catch (error) {
          if (!isCurrentAttempt()) return;
          setPaymentStatus("");
          setPaymentError(
            getErrorMessage(
              error,
              "Unable to verify the payment. Please contact support before trying again.",
            ),
          );
        } finally {
          finishAttempt();
        }
      };

      const razorpay = new window.Razorpay({
        key: orderData.key_id,
        amount: orderData.order.amount,
        currency: orderData.order.currency || "INR",
        name: "Dev-Verse Studio",
        description: `Plan ${plan.name}`,
        order_id: orderData.order.id,
        handler: handleVerification,
        modal: {
          ondismiss: () => {
            if (!isCurrentAttempt()) return;
            setPaymentStatus("Payment cancelled. You can try again whenever you’re ready.");
            setPaymentError("");
            finishAttempt();
          },
        },
        theme: {
          color: "#4f46e5",
        },
      });

      if (typeof razorpay.on === "function") {
        razorpay.on("payment.failed", () => {
          if (!isCurrentAttempt()) return;
          setPaymentStatus("");
          setPaymentError("Payment could not be completed. Please try again.");
          finishAttempt();
        });
      }

      setPaymentStatus("Opening secure checkout…");
      razorpay.open();
    } catch (error) {
      if (!isCurrentAttempt()) return;
      setPaymentStatus("");
      setPaymentError(
        getErrorMessage(error, "Unable to start payment. Please try again."),
      );
      finishAttempt();
    }
  };
  return (
    <div className="min-h-screen bg-slate-50 px-5 py-8 text-slate-900 dark:bg-[#07070c] dark:text-white">
      <div className="pointer-events-none fixed left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-indigo-500/[0.08] blur-[140px]" />
      <div className="relative mx-auto max-w-6xl">
        <div className="mb-12 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-slate-300 dark:hover:bg-white/[0.06]"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <div className="text-sm font-semibold">Dev-Verse Studio</div>
        </div>

        <div className="mx-auto mb-12 max-w-2xl text-center">
          <div className="mx-auto mb-4 flex w-fit items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-300">
            <Sparkles size={13} />
            Simple pricing for developers
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Build more. <span className="text-indigo-500"> Ship faster.</span>
          </h1>
          <p className="mt-4 text-sm leading-6 text-slate-500 dark:text-slate-400">
            Choose a plan that gives you the AI credits you need to build and
            iterate faster.
          </p>
        </div>

        {(paymentStatus || paymentError) && (
          <div className="mx-auto mb-6 max-w-2xl space-y-2 text-sm">
            {paymentStatus && (
              <div
                role="status"
                aria-live="polite"
                className="flex items-center justify-center gap-2 rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-4 py-3 text-indigo-700 dark:text-indigo-200"
              >
                {processingPlan && <Loader2 size={15} className="animate-spin" />}
                <span>{paymentStatus}</span>
              </div>
            )}
            {paymentError && (
              <div
                role="alert"
                className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-center text-red-700 dark:text-red-200"
              >
                {paymentError}
              </div>
            )}
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-3">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            const isProcessing = processingPlan === plan.key;
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                whileHover={{ y: -4 }}
                className={`relative flex flex-col rounded-2xl border p-6 transition ${plan.popular ? "border-indigo-500/40 bg-white shadow-xl shadow-indigo-500/10 dark:bg-white/[0.05]" : "border-slate-200 bg-white/70 dark:border-white/[0.08] dark:bg-white/[0.025]"}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                    Most Popular
                  </div>
                )}
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/5 text-slate-700 dark:bg-white/10 dark:text-white">
                  <Icon size={16} />
                </div>
                <h1 className="text-lg font-bold">{plan.name}</h1>
                <p className="mt-1 min-h-[40px] text-xs leading-5 text-slate-500 dark:text-slate-400">{plan.description}</p>

                <div className="mt-5 flex items-end gap-1">
                  <span className="text-3xl font-bold tracking-tight">{plan.price}</span>
                  <span className="mb-1 text-xs text-slate-400">{plan.period}</span>
                </div>

                <div className="mt-4 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-700 dark:border-white/[0.07] dark:bg-white/[0.04] dark:text-slate-200">
                  <Zap size={14} className="text-indigo-500" fill="currentColor" />{plan.credits}
                </div>


                <button
                  type="button"
                  onClick={() => void handlePayment(plan)}
                  disabled={plan.current || Boolean(processingPlan)}
                  aria-busy={isProcessing}
                  className={`mt-5 w-full rounded-lg py-2.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${plan.current ? "cursor-default bg-slate-100 text-slate-400 dark:bg-white/[0.06] dark:text-slate-500" : plan.popular ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-500" : "bg-slate-900 text-white hover:opacity-90 dark:bg-white dark:text-slate-900"}`}
                >
                  {isProcessing ? "Processing…" : plan.button}
                </button>

                <div className="mt-6 border-t border-slate-200 pt-5 dark:border-white/[0.07]">
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400" >Includes</p>
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li
                        key={`${plan.key}-${feature}`}
                        className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300"
                      >
                        <Check size={14} className="mt-0.5 shrink-0 text-emerald-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>


              </motion.div>
            );
          })}
        </div>
        <div className="mt-10 text-center text-[11px] text-slate-400 dark:text-slate-600">Credits reset every month. Unused credits do not roll over.</div>
      </div>
    </div>
  );
}

export default Plan;
