const fs = require("fs");
const path = require("path");
const { TRIP, DAYS, ALT_DAYS } = require("./data.js");
// v32新增：方案2（反向环线）。方案1（DAYS）保持完全不变，方案2的数据独立放在 plan2.js，
// 页面输出为 p2day{n}.html，与方案1的 day{n}.html 完全隔离，互不覆盖。
const { PLAN2_META, PLAN2_DAYS } = require("./plan2.js");
// v34新增：两个方案通用的预约总表与车辆故障处理，渲染在首页
const { ROAD_BOOKINGS, SITE_BOOKINGS, BREAKDOWN, HK_LICENCE, VEHICLES } = require("./common.js");

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
  ],
  2: [
    { keyword: "阿勒泰市", city: "阿勒泰地区" },
    { keyword: "小东沟森林公园", city: "阿勒泰地区" },
    { keyword: "禾木村", city: "阿勒泰地区" },
  ],
  3: [
    { keyword: "禾木村", city: "阿勒泰地区" },
    { keyword: "喀纳斯景区贾登峪游客中心", city: "阿勒泰地区" },
  ],
  4: [
    { keyword: "喀纳斯景区贾登峪游客中心", city: "阿勒泰地区" },
    { keyword: "喀纳斯湖", city: "阿勒泰地区" },
    { keyword: "白哈巴", city: "阿勒泰地区" },
  ],
  5: [{ keyword: "喀纳斯湖", city: "阿勒泰地区" }],
  6: [
    { keyword: "喀纳斯湖", city: "阿勒泰地区" },
    { keyword: "喀纳斯景区贾登峪游客中心", city: "阿勒泰地区" },
    { keyword: "布尔津五彩滩风景区", city: "阿勒泰地区" },
  ],
  7: [
    { keyword: "布尔津县", city: "阿勒泰地区" },
    { keyword: "世界魔鬼城", city: "克拉玛依市" },
    { keyword: "奎屯市", city: "奎屯市" },
  ],
  8: [
    { keyword: "奎屯市", city: "奎屯市" },
    { keyword: "赛里木湖", city: "博尔塔拉蒙古自治州" },
  ],
  9: [
    { keyword: "赛里木湖", city: "博尔塔拉蒙古自治州" },
    { keyword: "松树头", city: "博尔塔拉蒙古自治州" },
    { keyword: "伊宁市", city: "伊宁市" },
  ],
  10: [
    { keyword: "伊宁市六星街", city: "伊宁市" },
    { keyword: "库尔德宁", city: "伊犁哈萨克自治州" },
    { keyword: "那拉提镇", city: "伊犁哈萨克自治州" },
  ],
  11: [{ keyword: "那拉提草原景区", city: "伊犁哈萨克自治州" }],
  12: [
    { keyword: "那拉提镇", city: "伊犁哈萨克自治州" },
    { keyword: "唐布拉草原", city: "伊犁哈萨克自治州" },
  ],
  13: [
    { keyword: "唐布拉草原", city: "伊犁哈萨克自治州" },
    { keyword: "乔尔玛烈士陵园", city: "伊犁哈萨克自治州" },
    { keyword: "哈希勒根达坂", city: "伊犁哈萨克自治州" },
    { keyword: "独山子大峡谷", city: "克拉玛依市" },
    { keyword: "独山子区", city: "克拉玛依市" },
  ],
  14: [
    { keyword: "独山子区", city: "克拉玛依市" },
    { keyword: "乌鲁木齐地窝堡国际机场", city: "乌鲁木齐市" },
  ],
  15: [{ keyword: "乌鲁木齐地窝堡国际机场", city: "乌鲁木齐市" }],
  // v23新增：D13a/D14a 备选合并方案
  "13a": [
    { keyword: "唐布拉草原", city: "伊犁哈萨克自治州" },
    { keyword: "乔尔玛烈士陵园", city: "伊犁哈萨克自治州" },
    { keyword: "哈希勒根达坂", city: "伊犁哈萨克自治州" },
    { keyword: "独山子大峡谷", city: "克拉玛依市" },
    { keyword: "乌鲁木齐地窝堡国际机场", city: "乌鲁木齐市" },
  ],
  "14a": [{ keyword: "天池景区", city: "阜康市" }],
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
  7: "奎屯市",
  8: "博尔塔拉蒙古自治州",
  9: "伊宁市",
  10: "伊犁哈萨克自治州",
  11: "伊犁哈萨克自治州",
  12: "伊犁哈萨克自治州",
  13: "奎屯市",
  14: "乌鲁木齐市",
  15: null,
  "13a": "乌鲁木齐市",
  "14a": "乌鲁木齐市",
};

// ---- v32新增：方案2（反向环线）的地图途经点 ----
const WAYPOINTS_CN_P2 = {
  0: [{ keyword: "乌鲁木齐地窝堡国际机场", city: "乌鲁木齐市" }],
  1: [
    { keyword: "乌鲁木齐地窝堡国际机场", city: "乌鲁木齐市" },
    { keyword: "沙湾市", city: "塔城地区" },
    { keyword: "安集海大峡谷", city: "塔城地区" },
    { keyword: "独山子大峡谷", city: "克拉玛依市" },
    { keyword: "独山子区", city: "克拉玛依市" },
  ],
  // v34：全部改用行政地名优先（Geocoder 对行政区划最可靠），POI 名称只在没有替代时使用，
  // 并已给 geocode() 加了 PlaceSearch 兜底，避免 POI 解析失败导致地图空白/路线画错。
  // v37：改用与方案1的D13相同、已验证可解析的关键词组合（只是方向相反），
  // 并配合 DRIVING_POLICY_P2 的"最短距离"策略，避免高德绕开独库公路走高速。
  2: [
    { keyword: "独山子区", city: "克拉玛依市" },
    { keyword: "乌苏驿", city: "塔城地区" },
    { keyword: "哈希勒根达坂", city: "伊犁哈萨克自治州" },
    { keyword: "乔尔玛烈士陵园", city: "伊犁哈萨克自治州" },
    { keyword: "唐布拉草原", city: "伊犁哈萨克自治州" },
  ],
  // v39：孟克特景区封闭施工，D3改为直达昭苏，D4=夏塔，D5=昭苏机动日
  3: [
    { keyword: "唐布拉草原", city: "伊犁哈萨克自治州" },
    { keyword: "尼勒克县", city: "伊犁哈萨克自治州" },
    { keyword: "巩留县", city: "伊犁哈萨克自治州" },
    { keyword: "特克斯县", city: "伊犁哈萨克自治州" },
  ],
  4: [
    { keyword: "特克斯县", city: "伊犁哈萨克自治州" },
    { keyword: "喀拉峻景区", city: "伊犁哈萨克自治州" },
    { keyword: "昭苏县", city: "伊犁哈萨克自治州" },
  ],
  5: [
    { keyword: "昭苏县", city: "伊犁哈萨克自治州" },
    { keyword: "夏塔古道", city: "伊犁哈萨克自治州" },
  ],
  // v34修复：原来用"白石峰"（POI，解析失败）导致高德没有走 S237 伊昭公路，
  // 改用伊昭公路沿线的行政地名强制上线：昭苏 → 加尕斯台镇(S237 K44，进山前最后一个建制镇)
  // → 察布查尔县城 → 伊宁。来源：察布查尔县政府官网、伊犁州政府绕行公告。
  // v37：D6 之前画成绕特克斯，是因为强制点没解析成功＋"最快"算法绕开了低限速山路。
  // 现在改为多个沿线行政地名依次强制（察布查尔县境内97公里都属S237），并用"最短距离"策略。
  // 依据：察布查尔县政府官网、伊犁州政府绕行公告——S237顺序为
  // 伊宁伊犁河二桥 → 察布查尔镇(县城) → 加尕斯台镇(K44) → 乌孙山(安格列特达坂/白石峰) → 昭苏县城。
  6: [
    { keyword: "昭苏县", city: "伊犁哈萨克自治州" },
    { keyword: "安格列特达坂", city: "伊犁哈萨克自治州" },
    { keyword: "加尕斯台镇", city: "伊犁哈萨克自治州" },
    { keyword: "察布查尔锡伯自治县", city: "伊犁哈萨克自治州" },
    { keyword: "伊宁市", city: "伊宁市" },
  ],
  7: [
    { keyword: "伊宁市", city: "伊宁市" },
    { keyword: "果子沟大桥", city: "伊犁哈萨克自治州" },
    { keyword: "赛里木湖", city: "博尔塔拉蒙古自治州" },
  ],
  8: [
    { keyword: "赛里木湖", city: "博尔塔拉蒙古自治州" },
    { keyword: "精河县", city: "博尔塔拉蒙古自治州" },
    { keyword: "奎屯市", city: "奎屯市" },
  ],
  9: [
    { keyword: "奎屯市", city: "奎屯市" },
    { keyword: "克拉玛依市", city: "克拉玛依市" },
    { keyword: "乌尔禾区", city: "克拉玛依市" },
    { keyword: "布尔津县", city: "阿勒泰地区" },
  ],
  10: [
    { keyword: "布尔津县", city: "阿勒泰地区" },
    { keyword: "喀纳斯景区贾登峪游客中心", city: "阿勒泰地区" },
  ],
  11: [
    { keyword: "喀纳斯景区贾登峪游客中心", city: "阿勒泰地区" },
    { keyword: "喀纳斯湖", city: "阿勒泰地区" },
  ],
  12: [
    { keyword: "喀纳斯湖", city: "阿勒泰地区" },
    { keyword: "喀纳斯景区贾登峪游客中心", city: "阿勒泰地区" },
    { keyword: "禾木村", city: "阿勒泰地区" },
  ],
  13: [
    { keyword: "禾木村", city: "阿勒泰地区" },
    { keyword: "小东沟森林公园", city: "阿勒泰地区" },
    { keyword: "阿勒泰市", city: "阿勒泰地区" },
  ],
  14: [
    { keyword: "阿勒泰市", city: "阿勒泰地区" },
    { keyword: "乌鲁木齐地窝堡国际机场", city: "乌鲁木齐市" },
  ],
  15: [{ keyword: "乌鲁木齐地窝堡国际机场", city: "乌鲁木齐市" }],
};

