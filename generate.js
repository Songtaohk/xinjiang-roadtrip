const fs = require("fs");
const path = require("path");
const { TRIP, DAYS } = require("./data.js");

const OUT = __dirname;

// ---- AMap (高德地图) credentials, provided by user ----
const AMAP_KEY = "1e292eeef1aae1b6eb63c7989ae14dbb";
const AMAP_SECURITY = "f5122d0c0aae74cc4c4e8f4ce0a196cc";

// ---- Per-day waypoints for AMap driving/marker queries ----
// Each entry: { keyword, city } — matches AMap.Driving's keyword-search input format.
// Days with a single point render as a marker only (no driving route).
const WAYPOINTS_CN = {
  1: [{ keyword: "乌鲁木齐地窝堡国际机场", city: "乌鲁木齐市" }],
  2: [
    { keyword: "乌鲁木齐市", city: "乌鲁木齐市" },
    { keyword: "克拉玛依市", city: "克拉玛依市" },
  ],
  3: [
    { keyword: "克拉玛依市", city: "克拉玛依市" },
    { keyword: "布尔津县", city: "布尔津县" },
    { keyword: "喀纳斯景区贾登峪游客中心", city: "布尔津县" },
  ],
  4: [
    { keyword: "贾登峪游客中心", city: "布尔津县" },
    { keyword: "喀纳斯湖", city: "布尔津县" },
  ],
  5: [
    { keyword: "贾登峪游客中心", city: "布尔津县" },
    { keyword: "禾木村", city: "布尔津县" },
  ],
  6: [
    { keyword: "禾木村", city: "布尔津县" },
    { keyword: "贾登峪游客中心", city: "布尔津县" },
    { keyword: "布尔津县", city: "布尔津县" },
  ],
  7: [
    { keyword: "布尔津县", city: "布尔津县" },
    { keyword: "世界魔鬼城", city: "克拉玛依市" },
  ],
  8: [
    { keyword: "世界魔鬼城", city: "克拉玛依市" },
    { keyword: "赛里木湖", city: "博乐市" },
  ],
  9: [{ keyword: "赛里木湖", city: "博乐市" }],
  10: [
    { keyword: "赛里木湖", city: "博乐市" },
    { keyword: "伊宁市六星街", city: "伊宁市" },
    { keyword: "那拉提镇", city: "新源县" },
  ],
  11: [{ keyword: "那拉提草原景区", city: "新源县" }],
  12: [
    { keyword: "那拉提镇", city: "新源县" },
    { keyword: "唐布拉草原", city: "尼勒克县" },
  ],
  13: [
    { keyword: "那拉提镇", city: "新源县" },
    { keyword: "独山子区", city: "克拉玛依市" },
  ],
  14: [
    { keyword: "独山子区", city: "克拉玛依市" },
    { keyword: "天山天池", city: "阜康市" },
    { keyword: "乌鲁木齐地窝堡国际机场", city: "乌鲁木齐市" },
  ],
  15: [{ keyword: "乌鲁木齐地窝堡国际机场", city: "乌鲁木齐市" }],
};

