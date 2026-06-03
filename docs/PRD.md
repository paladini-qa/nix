# 📄 Product Requirements Document (PRD): Nix Finance

## 1. Product Overview

**Nix Finance** is a modern personal finance management application with intelligent analytics powered by Gemini AI. It is designed to offer a complete and intuitive financial control experience across web and mobile platforms.

---

## 2. Roadmap for Feature Documentation
We will co-create and refine this document epic by epic before writing code:
* **[COMPLETE] Epic 1: Financial Management** (Dashboard, Transactions, Recurring/Installments, Hybrid Splits)
* **[COMPLETE] Epic 2: Organization & Categorization** (Accounts & Credit Cards, Custom tags, Auto-categorization)
* **[COMPLETE] Epic 3: Planning & Analytics** (Savings Goals, Statement-based Reporting)
* **[COMPLETE] Epic 4: Artificial Intelligence** (Nix Chatbot secure context, Multimodal Smart Input Draft Card)
* **[COMPLETE] Epic 5: Automated Capture** (Google Wallet Interceptor & Draft Alerts)

---

## 3. Premium Design System & UI/UX Guidelines

Nix Finance features a highly aesthetic, responsive user interface inspired by **Nubank's** clean layout and dynamic interactions, utilizing a luxurious dynamic color palette.

