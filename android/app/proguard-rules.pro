# Proguard rules for BatteryFlow Native Android
-keepclassmembers class * {
    @androidx.compose.runtime.Composable *;
}
-dontwarn java.lang.invoke.**
