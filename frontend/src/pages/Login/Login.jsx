import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";

const API_BASE_URL = "https://oops-checkmate-web.onrender.com";

// Chess logo SVG
const ChessLogo = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="24" fill="#fbbf24"/>
    <path d="M24 10L28 20H20L24 10Z" fill="#fff"/>
    <rect x="20" y="20" width="8" height="12" rx="2" fill="#fff"/>
    <rect x="18" y="32" width="12" height="4" rx="2" fill="#fff"/>
  </svg>
);
// Floating chess piece SVGs for background
const FloatingPawn = ({ className }) => (
  <svg className={className} width="40" height="40" viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="20" fill="#fff" fillOpacity="0.08"/><ellipse cx="20" cy="28" rx="8" ry="4" fill="#fff" fillOpacity="0.12"/><rect x="16" y="12" width="8" height="12" rx="4" fill="#fff" fillOpacity="0.18"/></svg>
);
const FloatingKnight = ({ className }) => (
  <svg className={className} width="48" height="48" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="24" fill="#fff" fillOpacity="0.06"/><path d="M32 36c0-8-8-8-8-16l8 4v12z" fill="#fff" fillOpacity="0.13"/></svg>
);

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const formRef = useRef();

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError("");
    try {
      const token = credentialResponse.credential;
      const res = await axios.post(`${API_BASE_URL}/api/google-auth`, {
        token,
      });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/home");
    } catch (error) {
      setError(error.response?.data?.error || "Google login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${API_BASE_URL}/api/login`, {
        email,
        password,
      });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/home");
    } catch (error) {
      setError(error.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // Animate form on mount
  useEffect(() => {
    if (formRef.current) {
      formRef.current.classList.add("animate-fade-in-up");
    }
  }, []);

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-x-hidden">
      {/* Animated background chess pieces */}
      <FloatingPawn className="absolute top-24 left-8 animate-float-slow z-0" />
      <FloatingKnight className="absolute top-1/2 right-12 animate-float-fast z-0" />
      <FloatingPawn className="absolute bottom-24 right-24 animate-float-medium z-0" />
      <div className="w-full max-w-md relative z-10">
        <div ref={formRef} className="bg-white/10 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl p-10 animate-fade-in-up">
          <div className="flex flex-col items-center mb-8">
            <ChessLogo />
            <h2 className="text-3xl font-extrabold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mt-4 mb-2 drop-shadow-lg">Welcome Back!</h2>
            <p className="text-white/80">Sign in to continue playing</p>
          </div>
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-400/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
          <form onSubmit={handleEmailLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-1">Email Address</label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-white/20 bg-white/10 text-white rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition placeholder-white/60"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-1">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-white/20 bg-white/10 text-white rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition placeholder-white/60"
                required
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold py-3 px-4 rounded-xl shadow-lg hover:shadow-yellow-400/40 hover:-translate-y-1 hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white/10 text-white/70 rounded-full">Or continue with</span>
              </div>
            </div>
            <div className="mt-4 flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError("Google login failed")}
                useOneTap={false}
                disabled={loading}
                theme="filled_black"
                width="260"
              />
            </div>
          </div>
          <div className="mt-8 text-center">
            <p className="text-sm text-white/70">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="font-bold text-yellow-400 hover:text-orange-400 transition"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
      {/* Custom CSS for animations */}
      <style>{`
        @keyframes float-slow { 0% { transform: translateY(0); } 50% { transform: translateY(-16px); } 100% { transform: translateY(0); } }
        @keyframes float-fast { 0% { transform: translateY(0); } 50% { transform: translateY(-32px); } 100% { transform: translateY(0); } }
        @keyframes float-medium { 0% { transform: translateY(0); } 50% { transform: translateY(-24px); } 100% { transform: translateY(0); } }
        .animate-float-slow { animation: float-slow 7s ease-in-out infinite; }
        .animate-float-fast { animation: float-fast 4s ease-in-out infinite; }
        .animate-float-medium { animation: float-medium 5.5s ease-in-out infinite; }
        @keyframes fade-in-up { 0% { opacity: 0; transform: translateY(32px); } 100% { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fade-in-up 1.1s cubic-bezier(.4,0,.2,1) both; }
      `}</style>
    </div>
  );
}
