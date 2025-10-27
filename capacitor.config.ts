import { CapacitorConfig } from '@capacitor/core';

const config: CapacitorConfig = {
  appId: 'app.lovable.2e63e385e3674b4aa2d34ad6e3f65216',
  appName: 'leaf-trace-ai',
  webDir: 'dist',
  server: {
    url: 'https://2e63e385-e367-4b4a-a2d3-4ad6e3f65216.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
};

export default config;
