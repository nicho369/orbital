import React from 'react';
// import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  return (
    <main className="min-h-screen bg-white text-gray-800 p-6 md:p-12">
      <section className="max-w-4xl mx-auto text-center">
        <div className="mb-8">
          <img src="/logo.png" alt="SoC GradWise Logo" className="w-20 mx-auto" />
          <h1 className="text-4xl font-bold text-blue-800">SoC GradWise</h1>
          <p className="text-xl mt-2 font-medium text-blue-600">Plan Smart. Graduate Smoothly.</p>
          <p className="mt-4 text-lg text-gray-700">
            Our WebApp helps SoC students plan out their 4-year academic journey in NUS with ease.
          </p>
        </div>

        <section className="grid md:grid-cols-2 gap-8 text-left mt-10">
          <FeatureCard
            icon="📅"
            title="Interactive Module Planner"
            description="Drag & drop modules into semesters to customize your academic plan."
          />
          <FeatureCard
            icon="⚠️"
            title="Inbuilt Prerequisite Checking"
            description="Get warnings when selecting modules without fulfilling prerequisites."
          />
          <FeatureCard
            icon="👤"
            title="Personal Profiles"
            description="Save and access personalized study plans by logging in."
          />
          <FeatureCard
            icon="🎓"
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

        <footer className="mt-16 text-sm text-gray-600">
          <p>Powered by React, Firebase, Flask</p>
          <p>Team Members: Ray Chua & Nicholas Chin</p>
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
