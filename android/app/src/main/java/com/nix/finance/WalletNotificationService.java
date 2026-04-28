package com.nix.finance;

import android.app.Notification;
import android.content.Intent;
import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.util.Log;
import androidx.core.app.NotificationManagerCompat;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class WalletNotificationService extends NotificationListenerService {
    private static final String TAG = "WalletNotification";
    private static final String WALLET_PACKAGE = "com.google.android.apps.walletnfcrel";

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        if (!sbn.getPackageName().equals(WALLET_PACKAGE)) {
            return;
        }

        Notification notification = sbn.getNotification();
        Bundle extras = notification.extras;
        String title = extras.getString(Notification.EXTRA_TITLE);
        String text = extras.getString(Notification.EXTRA_TEXT);

        Log.d(TAG, "Notification received from Google Wallet: " + title + " - " + text);

        if (title != null && text != null) {
            parseAndBroadcast(title, text);
        }
    }

    private void parseAndBroadcast(String merchant, String text) {
        // Regex to find currency and amount (e.g., R$ 12,34 or $ 10.00 or 15,00 €)
        // This pattern looks for a number with decimals, optionally preceded or followed by a currency symbol
        Pattern pattern = Pattern.compile("([A-Z$€£R]+)?\\s?(\\d+[.,]\\d{2})\\s?([A-Z$€£R]+)?");
        Matcher matcher = pattern.matcher(text);

        if (matcher.find()) {
            String amountStr = matcher.group(2);
            String currency = matcher.group(1) != null ? matcher.group(1) : (matcher.group(3) != null ? matcher.group(3) : "");

            // Convert amount to numeric (handle both . and , as decimal separators)
            double amount = Double.parseDouble(amountStr.replace(",", "."));

            Log.d(TAG, "Parsed transaction: " + merchant + " - " + amount + " " + currency);

            // 1. Show a notification to the user
            showConfirmationNotification(merchant, amount, currency);

            // 2. Broadcast to the plugin (if app is running)
            Intent intent = new Intent("com.nix.finance.WALLET_TRANSACTION");
            intent.putExtra("merchant", merchant);
            intent.putExtra("amount", amount);
            intent.putExtra("currency", currency);
            sendBroadcast(intent);
        }
    }

    private void showConfirmationNotification(String merchant, double amount, String currency) {
        String channelId = "wallet_sync";
        NotificationManagerCompat notificationManager = NotificationManagerCompat.from(this);

        // Create channel for Android O+
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            android.app.NotificationChannel channel = new android.app.NotificationChannel(
                channelId, "Google Wallet Sync", android.app.NotificationManager.IMPORTANCE_HIGH);
            notificationManager.createNotificationChannel(channel);
        }

        // Intent to open app
        Intent intent = new Intent(this, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        intent.putExtra("merchant", merchant);
        intent.putExtra("amount", amount);
        intent.putExtra("currency", currency);
        intent.putExtra("from_wallet", true);

        android.app.PendingIntent pendingIntent = android.app.PendingIntent.getActivity(
            this, 0, intent, android.app.PendingIntent.FLAG_UPDATE_CURRENT | android.app.PendingIntent.FLAG_IMMUTABLE);

        Notification notification = new androidx.core.app.NotificationCompat.Builder(this, channelId)
            .setSmallIcon(android.R.drawable.ic_menu_save) // Use a better icon if available
            .setContentTitle("Nova transação detectada")
            .setContentText(merchant + ": " + currency + " " + amount)
            .setPriority(androidx.core.app.NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .build();

        notificationManager.notify(1, notification);
    }

    @Override
    public void onNotificationRemoved(StatusBarNotification sbn) {
        // Not needed for now
    }
}
