package com.opentrackerfi.app;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;
import android.os.SystemClock;
import android.widget.Toast;
import androidx.activity.OnBackPressedCallback;
import androidx.core.splashscreen.SplashScreen;

public class MainActivity extends BridgeActivity {
    private long lastExitPress = 0;
    private Toast exitToast;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        SplashScreen splash = SplashScreen.installSplashScreen(this);
        long launchTime = SystemClock.elapsedRealtime();
        super.onCreate(savedInstanceState);
        splash.setKeepOnScreenCondition(() ->
            SystemClock.elapsedRealtime() - launchTime < 3000 &&
            getBridge() != null && getBridge().getWebView() != null &&
            getBridge().getWebView().getProgress() < 100
        );
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (getBridge() == null || getBridge().getWebView() == null) {
                    requestExit();
                    return;
                }
                getBridge().getWebView().evaluateJavascript(
                    "!window.dispatchEvent(new Event('opentracker-back', {cancelable: true}))",
                    handled -> {
                        if ("true".equals(handled)) {
                            lastExitPress = 0;
                            if (exitToast != null) exitToast.cancel();
                        } else {
                            requestExit();
                        }
                    }
                );
            }
        });
    }

    private void requestExit() {
        long now = SystemClock.elapsedRealtime();
        if (lastExitPress != 0 && now - lastExitPress <= 2000) {
            if (exitToast != null) exitToast.cancel();
            finish();
        } else {
            lastExitPress = now;
            if (exitToast != null) exitToast.cancel();
            exitToast = Toast.makeText(this, "Press back again to exit", Toast.LENGTH_SHORT);
            exitToast.show();
        }
    }

    @Override
    public void onPause() {
        lastExitPress = 0;
        if (exitToast != null) exitToast.cancel();
        super.onPause();
    }
}
