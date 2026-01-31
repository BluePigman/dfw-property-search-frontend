import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MapView from "./components/MapView";
import AuthCallback from "./components/AuthCallback";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MapView />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
      </Routes>
    </Router>
  );
}

export default App;
