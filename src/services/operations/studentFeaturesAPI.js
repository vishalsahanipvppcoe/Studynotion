import { toast } from "react-hot-toast";
import { studentEndpoints } from "../apis";
import { apiConnector } from "../apiconnector";
import { setPaymentLoading } from "../../slices/courseSlice";
import { resetCart } from "../../slices/cartSlice";

const RAZORPAY_LOGO =
  "https://res.cloudinary.com/dd6cjbeah/image/upload/v1780408074/rzp_logo_fd4yga.png";

const {
  COURSE_PAYMENT_API,
  COURSE_VERIFY_API,
  SEND_PAYMENT_SUCCESS_EMAIL_API,
} = studentEndpoints;

// ===============================
// Load Razorpay Script
// ===============================
function loadScript(src) {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = src;

    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });
}

// ===============================
// Buy Course
// ===============================
export async function buyCourse(
  token,
  courses,
  userDetails,
  navigate,
  dispatch
) {
  const toastId = toast.loading("Loading...");

  try {
    // Load Razorpay SDK
    const res = await loadScript(
      "https://checkout.razorpay.com/v1/checkout.js"
    );

    if (!res) {
      toast.error("Razorpay SDK failed to load");
      toast.dismiss(toastId);
      return;
    }

    // Create order
    const orderResponse = await apiConnector(
      "POST",
      COURSE_PAYMENT_API,
      { courses },
      {
        Authorization: `Bearer ${token}`,
      }
    );

    if (!orderResponse?.data?.success) {
      throw new Error(orderResponse?.data?.message);
    }

    console.log("PRINTING orderResponse", orderResponse);
    console.log("Razorpay Logo URL:", RAZORPAY_LOGO);

    const order = orderResponse.data.data;

    const options = {
      key: process.env.REACT_APP_RAZORPAY_KEY,
      currency: order.currency,
      amount: order.amount,
      order_id: order.id,

      name: "StudyNotion",
      description: "Thank You for Purchasing the Course",
      image: RAZORPAY_LOGO,

      prefill: {
        name: `${userDetails.firstName} ${userDetails.lastName}`,
        email: userDetails.email,
      },

      handler: function (response) {
        sendPaymentSuccessEmail(response, order.amount, token);
        verifyPayment({ ...response, courses }, token, navigate, dispatch);
      },
    };

    const paymentObject = new window.Razorpay(options);

    paymentObject.open();

    paymentObject.on("payment.failed", function (response) {
      toast.error("Oops, payment failed");
      console.log("PAYMENT FAILED:", response.error);
    });
  } catch (error) {
    console.log("PAYMENT API ERROR.....", error);
    console.log("ERROR RESPONSE:", error?.response?.data);
    toast.error("Could not make Payment");
  }

  toast.dismiss(toastId);
}

// ===============================
// Send Payment Success Email
// ===============================
async function sendPaymentSuccessEmail(response, amount, token) {
  try {
    await apiConnector(
      "POST",
      SEND_PAYMENT_SUCCESS_EMAIL_API,
      {
        orderId: response.razorpay_order_id,
        paymentId: response.razorpay_payment_id,
        amount,
      },
      {
        Authorization: `Bearer ${token}`,
      }
    );
  } catch (error) {
    console.log("PAYMENT SUCCESS EMAIL ERROR....", error);
  }
}

// ===============================
// Verify Payment
// ===============================
async function verifyPayment(bodyData, token, navigate, dispatch) {
  const toastId = toast.loading("Verifying Payment....");
  dispatch(setPaymentLoading(true));

  try {
    const response = await apiConnector(
      "POST",
      COURSE_VERIFY_API,
      bodyData,
      {
        Authorization: `Bearer ${token}`,
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.message);
    }

    toast.success("Payment Successful, you are added to the course");

    navigate("/dashboard/enrolled-courses");

    dispatch(resetCart());
  } catch (error) {
    console.log("PAYMENT VERIFY ERROR....", error);
    toast.error("Could not verify Payment");
  }

  toast.dismiss(toastId);
  dispatch(setPaymentLoading(false));
}