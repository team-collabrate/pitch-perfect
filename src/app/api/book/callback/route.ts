import { NextResponse } from "next/server";

import {
  failPaymentOrder,
  recordCallbackSuccess,
} from "~/server/payments/booking";
import { verifyPaytmCallback } from "~/server/payments/paytm";

const toRecord = (formData: FormData) => {
  const entries = Array.from(formData.entries());
  return Object.fromEntries(
    entries.map(([key, value]) => [key, String(value)]),
  ) as Record<string, string>;
};

const redirectToBooking = (
  request: Request,
  orderId: string,
  payment: "success" | "failed" | "pending" | "cancelled" | "unknown",
) =>
  NextResponse.redirect(
    new URL(`/book?payment=${payment}&orderId=${orderId}`, request.url),
  );

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? ((await request.json()) as Record<string, string>)
    : toRecord(await request.formData());

  console.info("Paytm callback request", {
    method: request.method,
    contentType,
    payload,
  });

  const orderId = payload.ORDERID ?? payload.orderId;
  if (!orderId) {
    return NextResponse.json({ error: "Missing order id" }, { status: 400 });
  }

  if (!verifyPaytmCallback(payload)) {
    return NextResponse.json({ error: "Invalid checksum" }, { status: 400 });
  }

  const status = payload.STATUS ?? payload.resultStatus ?? payload.RESPCODE;
  const transactionId = payload.TXNID ?? payload.BANKTXNID ?? payload.txnId;
  const normalizedStatus = (status ?? "").toUpperCase();
  const isSuccess =
    normalizedStatus === "TXN_SUCCESS" ||
    normalizedStatus === "S" ||
    payload.RESPCODE === "01";
  const isPending =
    normalizedStatus.includes("PENDING") ||
    normalizedStatus.includes("IN_PROCESS") ||
    normalizedStatus === "TXN_PENDING";
  const isCancelled =
    normalizedStatus.includes("CANCEL") || normalizedStatus === "TXN_CANCELLED";

  try {
    if (isSuccess) {
      await recordCallbackSuccess({
        orderId,
        transactionId,
        paymentStatus: status,
      });
    } else if (isCancelled || !isPending) {
      await failPaymentOrder(orderId);
    }
  } catch (error) {
    console.error("Failed to handle Paytm callback", error);
    return redirectToBooking(request, orderId, "failed");
  }

  return redirectToBooking(
    request,
    orderId,
    isSuccess
      ? "success"
      : isPending
        ? "pending"
        : isCancelled
          ? "cancelled"
          : "unknown",
  );
}