const CSS = `
:root {
  --teal: #1F4E5F;
  --teal-light: #2E6F86;
  --sand: #F5EFE6;
  --warn-bg: #FCEFC7;
  --warn-border: #E0B94D;
  --text: #2B2B2B;
  --muted: #6B6B6B;
  --card-bg: #FFFFFF;
  --border: #E3DED3;
  --radius: 10px;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif;
  background: var(--sand);
  color: var(--text);
  line-height: 1.6;
}
header.site-header {
  background: var(--teal);
  color: white;
  padding: 20px 24px;
}
header.site-header h1 {
  margin: 0 0 4px 0;
  font-size: 22px;
}
header.site-header p {
  margin: 0;
  opacity: 0.85;
  font-size: 14px;
}
nav.day-nav {
  background: var(--teal-light);
  padding: 10px 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}
nav.day-nav a {
  color: white;
  text-decoration: none;
  background: rgba(255,255,255,0.15);
  padding: 5px 10px;
  border-radius: 6px;
  font-size: 13px;
  white-space: nowrap;
}
nav.day-nav a.active {
  background: white;
  color: var(--teal);
  font-weight: 600;
}
main {
  max-width: 920px;
  margin: 0 auto;
  padding: 20px 16px 60px;
}
.day-title-block {
  margin-bottom: 20px;
}
.day-title-block .day-num {
  display: inline-block;
  background: var(--teal);
  color: white;
  padding: 3px 12px;
  border-radius: 20px;
  font-size: 13px;
  margin-bottom: 8px;
}
.day-title-block h2 {
  margin: 6px 0 4px;
  font-size: 24px;
  color: var(--teal);
}
.day-title-block .date-line {
  color: var(--muted);
  font-size: 14px;
}
.day-title-block .summary {
  margin-top: 8px;
  font-size: 15px;
  color: var(--text);
}
.section-card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 18px 20px;
  margin-bottom: 18px;
}
.section-card h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: var(--teal);
  display: flex;
  align-items: center;
  gap: 8px;
}
.section-card h3 .icon {
  font-size: 18px;
}
.map-frame-wrap {
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border);
  margin-bottom: 8px;
  width: 100%;
  height: 360px;
  background: #eef1ec;
}
.map-fallback-link {
  font-size: 13px;
  color: var(--muted);
}
.map-fallback-link a { color: var(--teal-light); }
.map-note {
  font-size: 12px;
  color: var(--muted);
  margin-top: 4px;
}
table.info-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
table.info-table td {
  padding: 7px 6px;
  border-bottom: 1px solid var(--border);
  vertical-align: top;
}
table.info-table td.label {
  width: 92px;
  color: var(--muted);
  white-space: nowrap;
  font-weight: 600;
}
.warn-box {
  background: var(--warn-bg);
  border: 1px solid var(--warn-border);
  border-radius: 8px;
  padding: 10px 14px;
  margin-top: 10px;
  font-size: 13.5px;
}
.activity-item, .hotel-item {
  padding: 10px 0;
  border-bottom: 1px dashed var(--border);
}
.activity-item:last-child, .hotel-item:last-child { border-bottom: none; }
.activity-item .name, .hotel-item .name {
  font-weight: 600;
  font-size: 14.5px;
}
.activity-item .meta, .hotel-item .meta {
  color: var(--muted);
  font-size: 12.5px;
  margin: 2px 0 4px;
}
.activity-item .note, .hotel-item .note {
  font-size: 13.5px;
}
.food-list {
  font-size: 14px;
  padding-left: 18px;
  margin: 0;
}
.food-list li { margin-bottom: 4px; }
.empty-note {
  color: var(--muted);
  font-style: italic;
  font-size: 14px;
}
.disclaimer {
  font-size: 12.5px;
  color: var(--muted);
  background: #FBF8F2;
  border: 1px dashed var(--border);
  border-radius: 8px;
  padding: 12px 14px;
  margin-top: 24px;
}
.index-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.index-list li {
  margin-bottom: 10px;
}
.index-list a {
  display: block;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 14px 16px;
  text-decoration: none;
  color: var(--text);
}
.index-list a:hover { border-color: var(--teal-light); }
.index-list .idx-day {
  font-size: 12px;
  color: white;
  background: var(--teal);
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  margin-bottom: 4px;
}
.index-list .idx-title { font-weight: 600; font-size: 15px; color: var(--teal); }
.index-list .idx-summary { font-size: 13px; color: var(--muted); margin-top: 2px; }
.prevnext {
  display: flex;
  justify-content: space-between;
  margin-top: 24px;
  gap: 10px;
}
.prevnext a {
  flex: 1;
  text-align: center;
  padding: 12px;
  background: var(--teal);
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-size: 14px;
}
.prevnext a.disabled {
  background: var(--border);
  color: var(--muted);
  pointer-events: none;
}
footer.site-footer {
  text-align: center;
  color: var(--muted);
  font-size: 12px;
  padding: 20px;
}
`;

