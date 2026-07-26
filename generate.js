const fs = require("fs");
const path = require("path");
const { TRIP, DAYS } = require("./data.js");

const OUT = __dirname;

// ---- AMap (高德地图) credentials, provided by user ----
const AMAP_KEY = "1e292eeef1aae1b6eb63c7989ae14dbb";
const AMAP_SECURITY = "f5122d0c0aae74cc4c4e8f4ce0a196cc";

// ---- Per-day route waypoints for AMap driving/marker queries ----
// city values use prefecture-level (地级) administrative names for reliable AMap geocoding bias:
// 阿勒泰地区 (Altay), 伊犁哈萨克自治州 (Ili), 博尔塔拉蒙古自治州 (Bortala), 克拉玛依市, 乌鲁木齐市, 伊宁市, 阜康市, 奎屯市.
const WAYPOINTS_CN = {
  0: [{ keyword: "乌鲁木齐地窝堡国际机场", city: "乌鲁木齐市" }],
  1: [
    { keyword: "乌鲁木齐市", city: "乌鲁木齐市" },
    { keyword: "阿勒泰市", city: "阿勒泰地区" },
    { keyword: "布尔津县", city: "阿勒泰地区" },
  ],
  2: [
    { keyword: "布尔津县", city: "阿勒泰地区" },
    { keyword: "喀纳斯景区贾登峪游客中心", city: "阿勒泰地区" },
    { keyword: "喀纳斯湖", city: "阿勒泰地区" },
  ],
  3: [
    { keyword: "喀纳斯湖", city: "阿勒泰地区" },
    { keyword: "白哈巴", city: "阿勒泰地区" },
  ],
  4: [
    { keyword: "白哈巴", city: "阿勒泰地区" },
    { keyword: "喀纳斯景区贾登峪游客中心", city: "阿勒泰地区" },
  ],
  5: [
    { keyword: "贾登峪游客中心", city: "阿勒泰地区" },
    { keyword: "禾木村", city: "阿勒泰地区" },
  ],
  6: [
    { keyword: "禾木村", city: "阿勒泰地区" },
    { keyword: "贾登峪游客中心", city: "阿勒泰地区" },
    { keyword: "布尔津县", city: "阿勒泰地区" },
  ],
  7: [
    { keyword: "布尔津县", city: "阿勒泰地区" },
    { keyword: "世界魔鬼城", city: "克拉玛依市" },
  ],
  8: [
    { keyword: "世界魔鬼城", city: "克拉玛依市" },
    { keyword: "赛里木湖", city: "博尔塔拉蒙古自治州" },
  ],
  9: [
    { keyword: "赛里木湖", city: "博尔塔拉蒙古自治州" },
    { keyword: "伊宁市六星街", city: "伊宁市" },
    { keyword: "库尔德宁", city: "伊犁哈萨克自治州" },
    { keyword: "那拉提镇", city: "伊犁哈萨克自治州" },
  ],
  10: [{ keyword: "那拉提草原景区", city: "伊犁哈萨克自治州" }],
  "11a": [
    { keyword: "那拉提镇", city: "伊犁哈萨克自治州" },
    { keyword: "唐布拉草原", city: "伊犁哈萨克自治州" },
  ],
  "11b": [
    { keyword: "那拉提镇", city: "伊犁哈萨克自治州" },
    { keyword: "唐布拉草原", city: "伊犁哈萨克自治州" },
  ],
  12: [
    { keyword: "那拉提镇", city: "伊犁哈萨克自治州" },
    { keyword: "独山子区", city: "克拉玛依市" },
  ],
  13: [
    { keyword: "独山子区", city: "克拉玛依市" },
    { keyword: "天山天池", city: "阜康市" },
    { keyword: "乌鲁木齐地窝堡国际机场", city: "乌鲁木齐市" },
  ],
  14: [{ keyword: "乌鲁木齐市", city: "乌鲁木齐市" }],
  15: [{ keyword: "乌鲁木齐地窝堡国际机场", city: "乌鲁木齐市" }],
};

