package com.batteryflow.app.billing

import android.app.Activity
import android.content.Context
import android.util.Log
import com.android.billingclient.api.*
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlin.math.min
import kotlin.math.pow

private const val TAG = "BatteryFlowBilling"

class BillingManager(
    private val context: Context,
    private val coroutineScope: CoroutineScope = CoroutineScope(Dispatchers.Main + SupervisorJob())
) : PurchasesUpdatedListener, BillingClientStateListener {

    private val verifier = PurchaseVerifier(context)

    private val _billingClient: BillingClient = BillingClient.newBuilder(context)
        .setListener(this)
        .enablePendingPurchases()
        .build()

    // State of loaded ProductDetails from Play Store
    private val _productDetailsMap = MutableStateFlow<Map<String, ProductDetails>>(emptyMap())
    val productDetailsMap: StateFlow<Map<String, ProductDetails>> = _productDetailsMap.asStateFlow()

    // Loading & connection states
    private val _isConnecting = MutableStateFlow(false)
    val isConnecting: StateFlow<Boolean> = _isConnecting.asStateFlow()

    private val _isConnected = MutableStateFlow(false)
    val isConnected: StateFlow<Boolean> = _isConnected.asStateFlow()

    // Surfacing errors to UI
    private val _billingErrors = MutableSharedFlow<BillingError>(replay = 0)
    val billingErrors: SharedFlow<BillingError> = _billingErrors.asSharedFlow()

    // State flow for verified subscription state
    private val _subscriptionState = MutableStateFlow(SubscriptionState())
    val subscriptionState: StateFlow<SubscriptionState> = _subscriptionState.asStateFlow()

    private var reconnectRetryCount = 0

    init {
        startConnection()
    }

    /**
     * Start connection to Google Play Store with retry capability.
     */
    fun startConnection() {
        if (_billingClient.isReady) {
            _isConnected.value = true
            return
        }

        _isConnecting.value = true
        try {
            _billingClient.startConnection(this)
        } catch (e: Exception) {
            Log.e(TAG, "Exception starting billing connection: ${e.message}", e)
            _isConnecting.value = false
            handleConnectionError()
        }
    }

    override fun onBillingSetupFinished(billingResult: BillingResult) {
        _isConnecting.value = false
        if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
            Log.i(TAG, "Google Play Billing setup successful.")
            _isConnected.value = true
            reconnectRetryCount = 0

            // 1. Load subscription products details
            querySubscriptionProducts()

            // 2. Query and restore existing purchases
            restorePurchases()
        } else {
            Log.e(TAG, "Billing setup failed: code=${billingResult.responseCode}, msg=${billingResult.debugMessage}")
            _isConnected.value = false
            surfaceError(BillingError.fromResponseCode(billingResult.responseCode, billingResult.debugMessage))
            handleConnectionError()
        }
    }

    override fun onBillingServiceDisconnected() {
        Log.w(TAG, "Billing service disconnected. Scheduling reconnect...")
        _isConnected.value = false
        handleConnectionError()
    }

    private fun handleConnectionError() {
        reconnectRetryCount++
        val delayMillis = min(30000L, (2.0.pow(min(reconnectRetryCount, 5).toDouble()) * 1000).toLong())
        coroutineScope.launch {
            delay(delayMillis)
            if (!_billingClient.isReady) {
                Log.i(TAG, "Retrying billing connection (attempt $reconnectRetryCount)...")
                startConnection()
            }
        }
    }

    /**
     * Query product details for configured subscription tiers.
     */
    fun querySubscriptionProducts() {
        if (!_billingClient.isReady) {
            startConnection()
            return
        }

        val productList = SubscriptionProducts.ALL_SUBSCRIPTION_IDS.map { productId ->
            QueryProductDetailsParams.Product.newBuilder()
                .setProductId(productId)
                .setProductType(BillingClient.ProductType.SUBS)
                .build()
        }

        val params = QueryProductDetailsParams.newBuilder()
            .setProductList(productList)
            .build()

        _billingClient.queryProductDetailsAsync(params) { billingResult, productDetailsList ->
            if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                val map = productDetailsList.associateBy { it.productId }
                _productDetailsMap.value = map
                Log.i(TAG, "Successfully loaded ${map.size} subscription products from Google Play.")
            } else {
                Log.e(TAG, "Error querying product details: ${billingResult.debugMessage}")
                surfaceError(BillingError.fromResponseCode(billingResult.responseCode, billingResult.debugMessage))
            }
        }
    }

    /**
     * Launches the official Google Play subscription purchase flow for a specified product.
     */
    fun launchPurchaseFlow(activity: Activity, productId: String) {
        if (!_billingClient.isReady) {
            surfaceError(BillingError.ServiceUnavailable)
            startConnection()
            return
        }

        val productDetails = _productDetailsMap.value[productId]
        if (productDetails == null) {
            Log.e(TAG, "ProductDetails not loaded for $productId")
            surfaceError(BillingError.ItemUnavailable)
            querySubscriptionProducts()
            return
        }

        // Get subscription offer token (first offer / base plan)
        val offerToken = productDetails.subscriptionOfferDetails?.firstOrNull()?.offerToken
        if (offerToken == null) {
            Log.e(TAG, "No valid subscription offer found for $productId")
            surfaceError(BillingError.ItemUnavailable)
            return
        }

        val productDetailsParamsList = listOf(
            BillingFlowParams.ProductDetailsParams.newBuilder()
                .setProductDetails(productDetails)
                .setOfferToken(offerToken)
                .build()
        )

        val billingFlowParams = BillingFlowParams.newBuilder()
            .setProductDetailsParamsList(productDetailsParamsList)
            .build()

        val response = _billingClient.launchBillingFlow(activity, billingFlowParams)
        if (response.responseCode != BillingClient.BillingResponseCode.OK) {
            Log.e(TAG, "Launch billing flow failed: code=${response.responseCode}, msg=${response.debugMessage}")
            surfaceError(BillingError.fromResponseCode(response.responseCode, response.debugMessage))
        }
    }

    /**
     * Callback from Google Play Billing when purchases are updated.
     */
    override fun onPurchasesUpdated(billingResult: BillingResult, purchases: MutableList<Purchase>?) {
        when (billingResult.responseCode) {
            BillingClient.BillingResponseCode.OK -> {
                if (!purchases.isNullOrEmpty()) {
                    for (purchase in purchases) {
                        processPurchase(purchase)
                    }
                }
            }
            BillingClient.BillingResponseCode.USER_CANCELED -> {
                Log.i(TAG, "User canceled the purchase flow.")
                surfaceError(BillingError.UserCanceled)
            }
            BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED -> {
                Log.i(TAG, "Item already owned. Restoring purchases...")
                surfaceError(BillingError.ItemAlreadyOwned)
                restorePurchases()
            }
            BillingClient.BillingResponseCode.NETWORK_ERROR -> {
                Log.e(TAG, "Network error during purchase.")
                surfaceError(BillingError.NetworkError)
            }
            else -> {
                Log.e(TAG, "Purchase failed: code=${billingResult.responseCode}, msg=${billingResult.debugMessage}")
                surfaceError(BillingError.fromResponseCode(billingResult.responseCode, billingResult.debugMessage))
            }
        }
    }

    /**
     * Securely process, verify, and acknowledge purchase.
     * Never unlocks premium without verified state!
     */
    private fun processPurchase(purchase: Purchase) {
        coroutineScope.launch {
            // Step 1: Securely verify the purchase
            val verificationResult = verifier.verifyPurchase(purchase)

            when (verificationResult) {
                is VerificationResult.Success -> {
                    // Step 2: Acknowledge purchase if unacknowledged
                    if (!purchase.isAcknowledged) {
                        val acknowledgePurchaseParams = AcknowledgePurchaseParams.newBuilder()
                            .setPurchaseToken(purchase.purchaseToken)
                            .build()

                        val ackResult = withContext(Dispatchers.IO) {
                            _billingClient.acknowledgePurchase(acknowledgePurchaseParams)
                        }

                        if (ackResult.responseCode != BillingClient.BillingResponseCode.OK) {
                            Log.e(TAG, "Failed to acknowledge purchase: ${ackResult.debugMessage}")
                            surfaceError(BillingError.fromResponseCode(ackResult.responseCode, ackResult.debugMessage))
                            return@launch
                        }
                    }

                    // Step 3: Update verified state as source of truth
                    _subscriptionState.value = SubscriptionState(
                        status = verificationResult.status,
                        productId = verificationResult.productId,
                        purchaseToken = verificationResult.purchaseToken,
                        orderId = verificationResult.orderId,
                        purchaseTimeMillis = verificationResult.purchaseTimeMillis,
                        expiryTimeMillis = verificationResult.expiryTimeMillis,
                        isAutoRenewing = verificationResult.isAutoRenewing,
                        isVerified = true,
                        lastVerifiedTimestamp = System.currentTimeMillis()
                    )
                    Log.i(TAG, "Subscription securely verified & active: ${verificationResult.productId}")
                }
                is VerificationResult.Pending -> {
                    _subscriptionState.value = _subscriptionState.value.copy(
                        status = SubscriptionStatus.PENDING_PURCHASE,
                        purchaseToken = verificationResult.purchaseToken,
                        isVerified = false
                    )
                    Log.i(TAG, "Subscription pending payment verification.")
                }
                is VerificationResult.Failure -> {
                    Log.e(TAG, "Purchase verification failed: ${verificationResult.reason}")
                    surfaceError(BillingError.VerificationFailed)
                }
            }
        }
    }

    /**
     * Restores existing purchases from Google Play.
     */
    fun restorePurchases() {
        if (!_billingClient.isReady) {
            startConnection()
            return
        }

        val params = QueryPurchasesParams.newBuilder()
            .setProductType(BillingClient.ProductType.SUBS)
            .build()

        _billingClient.queryPurchasesAsync(params) { billingResult, purchases ->
            if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                val validPurchases = purchases.filter { purchase ->
                    purchase.products.any { it in SubscriptionProducts.ALL_SUBSCRIPTION_IDS }
                }

                if (validPurchases.isNotEmpty()) {
                    for (purchase in validPurchases) {
                        processPurchase(purchase)
                    }
                } else {
                    // Check if existing state was active and now expired
                    if (_subscriptionState.value.isPremiumActive) {
                        _subscriptionState.value = SubscriptionState(status = SubscriptionStatus.EXPIRED)
                    }
                }
            } else {
                Log.e(TAG, "Failed to query active purchases: ${billingResult.debugMessage}")
                surfaceError(BillingError.fromResponseCode(billingResult.responseCode, billingResult.debugMessage))
            }
        }
    }

    private fun surfaceError(error: BillingError) {
        coroutineScope.launch {
            _billingErrors.emit(error)
        }
    }

    fun endConnection() {
        if (_billingClient.isReady) {
            _billingClient.endConnection()
            _isConnected.value = false
        }
    }
}
