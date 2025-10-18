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

  const normalizeModCode = (code: string) => code.split(":")[0].toUpperCase();

  // Helper to get all modules planned before a given semester
  const getPlannedModulesBefore = (semester: string) => {
    const idx = semesters.indexOf(semester);
    let mods: string[] = [];
    for (let i = 0; i < idx; i++) {
      mods = mods.concat(plan[semesters[i]] || []);
    }
    return mods.map(normalizeModCode);
  };

  // Type definition for prerequisite tree structure
  type PrereqTree = string | PrereqTree[] | { and: PrereqTree[] } | { or: PrereqTree[] };

  const getUnmetPrereqs = (tree: PrereqTree, planned: string[]): string[] => {
    if (typeof tree === "string") {
      const modOnly = normalizeModCode(tree);
      return planned.includes(modOnly) ? [] : [tree.toUpperCase()];
    }
    if (Array.isArray(tree)) {
      return tree.flatMap((sub: PrereqTree) => getUnmetPrereqs(sub, planned));
    }
    if (typeof tree === "object" && tree !== null) {
      if ('and' in tree) {
        return tree.and.flatMap((sub: PrereqTree) => getUnmetPrereqs(sub, planned));
      }
      if ('or' in tree) {
        const unmet = tree.or.filter((sub: PrereqTree) => getUnmetPrereqs(sub, planned).length > 0);
        return unmet.length === tree.or.length ? tree.or.flatMap((sub: PrereqTree) => getUnmetPrereqs(sub, planned)) : [];
      }
    }
    return [];
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
      const unmet: string[] = [];
      let unmetPrereqs: string[] = [];
      // Check prerequisites (improved logic)
      if (modInfo.prereqTree) {
        const planned = getPlannedModulesBefore(selectedSemester);
        // Improved check: match normalized codes
        const checkTree = (tree: PrereqTree): boolean => {
          if (typeof tree === "string") {
            return planned.includes(normalizeModCode(tree));
          }
          if (Array.isArray(tree)) return tree.every(checkTree);
          if (typeof tree === "object" && tree !== null) {
            if ('and' in tree) return tree.and.every(checkTree);
            if ('or' in tree) return tree.or.some(checkTree);
          }
          return true;
        };
        if (!checkTree(modInfo.prereqTree)) {
          unmet.push("prerequisites");
          // Show only unique, normalized codes for unmet prereqs
          unmetPrereqs = Array.from(new Set(getUnmetPrereqs(modInfo.prereqTree, planned).map(normalizeModCode)));
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
        let msg = `${modCode}: Unmet ${unmet.join(" and ")}`;
        if (unmetPrereqs.length > 0) {
          msg += `\nYou need to complete: ${unmetPrereqs.join(", ")}`;
        }
        alert(msg);
        setModuleInput("");
        return;
      }
      setPlan((prev) => ({
        ...prev,
        [selectedSemester]: [...(prev[selectedSemester] || []), modCode],
      }));
      setWarnings((prev) => prev.filter((w) => w.module !== modCode));
      setModuleInput("");
    } catch {
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
    } catch {
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
    } catch {
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
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link to="/">
            <button className="glass-card px-6 py-3 text-white font-semibold hover:scale-105 transition-transform flex items-center gap-2">
              ← Back to Home
            </button>
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">📚 Module Planner</h1>
          <div className="w-32"></div> {/* Spacer for centering */}
        </div>

        {/* Progress Bar */}
        <div className="glass-card p-8 mb-8 animate-fade-in">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 text-center">🎓 Graduation Progress</h2>
          <div className="w-full bg-gray-200 rounded-full h-8 mb-3 overflow-hidden shadow-inner">
            <div
              className="bg-gradient-to-r from-green-400 to-blue-500 h-8 rounded-full transition-all duration-700 ease-out flex items-center justify-end pr-3"
              style={{ width: `${progressPercent}%` }}
            >
              {progressPercent > 10 && (
                <span className="text-white font-bold text-sm">{progressPercent}%</span>
              )}
            </div>
          </div>
          <div className="text-center text-gray-700 text-lg font-semibold">
            <span className="text-2xl font-bold text-purple-700">{completedModules}</span>
            <span className="mx-2">/</span>
            <span className="text-2xl font-bold text-gray-800">{TOTAL_MODULES_REQUIRED}</span>
            <span className="ml-2">modules completed</span>
          </div>
        </div>

        {/* Add Module Section */}
        <div className="glass-card p-6 mb-8">
          <h3 className="text-xl font-bold mb-4 text-gray-800">➕ Add New Module</h3>
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Semester</label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-purple-500 focus:ring focus:ring-purple-200"
                aria-label="Select a semester"
              >
                {semesters.map((sem) => (
                  <option key={sem} value={sem}>{sem}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Module Code</label>
              <input
                type="text"
                placeholder="e.g. CS1101S"
                value={moduleInput}
                onChange={(e) => setModuleInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addModule()}
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-purple-500 focus:ring focus:ring-purple-200"
                aria-label="Enter module code"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={addModule}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 font-semibold shadow-lg w-full md:w-auto"
              >
                Add Module
              </button>
            </div>
          </div>
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="mb-6 space-y-2">
            {warnings.map((w, idx) => (
              <div key={idx} className="glass-card p-4 border-l-4 border-red-500 bg-red-50/90">
                <p className="text-red-700 font-semibold">
                  ⚠️ {w.module}: {w.message}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8 justify-center flex-wrap">
          <button 
            onClick={savePlan} 
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 font-semibold shadow-lg flex items-center gap-2"
          >
            💾 Save Plan
          </button>
          <button 
            onClick={loadPlan} 
            className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-8 py-3 rounded-xl hover:from-purple-600 hover:to-indigo-700 font-semibold shadow-lg flex items-center gap-2"
          >
            📂 Load Plan
          </button>
        </div>

        {/* Semester Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {semesters.map((sem, idx) => {
            const semModules = plan[sem] || [];
            const semCredits = semModules.length * 4; // Assuming 4 MCs per module
            return (
              <div 
                key={sem} 
                className="glass-card p-6 hover:scale-102 transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-lg text-gray-800">{sem}</h2>
                  <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-semibold">
                    {semCredits} MCs
                  </span>
                </div>
                <div className="space-y-3">
                  {semModules.length === 0 ? (
                    <p className="text-gray-400 italic text-sm text-center py-8">No modules yet</p>
                  ) : (
                    semModules.map((mod, idx) => (
                      <div 
                        key={idx} 
                        className="bg-white/50 p-3 rounded-lg border-l-4 border-purple-500 hover:bg-white/80 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-800">{mod}</span>
                        </div>
                        <select
                          value={grades[mod] || ""}
                          onChange={e => handleGradeChange(mod, e.target.value)}
                          className="mt-2 w-full border rounded-lg px-3 py-2 text-sm bg-white focus:border-purple-500 focus:ring focus:ring-purple-200"
                        >
                          <option value="">Select Grade</option>
                          {gradeOptions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PlannerPage;