// v37：需要强制走山区风景公路的天数改用"最短距离"策略（2），其余用默认的"最快"（0）。
// 依据：高德"速度最快"算法会为了省时间绕开限速低的独库公路、伊昭公路，画出的不是实际要走的路。
const DRIVING_POLICY_P1 = {
  13: 2,   // 唐布拉 → 乔尔玛 → 独库北段 → 独山子
  "13a": 2,
};
const DRIVING_POLICY_P2 = {
  1: 2,    // 走S101山区段，用"最短距离"避免高德绕回G30
  2: 2,    // 独山子 → 独库北段 → 乔尔玛 → 唐布拉
  6: 2,    // 昭苏 → 伊昭公路S237 → 伊宁
};

const HOTEL_CITY_BIAS_P2 = {
  0: "乌鲁木齐市",
  1: "克拉玛依市",
  2: "伊犁哈萨克自治州",
  3: "伊犁哈萨克自治州",
  4: "伊犁哈萨克自治州",
  5: "伊犁哈萨克自治州",
  6: "伊宁市",
  7: "博尔塔拉蒙古自治州",
  8: "奎屯市",
  9: "阿勒泰地区",
  10: "阿勒泰地区",
  11: "阿勒泰地区",
  12: "阿勒泰地区",
  13: "阿勒泰地区",
  14: "乌鲁木齐市",
  15: null,
};

// Rental car pickup (Day 1, 8/16) / return (Day 14, 8/29, or Day 13a for the merged alternative)
// label prefixes for map markers, geocoded directly by each rental company's real name+address
// (see data.js rentalOptions).
const RENTAL_LABEL_PREFIX = {
  1: "🚗 取车：",
  14: "🚗 还车：",
  "13a": "🚗 还车：",
};

