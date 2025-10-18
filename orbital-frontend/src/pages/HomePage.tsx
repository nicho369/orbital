import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { signInWithPopup, auth, provider, signOut } from '../firebase';
import type { User } from 'firebase/auth';
import axios from "axios";
import ModuleList from "../components/ModuleList";

const HomePage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const token = await result.user.getIdToken();
      setUser(result.user);
      console.log("✅ Logged in:", result.user.displayName);
      console.log("🪪 Token:", token);
    } catch (error) {
      console.error("❌ Login failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      console.log("🚪 Logged out");
    } catch (error) {
      console.error("❌ Logout failed:", error);
    }
  };

  const saveStudyPlan = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();

      if (!token) {
        console.error("❌ No user token found");
        return;
      }

      // hardcoded data for testing
      const planData = {
        modules: ["CS1101S", "CS2030", "IS1108"]
      };

      const response = await axios.post(
        "https://orbital-production-efe9.up.railway.app/plans/save",
        { json_data: JSON.stringify(planData) },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      console.log("✅ Study plan saved:", response.data);
    } catch (error) {
      console.error("❌ Save failed:", error);
    }
  };

  const loadStudyPlans = async () => {
  try {
    const token = await auth.currentUser?.getIdToken();

    if (!token) {
      console.error("❌ No user token found");
      return;
    }

    const response = await axios.get("https://orbital-production-efe9.up.railway.app/plans/load", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    const plans = response.data.plans;
    console.log("✅ Loaded plans:", plans);

    // Optional: Parse and display the latest plan
    if (plans.length > 0) {
      const latestPlan = JSON.parse(plans[plans.length - 1]);
      console.log("📦 Latest plan:", latestPlan);
    }

  } catch (err) {
    console.error("❌ Load failed:", err);
  }
};


  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 text-gray-800 flex flex-col items-center justify-start pt-8 px-4 pb-16">
      <div className="w-full max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-block mb-6 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-semibold">
            🎓 NUS School of Computing
          </div>
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 drop-shadow-lg">
            SoC GradWise
          </h1>
          <p className="text-2xl md:text-3xl text-white/90 font-light mb-8">
            Plan Smart. Graduate Smoothly.
          </p>
          <p className="text-lg text-white/80 max-w-2xl mx-auto mb-12">
            Your intelligent companion for planning your academic journey at NUS Computing.
            Track prerequisites, manage semesters, and graduate with confidence.
          </p>

          {/* Auth Section */}
          <div className="glass-card p-8 max-w-md mx-auto mb-12">
            {user ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-3 mb-6">
                  {user.photoURL && (
                    <img 
                      src={user.photoURL} 
                      alt="Profile" 
                      className="w-16 h-16 rounded-full border-4 border-purple-500"
                    />
                  )}
                  <div className="text-left">
                    <p className="text-sm text-gray-500">Welcome back,</p>
                    <p className="text-xl font-bold text-gray-800">{user.displayName}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 justify-center">
                  <button
                    onClick={saveStudyPlan}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 flex items-center gap-2"
                  >
                    💾 Save Plan
                  </button>
                  <button
                    onClick={loadStudyPlans}
                    className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-purple-600 hover:to-indigo-700 flex items-center gap-2"
                  >
                    📂 Load Plans
                  </button>
                  <button
                    onClick={handleLogout}
                    className="bg-gradient-to-r from-red-500 to-pink-600 text-white px-6 py-3 rounded-xl hover:from-red-600 hover:to-pink-700 flex items-center gap-2"
                  >
                    🚪 Logout
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-gray-700 mb-6 text-lg">Sign in to start planning your journey</p>
                <button
                  onClick={handleLogin}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 text-lg font-semibold shadow-xl flex items-center gap-3 mx-auto"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign in with Google
                </button>
              </div>
            )}
          </div>

          {/* CTA Button */}
          <Link to="/planner">
            <button className="bg-white text-purple-700 px-10 py-5 rounded-2xl text-xl font-bold shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300">
              🚀 Start Planning Now
            </button>
          </Link>
        </div>

        {/* Features Grid */}
        <section className="grid md:grid-cols-3 gap-6 mb-16">
          <FeatureCard
            icon="📊"
            title="Track Progress"
            description="Monitor your journey with a visual progress bar showing modules completed towards your 40-module graduation requirement."
          />
          <FeatureCard
            icon="🔍"
            title="Smart Prerequisites"
            description="Automatic prerequisite and corequisite checking ensures you never plan a module without meeting its requirements."
          />
          <FeatureCard
            icon="📅"
            title="8-Semester Planning"
            description="Plan all 4 years across 8 semesters with an intuitive interface designed for NUS Computing students."
          />
          <FeatureCard
            icon="💾"
            title="Cloud Sync"
            description="Your study plans are securely saved to the cloud and accessible from any device after signing in."
          />
          <FeatureCard
            icon="📚"
            title="NUSMods Integration"
            description="Real-time module data from NUSMods API with detailed information about every course."
          />
          <FeatureCard
            icon="🎯"
            title="Grade Tracking"
            description="Record your grades for each module and keep track of your academic performance over time."
          />
        </section>

        {/* Module List Section */}
        {user && (
          <div className="glass-card p-8 mb-12 animate-fade-in">
            <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center">📖 Browse Available Modules</h2>
            <ModuleList />
          </div>
        )}

        {/* Footer */}
        <footer className="text-center text-white/70 text-sm mt-16">
          <p>Powered by React • TypeScript • Firebase • FastAPI</p>
          <p className="mt-2">Made with ❤️ for NUS Computing Students</p>
        </footer>
      </div>
    </main>
  );
};

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => (
  <div className="glass-card p-6 hover:scale-105 transition-all duration-300 cursor-pointer group">
    <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">{icon}</div>
    <h3 className="font-bold text-xl text-gray-800 mb-3 group-hover:text-purple-700 transition-colors">
      {title}
    </h3>
    <p className="text-gray-600 leading-relaxed">{description}</p>
  </div>
);

export default HomePage;
