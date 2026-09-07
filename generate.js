const fs = require("fs");
const path = require("path");
const { TRIP, DAYS, ALT_DAYS } = require("./data.js");
// 实际采用的伊犁-阿勒泰行程数据。
const { PLAN2_META, PLAN2_DAYS, PLAN2_CINEMA_NOTES } = require("./plan2.js");
const { JOURNAL_DAYS } = require("./journal.js");
// 行前预约、车辆与故障处理信息统一渲染在首页。
const { ROAD_BOOKINGS, SITE_BOOKINGS, BREAKDOWN, HK_LICENCE, VEHICLES, LEISURE } = require("./common.js");

const OUT = __dirname;
const MEDIA_MANIFEST_PATH = path.join(OUT, "media", "media-manifest.json");
const PUBLISHED_MEDIA = fs.existsSync(MEDIA_MANIFEST_PATH)
  ? JSON.parse(fs.readFileSync(MEDIA_MANIFEST_PATH, "utf8"))
  : [];
const PUBLISHED_MEDIA_BY_KEY = new Map();
for (const item of PUBLISHED_MEDIA) {
  if (!PUBLISHED_MEDIA_BY_KEY.has(item.key)) PUBLISHED_MEDIA_BY_KEY.set(item.key, []);
  PUBLISHED_MEDIA_BY_KEY.get(item.key).push(item);
}
const IS_PUBLISHED_BUILD = PUBLISHED_MEDIA.length > 0;

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

