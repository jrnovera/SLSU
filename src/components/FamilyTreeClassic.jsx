// FamilyTreeClassic.jsx
import React, { useEffect, useState } from "react";
import "./FamilyTree.css";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";

// Icons for family members
const FamilyIcon = ({ type, className = "" }) => {
  const icons = {
    parent: "👨‍👩‍👧‍👦",
    person: "👤",
    you: "🔴", // Red circle for you
    spouse: "👤",
    child: "👶"
  };
  return <span className={`family-icon ${className}`}>{icons[type] || icons.person}</span>;
};

/**
 * Props:
 * father?: string
 * mother?: string
 * you: string
 * spouse?: string
 * siblings?: string[]
 * children?: string[]
 *
 * Behavior:
 * - Parents shown as a single combined node: "Father & Mother"
 *   (matches the CSS which expects a single parent node at the very top)
 * - Siblings render on the same row as YOU (peer nodes under Parents)
 * - Spouse (if provided) renders on the same row as YOU
 * - Children (if any) hang under YOU
 */
export default function FamilyTreeClassic({
  father = "Unknown Father",
  mother = "Unknown Mother",
  you = "You",
  spouse,
  siblings = [],
  children = [],
}) {
  // Tribe stats state
  const [tribeCounts, setTribeCounts] = useState({});
  const [tribeTotal, setTribeTotal] = useState(0);
  const [tribeLoading, setTribeLoading] = useState(false);
  const [tribeError, setTribeError] = useState("");

  // Fetch lineage distribution (all records)
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setTribeLoading(true);
      setTribeError("");
      try {
        const snap = await getDocs(collection(db, "indigenousPeople"));
        const counts = {};
        let total = 0;
        snap.forEach((doc) => {
          const data = doc.data() || {};
          let lin = (data.lineage || "").toString().trim();
          if (!lin) lin = "Unknown";
          counts[lin] = (counts[lin] || 0) + 1;
          total += 1;
        });
        if (!cancelled) {
          setTribeCounts(counts);
          setTribeTotal(total);
        }
      } catch (e) {
        console.error("Failed to load tribe stats", e);
        if (!cancelled) setTribeError(e?.message || "Failed to load tribe stats");
      } finally {
        if (!cancelled) setTribeLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, []);

  const tribeList = Object.entries(tribeCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count, pct: tribeTotal ? ((count / tribeTotal) * 100).toFixed(1) : "0.0" }));

  // show children only if provided
  const hasChildren = Array.isArray(children) && children.length > 0;
  const hasSiblings = Array.isArray(siblings) && siblings.length > 0;
  const hasSpouse = Boolean(spouse && String(spouse).trim());

  return (
    <div className="enhanced-family-tree">
      {/* Tribe Distribution Panel */}
      <div className="tribe-stats-panel" style={{ marginBottom: 16 }}>
        <div className="rounded-md" style={{ border: "1px solid #e5e7eb", background: "#f9fafb", padding: 12 }}>
          <div className="flex items-center justify-between" style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <h3 className="text-sm font-semibold" style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>
              Tribe Distribution — All Records
            </h3>
            <span className="text-xs" style={{ fontSize: 12, color: "#6b7280" }}>Total: {tribeTotal}</span>
          </div>
          {tribeLoading ? (
            <p className="text-xs" style={{ fontSize: 12, color: "#6b7280" }}>Loading tribe distribution…</p>
          ) : tribeError ? (
            <p className="text-xs" style={{ fontSize: 12, color: "#b91c1c" }}>{tribeError}</p>
          ) : tribeTotal === 0 ? (
            <p className="text-xs" style={{ fontSize: 12, color: "#6b7280" }}>No records found.</p>
          ) : tribeList.length === 0 ? (
            <p className="text-xs" style={{ fontSize: 12, color: "#6b7280" }}>No tribe data available.</p>
          ) : (
            <ul className="grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8 }}>
              {tribeList.map(({ name, count, pct }) => (
                <li key={name} className="flex items-center justify-between" style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span className="text-gray-700" style={{ color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
                  <span className="ml-2" style={{ marginLeft: 8, padding: "2px 8px", borderRadius: 9999, background: "#ffffff", border: "1px solid #e5e7eb", color: "#374151" }}>
                    {count} • {pct}%
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="tree-container">
        {/* Parents Level */}
        <div className="generation parents-generation">
          <div className="family-member parents-node">
            <FamilyIcon type="parent" className="parent-icon" />
            <div className="member-info">
              <div className="member-name parents-names">{`${father} & ${mother}`}</div>
              <div className="member-role">Parents</div>
            </div>
          </div>
        </div>

        {/* Connection Line */}
        <div className="connection-line vertical"></div>

        {/* Siblings + You + Spouse Level */}
        {(hasSiblings || you || hasSpouse) && (
          <div className="generation middle-generation">
            <div className="siblings-row">
              {/* Siblings */}
              {hasSiblings &&
                siblings.map((s, i) => (
                  <div key={`sib-${i}`} className="family-member sibling-node">
                    <FamilyIcon type="person" className="sibling-icon" />
                    <div className="member-info">
                      <div className="member-name">{s}</div>
                      <div className="member-role">Sibling</div>
                    </div>
                  </div>
                ))}

              {/* YOU */}
              <div className="family-member you-node highlighted">
                <FamilyIcon type="you" className="you-icon" />
                <div className="member-info">
                  <div className="member-name you-name">{you || "You"}</div>
                  <div className="member-role">You</div>
                </div>
              </div>

              {/* SPOUSE */}
              {hasSpouse && (
                <div className="family-member spouse-node">
                  <FamilyIcon type="spouse" className="spouse-icon" />
                  <div className="member-info">
                    <div className="member-name">{spouse}</div>
                    <div className="member-role">Spouse</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Children Level */}
        {hasChildren && (
          <>
            <div className="connection-line vertical"></div>
            <div className="generation children-generation">
              <div className="children-row">
                {children.map((c, i) => (
                  <div key={`child-${i}`} className="family-member child-node">
                    <FamilyIcon type="child" className="child-icon" />
                    <div className="member-info">
                      <div className="member-name">{c}</div>
                      <div className="member-role">Child</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
