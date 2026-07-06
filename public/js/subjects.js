// Subjects Grid Operations Controller
// Written in pure Vanilla JavaScript (No Frameworks) complying with 00_GLOBAL_RULES.md

document.addEventListener('DOMContentLoaded', () => {
  // Wait for authenticated user session to resolve
  const checkSession = setInterval(() => {
    if (window.currentUser) {
      clearInterval(checkSession);
      fetchTeacherSubjects();
    }
  }, 100);

  setTimeout(() => clearInterval(checkSession), 5000);

  async function fetchTeacherSubjects() {
    const subjectsGrid = document.getElementById('subjects-grid');

    try {
      const response = await fetch('/.netlify/functions/get-subjects');
      if (!response.ok) {
        throw new Error('Failed to fetch subjects');
      }

      const subjects = await response.json();

      if (subjects.length === 0) {
        subjectsGrid.innerHTML = `
          <div class="loading-message">
            <p>لا توجد مواد مسجلة باسمك حالياً.</p>
          </div>
        `;
        return;
      }

      subjectsGrid.innerHTML = '';
      subjects.forEach(subject => {
        const card = createSubjectCard(subject);
        subjectsGrid.appendChild(card);
      });

    } catch (error) {
      console.error('Error fetching subjects:', error);
      subjectsGrid.innerHTML = `
        <div class="loading-message">
          <p style="color: var(--primary-red);">حدث خطأ أثناء تحميل المواد الدراسية. يرجى إعادة المحاولة.</p>
        </div>
      `;
    }
  }

  function createSubjectCard(subject) {
    const card = document.createElement('a');
    card.className = 'subject-card';
    card.href = `./schedule.html?subject_id=${subject.id}&subject_name=${encodeURIComponent(subject.name)}`;

    // Highlight attendance rate below 80 in red
    const isAlert = subject.attendance_rate < 80;
    const rateClass = isAlert ? 'subject-stat-val rate-alert' : 'subject-stat-val';

    // Get subject initial
    const initial = subject.name ? subject.name.trim()[0] : 'S';

    card.innerHTML = `
      <div class="subject-card-header">
        <div class="subject-avatar">${initial}</div>
        <div class="subject-title">${subject.name}</div>
      </div>
      <div class="subject-stats-row">
        <div class="subject-stat-box">
          <span class="subject-stat-val">${subject.student_count}</span>
          <span class="subject-stat-lbl">الطلاب المسجلين</span>
        </div>
        <div class="subject-stat-box">
          <span class="${rateClass}">${subject.attendance_rate}%</span>
          <span class="subject-stat-lbl">معدل الحضور</span>
        </div>
      </div>
    `;

    return card;
  }
});
