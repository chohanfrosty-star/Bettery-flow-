package com.batteryflow.app.billing

/**
 * Google Play Billing Product IDs and Plan Metadata for BatteryFlow.
 * Products configured for distribution on Google Play Store.
 */
object SubscriptionProducts {
    // Subscription Product IDs as defined in Google Play Console
    const val BATTERYFLOW_PREMIUM_MONTHLY = "batteryflow_premium_monthly"
    const val BATTERYFLOW_PREMIUM_6_MONTH = "batteryflow_premium_6_month"
    const val BATTERYFLOW_PREMIUM_YEARLY = "batteryflow_premium_yearly"

    // Set of all valid subscription product IDs for querying
    val ALL_SUBSCRIPTION_IDS = listOf(
        BATTERYFLOW_PREMIUM_MONTHLY,
        BATTERYFLOW_PREMIUM_6_MONTH,
        BATTERYFLOW_PREMIUM_YEARLY
    )

    data class ProductPlanInfo(
        val productId: String,
        val title: String,
        val formattedPrice: String,
        val billingPeriod: String,
        val pricePerMonthApprox: String,
        val badge: String? = null,
        val durationMonths: Int
    )

    val DEFAULT_PLANS = listOf(
        ProductPlanInfo(
            productId = BATTERYFLOW_PREMIUM_MONTHLY,
            title = "Monthly",
            formattedPrice = "$2.50",
            billingPeriod = "month",
            pricePerMonthApprox = "$2.50 / month",
            badge = null,
            durationMonths = 1
        ),
        ProductPlanInfo(
            productId = BATTERYFLOW_PREMIUM_6_MONTH,
            title = "6 Months",
            formattedPrice = "$15.00",
            billingPeriod = "6 months",
            pricePerMonthApprox = "$2.50 / month",
            badge = "POPULAR",
            durationMonths = 6
        ),
        ProductPlanInfo(
            productId = BATTERYFLOW_PREMIUM_YEARLY,
            title = "Yearly",
            formattedPrice = "$30.00",
            billingPeriod = "year",
            pricePerMonthApprox = "$2.50 / month",
            badge = "BEST VALUE",
            durationMonths = 12
        )
    )
}
