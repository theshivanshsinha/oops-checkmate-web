// File: client/src/App.jsx
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./pages/Login/Login";
import Signup from "./pages/Signup/Signup";
import Home from "./pages/Home/Home";
import LandingPage from "./pages/LandingPage";
import { GoogleOAuthProvider } from "@react-oauth/google";
import Profile from "./pages/Profile/Profile";
import ChessGame from "./pages/ChessGame/ChessGame";

function App() {
  return (
    <GoogleOAuthProvider clientId="612587465923-6svijnd7e3o1hn9jj1tdnlpvksun9j1p.apps.googleusercontent.com">
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/game/ai" element={<ChessGame />} />
        </Routes>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
