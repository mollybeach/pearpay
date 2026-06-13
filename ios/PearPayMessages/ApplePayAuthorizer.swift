import PassKit

/// Wraps Apple Pay authorization via PassKit.
///
/// Pear Pay uses Apple Pay only to authenticate and authorize the user's intent
/// to send. The actual value transfer settles in USDC server-side; Apple Pay is
/// the trusted, biometric confirmation step Apple requires.
enum ApplePayAuthorizer {
    /// Present an Apple Pay sheet for the given display amount. Calls back with
    /// whether the user authorized the payment.
    static func authorize(
        amount: String,
        completion: @escaping (Bool) -> Void
    ) {
        #if targetEnvironment(simulator)
        completion(true)
        return
        #endif

        guard PKPaymentAuthorizationController.canMakePayments() else {
            completion(false)
            return
        }

        let request = PKPaymentRequest()
        request.merchantIdentifier = "merchant.app.pearpay"
        request.supportedNetworks = [.visa, .masterCard, .amex]
        request.merchantCapabilities = .threeDSecure
        request.countryCode = "US"
        request.currencyCode = "USD"
        request.paymentSummaryItems = [
            PKPaymentSummaryItem(
                label: "Pear Pay",
                amount: NSDecimalNumber(string: amount.replacingOccurrences(of: "$", with: ""))
            )
        ]

        let controller = PKPaymentAuthorizationController(paymentRequest: request)
        let delegate = AuthorizationDelegate(completion: completion)
        controller.delegate = delegate
        // Retain the delegate for the lifetime of the controller.
        objc_setAssociatedObject(controller, &delegateKey, delegate, .OBJC_ASSOCIATION_RETAIN)
        controller.present(completion: nil)
    }
}

private var delegateKey: UInt8 = 0

private final class AuthorizationDelegate: NSObject, PKPaymentAuthorizationControllerDelegate {
    private let completion: (Bool) -> Void
    private var authorized = false

    init(completion: @escaping (Bool) -> Void) {
        self.completion = completion
    }

    func paymentAuthorizationController(
        _ controller: PKPaymentAuthorizationController,
        didAuthorizePayment payment: PKPayment,
        handler completion: @escaping (PKPaymentAuthorizationResult) -> Void
    ) {
        authorized = true
        completion(PKPaymentAuthorizationResult(status: .success, errors: nil))
    }

    func paymentAuthorizationControllerDidFinish(
        _ controller: PKPaymentAuthorizationController
    ) {
        controller.dismiss(completion: nil)
        completion(authorized)
    }
}
