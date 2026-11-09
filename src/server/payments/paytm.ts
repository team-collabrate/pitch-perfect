import https from "https";

import PaytmChecksum from "paytmchecksum";

import { env } from "~/env";

console.log("[paytm]", {
  NODE_ENV: env.NODE_ENV,
  PAYTM_MODE: env.PAYTM_MODE,
});

export type PaytmInitiateResponse = {
  txnToken: string;
  orderId: string;
  paymentPageUrl: string;
  amount: string;
  callbackUrl: string;
  mid: string;
};

type InitiateTransactionResponse = {
  body?: {
    resultInfo?: {
      resultStatus?: string;
      resultCode?: string;
      resultMsg?: string;
    };
    txnToken?: string;
  };
};

const parseJson = <T>(raw: string) => JSON.parse(raw) as T;

type JsonRequest = (
  options: https.RequestOptions,
  body: string,
  timeoutMs?: number,
) => Promise<string>;

const requestJson: JsonRequest = (options, body, timeoutMs) =>
  new Promise<string>((resolve, reject) => {
    const req = https.request(options, (res) => {
      let response = "";

      res.on("data", (chunk) => {
        response += chunk;
      });

      res.on("end", () => resolve(response));
    });

    if (timeoutMs) {
      req.setTimeout(timeoutMs, () => {
        req.destroy(new Error(`Paytm did not answer within ${timeoutMs}ms`));
      });
    }

    req.on("error", reject);
    req.write(body);
    req.end();
  });

export const buildPaytmPaymentPageUrl = (orderId: string) =>
  `https://${env.PAYTM_HOSTNAME}/theia/api/v1/showPaymentPage?mid=${env.PAYTM_MID}&orderId=${orderId}`;

export async function createPaytmTransaction(input: {
  orderId: string;
  amountPaise: number;
  customerId: string;
}) {
  const body = {
    requestType: "Payment",
    mid: env.PAYTM_MID,
    websiteName: env.PAYTM_WEBSITE,
    orderId: input.orderId,
    callbackUrl: env.PAYTM_CALLBACK_URL,
    channelId: "WEB",
    txnAmount: {
      value: String((input.amountPaise / 100).toFixed(2)),
      currency: "INR",
    },
    userInfo: {
      custId: input.customerId,
    },
  };

  console.log("[paytm] types:", {
  custId: typeof input.customerId,
  value: typeof body.txnAmount.value,
});

  const checksum = await PaytmChecksum.generateSignature(
    JSON.stringify(body),
    env.PAYTM_MERCHANT_KEY,
  );

  const postData = JSON.stringify({
    body,
    head: { signature: checksum },
  });

  const requestOptions: https.RequestOptions = {
    hostname: env.PAYTM_HOSTNAME,
    port: 443,
    path: `/theia/api/v1/initiateTransaction?mid=${env.PAYTM_MID}&orderId=${input.orderId}`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(postData),
    },
  };

  
  console.log("[paytm] initiating transaction", {
    requestOptions,
    postData,
  });

  const response = await requestJson(requestOptions, postData);

  console.log("[paytm] initiate transaction response", { response });

  const parsed = parseJson<InitiateTransactionResponse>(response);
  const resultInfo = parsed.body?.resultInfo;


  if (resultInfo?.resultStatus !== "S" || !parsed.body?.txnToken) {
    throw new Error(
      resultInfo?.resultMsg ?? "Paytm transaction could not be initiated",
    );
  }

  return {
    txnToken: parsed.body.txnToken,
    orderId: input.orderId,
    paymentPageUrl: buildPaytmPaymentPageUrl(input.orderId),
    amount: body.txnAmount.value,
    callbackUrl: env.PAYTM_CALLBACK_URL,
    mid: env.PAYTM_MID,
  } satisfies PaytmInitiateResponse;
}

