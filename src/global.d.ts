interface Window {
  googleTokenClient?: google.accounts.oauth2.TokenClient;
}

declare namespace google {
  namespace accounts {
    namespace oauth2 {
      interface TokenClient {
        requestAccessToken(override?: { prompt?: string }): void;
      }
      function initTokenClient(config: {
        client_id: string;
        scope: string;
        callback: (response: TokenResponse) => void;
      }): TokenClient;

      interface TokenResponse {
        access_token: string;
        error?: string;
        expires_in: string;
      }
    }
  }
}
