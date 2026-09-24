import { useState, useCallback } from 'react';
import { BillingErrorCode, BillingErrorPayload } from './billingTypes';

export interface BillingErrorState {
  hasError: boolean;
  code: BillingErrorCode | null;
  userFriendlyMessage: string | null;
  debugMessage: string | null;
  timestamp: number | null;
  retryAction?: (() => void) | null;
}

/**
 * Dedicated error handling hook for Google Play billing processes.
 * Transforms low-level Play Store response codes and network failures into
 * actionable, friendly user feedback messages.
 */
export function useBillingError() {
  const [errorState, setErrorState] = useState<BillingErrorState>({
    hasError: false,
    code: null,
    userFriendlyMessage: null,
    debugMessage: null,
    timestamp: null,
    retryAction: null,
  });

  const getFriendlyMessageForCode = useCallback((code: BillingErrorCode): string => {
    switch (code) {
      case 'USER_CANCELED':
        return 'Subscription purchase was cancelled. You have not been charged.';
      case 'NETWORK_ERROR':
        return 'Network connection error. Please check your Wi-Fi or mobile data and try again.';
      case 'SERVICE_UNAVAILABLE':
        return 'Google Play Billing services are temporarily unavailable. Please try again in a few minutes.';
      case 'BILLING_UNAVAILABLE':
        return 'Google Play Billing is unavailable. Ensure your Play Store app is updated and signed in.';
      case 'ITEM_ALREADY_OWNED':
        return 'You already own an active subscription to BatteryFlow Pro. Restoring your purchases now.';
      case 'ITEM_UNAVAILABLE':
        return 'This subscription tier is currently unavailable in your Play Store region.';
      case 'DEVELOPER_ERROR':
        return 'Configuration mismatch with Google Play Console. Please update your BatteryFlow app.';
      case 'VERIFICATION_FAILED':
        return 'Could not securely verify purchase signature with Google Play servers. Please restore purchases.';
      case 'UNKNOWN':
      default:
        return 'An unexpected Play Store error occurred. Please try again or restore purchases.';
    }
  }, []);

  const handleBillingError = useCallback(
    (
      errorPayload: Partial<BillingErrorPayload> & { code?: BillingErrorCode; message?: string },
      onRetry?: () => void
    ) => {
      const code: BillingErrorCode = errorPayload.code || 'UNKNOWN';
      const friendlyMsg = errorPayload.userFriendlyMessage || getFriendlyMessageForCode(code);

      console.warn(`[PlayBillingError] Code: ${code} - ${friendlyMsg}`, errorPayload.debugMessage);

      setErrorState({
        hasError: true,
        code,
        userFriendlyMessage: friendlyMsg,
        debugMessage: errorPayload.debugMessage || errorPayload.message || null,
        timestamp: Date.now(),
        retryAction: onRetry || null,
      });
    },
    [getFriendlyMessageForCode]
  );

  const clearError = useCallback(() => {
    setErrorState({
      hasError: false,
      code: null,
      userFriendlyMessage: null,
      debugMessage: null,
      timestamp: null,
      retryAction: null,
    });
  }, []);

  const retry = useCallback(() => {
    if (errorState.retryAction) {
      const action = errorState.retryAction;
      clearError();
      action();
    }
  }, [errorState.retryAction, clearError]);

  return {
    error: errorState,
    hasError: errorState.hasError,
    errorMessage: errorState.userFriendlyMessage,
    errorCode: errorState.code,
    handleBillingError,
    clearError,
    retry,
  };
}
