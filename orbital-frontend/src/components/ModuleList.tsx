import React, { useEffect, useState } from "react";

interface Module {
  moduleCode: string;
  title: string;
}

const ModuleList: React.FC = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [selected, setSelected] = useState<string>("");

  useEffect(() => {
    // Try backend first, fallback to direct NUSMods API if backend is down
    const fetchModules = async () => {
      try {
        // Try our backend first
        const response = await fetch("https://orbital-production-efe9.up.railway.app/nusmods/modules/2024-2025");
        if (!response || !response.ok) {
          throw new Error(`Backend error: ${response?.status || 'No response'}`);
        }
        const data = await response.json();
        setModules(data);
        setLoading(false);
      } catch (backendError) {
        console.warn("Backend unavailable, falling back to direct NUSMods API:", backendError);
        setError("Backend temporarily unavailable. Using direct API...");
        
        try {
          // Fallback to direct NUSMods API
          const response = await fetch("https://api.nusmods.com/v2/2024-2025/moduleList.json");
          if (!response || !response.ok) {
            throw new Error(`NUSMods API error: ${response?.status || 'No response'}`);
          }
          const data = await response.json();
          setModules(data);
          setError(""); // Clear error if successful
          setLoading(false);
        } catch (apiError) {
          console.error("Both backend and NUSMods API failed:", apiError);
          setError("Unable to load modules. Please try again later.");
          setLoading(false);
        }
      }
    };

    fetchModules();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-3 border-gray-300 border-t-blue-600"></div>
        <p className="mt-3 text-sm text-gray-600">Loading modules...</p>
      </div>
    );
  }

  if (error && modules.length === 0) {
    return (
      <div className="clean-card p-6 border-l-4 border-red-500 bg-red-50">
        <p className="text-red-700 font-medium mb-3">Error: {error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-red-600 text-white hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
          <p className="text-yellow-800 text-sm">{error}</p>
        </div>
      )}
      <div>
        <label htmlFor="module-dropdown" className="block text-sm font-medium text-gray-700 mb-2">
          Select a module
        </label>
        <select
          id="module-dropdown"
          value={selected}
          onChange={e => setSelected(e.target.value)}
          className="w-full"
        >
          <option value="">Choose from {modules.length} modules...</option>
          {modules.map((mod) => (
            <option key={mod.moduleCode} value={mod.moduleCode}>
              {mod.moduleCode} - {mod.title}
            </option>
          ))}
        </select>
        {selected && (
          <div className="mt-3 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
            <p className="text-sm text-blue-800 font-medium">Selected: {selected}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModuleList;