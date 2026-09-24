package com.batteryflow.app.billing

import com.android.billingclient.api.BillingClient

/**
 * Verified subscription lifecycle states.
 */
enum class SubscriptionStatus {
    NOT_PURCHASED,
    PENDING_PURCHASE,      // Grace/Pending payment (e.g. UPI/cash/bank processing)
    ACTIVE,                // Verified active subscription
    IN_GRACE_PERIOD,       // Payment failure, user has grace window to fix billing
    CANCELLED_ACTIVE,      // Cancelled auto-renewal, but subscription period still valid
    EXPIRED                // Subscription period expired
}

/**
 * Premium feature enumeration to gate specific functionality.
 */
enum class PremiumFeature(val title: String, val description: String) {
    ADVANCED_ANALYTICS("Advanced Analytics", "Deep telemetry diagnostics & battery health models"),
    CHARGING_SESSION_HISTORY("Charging Session History", "Historical log of all charge and discharge sessions"),
    HISTORICAL_BATTERY_CHARTS("Historical Battery Charts", "Interactive voltage, temperature, and level charts"),
    CHARGING_SPEED_ANALYSIS("Charging Speed Analysis", "Watts/mA negotiation and charging rate curves"),
    BATTERY_DRAIN_ANALYSIS("Battery Drain Analysis", "Per-app and system power consumption tracking"),
    DETAILED_CHARGING_STATS("Detailed Charging Stats", "Time to full, thermal rise, and capacity wear"),
    ADVANCED_REPORTS("Advanced Reports", "Exportable CSV telemetry reports & health summaries"),
    ADVANCED_CHARGING_SCREEN_CUSTOMIZATION("Screen Customization", "Custom animations, fonts, and AMOLED clock layouts"),
    PREMIUM_WALLPAPERS_THEMES("Premium Wallpapers & Themes", "Aurora Neon, Deep Cyber, and OLED themes"),
    AD_FREE_EXPERIENCE("Ad-Free Experience", "Zero banners, zero interruptions forever")
}

/**
 * Verified subscription state model. Source of truth for client feature unlocks.
 */
data class SubscriptionState(
    val status: SubscriptionStatus = SubscriptionStatus.NOT_PURCHASED,
    val productId: String? = null,
    val purchaseToken: String? = null,
    val orderId: String? = null,
    val purchaseTimeMillis: Long = 0L,
    val expiryTimeMillis: Long = 0L,
    val isAutoRenewing: Boolean = false,
    val isVerified: Boolean = false,
    val lastVerifiedTimestamp: Long = 0L
) {
    val isPremiumActive: Boolean
        get() = isVerified && (
            status == SubscriptionStatus.ACTIVE ||
            status == SubscriptionStatus.CANCELLED_ACTIVE ||
            status == SubscriptionStatus.IN_GRACE_PERIOD
        )
}

/**
 * Structured billing error type with user-friendly error surfacing.
 */
sealed class BillingError(
    val code: Int,
    val userFriendlyMessage: String,
    val rawDebugMessage: String
) {
    object UserCanceled : BillingError(
        code = BillingClient.BillingResponseCode.USER_CANCELED,
        userFriendlyMessage = "Purchase was cancelled. You have not been charged.",
        rawDebugMessage = "Billing response: USER_CANCELED"
    )

    object NetworkError : BillingError(
        code = BillingClient.BillingResponseCode.NETWORK_ERROR,
        userFriendlyMessage = "Network connection error. Please check your internet connection and try again.",
        rawDebugMessage = "Billing response: NETWORK_ERROR"
    )

    object ServiceUnavailable : BillingError(
        code = BillingClient.BillingResponseCode.SERVICE_UNAVAILABLE,
        userFriendlyMessage = "Google Play Store service is temporarily unavailable. Please try again shortly.",
        rawDebugMessage = "Billing response: SERVICE_UNAVAILABLE"
    )

    object BillingUnavailable : BillingError(
        code = BillingClient.BillingResponseCode.BILLING_UNAVAILABLE,
        userFriendlyMessage = "Google Play Billing is unavailable. Ensure your Play Store app is updated and signed in.",
        rawDebugMessage = "Billing response: BILLING_UNAVAILABLE"
    )

    object ItemAlreadyOwned : BillingError(
        code = BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED,
        userFriendlyMessage = "You already own an active subscription! Restoring your purchases...",
        rawDebugMessage = "Billing response: ITEM_ALREADY_OWNED"
    )

    object ItemUnavailable : BillingError(
        code = BillingClient.BillingResponseCode.ITEM_UNAVAILABLE,
        userFriendlyMessage = "The requested subscription is currently not available in your region.",
        rawDebugMessage = "Billing response: ITEM_UNAVAILABLE"
    )

    object VerificationFailed : BillingError(
        code = -100,
        userFriendlyMessage = "Subscription verification could not be confirmed securely. Please restore your purchases.",
        rawDebugMessage = "Verification signature or token integrity validation failed."
    )

    class Other(
        code: Int,
        debugMessage: String
    ) : BillingError(
        code = code,
        userFriendlyMessage = "An unexpected Play Store error occurred (${code}). Please try again.",
        rawDebugMessage = debugMessage
    )

    companion object {
        fun fromResponseCode(responseCode: Int, debugMessage: String): BillingError {
            return when (responseCode) {
                BillingClient.BillingResponseCode.USER_CANCELED -> UserCanceled
                BillingClient.BillingResponseCode.NETWORK_ERROR -> NetworkError
                BillingClient.BillingResponseCode.SERVICE_UNAVAILABLE -> ServiceUnavailable
                BillingClient.BillingResponseCode.BILLING_UNAVAILABLE -> BillingUnavailable
                BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED -> ItemAlreadyOwned
                BillingClient.BillingResponseCode.ITEM_UNAVAILABLE -> ItemUnavailable
                else -> Other(responseCode, debugMessage)
            }
        }
    }
}
