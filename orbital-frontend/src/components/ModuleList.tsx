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
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
        <p className="mt-4 text-gray-600 font-medium">Loading modules...</p>
      </div>
    );
  }

  if (error && modules.length === 0) {
    return (
      <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6 text-center">
        <p className="text-red-700 font-semibold mb-4">⚠️ Error: {error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-gradient-to-r from-red-500 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-red-600 hover:to-pink-700 font-semibold shadow-lg"
        >
          🔄 Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
          <p className="text-yellow-800 text-sm font-medium">⚡ {error}</p>
        </div>
      )}
      <div className="space-y-2">
        <label htmlFor="module-dropdown" className="block font-bold text-gray-800 text-lg">
          Select a module:
        </label>
        <select
          id="module-dropdown"
          value={selected}
          onChange={e => setSelected(e.target.value)}
          className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-base bg-white focus:border-purple-500 focus:ring focus:ring-purple-200 transition-all"
        >
          <option value="">-- Choose from {modules.length} available modules --</option>
          {modules.map((mod) => (
            <option key={mod.moduleCode} value={mod.moduleCode}>
              {mod.moduleCode} - {mod.title}
            </option>
          ))}
        </select>
        {selected && (
          <div className="mt-4 p-4 bg-purple-50 border-l-4 border-purple-500 rounded-lg">
            <p className="text-purple-800 font-semibold">✓ Selected: {selected}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModuleList;