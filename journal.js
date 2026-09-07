const fs = require("fs");
const path = require("path");

const RAW = fs.readFileSync(path.join(__dirname, "journal.txt"), "utf8")
  .replace(/^\uFEFF/, "")
  .replace(/\r\n/g, "\n");

const ACTUAL = {
  0: { date: "8月15日", route: "香港 → 乌鲁木齐 → 机场酒店 / 取车", status: "按计划抵达" },
  1: { date: "8月16日", route: "天山机场 → G30 → 凤凰湖驿站 → S101 → 沙湾 → 奎屯", status: "增加 S101 丹霞路段" },
  2: { date: "8月17日", route: "奎屯 → 独库公路北段 → 乔尔玛 → 唐布拉 → 布隆沟", status: "蒙克特关闭，改游布隆沟" },
  3: { date: "8月18日", route: "唐布拉 → 尼勒克 / 蜜蜂小镇 → 特克斯", status: "轻松转场" },
  4: { date: "8月19日", route: "特克斯 → 喀拉峻 → 昭苏", status: "喀拉峻骑马" },
  5: { date: "8月20日", route: "昭苏 → 昭苏玉湖 → 夏塔住宿区", status: "因雨改线" },
  6: { date: "8月21日", route: "夏塔冰川 → 伊特公路 → 伊昭公路 → 伊宁", status: "三段行程合并完成" },
  7: { date: "8月22日", route: "伊宁 → 惠远古城 → 果子沟大桥 → 赛里木湖", status: "傍晚环湖" },
  8: { date: "8月23日", route: "赛里木湖 → 松树头 → 奎屯", status: "因雨取消日出" },
  9: { date: "8月24日", route: "奎屯 → 乌尔禾魔鬼城 → 布尔津 → 五彩滩", status: "五彩滩日落" },
  10: { date: "8月25日", route: "布尔津 → 白哈巴 → 贾登峪", status: "临时加入白哈巴" },
  11: { date: "8月26日", route: "贾登峪 → 喀纳斯三湾 → 喀纳斯湖 / 老村", status: "喀纳斯第一日" },
  12: { date: "8月27日", route: "喀纳斯晨雾 → 月亮湾 / 卧龙湾 → 禾木", status: "下午转入禾木" },
  13: { date: "8月28日", route: "禾木晨雾 / 百年老屋 → 阿禾公路 → 阿勒泰", status: "阿禾公路全天" },
  14: { date: "8月29日", route: "阿勒泰 → 乌鲁木齐 → 大巴扎 → 机场酒店", status: "长途返乌市" },
  15: { date: "8月30日", route: "乌鲁木齐 → 香港（CZ603）", status: "返程" },
};

const TYPO_FIXES = new Map([
  ["消融行程奎屯河", "消融形成奎屯河"],
  ["临听自然之声", "聆听自然之声"],
  ["高山草旬", "高山草甸"],
  ["多位旅游景点的摆设", "多为旅游景点的摆设"],
  ["赛里木湖得美", "赛里木湖的美"],
  ["如释重负和懈意", "如释重负和惬意"],
  ["已经是不午后", "已经是午后"],
  ["上下楼略有不变", "上下楼略有不便"],
  ["物价奇鬼", "物价奇贵"],
  ["蒙古族图尔人", "蒙古族图瓦人"],
  ["图尔族人", "图瓦族人"],
  ["商业话民宿", "商业化民宿"],
  ["赶上一般车", "赶上一班车"],
  ["来带禾木", "来到禾木"],
  ["被化成了景区", "被划成了景区"],
  ["正式傍晚时分", "正是傍晚时分"],
  ["一个大卡的景致瞬间", "一个打卡的景致瞬间"],
  ["金刚闪耀的玉石之山", "金光闪耀的玉石之山"],
  ["南🈶昭苏特克斯", "南有昭苏、特克斯"],
  ["令一番景象", "另一番景象"],
  ["岩土壮峡谷山丘", "岩土状峡谷山丘"],
  ["是作为独库公路了", "不愧为独库公路了"],
  ["突然浮现处一片", "突然浮现出一片"],
]);

function tidy(text) {
  let result = text.trim();
  for (const [from, to] of TYPO_FIXES) result = result.replaceAll(from, to);
  return result.replace(/\s+([，。！？；：])/g, "$1");
}

function parseSections(raw) {
  const headings = [...raw.matchAll(/^D(\d+):\s*(.*)$/gm)];
  const sections = {};
  headings.forEach((match, index) => {
    const day = Number(match[1]);
    const bodyStart = match.index + match[0].length;
    const bodyEnd = index + 1 < headings.length ? headings[index + 1].index : raw.length;
    sections[day] = {
      heading: match[2].trim(),
      body: raw.slice(bodyStart, bodyEnd).trim(),
    };
  });

  const d0Instruction = "照片按时间顺序嵌进去。";
  const d0Narrative = sections[0].heading.split(d0Instruction)[1] || "";
  sections[0].body = `${d0Narrative}\n\n${sections[0].body}`.trim();

  sections[4].body = sections[4].body.replace(/^今日特克斯\s*-\s*喀拉峻\s*-\s*昭苏\s*/u, "");

  const heMuMorning = "上午7点照例起床";
  const moveAt = sections[12].body.indexOf(heMuMorning);
  if (moveAt >= 0) {
    const moved = sections[12].body.slice(moveAt).trim();
    sections[12].body = sections[12].body.slice(0, moveAt).trim();
    sections[13].body = `${moved}\n\n${sections[13].body}`;
  }

  const altayMorning = "第二天早上逛了一下风情街";
  const altayAt = sections[13].body.indexOf(altayMorning);
  if (altayAt >= 0) {
    const sentenceEnd = sections[13].body.indexOf("。", altayAt);
    const moved = sections[13].body.slice(altayAt, sentenceEnd + 1).trim();
    sections[13].body = `${sections[13].body.slice(0, altayAt)}${sections[13].body.slice(sentenceEnd + 1)}`.trim();
    sections[14].body = `${moved}\n\n${sections[14].body}`;
  }

  return sections;
}

function splitDetails(text, maxLength = 180) {
  const paragraphs = tidy(text)
    .split(/\n\s*\n/)
    .map(part => part.replace(/\n+/g, " ").trim())
    .filter(Boolean);

  const details = [];
  for (const paragraph of paragraphs) {
    const sentences = paragraph.match(/[^。！？]+[。！？]?/g) || [paragraph];
    const paragraphDetails = [];
    let group = "";
    for (const sentence of sentences) {
      if (group && group.length + sentence.length > maxLength) {
        paragraphDetails.push(group.trim());
        group = sentence;
      } else {
        group += sentence;
      }
    }
    if (group.trim()) paragraphDetails.push(group.trim());

    // Keep a short closing sentence with the scene it concludes.
    if (paragraphDetails.length > 1 && paragraphDetails.at(-1).length < 70) {
      paragraphDetails[paragraphDetails.length - 2] += paragraphDetails.pop();
    }
    details.push(...paragraphDetails);
  }
  return details;
}

const parsed = parseSections(RAW);
const JOURNAL_DAYS = Object.keys(ACTUAL).map(key => {
  const num = Number(key);
  let body = parsed[num] ? parsed[num].body : "";
  if (num === 15 && !body) body = "10:20 从乌鲁木齐起飞，15:40 抵达香港。";
  return { num, ...ACTUAL[num], details: splitDetails(body, [4, 5, 6].includes(num) ? 600 : 180) };
});

module.exports = { JOURNAL_DAYS };
