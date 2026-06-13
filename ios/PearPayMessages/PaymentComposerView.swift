import UIKit

/// Lightweight composer UI for entering a natural-language payment in iMessage.
///
/// Keeps the native surface minimal: a text field for the message ("Send Molly
/// $20") and a send button. Parsing and execution happen server-side.
final class PaymentComposerView: UIView {
    var onSend: ((PaymentDraft) -> Void)?

    private let textField = UITextField()
    private let sendButton = UIButton(type: .system)
    private let errorLabel = UILabel()

    override init(frame: CGRect) {
        super.init(frame: frame)
        setup()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setup()
    }

    private func setup() {
        backgroundColor = UIColor(red: 0.04, green: 0.12, blue: 0.08, alpha: 1)

        textField.placeholder = "Send Molly $20"
        textField.borderStyle = .roundedRect
        textField.translatesAutoresizingMaskIntoConstraints = false

        sendButton.setTitle("🍐 Send", for: .normal)
        sendButton.addTarget(self, action: #selector(handleSend), for: .touchUpInside)
        sendButton.translatesAutoresizingMaskIntoConstraints = false

        errorLabel.textColor = .systemRed
        errorLabel.font = .systemFont(ofSize: 13)
        errorLabel.numberOfLines = 0
        errorLabel.translatesAutoresizingMaskIntoConstraints = false

        addSubview(textField)
        addSubview(sendButton)
        addSubview(errorLabel)

        NSLayoutConstraint.activate([
            textField.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 16),
            textField.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -16),
            textField.topAnchor.constraint(equalTo: topAnchor, constant: 24),

            sendButton.topAnchor.constraint(equalTo: textField.bottomAnchor, constant: 16),
            sendButton.centerXAnchor.constraint(equalTo: centerXAnchor),

            errorLabel.topAnchor.constraint(equalTo: sendButton.bottomAnchor, constant: 12),
            errorLabel.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 16),
            errorLabel.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -16),
        ])
    }

    func showError(_ message: String) {
        errorLabel.text = message
    }

    @objc private func handleSend() {
        errorLabel.text = nil
        guard let message = textField.text, !message.isEmpty else {
            showError("Type a payment, e.g. \"Send Molly $20\".")
            return
        }
        // The sender's wallet address is provisioned by Dynamic on first launch;
        // a placeholder is used here for the composer demo.
        let draft = PaymentDraft(
            message: message,
            amountDisplay: "$0",
            senderAddress: "0x0000000000000000000000000000000000000000"
        )
        onSend?(draft)
    }
}
