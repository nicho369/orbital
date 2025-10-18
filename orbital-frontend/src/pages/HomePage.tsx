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
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">SoC GradWise</h1>
              <p className="text-sm text-gray-600 mt-1">NUS School of Computing</p>
            </div>
            <div>
              {user ? (
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{user.displayName}</p>
                    <p className="text-xs text-gray-500">Signed in</p>
                  </div>
                  {user.photoURL && (
                    <img 
                      src={user.photoURL} 
                      alt="Profile" 
                      className="w-10 h-10 rounded-full border-2 border-gray-200"
                    />
                  )}
                  <button
                    onClick={handleLogout}
                    className="bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleLogin}
                  className="bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign in with Google
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <section className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Plan Your Academic Journey
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            Track prerequisites, manage semesters, and stay on top of your graduation requirements
            with our intelligent planning tool designed for NUS Computing students.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/planner">
              <button className="bg-blue-600 text-white hover:bg-blue-700 px-6 py-3">
                Open Planner
              </button>
            </Link>
            {user && (
              <>
                <button
                  onClick={saveStudyPlan}
                  className="bg-green-600 text-white hover:bg-green-700"
                >
                  Save Plan
                </button>
                <button
                  onClick={loadStudyPlans}
                  className="bg-gray-600 text-white hover:bg-gray-700"
                >
                  Load Plans
                </button>
              </>
            )}
          </div>
        </section>

        {/* Features Grid */}
        <section className="grid md:grid-cols-3 gap-6 mb-12">
          <FeatureCard
            icon="📊"
            title="Track Progress"
            description="Visual progress tracking towards your 40-module graduation requirement."
          />
          <FeatureCard
            icon="✓"
            title="Prerequisites Check"
            description="Automatic validation ensures you meet all module requirements."
          />
          <FeatureCard
            icon="📅"
            title="8-Semester Planning"
            description="Organize your 4-year journey across all semesters."
          />
          <FeatureCard
            icon="☁"
            title="Cloud Sync"
            description="Access your study plans from any device, anywhere."
          />
          <FeatureCard
            icon="�"
            title="NUSMods Integration"
            description="Real-time module data and information."
          />
          <FeatureCard
            icon="📈"
            title="Grade Tracking"
            description="Monitor your academic performance over time."
          />
        </section>

        {/* Module Browser */}
        {user && (
          <section className="clean-card p-8 animate-fade-in">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Browse Modules</h2>
            <ModuleList />
          </section>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            Powered by React, TypeScript, Firebase, and FastAPI
          </p>
        </div>
      </footer>
    </main>
  );
};

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => (
  <div className="clean-card p-6">
    <div className="text-3xl mb-3">{icon}</div>
    <h3 className="font-semibold text-lg text-gray-900 mb-2">{title}</h3>
    <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
  </div>
);

export default HomePage;
