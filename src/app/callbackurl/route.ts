import { NextResponse } from "next/server";

import { env } from "~/env";
import { finalizePaymentOrder } from "~/server/booking-payments";
import { verifyPaytmCallback } from "~/server/paytm";

const redirectToBooking = (orderId: string, payment: "success" | "failed") =>
  NextResponse.redirect(
    new URL(
      `/book?payment=${payment}&orderId=${orderId}`,
      env.NEXT_PUBLIC_BASE_URL,
    ),
  );

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

  const orderId = payload.ORDERID ?? payload.orderId;
  if (!orderId) {
    return NextResponse.json({ error: "Missing order id" }, { status: 400 });
  }

  const checksumValid = verifyPaytmCallback(payload);
  if (!checksumValid) {
    return NextResponse.json({ error: "Invalid checksum" }, { status: 400 });
  }

  const status = payload.STATUS ?? payload.resultStatus ?? payload.RESPCODE;
  const transactionId = payload.TXNID ?? payload.BANKTXNID ?? payload.txnId;
  const success =
    status === "TXN_SUCCESS" || status === "S" || payload.RESPCODE === "01";

  try {
    await finalizePaymentOrder({
      orderId,
      success,
      transactionId,
      paymentStatus: status,
    });
  } catch (error) {
    console.error("Failed to finalize Paytm payment", error);
    return redirectToBooking(orderId, "failed");
  }

  return redirectToBooking(orderId, success ? "success" : "failed");
}

export async function GET() {
  return NextResponse.redirect(new URL("/book", env.NEXT_PUBLIC_BASE_URL));
}
