// Utility script to verify and fix createdAt timestamps in indigenousPeople collection
// Run this with: node fix-missing-createdAt.js

import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc, Timestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAgviSnkIO5F_uinfJXEch9flf38osxgs8",
  authDomain: "bantay-lahi-project.firebaseapp.com",
  projectId: "bantay-lahi-project",
  storageBucket: "bantay-lahi-project.firebasestorage.app",
  messagingSenderId: "490782422814",
  appId: "1:490782422814:web:607aa9fe5b59ba823f7b0f",
  measurementId: "G-9K2VVX5XVG",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function formatTimestamp(timestamp) {
  if (!timestamp) return "null";
  if (timestamp.toDate) {
    return timestamp.toDate().toISOString();
  }
  if (timestamp.seconds) {
    return new Date(timestamp.seconds * 1000).toISOString();
  }
  return String(timestamp);
}

async function analyzeAndFixTimestamps() {
  console.log("🔍 Analyzing createdAt timestamps in indigenousPeople collection...\n");

  try {
    const querySnapshot = await getDocs(collection(db, "indigenousPeople"));
    console.log(`Found ${querySnapshot.size} total documents\n`);
    console.log("=" .repeat(80));

    let missingCount = 0;
    let invalidFormatCount = 0;
    let validCount = 0;
    let fixedCount = 0;

    // Collect all documents with their timestamps
    const docs = [];
    for (const docSnap of querySnapshot.docs) {
      const data = docSnap.data();
      docs.push({
        id: docSnap.id,
        firstName: data.firstName || "Unknown",
        lastName: data.lastName || "Unknown",
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        data: data
      });
    }

    // Sort by createdAt to see the order
    docs.sort((a, b) => {
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return bTime - aTime; // Descending order (newest first)
    });

    console.log("\n📋 Documents ordered by createdAt (newest first):\n");

    for (let i = 0; i < docs.length; i++) {
      const { id, firstName, lastName, createdAt, updatedAt } = docs[i];
      const isLatest = i === 0;

      console.log(`${isLatest ? "🔥" : "  "} ${i + 1}. ${firstName} ${lastName}`);
      console.log(`     ID: ${id}`);

      if (!createdAt) {
        missingCount++;
        console.log(`     ❌ createdAt: MISSING`);
        console.log(`     updatedAt: ${formatTimestamp(updatedAt)}`);

        // Fix: Use updatedAt or current time
        console.log(`     🔧 Will fix: Using updatedAt or current timestamp`);
      } else if (createdAt.seconds && createdAt.nanoseconds !== undefined) {
        // Valid Firestore Timestamp
        validCount++;
        console.log(`     ✅ createdAt: ${formatTimestamp(createdAt)}`);
        console.log(`        (timestamp: ${createdAt.seconds})`);
      } else {
        // Invalid format
        invalidFormatCount++;
        console.log(`     ⚠️  createdAt: INVALID FORMAT`);
        console.log(`        Type: ${typeof createdAt}`);
        console.log(`        Value: ${JSON.stringify(createdAt)}`);
        console.log(`     🔧 Will fix: Convert to proper Firestore Timestamp`);
      }

      console.log("");
    }

    console.log("=" .repeat(80));
    console.log(`\n📊 Summary:`);
    console.log(`   Total documents: ${querySnapshot.size}`);
    console.log(`   Valid timestamps: ${validCount}`);
    console.log(`   Missing createdAt: ${missingCount}`);
    console.log(`   Invalid format: ${invalidFormatCount}`);
    console.log(`   Need fixing: ${missingCount + invalidFormatCount}`);

    // Ask for confirmation
    console.log(`\n❓ Do you want to fix ${missingCount + invalidFormatCount} documents?`);
    console.log(`   This will set createdAt to:`)
    console.log(`   - updatedAt value (if available)`);
    console.log(`   - Current timestamp (if updatedAt is missing)`);
    console.log(`\n⚠️  Press Ctrl+C to cancel, or wait 5 seconds to continue...\n`);

    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log("🔧 Starting fixes...\n");

    for (const { id, firstName, lastName, createdAt, updatedAt } of docs) {
      if (!createdAt || !createdAt.seconds) {
        try {
          // Use updatedAt if it's a valid timestamp, otherwise use current time
          let newTimestamp;
          if (updatedAt && updatedAt.seconds) {
            newTimestamp = updatedAt;
          } else {
            newTimestamp = Timestamp.now();
          }

          await updateDoc(doc(db, "indigenousPeople", id), {
            createdAt: newTimestamp
          });

          fixedCount++;
          console.log(`✅ Fixed: ${firstName} ${lastName} (${id})`);
          console.log(`   Set createdAt to: ${formatTimestamp(newTimestamp)}\n`);
        } catch (err) {
          console.error(`❌ Error fixing ${id}:`, err.message);
        }
      }
    }

    console.log("=" .repeat(80));
    console.log(`\n✨ Complete!`);
    console.log(`   Fixed: ${fixedCount} documents`);
    console.log(`\n💡 Now refresh your app to see the latest data entry update correctly!\n`);

  } catch (error) {
    console.error("Error:", error);
  }

  process.exit(0);
}

analyzeAndFixTimestamps();