function navHtml(activeNum) {
  let items = `<a href="index.html" class="${activeNum === 0 ? "active" : ""}">总览</a>`;
  for (const d of DAYS) {
    items += `<a href="day${d.num}.html" class="${activeNum === d.num ? "active" : ""}">D${d.num}</a>`;
  }
  return `<nav class="day-nav">${items}</nav>`;
}

function headHtml(title) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>${CSS}</style>
</head>
<body>`;
}

// AMap loader script — must appear before any code that uses `AMap`.
// securityJsCode is required for keys issued after 2021-12-02.
function amapLoaderScript() {
  return `<script>
window._AMapSecurityConfig = { securityJsCode: "${AMAP_SECURITY}" };
</script>
<script src="https://webapi.amap.com/maps?v=2.0&key=${AMAP_KEY}&plugin=AMap.Driving,AMap.Geocoder,AMap.PlaceSearch"></script>`;
}

function footHtml() {
  return `<footer class="site-footer">${TRIP.title} · 生成于本次行程规划对话 · 出行前请务必核实实时信息</footer>
</body></html>`;
}

function renderTransportRow(label, value) {
  if (value === undefined || value === null || value === "") return "";
  return `<tr><td class="label">${label}</td><td>${value}</td></tr>`;
}

// Builds the AMap init script for a single day's map div.
function amapDayInitScript(dayNum, points) {
  const mapId = `amap-day-${dayNum}`;
  const statusId = `amap-status-${dayNum}`;
  const pointsJson = JSON.stringify(points);

  if (!points || points.length === 0) {
    return "";
  }

  if (points.length === 1) {
    const p = points[0];
    return `<script>
(function(){
  var map = new AMap.Map("${mapId}", { zoom: 10, resizeEnable: true });
  AMap.plugin("AMap.PlaceSearch", function(){
    var ps = new AMap.PlaceSearch({ city: ${JSON.stringify(p.city)}, map: map });
    ps.search(${JSON.stringify(p.keyword)}, function(status, result){
      if (status !== "complete" || !result.poiList || !result.poiList.pois.length) {
        document.getElementById("${statusId}").innerHTML = "地图定位失败，可在高德地图App中手动搜索：${p.keyword.replace(/"/g, '\\"')}";
      }
    });
  });
})();
</script>`;
  }

  return `<script>
