export const generateBatchQRData = (batchId: string) => {
  return JSON.stringify({
    batchId,
    type: 'tobacco_batch',
    timestamp: new Date().toISOString(),
    verifyUrl: `${window.location.origin}/batch/${batchId}`
  });
};

export const parseBatchQRData = (qrData: string) => {
  try {
    return JSON.parse(qrData);
  } catch {
    return null;
  }
};
