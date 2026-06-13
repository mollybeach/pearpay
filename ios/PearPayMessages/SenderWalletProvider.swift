import Foundation

enum SenderWalletProvider {
    private static let userDefaultsKey = "PearPaySenderWalletAddress"

    static func currentWalletAddress() -> String? {
        if
            let value = Bundle.main.object(forInfoDictionaryKey: "PearPaySenderWalletAddress") as? String,
            isValidAddress(value)
        {
            return value
        }

        if
            let value = UserDefaults.standard.string(forKey: userDefaultsKey),
            isValidAddress(value)
        {
            return value
        }

        return nil
    }

    static func storeWalletAddress(_ address: String) {
        guard isValidAddress(address) else { return }
        UserDefaults.standard.set(address, forKey: userDefaultsKey)
    }

    private static func isValidAddress(_ address: String) -> Bool {
        address.range(
            of: #"^0x[a-fA-F0-9]{40}$"#,
            options: .regularExpression
        ) != nil
    }
}
