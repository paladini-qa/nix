package com.nix.finance;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.provider.Settings;
import android.text.TextUtils;
import androidx.core.app.NotificationManagerCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "WalletNotification")
public class WalletNotificationPlugin extends Plugin {

    private BroadcastReceiver receiver;

    @Override
    public void load() {
        receiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if ("com.nix.finance.WALLET_TRANSACTION".equals(intent.getAction())) {
                    sendTransactionToWeb(
                        intent.getStringExtra("merchant"),
                        intent.getDoubleExtra("amount", 0.0),
                        intent.getStringExtra("currency")
                    );
                }
            }
        };

        IntentFilter filter = new IntentFilter("com.nix.finance.WALLET_TRANSACTION");
        getContext().registerReceiver(receiver, filter);

        // Check if app was opened from a notification
        Intent intent = getActivity().getIntent();
        if (intent.getBooleanExtra("from_wallet", false)) {
            sendTransactionToWeb(
                intent.getStringExtra("merchant"),
                intent.getDoubleExtra("amount", 0.0),
                intent.getStringExtra("currency")
            );
        }
    }

    @Override
    protected void handleOnNewIntent(Intent intent) {
        super.handleOnNewIntent(intent);
        if (intent.getBooleanExtra("from_wallet", false)) {
            sendTransactionToWeb(
                intent.getStringExtra("merchant"),
                intent.getDoubleExtra("amount", 0.0),
                intent.getStringExtra("currency")
            );
        }
    }

    private void sendTransactionToWeb(String merchant, double amount, String currency) {
        JSObject ret = new JSObject();
        ret.put("merchant", merchant);
        ret.put("amount", amount);
        ret.put("currency", currency);
        notifyListeners("walletTransaction", ret);
    }

    @PluginMethod
    public void checkNotificationAccess(PluginCall call) {
        boolean isEnabled = isNotificationServiceEnabled();
        JSObject ret = new JSObject();
        ret.put("enabled", isEnabled);
        call.resolve(ret);
    }

    @PluginMethod
    public void requestNotificationAccess(PluginCall call) {
        Intent intent = new Intent("android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS");
        getContext().startActivity(intent);
        call.resolve();
    }

    private boolean isNotificationServiceEnabled() {
        String pkgName = getContext().getPackageName();
        final String flat = Settings.Secure.getString(getContext().getContentResolver(), "enabled_notification_listeners");
        if (!TextUtils.isEmpty(flat)) {
            final String[] names = flat.split(":");
            for (String name : names) {
                if (name.contains(pkgName)) {
                    return true;
                }
            }
        }
        return false;
    }
}
