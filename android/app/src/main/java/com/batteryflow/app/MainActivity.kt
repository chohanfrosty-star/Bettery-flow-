package com.batteryflow.app

import android.annotation.SuppressLint
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.BatteryManager
import android.os.Build
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.viewinterop.AndroidView
import com.batteryflow.app.billing.SubscriptionManager
import com.batteryflow.app.ui.billing.PremiumPaywallScreen

class MainActivity : ComponentActivity() {

    private lateinit var subscriptionManager: SubscriptionManager
    private var webView: WebView? = null

    // Real hardware metrics cached from Android BatteryManager
    private var cachedBatteryLevel: Float = 100f
    private var cachedIsCharging: Boolean = false
    private var cachedVoltageV: Float = 4.0f
    private var cachedTempC: Float = 28.0f
    private var cachedChargerType: String = "Unplugged"

    private val batteryReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            intent?.let {
                val level = it.getIntExtra(BatteryManager.EXTRA_LEVEL, -1)
                val scale = it.getIntExtra(BatteryManager.EXTRA_SCALE, -1)
                if (level >= 0 && scale > 0) {
                    cachedBatteryLevel = (level.toFloat() / scale.toFloat()) * 100f
                }

                val status = it.getIntExtra(BatteryManager.EXTRA_STATUS, -1)
                cachedIsCharging = status == BatteryManager.BATTERY_STATUS_CHARGING ||
                        status == BatteryManager.BATTERY_STATUS_FULL

                val plugged = it.getIntExtra(BatteryManager.EXTRA_PLUGGED, 0)
                cachedChargerType = when (plugged) {
                    BatteryManager.BATTERY_PLUGGED_AC -> "AC Fast Charger"
                    BatteryManager.BATTERY_PLUGGED_USB -> "USB-C PD"
                    BatteryManager.BATTERY_PLUGGED_WIRELESS -> "Wireless Qi"
                    else -> "Unplugged"
                }

                val voltage = it.getIntExtra(BatteryManager.EXTRA_VOLTAGE, -1)
                if (voltage > 0) {
                    cachedVoltageV = voltage / 1000f
                }

                val temp = it.getIntExtra(BatteryManager.EXTRA_TEMPERATURE, -1)
                if (temp > 0) {
                    cachedTempC = temp / 10f
                }
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)

        subscriptionManager = SubscriptionManager.getInstance(this)
        registerReceiver(batteryReceiver, IntentFilter(Intent.ACTION_BATTERY_CHANGED))

        setContent {
            var showPaywall by remember { mutableStateOf(false) }

            // Android Hardware Back Gesture & Button Handler
            DisposableEffect(showPaywall) {
                val callback = object : OnBackPressedCallback(true) {
                    override fun handleOnBackPressed() {
                        if (showPaywall) {
                            showPaywall = false
                        } else if (webView?.canGoBack() == true) {
                            webView?.goBack()
                        } else {
                            isEnabled = false
                            onBackPressedDispatcher.onBackPressed()
                        }
                    }
                }
                onBackPressedDispatcher.addCallback(callback)
                onDispose { callback.remove() }
            }

            MaterialTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = Color(0xFF0C0E12)
                ) {
                    if (showPaywall) {
                        PremiumPaywallScreen(
                            onDismiss = { showPaywall = false }
                        )
                    } else {
                        AndroidView(
                            modifier = Modifier.fillMaxSize(),
                            factory = { ctx ->
                                WebView(ctx).apply {
                                    webView = this
                                    setupWebView(this) {
                                        showPaywall = true
                                    }
                                    loadUrl("file:///android_asset/dist/index.html")
                                }
                            }
                        )
                    }
                }
            }
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView(view: WebView, onOpenPaywallRequested: () -> Unit) {
        view.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            setSupportZoom(false)
            builtInZoomControls = false
            displayZoomControls = false
            useWideViewPort = true
            loadWithOverviewMode = true
            allowFileAccess = true
            mediaPlaybackRequiresUserGesture = false
            cacheMode = WebSettings.LOAD_DEFAULT
        }

        view.setBackgroundColor(android.graphics.Color.parseColor("#0C0E12"))
        view.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                return false
            }
        }
        view.webChromeClient = WebChromeClient()

        // Injected Native Android Javascript Bridge
        view.addJavascriptInterface(object {
            @JavascriptInterface
            fun getBatteryLevel(): Float = cachedBatteryLevel

            @JavascriptInterface
            fun isCharging(): Boolean = cachedIsCharging

            @JavascriptInterface
            fun getBatteryTemperature(): Float = cachedTempC

            @JavascriptInterface
            fun getBatteryVoltage(): Float = cachedVoltageV

            @JavascriptInterface
            fun getChargerType(): String = cachedChargerType

            @JavascriptInterface
            fun openNativePaywall() {
                runOnUiThread {
                    onOpenPaywallRequested()
                }
            }

            @JavascriptInterface
            fun vibrate(ms: Long) {
                val vibrator = getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator?.vibrate(VibrationEffect.createOneShot(ms, VibrationEffect.DEFAULT_AMPLITUDE))
                } else {
                    @Suppress("DEPRECATION")
                    vibrator?.vibrate(ms)
                }
            }
        }, "AndroidNative")
    }

    override fun onDestroy() {
        super.onDestroy()
        try {
            unregisterReceiver(batteryReceiver)
        } catch (_: Exception) {}
        webView?.destroy()
        webView = null
    }
}
