import Messages
import UIKit

/// Root iMessage app view controller.
///
/// The Swift layer stays intentionally thin (per the README): it captures
/// intent, authenticates with Apple Pay, and calls the TypeScript backend.
/// All blockchain logic remains server-side.
final class MessagesViewController: MSMessagesAppViewController {
    private let backend = PearPayBackend()
    private let composer = PaymentComposerView()

    override func viewDidLoad() {
        super.viewDidLoad()
        composer.onSend = { [weak self] draft in
            self?.handleSend(draft)
        }
        embed(composer)
    }

    /// Capture a payment draft, authorize via Apple Pay, then hand off to the
    /// backend which performs all resolution, routing, and settlement.
    private func handleSend(_ draft: PaymentDraft) {
        ApplePayAuthorizer.authorize(amount: draft.amountDisplay) { [weak self] authorized in
            guard authorized else { return }
            self?.backend.send(message: draft.message, sender: draft.senderAddress) { result in
                DispatchQueue.main.async {
                    switch result {
                    case .success(let summary):
                        self?.insertSummary(summary)
                    case .failure(let error):
                        self?.composer.showError(error.localizedDescription)
                    }
                }
            }
        }
    }

    /// Insert the backend's confirmation as an iMessage bubble in the thread.
    private func insertSummary(_ summary: String) {
        guard let conversation = activeConversation else { return }
        let message = MSMessage()
        let layout = MSMessageTemplateLayout()
        layout.caption = "🍐 \(summary)"
        message.layout = layout
        conversation.insert(message) { _ in }
    }

    private func embed(_ child: UIView) {
        child.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(child)
        NSLayoutConstraint.activate([
            child.topAnchor.constraint(equalTo: view.topAnchor),
            child.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            child.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            child.trailingAnchor.constraint(equalTo: view.trailingAnchor),
        ])
    }
}
