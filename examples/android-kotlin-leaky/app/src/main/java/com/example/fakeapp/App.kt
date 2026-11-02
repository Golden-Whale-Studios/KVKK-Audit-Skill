package com.example.fakeapp

import android.app.Application
import com.google.firebase.analytics.FirebaseAnalytics

class App : Application() {
    override fun onCreate() {
        super.onCreate()
        // Started immediately, no consent screen before this point.
        FirebaseAnalytics.getInstance(this).setAnalyticsCollectionEnabled(true)
    }
}
