// FamilyTreeClassic.jsx
import React from "react";
import "./FamilyTree.css";

// Icons for family members
const FamilyIcon = ({ type, className = "" }) => {
  const icons = {
    parent: "👨‍👩‍👧‍👦",
    person: "👤",
    you: "🔴",
    spouse: "💑",
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
  // show children only if provided
  const hasChildren = Array.isArray(children) && children.length > 0;
  const hasSiblings = Array.isArray(siblings) && siblings.length > 0;
  const hasSpouse = Boolean(spouse && String(spouse).trim());

  return (
    <div className="enhanced-family-tree">
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
