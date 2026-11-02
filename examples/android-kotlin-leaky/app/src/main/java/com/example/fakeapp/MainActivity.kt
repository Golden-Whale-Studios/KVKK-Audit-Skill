package com.example.fakeapp

import android.os.Bundle
import android.util.Log
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val phone = "+90 555 000 00 00"
        Log.d("Profile", "user phone = " + phone)
    }
}
