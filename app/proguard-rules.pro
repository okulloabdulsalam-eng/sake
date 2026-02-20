# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Keep JavaScript interface for WebView
-keepclassmembers class com.kiuma.app.WebAppInterface {
   public *;
}

# Keep WebView JavaScript interface annotation
-keepattributes JavascriptInterface

# Keep WebView classes
-keep class android.webkit.** { *; }
-keep class androidx.webkit.** { *; }

# Keep Kotlin coroutines
-keepnames class kotlinx.coroutines.internal.MainDispatcherFactory {}
-keepnames class kotlinx.coroutines.CoroutineExceptionHandler {}

# Keep line numbers for debugging
-keepattributes SourceFile,LineNumberTable

# Hide original source file name
-renamesourcefileattribute SourceFile

# Keep application classes
-keep class com.kiuma.app.** { *; }

# Keep Material Design components
-keep class com.google.android.material.** { *; }