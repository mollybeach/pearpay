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

Open the Pear Pay Xcode project, select the `PearPayMessages` iMessage extension
target, set your Apple Pay merchant identifier (`merchant.app.pearpay`), and run
on a device with Apple Pay configured.
