// FamilyTreeClassic.jsx
import React from "react";
import "./FamilyTree.css";

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
    <div className="tree" style={{ overflowX: "auto", paddingBottom: 8 }}>
      <ul>
        {/* Top: Parents as single combined node (fits the CSS pattern) */}
        <li>
          <a href="#0">{`${father} & ${mother}`}</a>

          {/* Row: Siblings + You + (Spouse) */}
          {(hasSiblings || you || hasSpouse) && (
            <ul>
              {/* Siblings */}
              {hasSiblings &&
                siblings.map((s, i) => (
                  <li key={`sib-${i}`}>
                    <a href="#0">{s}</a>
                  </li>
                ))}

              {/* YOU (children hang from here if any) */}
              <li>
                <a href="#0">{you || "You"}</a>

                {/* Children */}
                {hasChildren && (
                  <ul>
                    {children.map((c, i) => (
                      <li key={`child-${i}`}>
                        <a href="#0">{c}</a>
                      </li>
                    ))}
                  </ul>
                )}
              </li>

              {/* SPOUSE (only if provided). No children hang from spouse here. */}
              {hasSpouse && (
                <li>
                  <a href="#0">{spouse}</a>
                </li>
              )}
            </ul>
          )}
        </li>
      </ul>
    </div>
  );
}
