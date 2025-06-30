import React, { useEffect, useState } from "react";

interface Module {
  moduleCode: string;
  title: string;
}

const ModuleList: React.FC = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string>("");

  useEffect(() => {
    fetch("https://orbital-production-efe9.up.railway.app/nusmods/modules/2024-2025")
      .then((res) => res.json())
      .then((data) => {
        setModules(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <label htmlFor="module-dropdown" className="font-bold mr-2">Select a module:</label>
      <select
        id="module-dropdown"
        value={selected}
        onChange={e => setSelected(e.target.value)}
        className="border rounded px-2 py-1"
      >
        <option value="">-- Choose a module --</option>
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