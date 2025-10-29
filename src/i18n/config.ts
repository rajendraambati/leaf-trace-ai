import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Translation resources
const resources = {
  en: {
    translation: {
      // Navigation
      'dashboard': 'Dashboard',
      'gps_tracking': 'GPS Tracking',
      'delivery_confirmation': 'Delivery Confirmation',
      'compliance_checklist': 'Compliance Checklist',
      'wellness_check': 'Wellness Check',
      
      // Actions
      'start_trip': 'Start Trip',
      'end_trip': 'End Trip',
      'take_photo': 'Take Photo',
      'add_signature': 'Add Signature',
      'submit': 'Submit',
      'cancel': 'Cancel',
      'save': 'Save',
      'sync': 'Sync',
      
      // Status
      'sync_pending': 'Sync Pending',
      'synced': 'Synced',
      'offline_mode': 'Offline Mode',
      'online': 'Online',
      'loading': 'Loading...',
      
      // Messages
      'no_internet': 'No internet connection. Data will be synced when online.',
      'sync_success': 'Data synced successfully',
      'sync_error': 'Failed to sync data',
      'location_required': 'Location access is required',
      'camera_required': 'Camera access is required',
    }
  },
  hi: {
    translation: {
      // Navigation
      'dashboard': 'डैशबोर्ड',
      'gps_tracking': 'जीपीएस ट्रैकिंग',
      'delivery_confirmation': 'डिलीवरी पुष्टि',
      'compliance_checklist': 'अनुपालन चेकलिस्ट',
      'wellness_check': 'स्वास्थ्य जांच',
      
      // Actions
      'start_trip': 'यात्रा शुरू करें',
      'end_trip': 'यात्रा समाप्त करें',
      'take_photo': 'फोटो लें',
      'add_signature': 'हस्ताक्षर जोड़ें',
      'submit': 'जमा करें',
      'cancel': 'रद्द करें',
      'save': 'सहेजें',
      'sync': 'समन्वयित करें',
      
      // Status
      'sync_pending': 'सिंक लंबित',
      'synced': 'समन्वयित',
      'offline_mode': 'ऑफ़लाइन मोड',
      'online': 'ऑनलाइन',
      'loading': 'लोड हो रहा है...',
      
      // Messages
      'no_internet': 'इंटरनेट कनेक्शन नहीं है। ऑनलाइन होने पर डेटा समन्वयित होगा।',
      'sync_success': 'डेटा सफलतापूर्वक समन्वयित',
      'sync_error': 'डेटा समन्वयित करने में विफल',
      'location_required': 'स्थान एक्सेस आवश्यक है',
      'camera_required': 'कैमरा एक्सेस आवश्यक है',
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
