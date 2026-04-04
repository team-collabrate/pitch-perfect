import https from "https";

import PaytmChecksum from "paytmchecksum";

import { env } from "~/env";

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

const requestJson = (options: https.RequestOptions, body: string) =>
  new Promise<string>((resolve, reject) => {
    const req = https.request(options, (res) => {
      let response = "";

      res.on("data", (chunk) => {
        response += chunk;
      });

      res.on("end", () => resolve(response));
    });

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
  callbackUrl: string;
}) {
  const body = {
    requestType: "Payment",
    mid: env.PAYTM_MID,
    websiteName: env.PAYTM_WEBSITE,
    orderId: input.orderId,
    callbackUrl: input.callbackUrl,
    channelId: "WEB",
    txnAmount: {
      value: (input.amountPaise / 100).toFixed(2),
      currency: "INR",
    },
    userInfo: {
      custId: input.customerId,
    },
  };

  const checksum = await PaytmChecksum.generateSignature(
    JSON.stringify(body),
    env.PAYTM_MERCHANT_KEY,
  );

  const postData = JSON.stringify({
    body,
    head: { signature: checksum },
  });

  const response = await requestJson(
    {
      hostname: env.PAYTM_HOSTNAME,
      port: 443,
      path: `/theia/api/v1/initiateTransaction?mid=${env.PAYTM_MID}&orderId=${input.orderId}`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
      },
    },
    postData,
  );

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
    callbackUrl: input.callbackUrl,
    mid: env.PAYTM_MID,
  } satisfies PaytmInitiateResponse;
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
