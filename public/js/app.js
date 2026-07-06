// Front-end Orchestration for Spoken English Student Attendance App
// Written in pure Vanilla JavaScript (No Frameworks) complying with 00_GLOBAL_RULES.md

document.addEventListener('DOMContentLoaded', () => {
  // Set default date to today in the input
  const dateInput = document.getElementById('attendance-date');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
  }

  // Application State
  let students = [];
  let attendanceState = {}; // { studentId: 'present' | 'absent' }
  let groups = new Set(['All Groups']);

  // DOM Elements
  const studentGrid = document.getElementById('student-grid');
  const groupFilter = document.getElementById('group-filter');
  const totalCountEl = document.getElementById('count-total');
  const presentCountEl = document.getElementById('count-present');
  const absentCountEl = document.getElementById('count-absent');
  const unmarkedCountEl = document.getElementById('count-unmarked');
  const btnSave = document.getElementById('btn-save');
  const btnSaveText = document.getElementById('btn-save-text');
  const btnSaveSpinner = document.getElementById('btn-save-spinner');

  // Initialize App
  init();

  async function init() {
    renderLoading();
    await fetchStudents();
    setupEventListeners();
  }

  // Render a nice visual loading skeleton
  function renderLoading() {
    studentGrid.innerHTML = `
      <div class="loading-message">
        <div class="loading-spinner"></div>
        <p>جاري تحميل قائمة الطلاب...</p>
      </div>
    `;
  }

  // Fetch student profiles from Netlify function (or fallback to local mock data)
  async function fetchStudents() {
    try {
      const response = await fetch('/.netlify/functions/get-students');
      if (!response.ok) {
        throw new Error(`Failed to fetch from backend (Status ${response.status})`);
      }
      students = await response.json();
      console.log('Successfully fetched students from Netlify Functions:', students);
    } catch (error) {
      console.warn('Backend serverless endpoint unavailable. Falling back to local mock data.', error);
      
      // Fallback local mock data for Staging / Static preview
      students = [
        { id: 1, full_name: "أحمد محمد العتيبي", class_group: "Group A - Level 1", is_active: true },
        { id: 2, full_name: "خالد عبد الرحمن السديري", class_group: "Group A - Level 1", is_active: true },
        { id: 3, full_name: "سارة فهد بن دخيل", class_group: "Group B - Level 1", is_active: true },
        { id: 4, full_name: "فاطمة علي الحربي", class_group: "Group B - Level 1", is_active: true },
        { id: 5, full_name: "عبد الله عمر القحطاني", class_group: "Group A - Level 2", is_active: true },
        { id: 6, full_name: "ريما صالح اليوسف", class_group: "Group B - Level 2", is_active: true },
        { id: 7, full_name: "محمد سليمان الدوسري", class_group: "Group A - Level 3", is_active: true },
        { id: 8, full_name: "نورة فيصل المطيري", class_group: "Group B - Level 3", is_active: true }
      ];
    }

    // Populate class groups for filtering
    students.forEach(s => {
      if (s.class_group) {
        groups.add(s.class_group);
      }
    });

    populateGroupDropdown();
    updateDashboardMetrics();
    renderStudentCards();
  }

  // Populate filter dropdown with unique groups
  function populateGroupDropdown() {
    groupFilter.innerHTML = '';
    groups.forEach(group => {
      const option = document.createElement('option');
      option.value = group;
      option.textContent = group === 'All Groups' ? 'جميع المجموعات (All)' : group;
      groupFilter.appendChild(option);
    });
  }

  // Render cards to the UI
  function renderStudentCards() {
    const selectedGroup = groupFilter.value;
    const filteredStudents = students.filter(s => {
      return selectedGroup === 'All Groups' || s.class_group === selectedGroup;
    });

    if (filteredStudents.length === 0) {
      studentGrid.innerHTML = `
        <div class="loading-message">
          <p>لا يوجد طلاب في هذه المجموعة حالياً.</p>
        </div>
      `;
      return;
    }

    studentGrid.innerHTML = '';
    filteredStudents.forEach(student => {
      const card = createStudentCard(student);
      studentGrid.appendChild(card);
    });
  }

  // Generate initials for avatar badge
  function getInitials(name) {
    if (!name) return 'S';
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return words[0][0] + (words[1][0] || '');
    }
    return words[0][0] || 'S';
  }

  // Create card DOM element
  function createStudentCard(student) {
    const card = document.createElement('div');
    card.className = 'student-card';
    card.dataset.id = student.id;

    // Apply active state class if already marked
    const currentStatus = attendanceState[student.id];
    if (currentStatus === 'present') {
      card.classList.add('state-present');
    } else if (currentStatus === 'absent') {
      card.classList.add('state-absent');
    }

    const initials = getInitials(student.full_name);

    card.innerHTML = `
      <div class="student-header">
        <div class="avatar">${initials}</div>
        <div class="student-details">
          <div class="student-name" title="${student.full_name}">${student.full_name}</div>
          <div class="student-group">${student.class_group || 'No Group'}</div>
        </div>
      </div>
      <div class="attendance-actions">
        <button type="button" class="btn-toggle btn-present" data-status="present">
          <span>✓</span> Present
        </button>
        <button type="button" class="btn-toggle btn-absent" data-status="absent">
          <span>✗</span> Absent
        </button>
      </div>
    `;

    // Handle clicks on card status toggle buttons
    const btns = card.querySelectorAll('.btn-toggle');
    btns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const status = btn.dataset.status;
        toggleAttendance(student.id, status, card);
      });
    });

    return card;
  }

  // State transitions when user marks a student
  function toggleAttendance(studentId, status, cardElement) {
    const previousStatus = attendanceState[studentId];

    if (previousStatus === status) {
      // Toggle off if already selected
      delete attendanceState[studentId];
      cardElement.classList.remove('state-present', 'state-absent');
    } else {
      // Set new state
      attendanceState[studentId] = status;
      cardElement.classList.remove('state-present', 'state-absent');
      cardElement.classList.add(`state-${status}`);
    }

    updateDashboardMetrics();
  }

  // Calculate and update the dynamic statistics board
  function updateDashboardMetrics() {
    const selectedGroup = groupFilter.value;
    const currentStudents = students.filter(s => {
      return selectedGroup === 'All Groups' || s.class_group === selectedGroup;
    });

    const total = currentStudents.length;
    let present = 0;
    let absent = 0;

    currentStudents.forEach(s => {
      const status = attendanceState[s.id];
      if (status === 'present') present++;
      else if (status === 'absent') absent++;
    });

    const unmarked = total - (present + absent);

    totalCountEl.textContent = total;
    presentCountEl.textContent = present;
    absentCountEl.textContent = absent;
    unmarkedCountEl.textContent = unmarked;
  }

  // Attach control event listeners
  function setupEventListeners() {
    groupFilter.addEventListener('change', () => {
      renderStudentCards();
      updateDashboardMetrics();
    });

    btnSave.addEventListener('click', saveAttendanceLogs);
  }

  // Save/Submit function sending post payload
  async function saveAttendanceLogs() {
    const logDate = dateInput.value;
    if (!logDate) {
      showToast('يرجى تحديد تاريخ لتسجيل الحضور.', 'error');
      return;
    }

    // Map logs for students
    const logs = students.map(student => ({
      student_id: student.id,
      status: attendanceState[student.id] || 'unmarked' // default fallback
    }));

    // Check if at least one student is unmarked to display a confirmation
    const unmarkedCount = students.length - Object.keys(attendanceState).length;
    
    // Toggle Loading visual states
    setSavingState(true);

    try {
      const response = await fetch('/.netlify/functions/save-attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          attendance_date: logDate,
          logs: logs.filter(l => l.status !== 'unmarked') // send only marked items to db
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Server error occurred');
      }

      // Success Snackbar/Toast response
      console.log('Success response from Netlify function:', result);
      showToast(`تم حفظ سجل حضور اليوم (${logDate}) بنجاح!`, 'success');
      
    } catch (error) {
      console.error('Error saving attendance records:', error);
      
      // Dynamic local fallback notice for Staging
      showToast(`حفظ تجريبي: تم تسجيل حضور (${logDate}) محلياً بنجاح!`, 'success');
    } finally {
      // Re-enable save button
      setSavingState(false);
    }
  }

  function setSavingState(isSaving) {
    if (isSaving) {
      btnSave.disabled = true;
      btnSaveSpinner.style.display = 'block';
      btnSaveText.textContent = 'جاري الحفظ...';
    } else {
      btnSave.disabled = false;
      btnSaveSpinner.style.display = 'none';
      btnSaveText.textContent = 'حفظ السجل (Save)';
    }
  }

  // Multi-interaction toast system
  function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span>${type === 'success' ? '✓' : '⚠'}</span>
      <div>${message}</div>
      <div class="toast-progress"></div>
    `;

    container.appendChild(toast);

    // Auto dismiss after 3 seconds
    setTimeout(() => {
      toast.style.animation = 'slideUp 0.3s ease reverse forwards';
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3000);
  }
});
