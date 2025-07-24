import React, { useState } from "react";
import axios from "axios";
import { auth } from "../firebase";
import { Link } from "react-router-dom";

const semesters = [
  "Year 1 Sem 1",
  "Year 1 Sem 2",
  "Year 2 Sem 1",
  "Year 2 Sem 2",
  "Year 3 Sem 1",
  "Year 3 Sem 2",
  "Year 4 Sem 1",
  "Year 4 Sem 2",
];

const ACADEMIC_YEAR = "2024-2025";

interface Warning {
  module: string;
  message: string;
}

const PlannerPage: React.FC = () => {
  const [plan, setPlan] = useState<{ [semester: string]: string[] }>({});
  const [selectedSemester, setSelectedSemester] = useState<string>(semesters[0]);
  const [moduleInput, setModuleInput] = useState<string>("");
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [grades, setGrades] = useState<{ [mod: string]: string }>({});

  // Helper to get all modules planned before a given semester
  const getPlannedModulesBefore = (semester: string) => {
    const idx = semesters.indexOf(semester);
    let mods: string[] = [];
    for (let i = 0; i < idx; i++) {
      mods = mods.concat(plan[semesters[i]] || []);
    }
    return mods;
  };

  const addModule = async () => {
    if (!moduleInput) return;
    const modCode = moduleInput.trim().toUpperCase();
    // Fetch module info from backend
    try {
      const res = await axios.get(
        `https://orbital-production-efe9.up.railway.app/nusmods/module/${ACADEMIC_YEAR}/${modCode}`
      );
      const modInfo = res.data;
      let unmet: string[] = [];
      // Check prerequisites (simple string search for now)
      if (modInfo.prereqTree) {
        const planned = getPlannedModulesBefore(selectedSemester).map((m) => m.toUpperCase());
        // Simple check: if prereqTree is a string, see if it's in planned
        // (NUSMods prereqTree can be a string, array, or object; here we handle string/array)
        const checkTree = (tree: any): boolean => {
          if (typeof tree === "string") return planned.includes(tree.toUpperCase());
          if (Array.isArray(tree)) return tree.every(checkTree);
          if (typeof tree === "object" && tree !== null) {
            if (tree.and) return tree.and.every(checkTree);
            if (tree.or) return tree.or.some(checkTree);
          }
          return true;
        };
        if (!checkTree(modInfo.prereqTree)) {
          unmet.push("prerequisites");
        }
      }
      // Check corequisites (if any)
      if (modInfo.corequisite) {
        // For simplicity, just warn if corequisite is not in the same or previous semester
        const allPlanned = [
          ...(plan[selectedSemester] || []),
          ...getPlannedModulesBefore(selectedSemester),
        ].map((m) => m.toUpperCase());
        if (!allPlanned.includes(modInfo.corequisite.toUpperCase())) {
          unmet.push("corequisites");
        }
      }
      if (unmet.length > 0) {
        alert(`${modCode}: Unmet ${unmet.join(" and ")}`);
        setModuleInput("");
        return;
      }
      setPlan((prev) => ({
        ...prev,
        [selectedSemester]: [...(prev[selectedSemester] || []), modCode],
      }));
      setWarnings((prev) => prev.filter((w) => w.module !== modCode));
      setModuleInput("");
    } catch (err) {
      alert(`${modCode}: Module not found or error fetching info`);
      setModuleInput("");
    }
  };

  const savePlan = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("You must be logged in to save your plan.");
      return;
    }
    const token = await user.getIdToken();
    try {
      await axios.post(
        "https://orbital-production-efe9.up.railway.app/plans/save",
        { json_data: JSON.stringify(plan) },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      alert("Plan saved successfully!");
    } catch (err) {
      alert("Failed to save plan.");
    }
  };

  const loadPlan = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("You must be logged in to load your plan.");
      return;
    }
    const token = await user.getIdToken();
    try {
      const res = await axios.get("https://orbital-production-efe9.up.railway.app/plans/load", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const plans = res.data.plans;
      if (plans.length > 0) {
        const latestPlan = JSON.parse(plans[plans.length - 1]);
        setPlan(latestPlan);
        alert("Plan loaded!");
      } else {
        alert("No saved plans found.");
      }
    } catch (err) {
      alert("Failed to load plan.");
    }
  };

  // Graduation requirement: 40 modules (160 MCs, assuming 4 MCs per module)
  const TOTAL_MODULES_REQUIRED = 40;
  const completedModules = Object.values(plan).flat().length;
  const progressPercent = Math.min(100, Math.round((completedModules / TOTAL_MODULES_REQUIRED) * 100));

  // Add grade input handler
  const handleGradeChange = (mod: string, grade: string) => {
    setGrades((prev) => ({ ...prev, [mod]: grade }));
  };

  const gradeOptions = [
    "A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "F"
  ];

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Progress Bar */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2 text-center">Graduation Progress</h2>
        <div className="w-full bg-gray-200 rounded-full h-6 mb-2">
          <div
            className="bg-blue-600 h-6 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
        <div className="text-center text-gray-700 font-medium">
          {completedModules} / {TOTAL_MODULES_REQUIRED} modules completed ({progressPercent}%)
        </div>
      </div>
      <div className="mb-4">
        <Link to="/">
          <button className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800">Back to Home</button>
        </Link>
      </div>
      <h1 className="text-3xl font-bold mb-6 text-center">Module Planner</h1>
      <div className="flex flex-col md:flex-row gap-4 items-center mb-6">
        <select
          value={selectedSemester}
          onChange={(e) => setSelectedSemester(e.target.value)}
          className="border rounded px-2 py-1"
        >
          {semesters.map((sem) => (
            <option key={sem} value={sem}>{sem}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Enter module code (e.g. CS1101S)"
          value={moduleInput}
          onChange={(e) => setModuleInput(e.target.value)}
          className="border rounded px-2 py-1"
        />
        <button
          onClick={addModule}
          className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800"
        >
          Add Module
        </button>
      </div>
      {warnings.length > 0 && (
        <div className="mb-4">
          {warnings.map((w, idx) => (
            <div key={idx} className="text-red-600 font-semibold">
              {w.module}: {w.message}
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-4 mb-6 justify-center">
        <button onClick={savePlan} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Save Plan</button>
        <button onClick={loadPlan} className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">Load Plan</button>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {semesters.map((sem) => (
          <div key={sem} className="bg-gray-50 p-4 rounded shadow">
            <h2 className="font-bold text-lg mb-2">{sem}</h2>
            <ul>
              {(plan[sem] || []).map((mod, idx) => (
                <li key={idx} className="text-blue-800 flex items-center gap-2">
                  <span>{mod}</span>
                  <select
                    value={grades[mod] || ""}
                    onChange={e => handleGradeChange(mod, e.target.value)}
                    className="ml-2 border rounded px-2 py-1 w-20 text-sm"
                  >
                    <option value="">Grade</option>
                    {gradeOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlannerPage;
