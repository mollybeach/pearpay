import Foundation

/// Thin HTTP client for the Pear Pay TypeScript backend.
///
/// The iMessage extension forwards a natural-language message and the sender's
/// wallet address; the backend (POST /api/payments) does everything else.
struct PaymentDraft {
    let message: String
    let amountDisplay: String
}

final class PearPayBackend {
    private let baseURL: URL
    private let session: URLSession

    init(
        baseURL: URL = PearPayBackend.defaultBaseURL,
        session: URLSession = .shared
    ) {
        self.baseURL = baseURL
        self.session = session
    }

    private static var defaultBaseURL: URL {
        if
            let value = Bundle.main.object(forInfoDictionaryKey: "PearPayBackendURL") as? String,
            let url = URL(string: value)
        {
            return url
        }
        return URL(string: "https://pearpay.app")!
    }

    /// Send a payment message to the backend and return its summary string.
    func send(
        message: String,
        sender address: String,
        completion: @escaping (Result<String, Error>) -> Void
    ) {
        let endpoint = baseURL.appendingPathComponent("api/payments")
        var request = URLRequest(url: endpoint)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let payload: [String: Any] = [
            "message": message,
            "sender": ["label": "imessage", "address": address],
            "channel": "imessage",
        ]
        request.httpBody = try? JSONSerialization.data(withJSONObject: payload)

        session.dataTask(with: request) { data, _, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            guard
                let data = data,
                let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                let summary = json["summary"] as? String
            else {
                completion(.failure(BackendError.invalidResponse))
                return
            }
            completion(.success(summary))
        }.resume()
    }

    enum BackendError: Error {
        case invalidResponse
    }
}
