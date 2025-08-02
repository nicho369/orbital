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

  if (loading) return <div>Loading modules...</div>;

  if (error && modules.length === 0) {
    return (
      <div className="text-red-600">
        <p>Error: {error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-2 p-2 bg-yellow-100 border border-yellow-400 rounded text-yellow-800">
          <small>{error}</small>
        </div>
      )}
      <label htmlFor="module-dropdown" className="font-bold mr-2">Select a module:</label>
      <select
        id="module-dropdown"
        value={selected}
        onChange={e => setSelected(e.target.value)}
        className="border rounded px-2 py-1"
      >
        <option value="">-- Choose a module ({modules.length} available) --</option>
        {modules.map((mod) => (
          <option key={mod.moduleCode} value={mod.moduleCode}>
            {mod.moduleCode} - {mod.title}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ModuleList;