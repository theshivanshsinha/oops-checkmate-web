import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";

// Simple chess SVG icon as a placeholder
const ChessLogo = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="24" fill="#fbbf24"/>
    <path d="M24 10L28 20H20L24 10Z" fill="#fff"/>
    <rect x="20" y="20" width="8" height="12" rx="2" fill="#fff"/>
    <rect x="18" y="32" width="12" height="4" rx="2" fill="#fff"/>
  </svg>
);

// SVGs for features
const AIFeatureSVG = () => (
  <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="80" height="80" rx="20" fill="#a78bfa"/>
    <circle cx="40" cy="40" r="22" fill="#fff"/>
    <path d="M40 28c-6 0-10 4-10 10s4 10 10 10 10-4 10-10-4-10-10-10zm0 16a6 6 0 110-12 6 6 0 010 12z" fill="#a78bfa"/>
    <rect x="36" y="52" width="8" height="6" rx="2" fill="#a78bfa"/>
  </svg>
);
const MultiplayerSVG = () => (
  <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="80" height="80" rx="20" fill="#34d399"/>
    <circle cx="26" cy="40" r="10" fill="#fff"/>
    <circle cx="54" cy="40" r="10" fill="#fff"/>
    <rect x="18" y="54" width="44" height="8" rx="4" fill="#fff"/>
    <rect x="18" y="54" width="20" height="8" rx="4" fill="#34d399"/>
    <rect x="42" y="54" width="20" height="8" rx="4" fill="#34d399"/>
  </svg>
);
const LearnSVG = () => (
  <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="80" height="80" rx="20" fill="#f472b6"/>
    <rect x="20" y="28" width="40" height="24" rx="6" fill="#fff"/>
    <rect x="28" y="36" width="24" height="8" rx="2" fill="#f472b6"/>
    <rect x="36" y="48" width="8" height="4" rx="2" fill="#f472b6"/>
  </svg>
);
const LeaderboardSVG = () => (
  <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="80" height="80" rx="20" fill="#fbbf24"/>
    <rect x="24" y="44" width="8" height="12" rx="2" fill="#fff"/>
    <rect x="36" y="32" width="8" height="24" rx="2" fill="#fff"/>
    <rect x="48" y="52" width="8" height="4" rx="2" fill="#fff"/>
    <rect x="36" y="24" width="8" height="8" rx="2" fill="#fff"/>
    {/* Floating crown */}
    <g className="animate-bounce">
      <path d="M44 16l2 6 2-6 2 6 2-6 2 6v2H42v-2l2-6z" fill="#f59e42" stroke="#fff" strokeWidth="1"/>
      <circle cx="46" cy="14" r="1.5" fill="#fff"/>
      <circle cx="50" cy="14" r="1.5" fill="#fff"/>
    </g>
  </svg>
);
const ProfileSVG = () => (
  <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="80" height="80" rx="20" fill="#60a5fa"/>
    <circle cx="40" cy="36" r="10" fill="#fff"/>
    <rect x="24" y="52" width="32" height="8" rx="4" fill="#fff"/>
  </svg>
);

// Floating chess piece SVGs for background
const FloatingPawn = ({ className }) => (
  <svg className={className} width="40" height="40" viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="20" fill="#fff" fillOpacity="0.08"/><ellipse cx="20" cy="28" rx="8" ry="4" fill="#fff" fillOpacity="0.12"/><rect x="16" y="12" width="8" height="12" rx="4" fill="#fff" fillOpacity="0.18"/></svg>
);
const FloatingKnight = ({ className }) => (
  <svg className={className} width="48" height="48" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="24" fill="#fff" fillOpacity="0.06"/><path d="M32 36c0-8-8-8-8-16l8 4v12z" fill="#fff" fillOpacity="0.13"/></svg>
);

// Testimonial carousel (simple fade-in)
const testimonials = [
  {
    quote: "The best chess platform I've ever used! The UI is stunning and the AI is super challenging.",
    name: "Aarav P.",
    title: "Chess Enthusiast"
  },
  {
    quote: "I love playing with friends and tracking my progress. The leaderboard keeps me motivated!",
    name: "Meera S.",
    title: "Student & Chess Lover"
  },
  {
    quote: "Beautiful, ad-free, and packed with features. Highly recommended for all chess fans!",
    name: "Rahul K.",
    title: "Club Player"
  }
];

