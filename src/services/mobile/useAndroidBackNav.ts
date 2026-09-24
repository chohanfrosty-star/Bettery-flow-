import { useEffect, useRef } from 'react';
import { TabType } from '../../types';

interface AndroidBackNavOptions {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  activeModals: {
    isChargingScreenOpen: boolean;
    onCloseChargingScreen: () => void;
    isPaywallOpen: boolean;
    onClosePaywall: () => void;
    isQuickControlsOpen: boolean;
    onCloseQuickControls: () => void;
    isOnboardingOpen: boolean;
    onCloseOnboarding: () => void;
  };
  onToast: (msg: string, type: 'info' | 'success' | 'warning') => void;
}

/**
 * Handles Android Hardware & Gesture Back Navigation
 * Intercepts popstate to dismiss modals or return to the Home tab
 */
export function useAndroidBackNav({
  currentTab,
  onSelectTab,
  activeModals,
  onToast,
}: AndroidBackNavOptions) {
  const lastBackPressRef = useRef<number>(0);
  const activeModalsRef = useRef(activeModals);
  const currentTabRef = useRef(currentTab);

  activeModalsRef.current = activeModals;
  currentTabRef.current = currentTab;

  useEffect(() => {
    // Push an initial anchor state if history is empty
    if (window.history.state === null) {
      window.history.replaceState({ app: 'batteryflow', tab: 'home' }, '');
    }

    const handlePopState = (event: PopStateEvent) => {
      const modals = activeModalsRef.current;
      const tab = currentTabRef.current;

      // 1. Check if any modal is open - close the topmost one
      if (modals.isChargingScreenOpen) {
        modals.onCloseChargingScreen();
        // Prevent default exit
        window.history.pushState({ app: 'batteryflow', tab }, '');
        return;
      }

      if (modals.isPaywallOpen) {
        modals.onClosePaywall();
        window.history.pushState({ app: 'batteryflow', tab }, '');
        return;
      }

      if (modals.isQuickControlsOpen) {
        modals.onCloseQuickControls();
        window.history.pushState({ app: 'batteryflow', tab }, '');
        return;
      }

      if (modals.isOnboardingOpen) {
        modals.onCloseOnboarding();
        window.history.pushState({ app: 'batteryflow', tab }, '');
        return;
      }

      // 2. If not on Home tab, navigate back to Home
      if (tab !== 'home') {
        onSelectTab('home');
        window.history.pushState({ app: 'batteryflow', tab: 'home' }, '');
        return;
      }

      // 3. If on Home tab, prompt "Press back again to exit"
      const now = Date.now();
      if (now - lastBackPressRef.current < 2000) {
        // Allow app exit on second tap within 2 seconds
        return;
      }

      lastBackPressRef.current = now;
      onToast('Press back again to exit', 'info');
      window.history.pushState({ app: 'batteryflow', tab: 'home' }, '');
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [onSelectTab, onToast]);
}
