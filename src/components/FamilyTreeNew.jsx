// FamilyTreeNew.jsx
import React, { useEffect, useState } from "react";
import "./FamilyTreeNew.css";
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
 * A simplified family tree component that matches the design in the image
 */
export default function FamilyTreeNew({
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
    <div className="family-tree-container">
      {/* Tribe Distribution Panel */}
      <div className="tribe-stats-panel">
        <div className="tribe-stats-content">
          <div className="tribe-stats-header">
            <h3>Tribe Distribution — All Records</h3>
            <span>Total: {tribeTotal}</span>
          </div>
          {tribeLoading ? (
            <p>Loading tribe distribution…</p>
          ) : tribeError ? (
            <p className="error">{tribeError}</p>
          ) : tribeTotal === 0 ? (
            <p>No records found.</p>
          ) : tribeList.length === 0 ? (
            <p>No tribe data available.</p>
          ) : (
            <ul className="tribe-list">
              {tribeList.map(({ name, count, pct }) => (
                <li key={name} className="tribe-item">
                  <span>{name}</span>
                  <span className="tribe-count">
                    {count} • {pct}%
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="family-tree">
        <h2>Family Tree</h2>
        
        {/* Parents Level */}
        <div className="parents-level">
          <div className="parent father">
            <div className="person-icon">{icons.person}</div>
            <div className="person-name">{father}</div>
            <div className="person-role">(Father)</div>
          </div>
          
          <div className="parent mother">
            <div className="person-icon">{icons.person}</div>
            <div className="person-name">{mother}</div>
            <div className="person-role">(Mother)</div>
          </div>
        </div>
        
        {/* Vertical connector from parents to middle level */}
        <div className="vertical-connector"></div>
        
        {/* Middle Level with Siblings, You, and Spouse */}
        <div className="middle-level">
          {/* Horizontal line */}
          <div className="horizontal-line"></div>
          
          {/* Siblings */}
          {hasSiblings && siblings.map((sibling, index) => (
            <div key={index} className="person sibling">
              <div className="person-icon">{icons.person}</div>
              <div className="person-name">{sibling}</div>
              <div className="person-role">(Sibling)</div>
            </div>
          ))}
          
          {/* You - positioned below the horizontal line */}
          <div className="person you">
            <div className="person-icon you-icon">{icons.you}</div>
            <div className="person-name you-name">{you}</div>
            <div className="person-role">(You)</div>
          </div>
          
          {/* Spouse */}
          {hasSpouse && (
            <div className="person spouse">
              <div className="person-icon">{icons.person}</div>
              <div className="person-name">{spouse}</div>
              <div className="person-role">(Spouse)</div>
            </div>
          )}
        </div>
        
        {/* Vertical connector from you to children */}
        {hasChildren && <div className="vertical-connector"></div>}
        
        {/* Children Level */}
        {hasChildren && (
          <div className="children-level">
            {children.map((child, index) => (
              <div key={index} className="person child">
                <div className="person-icon">{icons.child}</div>
                <div className="person-name">{child}</div>
                <div className="person-role">(Child)</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Icons for the family tree
const icons = {
  person: "👤",
  you: "🔴",
  child: "👶"
};
