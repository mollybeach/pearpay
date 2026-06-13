# Pear Pay — Native iMessage Extension

The thin native Swift layer for Pear Pay. Per the root README, a true iMessage
app must be native, but this layer stays intentionally minimal: it **captures
intent, authenticates with Apple Pay, and calls the TypeScript backend.** All
blockchain logic remains server-side.

## Components

| File | Responsibility |
| --- | --- |
| `MessagesViewController.swift` | `MSMessagesAppViewController` root; wires composer → Apple Pay → backend |
| `PaymentComposerView.swift` | Minimal UI to type a natural-language payment |
| `ApplePayAuthorizer.swift` | PassKit biometric authorization of intent |
| `PearPayBackend.swift` | HTTP client for `POST /api/payments` |
| `SenderWalletProvider.swift` | Reads a verified sender wallet from app config or user defaults |
| `PearPay.xcodeproj` | Host app plus `PearPayMessages` iMessage extension target |

## Flow

```
User types "Send Molly $20"
  → PaymentComposerView captures the message
  → ApplePayAuthorizer confirms via Face ID / Touch ID
  → PearPayBackend POSTs to pearpay.app/api/payments
  → backend resolves, routes, settles, and returns a summary
  → summary inserted as an iMessage bubble
```

## Building

Open `PearPay.xcodeproj`, set a development team, keep the Apple Pay merchant
identifier as `merchant.app.pearpay`, and run the `PearPay` host app on a device
or Simulator. The Simulator path bypasses the Apple Pay sheet so the composer can
be exercised without a physical card.

Before sending real funds, configure `PearPayBackendURL` and a verified
`PearPaySenderWalletAddress` in the extension `Info.plist`, or store the address
through `SenderWalletProvider.storeWalletAddress(_:)` after wallet onboarding.
The extension refuses to call the backend without a valid sender wallet.
