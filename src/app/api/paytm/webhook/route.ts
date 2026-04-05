import { NextResponse } from "next/server";

import {
  failPaymentOrder,
  finalizePaymentOrder,
} from "~/server/payments/booking";
import { verifyPaytmCallback } from "~/server/payments/paytm";

const toRecord = (formData: FormData) => {
  const entries = Array.from(formData.entries());
  return Object.fromEntries(
    entries.map(([key, value]) => [key, String(value)]),
  ) as Record<string, string>;
};

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? ((await request.json()) as Record<string, string>)
    : toRecord(await request.formData());

  console.info("Paytm webhook request", {
    method: request.method,
    contentType,
    payload,
  });

  if (!verifyPaytmCallback(payload)) {
    return NextResponse.json({ error: "Invalid checksum" }, { status: 400 });
  }

  const orderId = payload.ORDERID ?? payload.orderId;
  if (!orderId) {
    return NextResponse.json({ error: "Missing order id" }, { status: 400 });
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

  try {
    if (isSuccess) {
      await finalizePaymentOrder({
        orderId,
        success: true,
        transactionId,
        paymentStatus: status,
      });
    } else if (!isPending) {
      await failPaymentOrder(orderId);
    }
  } catch (error) {
    console.error("Failed to process Paytm webhook", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
