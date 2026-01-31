import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthCallback() {
    const navigate = useNavigate();

    useEffect(() => {
        // With response_type=code, Cognito sends the code in the query string (?code=...)
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");

        if (code) {
            localStorage.setItem("auth_code", code);
        }

        navigate("/");
    }, [navigate]);

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#242424', color: 'white' }}>
            <h2>Signing you in...</h2>
        </div>
    );
}
