package com.batteryflow.app.billing

import android.app.Activity
import android.content.Context
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.StateFlow

/**
 * Centralized SubscriptionManager for BatteryFlow.
 * All Premium features query this manager for verification status.
 */
class SubscriptionManager private constructor(context: Context) {

    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())
    val billingManager = BillingManager(context.applicationContext, scope)

    val subscriptionState: StateFlow<SubscriptionState> = billingManager.subscriptionState

    val isPremium: Boolean
        get() = subscriptionState.value.isPremiumActive

    /**
     * Checks if a specific feature is unlocked according to the verified subscription state.
     */
    fun isFeatureUnlocked(feature: PremiumFeature): Boolean {
        return isPremium
    }

    /**
     * Launch purchase for a given product ID via Google Play Billing.
     */
    fun purchaseSubscription(activity: Activity, productId: String) {
        billingManager.launchPurchaseFlow(activity, productId)
    }

    /**
     * Restores Google Play purchases.
     */
    fun restorePurchases() {
        billingManager.restorePurchases()
    }

    companion object {
        @Volatile
        private var INSTANCE: SubscriptionManager? = null

        fun getInstance(context: Context): SubscriptionManager {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: SubscriptionManager(context.applicationContext).also { INSTANCE = it }
            }
        }
    }
}