// City bias for geocoding each day's hotel names (POI-name lookup).
const HOTEL_CITY_BIAS = {
  0: "乌鲁木齐市",
  1: "阿勒泰地区",
  2: "阿勒泰地区",
  3: "阿勒泰地区",
  4: "阿勒泰地区",
  5: "阿勒泰地区",
  6: "阿勒泰地区",
  7: "克拉玛依市",
  8: "博尔塔拉蒙古自治州",
  9: "伊犁哈萨克自治州",
  10: "伊犁哈萨克自治州",
  "11a": "伊犁哈萨克自治州",
  "11b": "伊犁哈萨克自治州",
  12: "奎屯市",
  13: "乌鲁木齐市",
  14: "乌鲁木齐市",
  15: null,
};

// Rental car pickup (Day 1, 8/16) / return (Day 13, 8/28) label prefixes for map markers,
// geocoded directly by each rental company's real name+address (see data.js rentalOptions).
const RENTAL_LABEL_PREFIX = {
  1: "🚗 取车：",
  13: "🚗 还车：",
};

function hotelListForDay(d) {
  const city = HOTEL_CITY_BIAS[d.num];
  if (!city || !d.hotels) return [];
  return d.hotels
    .filter(h => h.name && !h.name.startsWith("（同"))
    .map(h => ({ name: h.name, city }));
}

