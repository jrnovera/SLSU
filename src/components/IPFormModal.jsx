import React, { useState, useEffect, useRef } from "react";
import { allBarangays } from "./Brgylist";
import { serverTimestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import CameraCaptureModal from "./CameraCaptureModal"; // ⬅️ new

// default structure for family tree (ensures same fields in Add & Update)
const FAMILY_DEFAULT = {
  grandfather: "",
  grandmother: "",
  father: "",
  mother: "",
  siblings: "", // shown as comma string in the form
  spouse: "",
  children: "", // shown as comma string in the form
};

function IPFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEditing = false,
  selectedBarangay = null,
}) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    dateOfBirth: "",
    age: "",
    gender: "",
    civilStatus: "",
    educationLevel: "",
    occupation: "",
    lineage: "",
    barangay: selectedBarangay ? selectedBarangay.name : "",
    address: "",
    municipality: "Catanauan",
    province: "Quezon",
    healthCondition: "",
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

  // blob url cleanup
  const objectUrlRef = useRef(null);

  // helpers
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
      ? val
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
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

  // prefill (edit) + selected barangay
  useEffect(() => {
    if (isEditing && initialData) {
      const ft = { ...FAMILY_DEFAULT, ...(initialData.familyTree || {}) };
      const familyTreeForForm = {
        ...ft,
        siblings: Array.isArray(ft.siblings)
          ? ft.siblings.join(", ")
          : ft.siblings ?? "",
        children: Array.isArray(ft.children)
          ? ft.children.join(", ")
          : ft.children ?? "",
      };

      const computedAge = initialData.dateOfBirth
        ? calculateAge(initialData.dateOfBirth)
        : initialData.age ?? "";

      setFormData((prev) => ({
        ...prev,
        ...initialData,
        age: computedAge,
        contactNumber: initialData.contactNumber || "",
        familyTree: familyTreeForForm,
        photoURL: initialData.photoURL || "",
      }));

      setPhotoPreview(initialData.photoURL || "");
    } else if (!isEditing && selectedBarangay) {
      setFormData((prev) => ({ ...prev, barangay: selectedBarangay.name }));
    }
  }, [isEditing, initialData, selectedBarangay]);

  // lock body scroll while modal open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  // cleanup blob url on unmount
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

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

  // ---------- FILE UPLOAD ----------
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
    // keep formData.photoURL if editing and user had an existing url; clearing preview only clears selected new photo
  };

  // ---------- SUBMIT ----------
  const handleSubmit = async (e) => {
    e.preventDefault();

    const normalizedFamily = {
      ...formData.familyTree,
      siblings: toArrayFromCommaString(formData.familyTree.siblings),
      children: toArrayFromCommaString(formData.familyTree.children),
    };

    const normalizedAge =
      formData.age === "" || formData.age === null ? null : Number(formData.age);
    const normalizedHousehold =
      formData.householdMembers === "" || formData.householdMembers === null
        ? null
        : Number(formData.householdMembers);

    // Upload photo if new file selected
    let photoURL = formData.photoURL || "";
    if (photoFile) {
      try {
        const storage = getStorage();
        const ext = (photoFile.name.split(".").pop() || "jpg").toLowerCase();
        const safeFirst = (formData.firstName || "ip")
          .replace(/\s+/g, "_")
          .toLowerCase();
        const safeLast = (formData.lastName || "record")
          .replace(/\s+/g, "_")
          .toLowerCase();
        const path = `ip_photos/${Date.now()}_${safeLast}_${safeFirst}.${ext}`;
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, photoFile);
        photoURL = await getDownloadURL(storageRef);
      } catch (err) {
        console.error("Photo upload failed:", err);
        setUploadError(
          "Upload failed. You can submit again or save without a new photo."
        );
        // proceed with existing photoURL (if any)
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

    await onSubmit(payload);
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

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div className="grid grid-cols-12 gap-4 items-center">
            <label className="col-span-3 font-semibold text-gray-700">
              Name:
            </label>
            <div className="col-span-9 grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                name="lastName"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                className="input-style"
              />
              <input
                type="text"
                name="firstName"
                placeholder="First Name"
                value={formData.firstName}
                onChange={handleInputChange}
                required
                className="input-style"
              />
              <input
                type="text"
                name="middleName"
                placeholder="Middle Name"
                value={formData.middleName}
                onChange={handleInputChange}
                className="input-style"
              />
            </div>
          </div>

          {/* Photo (upload + camera modal) */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <label className="col-span-3 font-semibold text-gray-700">Photo:</label>

            <div className="col-span-9">
              <div className="flex flex-wrap items-center gap-6">
                {/* Avatar preview */}
                <div className="relative h-24 w-24 rounded-full overflow-hidden ring-2 ring-slate-200 bg-slate-100 flex items-center justify-center">
                  {photoPreview || formData.photoURL ? (
                    <img
                      src={photoPreview || formData.photoURL}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-gray-400">No photo</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    {/* Custom upload button + hidden file input */}
                    <label
                      htmlFor="ip-photo-input"
                      className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      Upload
                      <input
                        id="ip-photo-input"
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handlePhotoChange}
                        className="sr-only"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => setShowCameraModal(true)}
                      style={{ fontSize: 13, lineHeight: 1, borderRadius: "0.375rem" }}
                      className="rounded-md bg-[#6998ab] px-3 font-medium text-white hover:bg-[#194d62] h-8"
                    >
                      Use Camera
                    </button>

                    {(photoPreview || formData.photoURL) && (
                      <button
                        type="button"
                        onClick={removePhoto}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {/* File name / state */}
                  <p className="text-xs text-slate-500 truncate max-w-[320px]">
                    {photoFile?.name
                      ? photoFile.name
                      : formData.photoURL
                      ? "Existing photo"
                      : "No file selected"}
                  </p>

                  {uploadError && (
                    <p className="text-xs text-red-600">{uploadError}</p>
                  )}
                </div>
              </div>
            </div>
          </div>


          {/* Birth and Age */}
          <div className="grid grid-cols-12 gap-4 items-center">
            <label className="col-span-3 font-semibold text-gray-700">
              Date of Birth:
            </label>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleInputChange}
              required
              className="col-span-4 input-style"
            />
            <label className="col-span-1 font-semibold text-gray-700 text-right">
              Age:
            </label>
            <input
              type="number"
              name="age"
              placeholder="Age"
              value={formData.age}
              readOnly
              required
              className="col-span-4 input-style bg-gray-100"
            />
          </div>

          {/* Gender */}
          <div className="grid grid-cols-12 gap-4 items-center">
            <label className="col-span-3 font-semibold text-gray-700">
              Gender:
            </label>
            <div className="col-span-9 flex gap-4">
              {["Male", "Female"].map((val) => (
                <label
                  key={val}
                  className={`radio-style ${
                    formData.gender === val ? "active-radio" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="gender"
                    className="mr-2"
                    checked={formData.gender === val}
                    onChange={() => handleRadioChange("gender", val)}
                  />
                  <span className="ml-1">{val}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Civil Status */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <label className="col-span-3 font-semibold text-gray-700">
              Civil Status:
            </label>
            <div className="col-span-9 grid grid-cols-2 md:grid-cols-4 gap-2">
              {["Single", "Married", "Widowed", "Separated"].map((val) => (
                <label
                  key={val}
                  className={`radio-style ${
                    formData.civilStatus === val ? "active-radio" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="civilStatus"
                    className="mr-2"
                    checked={formData.civilStatus === val}
                    onChange={() => handleRadioChange("civilStatus", val)}
                  />
                  <span className="ml-1">{val}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Education */}
          <div className="grid grid-cols-12 gap-4 items-start">
            <label className="col-span-3 font-semibold text-gray-700">
              Education Level:
            </label>
            <div className="col-span-9 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {[
                "No Formal Education",
                "Elementary",
                "High School",
                "College",
                "Vocational",
              ].map((val) => (
                <label
                  key={val}
                  className={`radio-style ${
                    formData.educationLevel === val ? "active-radio" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="educationLevel"
                    className="mr-2"
                    checked={formData.educationLevel === val}
                    onChange={() =>
                      handleRadioChange("educationLevel", val)
                    }
                  />
                  <span className="ml-1">{val}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Occupation */}
          <div className="grid grid-cols-12 gap-4 items-center">
            <label className="col-span-3 font-semibold text-gray-700">
              Occupation:
            </label>
            <input
              type="text"
              name="occupation"
              value={formData.occupation}
              onChange={handleInputChange}
              className="col-span-9 input-style"
            />
          </div>

          {/* Lineage */}
          <div className="grid grid-cols-12 gap-4 items-center">
            <label className="col-span-3 font-semibold text-gray-700">
              Lineage:
            </label>
            <input
              type="text"
              name="lineage"
              value={formData.lineage}
              onChange={handleInputChange}
              className="col-span-9 input-style"
            />
          </div>

          {/* Barangay */}
          <div className="grid grid-cols-12 gap-4 items-center">
            <label className="col-span-3 font-semibold text-gray-700">
              Barangay:
            </label>
            <select
              name="barangay"
              value={formData.barangay}
              onChange={handleInputChange}
              required
              className="col-span-9 input-style"
            >
              <option value="">Select Barangay</option>
              {allBarangays.map((brgy) => (
                <option key={brgy.id} value={brgy.name}>
                  {brgy.name}
                </option>
              ))}
            </select>
          </div>

          {/* Address */}
          <div className="grid grid-cols-12 gap-4 items-center">
            <label className="col-span-3 font-semibold text-gray-700">
              Address:
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className="col-span-9 input-style"
            />
          </div>

          {/* Health Condition */}
          <div className="grid grid-cols-12 gap-4 items-center">
            <label className="col-span-3 font-semibold text-gray-700">
              Health Condition:
            </label>
            <input
              type="text"
              name="healthCondition"
              value={formData.healthCondition}
              onChange={handleInputChange}
              list="health-options"
              className="col-span-9 input-style w-full"
            />
          </div>

          {/* Household Members */}
          <div className="grid grid-cols-12 gap-4 items-center">
            <label className="col-span-3 font-semibold text-gray-700">
              Household Members:
            </label>
            <input
              type="number"
              name="householdMembers"
              value={formData.householdMembers}
              onChange={handleInputChange}
              min={0}
              step={1}
              className="col-span-9 input-style"
              required
            />
          </div>

          {/* Contact Number */}
          <div className="grid grid-cols-12 gap-4 items-center">
            <label className="col-span-3 font-semibold text-gray-700">
              Contact Number:
            </label>
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
            <label className="col-span-3 font-semibold text-gray-700">
              Municipality:
            </label>
            <input
              type="text"
              name="municipality"
              value={formData.municipality}
              readOnly
              className="col-span-4 input-style"
            />
            <label className="col-span-1 font-semibold text-gray-700 text-right">
              Province:
            </label>
            <input
              type="text"
              name="province"
              value={formData.province}
              readOnly
              className="col-span-4 input-style"
            />
          </div>

          {/* Family Tree */}
            <div className="grid grid-cols-12 gap-4 items-start">
              <label className="col-span-3 font-semibold text-gray-700">
                Family Tree:
              </label>
              <div className="col-span-9 grid grid-cols-2 md:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="grandfather"
                  value={formData.familyTree.grandfather}
                  onChange={(e) => handleFamilyChange("grandfather", e.target.value)}
                  className="input-style"
                />
                <input
                  type="text"
                  placeholder="grandmother"
                  value={formData.familyTree.grandmother}
                  onChange={(e) => handleFamilyChange("grandmother", e.target.value)}
                  className="input-style"
                />
                <input
                  type="text"
                  placeholder="father"
                  value={formData.familyTree.father}
                  onChange={(e) => handleFamilyChange("father", e.target.value)}
                  className="input-style"
                />
                <input
                  type="text"
                  placeholder="mother"
                  value={formData.familyTree.mother}
                  onChange={(e) => handleFamilyChange("mother", e.target.value)}
                  className="input-style"
                />
                <input
                  type="text"
                  placeholder="siblings (comma-separated)"
                  value={formData.familyTree.siblings}
                  onChange={(e) => handleFamilyChange("siblings", e.target.value)}
                  className="input-style"
                />
                <input
                  type="text"
                  placeholder="spouse"
                  value={formData.familyTree.spouse}
                  onChange={(e) => handleFamilyChange("spouse", e.target.value)}
                  className="input-style"
                />
                <input
                  type="text"
                  placeholder="children (comma-separated)"
                  value={formData.familyTree.children}
                  onChange={(e) => handleFamilyChange("children", e.target.value)}
                  className="input-style"
                />
              </div>
            </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => onClose()}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#1a3b5d] text-white rounded hover:bg-[#16304a]"
            >
              {isEditing ? "Update" : "Add"}
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
          // Preview + keep File to upload to Firebase Storage on submit
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