function TestimonialCarousel() {
  const [index, setIndex] = React.useState(0);
  const timeoutRef = useRef();
  useEffect(() => {
    timeoutRef.current = setTimeout(() => setIndex((i) => (i + 1) % testimonials.length), 4000);
    return () => clearTimeout(timeoutRef.current);
  }, [index]);
  return (
    <div className="relative max-w-2xl mx-auto text-center py-12">
      {testimonials.map((t, i) => (
        <div
          key={i}
          className={`transition-opacity duration-700 absolute left-0 right-0 ${i === index ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          <blockquote className="text-2xl italic font-medium text-white drop-shadow-lg">“{t.quote}”</blockquote>
          <div className="mt-4 text-lg font-semibold text-yellow-300">{t.name}</div>
          <div className="text-sm text-white/70">{t.title}</div>
        </div>
      ))}
      <div className="flex justify-center gap-2 mt-8">
        {testimonials.map((_, i) => (
          <button
            key={i}
            className={`w-3 h-3 rounded-full ${i === index ? 'bg-yellow-400' : 'bg-white/30'}`}
            onClick={() => setIndex(i)}
            aria-label={`Go to testimonial ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex flex-col overflow-x-hidden">
      {/* Animated background chess pieces */}
      <FloatingPawn className="absolute top-24 left-8 animate-float-slow z-0" />
      <FloatingKnight className="absolute top-1/2 right-12 animate-float-fast z-0" />
      <FloatingPawn className="absolute bottom-24 right-24 animate-float-medium z-0" />
      {/* Hero Section */}
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <ChessLogo />
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">Oops, Checkmate!</h1>
          </div>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Link to="/login" className="px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded-xl font-semibold transition duration-200 shadow-lg hover:shadow-blue-400/40 hover:-translate-y-1 hover:scale-105">Login</Link>
            <Link to="/signup" className="px-6 py-2 bg-green-500 hover:bg-green-600 rounded-xl font-semibold transition duration-200 shadow-lg hover:shadow-green-400/40 hover:-translate-y-1 hover:scale-105">Sign Up</Link>
          </div>
        </div>
      </header>

      {/* Main Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-16 relative z-10">
        <h2 className="text-5xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent drop-shadow-lg animate-fade-in-up">Master Chess, One Move at a Time</h2>
        <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-2xl mx-auto animate-fade-in-up delay-150">Play chess online with friends, challenge our smart AI, and climb the leaderboard. Join a vibrant community of chess lovers and improve your skills!</p>
        <div className="flex flex-wrap gap-6 justify-center mb-12">
          <Link to="/signup" className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold rounded-2xl text-xl shadow-xl hover:shadow-yellow-400/40 hover:-translate-y-1 hover:scale-105 transition-all duration-200 animate-fade-in-up delay-300">Get Started</Link>
          <Link to="/login" className="px-8 py-4 bg-white/10 text-white font-bold rounded-2xl text-xl shadow-xl hover:bg-white/20 hover:shadow-white/40 hover:-translate-y-1 hover:scale-105 transition-all duration-200 animate-fade-in-up delay-500">I already have an account</Link>
        </div>
        {/* Chess logo illustration */}
        <div className="mx-auto w-48 md:w-64 drop-shadow-2xl flex items-center justify-center animate-fade-in-up delay-700">
          <ChessLogo />
        </div>
      </section>

      {/* Features Section - visually rich cards with SVGs, glassmorphism, and glow */}
      <section className="max-w-7xl mx-auto py-20 px-4 grid md:grid-cols-3 gap-12 relative z-10">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-10 flex flex-col items-center hover:scale-105 hover:shadow-purple-400/40 transition-transform duration-300 border border-white/10">
          <AIFeatureSVG />
          <h3 className="text-2xl font-bold mt-6 mb-2">Play vs AI</h3>
          <p className="opacity-90 mb-4 text-center">Challenge our intelligent AI with multiple difficulty levels and improve your chess skills at your own pace. Enjoy a realistic chess experience with smart moves and hints.</p>
        </div>
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-10 flex flex-col items-center hover:scale-105 hover:shadow-green-400/40 transition-transform duration-300 border border-white/10">
          <MultiplayerSVG />
          <h3 className="text-2xl font-bold mt-6 mb-2">Multiplayer</h3>
          <p className="opacity-90 mb-4 text-center">Play real-time matches with friends or players worldwide. Climb the leaderboard, chat, and make new chess buddies in a vibrant community.</p>
        </div>
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-10 flex flex-col items-center hover:scale-105 hover:shadow-pink-400/40 transition-transform duration-300 border border-white/10">
          <LearnSVG />
          <h3 className="text-2xl font-bold mt-6 mb-2">Learn & Improve</h3>
          <p className="opacity-90 mb-4 text-center">Access resources, tips, and puzzles to sharpen your tactics and strategy. Perfect for beginners and pros alike. Track your progress and level up!</p>
        </div>
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-10 flex flex-col items-center hover:scale-105 hover:shadow-yellow-400/40 transition-transform duration-300 border border-white/10 md:col-span-1 relative">
          <LeaderboardSVG />
          <div className="absolute -top-6 right-8 animate-pulse">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M16 4l2.5 7.5H26l-6 4.5 2.5 7.5-6-4.5-6 4.5L12 16l-6-4.5h7.5L16 4z" fill="#fbbf24"/><g><circle cx="16" cy="16" r="14" stroke="#fff" strokeWidth="2" fill="none"/></g></svg>
          </div>
          <h3 className="text-2xl font-bold mt-6 mb-2">Leaderboard</h3>
          <p className="opacity-90 mb-4 text-center">Compete for the top spot! See how you rank against other players and celebrate your achievements with badges and trophies.</p>
        </div>
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-10 flex flex-col items-center hover:scale-105 hover:shadow-blue-400/40 transition-transform duration-300 border border-white/10 md:col-span-1">
          <ProfileSVG />
          <h3 className="text-2xl font-bold mt-6 mb-2">Profile & Stats</h3>
          <p className="opacity-90 mb-4 text-center">Personalize your profile, track your stats, and showcase your chess journey. Connect with friends and share your progress.</p>
        </div>
      </section>

      {/* Testimonial Carousel */}
      <section className="relative z-10">
        <TestimonialCarousel />
      </section>

      {/* About Us Section */}
      <section className="max-w-4xl mx-auto py-12 px-4 text-center relative z-10">
        <h4 className="text-3xl font-bold mb-4">About Us</h4>
        <p className="text-lg opacity-90 mb-6">
          <span className="font-semibold">Kumar Shivansh Sinha</span> is an undergraduate at BITS Pilani, Hyderabad Campus, passionate about chess, technology, and building communities. With a vision to make chess accessible and fun for everyone, he created Oops, Checkmate! to bring together chess lovers from all walks of life. Whether you are a beginner or a grandmaster, this platform is designed to help you learn, play, and connect.
        </p>
        <div className="flex flex-wrap justify-center gap-6">
          <div className="bg-white/10 rounded-xl px-6 py-4 text-lg font-semibold">No ads, ever</div>
          <div className="bg-white/10 rounded-xl px-6 py-4 text-lg font-semibold">Modern, beautiful UI</div>
          <div className="bg-white/10 rounded-xl px-6 py-4 text-lg font-semibold">Free to play</div>
          <div className="bg-white/10 rounded-xl px-6 py-4 text-lg font-semibold">Made with ❤️ by chess lovers</div>
        </div>
      </section>

      {/* App Version Section */}
      <section className="max-w-4xl mx-auto py-8 px-4 text-center relative z-10">
        <h5 className="text-2xl font-bold mb-2">App Version</h5>
        <p className="text-lg opacity-80">Coming Soon</p>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-r from-purple-700 to-indigo-800 text-center relative z-10">
        <h5 className="text-4xl font-extrabold mb-4">Ready to make your move?</h5>
        <p className="text-xl mb-8 opacity-90">Sign up now and join the ultimate chess experience!</p>
        <Link to="/signup" className="px-10 py-4 bg-yellow-400 text-black font-bold rounded-2xl text-2xl shadow-lg hover:shadow-yellow-400/40 hover:-translate-y-1 hover:scale-105 transition-all duration-200">Join Now</Link>
      </section>

      {/* Footer */}
      <footer className="bg-black/30 backdrop-blur-md border-t border-white/10 py-8 mt-auto relative z-10">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm opacity-75">© 2025 Oops, Checkmate! - Master the game, one move at a time. Made with love by Kumar Shivansh Sinha</p>
        </div>
      </footer>

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
        .delay-150 { animation-delay: 0.15s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-500 { animation-delay: 0.5s; }
        .delay-700 { animation-delay: 0.7s; }
      `}</style>
    </div>
  );
} 