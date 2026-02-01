// PKCE Helpers
async function generateCodeVerifier() {
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    return btoa(String.fromCharCode.apply(null, Array.from(array)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

async function generateCodeChallenge(verifier: string) {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(digest))))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

export async function login() {
    const verifier = await generateCodeVerifier();
    localStorage.setItem("pkce_verifier", verifier);
    const challenge = await generateCodeChallenge(verifier);

    const url =
        `${import.meta.env.VITE_COGNITO_DOMAIN}/login` +
        `?client_id=${import.meta.env.VITE_COGNITO_CLIENT_ID}` +
        `&response_type=code` +
        `&scope=email+openid+phone` +
        `&redirect_uri=${encodeURIComponent(import.meta.env.VITE_COGNITO_REDIRECT_URI)}` +
        `&code_challenge=${challenge}` +
        `&code_challenge_method=S256`;

    window.location.href = url;
}

export function logout() {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("pkce_verifier");
    window.location.href = "/";
}

export function getToken() {
    return localStorage.getItem("auth_token");
}

export function isAuthenticated() {
    return !!getToken();
}