function rentalListForDay(d) {
  if (!d.rentalOptions) return [];
  const prefix = RENTAL_LABEL_PREFIX[d.num] || "🚗 ";
  return d.rentalOptions.map(r => ({ name: r.name, city: "乌鲁木齐市", label: prefix + r.name }));
}

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
  height: 380px;
  background: #eef1ec;
}
.map-fallback-link {
  font-size: 13px;
  color: var(--muted);
  min-height: 16px;
}
.map-fallback-link a { color: var(--teal-light); }
.map-note {
  font-size: 12px;
  color: var(--muted);
  margin-top: 4px;
}
.map-legend {
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
.activity-item .intro {
  font-size: 13.5px;
  color: var(--text);
  background: #F5F8F6;
  border-left: 3px solid var(--teal-light);
  padding: 6px 10px;
  margin: 4px 0 6px;
  border-radius: 4px;
}
.depth-box {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.depth-row {
  font-size: 13px;
  color: var(--text);
}
.depth-tag {
  display: inline-block;
  font-size: 11px;
  padding: 1px 8px;
  border-radius: 10px;
  margin-right: 6px;
  font-weight: 600;
}
.depth-tag.shallow {
  background: #E3EDE8;
  color: var(--teal-light);
}
.depth-tag.deep {
  background: var(--teal);
  color: white;
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
.map-live-note {
  font-size: 13px;
  font-weight: 600;
  color: var(--teal);
  background: #EAF2E9;
  border-radius: 6px;
  padding: 6px 10px;
  margin-top: 6px;
  min-height: 14px;
}
.terrain-box {
  background: #F1F6F3;
  border-left: 3px solid var(--teal-light);
  border-radius: 6px;
  padding: 10px 14px;
  font-size: 13.5px;
  color: var(--text);
  margin-top: 10px;
  line-height: 1.6;
}
.terrain-box strong { color: var(--teal); }
.elev-chart-wrap { margin-top: 10px; }
.elev-chart { width: 100%; height: auto; display: block; }
.elev-chart-note {
  font-size: 11.5px;
  color: var(--muted);
  margin-top: 2px;
}
`;

// Renders a simplified elevation profile as an inline SVG line/area chart.
// This is NOT a continuous surveyed elevation trace -- it only plots the elevation
// figures already stated in each day's transport.elevation text (start / named
// pass-or-peak / end), connected with straight segments. Clearly labeled as a
// schematic in the surrounding UI so it isn't mistaken for real GPS elevation data.
function elevChartSvg(profile) {
  if (!profile || profile.length < 2) return "";
  const w = 640, h = 130, padL = 8, padR = 8, padT = 26, padB = 30;
  const ms = profile.map(p => p.m);
  const minM = Math.min(...ms), maxM = Math.max(...ms);
  const range = Math.max(maxM - minM, 1);
  const n = profile.length;
  const stepX = n > 1 ? (w - padL - padR) / (n - 1) : 0;
  const pts = profile.map((p, i) => ({
    x: padL + i * stepX,
    y: padT + (1 - (p.m - minM) / range) * (h - padT - padB),
    label: p.label, m: p.m
  }));
  const poly = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = `${pts[0].x.toFixed(1)},${h - padB} ${poly} ${pts[pts.length - 1].x.toFixed(1)},${h - padB}`;
  const dots = pts.map(p => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4" fill="#2E6F86" stroke="white" stroke-width="1.5"/>`).join("");
  const labels = pts.map((p, i) => {
    const anchor = i === 0 ? "start" : (i === pts.length - 1 ? "end" : "middle");
    const lx = i === 0 ? p.x + 2 : (i === pts.length - 1 ? p.x - 2 : p.x);
    return `<text x="${lx.toFixed(1)}" y="${(h - 10).toFixed(1)}" font-size="11" text-anchor="${anchor}" fill="#5b6b70">${p.label}</text>
      <text x="${lx.toFixed(1)}" y="${Math.max(p.y - 10, 12).toFixed(1)}" font-size="11" font-weight="600" text-anchor="${anchor}" fill="#1F4E5F">${p.m}m</text>`;
  }).join("");
  return `<svg viewBox="0 0 ${w} ${h}" class="elev-chart" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
    <polygon points="${area}" fill="#2E6F86" fill-opacity="0.12"/>
    <polyline points="${poly}" fill="none" stroke="#2E6F86" stroke-width="2.5"/>
    ${dots}
    ${labels}
  </svg>`;
}

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

// Shared geocode/marker helper functions, inlined into every page's map script.
const JS_HELPERS = `
  function geocode(address, city) {
    return new Promise(function(resolve){
      var opts = city ? { city: city } : {};
      var g = new AMap.Geocoder(opts);
      g.getLocation(address, function(status, result){
        if (status === "complete" && result.geocodes && result.geocodes.length) {
          resolve(result.geocodes[0].location);
        } else {
          resolve(null);
        }
      });
    });
  }
  function hotelIcon(){
    return new AMap.Icon({ size: new AMap.Size(25,34), image: "https://webapi.amap.com/theme/v1.3/markers/n/mark_r.png", imageSize: new AMap.Size(25,34) });
  }
  function rentalIcon(){
    return new AMap.Icon({ size: new AMap.Size(25,34), image: "https://webapi.amap.com/theme/v1.3/markers/n/mark_g.png", imageSize: new AMap.Size(25,34) });
  }
`;

// Builds the AMap init script for a single day's map div: real driving route
// (via geocoded coordinates, not keyword search, for reliability), hotel markers,
// and rental car pickup/return markers (geocoded by each company's real name+city).
function amapDayInitScript(dayNum, points, hotels, rentals) {
  const mapId = `amap-day-${dayNum}`;
  const statusId = `amap-status-${dayNum}`;
  if (!points || points.length === 0) return "";

  const pointsJson = JSON.stringify(points);
  const hotelsJson = JSON.stringify(hotels || []);
  const rentalsJson = JSON.stringify(rentals || []);

  return `<script>
(function(){
  var map = new AMap.Map("${mapId}", { zoom: 6, resizeEnable: true });
  var routePoints = ${pointsJson};
  var hotels = ${hotelsJson};
  var rentals = ${rentalsJson};
${JS_HELPERS}
  function addHotelMarkers(){
    hotels.forEach(function(h){
      geocode(h.name, h.city).then(function(loc){
        if (!loc) return;
        new AMap.Marker({ position: loc, map: map, icon: hotelIcon(), title: h.name, label: { content: "🏨 " + h.name, direction: "top" } });
      });
    });
  }
  function addRentalMarkers(){
    rentals.forEach(function(r){
      geocode(r.name, r.city).then(function(loc){
        if (!loc) return;
        new AMap.Marker({ position: loc, map: map, icon: rentalIcon(), title: r.label, label: { content: r.label, direction: "bottom" } });
      });
    });
  }

  if (routePoints.length === 1) {
    geocode(routePoints[0].keyword, routePoints[0].city).then(function(loc){
      if (loc) {
        new AMap.Marker({ position: loc, map: map, title: routePoints[0].keyword });
        map.setCenter(loc);
        map.setZoom(11);
      } else {
        document.getElementById("${statusId}").innerHTML = "定位失败，请在高德地图App中手动搜索：" + routePoints[0].keyword;
      }
      addHotelMarkers();
      addRentalMarkers();
    });
  } else {
    Promise.all(routePoints.map(function(p){ return geocode(p.keyword, p.city); })).then(function(locs){
      var validIdx = [];
      locs.forEach(function(l, i){ if (l) validIdx.push(i); });
      if (validIdx.length < 2) {
        document.getElementById("${statusId}").innerHTML = "部分地点定位失败，无法规划路线，请在高德地图App中手动搜索：" + routePoints.map(function(p){ return p.keyword; }).join(" → ");
        addHotelMarkers();
        addRentalMarkers();
        return;
      }
      var start = locs[validIdx[0]];
      var end = locs[validIdx[validIdx.length - 1]];
      var mid = validIdx.slice(1, -1).map(function(i){ return locs[i]; });
      var driving = new AMap.Driving({ map: map, policy: 0 });
      driving.search(start, end, { waypoints: mid }, function(status, result){
        if (status !== "complete") {
          document.getElementById("${statusId}").innerHTML = "驾车路线规划失败，请在高德地图App中手动搜索：" + routePoints.map(function(p){ return p.keyword; }).join(" → ");
        } else if (result && result.routes && result.routes[0]) {
          var km = (result.routes[0].distance / 1000).toFixed(0);
          var totalMin = Math.round(result.routes[0].time / 60);
          var hrs = Math.floor(totalMin / 60), remMin = totalMin % 60;
          var timeStr = hrs > 0 ? (hrs + "小时" + (remMin > 0 ? remMin + "分钟" : "")) : (totalMin + "分钟");
          var liveEl = document.getElementById("${mapId}-live");
          if (liveEl) liveEl.innerHTML = "📍 高德实时路线：约 " + km + " km，纯驾车预计 " + timeStr + "（不含休息/堵车，当前浏览时刻的实时路况计算，仅供参考，与下方\\u201c交通\\u201d表格中的研究估算值可能不同）";
        }
        map.setFitView();
        addHotelMarkers();
        addRentalMarkers();
      });
    });
  }
})();
</script>`;
}

function renderDayPage(d, idx) {
  const prev = idx > 0 ? DAYS[idx - 1] : null;
  const next = idx < DAYS.length - 1 ? DAYS[idx + 1] : null;
  const points = WAYPOINTS_CN[d.num] || [];
  const hotels = hotelListForDay(d);
  const rentals = rentalListForDay(d);

  const legendParts = [];
  if (points.length > 1) legendParts.push("蓝色路线＝高德实时驾车路线规划");
  if (hotels.length > 0) legendParts.push("🏨红色标记＝推荐酒店");
  if (rentals.length > 0) legendParts.push("🚗绿色标记＝租车门店");

  const mapSection = points.length > 0 ? `
  <div id="amap-day-${d.num}" class="map-frame-wrap"></div>
  <div id="amap-status-${d.num}" class="map-fallback-link"></div>
  <div id="amap-day-${d.num}-live" class="map-live-note"></div>
  <div class="map-note">地图由高德地图 JS API 驱动，路线为高德实时驾车路线规划结果（仅供参考，实际路况请以导航为准）。</div>
  ${legendParts.length > 0 ? `<div class="map-legend">${legendParts.join(" · ")}</div>` : ""}
  ` : `<p class="empty-note">当天无自驾/位置移动。</p>`;

  const elevSvg = elevChartSvg(d.elevProfile);
  const elevSection = elevSvg ? `
  <div class="elev-chart-wrap">
    ${elevSvg}
    <div class="elev-chart-note">海拔变化示意图：仅标注已知的起点/关键垭口或水域/终点海拔，用直线连接，并非连续实测曲线，具体请见下方"交通"表格的海拔变化说明。</div>
  </div>` : "";

  const terrainSection = d.terrain ? `<div class="terrain-box"><strong>🏔️ 地形地貌：</strong>${d.terrain}</div>` : "";

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
        ${a.intro ? `<div class="intro">${a.intro}</div>` : ""}
        <div class="note">${a.note}</div>
        ${a.depth ? `<div class="depth-box">
          <div class="depth-row"><span class="depth-tag shallow">浅度</span>${a.depth.shallow}</div>
          <div class="depth-row"><span class="depth-tag deep">深度</span>${a.depth.deep}</div>
        </div>` : ""}
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

  const rentalHtml = (d.rentalOptions && d.rentalOptions.length > 0)
    ? d.rentalOptions.map(r => `
      <div class="hotel-item">
        <div class="name">${r.name}</div>
        <div class="meta">${r.address}</div>
        <div class="note">📞 ${r.phone}${r.note ? " ｜ " + r.note : ""}</div>
      </div>`).join("")
    : "";

  const rentalCard = rentalHtml ? `
  <div class="section-card">
    <h3><span class="icon">🚙</span>自驾租车</h3>
    ${rentalHtml}
    <div class="map-note">门店地址/电话来自第三方地图POI与官网核对，建议出发前致电门店二次确认车型库存与取还车时间。</div>
  </div>` : "";

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
    ${elevSection}
    ${terrainSection}
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
  ${rentalCard}

  <div class="prevnext">
    <a href="${prev ? "day" + prev.num + ".html" : "#"}" class="${prev ? "" : "disabled"}">← 上一天${prev ? "：D" + prev.num : ""}</a>
    <a href="${next ? "day" + next.num + ".html" : "#"}" class="${next ? "" : "disabled"}">下一天${next ? "：D" + next.num : ""} →</a>
  </div>

  <div class="disclaimer">${TRIP.disclaimer}</div>
</main>
${amapLoaderScript()}
${amapDayInitScript(d.num, points, hotels, rentals)}
${footHtml()}`;
}

// Overview map: chains all 15 days' REAL AMap driving routes onto one map
// (each day's segment independently geocoded + routed, all drawn on the same map object),
// with a "D{n}" labeled marker at each day's destination.
function amapIndexInitScript() {
  const dayList = DAYS
    .filter(d => (WAYPOINTS_CN[d.num] || []).length > 0)
    .map(d => ({ num: d.num, points: WAYPOINTS_CN[d.num] }));
  const dayListJson = JSON.stringify(dayList);

  return `<script>
(function(){
  // Explicit initial center on Urumqi/Xinjiang -- without this AMap.Map falls back to its
  // own default (roughly Beijing) until setFitView() runs, which briefly (or, if something
  // downstream hangs, permanently) shows the wrong part of the country.
  var map = new AMap.Map("amap-index", { zoom: 6, center: [87.62, 43.82], resizeEnable: true });
  var days = ${dayListJson};
  var pending = days.length;
  var doneCalled = {};
${JS_HELPERS}
  function markDone(dayNum){
    if (doneCalled[dayNum]) return; // guard against double-calling for the same day
    doneCalled[dayNum] = true;
    pending--;
    var el = document.getElementById("amap-index-status");
    if (el) el.innerHTML = "正在加载全程" + days.length + "天真实驾车路线，已完成 " + (days.length - pending) + "/" + days.length + "…";
    if (pending <= 0) {
      map.setFitView();
      if (el) el.innerHTML = "";
    }
  }

  document.getElementById("amap-index-status").innerHTML = "正在加载全程" + days.length + "天真实驾车路线，请稍候…";

  // Processed ONE day at a time (not all fired in parallel) with a short gap between each --
  // firing 13-16 concurrent AMap.Geocoder + AMap.Driving requests at once was overloading the
  // API and causing some individual day segments to silently fail to draw. A per-day timeout
  // also guarantees we move on (and eventually call setFitView) even if one request hangs.
  function processDay(i){
    if (i >= days.length) return;
    var day = days[i];
    var pts = day.points;
    var settled = false;
    var timeoutId = setTimeout(function(){
      if (settled) return;
      settled = true;
      markDone(day.num);
      setTimeout(function(){ processDay(i + 1); }, 150);
    }, 8000);
    function finish(){
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      markDone(day.num);
      setTimeout(function(){ processDay(i + 1); }, 150);
    }
    try {
      if (pts.length === 1) {
        geocode(pts[0].keyword, pts[0].city).then(function(loc){
          if (loc) {
            new AMap.Marker({ position: loc, map: map, label: { content: "D" + day.num, direction: "top" }, title: pts[0].keyword });
          }
          finish();
        }).catch(finish);
      } else {
        Promise.all(pts.map(function(p){ return geocode(p.keyword, p.city); })).then(function(locs){
          var validIdx = [];
          locs.forEach(function(l, idx){ if (l) validIdx.push(idx); });
          if (validIdx.length < 2) { finish(); return; }
          var start = locs[validIdx[0]];
          var end = locs[validIdx[validIdx.length - 1]];
          var mid = validIdx.slice(1, -1).map(function(idx){ return locs[idx]; });
          // Note: no map option passed to the constructor here on purpose -- AMap.Driving
          // auto-renders its own default start/end marker pair whenever a map is supplied, and
          // with many day-routes chained onto one shared overview map that produced multiple
          // stray marker labels. We draw the route manually as a plain polyline instead, so the
          // only markers on this map are our intentional day-number labels.
          var driving = new AMap.Driving({ policy: 0 });
          try {
            driving.search(start, end, { waypoints: mid }, function(status, result){
              if (status === "complete" && result && result.routes && result.routes[0]) {
                var path = [];
                result.routes[0].steps.forEach(function(step){ path = path.concat(step.path); });
                new AMap.Polyline({ map: map, path: path, strokeColor: "#2E6F86", strokeWeight: 4, strokeOpacity: 0.85 });
              }
              new AMap.Marker({ position: end, map: map, label: { content: "D" + day.num, direction: "top" }, title: pts[pts.length - 1].keyword });
              finish();
            });
          } catch (e) { finish(); }
        }).catch(finish);
      }
    } catch (e) { finish(); }
  }
  processDay(0);
  // Absolute safety net: whatever else happens, don't leave the map stuck showing the
  // default view forever if some request never resolves.
  setTimeout(function(){
    if (pending > 0) {
      map.setFitView();
      var el = document.getElementById("amap-index-status");
      if (el) el.innerHTML = "部分路线加载超时，已显示已完成的部分，可刷新页面重试。";
    }
  }, 60000);
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
    <div class="map-note">每日路段均为高德实时驾车路线规划结果（真实道路轨迹），首次加载需依次请求${DAYS.length}天路线，可能需要几秒钟。</div>
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
