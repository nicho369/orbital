import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { signInWithPopup, auth, provider, signOut } from '../firebase';
import axios from "axios";
import ModuleList from "../components/ModuleList";

const HomePage: React.FC = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
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
        "http://localhost:8000/plans/save",
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

    const response = await axios.get("http://localhost:8000/plans/load", {
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
    <main className="min-h-screen bg-white text-gray-800 flex flex-col items-center justify-start pt-8 px-2">
      <section className="w-full max-w-2xl text-center mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-blue-800">SoC GradWise</h1>
          <p className="text-xl mt-2 font-medium text-blue-600">Plan Smart. Graduate Smoothly.</p>
        </div>

        {/* Google Login Section */}
        <div className="mb-20">
          {user ? (
            <>
              <p className="text-green-700 font-semibold">Welcome, {user.displayName}!</p>
              <button
                onClick={saveStudyPlan}
                className="mt-4 bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700"
              >
                Save My Study Plan
              </button>
              <button
                onClick={loadStudyPlans}
                className="mt-4 ml-4 bg-purple-600 text-white px-4 py-2 rounded-xl hover:bg-purple-700"
              >
                Load My Study Plans
              </button>
              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="mt-4 ml-4 bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={handleLogin}
              className="bg-blue-700 text-white px-4 py-2 rounded-xl hover:bg-blue-800"
            >
              Sign in with Google
            </button>
          )}
        </div>

        <section className="grid md:grid-cols-2 gap-8 text-left mt-10">
          <FeatureCard
            icon=""
            title="Graduation Progress"
            description="Track your progress towards graduation requirements."
          />
        </section>

        <div className="mt-12">
          <Link to="/planner">
            <button className="text-white bg-blue-700 hover:bg-blue-800 text-lg px-6 py-3 rounded-xl">
              Start Planning
            </button>
          </Link>
        </div>

        {/* Only show module dropdown after login */}
        {user ? (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-4">Available Modules</h2>
            <ModuleList />
          </div>
        ) : null}

        <footer className="mt-16 text-sm text-gray-600">
          <p>Powered by React, Firebase, Flask</p>
        </footer>
      </section>
    </main>
  );
};

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => (
  <div className="flex items-start space-x-4 bg-gray-50 p-5 rounded-2xl shadow hover:shadow-md transition">
    <div className="text-3xl">{icon}</div>
    <div>
      <h3 className="font-bold text-lg text-blue-700">{title}</h3>
      <p className="text-gray-700">{description}</p>
    </div>
  </div>
);

export default HomePage;
