import { BrowserRouter as Router, Routes, Route, useSearchParams } from "react-router-dom";
import MapView from "./components/MapView";
import AuthCallback from "./components/AuthCallback";

function RootHandler() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code");

  if (code) {
    return <AuthCallback />;
  }
  return <MapView />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RootHandler />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
      </Routes>
    </Router>
  );
}

export default App;
