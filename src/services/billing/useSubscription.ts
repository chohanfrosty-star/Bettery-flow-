import { useState, useEffect, useCallback, useMemo } from 'react';
import { SubscriptionManager } from './SubscriptionManager';
import {
  SubscriptionProductId,
  SubscriptionStatus,
  VerifiedSubscriptionState,
  PremiumFeatureKey,
  SUBSCRIPTION_PLANS,
  SubscriptionPlanDetails,
} from './billingTypes';

export function useSubscription() {
  const manager = useMemo(() => SubscriptionManager.getInstance(), []);
  const [state, setState] = useState<VerifiedSubscriptionState>(() => manager.getState());

  useEffect(() => {
    return manager.subscribe((nextState) => {
      setState(nextState);
    });
  }, [manager]);

  const isPremium = useMemo(() => manager.isPremiumActive(), [state, manager]);

  const currentPlan = useMemo<SubscriptionPlanDetails | null>(() => {
    if (!state.productId) return null;
    return SUBSCRIPTION_PLANS.find((p) => p.productId === state.productId) || null;
  }, [state.productId]);

  const isFeatureUnlocked = useCallback(
    (feature: PremiumFeatureKey): boolean => {
      return manager.isFeatureUnlocked(feature);
    },
    [manager]
  );

  const purchaseProduct = useCallback(
    async (
      productId: SubscriptionProductId,
      options?: { simulateScenario?: 'SUCCESS' | 'CANCEL' | 'NETWORK_ERROR' | 'PENDING' | 'ALREADY_OWNED' }
    ) => {
      return manager.purchaseSubscription(productId, options);
    },
    [manager]
  );

  const restorePurchases = useCallback(async () => {
    return manager.restorePurchases();
  }, [manager]);

  const cancelAutoRenewal = useCallback(() => {
    manager.cancelAutoRenewal();
  }, [manager]);

  const simulateGracePeriod = useCallback(() => {
    manager.simulateGracePeriod();
  }, [manager]);

  const resetToFree = useCallback(() => {
    manager.resetToFree();
  }, [manager]);

  return {
    state,
    isPremium,
    currentPlan,
    plans: SUBSCRIPTION_PLANS,
    isFeatureUnlocked,
    purchaseProduct,
    restorePurchases,
    cancelAutoRenewal,
    simulateGracePeriod,
    resetToFree,
  };
}
