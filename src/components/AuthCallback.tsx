import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthCallback() {
    const navigate = useNavigate();
    const [status, setStatus] = useState("Exchanging code for tokens...");
    const [error, setError] = useState<string | null>(null);
    const isProcessing = useRef(false);

    useEffect(() => {
        const handleCallback = async () => {
            if (isProcessing.current) return;
            isProcessing.current = true;

            const params = new URLSearchParams(window.location.search);
            const code = params.get("code");
            const verifier = localStorage.getItem("pkce_verifier");

            if (code && verifier) {
                try {
                    const response = await fetch(`${import.meta.env.VITE_COGNITO_DOMAIN}/oauth2/token`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                        body: new URLSearchParams({
                            grant_type: 'authorization_code',
                            client_id: import.meta.env.VITE_COGNITO_CLIENT_ID,
                            code: code,
                            redirect_uri: import.meta.env.VITE_COGNITO_REDIRECT_URI,
                            code_verifier: verifier,
                        }),
                    });

                    if (response.ok) {
                        const data = await response.json();
                        localStorage.setItem("auth_token", data.id_token || data.access_token);
                        localStorage.removeItem("pkce_verifier");
                        setStatus("Success! Redirecting...");
                        setTimeout(() => navigate("/"), 500);
                    } else {
                        const errText = await response.text();
                        console.error("Token exchange failed:", errText);
                        setError(`Authenticaton failed: ${errText}`);
                    }
                } catch (err) {
                    console.error("Error during token exchange:", err);
                    setError(`Error: ${err instanceof Error ? err.message : String(err)}`);
                }
            } else if (!code) {
                // If there's no code in the URL, someone probably just navigated here directly
                navigate("/");
            }
        };

        handleCallback();
    }, [navigate]);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            background: '#242424',
            color: 'white',
            fontFamily: 'system-ui'
        }}>
            {error ? (
                <div style={{ textAlign: 'center' }}>
                    <h2 style={{ color: '#ef4444' }}>Authentication Error</h2>
                    <p style={{ color: '#9ca3af', maxWidth: '400px' }}>{error}</p>
                    <button
                        onClick={() => navigate('/')}
                        style={{ marginTop: '20px', background: '#3b82f6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}
                    >
                        Back to Map
                    </button>
                </div>
            ) : (
                <>
                    <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '20px' }} />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    <h2>{status}</h2>
                </>
            )}
        </div>
    );
}
