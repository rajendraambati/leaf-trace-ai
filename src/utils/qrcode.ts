export const generateBatchQRData = (batchId: string) => {
  return JSON.stringify({
    batchId,
    type: 'tobacco_batch',
    timestamp: new Date().toISOString(),
    verifyUrl: `${window.location.origin}/batch/${batchId}`
  });
};

export const generateDocumentQRData = (documentNumber: string, documentType: string, entityId: string) => {
  return JSON.stringify({
    documentNumber,
    documentType,
    entityId,
    type: 'document_verification',
    timestamp: new Date().toISOString(),
    verifyUrl: `${window.location.origin}/verify/${documentNumber}`
  });
};

export const parseBatchQRData = (qrData: string) => {
  try {
    return JSON.parse(qrData);
  } catch {
    return null;
  }
};

export const parseDocumentQRData = (qrData: string) => {
  try {
    return JSON.parse(qrData);
  } catch {
    return null;
  }
};
