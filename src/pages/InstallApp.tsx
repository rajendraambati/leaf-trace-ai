import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Smartphone, CheckCircle } from 'lucide-react';

export default function InstallApp() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 to-secondary/10">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-4">
          <Smartphone className="h-20 w-20 mx-auto text-primary" />
          <h1 className="text-3xl font-bold">Install LeafTrace Driver App</h1>
          
          {isInstalled ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-success">
                <CheckCircle className="h-6 w-6" />
                <p className="text-lg font-semibold">App Already Installed!</p>
              </div>
              <p className="text-muted-foreground">
                You can access the app from your home screen.
              </p>
            </div>
          ) : (
            <>
              <p className="text-muted-foreground">
                Install our mobile app for the best driver experience with offline capabilities.
              </p>

              {isInstallable ? (
                <Button onClick={handleInstall} size="lg" className="w-full">
                  <Download className="mr-2 h-5 w-5" />
                  Install Now
                </Button>
              ) : (
                <div className="space-y-4 text-left">
                  <p className="font-semibold">To install on your device:</p>
                  
                  <div className="space-y-3">
                    <div className="p-4 rounded-lg bg-secondary/50">
                      <p className="font-semibold mb-2">📱 iPhone / iPad:</p>
                      <ol className="text-sm space-y-1 list-decimal list-inside">
                        <li>Tap the Share button in Safari</li>
                        <li>Scroll down and tap "Add to Home Screen"</li>
                        <li>Tap "Add" in the top right</li>
                      </ol>
                    </div>

                    <div className="p-4 rounded-lg bg-secondary/50">
                      <p className="font-semibold mb-2">🤖 Android:</p>
                      <ol className="text-sm space-y-1 list-decimal list-inside">
                        <li>Tap the menu button (three dots)</li>
                        <li>Tap "Add to Home screen" or "Install app"</li>
                        <li>Confirm by tapping "Add" or "Install"</li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t space-y-2">
                <h3 className="font-semibold">Features:</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✓ Works offline</li>
                  <li>✓ GPS tracking</li>
                  <li>✓ Route guidance</li>
                  <li>✓ Delivery confirmation</li>
                  <li>✓ AI assistant</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
