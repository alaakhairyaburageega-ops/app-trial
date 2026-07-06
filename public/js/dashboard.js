// Teacher Dashboard Operations Controller
// Written in pure Vanilla JavaScript (No Frameworks) complying with 00_GLOBAL_RULES.md

document.addEventListener("DOMContentLoaded", () => {
  const checkSession = setInterval(() => {
    if (window.currentUser) {
      clearInterval(checkSession);
      loadDashboardStats();
    }
  }, 100);

  setTimeout(() => clearInterval(checkSession), 5000);

  async function loadDashboardStats() {
    const countSubjectsEl  = document.getElementById("count-subjects");
    const countStudentsEl  = document.getElementById("count-students");
    const attendanceRateEl = document.getElementById("attendance-rate");
    const chartWrapper     = document.getElementById("trend-chart");
    const alertsList       = document.getElementById("alerts-list");

    try {
      const response = await fetch("/.netlify/functions/get-dashboard-stats");
      if (!response.ok) throw new Error("Failed to fetch dashboard stats");

      const data = await response.json();

      if (countSubjectsEl)  countSubjectsEl.textContent  = data.total_subjects;
      if (countStudentsEl)  countStudentsEl.textContent  = data.total_students;
      if (attendanceRateEl) attendanceRateEl.textContent = data.attendance_rate + "%";

      // ── Render glowing SVG Curve Chart ──────────────────────────────────
      if (chartWrapper && data.trend && data.trend.length > 0) {
        renderCurveChart(chartWrapper, data.trend);
      } else if (chartWrapper) {
        chartWrapper.innerHTML = `<div class="loading-message"><p>لا توجد بيانات كافية للرسم البياني.</p></div>`;
      }

      // ── Populate alerts list ─────────────────────────────────────────────
      if (alertsList) {
        alertsList.innerHTML = "";
        if (data.alerts && data.alerts.length > 0) {
          data.alerts.forEach(alert => {
            const item = document.createElement("div");
            item.className = "alert-item";
            item.innerHTML = `
              <div class="alert-item-icon">&#9888;</div>
              <div class="alert-item-details">
                <div class="alert-item-title">${alert.subject_name}</div>
                <div class="alert-item-desc">${alert.warning}: ${alert.attendance_rate}% حضور</div>
              </div>`;
            alertsList.appendChild(item);
          });
        } else {
          alertsList.innerHTML = `
            <div class="alert-item alert-item-ok">
              <div class="alert-item-icon alert-ok-icon">&#10003;</div>
              <div class="alert-item-details">
                <div class="alert-item-title alert-ok-title">حالة الحضور مستقرة</div>
                <div class="alert-item-desc">جميع المواد لديها نسب حضور تفوق 80%! عمل رائع.</div>
              </div>
            </div>`;
        }
      }

    } catch (error) {
      console.error("Error loading dashboard stats:", error);

      // Demo fallback data for local/staging preview
      const demoTrend = [
        { label: "الأحد",    rate: 78 },
        { label: "الاثنين",  rate: 85 },
        { label: "الثلاثاء", rate: 72 },
        { label: "الأربعاء", rate: 91 },
        { label: "الخميس",   rate: 88 }
      ];
      if (chartWrapper) renderCurveChart(chartWrapper, demoTrend);

      if (countSubjectsEl)  countSubjectsEl.textContent  = "—";
      if (countStudentsEl)  countStudentsEl.textContent  = "—";
      if (attendanceRateEl) attendanceRateEl.textContent = "—";

      if (alertsList) {
        alertsList.innerHTML = `<div class="error-banner" style="display:block;">فشل تحميل الإحصائيات من الخادم.</div>`;
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // renderCurveChart — Glowing SVG Smooth Curve
  // ─────────────────────────────────────────────────────────────────────────
  function renderCurveChart(container, trend) {
    const W = container.clientWidth  || 600;
    const H = 200;
    const PAD_X = 40;
    const PAD_Y = 30;

    const chartW = W - PAD_X * 2;
    const chartH = H - PAD_Y * 2;

    const n = trend.length;
    const maxRate = 100;

    // Map data to SVG coordinates
    const points = trend.map((item, i) => ({
      x: PAD_X + (i / (n - 1)) * chartW,
      y: PAD_Y + chartH - (item.rate / maxRate) * chartH,
      rate: item.rate,
      label: item.label
    }));

    // Build smooth cubic bezier path
    function smoothPath(pts) {
      if (pts.length < 2) return "";
      let d = `M ${pts[0].x} ${pts[0].y}`;
      for (let i = 1; i < pts.length; i++) {
        const prev = pts[i - 1];
        const curr = pts[i];
        const cpx = (prev.x + curr.x) / 2;
        d += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
      }
      return d;
    }

    // Fill area path (close below chart)
    function areaPath(pts) {
      let d = smoothPath(pts);
      d += ` L ${pts[pts.length-1].x} ${PAD_Y + chartH}`;
      d += ` L ${pts[0].x} ${PAD_Y + chartH} Z`;
      return d;
    }

    const linePath = smoothPath(points);
    const fillPath = areaPath(points);

    // Horizontal grid lines
    const gridLines = [25, 50, 75, 100].map(v => {
      const y = PAD_Y + chartH - (v / maxRate) * chartH;
      return `
        <line x1="${PAD_X}" y1="${y}" x2="${PAD_X + chartW}" y2="${y}"
              stroke="rgba(255,255,255,0.06)" stroke-width="1" stroke-dasharray="4 4"/>
        <text x="${PAD_X - 6}" y="${y + 4}" fill="rgba(148,163,184,0.7)"
              font-size="9" text-anchor="end" font-family="Outfit, sans-serif">${v}%</text>`;
    }).join("");

    // Data point circles with glow
    const dots = points.map(p => `
      <circle cx="${p.x}" cy="${p.y}" r="5"
              fill="#060d1f" stroke="#3b82f6" stroke-width="2.5"
              filter="url(#dotGlow)"/>
      <circle cx="${p.x}" cy="${p.y}" r="2.5" fill="#60a5fa"/>
    `).join("");

    // Tooltip text on hover (use title elements)
    const tooltips = points.map(p => `
      <g class="chart-tooltip-group" style="cursor:pointer;">
        <circle cx="${p.x}" cy="${p.y}" r="16" fill="transparent"/>
        <title>${p.label}: ${p.rate}%</title>
      </g>
    `).join("");

    // X-axis labels
    const labels = points.map(p => `
      <text x="${p.x}" y="${PAD_Y + chartH + 20}"
            fill="rgba(148,163,184,0.85)" font-size="10"
            text-anchor="middle" font-family="Outfit, sans-serif" font-weight="600">
        ${p.label}
      </text>
    `).join("");

    // Rate labels on each point
    const rateLabels = points.map(p => `
      <text x="${p.x}" y="${p.y - 12}"
            fill="#93c5fd" font-size="10" font-weight="700"
            text-anchor="middle" font-family="Outfit, sans-serif"
            filter="url(#textGlow)">
        ${p.rate}%
      </text>
    `).join("");

    const svg = `
      <svg width="100%" height="${H + 20}" viewBox="0 0 ${W} ${H + 20}"
           xmlns="http://www.w3.org/2000/svg" style="overflow:visible;">
        <defs>
          <!-- Blue glow filter for line -->
          <filter id="lineGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur1"/>
            <feGaussianBlur stdDeviation="8" result="blur2"/>
            <feMerge>
              <feMergeNode in="blur2"/>
              <feMergeNode in="blur1"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <!-- Glow for dots -->
          <filter id="dotGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <!-- Text glow -->
          <filter id="textGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <!-- Area fill gradient -->
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stop-color="#3b82f6" stop-opacity="0.35"/>
            <stop offset="60%"  stop-color="#3b82f6" stop-opacity="0.08"/>
            <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.0"/>
          </linearGradient>
          <!-- Stroke gradient -->
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stop-color="#6366f1"/>
            <stop offset="50%"  stop-color="#3b82f6"/>
            <stop offset="100%" stop-color="#60a5fa"/>
          </linearGradient>
        </defs>

        <!-- Grid lines -->
        ${gridLines}

        <!-- Area fill under curve -->
        <path d="${fillPath}" fill="url(#areaGrad)" opacity="1"/>

        <!-- Outer glow line (wider, blurred) -->
        <path d="${linePath}"
              fill="none"
              stroke="#3b82f6"
              stroke-width="8"
              stroke-linecap="round"
              stroke-linejoin="round"
              opacity="0.25"
              filter="url(#lineGlow)"/>

        <!-- Main glowing curve line -->
        <path d="${linePath}"
              fill="none"
              stroke="url(#lineGrad)"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              filter="url(#lineGlow)"/>

        <!-- Data points (dots) -->
        ${dots}

        <!-- Transparent hover areas + tooltips -->
        ${tooltips}

        <!-- X-axis day labels -->
        ${labels}

        <!-- Rate % labels above each dot -->
        ${rateLabels}
      </svg>`;

    container.style.cssText = "padding: 0.5rem 0; border-bottom: none; height: auto; overflow: visible;";
    container.innerHTML = svg;
  }
});
