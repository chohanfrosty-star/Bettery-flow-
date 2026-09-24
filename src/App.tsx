/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  TabType,
  LookSettings,
  AppSettings,
  ObservationPoint,
  BatteryEvent,
  BatteryAnalyticsSummary,
} from './types';
import {
  BatteryService,
  LiveBatteryData,
} from './services/batteryService';
import {
  StorageService,
  DEFAULT_LOOK_SETTINGS,
  DEFAULT_APP_SETTINGS,
} from './services/storageService';
import { NotificationService } from './services/notificationService';

import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { HomeView } from './components/HomeView';
import { HistoryView } from './components/HistoryView';
import { DiagnosticsView } from './components/DiagnosticsView';
import { LookView } from './components/LookView';
import { SettingsView } from './components/SettingsView';
import { QuickControlsModal } from './components/QuickControlsModal';
import { ToastContainer } from './components/ToastContainer';
import { ChargingScreen } from './components/ChargingScreen';
import { SystemConnectionModal } from './components/SystemConnectionModal';
import { useSubscription } from './services/billing/useSubscription';
import { PremiumPaywallModal } from './components/billing/PremiumPaywallModal';
import { useAndroidBackNav } from './services/mobile/useAndroidBackNav';
import { MobileOfflineBanner } from './components/mobile/MobileOfflineBanner';

