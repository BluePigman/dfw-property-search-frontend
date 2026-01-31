export function login() {
    const url =
        `${import.meta.env.VITE_COGNITO_DOMAIN}/login` +
        `?client_id=${import.meta.env.VITE_COGNITO_CLIENT_ID}` +
        `&response_type=code` +
        `&scope=email+openid+phone` +
        `&redirect_uri=${encodeURIComponent(
            import.meta.env.VITE_COGNITO_REDIRECT_URI
        )}`;

    window.location.href = url;
}

export function logout() {
    localStorage.removeItem("auth_code");
    window.location.href = "/";
}

export function getToken() {
    return localStorage.getItem("auth_code");
}

export function isAuthenticated() {
    return !!getToken();
}
