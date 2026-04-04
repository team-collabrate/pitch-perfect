declare module "paytmchecksum" {
  const PaytmChecksum: {
    generateSignature(params: object | string, key: string): Promise<string>;
    verifySignature(
      params: object | string,
      key: string,
      checksum: string,
    ): Promise<boolean> | boolean;
  };

  export default PaytmChecksum;
}