export default function App() {
  const { isPremium } = useSubscription();
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState<TabType>('home');
  const [lookSettings, setLookSettings] = useState<LookSettings>(() =>
    StorageService.getLookSettings()
  );
  const [appSettings, setAppSettings] = useState<AppSettings>(() =>
    StorageService.getAppSettings()
  );

  const [batteryData, setBatteryData] = useState<LiveBatteryData>(() =>
    BatteryService.getInstance().getCurrentData()
  );

  const [observations, setObservations] = useState<ObservationPoint[]>(() =>
    StorageService.getObservations()
  );
  const [events, setEvents] = useState<BatteryEvent[]>(() =>
    StorageService.getEvents()
  );
  const [timeFilter, setTimeFilter] = useState<'1H' | '6H' | '24H' | '7D' | '30D'>('24H');
  const [isQuickControlsOpen, setIsQuickControlsOpen] = useState(false);
  const [isChargingScreenOpen, setIsChargingScreenOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(() => {
    return localStorage.getItem('batteryflow_onboarded_v2') !== 'true';
  });

  const handleCompleteOnboarding = () => {
    setIsOnboardingOpen(false);
    localStorage.setItem('batteryflow_onboarded_v2', 'true');
  };

  // Android hardware back button and gesture navigation handler
  useAndroidBackNav({
    currentTab,
    onSelectTab: setCurrentTab,
    activeModals: {
      isChargingScreenOpen,
      onCloseChargingScreen: () => setIsChargingScreenOpen(false),
      isPaywallOpen,
      onClosePaywall: () => setIsPaywallOpen(false),
      isQuickControlsOpen,
      onCloseQuickControls: () => setIsQuickControlsOpen(false),
      isOnboardingOpen,
      onCloseOnboarding: handleCompleteOnboarding,
    },
    onToast: (msg, type) => {
      NotificationService.getInstance().triggerAlert('back-nav', 'Navigation', msg, type);
    },
  });

  const guardianAlertFiredRef = useRef<boolean>(false);

  // Subscribe to live battery updates from the service and sync with history telemetry
  useEffect(() => {
    const unsub = BatteryService.getInstance().subscribe((data) => {
      setBatteryData(data);

      // Keep latest observation point synchronized with current battery level & telemetry
      const point: ObservationPoint = {
        id: `obs-live-${data.lastUpdated}`,
        timestamp: data.lastUpdated,
        level: data.level,
        state: data.state,
        currentMa: data.currentMa,
        voltageV: data.voltageV,
        tempC: data.tempC,
        powerW: data.powerW,
        chargerType: data.chargerType,
      };
      StorageService.syncLiveTelemetryPoint(point, appSettings.historyRetention);
      setObservations(StorageService.getFilteredObservations(timeFilter));
    });
    return unsub;
  }, [appSettings.historyRetention, timeFilter]);

  // Battery Guardian (80% Charge Limit Desktop Notification)
  useEffect(() => {
    const guardianActive = appSettings.batteryGuardian ?? appSettings.alerts.batteryGuardian ?? true;
    if (guardianActive && batteryData.isCharging && batteryData.level >= 80) {
      if (!guardianAlertFiredRef.current) {
        guardianAlertFiredRef.current = true;
        NotificationService.getInstance().triggerAlert(
          'battery-guardian',
          'Battery Guardian: 80% Charge Reached',
          'Disconnect your charger now to avoid battery degradation and preserve cell health.',
          'warning'
        );
      }
    } else if (!batteryData.isCharging || batteryData.level < 78) {
      // Reset trigger once disconnected or below hysteresis threshold
      guardianAlertFiredRef.current = false;
    }
  }, [batteryData.level, batteryData.isCharging, appSettings.batteryGuardian, appSettings.alerts.batteryGuardian]);

  // Update LookSettings persistence
  const handleUpdateLookSettings = (newLook: LookSettings) => {
    setLookSettings(newLook);
    StorageService.saveLookSettings(newLook);
  };

  // Update AppSettings persistence
  const handleUpdateAppSettings = (newApp: AppSettings) => {
    setAppSettings(newApp);
    StorageService.saveAppSettings(newApp);
  };

  // Switch demo simulation mode
  const handleToggleDemoMode = useCallback(() => {
    const nextMode = !batteryData.isDemoMode;
    BatteryService.getInstance().setDemoMode(nextMode);
    handleUpdateAppSettings({
      ...appSettings,
      demoMode: nextMode,
    });

    if (nextMode) {
      NotificationService.getInstance().triggerAlert(
        'demo-mode',
        'Demo Sensor Mode Activated',
        'Simulating full Android hardware telemetry & sensors.',
        'info'
      );
    }
  }, [batteryData.isDemoMode, appSettings]);

  // Handle manual refresh
  const handleRefresh = async () => {
    const updated = await BatteryService.getInstance().refresh();
    setBatteryData(updated);
  };

  // Handle interactive charger toggle
  const handleToggleCharging = () => {
    BatteryService.getInstance().toggleDemoCharging();
    const isNowCharging = !batteryData.isCharging;
    const evt = StorageService.addEvent({
      timestamp: Date.now(),
      title: isNowCharging ? 'USB-C Charger Connected' : 'Charger Disconnected',
      description: isNowCharging
        ? `Fast Power Delivery negotiated. Charge level: ${batteryData.level}%.`
        : `Switched to battery power at ${batteryData.level}%.`,
      type: isNowCharging ? 'charging' : 'discharging',
      severity: 'info',
    });
    setEvents(StorageService.getEvents());
  };

  // Handle interactive level slider
  const handleSetLevel = (level: number) => {
    BatteryService.getInstance().setDemoLevel(level);

    // Check alert thresholds
    if (level <= appSettings.alerts.criticalBatteryThreshold && !batteryData.isCharging) {
      NotificationService.getInstance().triggerAlert(
        'critical-battery',
        'Critical Battery Warning',
        `Battery is critically low at ${level}%. Connect charger immediately.`,
        'critical'
      );
    } else if (level <= appSettings.alerts.lowBatteryThreshold && !batteryData.isCharging) {
      NotificationService.getInstance().triggerAlert(
        'low-battery',
        'Low Battery Alert',
        `Battery is at ${level}%. Power saver recommended.`,
        'warning'
      );
    } else if (level >= 100 && batteryData.isCharging) {
      NotificationService.getInstance().triggerAlert(
        'full-battery',
        'Battery Fully Charged',
        'Battery has reached 100%. You can disconnect the charger.',
        'success'
      );
    }
  };

  // History time filter handler
  const handleSelectTimeFilter = (filter: '1H' | '6H' | '24H' | '7D' | '30D') => {
    setTimeFilter(filter);
    setObservations(StorageService.getFilteredObservations(filter));
  };

  // Export CSV handler
  const handleExportCSV = () => {
    StorageService.exportHistoryCSV();
  };

  // Clear History handler
  const handleClearHistory = () => {
    StorageService.clearHistory();
    setObservations([]);
    setEvents([]);
    NotificationService.getInstance().triggerAlert(
      'history-cleared',
      'History Cleared',
      'All local battery records have been removed.',
      'info'
    );
  };

  // Background sampling & lifecycle optimization
  useEffect(() => {
    const samplingIntervalMs = Math.max(15, appSettings.samplingIntervalSec) * 1000;

    const recordSample = () => {
      // Don't record when document is hidden to conserve device battery
      if (document.hidden) return;

      const current = BatteryService.getInstance().getCurrentData();
      const point: ObservationPoint = {
        id: `obs-${Date.now()}`,
        timestamp: Date.now(),
        level: current.level,
        state: current.state,
        currentMa: current.currentMa,
        voltageV: current.voltageV,
        tempC: current.tempC,
        powerW: current.powerW,
        chargerType: current.chargerType,
      };

      StorageService.addObservation(point, appSettings.historyRetention);
      setObservations(StorageService.getFilteredObservations(timeFilter));
    };

    const interval = setInterval(recordSample, samplingIntervalMs);
    return () => clearInterval(interval);
  }, [appSettings.samplingIntervalSec, appSettings.historyRetention, timeFilter]);

  // Compute analytics
  const analytics: BatteryAnalyticsSummary = useMemo(
    () => StorageService.computeAnalytics(batteryData.level, batteryData.state),
    [batteryData.level, batteryData.state]
  );

  // Diagnostics object synchronized with live batteryData
  const diagnostics = useMemo(
    () => BatteryService.getInstance().getDiagnostics(appSettings.simulatedDevice),
    [batteryData, appSettings.simulatedDevice]
  );

  const totalStoredSamples = useMemo(
    () => StorageService.getTotalStoredCount(),
    [observations]
  );

  // Theme styling calculation
  const isLight = appSettings.theme === 'light';
  const isAmoled = lookSettings.amoledMode && !isLight;

  let bgClass = 'bg-[#0c0e12] text-zinc-100';
  if (isLight) {
    bgClass = 'bg-slate-100 text-slate-900';
  } else if (isAmoled) {
    bgClass = 'bg-black text-zinc-100';
  } else if (lookSettings.wallpaper === 'Midnight') {
    bgClass = 'bg-[#09090b] text-zinc-100';
  } else if (lookSettings.wallpaper === 'Mist') {
    bgClass = 'bg-[#0b1329] text-zinc-100';
  } else {
    // Graphite
    bgClass = 'bg-[#111317] text-zinc-100';
  }

  return (
    <div
      className={`min-h-screen w-full transition-colors duration-300 font-sans ${bgClass} ${
        isLight ? 'theme-light' : ''
      }`}
    >
      {/* Toast Alert Notification System */}
      <ToastContainer />

      {/* Network Connectivity Detection Banner */}
      <MobileOfflineBanner />

      {/* Mobile-First Application Container */}
      <div className="w-full max-w-lg mx-auto min-h-[100dvh] flex flex-col relative md:shadow-2xl overflow-x-hidden">
        {/* App Header */}
        <Header
          isCharging={batteryData.isCharging}
          isDemoMode={batteryData.isDemoMode}
          isHardwareApiAvailable={batteryData.isRealHardwareApiAvailable}
          lookSettings={lookSettings}
          onToggleDemoMode={handleToggleDemoMode}
          onRefresh={handleRefresh}
          onOpenQuickControls={() => setIsQuickControlsOpen(true)}
          onOpenChargingScreen={() => setIsChargingScreenOpen(true)}
          isPremium={isPremium}
          onOpenPaywall={() => setIsPaywallOpen(true)}
        />

        {/* Dynamic View Content with Safe Bottom Margin for Navigation Dock */}
        <main className="flex-1 px-4 pt-3 pb-32 overflow-y-auto overscroll-contain">
          {currentTab === 'home' && (
            <HomeView
              batteryData={batteryData}
              lookSettings={lookSettings}
              appSettings={appSettings}
              analytics={analytics}
              accent={lookSettings.accent}
              observations={observations}
              onNavigateToHistory={() => setCurrentTab('history')}
              onNavigateToDiagnostics={() => setCurrentTab('diagnostics')}
              onOpenQuickControls={() => setIsQuickControlsOpen(true)}
              onOpenChargingScreen={() => setIsChargingScreenOpen(true)}
              isPremium={isPremium}
              onOpenPaywall={() => setIsPaywallOpen(true)}
            />
          )}

          {currentTab === 'history' && (
            <HistoryView
              observations={observations}
              totalStoredSamples={totalStoredSamples}
              events={events}
              accent={lookSettings.accent}
              tempUnit={appSettings.tempUnit}
              timeFilter={timeFilter}
              onSelectTimeFilter={handleSelectTimeFilter}
              onExportCSV={handleExportCSV}
              onClearHistory={handleClearHistory}
              isPremium={isPremium}
              onOpenPaywall={() => setIsPaywallOpen(true)}
            />
          )}

          {currentTab === 'diagnostics' && (
            <DiagnosticsView
              diagnostics={diagnostics}
              accent={lookSettings.accent}
              isDemoMode={batteryData.isDemoMode}
              onToggleDemoMode={handleToggleDemoMode}
            />
          )}

          {currentTab === 'look' && (
            <LookView
              lookSettings={lookSettings}
              onChangeLookSettings={handleUpdateLookSettings}
              batteryLevel={batteryData.level}
              isCharging={batteryData.isCharging}
              onOpenChargingScreen={() => setIsChargingScreenOpen(true)}
              isPremium={isPremium}
              onOpenPaywall={() => setIsPaywallOpen(true)}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              appSettings={appSettings}
              lookSettings={lookSettings}
              onUpdateAppSettings={handleUpdateAppSettings}
              onUpdateLookSettings={handleUpdateLookSettings}
              onClearHistory={handleClearHistory}
              onExportCSV={handleExportCSV}
              accent={lookSettings.accent}
              onOpenOnboarding={() => setIsOnboardingOpen(true)}
              isPremium={isPremium}
              onOpenPaywall={() => setIsPaywallOpen(true)}
            />
          )}
        </main>

        {/* Persistent Bottom Navigation Bar */}
        <Navigation
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          accent={lookSettings.accent}
          density={lookSettings.density}
        />

        {/* Quick Simulator & Tester Modal */}
        <QuickControlsModal
          isOpen={isQuickControlsOpen}
          onClose={() => setIsQuickControlsOpen(false)}
          batteryData={batteryData}
          onToggleCharging={handleToggleCharging}
          onSetLevel={handleSetLevel}
          isDemoMode={batteryData.isDemoMode}
          onToggleDemoMode={handleToggleDemoMode}
          accent={lookSettings.accent}
        />

        {/* Full-Screen Ambient Charging Display */}
        <ChargingScreen
          isOpen={isChargingScreenOpen}
          onClose={() => setIsChargingScreenOpen(false)}
          batteryData={batteryData}
          lookSettings={lookSettings}
          appSettings={appSettings}
          onUpdateLookSettings={handleUpdateLookSettings}
          accent={lookSettings.accent}
        />

        {/* Device Initialization / Onboarding Modal */}
        <SystemConnectionModal
          isOpen={isOnboardingOpen}
          onClose={handleCompleteOnboarding}
          onComplete={handleCompleteOnboarding}
        />

        {/* Google Play Premium Paywall Modal */}
        <PremiumPaywallModal
          isOpen={isPaywallOpen}
          onClose={() => setIsPaywallOpen(false)}
          accent={lookSettings.accent}
        />
      </div>
    </div>
  );
}