(function(){
  var map = new AMap.Map("${mapId}", { zoom: 8, resizeEnable: true });
  var points = ${pointsJson};
  AMap.plugin("AMap.Driving", function(){
    var driving = new AMap.Driving({ map: map, policy: 0 });
    driving.search(points, function(status, result){
      if (status !== "complete") {
        var names = points.map(function(p){ return p.keyword; }).join(" → ");
        document.getElementById("${statusId}").innerHTML = "路线自动规划失败（可能是坐标解析问题），请在高德地图App中手动搜索：" + names;
      }
    });
  });
})();
</script>`;
}

function renderDayPage(d, idx) {
  const prev = idx > 0 ? DAYS[idx - 1] : null;
  const next = idx < DAYS.length - 1 ? DAYS[idx + 1] : null;
  const points = WAYPOINTS_CN[d.num] || [];

  const mapSection = points.length > 0 ? `
  <div id="amap-day-${d.num}" class="map-frame-wrap"></div>
  <div id="amap-status-${d.num}" class="map-fallback-link"></div>
  <div class="map-note">地图由高德地图 JS API 驱动，${points.length > 1 ? "路线为高德实时驾车路线规划结果（仅供参考，实际路况请以导航为准）" : "此为定位标注，当天无自驾里程"}。</div>
  ` : `<p class="empty-note">当天无自驾/位置移动。</p>`;

  const t = d.transport || {};
  const transportRows = [
    renderTransportRow("路线", t.roads),
    renderTransportRow("里程", t.distance),
    renderTransportRow("车程", t.duration),
    renderTransportRow("海拔变化", t.elevation),
    renderTransportRow("历史天气参考", t.weather),
    renderTransportRow("是否需预约", t.reservation),
  ].join("");

  const notesBox = t.notes ? `<div class="warn-box"><strong>驾车注意事项：</strong>${t.notes}</div>` : "";
  const resAlertBox = d.reservationAlert ? `<div class="warn-box"><strong>预约提醒：</strong>${d.reservationAlert}</div>` : "";

  const activitiesHtml = (d.activities && d.activities.length > 0)
    ? d.activities.map(a => `
      <div class="activity-item">
        <div class="name">${a.name}</div>
        <div class="meta">游览时间：${a.duration}</div>
        <div class="note">${a.note}</div>
      </div>`).join("")
    : `<p class="empty-note">当天无景点活动安排。</p>`;

  const foodHtml = (d.food && d.food.length > 0)
    ? `<ul class="food-list">${d.food.map(f => `<li>${f}</li>`).join("")}</ul>`
    : `<p class="empty-note">当天无特别推荐餐食。</p>`;

  const hotelsHtml = (d.hotels && d.hotels.length > 0)
    ? d.hotels.map(h => `
      <div class="hotel-item">
        <div class="name">${h.name}</div>
        <div class="meta">${h.loc}${h.price ? " · " + h.price : ""}</div>
        <div class="note">${h.why}</div>
      </div>`).join("")
    : `<p class="empty-note">当天无住宿安排（返程日）。</p>`;

  return `${headHtml(`D${d.num} ${d.title} - ${TRIP.title}`)}
<header class="site-header">
  <h1>${TRIP.title}</h1>
  <p>${TRIP.subtitle}</p>
</header>
${navHtml(d.num)}
<main>
  <div class="day-title-block">
    <span class="day-num">Day ${d.num} · ${d.date}</span>
    <h2>${d.title}</h2>
    <div class="summary">${d.summary}</div>
  </div>

  <div class="section-card">
    <h3><span class="icon">🗺️</span>路线图</h3>
    ${mapSection}
  </div>

  <div class="section-card">
    <h3><span class="icon">🚗</span>交通</h3>
    <table class="info-table">${transportRows}</table>
    ${resAlertBox}
    ${notesBox}
  </div>

  <div class="section-card">
    <h3><span class="icon">📍</span>活动安排</h3>
    ${activitiesHtml}
  </div>

  <div class="section-card">
    <h3><span class="icon">🍽️</span>饮食 / 住宿</h3>
    <div style="margin-bottom:10px;"><strong style="font-size:13.5px;color:var(--muted);">推荐饮食</strong>${foodHtml}</div>
    <div><strong style="font-size:13.5px;color:var(--muted);">当晚住宿（3-4星，推荐1-3选）</strong>${hotelsHtml}</div>
  </div>

  <div class="prevnext">
    <a href="${prev ? "day" + prev.num + ".html" : "#"}" class="${prev ? "" : "disabled"}">← 上一天${prev ? "：D" + prev.num : ""}</a>
    <a href="${next ? "day" + next.num + ".html" : "#"}" class="${next ? "" : "disabled"}">下一天${next ? "：D" + next.num : ""} →</a>
  </div>

  <div class="disclaimer">${TRIP.disclaimer}</div>
