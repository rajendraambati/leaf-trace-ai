import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface QRCodeDisplayProps {
  data: string;
  title?: string;
  size?: number;
}

export function QRCodeDisplay({ data, title = 'Batch QR Code', size = 200 }: QRCodeDisplayProps) {
  const downloadQR = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.download = `qr-code-${Date.now()}.png`;
      link.click();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <QRCodeSVG value={data} size={size} level="H" />
        <Button size="sm" variant="outline" onClick={downloadQR}>
          <Download className="h-4 w-4 mr-2" />
          Download QR
        </Button>
      </CardContent>
    </Card>
  );
}
