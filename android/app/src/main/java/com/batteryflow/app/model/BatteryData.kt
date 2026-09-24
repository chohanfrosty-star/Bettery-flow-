package com.batteryflow.app.model

enum class BatteryStatus {
    CHARGING,
    DISCHARGING,
    FULL,
    NOT_CHARGING,
    UNKNOWN
}

enum class PluggedSource {
    AC,
    USB,
    WIRELESS,
    NONE
}

enum class BatteryHealth {
    GOOD,
    OVERHEAT,
    DEAD,
    OVER_VOLTAGE,
    UNSPECIFIED_FAILURE,
    COLD,
    UNKNOWN
}

enum class AccentColor(val title: String, val hex: Long) {
    MINT("Mint", 0xFF10B981),
    CYAN("Cyan", 0xFF00D2FF),
    AMBER("Amber", 0xFFF59E0B),
    SKY("Sky", 0xFF0EA5E9)
}

enum class SoundProfile(val title: String, val description: String, val tag: String) {
    MINIMAL("Minimal", "Clean, subtle dual-tone sine chime", "Subtle"),
    TECHNICAL("Technical", "High-frequency cyber telemetry chirp", "Cyber HUD"),
    ANALOG("Analog", "Warm resonant acoustic vintage bell", "Resonant")
}

data class BatteryReading(
    val level: Int = 100,
    val isCharging: Boolean = false,
    val status: BatteryStatus = BatteryStatus.DISCHARGING,
    val pluggedSource: PluggedSource = PluggedSource.NONE,
    val voltageV: Float? = null,
    val temperatureC: Float? = null,
    val currentMa: Int? = null,
    val powerW: Float? = null,
    val health: BatteryHealth = BatteryHealth.GOOD,
    val technology: String? = null,
    val capacityMah: Int? = null,
    val chargeTimeRemainingSec: Long? = null,
    val timestamp: Long = System.currentTimeMillis()
)

data class AppSettings(
    val accentColor: AccentColor = AccentColor.MINT,
    val soundProfile: SoundProfile = SoundProfile.MINIMAL,
    val tempUnitFahrenheit: Boolean = false,
    val lowBatteryThreshold: Int = 20,
    val criticalBatteryThreshold: Int = 10,
    val batteryGuardianEnabled: Boolean = true,
    val amoledMode: Boolean = false
)