</main>
${amapLoaderScript()}
${amapDayInitScript(d.num, points)}
${footHtml()}`;
}

// Overview map: plots a numbered marker for each day's first waypoint (geocoded),
// then connects them with a straight schematic polyline (NOT a real driving route —
// each day page has the real routed map). This avoids AMap.Driving's waypoint limits
// and avoids nonsensical "driving" queries across days that use shuttle-only access (e.g. Kanas).
function amapIndexInitScript() {
  const seq = [];
  for (const d of DAYS) {
    const pts = WAYPOINTS_CN[d.num];
    if (pts && pts.length > 0) {
      const first = pts[0];
      const last = pts[pts.length - 1];
      // Use the day's last point as the representative "arrival" location for that day,
      // except day 1 which has only an arrival point.
      const rep = last;
      const prevRep = seq.length > 0 ? seq[seq.length - 1].keyword : null;
      if (rep.keyword !== prevRep) {
        seq.push({ keyword: rep.keyword, city: rep.city, day: d.num });
      }
    }
  }
  const seqJson = JSON.stringify(seq);
  return `<script>
(function(){
  var map = new AMap.Map("amap-index", { zoom: 6, resizeEnable: true });
  var stops = ${seqJson};
  var geocoder = new AMap.Geocoder({});
  var results = new Array(stops.length);
  var done = 0;
  function finishOne(i, lnglat){
    results[i] = lnglat;
    done++;
    if (done === stops.length) {
      var path = [];
      var markers = [];
      results.forEach(function(pos, idx){
        if (!pos) return;
        path.push(pos);
        var marker = new AMap.Marker({
          position: pos,
          map: map,
          label: { content: "D" + stops[idx].day, direction: "top" },
          title: stops[idx].keyword
        });
        markers.push(marker);
      });
      if (path.length > 1) {
        new AMap.Polyline({
          path: path,
          map: map,
          strokeColor: "#1F4E5F",
          strokeWeight: 3,
          strokeStyle: "dashed"
        });
      }
      if (path.length > 0) {
        map.setFitView();
      } else {
        document.getElementById("amap-index-status").innerHTML = "地图标注加载失败，请刷新页面重试。";
      }
    }
  }
  stops.forEach(function(stop, i){
    AMap.plugin("AMap.Geocoder", function(){
      var g = new AMap.Geocoder({ city: stop.city });
      g.getLocation(stop.keyword, function(status, result){
        if (status === "complete" && result.geocodes && result.geocodes.length) {
          finishOne(i, result.geocodes[0].location);
        } else {
          finishOne(i, null);
        }
      });
    });
  });
})();
</script>`;
}

function renderIndexPage() {
  const listHtml = DAYS.map(d => `
    <li><a href="day${d.num}.html">
      <span class="idx-day">Day ${d.num} · ${d.date}</span>
      <div class="idx-title">${d.title}</div>
      <div class="idx-summary">${d.summary}</div>
    </a></li>`).join("");

  return `${headHtml(TRIP.title)}
<header class="site-header">
  <h1>${TRIP.title}</h1>
  <p>${TRIP.subtitle}</p>
</header>
${navHtml(0)}
<main>
  <div class="section-card">
    <h3><span class="icon">🗺️</span>全程路线总览</h3>
    <div id="amap-index" class="map-frame-wrap"></div>
    <div id="amap-index-status" class="map-fallback-link"></div>
    <div class="map-note">示意图：按每日终点顺序用虚线连接，仅表示大致行进方向，非实际道路轨迹。每日详细页内为高德实时驾车路线。</div>
  </div>
  <div class="section-card">
    <h3><span class="icon">📅</span>逐日行程</h3>
    <ul class="index-list">${listHtml}</ul>
  </div>
  <div class="disclaimer">${TRIP.disclaimer}</div>
</main>
${amapLoaderScript()}
${amapIndexInitScript()}
${footHtml()}`;
}

// Write files
fs.writeFileSync(path.join(OUT, "index.html"), renderIndexPage(), "utf8");
DAYS.forEach((d, idx) => {
  fs.writeFileSync(path.join(OUT, `day${d.num}.html`), renderDayPage(d, idx), "utf8");
});

console.log("Generated:", 1 + DAYS.length, "files");
