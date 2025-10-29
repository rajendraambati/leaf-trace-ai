import { AlertType } from '@/components/dispatcher/AlertMessage';

export interface LogisticsAlert {
  id: string;
  type: AlertType;
  message: string;
  timestamp: string;
  vehicleId?: string;
}

// Friendly micro-copy templates for various logistics scenarios
export const createRerouteAlert = (vehicleId: string, location: string, newEta: string): LogisticsAlert => ({
  id: `reroute-${Date.now()}`,
  type: 'reroute',
  message: `Truck ${vehicleId} is rerouting due to traffic near ${location} 🚚 ETA now ${newEta}.`,
  timestamp: new Date().toISOString(),
  vehicleId: `Vehicle ${vehicleId}`
});

export const createDeliverySuccessAlert = (vehicleId?: string): LogisticsAlert => ({
  id: `success-${Date.now()}`,
  type: 'success',
  message: vehicleId 
    ? `Delivery confirmed for Vehicle ${vehicleId}! Great teamwork 💪` 
    : 'Delivery confirmed! Great teamwork 💪',
  timestamp: new Date().toISOString(),
  vehicleId: vehicleId ? `Vehicle ${vehicleId}` : undefined
});

export const createMaintenanceAlert = (vehicleId: string, date: string): LogisticsAlert => ({
  id: `maintenance-${Date.now()}`,
  type: 'maintenance',
  message: `Vehicle ${vehicleId} needs maintenance check ${date} 🔧 Schedule it soon to avoid delays.`,
  timestamp: new Date().toISOString(),
  vehicleId: `Vehicle ${vehicleId}`
});

export const createDelayAlert = (vehicleId: string, delayMinutes: number, reason: string): LogisticsAlert => ({
  id: `delay-${Date.now()}`,
  type: 'delay',
  message: `Vehicle ${vehicleId} is running ${delayMinutes} minutes behind schedule due to ${reason}. Dispatcher notified 📢`,
  timestamp: new Date().toISOString(),
  vehicleId: `Vehicle ${vehicleId}`
});

export const createDriverWellbeingAlert = (driverName: string, issue: string): LogisticsAlert => ({
  id: `wellbeing-${Date.now()}`,
  type: 'maintenance',
  message: `${driverName} reported ${issue}. Safety first! 🛡️ Consider reassigning if needed.`,
  timestamp: new Date().toISOString()
});

export const createWeatherAlert = (region: string, condition: string): LogisticsAlert => ({
  id: `weather-${Date.now()}`,
  type: 'delay',
  message: `${condition} expected near ${region} ⛈️ All drivers in area have been alerted.`,
  timestamp: new Date().toISOString()
});

export const createOptimizationAlert = (savedTime: number, savedDistance: string): LogisticsAlert => ({
  id: `optimization-${Date.now()}`,
  type: 'success',
  message: `Route optimization complete! Saved ${savedTime} minutes and ${savedDistance} km today 🎯`,
  timestamp: new Date().toISOString()
});

export const createFuelAlert = (vehicleId: string, fuelLevel: number): LogisticsAlert => ({
  id: `fuel-${Date.now()}`,
  type: 'maintenance',
  message: `Vehicle ${vehicleId} fuel level at ${fuelLevel}% ⛽ Nearest fuel station located.`,
  timestamp: new Date().toISOString(),
  vehicleId: `Vehicle ${vehicleId}`
});

// Sample alerts for demo
export const getSampleAlerts = (): LogisticsAlert[] => [
  createRerouteAlert('12', 'Guntur', '3:40 PM'),
  createDeliverySuccessAlert('8'),
  createMaintenanceAlert('7', 'tomorrow'),
  createDelayAlert('15', 25, 'heavy rain'),
  createDriverWellbeingAlert('Rajesh Kumar', 'high fatigue levels'),
  createOptimizationAlert(45, '12.5'),
  createFuelAlert('9', 15)
];
