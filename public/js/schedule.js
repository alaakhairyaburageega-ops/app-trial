// Course Weekly Schedule Controller
// Written in pure Vanilla JavaScript (No Frameworks) complying with 00_GLOBAL_RULES.md

document.addEventListener('DOMContentLoaded', () => {
  // Parse Query Parameters
  const urlParams = new URLSearchParams(window.location.search);
  const subjectId = urlParams.get('subject_id');
  const subjectName = urlParams.get('subject_name');

  // Verify parameters exist, otherwise return to subjects
  if (!subjectId) {
    window.location.href = './subjects.html';
    return;
  }

  // Display subject name in header
  const titleDisplay = document.getElementById('subject-title-display');
  if (titleDisplay && subjectName) {
    titleDisplay.textContent = decodeURIComponent(subjectName);
  }

  const checkSession = setInterval(() => {
    if (window.currentUser) {
      clearInterval(checkSession);
      fetchSubjectSchedule();
    }
  }, 100);

  setTimeout(() => clearInterval(checkSession), 5000);

  // Weekday Translation Mapping
  const arabicDays = {
    saturday: 'السبت (Saturday)',
    sunday: 'الأحد (Sunday)',
    monday: 'الاثنين (Monday)',
    tuesday: 'الثلاثاء (Tuesday)',
    wednesday: 'الأربعاء (Wednesday)',
    thursday: 'الخميس (Thursday)',
    friday: 'الجمعة (Friday)'
  };

  async function fetchSubjectSchedule() {
    const pillsContainer = document.getElementById('schedule-pills-container');

    try {
      const response = await fetch(`/.netlify/functions/get-schedule?subject_id=${subjectId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch schedule');
      }

      const schedule = await response.json();

      if (schedule.length === 0) {
        pillsContainer.innerHTML = `
          <div class="loading-message">
            <p>لا يوجد جدول أسبوعي محدد لهذه المادة بعد.</p>
          </div>
        `;
        return;
      }

      pillsContainer.innerHTML = '';
      
      // Get current weekday name in lowercase (e.g. "monday")
      const today = new Date();
      const weekdayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const currentWeekdayName = weekdayNames[today.getDay()];

      schedule.forEach(item => {
        const pill = createSchedulePill(item, currentWeekdayName);
        pillsContainer.appendChild(pill);
      });

    } catch (error) {
      console.error('Error fetching course schedule:', error);
      pillsContainer.innerHTML = `
        <div class="loading-message">
          <p style="color: var(--primary-red);">حدث خطأ أثناء تحميل جدول المادة. يرجى إعادة المحاولة.</p>
        </div>
      `;
    }
  }

  function createSchedulePill(item, currentWeekdayName) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-pill';

    const isToday = item.day_of_week.toLowerCase() === currentWeekdayName;
    if (isToday) {
      btn.classList.add('pill-active', 'pill-today');
    }

    // Format times nicely (omit seconds if present)
    const startTime = item.start_time ? item.start_time.substring(0, 5) : '00:00';
    const endTime = item.end_time ? item.end_time.substring(0, 5) : '00:00';

    const dayName = arabicDays[item.day_of_week.toLowerCase()] || item.day_of_week;

    btn.innerHTML = `
      <span>${dayName}</span>
      <span class="btn-pill-time">🕒 ${startTime} - ${endTime}</span>
    `;

    // Calculate calendar date for the clicked weekday in the current week
    const calculatedDate = getDateOfWeekday(item.day_of_week);

    btn.addEventListener('click', () => {
      window.location.href = `./attendance.html?subject_id=${item.subject_id}&subject_name=${encodeURIComponent(subjectName)}&day=${item.day_of_week}&date=${calculatedDate}`;
    });

    return btn;
  }

  // Calculate calendar date corresponding to target weekday index within current week
  function getDateOfWeekday(targetDayName) {
    const daysMap = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
    const targetDayIndex = daysMap[targetDayName.toLowerCase()];
    const today = new Date();
    const currentDayIndex = today.getDay();
    
    // Difference between target day and current day
    const diff = targetDayIndex - currentDayIndex;
    
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + diff);
    
    // YYYY-MM-DD
    return targetDate.toISOString().split('T')[0];
  }
});
