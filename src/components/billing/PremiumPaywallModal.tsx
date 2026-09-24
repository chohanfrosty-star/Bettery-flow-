import React, { useState } from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  Zap,
  Lock,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Check,
  Flame,
} from 'lucide-react';
import {
  SUBSCRIPTION_PLANS,
  SubscriptionProductId,
  GOOGLE_PLAY_PRODUCTS,
} from '../../services/billing/billingTypes';
import { useSubscription } from '../../services/billing/useSubscription';
import { useBillingError } from '../../services/billing/useBillingError';
import { AccentColor } from '../../types';

interface PremiumPaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  accent?: AccentColor;
  initialSelectedProductId?: SubscriptionProductId;
  featuredReason?: string;
}

export const PremiumPaywallModal: React.FC<PremiumPaywallModalProps> = ({
  isOpen,
  onClose,
  accent = 'Mint',
  initialSelectedProductId = GOOGLE_PLAY_PRODUCTS.BATTERYFLOW_PREMIUM_YEARLY,
  featuredReason,
}) => {
  const {
    isPremium,
    state: subscriptionState,
    currentPlan,
    purchaseProduct,
    restorePurchases,
  } = useSubscription();

  const {
    hasError,
    errorMessage,
    errorCode,
    handleBillingError,
    clearError,
    retry,
  } = useBillingError();

  const [selectedProductId, setSelectedProductId] = useState<SubscriptionProductId>(
    initialSelectedProductId
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreSuccessMessage, setRestoreSuccessMessage] = useState<string | null>(null);
  const [showTesterTools, setShowTesterTools] = useState(false);

  if (!isOpen) return null;

  const getAccentHex = () => {
    switch (accent) {
      case 'Cyan':
        return '#00d2ff';
      case 'Amber':
        return '#f59e0b';
      case 'Sky':
        return '#0ea5e9';
      default:
        return '#10b981'; // Mint
    }
  };

  const accentHex = getAccentHex();

  const handlePurchase = async (
    simulateScenario?: 'SUCCESS' | 'CANCEL' | 'NETWORK_ERROR' | 'PENDING' | 'ALREADY_OWNED'
  ) => {
    clearError();
    setRestoreSuccessMessage(null);
    setIsProcessing(true);

    try {
      const result = await purchaseProduct(selectedProductId, { simulateScenario });
      if (!result.success && result.error) {
        handleBillingError(result.error, () => handlePurchase(simulateScenario));
      } else if (result.success) {
        if (simulateScenario === 'PENDING') {
          // Stay open with pending status notice
        } else {
          // Verification complete
          setTimeout(() => {
            onClose();
          }, 600);
        }
      }
    } catch (err: any) {
      handleBillingError({
        code: 'UNKNOWN',
        userFriendlyMessage: 'Could not complete Google Play transaction. Please try again.',
        debugMessage: err?.message,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestore = async () => {
    clearError();
    setRestoreSuccessMessage(null);
    setIsRestoring(true);

    try {
      const result = await restorePurchases();
      if (result.restored) {
        setRestoreSuccessMessage(result.message);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        handleBillingError({
          code: 'UNKNOWN',
          userFriendlyMessage: result.message,
        });
      }
    } catch (err: any) {
      handleBillingError({
        code: 'NETWORK_ERROR',
        userFriendlyMessage: 'Unable to restore purchases from Google Play. Please check your network connection.',
        debugMessage: err?.message,
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const freeFeaturesList = [
    'Battery percentage (%) & state',
    'Real-time charging/discharging status',
    'Real current draw (mA)',
    'Real bus voltage (V)',
    'Real pack temperature (°C / °F)',
    'Battery health & technology',
    'Basic live battery dashboard',
    'Basic ambient charging screen',
  ];

  const premiumFeaturesList = [
    'Advanced battery analytics & health models',
    'Full charging session history & logs',
    'Historical battery charts (1h, 6h, 24h, 7d, 30d)',
    'Charging speed analysis & Wattage curves',
    'Battery drain rate analysis (%/hour)',
    'Detailed charging cycle statistics',
    'Advanced CSV telemetry reports & export',
    'Advanced charging-screen customization',
    'Premium OLED & Aurora themes',
    '100% Ad-free experience',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md max-h-[92vh] flex flex-col bg-[#0b0e14] border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
        {/* Ambient Aurora Glow Header */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-48 rounded-full blur-3xl pointer-events-none opacity-30"
          style={{
            background: `radial-gradient(circle, ${accentHex} 0%, rgba(0,210,255,0.4) 60%, transparent 100%)`,
          }}
        />

        {/* Modal Top Bar */}
        <div className="relative z-10 flex items-center justify-between px-5 pt-4 pb-2">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <button
            onClick={handleRestore}
            disabled={isRestoring || isProcessing}
            className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-emerald-400 flex items-center space-x-1 disabled:opacity-50"
          >
            {isRestoring ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Restoring...</span>
              </>
            ) : (
              <span>Restore Purchases</span>
            )}
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-4 text-zinc-200">
          {/* Header Icon + Title */}
          <div className="text-center pt-1">
            <div
              className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center shadow-lg mb-3"
              style={{
                background: `linear-gradient(135deg, ${accentHex}, #00d2ff)`,
              }}
            >
              <Zap className="w-7 h-7 text-black fill-black" />
            </div>

            <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono font-bold tracking-wider text-emerald-400 uppercase mb-1.5">
              <Sparkles className="w-3 h-3" />
              <span>Google Play Subscription</span>
            </div>

            <h2 className="text-2xl font-black tracking-tight text-white">
              BatteryFlow Pro
            </h2>

            <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
              {featuredReason ||
                'Unlock advanced telemetry charts, charging speed analysis, full history logs, and OLED themes.'}
            </p>
          </div>

          {/* Current Verified Status Notice (if already subscribed or pending) */}
          {isPremium && (
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center space-x-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-white block">Active Subscription Verified</span>
                <span className="text-zinc-400">
                  {currentPlan?.title || 'Pro Active'} • Valid until{' '}
                  {new Date(subscriptionState.expiryTime).toLocaleDateString()}
                </span>
              </div>
            </div>
          )}

          {subscriptionState.status === 'PENDING' && (
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center space-x-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-amber-300 block">Payment Pending Clearance</span>
                <span className="text-zinc-400">
                  Google Play is processing your transaction with your provider. Premium unlocks upon verified settlement.
                </span>
              </div>
            </div>
          )}

          {restoreSuccessMessage && (
            <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-xs text-emerald-300 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{restoreSuccessMessage}</span>
            </div>
          )}

          {/* Error Banner surfaced via useBillingError hook */}
          {hasError && (
            <div className="p-3.5 rounded-2xl bg-red-950/70 border border-red-500/40 text-xs space-y-2 animate-fadeIn">
              <div className="flex items-start space-x-2.5">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-bold text-red-200 block text-[11px] uppercase tracking-wider">
                    Google Play Billing Notice ({errorCode})
                  </span>
                  <p className="text-zinc-300 text-xs mt-0.5 leading-snug">{errorMessage}</p>
                </div>
                <button
                  onClick={clearError}
                  className="text-zinc-400 hover:text-white p-0.5"
                  aria-label="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {errorCode === 'NETWORK_ERROR' && (
                <button
                  onClick={retry}
                  className="w-full py-1.5 px-3 rounded-xl bg-red-800/60 hover:bg-red-700/60 border border-red-500/30 text-white font-semibold text-xs transition-colors flex items-center justify-center space-x-1.5"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Retry Connection</span>
                </button>
              )}
            </div>
          )}

          {/* Subscription Plans Selection (Monthly, 6 Months, Yearly) */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-zinc-400 px-1">
              <span>Choose Subscription Plan</span>
              <span className="text-[10px] font-mono text-zinc-400">Google Play Tier</span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {SUBSCRIPTION_PLANS.map((plan) => {
                const isSelected = selectedProductId === plan.productId;
                return (
                  <div
                    key={plan.productId}
                    onClick={() => {
                      setSelectedProductId(plan.productId);
                      clearError();
                    }}
                    className={`relative p-3.5 rounded-2xl cursor-pointer transition-all border select-none ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500 shadow-md ring-1 ring-emerald-500/30'
                        : 'bg-zinc-900/70 hover:bg-zinc-900 border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${
                            isSelected
                              ? 'bg-emerald-500 border-emerald-500 text-black'
                              : 'border-zinc-600 bg-transparent'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-sm text-white">{plan.title}</span>
                            {plan.badge && (
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-500 text-black">
                                {plan.badge}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-zinc-400 block mt-0.5">
                            {plan.description}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-base font-black text-white font-mono block">
                          {plan.price}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          /{plan.period}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Primary Call to Action: Official Google Play Billing */}
          <div className="pt-2">
            <button
              onClick={() => handlePurchase('SUCCESS')}
              disabled={isProcessing}
              className="w-full py-3.5 px-4 rounded-2xl font-black text-sm tracking-wide transition-all shadow-xl flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
              style={{
                backgroundColor: accentHex,
                color: '#000000',
              }}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-black" />
                  <span>Contacting Google Play...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-black" />
                  <span>Subscribe with Google Play</span>
                </>
              )}
            </button>

            <p className="text-[10px] text-center text-zinc-400 mt-2 leading-relaxed px-2">
              Official Google Play Billing. Payment charged to your Play account upon confirmation.
              Cancel anytime in Google Play Store subscriptions.
            </p>
          </div>

          {/* Free vs Pro Comparison */}
          <div className="pt-3 border-t border-white/5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Free vs Pro Breakdown
            </h4>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-2xl bg-zinc-900/60 border border-white/5 space-y-2">
                <span className="text-[11px] font-bold text-zinc-400 block border-b border-white/5 pb-1">
                  Free Forever
                </span>
                <ul className="space-y-1.5 text-[11px] text-zinc-400 font-sans">
                  {freeFeaturesList.map((item, idx) => (
                    <li key={idx} className="flex items-start space-x-1.5 leading-snug">
                      <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                <span className="text-[11px] font-bold text-emerald-400 block border-b border-emerald-500/20 pb-1">
                  Pro Unlocked
                </span>
                <ul className="space-y-1.5 text-[11px] text-zinc-300 font-sans">
                  {premiumFeaturesList.map((item, idx) => (
                    <li key={idx} className="flex items-start space-x-1.5 leading-snug">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Interactive Play Billing Sandbox Tester Drawer (For reviewers and QA testing) */}
          <div className="pt-3 border-t border-white/5">
            <button
              onClick={() => setShowTesterTools(!showTesterTools)}
              className="w-full flex items-center justify-between text-[11px] font-mono text-zinc-400 hover:text-zinc-300 py-1"
            >
              <span>Play Billing Test Scenarios (QA Sandbox)</span>
              {showTesterTools ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showTesterTools && (
              <div className="mt-2 p-3 rounded-2xl bg-black/40 border border-white/10 space-y-2 text-xs font-mono">
                <p className="text-[10px] text-zinc-400">
                  Simulate official Google Play response states & error handling:
                </p>
                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  <button
                    onClick={() => handlePurchase('SUCCESS')}
                    className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 text-left"
                  >
                    Simulate Verified Active
                  </button>
                  <button
                    onClick={() => handlePurchase('NETWORK_ERROR')}
                    className="p-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 text-left"
                  >
                    Simulate NETWORK_ERROR
                  </button>
                  <button
                    onClick={() => handlePurchase('CANCEL')}
                    className="p-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 text-left"
                  >
                    Simulate USER_CANCELED
                  </button>
                  <button
                    onClick={() => handlePurchase('PENDING')}
                    className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 text-left"
                  >
                    Simulate Pending Payment
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