// ---- 实际行程的地图途经点 ----
const WAYPOINTS_CN_P2 = {
  0: [{ keyword: "乌鲁木齐地窝堡国际机场", city: "乌鲁木齐市" }],
  1: [
    { keyword: "乌鲁木齐地窝堡国际机场", city: "乌鲁木齐市" },
    { keyword: "肯斯瓦特水库", city: "昌吉回族自治州" },
    { keyword: "沙湾市", city: "塔城地区" },
    { keyword: "奎屯市", city: "伊犁哈萨克自治州" },
    { keyword: "独山子区", city: "克拉玛依市" },
  ],
  // v34：全部改用行政地名优先（Geocoder 对行政区划最可靠），POI 名称只在没有替代时使用，
  // 并已给 geocode() 加了 PlaceSearch 兜底，避免 POI 解析失败导致地图空白/路线画错。
  // 使用已验证可解析的关键词组合，并配合"最短距离"策略，避免高德绕开独库公路走高速。
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
const DRIVING_POLICY_P2 = { 1: 2, 2: 2, 6: 2 };

const HOTEL_CITY_BIAS_P2 = {
  0: "乌鲁木齐市",
  1: "奎屯市",
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
.journal-card {
  border-top: 4px solid #B45F35;
  padding-top: 16px;
}
.journal-card > h3 { color: #8A4326; }
.journal-meta {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: start;
  padding: 10px 12px;
  background: #F7F3ED;
  border-left: 3px solid #B45F35;
  margin-bottom: 8px;
}
.journal-route { font-size: 14px; font-weight: 600; }
.journal-status {
  color: #7B3F27;
  background: #F1DED2;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  white-space: nowrap;
}
.journal-editor-note { color: var(--muted); font-size: 12px; margin: 0 0 8px; }
.journal-detail {
  padding: 18px 0;
  border-bottom: 1px solid var(--border);
}
.journal-detail:last-child { border-bottom: 0; padding-bottom: 0; }
.journal-detail p { margin: 0; font-size: 15px; line-height: 1.85; }
.journal-upload {
  margin-top: 12px;
  min-height: 104px;
  border: 1px dashed #B8A999;
  background: #FAF8F4;
  display: grid;
  place-items: center;
  padding: 10px;
}
.journal-upload.has-photos { display: block; }
.journal-upload-empty { text-align: center; color: var(--muted); font-size: 12px; }
.journal-upload-empty strong { display: block; color: var(--text); font-size: 13px; margin-bottom: 5px; }
.journal-upload-button {
  border: 1px solid var(--teal-light);
  background: white;
  color: var(--teal);
  padding: 6px 10px;
  border-radius: 6px;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.journal-upload-button:hover { background: #EEF5F2; }
.journal-photo-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start;
  gap: 8px;
}
.journal-photo {
  position: relative;
  margin: 0;
  overflow: hidden;
  background: #E9E5DE;
}
.journal-photo img, .journal-photo video {
  display: block;
  width: 100%;
  height: auto;
  object-fit: contain;
}
.journal-photo.video { grid-column: 1 / -1; background: #171717; }
.journal-photo.video video {
  width: auto;
  max-width: 100%;
  max-height: 75vh;
  margin: 0 auto;
}
.journal-photo-remove {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 30px;
  height: 30px;
  border: 0;
  border-radius: 50%;
  background: rgba(25,25,25,.78);
  color: white;
  font-size: 19px;
  line-height: 1;
  cursor: pointer;
}
.journal-photo-actions { margin-top: 8px; display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.journal-photo-actions[hidden], .journal-upload-empty[hidden] { display: none !important; }
.journal-photo-count { color: var(--muted); font-size: 12px; }
.journal-index-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.journal-index-item {
  display: block;
  background: white;
  border: 1px solid var(--border);
  border-left: 3px solid #B45F35;
  padding: 12px 14px;
  text-decoration: none;
  color: var(--text);
}
.journal-index-item:hover { border-color: #B45F35; }
.journal-index-day { color: #8A4326; font-size: 12px; font-weight: 700; }
.journal-index-route { font-size: 14px; font-weight: 600; margin: 3px 0; }
.journal-index-excerpt { color: var(--muted); font-size: 12.5px; }
@media (max-width: 620px) {
  .journal-meta { grid-template-columns: 1fr; }
  .journal-status { justify-self: start; }
  .journal-index-grid { grid-template-columns: 1fr; }
  .journal-photo-grid { grid-template-columns: 1fr; }
}
/* 顶部主导航与路线决策记录 */
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
.decision-flow { display: grid; gap: 14px; }
.decision-step {
  border-left: 4px solid var(--teal-light);
  padding: 2px 0 2px 14px;
}
.decision-step.final { border-left-color: #B45F35; }
.decision-step h4 { margin: 0 0 5px; color: var(--teal); font-size: 15px; }
.decision-step p { margin: 0; font-size: 13.5px; }
.route-map-figure { margin: 0; text-align: center; }
.route-map-figure img {
  display: block;
  width: auto;
  max-width: 100%;
  max-height: 78vh;
  height: auto;
  margin: 0 auto;
  border: 1px solid var(--border);
}
.route-map-figure figcaption { margin-top: 8px; color: var(--muted); font-size: 12.5px; }
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

// 网站只保留规划过程首页和实际采用的伊犁-阿勒泰行程。
function planSwitchHtml(activePlan) {
  return `<nav class="plan-switch">
  <a href="index.html" class="${activePlan === 0 ? "active" : ""}">🏠 首页</a>
  <a href="plan2.html" class="${activePlan === 2 ? "active" : ""}">伊犁-阿勒泰</a>
</nav>`;
}

function navHtml(activeNum, plan, isOverview, isJournal) {
  let items = `<a href="plan2.html" class="${isOverview ? "active" : ""}">总览</a>`;
  items += `<a href="journal-preview.html" class="${isJournal ? "active" : ""}">旅行实录</a>`;
  for (const d of PLAN2_DAYS) {
    items += `<a href="p2day${d.num}.html" class="${activeNum === d.num ? "active" : ""}">D${d.num}</a>`;
  }
  return `${planSwitchHtml(2)}<nav class="day-nav">${items}</nav>`;
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

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderJournalSection(dayNum) {
  const journal = JOURNAL_DAYS.find(day => day.num === Number(dayNum));
  if (!journal) return "";
  const details = journal.details.map((detail, index) => {
    const key = `journal-d${journal.num}-detail-${index + 1}`;
    const mediaAllowed = !(
      (journal.num === 6 && index === 1) ||
      (journal.num === 9 && index === 3)
    );
    if (!mediaAllowed) {
      return `<article class="journal-detail journal-commentary">
      <p>${escapeHtml(detail)}</p>
    </article>`;
    }
    const publishedMedia = PUBLISHED_MEDIA_BY_KEY.get(key) || [];
    if (IS_PUBLISHED_BUILD) {
      const mediaItems = publishedMedia.map((item, mediaIndex) => {
        const src = `media/${encodeURIComponent(item.filename)}`;
        if (item.kind === "video") {
          return `<figure class="journal-photo video">
          <video src="${src}" controls playsinline preload="metadata" aria-label="旅行视频 ${mediaIndex + 1}"></video>
        </figure>`;
        }
        return `<figure class="journal-photo">
          <img src="${src}" alt="旅行照片 ${mediaIndex + 1}" loading="lazy" decoding="async">
        </figure>`;
      }).join("");
      return `<article class="journal-detail">
      <p>${escapeHtml(detail)}</p>
${mediaItems ? `<div class="journal-upload has-photos journal-published-media"><div class="journal-photo-grid">${mediaItems}</div></div>` : ""}
    </article>`;
    }
    return `<article class="journal-detail">
      <p>${escapeHtml(detail)}</p>
      <div class="journal-upload" data-journal-upload="${key}">
        <div class="journal-upload-empty">
          <strong>媒体位置 · 照片或视频最多 3 个</strong>
          <button class="journal-upload-button" type="button" data-photo-add title="为这段记录添加照片或视频">＋ 添加照片 / 视频</button>
          <input type="file" accept="image/*,video/*" multiple hidden data-photo-input>
        </div>
        <div class="journal-photo-grid" data-photo-grid></div>
        <div class="journal-photo-actions" hidden data-photo-actions>
          <span class="journal-photo-count" data-photo-count>已添加 0 / 3</span>
          <button class="journal-upload-button" type="button" data-photo-add title="继续添加照片或视频">＋ 添加</button>
        </div>
      </div>
    </article>`;
  }).join("");

  return `<section class="section-card journal-card" id="travel-journal">
    <h3><span class="icon">✎</span>旅行实录 · ${escapeHtml(journal.date)}</h3>
    <div class="journal-meta">
      <div class="journal-route">${escapeHtml(journal.route)}</div>
      <span class="journal-status">${escapeHtml(journal.status)}</span>
    </div>
    <p class="journal-editor-note">${IS_PUBLISHED_BUILD
      ? "按实际发生时间重新编排；精选照片和视频依照对应场景呈现。"
      : "按实际发生时间重新编排；仅修正明显错别字，保留原文观点与叙述语气。每个细节可加入照片或视频，合计最多 3 个。"}</p>
    <div class="journal-detail-list">${details || `<p class="empty-note">当天仅记录返程路线。</p>`}</div>
  </section>`;
}

function journalUploadScript() {
  if (IS_PUBLISHED_BUILD) return "";
  return `<script>
(function () {
  var DB_NAME = "xinjiang-roadtrip-journal";
  var STORE = "detail-photos";
  var MAX_MEDIA = 3;
  var MAX_VIDEO_BYTES = 350 * 1024 * 1024;

  function openDb() {
    return new Promise(function (resolve, reject) {
      var request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = function () {
        if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE);
      };
      request.onsuccess = function () { resolve(request.result); };
      request.onerror = function () { reject(request.error); };
    });
  }

  async function readMedia(key) {
    var db = await openDb();
    return new Promise(function (resolve, reject) {
      var request = db.transaction(STORE, "readonly").objectStore(STORE).get(key);
      request.onsuccess = function () { resolve(request.result || []); };
      request.onerror = function () { reject(request.error); };
    });
  }

  async function writeMedia(key, media) {
    var db = await openDb();
    return new Promise(function (resolve, reject) {
      var transaction = db.transaction(STORE, "readwrite");
      transaction.objectStore(STORE).put(media, key);
      transaction.oncomplete = resolve;
      transaction.onerror = function () { reject(transaction.error); };
    });
  }

  function loadImage(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("unsupported image")); };
      img.src = url;
    });
  }

  async function preparePhoto(file) {
    var img = await loadImage(file);
    var longest = Math.max(img.naturalWidth, img.naturalHeight);
    var scale = Math.min(1, 1800 / longest);
    var canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
    return { kind: "photo", name: file.name, data: canvas.toDataURL("image/jpeg", 0.84) };
  }

  function prepareVideo(file) {
    if (file.size > MAX_VIDEO_BYTES) throw new Error("video too large");
    return { kind: "video", name: file.name, blob: file };
  }

  function render(zone, media) {
    var grid = zone.querySelector("[data-photo-grid]");
    var empty = zone.querySelector(".journal-upload-empty");
    var actions = zone.querySelector("[data-photo-actions]");
    var count = zone.querySelector("[data-photo-count]");
    grid.querySelectorAll("video").forEach(function (video) {
      if (video.src.indexOf("blob:") === 0) URL.revokeObjectURL(video.src);
    });
    grid.innerHTML = "";
    media.forEach(function (item, index) {
      var isVideo = item.kind === "video";
      var figure = document.createElement("figure");
      figure.className = "journal-photo" + (isVideo ? " video" : "");
      var preview = document.createElement(isVideo ? "video" : "img");
      if (isVideo) {
        preview.src = URL.createObjectURL(item.blob);
        preview.controls = true;
        preview.playsInline = true;
        preview.preload = "metadata";
        preview.setAttribute("aria-label", "旅行视频");
      } else {
        preview.src = item.data;
        preview.alt = "旅行照片 " + (index + 1);
      }
      var remove = document.createElement("button");
      remove.type = "button";
      remove.className = "journal-photo-remove";
      remove.setAttribute("aria-label", isVideo ? "删除这段视频" : "删除这张照片");
      remove.title = "删除";
      remove.textContent = "×";
      remove.addEventListener("click", async function () {
        media.splice(index, 1);
        await writeMedia(zone.dataset.journalUpload, media);
        render(zone, media);
      });
      figure.appendChild(preview);
      figure.appendChild(remove);
      grid.appendChild(figure);
    });
    zone.classList.toggle("has-photos", media.length > 0);
    empty.hidden = media.length > 0;
    actions.hidden = media.length === 0;
    count.textContent = "已添加 " + media.length + " / " + MAX_MEDIA;
    actions.querySelector("[data-photo-add]").hidden = media.length >= MAX_MEDIA;
  }

  document.querySelectorAll("[data-journal-upload]").forEach(async function (zone) {
    var input = zone.querySelector("[data-photo-input]");
    zone.querySelectorAll("[data-photo-add]").forEach(function (button) {
      button.addEventListener("click", function () { input.click(); });
    });
    var media = await readMedia(zone.dataset.journalUpload);
    render(zone, media);
    input.addEventListener("change", async function () {
      var room = MAX_MEDIA - media.length;
      var selected = Array.from(input.files || []).slice(0, room);
      for (var i = 0; i < selected.length; i += 1) {
        var file = selected[i];
        try {
          if (file.type.indexOf("image/") === 0) {
            media.push(await preparePhoto(file));
          } else if (file.type.indexOf("video/") === 0) {
            media.push(prepareVideo(file));
          }
        } catch (error) {
          var message = file.type.indexOf("video/") === 0
            ? "视频无法保存。请使用浏览器支持的格式，并将单个文件控制在 350MB 以内。"
            : "这张照片无法在浏览器中读取，请改用 JPEG、PNG 或 WebP 格式。";
          window.alert(message);
        }
      }
      input.value = "";
      await writeMedia(zone.dataset.journalUpload, media);
      render(zone, media);
    });
  });
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
  const journalSection = plan === 2 ? renderJournalSection(d.num) : "";

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
  const latestUpdateBox = d.latestUpdate ? `<div class="warn-box"><strong>📌 最新行程更新：</strong>${d.latestUpdate}</div>` : "";
  const cinemaNote = d.cinemaNote || (plan === 2 ? PLAN2_CINEMA_NOTES[d.num] : "");
  const cinemaBox = cinemaNote ? `<div class="warn-box"><strong>🎬 今晚的电影院：</strong>${cinemaNote}</div>` : "";

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

  const planBanner = "";

  return `${headHtml(`D${d.num} ${d.title} - ${TRIP.title}`)}
<header class="site-header">
  <h1>${TRIP.title}</h1>
  <p>${TRIP.subtitle}</p>
</header>
${navHtml(d.num, plan)}
<main>
  ${altBanner}${planBanner}
  ${latestUpdateBox}
  <div class="day-title-block">
    <span class="day-num">Day ${d.num} · ${d.date}</span>
    <h2>${d.title}</h2>
    <div class="summary">${d.summary}</div>
  </div>

${journalSection}

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
    ${cinemaBox}
  </div>

  <div class="section-card">
    <h3><span class="icon">🍽️</span>饮食 / 住宿</h3>
    <div style="margin-bottom:10px;"><strong style="font-size:13.5px;color:var(--muted);">推荐饮食</strong>${foodHtml}</div>
    <div><strong style="font-size:13.5px;color:var(--muted);">${d.hotelHeading || "当晚住宿（3-4星，推荐1-3选）"}</strong>${hotelsHtml}</div>
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
${plan === 2 ? journalUploadScript() : ""}
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

// 首页保留路线取舍过程，并集中放置所有行前准备与风险信息。
function renderLandingPage() {
  return `${headHtml(TRIP.title)}
<header class="site-header">
  <h1>${TRIP.title}</h1>
  <p>2026年8月15日-30日 · 从路线推演到实际完成的北疆自驾记录</p>
</header>
${planSwitchHtml(0)}
<main>
  <div class="section-card">
    <h3><span class="icon">↔</span>路线是怎样确定的</h3>
    <p class="idx-summary">规划阶段曾认真比较“阿勒泰先、伊犁后”和“伊犁先、阿勒泰后”两种走法。旧方案不再作为可执行行程展示，以下只保留当时的取舍过程。</p>
    <div class="decision-flow">
      <article class="decision-step">
        <h4>最初考虑：先阿勒泰，后伊犁</h4>
        <p>最初希望先走阿勒泰、禾木、喀纳斯和白哈巴，再经赛里木湖进入伊犁，最后从唐布拉翻越独库公路返回乌鲁木齐。这样喀纳斯可连住两晚，独库公路也有更充足的预约准备时间，并能保留那拉提、库尔德宁和白哈巴。</p>
      </article>
      <article class="decision-step">
        <h4>重新比较：为什么改为先走伊犁</h4>
        <p>8月下旬伊犁草场逐渐泛黄，而喀纳斯、禾木真正明显的金秋通常要到9月中下旬；把阿勒泰提前十天并不会看到秋色。相反，先走伊犁更有利于保留唐布拉、昭苏、夏塔和伊昭公路，也避开了那拉提自驾票当天抢票及白哈巴边境通行证等不确定环节。</p>
      </article>
      <article class="decision-step final">
        <h4>最终采用：伊犁-阿勒泰</h4>
        <p>实际路线从乌鲁木齐先经S101、独库北段和唐布拉进入伊犁，游览喀拉峻、昭苏、夏塔、伊昭公路及赛里木湖，再北上魔鬼城、布尔津、喀纳斯、禾木和阿禾公路。最终放弃那拉提、库尔德宁和白哈巴；孟克特古道因临时封闭也未能进入。</p>
      </article>
    </div>
    <a class="plan-go" href="plan2.html">查看实际行程 →</a>
  </div>
  <div class="section-card">
    <h3><span class="icon">🗺️</span>本次完整驾车线路</h3>
    <figure class="route-map-figure">
      <img src="assets/xinjiang-driving-route.jpg" alt="北疆自驾完整线路图：乌鲁木齐出发，经伊犁、赛里木湖、阿勒泰后返回乌鲁木齐">
      <figcaption>红线为本次实际驾车轨迹，线路从乌鲁木齐向西进入伊犁，再北上阿勒泰后返回乌鲁木齐。</figcaption>
    </figure>
  </div>
  ${bookingSectionsHtml()}
  ${vehicleSectionHtml()}
  ${hkLicenceSectionHtml()}
  ${breakdownSectionHtml()}
  ${leisureSectionHtml()}
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
    <p class="empty-note">下面每一条均标注实际适用日期。⚠️独库公路预约与临时管制最容易影响全程衔接，务必读完。</p>
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


// v50：休闲补充（骑马 / 电影院）
function leisureSectionHtml() {
  const H = LEISURE.horses, C = LEISURE.cinemas;
  const horseRows = H.others.map(o => `
    <tr><td style="white-space:nowrap;font-weight:600;">${o.d}</td><td>${o.info}</td></tr>`).join("");
  const cineRows = C.rows.map(r => `
    <tr>
      <td style="white-space:nowrap;font-weight:600;">${r.d}</td>
      <td style="white-space:nowrap;">${r.city}</td>
      <td>${r.cinema}</td>
      <td>${r.verdict}</td>
    </tr>`).join("");
  return `
  <div class="section-card">
    <h3><span class="icon">🐎</span>${H.title}</h3>
    <div class="warn-box">${H.verdict}</div>
    <div class="res-item"><div class="res-body"><p>${H.split}</p></div></div>
    <div class="res-item">
      <div class="res-name">${H.star.name}</div>
      <div class="res-body"><ul style="margin:6px 0;padding-left:20px;">${H.star.items.map(i => `<li style="margin:5px 0;">${i}</li>`).join("")}</ul></div>
    </div>
    <div class="res-item"><div class="res-name">怎么排进行程</div><div class="res-body"><p>${H.slot}</p></div></div>
    <div style="overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;font-size:13px;margin:10px 0;">
        <thead><tr style="background:#f4f6f8;"><th style="text-align:left;padding:8px;">其它可骑马的地方</th><th style="text-align:left;padding:8px;">情况</th></tr></thead>
        <tbody>${horseRows}</tbody>
      </table>
    </div>
    <p class="empty-note">${H.safety}</p>
  </div>

  <div class="section-card">
    <h3><span class="icon">🎬</span>${C.title}</h3>
    <div class="res-item"><div class="res-body"><p>${C.intro}</p></div></div>
    <div style="overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;font-size:13px;margin:10px 0;">
        <thead><tr style="background:#f4f6f8;">
          <th style="text-align:left;padding:8px;">过夜日</th>
          <th style="text-align:left;padding:8px;">住宿地</th>
          <th style="text-align:left;padding:8px;">电影院情况</th>
          <th style="text-align:left;padding:8px;">是否值得纳入计划</th>
        </tr></thead>
        <tbody>${cineRows}</tbody>
      </table>
    </div>
    <div class="warn-box">${C.pick}</div>
    <p class="empty-note">${C.caveat}</p>
  </div>`;
}

// 实际采用路线的独立总览页，只保留路线与逐日细节。
function renderPlanOverviewPage() {
  const planTitle = "伊犁-阿勒泰";
  const listHtml = PLAN2_DAYS.map(d => `
    <li><a href="p2day${d.num}.html">
      <span class="idx-day">Day ${d.num} · ${d.date}</span>
      <div class="idx-title">${d.title}</div>
      <div class="idx-summary">${d.summary}</div>
    </a></li>`).join("");

  return `${headHtml(planTitle + " - " + TRIP.title)}
<header class="site-header">
  <h1>${TRIP.title}</h1>
  <p>实际完成路线 · 2026年8月15日-30日</p>
</header>
${navHtml(null, 2, true)}
<main>
  <div class="day-title-block">
    <span class="day-num">总览</span>
    <h2>${planTitle}</h2>
    <div class="summary">乌鲁木齐出发，先走独库北段、唐布拉、昭苏与伊犁，再经赛里木湖北上阿勒泰，最后由阿禾公路和S21返回乌鲁木齐。</div>
  </div>
  <div class="section-card">
    <h3><span class="icon">🗺️</span>全程路线总览</h3>
    <div id="amap-index" class="map-frame-wrap"></div>
    <div id="amap-index-status" class="map-fallback-link"></div>
    <div class="map-note">地图按每天的实际途经点依次绘制，共${PLAN2_DAYS.length}天；首次加载需要几秒钟。</div>
  </div>
  <div class="section-card">
    <h3><span class="icon">📅</span>逐日行程</h3>
    <ul class="index-list">${listHtml}</ul>
  </div>
  <div class="disclaimer">${TRIP.disclaimer}</div>
</main>
${amapLoaderScript()}
${amapIndexInitScript(2)}
${footHtml()}`;
}

function renderJournalOverviewPage() {
  const items = JOURNAL_DAYS.map(day => {
    const excerpt = day.details[0] || "当天以返程为主。";
    return `<a class="journal-index-item" href="p2day${day.num}.html#travel-journal">
      <div class="journal-index-day">D${day.num} · ${escapeHtml(day.date)} · ${escapeHtml(day.status)}</div>
      <div class="journal-index-route">${escapeHtml(day.route)}</div>
      <div class="journal-index-excerpt">${escapeHtml(excerpt.slice(0, 92))}${excerpt.length > 92 ? "…" : ""}</div>
    </a>`;
  }).join("");

  return `${headHtml("北疆环游 · 旅行实录")}
<header class="site-header">
  <h1>${TRIP.title}</h1>
  <p>伊犁-阿勒泰 · 按实际日期整理的旅行实录</p>
</header>
${navHtml(null, 2, false, true)}
<main>
  <div class="day-title-block">
    <span class="day-num">D0–D15</span>
    <h2>北疆环游 · 旅行实录</h2>
    <div class="summary">依据旅途日记按实际日期和路线编排，并配有沿途照片与视频。</div>
  </div>
  <div class="section-card">
    <h3><span class="icon">✎</span>逐日实录</h3>
    <div class="journal-index-grid">${items}</div>
  </div>
</main>
${footHtml()}`;
}

// Write files. Legacy plan-one pages are removed from the published site.
function writeHtml(filename, html) {
  fs.writeFileSync(path.join(OUT, filename), html.replace(/[ \t]+$/gm, ""), "utf8");
}

writeHtml("index.html", renderLandingPage());
writeHtml("plan2.html", renderPlanOverviewPage());
writeHtml("journal-preview.html", renderJournalOverviewPage());
PLAN2_DAYS.forEach((d, idx) => {
  writeHtml(`p2day${d.num}.html`, renderDayPage(d, idx, null, 2));
});

const legacyFiles = [
  "plan1.html",
  ...fs.readdirSync(OUT).filter(filename => /^day.*\.html$/.test(filename)),
];
for (const filename of legacyFiles) {
  const target = path.join(OUT, filename);
  if (fs.existsSync(target)) fs.unlinkSync(target);
}

console.log("Generated:", 3 + PLAN2_DAYS.length, "files (home + actual overview + journal + 16 days)");