function hotelListForDay(d, biasTable) {
  const city = (biasTable || HOTEL_CITY_BIAS)[d.num];
  if (!city || !d.hotels) return [];
  return d.hotels
    .filter(h => h.name && !h.name.startsWith("（同") && !h.name.startsWith("（改期失败") && !h.name.startsWith("（备选") && !h.name.startsWith("⚠️ 关于"))
    .map(h => ({ name: h.name.replace(/^⭐\s*/, ""), city }));
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
nav.day-nav .nav-sep {
  color: rgba(255,255,255,0.7);
  font-size: 12px;
  margin-left: 4px;
  white-space: nowrap;
}
/* v32新增：方案1/方案2 切换条与总览页的方案卡片 */
nav.plan-switch {
  display: flex; gap: 8px; flex-wrap: wrap;
  background: #12333f; padding: 8px 12px;
  border-bottom: 1px solid rgba(255,255,255,0.12);
}
nav.plan-switch a {
  color: rgba(255,255,255,0.72); text-decoration: none;
  font-size: 13px; font-weight: 600; padding: 5px 12px;
  border-radius: 999px; border: 1px solid rgba(255,255,255,0.22);
  white-space: nowrap;
}
nav.plan-switch a.active { background: var(--warn-border); color: #2B2B2B; border-color: var(--warn-border); }
.plan-card {
  border: 2px solid var(--teal-light); border-radius: var(--radius);
  padding: 14px 16px; margin-bottom: 16px; background: #fff;
}
.plan-card h4 { margin: 0 0 6px; font-size: 16px; color: var(--teal); }
.plan-card .plan-sub { font-size: 13px; color: var(--muted); margin-bottom: 8px; }
.plan-card .plan-go {
  display: inline-block; margin-top: 10px; padding: 7px 16px;
  background: var(--teal); color: #fff; text-decoration: none;
  border-radius: 999px; font-size: 13.5px; font-weight: 600;
}
.res-item { border-left: 3px solid var(--warn-border); padding: 8px 0 8px 12px; margin-bottom: 16px; }
.res-item .res-name { font-weight: 700; font-size: 14.5px; color: var(--teal); }
.res-item .res-when { font-size: 12.5px; color: var(--muted); margin: 2px 0 6px; }
.res-item .res-body { font-size: 13.5px; }
.res-item .res-body p { margin: 5px 0; }
.defer-table { width: 100%; border-collapse: collapse; font-size: 13.5px; margin: 10px 0; }
.defer-table th, .defer-table td { border: 1px solid var(--border); padding: 7px 9px; text-align: left; vertical-align: top; }
.defer-table th { background: var(--sand); font-weight: 600; }
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

// v32新增 / v33调整：方案切换条。activePlan: 0=首页（只有两个方案入口）, 1=方案1（正向）, 2=方案2（反向）
// v33变更：首页 index.html 现在只做方案选择，每个方案各有独立的总览页 plan1.html / plan2.html
function planSwitchHtml(activePlan) {
  return `<nav class="plan-switch">
  <a href="index.html" class="${activePlan === 0 ? "active" : ""}">🏠 首页</a>
  <a href="plan1.html" class="${activePlan === 1 ? "active" : ""}">方案1 · 正向（阿勒泰→伊犁）</a>
  <a href="plan2.html" class="${activePlan === 2 ? "active" : ""}">方案2 · 反向（伊犁→阿勒泰）</a>
</nav>`;
}

function navHtml(activeNum, plan, isOverview) {
  plan = plan || 1;
  const days = plan === 2 ? PLAN2_DAYS : DAYS;
  const pfx = plan === 2 ? "p2day" : "day";
  const overviewHref = plan === 2 ? "plan2.html" : "plan1.html";
  let items = `<a href="${overviewHref}" class="${isOverview ? "active" : ""}">总览</a>`;
  for (const d of days) {
    items += `<a href="${pfx}${d.num}.html" class="${activeNum === d.num ? "active" : ""}">D${d.num}</a>`;
  }
  // 备选的D13a/D14a合并方案只属于方案1，方案2不适用
  if (plan === 1 && ALT_DAYS && ALT_DAYS.length > 0) {
    items += `<span class="nav-sep">备选：</span>`;
    for (const d of ALT_DAYS) {
      items += `<a href="day${d.num}.html" class="${activeNum === d.num ? "active" : ""}">D${d.num}</a>`;
    }
  }
  return `${planSwitchHtml(plan)}<nav class="day-nav">${items}</nav>`;
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

// v38：已核实经纬度的途经点，直接用坐标绕开高德的名称解析。
// 全部为 WGS-84（维基/OSM/GeoNames 惯例），页面脚本里会转换成高德用的 GCJ-02。
// 格式：关键词 -> [纬度, 经度]
// ⚠️ 查不到可靠坐标的点（乔尔玛、加尕斯台镇、安格列特达坂、白石峰、孟克特、唐布拉观景台）
//    一律不写死，仍走名称解析——宁可解析失败并在页面上报告，也不编造坐标。
const COORD_OVERRIDES = {
  "独山子区": [44.3278, 84.8844],              // OSM node 429286400 + GeoNames 1529528。注：英文维基信息框那个45°36′N是克拉玛依市区，是错的
  "哈希勒根达坂": [43.7311, 84.4196],           // dangerousroads.org 页内地图点位；⚠️本表唯一非官方来源，可信度中等
  "尼勒克县": [43.8003, 82.5117],              // 英文维基 Nilka County
  "昭苏县": [43.1572, 81.1311],                // 英文维基 Zhaosu County
  "察布查尔锡伯自治县": [43.8408, 81.1514],      // 英文维基 Qapqal Xibe Autonomous County
  "伊宁市": [43.9081, 81.2778],                // 英文维基 Yining
  "特克斯县": [43.2136, 81.8372],              // 英文维基 Tekes County
  "巩留县": [43.4667, 82.1489],                // 英文维基 Gongliu County
  "夏塔古道": [42.6682, 80.5863],              // OSM node 9026734017「夏塔景区」
};

// v40：世界遗产片区的地图标记点（按关键词检索定位，非官方边界）
const HERITAGE_POINTS = {
  p1: {
    2:["禾木村"], 3:["喀纳斯景区贾登峪游客中心"], 4:["喀纳斯湖","白哈巴村"], 5:["喀纳斯湖"], 6:["喀纳斯湖"],
    9:["惠远古城"], 10:["库尔德宁","伊犁将军府"], 13:["乔尔玛烈士陵园"],
    1:["切木尔切克石人"], 14:["乌鲁木齐文庙","陕西大寺"], "14a":["天山天池"],
  },
  p2: {
    2:["乔尔玛烈士陵园"], 3:["特克斯八卦城","库尔德宁"], 4:["喀拉峻景区","昭苏圣佑庙"],
    5:["夏塔古城遗址"], 6:["靖远寺","伊宁市"], 7:["惠远古城"],
    10:["喀纳斯景区贾登峪游客中心"], 11:["喀纳斯湖"], 12:["禾木村"], 13:["切木尔切克石人"],
    14:["乌鲁木齐文庙","陕西大寺"],
  },
};

// Shared geocode/marker helper functions, inlined into every page's map script.
const JS_HELPERS = `
  // v37：多级兜底解析。AMap.Geocoder 是"地址"解析器，只对行政地名（市/县/区/乡镇）可靠；
  // 对"哈希勒根达坂""乔尔玛烈士陵园""孟克特旅游景区""加尕斯台镇"这类 POI / 小地名经常失败。
  // 失败的途经点如果被静默跳过，就会导致地图空白或画出完全错误的路线（例如伊昭公路被绕成走特克斯）。
  // 这里按 4 级策略依次尝试，并把最终失败的关键词报告到页面上，不再静默吞掉。
  // v38：WGS-84 → GCJ-02（火星坐标）转换。维基/OSM/GeoNames 给的都是 WGS-84，
  // 高德底图用的是 GCJ-02，直接混用会有 300-600 米偏移，在山区垭口可能被吸附到错误的路上。
  function wgs84ToGcj02(lng, lat) {
    var a = 6378245.0, ee = 0.00669342162296594323;
    function tLat(x, y) {
      var r = -100.0 + 2.0*x + 3.0*y + 0.2*y*y + 0.1*x*y + 0.2*Math.sqrt(Math.abs(x));
      r += (20.0*Math.sin(6.0*x*Math.PI) + 20.0*Math.sin(2.0*x*Math.PI)) * 2.0/3.0;
      r += (20.0*Math.sin(y*Math.PI) + 40.0*Math.sin(y/3.0*Math.PI)) * 2.0/3.0;
      r += (160.0*Math.sin(y/12.0*Math.PI) + 320.0*Math.sin(y*Math.PI/30.0)) * 2.0/3.0;
      return r;
    }
    function tLng(x, y) {
      var r = 300.0 + x + 2.0*y + 0.1*x*x + 0.1*x*y + 0.1*Math.sqrt(Math.abs(x));
      r += (20.0*Math.sin(6.0*x*Math.PI) + 20.0*Math.sin(2.0*x*Math.PI)) * 2.0/3.0;
      r += (20.0*Math.sin(x*Math.PI) + 40.0*Math.sin(x/3.0*Math.PI)) * 2.0/3.0;
      r += (150.0*Math.sin(x/12.0*Math.PI) + 300.0*Math.sin(x/30.0*Math.PI)) * 2.0/3.0;
      return r;
    }
    var dLat = tLat(lng - 105.0, lat - 35.0), dLng = tLng(lng - 105.0, lat - 35.0);
    var radLat = lat / 180.0 * Math.PI;
    var magic = Math.sin(radLat); magic = 1 - ee*magic*magic;
    var sqrtMagic = Math.sqrt(magic);
    dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * Math.PI);
    dLng = (dLng * 180.0) / (a / sqrtMagic * Math.cos(radLat) * Math.PI);
    return [lng + dLng, lat + dLat];
  }
  function geocodeOnce(address, city, useCity) {
    return new Promise(function(resolve){
      var g = new AMap.Geocoder(useCity && city ? { city: city } : {});
      g.getLocation(address, function(status, result){
        if (status === "complete" && result.geocodes && result.geocodes.length) {
          resolve(result.geocodes[0].location);
        } else { resolve(null); }
      });
    });
  }
  function placeOnce(address, city) {
    return new Promise(function(resolve){
      var ps = new AMap.PlaceSearch({ pageSize: 1, extensions: "base", citylimit: false });
      if (city) { try { ps.setCity(city); } catch (e) {} }
      ps.search(address, function(s2, r2){
        if (s2 === "complete" && r2 && r2.poiList && r2.poiList.pois && r2.poiList.pois.length) {
          resolve(r2.poiList.pois[0].location);
        } else { resolve(null); }
      });
    });
  }
  // v38：已核实经纬度的地点直接用坐标，不再依赖高德的名称解析（这是D2整张图空白的根因：
  // 4个途经点里3个是POI名，解析全失败，可用点不足2个就直接返回，地图停在高德默认的北京视野）。
  // 坐标来源见 COORD_OVERRIDES 的注释，均为 WGS-84，在此转成高德用的 GCJ-02。
  var COORDS = ${JSON.stringify(COORD_OVERRIDES)};
  function geocode(address, city) {
    var c = COORDS[address];
    if (c) {
      var g = wgs84ToGcj02(c[1], c[0]);
      return Promise.resolve(new AMap.LngLat(g[0], g[1]));
    }
    return geocodeOnce(address, city, true)
      .then(function(l){ return l || placeOnce(address, city); })
      // v38：第3级不再传州级地名（"伊犁哈萨克自治州"这类 setCity 会让 PlaceSearch 返回空），
      // 改为完全不限定城市，让关键词在全国范围检索。
      .then(function(l){ return l || placeOnce(address, null); })
      .then(function(l){ return l || geocodeOnce(address, city, false); });
  }
  function hotelIcon(){
    return new AMap.Icon({ size: new AMap.Size(25,34), image: "https://webapi.amap.com/theme/v1.3/markers/n/mark_r.png", imageSize: new AMap.Size(25,34) });
  }
  function rentalIcon(){
    return new AMap.Icon({ size: new AMap.Size(25,34), image: "https://webapi.amap.com/theme/v1.3/markers/n/mark_g.png", imageSize: new AMap.Size(25,34) });
  }
  function heritageIcon(){
    return new AMap.Icon({ size: new AMap.Size(25,34), image: "https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png", imageSize: new AMap.Size(25,34) });
  }
  function gasIcon(){
    return new AMap.Icon({ size: new AMap.Size(19,33), image: "https://webapi.amap.com/theme/v1.3/markers/n/mark_bs.png", imageSize: new AMap.Size(19,33) });
  }
`;

// Builds the AMap init script for a single day's map div: real driving route
// (via geocoded coordinates, not keyword search, for reliability), hotel markers,
// and rental car pickup/return markers (geocoded by each company's real name+city).
function amapDayInitScript(dayNum, points, hotels, rentals, policy, heritagePts) {
  const mapId = `amap-day-${dayNum}`;
  const statusId = `amap-status-${dayNum}`;
  if (!points || points.length === 0) return "";
  // v37：AMap.Driving 策略。0=最快（默认），2=最短距离。
  // 独库公路、伊昭公路这类限速低的山区风景路，用"最快"算法高德会绕开走高速/绕城，
  // 画出的根本不是本页描述的那条路；对这几天改用"最短距离"更贴近实际走法。
  const drivingPolicy = typeof policy === "number" ? policy : 0;

  const pointsJson = JSON.stringify(points);
  const hotelsJson = JSON.stringify(hotels || []);
  const rentalsJson = JSON.stringify(rentals || []);
  const heritageJson = JSON.stringify(heritagePts || []);

  return `<script>
(function(){
  // v38：显式指定新疆为初始中心。此前没有 center，一旦当天可定位的点不足2个就会提前返回、
  // 永远不调用 setFitView()，地图就停在高德默认的华北视野（用户实际看到的是"北京/渤海湾"）。
  var map = new AMap.Map("${mapId}", { zoom: 6, center: [85.0, 44.0], resizeEnable: true });
  var routePoints = ${pointsJson};
  var hotels = ${hotelsJson};
  var rentals = ${rentalsJson};
  var heritagePts = ${heritageJson};
${JS_HELPERS}
  function addHotelMarkers(){
    hotels.forEach(function(h){
      geocode(h.name, h.city).then(function(loc){
        if (!loc) return;
        new AMap.Marker({ position: loc, map: map, icon: hotelIcon(), title: h.name, label: { content: "🏨 " + h.name, direction: "top" } });
      });
    });
  }
  function addHeritageMarkers(){
    heritagePts.forEach(function(kw){
      geocode(kw, null).then(function(loc){
        if (!loc) return;
        new AMap.Marker({ position: loc, map: map, icon: heritageIcon(), title: kw,
          label: { content: "🏛️ 世界遗产：" + kw, direction: "bottom" } });
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
  // Live-search real gas stations (⛽) near each route waypoint via AMap PlaceSearch,
  // rather than hardcoding station names/locations (which would go stale and can't be verified per-day).
  function addGasStationMarkers(anchorLocs){
    if (!anchorLocs || anchorLocs.length === 0) return;
    var seen = {};
    // A fresh AMap.PlaceSearch instance per call, since reusing one instance for
    // concurrent searchNearBy calls can cause callbacks to clobber each other.
    anchorLocs.forEach(function(loc){
      var placeSearch = new AMap.PlaceSearch({ pageSize: 5, extensions: "base", citylimit: false });
      placeSearch.searchNearBy("加油站", loc, 20000, function(status, result){
        if (status !== "complete" || !result || !result.poiList || !result.poiList.pois) return;
        result.poiList.pois.forEach(function(poi){
          if (!poi.location) return;
          var key = poi.name + "_" + poi.location.toString();
          if (seen[key]) return;
          seen[key] = true;
          new AMap.Marker({
            position: poi.location, map: map, icon: gasIcon(), title: poi.name,
            label: { content: "⛽ " + poi.name, direction: "right" }
          });
        });
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
      addHeritageMarkers();
    });
  } else {
    Promise.all(routePoints.map(function(p){ return geocode(p.keyword, p.city); })).then(function(locs){
      var validIdx = [], failed = [];
      locs.forEach(function(l, i){ if (l) validIdx.push(i); else failed.push(routePoints[i].keyword); });
      var statusEl = document.getElementById("${statusId}");
      // v37：不再静默跳过解析失败的途经点，明确报告出来
      if (failed.length > 0 && statusEl) {
        statusEl.innerHTML = "⚠️ 以下途经点未能在高德地图中定位、已从路线中跳过：<strong>" + failed.join("、") +
          "</strong>。这会导致下方路线偏离本页文字描述的实际走法，<strong>请以文字描述和出发前的导航实测为准</strong>。";
      }
      // 兜底：至少把已解析的点用虚线连起来，保证地图不是空白
      function drawFallbackLine(reason){
        if (validIdx.length < 2) return;
        new AMap.Polyline({
          path: validIdx.map(function(i){ return locs[i]; }), map: map,
          strokeColor: "#C0392B", strokeWeight: 3, strokeStyle: "dashed", strokeOpacity: 0.9
        });
        validIdx.forEach(function(i){
          new AMap.Marker({ position: locs[i], map: map, title: routePoints[i].keyword,
            label: { content: routePoints[i].keyword, direction: "top" } });
        });
        if (statusEl) statusEl.innerHTML += "<br>🔺 " + reason + "下方<strong>红色虚线为各已定位点之间的直线示意，不是真实道路轨迹</strong>，仅供判断大致方位。";
        map.setFitView();
      }
      if (validIdx.length < 2) {
        if (statusEl) statusEl.innerHTML += "<br>可定位的点不足2个，无法规划路线，请在高德地图App中手动搜索：" + routePoints.map(function(p){ return p.keyword; }).join(" → ");
        addHotelMarkers();
        addRentalMarkers();
        addHeritageMarkers();
        return;
      }
      var start = locs[validIdx[0]];
      var end = locs[validIdx[validIdx.length - 1]];
      var mid = validIdx.slice(1, -1).map(function(i){ return locs[i]; });
      var driving = new AMap.Driving({ map: map, policy: ${drivingPolicy} });
      driving.search(start, end, { waypoints: mid }, function(status, result){
        if (status !== "complete") {
          drawFallbackLine("高德未能规划出经过全部途经点的驾车路线。");
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
        addHeritageMarkers();
        addGasStationMarkers(validIdx.map(function(i){ return locs[i]; }));
      });
    });
  }
})();
</script>`;
}

function renderDayPage(d, idx, navOverride, plan) {
  plan = plan || 1;
  const planDays = plan === 2 ? PLAN2_DAYS : DAYS;
  const pfx = plan === 2 ? "p2day" : "day";
  const wpTable = plan === 2 ? WAYPOINTS_CN_P2 : WAYPOINTS_CN;
  const biasTable = plan === 2 ? HOTEL_CITY_BIAS_P2 : HOTEL_CITY_BIAS;
  const prev = navOverride ? (navOverride.prev || null) : (idx > 0 ? planDays[idx - 1] : null);
  const next = navOverride ? (navOverride.next || null) : (idx < planDays.length - 1 ? planDays[idx + 1] : null);
  const points = wpTable[d.num] || [];
  const hotels = hotelListForDay(d, biasTable);
  const rentals = rentalListForDay(d);

  const legendParts = [];
  if (points.length > 1) legendParts.push("蓝色路线＝高德实时驾车路线规划");
  if (hotels.length > 0) legendParts.push("🏨红色标记＝推荐酒店");
  if (rentals.length > 0) legendParts.push("🚗绿色标记＝租车门店");
  if (d.heritage && d.heritage.length > 0) legendParts.push("🏛️蓝色标记＝世界遗产片区大致位置（按名称检索，非官方边界）");
  if (points.length > 1) legendParts.push("⛽标记＝高德实时搜索到的沿途加油站（自动检索，非人工核实，仅供参考，出发前请以导航实际结果为准）");

  const mapSection = points.length > 0 ? `
  <div id="amap-day-${d.num}" class="map-frame-wrap"></div>
  <div id="amap-status-${d.num}" class="map-fallback-link"></div>
  <div id="amap-day-${d.num}-live" class="map-live-note"></div>
  ${(plan === 2 ? DRIVING_POLICY_P2 : DRIVING_POLICY_P1)[d.num] === 2 ? `<div class="warn-box" style="font-size:13px;">🛣️ <strong>这一天走的是山区风景公路，地图已做特殊处理</strong>：默认的"速度最快"算法会为了省时间绕开限速低的独库/伊昭公路（此前D6就被画成了绕行特克斯），所以这一天改用<strong>"最短距离"</strong>策略，并用已核实经纬度的点强制途经。<strong>如果下方路线看起来仍然不是本页描述的那条路</strong>，那是高德路网数据本身对这类季节性开放/限时通行道路的处理所致（独库19:00-次日8:00封闭、伊昭21:00-次日9:00禁行，且都可能临时封路），<strong>请以文字描述和出发前用高德App实测为准</strong>。</div>` : ""}
  <div class="map-note">地图由高德地图 JS API 驱动，路线为高德实时规划结果，仅供参考；对于限速较低的山区风景公路（如独库公路）或刚通车、地图数据库可能尚未收录的新路（如阿禾公路），算法有可能判定绕行其它道路"更快"而没有真正画出本文描述的那条路，与下方"交通"表格里的文字描述（里程/车程/路名）如有出入，请以文字描述和出发前的导航实测结果为准。</div>
  ${legendParts.length > 0 ? `<div class="map-legend">${legendParts.join(" · ")}</div>` : ""}
  ` : `<p class="empty-note">当天无自驾/位置移动。</p>`;

  const elevSvg = elevChartSvg(d.elevProfile);
  const elevSection = elevSvg ? `
  <div class="elev-chart-wrap">
    ${elevSvg}
    <div class="elev-chart-note">海拔变化示意图：仅标注已知的起点/关键垭口或水域/终点海拔，用直线连接，并非连续实测曲线，具体请见下方"交通"表格的海拔变化说明。</div>
  </div>` : "";

  const terrainSection = d.terrain ? `<div class="terrain-box"><strong>🏔️ 地形地貌：</strong>${d.terrain}</div>` : "";

  // v40新增：沿途世界遗产 / 世界遗产预备名单
  const heritageSection = (d.heritage && d.heritage.length > 0) ? `
  <div class="section-card">
    <h3><span class="icon">🏛️</span>沿途世界级 / 国家级遗产与保护建筑</h3>
    ${d.heritage.map(h => `
    <div class="res-item">
      <div class="res-name">${h.name}</div>
      <div class="res-when">${h.type}</div>
      <div class="res-body"><p>${h.note}</p></div>
    </div>`).join("")}
    <div class="map-note">收录范围：<strong>世界遗产（含预备名单）、世界地质公园、国家地质公园、全国重点文物保护单位（国保）、国家历史文化名城/名村、中国历史文化街区、中国传统村落</strong>。凡只有自治区级/州级身份的，已在条目中明确标注，不冒充国家级。<br>资料来源：UNESCO 世界遗产中心（whc.unesco.org）、UNESCO 世界地质公园网络（unesco.org/en/iggp）、国家文物局、住房和城乡建设部、新疆维吾尔自治区自然资源厅、国家林草局及新疆各级政府官网。地图上的 🏛️ 标记为遗产/地质公园的大致位置，由高德地图按名称检索得出，<strong>不是官方公布的边界</strong>，仅供定位参考。<br>📌 已核查但<strong>不在本次路线上</strong>的：新疆境内唯一一处 UNESCO 世界地质公园是<strong>可可托海世界地质公园</strong>（阿勒泰地区富蕴县，2017年列入，中国第35家），距阿勒泰市约290公里、距布尔津约390公里，往返需额外1.5-2天，本次未纳入。另经核查，<strong>乌尔禾世界魔鬼城、五彩滩、独山子大峡谷、赛里木湖、那拉提、喀拉峻</strong>均<strong>不是</strong>地质公园（魔鬼城是5A景区，其白垩纪鸟类足迹化石产地被列为自治区级重要地质遗迹，但未查到地质公园批复）。</div>
  </div>` : "";

  const t = d.transport || {};
  const transportRows = [
    renderTransportRow("路线", t.roads),
    renderTransportRow("里程", t.distance),
    renderTransportRow("车程", t.duration),
    renderTransportRow("海拔变化", t.elevation),
    renderTransportRow("历史天气参考", t.weather),
    renderTransportRow("加油站", t.gasStations),
    renderTransportRow("是否需预约", t.reservation),
  ].join("");

  const notesBox = t.notes ? `<div class="warn-box"><strong>驾车注意事项：</strong>${t.notes}</div>` : "";
  const resAlertBox = d.reservationAlert ? `<div class="warn-box"><strong>预约提醒：</strong>${d.reservationAlert}</div>` : "";

  const sc = d.sunClothing;
  const sunClothingRows = sc ? [
    renderTransportRow("日出", sc.sunrise),
    renderTransportRow("日落", sc.sunset),
    renderTransportRow("白天气温参考", sc.tempHigh),
    renderTransportRow("夜间气温参考", sc.tempLow),
    renderTransportRow("紫外线", sc.uv),
  ].join("") : "";
  const sunClothingCard = sc ? `
  <div class="section-card">
    <h3><span class="icon">☀️</span>日出日落 &amp; 穿衣建议</h3>
    <table class="info-table">${sunClothingRows}</table>
    ${sc.clothing ? `<div class="warn-box"><strong>👕 穿衣建议：</strong>${sc.clothing}</div>` : ""}
    ${sc.sourceNote ? `<div class="map-note">📌 数据来源与可信度：${sc.sourceNote}</div>` : ""}
  </div>` : "";

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

  const isAlt = typeof d.num === "string";
  const altBanner = isAlt ? `
  <div class="warn-box">🔀 这是一个<strong>可选替代方案</strong>页面，与默认的16天行程二选一使用，<strong>不计入正式16天总天数</strong>。使用本方案请同时查看对应的另一半备选页面，并相应忽略默认方案里被替代的那几天的住宿/还车安排。</div>` : "";

  const planBanner = plan === 2 ? `
  <div class="warn-box">🔄 你正在浏览的是 <strong>方案2 · 反向环线</strong>（伊犁先 → 阿勒泰后，含昭苏/夏塔/伊昭公路，放弃那拉提/库尔德宁/白哈巴）。它与 <a href="day${d.num}.html">方案1 · 正向的同一天</a> 是<strong>二选一</strong>的关系，机票日期完全相同，不能同时执行。切换到方案2之前，请务必先看<a href="plan2.html">方案2总览页</a>里的「预约总览」和「酒店改期方案」——特别是独库公路的预约风险，以及8/17禾木、8/18贾登峪那两晚不可取消订单的改期问题。</div>` : "";

  return `${headHtml(`D${d.num} ${d.title} - ${TRIP.title}`)}
<header class="site-header">
  <h1>${TRIP.title}</h1>
  <p>${TRIP.subtitle}</p>
</header>
${navHtml(d.num, plan)}
<main>
  ${altBanner}${planBanner}
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
  ${heritageSection}
  ${sunClothingCard}

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
    <a href="${prev ? pfx + prev.num + ".html" : "#"}" class="${prev ? "" : "disabled"}">← 上一天${prev ? "：D" + prev.num : ""}</a>
    <a href="${next ? pfx + next.num + ".html" : "#"}" class="${next ? "" : "disabled"}">下一天${next ? "：D" + next.num : ""} →</a>
  </div>

  <div class="disclaimer">${TRIP.disclaimer}</div>
</main>
${amapLoaderScript()}
${amapDayInitScript(d.num, points, hotels, rentals, (plan === 2 ? DRIVING_POLICY_P2 : DRIVING_POLICY_P1)[d.num], (plan === 2 ? HERITAGE_POINTS.p2 : HERITAGE_POINTS.p1)[d.num])}
${footHtml()}`;
}

// Overview map: chains all 15 days' REAL AMap driving routes onto one map
// (each day's segment independently geocoded + routed, all drawn on the same map object),
// with a "D{n}" labeled marker at each day's destination.
function amapIndexInitScript(plan) {
  plan = plan || 1;
  const srcDays = plan === 2 ? PLAN2_DAYS : DAYS;
  const srcWp = plan === 2 ? WAYPOINTS_CN_P2 : WAYPOINTS_CN;
  const srcPolicy = plan === 2 ? DRIVING_POLICY_P2 : DRIVING_POLICY_P1;
  const dayList = srcDays
    .filter(d => (srcWp[d.num] || []).length > 0)
    .map(d => ({ num: d.num, points: srcWp[d.num], policy: srcPolicy[d.num] || 0 }));
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
  // v37：记录解析/规划失败的点和天，最后统一报告，不再静默丢失整段路线
  var failedPoints = [];
  var failedDays = [];
${JS_HELPERS}
  function markDone(dayNum){
    if (doneCalled[dayNum]) return; // guard against double-calling for the same day
    doneCalled[dayNum] = true;
    pending--;
    var el = document.getElementById("amap-index-status");
    if (el) el.innerHTML = "正在加载全程" + days.length + "天真实驾车路线，已完成 " + (days.length - pending) + "/" + days.length + "…";
    if (pending <= 0) {
      map.setFitView();
      if (el) {
        if (failedDays.length === 0 && failedPoints.length === 0) {
          el.innerHTML = "";
        } else {
          var msg = "";
          if (failedPoints.length > 0) {
            msg += "⚠️ 以下途经点未能在高德地图中定位、已跳过：<strong>" + failedPoints.join("、") + "</strong>。";
          }
          if (failedDays.length > 0) {
            msg += "🔺 <strong>" + failedDays.join("、") + "</strong> 未能规划出完整驾车路线，图上以<strong>红色虚线</strong>表示（直线示意，非真实道路轨迹）。";
          }
          msg += "请以各日页面的文字描述和出发前的导航实测为准。";
          el.innerHTML = msg;
        }
      }
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
          locs.forEach(function(l, idx){ if (l) validIdx.push(idx); else failedPoints.push("D" + day.num + "「" + pts[idx].keyword + "」"); });
          if (validIdx.length < 2) {
            // v37：即使无法规划路线，也至少把已定位的点标出来，并记入失败报告
            failedDays.push("D" + day.num);
            if (validIdx.length === 1) {
              new AMap.Marker({ position: locs[validIdx[0]], map: map, label: { content: "D" + day.num, direction: "top" } });
            }
            finish(); return;
          }
          var start = locs[validIdx[0]];
          var end = locs[validIdx[validIdx.length - 1]];
          var mid = validIdx.slice(1, -1).map(function(idx){ return locs[idx]; });
          // Note: no map option passed to the constructor here on purpose -- AMap.Driving
          // auto-renders its own default start/end marker pair whenever a map is supplied, and
          // with many day-routes chained onto one shared overview map that produced multiple
          // stray marker labels. We draw the route manually as a plain polyline instead, so the
          // only markers on this map are our intentional day-number labels.
          var driving = new AMap.Driving({ policy: (typeof day.policy === "number" ? day.policy : 0) });
          try {
            driving.search(start, end, { waypoints: mid }, function(status, result){
              if (status === "complete" && result && result.routes && result.routes[0]) {
                var path = [];
                result.routes[0].steps.forEach(function(step){ path = path.concat(step.path); });
                new AMap.Polyline({ map: map, path: path, strokeColor: "#2E6F86", strokeWeight: 4, strokeOpacity: 0.85 });
              } else {
                // v37：驾车规划失败时画红色虚线兜底，并记入报告，避免整段路线在总览图上凭空消失
                failedDays.push("D" + day.num);
                new AMap.Polyline({ map: map, path: validIdx.map(function(x){ return locs[x]; }),
                  strokeColor: "#C0392B", strokeWeight: 3, strokeStyle: "dashed", strokeOpacity: 0.9 });
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

// v33：首页只做方案选择，不再承载任何逐日内容或总览地图
function renderLandingPage() {
  return `${headHtml(TRIP.title)}
<header class="site-header">
  <h1>${TRIP.title}</h1>
  <p>${TRIP.subtitle}</p>
</header>
${planSwitchHtml(0)}
<main>
  <div class="section-card">
    <h3><span class="icon">🔀</span>请选择一个方案</h3>
    <p class="idx-summary">两个方案都是16天（8月15日-8月30日），<strong>机票日期完全相同，只能二选一执行</strong>。点进任一方案可以看到它自己的总览地图、逐日行程和预约说明。</p>
    <div class="plan-card">
      <h4>方案1 · 正向环线（阿勒泰 → 伊犁）</h4>
      <div class="plan-sub">乌鲁木齐 → 阿勒泰 → 禾木 → 贾登峪 → 喀纳斯 → 白哈巴 → 布尔津 → 魔鬼城 → 赛里木湖 → 伊宁 → 库尔德宁 → 那拉提 → 唐布拉 → 独库北段 → 乌鲁木齐</div>
      <div class="idx-summary"><strong>✅ 优势：</strong>已确认的4笔住宿订单全部适用，不需要跟商家协商改期；独库公路排在行程末段（D13），从取车日算起有12天提前量，预约从容；喀纳斯连住2晚，节奏更宽松；包含白哈巴、库尔德宁、那拉提。<br><strong>⚠️ 代价：</strong>需要在那拉提当天早上7:40线上抢自驾票（人必须在那拉提镇或新源县城附近，攻略明确说在乔尔玛/唐布拉的很多人都没抢到），这是全程风险最高的环节；不含昭苏、夏塔、伊昭公路。</div>
      <a class="plan-go" href="plan1.html">进入方案1 →</a>
    </div>
    <div class="plan-card">
      <h4>方案2 · 反向环线（伊犁 → 阿勒泰）</h4>
      <div class="plan-sub">乌鲁木齐 → 奎屯 → 独库北段 → 唐布拉/孟克特 → 昭苏/夏塔 → 伊昭公路 → 伊宁 → 赛里木湖 → 奎屯 → 魔鬼城 → 布尔津 → 贾登峪 → 喀纳斯 → 禾木 → 阿勒泰 → 乌鲁木齐</div>
      <div class="idx-summary"><strong>✅ 优势：</strong>新增昭苏、夏塔、伊昭公路（“小独库”）三个方案1没有的项目；免除了那拉提当天抢票这个最高风险环节，也不再需要白哈巴的边境管理区通行证；伊犁草原排在前半程，草相对更绿。<br><strong>⚠️ 代价：</strong>独库公路被排到D2（取车后第2天），预约提前量很紧，<strong>必须在出发前就拿到租车的车牌号并提前预约</strong>；8/17禾木和8/18贾登峪两笔<strong>不可取消</strong>的订单日期对不上，需要跟商家协商改期（不保证成功）；放弃那拉提、库尔德宁、白哈巴；喀纳斯压缩为1晚。</div>
      <a class="plan-go" href="plan2.html">进入方案2 →</a>
    </div>
    <div class="warn-box" id="season"><strong>关于"反向是否更好"的诚实结论：</strong>提出反向方案的原始理由是"初秋去阿勒泰更好、夏末伊犁草泛黄要趁早"。本次核查后发现：喀纳斯/禾木的金秋期集中在<strong>9月中下旬至10月初</strong>（9月20日前后常被作为峰值参考），8月15-30日全程都是绿色夏景，所以<strong>阿勒泰段无论排在前还是后，看到的都是同一种景色，这个理由在本次时间窗口内并不成立</strong>；伊犁方向确实越早越绿（攻略原文：唐布拉"8月下旬开始偏黄"、那拉提"8月草木开始泛黄"、赛里木湖"8月草原开始变黄"），反向对伊犁段略有利，但属于"8月中旬 vs 8月下旬"的程度差异，不是质变——因为无论怎么排，最早也要8月17日前后才到伊犁，早已过了攻略反复强调的6-7月最佳花期。<strong>所以反向方案的真正价值在于它容纳了昭苏、夏塔和伊昭公路，而不在季节。</strong></div>
  </div>
  ${vehicleSectionHtml()}
  ${hkLicenceSectionHtml()}
  ${bookingSectionsHtml()}
  ${breakdownSectionHtml()}
  <div class="disclaimer">${TRIP.disclaimer}</div>
</main>
${footHtml()}`;
}

// v34新增：首页的三大通用板块——道路预约、景区预约、车辆故障处理
function bookingItemHtml(b) {
  return `
    <div class="res-item">
      <div class="res-name">${b.need} ${b.name}</div>
      <div class="res-when">适用：${b.plans}</div>
      <div class="res-body">
        <p><strong>规则：</strong>${b.detail}</p>
        <p><strong>渠道：</strong>${b.channel}</p>
        <p><strong>注意：</strong>${b.risk}</p>
      </div>
    </div>`;
}

function bookingSectionsHtml() {
  return `
  <div class="section-card">
    <h3><span class="icon">🛣️</span>全程道路预约与通行管制</h3>
    <p class="empty-note">下面每一条都标注了它属于哪个方案。⚠️独库公路那一条是全程最容易翻车的环节，务必读完。</p>
    ${ROAD_BOOKINGS.map(bookingItemHtml).join("")}
  </div>
  <div class="section-card">
    <h3><span class="icon">🎫</span>全程景区预约与购票</h3>
    <p class="empty-note">按"需不需要抢/需不需要提前办"排序，🚨的几项都有硬性时间要求，漏掉会直接影响当天行程。</p>
    ${SITE_BOOKINGS.map(bookingItemHtml).join("")}
  </div>`;
}

function vehicleSectionHtml() {
  const rows = VEHICLES.list.map(v => `
    <div class="res-item">
      <div class="res-name">${v.name}</div>
      <div class="res-when">${v.tag}</div>
      <div class="res-body">
        <table class="defer-table">
          <tr><th style="width:22%;">车身尺寸</th><td>${v.size}</td></tr>
          <tr><th>最小离地间隙</th><td>${v.clearance}</td></tr>
          <tr><th>油箱容量</th><td>${v.tank}</td></tr>
          <tr><th>动力</th><td>${v.power}</td></tr>
          <tr><th>油耗 / 燃油标号</th><td>${v.fuel}</td></tr>
          <tr><th>满油续航估算</th><td>${v.range}</td></tr>
          <tr><th>适合场景</th><td>${v.scene}</td></tr>
          <tr><th>稳定性</th><td>${v.stability}</td></tr>
          <tr><th>其它特点</th><td>${v.other}</td></tr>
          <tr><th>主要缺点</th><td>${v.cons}</td></tr>
        </table>
      </div>
    </div>`).join("");
  return `
  <div class="section-card">
    <h3><span class="icon">🚙</span>租车选车对比（8款候选）</h3>
    <p class="idx-summary">${VEHICLES.intro}</p>
    <div class="res-item">
      <div class="res-name">${VEHICLES.routeFactors.title}</div>
      <div class="res-body"><ul style="margin:6px 0;padding-left:20px;">${VEHICLES.routeFactors.items.map(i => `<li style="margin:6px 0;">${i}</li>`).join("")}</ul></div>
    </div>
    ${rows}
    <div class="res-item">
      <div class="res-name">🔋 ${VEHICLES.hybridExplainer.title}</div>
      <div class="res-body">
        <p>${VEHICLES.hybridExplainer.body}</p>
        <p style="margin-top:10px;"><strong>对本次行程的实际影响：</strong></p>
        <ul style="margin:6px 0;padding-left:20px;">${VEHICLES.hybridExplainer.forThisTrip.map(i => `<li style="margin:6px 0;">${i}</li>`).join("")}</ul>
      </div>
    </div>
    <div class="warn-box"><strong>🎯 ${VEHICLES.recommendation.title}</strong><br>${VEHICLES.recommendation.body}</div>
    <div class="warn-box">${VEHICLES.recommendation.fuelNote}</div>
    <div class="warn-box">${VEHICLES.recommendation.caveat}</div>
    <div class="map-note">数据来源：各厂商官网（长城坦克、212越野、捷途）、汽车之家/太平洋汽车/易车官方参数页、车质网与汽车之家车主口碑。缺点部分取自车主口碑与投诉平台的集中反馈，非个别案例。⚠️各车年款/配置差异很大，<strong>提车时请以实车铭牌和行驶证为准</strong>。</div>
  </div>`;
}

function hkLicenceSectionHtml() {
  return `
  <div class="section-card">
    <h3><span class="icon">🪪</span>${HK_LICENCE.title}</h3>
    <div class="warn-box">${HK_LICENCE.status}</div>
    <ul style="font-size:13.5px;padding-left:20px;">${HK_LICENCE.items.map(i => `<li style="margin:7px 0;">${i}</li>`).join("")}</ul>
    <div class="res-item"><div class="res-body"><p>${HK_LICENCE.ifOnlyHK}</p></div></div>
    <p class="empty-note">${HK_LICENCE.sources}</p>
  </div>`;
}

function breakdownSectionHtml() {
  const blk = (b) => `
    <div class="res-item">
      <div class="res-name">${b.title}</div>
      <div class="res-body">
        ${b.intro ? `<p>${b.intro}</p>` : ""}
        <ul style="margin:6px 0;padding-left:20px;">${b.items.map(i => `<li style="margin:5px 0;">${i}</li>`).join("")}</ul>
      </div>
    </div>`;
  return `
  <div class="section-card">
    <h3><span class="icon">🔧</span>路上车辆发生故障怎么办</h3>
    <div class="warn-box">${BREAKDOWN.principle}</div>
    ${blk(BREAKDOWN.before)}
    ${blk(BREAKDOWN.onSite)}
    ${blk(BREAKDOWN.skills)}
    ${blk(BREAKDOWN.routeRisks)}
    ${blk(BREAKDOWN.noSignal)}
    <p class="empty-note">${BREAKDOWN.disclaimer}</p>
  </div>`;
}

// v33：每个方案各有一个独立的总览页（plan1.html / plan2.html）
function renderPlanOverviewPage(plan) {
  const isP2 = plan === 2;
  const days = isP2 ? PLAN2_DAYS : DAYS;
  const pfx = isP2 ? "p2day" : "day";
  const planTitle = isP2 ? "方案2 · 反向环线（伊犁 → 阿勒泰）" : "方案1 · 正向环线（阿勒泰 → 伊犁）";

  const listHtml = days.map(d => `
    <li><a href="${pfx}${d.num}.html">
      <span class="idx-day">Day ${d.num} · ${d.date}</span>
      <div class="idx-title">${d.title}</div>
      <div class="idx-summary">${d.summary}</div>
    </a></li>`).join("");

  const altListHtml = (!isP2 && ALT_DAYS && ALT_DAYS.length > 0) ? ALT_DAYS.map(d => `
    <li><a href="day${d.num}.html">
      <span class="idx-day">D${d.num} · ${d.date}</span>
      <div class="idx-title">${d.title}</div>
      <div class="idx-summary">${d.summary}</div>
    </a></li>`).join("") : "";

  const altSection = altListHtml ? `
  <div class="section-card">
    <h3><span class="icon">🔀</span>备选方案（可选，不计入正式16天）</h3>
    <p class="empty-note">D13a+D14a 是"独库公路当天直达乌鲁木齐"的合并方案，与默认的D13+D14二选一使用，详见各自页面内的说明。</p>
    <ul class="index-list">${altListHtml}</ul>
  </div>` : "";

  // 方案2专属：预约总览 + 酒店改期方案
  let p2Sections = "";
  if (isP2) {
    const resHtml = PLAN2_META.reservations.map(r => `
    <div class="res-item">
      <div class="res-name">${r.name}</div>
      <div class="res-when">对应：${r.when}</div>
      <div class="res-body">
        <p><strong>规则：</strong>${r.rule}</p>
        ${r.channel && r.channel !== "—" ? `<p><strong>渠道：</strong>${r.channel}</p>` : ""}
        <p><strong>注意：</strong>${r.critical}</p>
      </div>
    </div>`).join("");

    const hd = PLAN2_META.hotelDeferral;
    const deferRows = hd.items.map(it => `
    <tr>
      <td><strong>${it.hotel}</strong><br><span style="color:var(--muted);font-size:12.5px;">${it.platform} · ${it.cancelPolicy}</span></td>
      <td>${it.origDate}</td>
      <td>${it.newDate}</td>
      <td>${it.feasibility}</td>
    </tr>
    <tr><td colspan="4" style="background:#FBFAF7;font-size:13px;">${it.advice}</td></tr>`).join("");

    p2Sections = `
  <div class="section-card">
    <h3><span class="icon">🚨</span>道路与景点预约总览</h3>
    <p class="empty-note">以下是方案2各天涉及的全部预约规则，按重要性排序。独库公路那一条是本方案最大的单点风险，务必读完。</p>
    ${resHtml}
  </div>
  <div class="section-card">
    <h3><span class="icon">🏨</span>已订酒店的改期方案</h3>
    <p class="idx-summary">${hd.intro}</p>
    <table class="defer-table">
      <tr><th style="width:30%;">订单</th><th>原定日期</th><th>方案2对应日期</th><th>可行性</th></tr>
      ${deferRows}
    </table>
    <div class="res-item">
      <div class="res-name">🟢 ${hd.bonus.hotel}</div>
      <div class="res-when">${hd.bonus.platform} · ${hd.bonus.cancelPolicy}</div>
      <div class="res-body"><p>${hd.bonus.note}</p></div>
    </div>
    <div class="res-item">
      <div class="res-name">✅ ${hd.unaffected.hotel}</div>
      <div class="res-body"><p>${hd.unaffected.note}</p></div>
    </div>
    <div class="warn-box">${hd.caveat}</div>
  </div>`;
  }

  const p2Intro = isP2 ? `
  <div class="warn-box">🔄 <strong>${PLAN2_META.subtitle}</strong><br>${PLAN2_META.intro} 与 <a href="plan1.html">方案1</a> 二选一，机票日期相同，不能同时执行。</div>` : "";

  return `${headHtml(planTitle + " - " + TRIP.title)}
<header class="site-header">
  <h1>${TRIP.title}</h1>
  <p>${TRIP.subtitle}</p>
</header>
${navHtml(null, plan, true)}
<main>
  <div class="day-title-block">
    <span class="day-num">总览</span>
    <h2>${planTitle}</h2>
  </div>
  ${p2Intro}
  <div class="section-card">
    <h3><span class="icon">🗺️</span>全程路线总览</h3>
    <div id="amap-index" class="map-frame-wrap"></div>
    <div id="amap-index-status" class="map-fallback-link"></div>
    <div class="map-note">每日路段均为高德实时驾车路线规划结果（真实道路轨迹），首次加载需依次请求${days.length}天路线，可能需要几秒钟。这张图画的是<strong>${isP2 ? "方案2（反向）" : "方案1（正向）"}</strong>的路线。</div>
  </div>
  <div class="section-card">
    <h3><span class="icon">📅</span>逐日行程</h3>
    <ul class="index-list">${listHtml}</ul>
  </div>
  ${altSection}
  ${p2Sections}
  <div class="disclaimer">${TRIP.disclaimer}</div>
</main>
${amapLoaderScript()}
${amapIndexInitScript(plan)}
${footHtml()}`;
}

function renderIndexPageLegacy() {
  const listHtml = DAYS.map(d => `
    <li><a href="day${d.num}.html">
      <span class="idx-day">Day ${d.num} · ${d.date}</span>
      <div class="idx-title">${d.title}</div>
      <div class="idx-summary">${d.summary}</div>
    </a></li>`).join("");

  const altListHtml = (ALT_DAYS && ALT_DAYS.length > 0) ? ALT_DAYS.map(d => `
    <li><a href="day${d.num}.html">
      <span class="idx-day">D${d.num} · ${d.date}</span>
      <div class="idx-title">${d.title}</div>
      <div class="idx-summary">${d.summary}</div>
    </a></li>`).join("") : "";

  const altSection = altListHtml ? `
  <div class="section-card">
    <h3><span class="icon">🔀</span>备选方案（可选，不计入正式16天）</h3>
    <p class="empty-note">D13a+D14a 是"独库公路当天直达乌鲁木齐"的合并方案，与默认的D13+D14二选一使用，详见各自页面内的说明。</p>
    <ul class="index-list">${altListHtml}</ul>
  </div>` : "";

  // v32新增：方案2逐日列表
  const p2ListHtml = PLAN2_DAYS.map(d => `
    <li><a href="p2day${d.num}.html">
      <span class="idx-day">Day ${d.num} · ${d.date}</span>
      <div class="idx-title">${d.title}</div>
      <div class="idx-summary">${d.summary}</div>
    </a></li>`).join("");

  // v32新增：方案选择卡片
  const planChooser = `
  <div class="section-card">
    <h3><span class="icon">🔀</span>两个方案（二选一，机票日期相同）</h3>
    <div class="plan-card">
      <h4>方案1 · 正向环线（阿勒泰 → 伊犁）</h4>
      <div class="plan-sub">乌鲁木齐 → 阿勒泰 → 禾木 → 贾登峪 → 喀纳斯 → 白哈巴 → 布尔津 → 魔鬼城 → 赛里木湖 → 伊宁 → 库尔德宁 → 那拉提 → 唐布拉 → 独库北段 → 乌鲁木齐</div>
      <div class="idx-summary">原始方案，包含白哈巴、库尔德宁、那拉提，喀纳斯连住2晚。独库公路排在行程末段（D13），预约提前量充足。⚠️但需要在那拉提当天7:40线上抢自驾票，是全程风险最高的环节。已确认的4笔住宿订单全部适用。</div>
      <a class="plan-go" href="day0.html">查看方案1 →</a>
    </div>
    <div class="plan-card">
      <h4>方案2 · 反向环线（伊犁 → 阿勒泰）</h4>
      <div class="plan-sub">乌鲁木齐 → 奎屯 → 独库北段 → 唐布拉/孟克特 → 昭苏/夏塔 → 伊昭公路 → 伊宁 → 赛里木湖 → 奎屯 → 魔鬼城 → 布尔津 → 贾登峪 → 喀纳斯 → 禾木 → 阿勒泰 → 乌鲁木齐</div>
      <div class="idx-summary">${PLAN2_META.intro} ✅免除了那拉提抢票和白哈巴边境证。⚠️但独库公路被排到D2（取车后第2天），预约提前量很紧，且有2笔不可取消的订单日期对不上，需要协商改期。</div>
      <a class="plan-go" href="p2day0.html">查看方案2 →</a>
    </div>
    <div class="warn-box"><strong>季节因素的诚实结论：</strong>提出反向方案的原始理由是"初秋去阿勒泰更好、夏末伊犁草泛黄要趁早"。本次核查后发现：喀纳斯/禾木的金秋期集中在<strong>9月中下旬至10月初</strong>，8月15-30日全程都是绿色夏景，所以<strong>阿勒泰段排前排后看到的是同一种景色，这个理由在本次窗口内不成立</strong>；伊犁方向确实越早越绿（攻略原文：唐布拉"8月下旬开始偏黄"、赛里木湖"8月草原开始变黄"），反向对伊犁段略有利，但属于"8月中旬 vs 8月下旬"的程度差异，不是质变。<strong>反向方案的真正价值在于它容纳了昭苏、夏塔和伊昭公路</strong>，而不在季节。</div>
  </div>`;

  // v32新增：方案2预约总览
  const resHtml = PLAN2_META.reservations.map(r => `
    <div class="res-item">
      <div class="res-name">${r.name}</div>
      <div class="res-when">对应：${r.when}</div>
      <div class="res-body">
        <p><strong>规则：</strong>${r.rule}</p>
        ${r.channel && r.channel !== "—" ? `<p><strong>渠道：</strong>${r.channel}</p>` : ""}
        <p><strong>注意：</strong>${r.critical}</p>
      </div>
    </div>`).join("");

  const resSection = `
  <div class="section-card">
    <h3><span class="icon">🚨</span>方案2 · 道路与景点预约总览</h3>
    <p class="empty-note">以下预约规则主要适用于方案2。方案1的预约情况请见各日页面的"是否需预约"一栏。</p>
    ${resHtml}
  </div>`;

  // v32新增：不可取消订单的改期方案
  const hd = PLAN2_META.hotelDeferral;
  const deferRows = hd.items.map(it => `
    <tr>
      <td><strong>${it.hotel}</strong><br><span style="color:var(--muted);font-size:12.5px;">${it.platform} · ${it.cancelPolicy}</span></td>
      <td>${it.origDate}</td>
      <td>${it.newDate}</td>
      <td>${it.feasibility}</td>
    </tr>
    <tr><td colspan="4" style="background:#FBFAF7;font-size:13px;">${it.advice}</td></tr>`).join("");

  const deferSection = `
  <div class="section-card">
    <h3><span class="icon">🏨</span>方案2 · 已订酒店的改期方案</h3>
    <p class="idx-summary">${hd.intro}</p>
    <table class="defer-table">
      <tr><th style="width:30%;">订单</th><th>原定日期</th><th>方案2对应日期</th><th>可行性</th></tr>
      ${deferRows}
    </table>
    <div class="res-item">
      <div class="res-name">🟢 ${hd.bonus.hotel}</div>
      <div class="res-when">${hd.bonus.platform} · ${hd.bonus.cancelPolicy}</div>
      <div class="res-body"><p>${hd.bonus.note}</p></div>
    </div>
    <div class="res-item">
      <div class="res-name">✅ ${hd.unaffected.hotel}</div>
      <div class="res-body"><p>${hd.unaffected.note}</p></div>
    </div>
    <div class="warn-box">${hd.caveat}</div>
  </div>`;

  return `${headHtml(TRIP.title)}
<header class="site-header">
  <h1>${TRIP.title}</h1>
  <p>${TRIP.subtitle}</p>
</header>
${planSwitchHtml(0)}
<main>
  ${planChooser}
  <div class="section-card">
    <h3><span class="icon">🗺️</span>全程路线总览（方案1 · 正向）</h3>
    <div id="amap-index" class="map-frame-wrap"></div>
    <div id="amap-index-status" class="map-fallback-link"></div>
    <div class="map-note">每日路段均为高德实时驾车路线规划结果（真实道路轨迹），首次加载需依次请求${DAYS.length}天路线，可能需要几秒钟。⚠️这张总览图画的是<strong>方案1</strong>的路线；方案2走的是相反方向且景点不同，请在方案2的各日页面里查看当天的具体路线图。</div>
  </div>
  <div class="section-card">
    <h3><span class="icon">📅</span>方案1 · 逐日行程（正向：阿勒泰 → 伊犁）</h3>
    <ul class="index-list">${listHtml}</ul>
  </div>
  ${altSection}
  <div class="section-card">
    <h3><span class="icon">🔄</span>方案2 · 逐日行程（反向：伊犁 → 阿勒泰）</h3>
    <p class="empty-note">${PLAN2_META.subtitle}</p>
    <ul class="index-list">${p2ListHtml}</ul>
  </div>
  ${resSection}
  ${deferSection}
  <div class="disclaimer">${TRIP.disclaimer}</div>
</main>
${amapLoaderScript()}
${amapIndexInitScript()}
${footHtml()}`;
}

// Write files
// v33：index.html 只做方案选择；每个方案各有独立总览页 plan1.html / plan2.html
fs.writeFileSync(path.join(OUT, "index.html"), renderLandingPage(), "utf8");
fs.writeFileSync(path.join(OUT, "plan1.html"), renderPlanOverviewPage(1), "utf8");
fs.writeFileSync(path.join(OUT, "plan2.html"), renderPlanOverviewPage(2), "utf8");
DAYS.forEach((d, idx) => {
  fs.writeFileSync(path.join(OUT, `day${d.num}.html`), renderDayPage(d, idx), "utf8");
});

// v23新增：D13a/D14a 备选合并方案页面，独立于主DAYS的prev/next链条渲染，
// 避免打乱默认16天行程的"上一天/下一天"导航顺序；显式指定各自的prev/next。
if (ALT_DAYS && ALT_DAYS.length > 0) {
  const d13 = DAYS.find(d => d.num === 13);
  const d15 = DAYS.find(d => d.num === 15);
  const alt13a = ALT_DAYS.find(d => d.num === "13a");
  const alt14a = ALT_DAYS.find(d => d.num === "14a");
  if (alt13a) {
    fs.writeFileSync(path.join(OUT, `day${alt13a.num}.html`), renderDayPage(alt13a, null, { prev: d13, next: alt14a }), "utf8");
  }
  if (alt14a) {
    fs.writeFileSync(path.join(OUT, `day${alt14a.num}.html`), renderDayPage(alt14a, null, { prev: alt13a, next: d15 }), "utf8");
  }
}

// v32新增：方案2（反向环线）页面，输出为 p2day{n}.html，与方案1的 day{n}.html 完全隔离。
// 方案1的 day0-day15.html 内容不受影响（只有导航栏顶部多了一条方案切换条）。
PLAN2_DAYS.forEach((d, idx) => {
  fs.writeFileSync(path.join(OUT, `p2day${d.num}.html`), renderDayPage(d, idx, null, 2), "utf8");
});

console.log("Generated:", 1 + DAYS.length + (ALT_DAYS ? ALT_DAYS.length : 0) + PLAN2_DAYS.length, "files",
  `(index + 方案1 ${DAYS.length}天 + 备选 ${ALT_DAYS ? ALT_DAYS.length : 0}天 + 方案2 ${PLAN2_DAYS.length}天)`);
