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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-center relative">
            <Link to="/" className="absolute left-0">
              <button className="bg-gray-100 text-gray-700 hover:bg-gray-200">
                ← Home
              </button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 text-center">Module Planner</h1>
            <div className="flex gap-2 absolute right-0">
              <button 
                onClick={savePlan} 
                className="bg-green-600 text-white hover:bg-green-700"
              >
                Save
              </button>
              <button 
                onClick={loadPlan} 
                className="bg-gray-600 text-white hover:bg-gray-700"
              >
                Load
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Card */}
        <div className="clean-card p-6 mb-8 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Graduation Progress</h2>
            <span className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{completedModules}</span> / {TOTAL_MODULES_REQUIRED} modules
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">{progressPercent}% complete</p>
        </div>

        {/* Add Module Card */}
        <div className="clean-card p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Module</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="w-full"
                aria-label="Select a semester"
              >
                {semesters.map((sem) => (
                  <option key={sem} value={sem}>{sem}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Module Code</label>
              <input
                type="text"
                placeholder="e.g. CS1101S"
                value={moduleInput}
                onChange={(e) => setModuleInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addModule()}
                className="w-full"
                aria-label="Enter module code"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={addModule}
                className="bg-blue-600 text-white hover:bg-blue-700 w-full"
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
              <div key={idx} className="clean-card p-4 border-l-4 border-red-500 bg-red-50">
                <p className="text-sm text-red-700 font-medium">
                  {w.module}: {w.message}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Semester Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {semesters.map((sem) => {
            const semModules = plan[sem] || [];
            const semCredits = semModules.length * 4;
            return (
              <div key={sem} className="clean-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-900">{sem}</h2>
                  <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                    {semCredits} MCs
                  </span>
                </div>
                <div className="space-y-2">
                  {semModules.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-6">No modules</p>
                  ) : (
                    semModules.map((mod, idx) => (
                      <div key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <p className="font-medium text-sm text-gray-900 mb-2">{mod}</p>
                        <select
                          value={grades[mod] || ""}
                          onChange={e => handleGradeChange(mod, e.target.value)}
                          className="w-full text-xs"
                        >
                          <option value="">Grade</option>
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