![Nix Premium Responsive Mockup](file:///home/paladiini/projects/finance-manager/docs/lumis_responsive_ui_mockup.png)

### 3.1 Dynamic Color Tokens
To guarantee AA contrast accessibility and maximum luxury appeal:
* **Gold Highlights (Accent):**
  * *Dark Mode Accent:* `#E6C687` (Glowing warm honey-gold)
  * *Light Mode Accent:* `#AA7C11` (Deep luxury bronze-gold for accessibility compliance)
* **Backgrounds:**
  * *Obsidian Dark Theme:* `#08090A` (Deep velvet black) with card overlays at `#131416`
  * *Ivory Light Theme:* `#F9FAFB` (Soft linen white) with card overlays at `#FFFFFF`
* **Text Contrast:**
  * *Dark Mode Primary:* `#F3F4F6` (Cool gray-50) | Secondary: `#9CA3AF` (Gray-400)
  * *Light Mode Primary:* `#111827` (Slate-900) | Secondary: `#4B5563` (Gray-600)

### 3.2 UI Layout Patterns (Nubank-Inspired)
* **frosted glass balance Card:** The top of the dashboard displays a unified glassmorphic card showing the Primary Balance, containing a toggle eye icon for "Privacy Mode" to blur the digits instantly.
* **Quick Actions Row:** A horizontal, swipeable carousel containing circular outline buttons (Transfer, Log transaction, Pay card, Goals) with spring scale-up micro-interactions on tap.
* **Navigation Bar:** A clean, bottom-anchored custom floating tab bar with a minimalist visual footprint.

### 3.3 Currency & Localization Rules (BRL Reais)
* Nix features a strictly **English interface** (all headings, buttons, notifications, and AI chatbot chats).
* However, all financial and monetary values are displayed and formatted using the **Brazilian Real (BRL - R$)** standard:
  * **Prefix:** `R$ ` (with a trailing space before figures).
  * **Decimal Separator:** Comma `,` for cents (e.g. `,72`).
  * **Thousands Separator:** Dot `.` (e.g. `18.450`).
  * *Example Layout:* `R$ 18.450,72` instead of `$18,450.72`.

---

## 4. Epic 1: Financial Management & Transactions

### 4.1 The Dashboard Hub
* **Description:** A premium, interactive home screen showing financial summaries, balance forecasts, dynamic charts, and active subscriptions.
* **User Stories:**
  * As a user, I want to see my net monthly balance, total income, and total expenses dynamically updated.
  * As a user, I want a visual projection of my end-of-month balance based on recurring transactions.
  * As a user, I want the dashboard aggregates and reports to automatically calculate credit card transactions inside their respective **statement month** instead of literal purchase date (so that if I buy something after the card's closing date, it correctly shows in next month's statement).
  * As a user, I want a toggleable "Privacy Mode" to blur all financial figures with a glassmorphic overlay.
* **UI/UX Flow & Reanimated Animations:**
  * **Card Hover/Press:** High-fidelity 3D tilt effects using `react-native-reanimated` when tapping balance cards.
  * **Privacy Blur:** Dynamic canvas filter or overlay that transitions with a 200ms ease-in-out opacity and blur-radius curve.
* **State & Data Transitions:**
  * Pulls from Zustand cash-store, merging local transaction caches with real-time Supabase fetches.
  * Displays the single, consolidated **Primary Balance** (representing all liquid checking, savings, and cash consolidated).
  * Filters and groups card transactions dynamically based on their calculated `statement_month` rather than literal calendar date to show active card statement commitments.
  * **Offline Sync & Caching**: Tracks network connection state. When offline, displays cached balances, transactions, and goals instantly from local MMKV storage via Zustand Persist. Disables transaction write forms and AI features, presenting a friendly notice toast explaining that an internet connection is required to log changes.

### 4.2 Core Transactions (CRUD)
* **Description:** Quick entry, editing, and deletion of standard cash flows.
* **User Stories:**
  * As a user, I want to log a transaction with an amount, category, date, payment method (debit/credit card), notes, and payment status (`isPaid`).
  * As a user, I want to filter and search transaction lists by dates, categories, and payment methods.
* **Edge Cases & Error Handling:**
  * **Future-Dated Entries:** Transactions scheduled for the future should be flagged as pending and not calculated in the *current* active balance, but factored into the end-of-month forecast.
  * **Negative Values:** Prevent entering negative numbers for amounts; transaction type (Income vs. Expense) is determined explicitly by a toggle.
  * **Statement Month Boundary Formula:**
    * When registering a transaction, `statement_month` is calculated instantly:
      * **Cash/Debit**: `statement_month = transaction_date` (same month/year).
      * **Credit Card**:
        * If `transaction_date.day >= card.closure_day`, then `statement_month = transaction_date.month + 1`.
        * Else, `statement_month = transaction_date.month`.
      * *Note: Year rollover is handled automatically if month addition exceeds 12.*

### 4.3 Complex Transactions: Recurring & Installments
* **Description:** Tracking monthly/yearly subscriptions and installment-based purchases.
* **User Stories:**
  * As a user, I want to log a purchase split into $N$ monthly installments (e.g., "R$ 300 split in 3 installments of R$ 100").
  * As a user, I want to log a recurring monthly expense (e.g., Netflix subscription) and have the option to edit "This instance only", "All future instances", or "All instances".
* **State & Data Transitions:**
  * **Installments Schema:** Handled via a single parent transaction with an `installment_id`, `total_installments`, and auto-generated child rows for each month marked with `installment_number` (e.g., `1/3`, `2/3`, `3/3`).
  * **Recurring Editing Logic:**
    * *This instance only:* Creates an exception entry in a `transaction_exceptions` table or detaches the row from the recurring series.
    * *All future instances:* Updates the base pattern and applies changes to all unpaid/future occurrences.

### 4.4 Hybrid Shared Expenses
* **Description:** 50/50 expense splitting with registered or unregistered friends.
* **User Stories:**
  * As a user, I want to split a transaction 50/50 with a friend by typing their name (local-only tracker).
  * As a user, I want to link a local-only friend to a registered Nix user so that debts are synced automatically in real-time.
* **UI/UX Flow:**
  * A "Split Expense" slider in the transaction creation modal. Dragging it right opens a list of friends with a dynamic "You owe / They owe" visual badge.
* **State & Data Transitions:**
  * **Local Mode:** Inserts a row in the `debts` table with the friend's name and `linked_user_id = NULL`.
  * **Synced Mode:** Sets `linked_user_id = friend_auth_id`. Supabase triggers automatically create a pending credit transaction on the friend's account.

---

## 5. Epic 2: Organization & Categorization

### 5.1 Payment Methods & Unified Cash Balance
* **Description:** A screen allowing users to view and update their single unified liquid cash balance and manage their multiple credit cards and debit payment methods.
* **User Stories:**
  * As a user, I want to view my overall checking/debit balance (Primary Balance) as a single liquid pocket amount and edit it.
  * As a user, I want to add/edit/delete payment methods of type `debit` or `credit` with custom icons, colors, names, and limits.
  * As a user, I want to set a **Closure Day** (e.g., 10th of the month) and a **Due Day** (e.g., 20th of the month) specifically for Credit Card payment methods.
  * As a user, I want to see active statement details and dynamic billing cycles for each credit card.
* **UI/UX Flow & Animations:**
  * **Unified Summary Card:** The top displays a glowing, glassmorphic HSL card showing the single liquid "Primary Balance". Tapping on it slides open an edit panel.
  * **Visual Credit Card Mockup:** Displays editable digital credit cards on the screen with three luxurious pre-built styles (Noir Reserve, Gold, and Platinum). Users can tap a card to trigger a custom 3D card flip, showing its Closure day, Due day, credit limit, and current statement balance on the back.
* **State & Data Transitions / Calculations:**
  * **Unified Primary Balance**: Represents overall liquid funds ($CurrentPrimary = InitialPrimary + \sum DebitIncomes - \sum DebitExpenses - \sum CreditBillsPaid$).
  * **Credit Card Statement Balance**: Represents the accumulated charges for each card ($StatementTotal = \sum CreditExpenses \text{ in } statement\_month$).
  * **Statement Date Calculations**:
    * Any transaction linked to a credit card is automatically assigned a calculated `statement_month` using the boundary formula.
    * This allows the reporting layer to easily run queries like:
      `SELECT sum(amount) FROM transactions WHERE payment_method_id = :id AND statement_month = :target_month`

### 5.2 Categories, Tags, and Auto-Categorization
* **Description:** A system that turns categories into first-class database entities, enabling users to fully customize their taxonomy and automatically map incoming transactions.
* **User Stories:**
  * As a user, I want to create, read, update, and delete (CRUD) custom categories with personalized HSL colors and distinctive icons.
  * As a user, I want to create custom transaction tags to group special activities (e.g. #vacation2026).
  * As a user, I want to define auto-categorization rules (e.g., "Any transaction containing the description 'Uber' should automatically map to the 'Transport' category").
* **UI/UX Flow & Animations:**
  * **Category Customizer Palette:** An HSL slider and dynamic icon picker panel that animates a preview card in real-time with smooth spring physics when adding or editing categories.
* **Edge Cases & Error Handling:**
  * **Rule Collisions:** If a transaction description matches multiple rules, apply the most recently created rule or let the user choose in an undo-popup.
  * **Cascade Updates:** When creating a new auto-categorize rule, ask the user: *"Do you want to apply this retroactively to all past transactions?"*

---

## 6. Epic 3: Planning & Analytics

### 6.1 Savings Goals
* **Description:** Savings objectives (e.g. emergency fund, vacation) with custom deadlines and progress tracking.
* **User Stories:**
  * As a user, I want to create a savings goal with a target amount, deadline, custom icon, and color.
  * As a user, I want to manually contribute funds to a savings goal (transferring money from an account balance into the goal).
  * As a user, I want a visual progress indicator showing the percentage completed and estimated time remaining.
* **UI/UX Flow & Animations:**
  * **Savings Tank Animation:** A gorgeous circular fluid progress bar powered by `react-native-reanimated`. When contributing funds, a subtle wave/fluid animation fills the tank dynamically.
* **State & Data Transitions:**
  * Transferring funds to a goal inserts a transaction of type `'transfer'` that reduces the unified `primary_balance` and increases the goal's `current_savings`.

### 6.2 Statement-Based Reporting & Analytics (Clear Vision)
* **Description:** Total visibility of spending distributions and cash flow cycles, grouping credit transactions strictly by their due month and allowing cross-dimensional analysis.
* **User Stories:**
  * As a user, I want to see a donut chart breakdown of my expenditures by category for any selected month.
  * As a user, I want to cross-analyze transactions by category and payment method (e.g., tap a category to see which cards paid for it, or filter the category spending donut by a specific payment method).
  * As a user, I want a Year-over-Year (YoY) comparison of my monthly cash inflows vs. credit card statement outflows.
  * As a user, I want to filter charts by specific payment methods (e.g., viewing spending *only* on a specific credit card vs overall debit purchases).
  * As a user, I want to export a clean Monthly Statement report in CSV or PDF.
* **UI/UX Flow & Animations:**
  * **Interactive Donut Chart:** Built using Victory Native. Tapping a category slice scale-animates the slice outwards and filters/highlights the corresponding transaction list below.
  * **Cross-Dimensional Drill-Down:** Double-tapping a category slice performs a smooth 3D card flip animation, transforming the donut chart into a payment-method distribution chart for that specific category.
* **Calculation Rules:**
  * Queries for reports must filter transaction dates of credit cards using their calculated `statement_month` to guarantee transactions post-closure fall into the correct cycle.
  * Database queries leverage category foreign keys to enable join-based aggregations:
    `SELECT category_id, payment_method_id, sum(amount) FROM transactions WHERE statement_month = :target_month GROUP BY category_id, payment_method_id`

---

## 7. Epic 4: Artificial Intelligence

### 7.1 Nix AI Chatbot (Financial Co-Pilot)
* **Description:** A highly secure, conversational co-pilot that helps users gain profound financial visibility based on their financial data.
* **User Stories:**
  * As a user, I want to ask natural language questions about my spending habits (e.g. *"How much did I spend on restaurants this month vs. last month?"*).
  * As a user, I want to ask projection-based questions (e.g. *"If I buy a new phone for R$ 8.000, how does that affect my July credit card statement and checking liquidity?"*).
* **AI Context Pipeline (Security & Privacy):**
  * Conversations are handled via a Supabase Edge Function.
  * The Edge Function validates the user's auth token, then securely queries and aggregates the user's data to feed into the Gemini prompt:
    * **Sanitized Financial Status:** Single `primary_balance` total, lists of payment methods, and current active statement totals for credit cards (e.g., Primary Balance: R$ 1.250,00, Visa card July statement current total: R$ 300,00).
    * **Categorized Spending Summary:** Aggregated totals by category for the current and previous statement month.
    * **Goals Progress:** Active savings goals and progress.
    * **Strict Sanitization**: Raw database IDs, full account numbers, and email credentials are completely stripped before packaging the context.
  * The Edge Function streams the response back to the client using SSE (Server-Sent Events) for a seamless conversational feel.

### 7.2 Multimodal Smart Input (Receipts & Voice)
* **Description:** Swift, frictionless transaction entry using mobile voice recordings or receipt photos, parsed into editable drafts.
* **User Stories:**
  * As a user, I want to take a picture of a receipt, see a loading skeleton, and then review a beautiful pre-populated **Draft Review Card** before saving it.
  * As a user, I want to speak directly to the app (e.g., *"Spent R$ 50 on groceries at Whole Foods using credit card"*), and see it parsed into a **Draft Review Card** for confirmation.
* **UI/UX Flow & Animations:**
  * **Voice Pulse Active State:** Holding the mic button scales the microphone icon up and starts a glowing, circular waves pulse animation using React Native Reanimated.
  * **Draft Card Slide-up:** Once Gemini returns the JSON payload, a beautifully styled glassmorphic **Draft Review Card** slides up from the bottom of the screen with a spring-bounce effect.
  * **Confirmation Animation:** Tapping "Confirm Log" triggers a confetti splash or custom checkmark transition, and the card slides out to the right.
* **Payload Structure & Handling:**
  * The Supabase Edge Function takes base64-encoded files (audio or image), forwards them to Gemini 2.5 Flash, and enforces a strict structured JSON response:
    ```json
    {
      "amount": 50.00,
      "date": "2026-05-26",
      "description": "Whole Foods",
      "category": "Groceries",
      "payment_method_suggested": "credit",
      "notes": "Voice/receipt input parse"
    }
    ```
  * The client receives this JSON, maps it to the UI form, allows user adjustments, and inserts it into the Supabase `transactions` table upon user confirmation.

---

## 8. Epic 5: Automated Capture (Google Wallet Interceptor)

### 8.1 Google Wallet Interceptor & Notification Service
* **Description:** A native Android background service (`NotificationListenerService`) that intercepts transaction notifications from Google Wallet (or Google Play Services) to instantly prompt the user to log them into Nix.
* **User Stories:**
  * As a user, I want the Nix app to catch transactions from my Google Wallet notifications in real-time.
  * As a user, I want to receive a high-priority local Nix notification immediately after a Google Wallet transaction, asking me to review and save it.
  * As a user, I want to tap the notification and be taken directly to a pre-filled **Draft Review Card** in the app.
  * As a user, I want a settings toggle under my profile to easily enable or disable this Google Wallet notification interceptor.
* **Technical Architecture (Android Native Bridge):**
  * **Native Service:** A custom Android package listener listening to system notifications.
  * **Package Filters:** Filter specifically for notifications originating from `com.google.android.apps.walletnfcrel`, `com.google.android.apps.wallet`, and `com.google.android.gms` (Google Play Services, which often issues Google Pay/Wallet transaction notifications).
  * **Permission Gate:** Android requires `android.permission.BIND_NOTIFICATION_LISTENER_SERVICE`. The app will guide the user to their device's "Notification Access" settings screen to toggle access for Nix.
  * **iOS Sandboxing Clarification:** On iOS, due to Apple’s strict app sandboxing rules, third-party apps cannot access notifications from Apple Wallet, Google Wallet, or other apps. Thus, this automated intercept feature is **Android-only**. For iOS users, Nix provides fallback support via fast Multimodal Smart Input (Receipt photo / Voice memo capture) and manual entry.
* **Notification Processing & Regex Engine:**
  * When a target notification is intercepted, the service extracts the Title and Text contents.
  * An optimized local regex engine parses standard Google Wallet BRL notification strings:
    * *Example Notification:* `"R$ 29,90 paid at Starbucks"` or `"Compra de R$ 120,50 no Pão de Açúcar com Mastercard"`
    * **Regex Pattern 1 (Amount):** `R$\s*([0-9\.\,]+)` -> Parsed and formatted to numeric float.
    * **Regex Pattern 2 (Merchant):** `(?:at|no|na|em)\s+([^,\.\n\-\_]+)` -> Extracts the merchant name, stripping excess words.
    * **Timestamp:** Extracted from the notification's post time.
* **UI/UX Flow & Animations:**
  * **System Notification Tap:** Tapping the intercepted push notification opens the app and routes directly via Expo Router to a modal overlay.
  * **Draft Review Card Slide-up:** A beautiful glassmorphic review card slides up from the bottom of the screen with a spring-bounce effect (`damping: 12`, `stiffness: 110`). The card is pre-filled with the parsed Merchant, Amount (formatted in BRL), Date, and suggests the Category (via Auto-Categorization rule matches) and the Payment Method (if the card name was identified in the notification text).
  * **Slide-away on Confirm:** Tapping "Confirm" triggers a premium champagne-gold checkmark animation, saves the transaction to Supabase, updates the `primary_balance`, and slides the card out of the screen.
* **State & Data Transitions / Calculations:**
  * Saves locally to a Zustand draft queue (`walletDrafts: []`) for offline resilience.
  * Once the user reviews and confirms, it performs the standard transactional flow:
    * If linked to a `credit` card, calculates `statement_month` using the boundary formula.
    * If linked to a `debit` card, deducts the amount from the unified `primary_balance`.
* **Edge Cases & Error Handling:**
  * **Double Interception:** Prevent duplicate entries if Google Wallet sends multiple notifications for a single transaction (e.g. authorization followed by capture) by deduplicating notifications with identical merchant names and amounts within a 60-second window.
  * **Incorrect Parsing Fallback:** If regex parsing fails to extract the amount or merchant reliably, the local notification is still shown but labeled as `"New wallet transaction detected. Tap to input details."`, opening a blank Draft Review Card for manual input.
  * **Notification Permissions Revoked:** If the user revokes "Notification Access" in Android system settings, the app gracefully disables the setting, sets `enable_wallet_interceptor = false` in the database, and displays a subtle banner on the profile screen to re-enable it.

---

## 9. Technical Architecture 🛠️

The project utilizes a 4-tier Clean Architecture (Domain, Application, Infrastructure, Presentation).

* **Frontend / Mobile Framework:** Expo (React Native & React Native Web) with TypeScript 5.8+.
* **UI & Styling:** NativeWind (Tailwind CSS for React Native), React Native Reanimated (premium micro-animations), and Victory Native (cross-platform interactive charts).
* **State & Sync:** Zustand (with persist for local caching) and TanStack React Query. Features offline read-caching (instant local boot and viewing of last-fetched data) while enforcing online-only writes for transactional and AI operations to secure data integrity.
* **Backend & Auth:** Supabase (PostgreSQL, Supabase Auth with Row Level Security, Supabase Storage for receipts/voice notes, and Edge Functions).
* **AI Backend Engine:** Secure Supabase Edge Functions hosting the Gemini API key, using `@google/genai` SDK for multimodal parsing (receipt image/voice audio) and chatbot processing.

## 10. Data Schema 🗄️

Key tables in the Supabase instance:

* `payment_methods`: Details for different cards and payment modes (id, user_id, name, type ['debit', 'credit'], closure_day [for credit], due_day [for credit], icon, color).
* `categories`: First-class user-created categories (id, user_id, name, color, icon).
* `transactions`: Core details (id, user_id, payment_method_id, category_id, amount, date, description, payment_status, is_recurring, installment_id, statement_month).
* `user_settings`: User configuration, custom preferences (theme, friends list, `enable_wallet_interceptor` toggle), and the user's single `primary_balance` (liquid checking balance).
* `goals`: Target savings objectives (saving progress subtracts from the primary balance when contributed).
* `tags`: Custom labels linking to transactions.

## 11. Deployment & CI/CD Pipeline 🚀

Nix Finance utilizes a completely automated, self-contained GitHub Actions pipeline to handle private web deployment and native Android compilation.

### Web Deployment (GitHub Pages)
* **Trigger:** Every push to the `main` branch.
* **Flow:**
  * Sets up Node.js, installs project dependencies.
  * Injects Supabase environment variables from GitHub Secrets (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`).
  * Runs `npx expo export --platform web` to compile a highly optimized, responsive static web application in the `dist/` directory.
  * Automatically deploys the static assets directly to **GitHub Pages** (hosting the private or public URL).

### Android APK Compilation (GitHub Actions & Gradle)
* **Trigger:** Creation of a git tag (e.g., `v*`) or manual execution (workflow_dispatch).
* **Flow:**
  * Installs Node.js, Java JDK 17, and Android SDK command-line tools.
  * Runs `npx expo prebuild --platform android` to generate the native Android gradle project.
  * Decodes a signing keystore stored securely as a Base64-encoded GitHub Secret (`ANDROID_SIGNING_KEY`).
  * Navigates to the `android/` directory and executes `./gradlew assembleRelease` to compile a signed, high-performance release APK (`app-release.apk`).
  * Automatically creates a new **GitHub Release** tagged with the build identifier, attaching the compiled `app-release.apk` as a downloadable asset.
  * **Access:** The user can instantly download and install the APK directly onto their Android phone by browsing their private repository's Releases page.

### Database Schema Migration (Supabase CLI)
* **Trigger:** Every push or merge to the `main` branch.
* **Flow:**
  * Uses the `supabase/setup-cli` GitHub Action to install the Supabase CLI.
  * Connects directly to the production instance using the database connection URL stored in `secrets.SUPABASE_DB_URL`.
  * Executes `supabase db push` to analyze, execute, and record new SQL migration scripts chronologically.
  * **Result:** Production database schemas are automatically updated and kept in sync with the codebase without any manual script execution.
