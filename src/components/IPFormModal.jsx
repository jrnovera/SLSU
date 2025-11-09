import React, { useState, useEffect, useRef } from "react";
import { allBarangays } from "./Brgylist";
import { serverTimestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase/config";
import { useAuth } from "../contexts/AuthContext";
import CameraCaptureModal from "./CameraCaptureModal"; // ⬅️ camera modal

// Lineage options based on provided list
const LINEAGE_OPTIONS = [
  "Adasen",
  "Abelling/Aborlin",
  "Aeta",
  "Aeta/Agta/Ayta",
  "Abiyan",
  "Agutaynon",
  "Agta",
  "Agta-Tabangnon",
  "Agta-Cimaron",
  "Alangan (Mangyan)",
  "Applai",
  "Ata-Matigsalog",
  "Ati",
  "Arumanen",
  "Ayangan",
  "Binongan",
  "Bago",
  "Bangon (Mangyan)",
  "Bontoc",
  "Balatoc",
  "Baliwen",
  "Baluga",
  "Batak",
  "Batangan/Tao Buid",
  "Buhid (Mangyan)",
  "Balangao",
  "Bantoanon",
  "Bukidnon",
  "Badjao",
  "Banac",
  "Bâ€™laan",
  "Bagobo",
  "Banwaon",
  "Calinga",
  "Cuyonon",
  "Camiguin",
  "Danao",
  "Dibabawon",
  "Dumagat",
  "Eskaya",
  "Gubang",
  "Gaddang",
  "Giangan",
  "Guiangan-Clata",
  "Gubatnon (Mangyan)",
  "Hanunuo (Mangyan)",
  "Hanglulo",
  "Higaonon",
  "Itneg",
  "Inlaud",
  "Ibaloi",
  "Ibanag",
  "Itawes",
  "Ikalahan",
  "Ilongot/Bugkalot",
  "Isinai",
  "Isneg/Apayao",
  "Isneg (or Isnag)",
  "Iwak",
  "Iraya (Mangyan)",
  "Itom",
  "Ilianen",
  "Ivatan",
  "Ifugao",
  "Kalinga",
  "Kankanaey",
  "Kankaney",
  "Kalanguya",
  "Kalibugan",
  "Kabihug",
  "Kalagan",
  "Karao",
  "Kaylawan",
  "Kalamianen",
  "Langilan",
  "Masadiit",
  "Maeng",
  "Mabaca",
  "Malaueg",
  "Magahat/Corolanos",
  "Manobo",
  "Manobo-Blit",
  "Mangguangan",
  "Mamanwa",
  "Mansaka",
  "Matigsalog",
  "Mandaya",
  "Molbog",
  "Pullon",
  "Palawanon",
  "Remontado",
  "Ratagnon (Mangyan)",
  "Sulod-Bukidnon",
  "Sama-Badjao",
  "Sama-Bangingi",
  "Sama/Kalibugan",
  "Subanen",
  "Sangil",
  "Tadyawan (Mangyan)",
  "Tagabawa",
  "Tagbanwa",
  "Tagakaolo",
  "Talaandig",
  "Talaingod",
  "Tâ€™boli",
  "Taoâ€™t Bato",
  "Tasaday",
  "Tigwayanon",
  "Tingguian",
  "Tingguian (Itneg)",
  "Tiruray/Teduray",
  "Tuwali",
  "Umayamnon",
  "Ubo",
  "Yogad"
];

const FAMILY_DEFAULT = {
  father: "",
  mother: "",
  siblings: "",
  spouse: "",
  children: "",
};

function IPFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEditing = false,
  selectedBarangay = null,
}) {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    dateOfBirth: "",
    age: "",
    gender: "",
    civilStatus: "",
    isStudent: "",
    educationLevel: "",
    schoolName: "",
    isEmployed: "", // true or false
    occupation: "", // Occupation details
    lineage: "",
    barangay: selectedBarangay ? selectedBarangay.name : "",
    address: "",
    municipality: "Catanauan",
    province: "Quezon",
    healthCondition: "", // "Healthy" or "Not Healthy"
    healthConditionDetails: "", // Details when "Not Healthy"
    householdMembers: "",
    contactNumber: "",
    familyTree: { ...FAMILY_DEFAULT },
    photoURL: "",
  });

  // photo state
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [uploadError, setUploadError] = useState("");

  // camera modal
  const [showCameraModal, setShowCameraModal] = useState(false);

  // Tribe suggestions state
  const [tribeSuggestions, setTribeSuggestions] = useState([]);
  const [showTribeSuggestions, setShowTribeSuggestions] = useState(false);
  const tribeInputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // submit guard
  const [isSaving, setIsSaving] = useState(false);

  // blob url cleanup
  const objectUrlRef = useRef(null);

  // reset helper for new entry
  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      middleName: "",
      dateOfBirth: "",
      age: "",
      gender: "",
      civilStatus: "",
      isStudent: "",
      educationLevel: "",
      schoolName: "",
      isEmployed: "",
      occupation: "",
      lineage: "",
      barangay: selectedBarangay ? selectedBarangay.name : "",
      address: "",
      municipality: "Catanauan",
      province: "Quezon",
      healthCondition: "",
      healthConditionDetails: "",
      householdMembers: "",
      contactNumber: "",
      familyTree: { ...FAMILY_DEFAULT },
      photoURL: "",
    });
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = null;
    setPhotoFile(null);
    setPhotoPreview("");
    setUploadError("");
  };

  /* helpers */
  const calculateAge = (dob) => {
    if (!dob) return "";
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return "";
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age < 0 ? "" : age;
  };

  const toArrayFromCommaString = (val) =>
    typeof val === "string"
      ? val.split(",").map((s) => s.trim()).filter(Boolean)
      : Array.isArray(val)
      ? val
      : [];

  const normalizePhone = (raw) => {
    if (!raw) return "";
    const v = String(raw).replace(/\s|-/g, "");
    if (v.startsWith("+63") && v.length === 13) return v;
    if (v.startsWith("09") && v.length === 11) return `+63${v.slice(1)}`;
    return v;
  };

  /* prefill (edit) + selected barangay */
  useEffect(() => {
    if (isEditing && initialData) {
      const ft = { ...FAMILY_DEFAULT, ...(initialData.familyTree || {}) };
      const familyTreeForForm = {
        ...ft,
        siblings: Array.isArray(ft.siblings) ? ft.siblings.join(", ") : (ft.siblings ?? ""),
        children: Array.isArray(ft.children) ? ft.children.join(", ") : (ft.children ?? ""),
      };

      const computedAge = initialData.dateOfBirth
        ? calculateAge(initialData.dateOfBirth)
        : (initialData.age ?? "");

      // Handle legacy healthCondition data
      let healthCondition = initialData.healthCondition || "";
      let healthConditionDetails = initialData.healthConditionDetails || "";

      // If healthCondition is not "Healthy" or "Not Healthy", convert legacy data
      if (healthCondition && healthCondition !== "Healthy" && healthCondition !== "Not Healthy") {
        const normalized = String(healthCondition).trim().toLowerCase();
        if (!normalized || normalized === 'n/a' || normalized === 'na' ||
            normalized === 'none' || normalized === 'healthy' ||
            normalized === 'no health condition' || normalized === 'no health' ||
            normalized === 'no condition' || normalized === 'good' ||
            normalized === '-' || normalized === 'normal') {
          healthCondition = "Healthy";
          healthConditionDetails = "";
        } else {
          healthConditionDetails = initialData.healthCondition;
          healthCondition = "Not Healthy";
        }
      }

      // Handle employment status - convert legacy occupation data
      let isEmployed = initialData.isEmployed;
      let occupation = initialData.occupation || "";

      // If isEmployed is not set (legacy data), determine from occupation
      if (isEmployed === undefined || isEmployed === null || isEmployed === "") {
        const normalized = String(occupation).trim().toLowerCase();
        if (!normalized || normalized === 'n/a' || normalized === 'na' ||
            normalized === 'none' || normalized === '-' || normalized === 'wala') {
          isEmployed = false;
          occupation = "";
        } else {
          isEmployed = true;
        }
      }

      setFormData((prev) => ({
        ...prev,
        ...initialData,
        age: computedAge,
        contactNumber: initialData.contactNumber || "",
        familyTree: familyTreeForForm,
        photoURL: initialData.photoURL || "",
        healthCondition: healthCondition,
        healthConditionDetails: healthConditionDetails,
        isEmployed: isEmployed,
        occupation: occupation,
      }));

      setPhotoPreview(initialData.photoURL || "");
    } else if (!isEditing && selectedBarangay) {
      setFormData((prev) => ({ ...prev, barangay: selectedBarangay.name }));
    }
  }, [isEditing, initialData, selectedBarangay]);

  /* lock body scroll while modal open */
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "auto";
    return () => { document.body.style.overflow = "auto"; };
  }, [isOpen]);

  // When opening for a new add, ensure a fresh empty form
  useEffect(() => {
    if (isOpen && !isEditing) {
      resetForm();
    }
  }, [isOpen, isEditing, selectedBarangay]);

  /* cleanup blob url on unmount */
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);
  
  /* Handle tribe search and suggestions */
  const handleTribeSearch = (e) => {
    const searchTerm = e.target.value;
    setFormData(prev => ({ ...prev, lineage: searchTerm }));
    
    if (searchTerm.trim() === '') {
      setTribeSuggestions([]);
      setShowTribeSuggestions(false);
      return;
    }
    
    const filteredSuggestions = LINEAGE_OPTIONS.filter(tribe => 
      tribe.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setTribeSuggestions(filteredSuggestions);
    setShowTribeSuggestions(true);
  };
  
  const handleSelectTribe = (tribe) => {
    setFormData(prev => ({ ...prev, lineage: tribe }));
    setShowTribeSuggestions(false);
  };
  
  /* Close tribe suggestions when clicking outside */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target) && 
          tribeInputRef.current && !tribeInputRef.current.contains(e.target)) {
        setShowTribeSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* handlers */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "dateOfBirth") {
      const autoAge = calculateAge(value);
      setFormData((prev) => ({ ...prev, dateOfBirth: value, age: autoAge }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhoneBlur = () => {
    setFormData((prev) => ({
      ...prev,
      contactNumber: normalizePhone(prev.contactNumber),
    }));
  };

  const handleRadioChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFamilyChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      familyTree: { ...prev.familyTree, [field]: value },
    }));
  };

  /* FILE UPLOAD */
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    setUploadError("");
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const maxMB = 5;

    if (!validTypes.includes(file.type)) {
      setUploadError("Please select a JPG, PNG, WEBP, or GIF image.");
      return;
    }
    if (file.size > maxMB * 1024 * 1024) {
      setUploadError(`Image must be ≤ ${maxMB}MB.`);
      return;
    }

    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;

    setPhotoFile(file);
    setPhotoPreview(url);
  };

  const removePhoto = () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = null;
    setPhotoFile(null);
    setPhotoPreview("");
    setUploadError("");
    // Keep formData.photoURL (existing) intact so edit still has previous photo unless you capture a new one.
  };

  /* SUBMIT */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSaving) return;

    setUploadError("");
    setIsSaving(true);

    try {
      // Ensure we have an authenticated user (rules may require request.auth)
      if (!currentUser) {
        setUploadError("Authentication not ready. Please wait a moment and try again.");
        return;
      }
      // Prefer DOB-derived age when DOB is provided; otherwise use manual age input
      const computedAgeOnSubmit = formData.dateOfBirth ? calculateAge(formData.dateOfBirth) : "";

      const normalizedFamily = {
        ...formData.familyTree,
        siblings: toArrayFromCommaString(formData.familyTree.siblings),
        children: toArrayFromCommaString(formData.familyTree.children),
      };

      const normalizedAge =
        computedAgeOnSubmit !== ""
          ? Number(computedAgeOnSubmit)
          : (formData.age === "" || formData.age === null ? null : Number(formData.age));

      const normalizedHousehold =
        formData.householdMembers === "" || formData.householdMembers === null
          ? null
          : Number(formData.householdMembers);

      // Upload photo if new file selected
      let photoURL = formData.photoURL || "";
      if (photoFile) {
        try {
          const ext = (photoFile.name.split(".").pop() || "jpg").toLowerCase();
          const safeFirst = (formData.firstName || "ip").replace(/\s+/g, "_").toLowerCase();
          const safeLast = (formData.lastName || "record").replace(/\s+/g, "_").toLowerCase();
          const path = `ip_photos/${Date.now()}_${safeLast}_${safeFirst}.${ext}`;
          const storageRef = ref(storage, path);
          const metadata = { contentType: photoFile.type || "image/jpeg" };
          const task = uploadBytesResumable(storageRef, photoFile, metadata);
          await new Promise((resolve, reject) => {
            task.on(
              'state_changed',
              () => {},
              (error) => reject(error),
              async () => {
                try {
                  const url = await getDownloadURL(task.snapshot.ref);
                  photoURL = url;
                  resolve();
                } catch (e) {
                  reject(e);
                }
              }
            );
          });
        } catch (err) {
          console.error("Photo upload failed:", err);
          // Continue submit, keep existing photoURL if any
          const errMsg = err?.code || err?.message || String(err);
          setUploadError(`Photo upload failed: ${errMsg}. You can save without a new photo.`);
        }
      }

      const payload = {
        ...formData,
        contactNumber: normalizePhone(formData.contactNumber || ""),
        age: normalizedAge,
        householdMembers: normalizedHousehold,
        dateOfBirth: formData.dateOfBirth || null,
        familyTree: normalizedFamily,
        photoURL: photoURL || null,
        updatedAt: serverTimestamp(),
        ...(isEditing ? {} : { createdAt: serverTimestamp() }),
      };

      try {
        await onSubmit(payload); // parent handles add/update + closing modal
      } catch (err) {
        console.error("Save failed:", err);
        setUploadError(err?.code || err?.message || "Failed to save. Please try again.");
        return;
      }

      // If this was an Add flow and the modal stays open, clear the form for the next entry
      if (!isEditing) {
        resetForm();
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex justify-center items-center overflow-hidden p-4">
      <div className="relative bg-white w-full max-w-5xl rounded-lg shadow-lg p-6 overflow-y-auto max-h-[90vh]">
        <button
          onClick={() => onClose()}
          className="absolute top-4 right-6 text-gray-400 hover:text-gray-600 text-2xl font-bold focus:outline-none"
          aria-label="Close"
        >
          &times;
        </button>

        <h2 className="text-xl font-semibold text-[#1a3b5d] pb-6">
          {isEditing ? "Edit IP Information" : "Add New Indigenous Person"}
        </h2>

        {/* noValidate stops silent HTML5 blocking; we validate in JS */}
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Name */}
          <div className="grid grid-cols-12 gap-4 items-center">
            <label className="col-span-3 font-semibold text-gray-700">Name:</label>
            <div className="col-span-9 grid grid-cols-1 md:grid-cols-3 gap-3">
              <input type="text" name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleInputChange} required className="input-style" />
              <input type="text" name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleInputChange} required className="input-style" />
              <input type="text" name="middleName" placeholder="Middle Name" value={formData.middleName} onChange={handleInputChange} className="input-style" />
            </div>
          </div>

          {/* Photo (upload + camera modal) */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <label className="col-span-3 font-semibold text-gray-700">Photo:</label>

            <div className="col-span-9">
              <div className="flex flex-wrap items-center gap-6">
                {/* Avatar preview */}
                <div className="relative h-24 w-24 rounded-full overflow-hidden ring-2 ring-slate-200 bg-slate-100 flex items-center justify-center">
                  {(photoPreview || formData.photoURL) ? (
                    <img src={photoPreview || formData.photoURL} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs text-gray-400">No photo</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    {/* Custom upload button + hidden file input */}
                    

                    <button type="button" onClick={() => setShowCameraModal(true)} style={{ fontSize: 13, lineHeight: 1, borderRadius: "0.375rem" }} className="rounded-md bg-[#6998ab] px-3 font-medium text-white hover:bg-[#194d62] h-8">
                      Use Camera
                    </button>

                    {(photoPreview || formData.photoURL) && (
                      <button type="button" onClick={removePhoto} className="text-xs text-red-600 hover:underline">
                        Remove
                      </button>
                    )}
                  </div>

                  {/* File name / state */}
                  <p className="text-xs text-slate-500 truncate max-w-[320px]">
                    {photoFile?.name ? photoFile.name : formData.photoURL ? "Existing photo" : "No file selected"}
                  </p>

                  {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Birth and Age */}
          <div className="grid grid-cols-12 gap-4 items-center">
            <label className="col-span-3 font-semibold text-gray-700">Date of Birth:</label>
            <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange} required className="col-span-4 input-style" />
            <label className="col-span-1 font-semibold text-gray-700 text-right">Age:</label>
            <input type="number" name="age" placeholder="Age" value={formData.age} readOnly className="col-span-4 input-style bg-gray-100 cursor-not-allowed" />
          </div>

          {/* Gender */}
          <div className="grid grid-cols-12 gap-4 items-center">
            <label className="col-span-3 font-semibold text-gray-700">Gender:</label>
            <div className="col-span-9 flex gap-4">
              {["Male", "Female"].map((val) => (
                <label key={val} className={`radio-style ${formData.gender === val ? "active-radio" : ""}`}>
                  <input type="radio" name="gender" className="mr-2" checked={formData.gender === val} onChange={() => handleRadioChange("gender", val)} />
                  <span className="ml-1">{val}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Civil Status */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <label className="col-span-3 font-semibold text-gray-700">Civil Status:</label>
            <div className="col-span-9 grid grid-cols-2 md:grid-cols-4 gap-2">
              {["Single", "Married", "Widowed", "Separated"].map((val) => (
                <label key={val} className={`radio-style ${formData.civilStatus === val ? "active-radio" : ""}`}>
                  <input type="radio" name="civilStatus" className="mr-2" checked={formData.civilStatus === val} onChange={() => handleRadioChange("civilStatus", val)} />
                  <span className="ml-1">{val}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Student Status */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <label className="col-span-3 font-semibold text-gray-700">Student Status:</label>
            <div className="col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {["Student", "Not Student"].map((val) => (
                <label key={val} className={`radio-style ${formData.isStudent === val ? "active-radio" : ""}`}>
                  <input
                    type="radio"
                    name="isStudent"
                    className="mr-2"
                    checked={formData.isStudent === val}
                    onChange={() => {
                      handleRadioChange("isStudent", val);
                      // Clear education level and school name if "Not Student" is selected
                      if (val === "Not Student") {
                        setFormData(prev => ({
                          ...prev,
                          educationLevel: "",
                          schoolName: ""
                        }));
                      }
                    }}
                  />
                  <span className="ml-1">{val}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Education Level - Only show if Student */}
          {formData.isStudent === "Student" && (
            <>
              <div className="grid grid-cols-12 gap-4 items-start">
                <label className="col-span-3 font-semibold text-gray-700">Highest Educational Attainment:</label>
                <div className="col-span-9 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {["Elementary", "High School", "College", "Vocational"].map((val) => (
                    <label key={val} className={`radio-style ${formData.educationLevel === val ? "active-radio" : ""}`}>
                      <input type="radio" name="educationLevel" className="mr-2" checked={formData.educationLevel === val} onChange={() => handleRadioChange("educationLevel", val)} />
                      <span className="ml-1">{val}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* School Name */}
              <div className="grid grid-cols-12 gap-4 items-center">
                <label className="col-span-3 font-semibold text-gray-700">School Name:</label>
                <input
                  type="text"
                  name="schoolName"
                  value={formData.schoolName}
                  onChange={handleInputChange}
                  className="col-span-9 input-style"
                  placeholder="Enter school name"
                />
              </div>
            </>
          )}

          {/* Employment Status */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <label className="col-span-3 font-semibold text-gray-700">Employment Status:</label>
            <div className="col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { label: "Employed", value: true },
                { label: "Unemployed", value: false }
              ].map((option) => (
                <label key={option.label} className={`radio-style ${formData.isEmployed === option.value ? "active-radio" : ""}`}>
                  <input
                    type="radio"
                    name="isEmployed"
                    className="mr-2"
                    checked={formData.isEmployed === option.value}
                    onChange={() => {
                      handleRadioChange("isEmployed", option.value);
                      // Clear occupation if "Unemployed" is selected
                      if (option.value === false) {
                        setFormData(prev => ({
                          ...prev,
                          occupation: ""
                        }));
                      }
                    }}
                  />
                  <span className="ml-1">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Occupation Details - Only show if Employed */}
          {formData.isEmployed === true && (
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className="col-span-3 font-semibold text-gray-700">Please state the Occupation:</label>
              <input
                type="text"
                name="occupation"
                value={formData.occupation}
                onChange={handleInputChange}
                placeholder="Enter occupation"
                className="col-span-9 input-style"
              />
            </div>
          )}

          {/* Lineage */}
          <div className="grid grid-cols-12 gap-4 items-center">
            <label className="col-span-3 font-semibold text-gray-700">Tribe:</label>
            <div className="col-span-9 relative">
              <input
                ref={tribeInputRef}
                type="text"
                name="lineage"
                value={formData.lineage}
                onChange={handleTribeSearch}
                onFocus={() => formData.lineage && setShowTribeSuggestions(true)}
                placeholder="Search for tribe..."
                className="w-full input-style pr-10"
                autoComplete="off"
              />
              {/* Dropdown icon button */}
              <button
                type="button"
                onClick={() => {
                  setTribeSuggestions(LINEAGE_OPTIONS);
                  setShowTribeSuggestions(!showTribeSuggestions);
                  tribeInputRef.current?.focus();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
              {showTribeSuggestions && tribeSuggestions.length > 0 && (
                <div 
                  ref={suggestionsRef}
                  className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
                >
                  {tribeSuggestions.map((tribe, index) => (
                    <div
                      key={index}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleSelectTribe(tribe)}
                    >
                      {tribe}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Barangay */}
          <div className="grid grid-cols-12 gap-4 items-center">
            <label className="col-span-3 font-semibold text-gray-700">Barangay:</label>
            <select name="barangay" value={formData.barangay} onChange={handleInputChange} required className="col-span-9 input-style">
              <option value="">Select Barangay</option>
              {allBarangays.map((brgy) => (
                <option key={brgy.id} value={brgy.name}>{brgy.name}</option>
              ))}
            </select>
          </div>

          {/* Birthplace */}
          <div className="grid grid-cols-12 gap-4 items-center">
            <label className="col-span-3 font-semibold text-gray-700">Birthplace:</label>
            <input type="text" name="address" value={formData.address} onChange={handleInputChange} className="col-span-9 input-style" />
          </div>

          {/* Health Status */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <label className="col-span-3 font-semibold text-gray-700">Health Status:</label>
            <div className="col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {["Healthy", "Not Healthy"].map((val) => (
                <label key={val} className={`radio-style ${formData.healthCondition === val ? "active-radio" : ""}`}>
                  <input
                    type="radio"
                    name="healthCondition"
                    className="mr-2"
                    checked={formData.healthCondition === val}
                    onChange={() => {
                      handleRadioChange("healthCondition", val);
                      // Clear condition details if "Healthy" is selected
                      if (val === "Healthy") {
                        setFormData(prev => ({
                          ...prev,
                          healthConditionDetails: ""
                        }));
                      }
                    }}
                  />
                  <span className="ml-1">{val}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Health Condition Details - Only show if Not Healthy */}
          {formData.healthCondition === "Not Healthy" && (
            <div className="grid grid-cols-12 gap-4 items-center">
              <label className="col-span-3 font-semibold text-gray-700">Please specify Condition:</label>
              <input
                type="text"
                name="healthConditionDetails"
                value={formData.healthConditionDetails}
                onChange={handleInputChange}
                placeholder="Enter health condition"
                className="col-span-9 input-style w-full"
              />
            </div>
          )}

          {/* Household Members (required only on Add to avoid blocking legacy edits) */}
          <div className="grid grid-cols-12 gap-4 items-center">
            <label className="col-span-3 font-semibold text-gray-700">No. of Household Members:</label>
            <input
              type="number"
              name="householdMembers"
              value={formData.householdMembers}
              onChange={handleInputChange}
              min={0}
              step={1}
              className="col-span-9 input-style"
              required={!isEditing}
            />
          </div>

          {/* Contact Number */}
          <div className="grid grid-cols-12 gap-4 items-center">
            <label className="col-span-3 font-semibold text-gray-700">Contact Number:</label>
            <input
              type="tel"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleInputChange}
              onBlur={handlePhoneBlur}
              inputMode="tel"
              autoComplete="tel"
              pattern="^(\+63\d{10}|0\d{10})$"
              title="Enter 11-digit PH number (09XXXXXXXXX) or +639XXXXXXXXX"
              className="col-span-9 input-style"
              required
            />
          </div>

          {/* Municipality + Province */}
          <div className="grid grid-cols-12 gap-4 items-center">
            <label className="col-span-3 font-semibold text-gray-700">Municipality:</label>
            <input type="text" name="municipality" value={formData.municipality} readOnly className="col-span-4 input-style" />
            <label className="col-span-1 font-semibold text-gray-700 text-right">Province:</label>
            <input type="text" name="province" value={formData.province} readOnly className="col-span-4 input-style" />
          </div>

          {/* Family Tree */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <label className="col-span-3 font-semibold text-gray-700">Family Tree:</label>
            <div className="col-span-9 grid grid-cols-2 md:grid-cols-3 gap-2">
              <input type="text" placeholder="father" value={formData.familyTree.father} onChange={(e) => handleFamilyChange("father", e.target.value)} className="input-style" />
              <input type="text" placeholder="mother" value={formData.familyTree.mother} onChange={(e) => handleFamilyChange("mother", e.target.value)} className="input-style" />
              <input type="text" placeholder="siblings (comma-separated)" value={formData.familyTree.siblings} onChange={(e) => handleFamilyChange("siblings", e.target.value)} className="input-style" />
              <input type="text" placeholder="spouse" value={formData.familyTree.spouse} onChange={(e) => handleFamilyChange("spouse", e.target.value)} className="input-style" />
              <input type="text" placeholder="children (comma-separated)" value={formData.familyTree.children} onChange={(e) => handleFamilyChange("children", e.target.value)} className="input-style" />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => onClose()} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className={`px-4 py-2 rounded text-white ${isSaving ? "bg-[#1a3b5d]/60 cursor-not-allowed" : "bg-[#1a3b5d] hover:bg-[#16304a]"}`}
              aria-busy={isSaving}
            >
              {isSaving ? (isEditing ? "Updating…" : "Adding…") : (isEditing ? "Update" : "Add")}
            </button>
          </div>
        </form>
      </div>

      {/* Camera modal */}
      <CameraCaptureModal
        open={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        initialFacingMode="environment"
        onCapture={(file) => {
          if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
          const url = URL.createObjectURL(file);
          objectUrlRef.current = url;
          setPhotoPreview(url);
          setPhotoFile(file);
          setShowCameraModal(false);
        }}
      />
    </div>
  );
}

export default IPFormModal;