/**
 * What Paytm says about one order, reduced to the cases the app acts on.
 *  - success:  the customer paid.
 *  - failed:   Paytm recorded a failed payment.
 *  - notFound: Paytm has no payment attempt for this order (customer never paid).
 *  - pending:  Paytm is still working it out; ask again later.
 *  - unknown:  we couldn't get a usable answer (network error, odd response).
 */
export type PaytmTransactionStatus =
  | { state: "success"; transactionId?: string }
  | { state: "failed"; reason?: string }
  | { state: "notFound" }
  | { state: "pending" }
  | { state: "unknown"; reason: string };

type TransactionStatusResponse = {
  body?: {
    resultInfo?: { resultStatus?: string; resultMsg?: string };
    txnId?: string;
    orderId?: string;
    mid?: string;
  };
};

/** Turns Paytm's raw Transaction Status response into a PaytmTransactionStatus. Never throws. */
export function parsePaytmStatusResponse(
  raw: string,
  orderId: string,
  mid: string,
): PaytmTransactionStatus {
  let parsed: TransactionStatusResponse;
  try {
    parsed = JSON.parse(raw) as TransactionStatusResponse;
  } catch {
    return { state: "unknown", reason: "Paytm's answer was not valid JSON" };
  }

  const body = parsed.body;
  const status = body?.resultInfo?.resultStatus;
  if (!status) {
    return { state: "unknown", reason: "Paytm's answer had no result status" };
  }

  // Never act on an answer about some other order or merchant.
  if (body?.orderId && body.orderId !== orderId) {
    return {
      state: "unknown",
      reason: "Paytm answered about a different order",
    };
  }
  if (body?.mid && body.mid !== mid) {
    return {
      state: "unknown",
      reason: "Paytm answered for a different merchant",
    };
  }

  switch (status) {
    case "TXN_SUCCESS":
      return { state: "success", transactionId: body?.txnId };
    case "TXN_FAILURE":
      return { state: "failed", reason: body?.resultInfo?.resultMsg };
    case "NO_RECORD_FOUND":
      return { state: "notFound" };
    case "PENDING":
      return { state: "pending" };
    default:
      return {
        state: "unknown",
        reason: `Unexpected Paytm status "${status}"`,
      };
  }
}

/**
 * Asks Paytm directly whether an order was paid (Transaction Status API). Used when we never
 * heard back through the callback or webhook, so a paid order can't be mistaken for an
 * abandoned one. Never throws; any problem comes back as { state: "unknown" }.
 *
 * Paytm's response signature is not checked here: the request goes straight to Paytm's own
 * host over HTTPS, and the answer must name our order and merchant. Add signature
 * verification once it can be tried against a real Paytm response.
 */
export async function getPaytmTransactionStatus(
  orderId: string,
  options: { timeoutMs?: number; request?: JsonRequest } = {},
): Promise<PaytmTransactionStatus> {
  const { timeoutMs = 3000, request = requestJson } = options;

  try {
    const body = { mid: env.PAYTM_MID, orderId };
    const signature = await PaytmChecksum.generateSignature(
      JSON.stringify(body),
      env.PAYTM_MERCHANT_KEY,
    );
    const postData = JSON.stringify({ body, head: { signature } });

    const raw = await request(
      {
        hostname: env.PAYTM_HOSTNAME,
        port: 443,
        path: "/v3/order/status",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData),
        },
      },
      postData,
      timeoutMs,
    );

    return parsePaytmStatusResponse(raw, orderId, env.PAYTM_MID);
  } catch (error) {
    return {
      state: "unknown",
      reason:
        error instanceof Error ? error.message : "Paytm status request failed",
    };
  }
}

export function verifyPaytmCallback(payload: Record<string, string>) {
  const checksum = payload.CHECKSUMHASH;

  if (!checksum) {
    return false;
  }

  return PaytmChecksum.verifySignature(
    payload,
    env.PAYTM_MERCHANT_KEY,
    checksum,
  );
}
