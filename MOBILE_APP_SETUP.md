# 📱 Mobile App Setup Guide

TobaccoTrace now includes both **PWA (Progressive Web App)** and **Native Mobile App** support!

## ✨ Features Implemented

### 📍 GPS Tracking
- Real-time location tracking with offline support
- Automatic sync when connection is restored
- Battery-efficient background tracking
- Accuracy monitoring

### 📸 Delivery Confirmation
- Photo capture with camera integration
- Digital signature collection
- GPS location verification
- Offline proof of delivery

### ✅ Compliance Checklists
- Pre-trip vehicle inspections
- Delivery compliance checks
- TPD compliance validation
- Custom checklist templates

### 🔄 Offline Sync
- Automatic queueing of offline actions
- Priority-based sync when online
- Conflict resolution
- Sync status monitoring

### 🌍 Multi-Language Support
- English and Hindi included
- Easy to add more languages
- Real-time language switching
- Translation management system

### 💪 Driver Wellness Scoring
- Fatigue level tracking
- Stress monitoring
- Break time compliance
- AI-powered recommendations

---

## 🚀 Option 1: PWA (Installable Web App)

### What's Included
✅ PWA configuration in `vite.config.ts`
✅ Service worker for offline support
✅ App manifest with icons
✅ Install prompts

### How to Install
1. **Visit the app** on your mobile browser
2. **Look for "Install" button** or browser menu
3. **On iPhone**: Tap Share → Add to Home Screen
4. **On Android**: Tap Menu (⋮) → Install App

### PWA Features
- Works offline
- Fast loading
- Home screen icon
- Full-screen experience
- Push notifications
- Background sync

---

## 🔧 Option 2: Native Mobile App (Capacitor)

### Prerequisites
- Node.js installed
- For iOS: Mac with Xcode
- For Android: Android Studio

### Setup Steps

#### 1. Transfer to Your Repository
```bash
# Export project to GitHub via Lovable UI
# Then clone your repository
git clone <your-repo-url>
cd <your-project>
```

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Initialize Capacitor (Already done!)
The project includes `capacitor.config.ts` with:
- App ID: `app.lovable.2e63e385e3674b4aa2d34ad6e3f65216`
- App Name: `leaf-trace-ai`
- Hot reload enabled for development

#### 4. Add Platforms
```bash
# For iOS (Mac only)
npx cap add ios

# For Android
npx cap add android
```

#### 5. Update Native Dependencies
```bash
# iOS
npx cap update ios

# Android
npx cap update android
```

#### 6. Build the Web App
```bash
npm run build
```

#### 7. Sync with Native Platform
```bash
npx cap sync
```

**Important**: Run `npx cap sync` after each `git pull` to sync changes!

#### 8. Run on Device/Emulator
```bash
# iOS (opens Xcode)
npx cap run ios

# Android (opens Android Studio)
npx cap run android
```

### Native Plugins Included
- `@capacitor/geolocation` - GPS tracking
- `@capacitor/camera` - Photo capture
- `@capacitor/push-notifications` - Notifications
- All configured and ready to use!

---

## 📱 Mobile Components

### GPS Tracker
```tsx
import { MobileGPSTracker } from '@/components/mobile/MobileGPSTracker';

<MobileGPSTracker 
  shipmentId="SHIP-123" 
  vehicleId="VEH-456" 
/>
```

### Delivery Confirmation
```tsx
import { DeliveryConfirmationForm } from '@/components/mobile/DeliveryConfirmationForm';

<DeliveryConfirmationForm 
  shipmentId="SHIP-123"
  onComplete={() => console.log('Done!')}
/>
```

### Offline Sync Hook
```tsx
import { useOfflineSync } from '@/hooks/useOfflineSync';

const { isOnline, syncPending, queueOperation, syncNow } = useOfflineSync();
```

---

## 🌍 Multi-Language Setup

### Current Languages
- English (en)
- Hindi (hi)

### Add New Language
1. Edit `src/i18n/config.ts`
2. Add translations to `resources` object
3. Add to database:
```sql
INSERT INTO public.translations (key, language, value, module) 
VALUES ('gps_tracking', 'ta', 'ஜிபிஎஸ் கண்காணிப்பு', 'mobile');
```

### Use in Components
```tsx
import { useTranslation } from 'react-i18next';

const { t, i18n } = useTranslation();

// Use translation
<Button>{t('start_trip')}</Button>

// Change language
i18n.changeLanguage('hi');
```

---

## 🗄️ Database Tables

### New Tables Created
- `mobile_checklist_templates` - Checklist configurations
- `mobile_checklist_responses` - Completed checklists
- `offline_sync_queue` - Offline data queue
- `translations` - Multi-language strings

### Enhanced Tables
- `delivery_confirmations` - Added photos, feedback, issues
- `gps_tracking_logs` - Optimized with indexes

---

## 🔒 Permissions

### iOS (Info.plist)
Add these to your iOS app:
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>We need your location to track deliveries</string>

<key>NSCameraUsageDescription</key>
<string>We need camera access for delivery photos</string>
```

### Android (AndroidManifest.xml)
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

---

## 🧪 Testing

### Test PWA Install
1. Visit `/install` route
2. Click install button
3. Verify app appears on home screen

### Test Offline Mode
1. Turn off WiFi/mobile data
2. Use GPS tracker or delivery form
3. Check offline queue
4. Turn on connection
5. Verify auto-sync

### Test Multi-Language
1. Visit driver app
2. Change language in settings
3. Verify translations

---

## 📊 Monitoring

### Check Offline Queue
```sql
SELECT * FROM public.offline_sync_queue 
WHERE synced = false 
ORDER BY priority DESC, created_at;
```

### Check GPS Logs
```sql
SELECT * FROM public.gps_tracking_logs 
WHERE driver_id = '<user-id>'
ORDER BY timestamp DESC 
LIMIT 100;
```

---

## 🎯 Next Steps

1. **For PWA**: Just share the URL! Users can install from browser
2. **For Native App**: 
   - Test on physical devices
   - Configure app signing
   - Submit to App Store / Play Store

---

## 📚 Additional Resources

- [Capacitor Docs](https://capacitorjs.com/docs)
- [PWA Checklist](https://web.dev/pwa-checklist/)
- [i18next Docs](https://www.i18next.com/)

---

## 🆘 Troubleshooting

### PWA not installing?
- Check HTTPS is enabled
- Verify manifest.json is accessible
- Check browser console for errors

### Native app build failing?
- Run `npx cap sync` after code changes
- Clear build folders: `rm -rf ios/App/build android/app/build`
- Update Capacitor: `npm update @capacitor/core @capacitor/cli`

### GPS not working?
- Check permissions granted
- Verify location services enabled on device
- Test in open area with clear sky view

---

**Happy Tracking! 🚛📦**
