// Attendance Page Logic - Spoken English Attendance App
// Separated from HTML per 00_GLOBAL_RULES.md (Separation of Concerns)
// Written in pure Vanilla JavaScript (No Frameworks)

document.addEventListener("DOMContentLoaded", () => {
  // --- Read URL Parameters ---
  const urlParams = new URLSearchParams(window.location.search);
  const subjectId   = urlParams.get("subject_id");
  const subjectName = urlParams.get("subject_name");
  const day         = urlParams.get("day");
  const dateStr     = urlParams.get("date");

  // --- DOM Elements ---
  const subjectTitleEl    = document.getElementById("subject-title");
  const lectureDayEl      = document.getElementById("lecture-day");
  const lectureDateEl     = document.getElementById("lecture-date");
  const studentCountEl    = document.getElementById("student-count");
  const studentsContainer = document.getElementById("students-container");
  const attendanceForm    = document.getElementById("attendance-form");
  const btnSave           = document.getElementById("btn-save-attendance");
  const btnSaveText       = document.getElementById("btn-save-text");
  const btnSaveSpinner    = document.getElementById("btn-save-spinner");

  // --- Populate page meta info ---
  if (subjectTitleEl) subjectTitleEl.textContent = decodeURIComponent(subjectName || "مادة دراسية");
  if (lectureDayEl)   lectureDayEl.textContent   = "اليوم: " + decodeURIComponent(day || "---");
  if (lectureDateEl)  lectureDateEl.textContent  = "التاريخ: " + (dateStr || "---");

  // --- Load Students ---
  if (subjectId) {
    loadEnrolledStudents();
  } else {
    renderError("لم يتم تحديد مادة دراسية. يرجى العودة واختيار مادة.");
  }

  // --- Fetch enrolled students from Netlify function ---
  async function loadEnrolledStudents() {
    renderLoading();
    try {
      const response = await fetch("/.netlify/functions/get-enrolled-students?subject_id=" + subjectId);
      if (!response.ok) throw new Error("فشل جلب بيانات الطلاب من الخادم");
      const data = await response.json();
      renderStudentRows(data);
    } catch (error) {
      console.error("Error loading students:", error);
      renderError(error.message);
    }
  }

  function renderLoading() {
    if (studentsContainer) {
      studentsContainer.innerHTML = `
        <div class="loading-message">
          <div class="loading-spinner"></div>
          <p>جاري تحميل قائمة الطلاب...</p>
        </div>`;
    }
  }

  function renderError(msg) {
    if (studentsContainer) {
      studentsContainer.innerHTML = `
        <div class="loading-message" style="color: var(--primary-red);">
          <span style="font-size:2rem;">&#9888;</span>
          <p>${msg}</p>
        </div>`;
    }
  }

  function renderStudentRows(data) {
    if (!studentsContainer) return;
    studentsContainer.innerHTML = "";

    if (studentCountEl) studentCountEl.textContent = data.length + " طلاب";

    if (data.length === 0) {
      renderError("لا يوجد طلاب مسجلين في هذه المادة حالياً.");
      return;
    }

    data.forEach(student => {
      const row = document.createElement("div");
      row.className = "attendance-row";
      row.innerHTML = `
        <span class="attendance-row-name">${student.full_name}</span>
        <div class="attendance-row-actions" dir="ltr">
          <label class="attendance-radio-label">
            <input type="radio" name="attendance_${student.id}" value="absent" class="attendance-radio">
            <span class="radio-badge radio-absent">غائب</span>
          </label>
          <label class="attendance-radio-label">
            <input type="radio" name="attendance_${student.id}" value="present" checked class="attendance-radio">
            <span class="radio-badge radio-present">حاضر</span>
          </label>
        </div>`;
      studentsContainer.appendChild(row);
    });
  }

  // --- Submit Handler ---
  if (attendanceForm) {
    attendanceForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const payload = { subject_id: parseInt(subjectId), date: dateStr, records: [] };

      document.querySelectorAll("input[type=radio]:checked").forEach(radio => {
        const studentId = radio.name.split("_")[1];
        payload.records.push({ student_id: parseInt(studentId), status: radio.value });
      });

      setSavingState(true);
      try {
        const response = await fetch("/.netlify/functions/save-attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (response.ok) {
          showToast("تم حفظ تقرير الحضور والغياب بنجاح", "success");
          setTimeout(() => { window.location.href = "./subjects.html"; }, 1800);
        } else {
          throw new Error(result.error || "حدث خطأ في الحفظ");
        }
      } catch (error) {
        console.error("Error saving attendance:", error);
        showToast("خطأ: " + error.message, "error");
        setSavingState(false);
      }
    });
  }

  function setSavingState(isSaving) {
    if (!btnSave) return;
    btnSave.disabled = isSaving;
    if (btnSaveSpinner) btnSaveSpinner.style.display = isSaving ? "block" : "none";
    if (btnSaveText) btnSaveText.textContent = isSaving ? "جاري الحفظ..." : "حفظ تقرير الحضور";
  }

  function showToast(message, type) {
    type = type || "success";
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      document.body.appendChild(container);
    }
    const toast = document.createElement("div");
    toast.className = "toast toast-" + type;
    toast.innerHTML = `<span>${type === "success" ? "&#10003;" : "&#9888;"}</span><div>${message}</div><div class="toast-progress"></div>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = "slideUp 0.3s ease reverse forwards";
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
});
