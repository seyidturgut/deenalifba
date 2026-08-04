# EAS native release

## Ownership and identifiers

- Expo login: `oliver@deen-studios.com`
- Expo organization: `deen-studios-llc-fz`
- EAS project: `@deen-studios-llc-fz/deen-studios`
- EAS project ID: `75596d6b-d032-4671-b2ea-14d4f0bde46b`
- iOS bundle identifier: `com.deenstudios.alif`
- Apple organization: `Deen Studios L.L.C-FZ`
- Apple Developer Team ID: `LCG4CPKM9M`
- Existing App Store Connect record: `Alif, The Noor Builder` (`6766198208`)
- Android application ID: `com.deenstudios.alif`
- Google Play organization: `Deen Studios LLC-FZ` (account ID `4746876897873142005`)

The Android keystore is managed by EAS under the Deen Studios project. Keep store service-account files, Apple API keys, certificates, and provisioning profiles out of Git.

## Build profiles

```bash
# Installable Android development client
npx eas-cli@latest build --platform android --profile development

# Installable iOS Simulator development client (no Apple signing required)
npx eas-cli@latest build --platform ios --profile development-simulator

# Installable team preview build
npx eas-cli@latest build --platform android --profile preview

# Store binaries: Android .aab and iOS .ipa
npx eas-cli@latest build --platform all --profile production
```

EAS manages `android.versionCode` and `ios.buildNumber` remotely. Production builds auto-increment them. The customer-facing version remains `expo.version` in `app.json`.

## OTA updates

Development, preview, and production builds use separate EAS Update channels. Publish JavaScript and asset-only changes with the matching environment:

```bash
npx eas-cli@latest update --channel preview --environment preview --message "Describe the update"
npx eas-cli@latest update --channel production --environment production --message "Describe the update"
```

Any change to native dependencies, Expo config plugins, permissions, the Expo SDK, or native configuration requires a new store binary. Do not use EAS Update to bypass store review for changes that alter the app's reviewed purpose or behavior.

## Store submission

Android requires a new app record inside the existing Deen Studios Google Play organization using package `com.deenstudios.alif`, plus service-account access for that app. This is the same Play organization that owns `Azan Time Pro – Prayer Times` (`com.mobilexsoft.ezanvakti`). The first EAS submission targets Play internal testing;

```bash
npx eas-cli@latest submit --platform android --profile production
```

iOS reuses the existing `Alif, The Noor Builder` App Store Connect record (`6766198208`) in the Deen Studios team. Its bundle ID is already `com.deenstudios.alif`, so a second record is neither needed nor compatible with that identifier. The EAS submission profile is pinned to this numeric Apple ID.

```bash
npx eas-cli@latest submit --platform ios --profile production
```

EAS Submit uploads the iOS build to App Store Connect/TestFlight. Public App Store release still requires completing metadata, privacy declarations, age rating, export compliance, screenshots, and App Review.
