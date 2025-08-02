import React from "react";
import ModuleList from "../components/ModuleList";

const TestModulePage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Module List Test</h1>
      <p className="mb-4 text-gray-600">
        This page tests the ModuleList component independently. 
        The backend is currently down, so it should fallback to the direct NUSMods API.
      </p>
      <ModuleList />
    </div>
  );
};

export default TestModulePage;
