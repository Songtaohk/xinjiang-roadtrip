// 北疆15日自驾行程 - 数据源
// 说明：里程/车程/预约规则等信息来自本次对话中多轮网络查证；历史天气为8月北疆同类海拔的一般气候参考，非当年当日实测数据；
// 部分数据存在多来源冲突或未能查到确切数字，均已在对应字段中如实标注。

const TRIP = {
  title: "北疆15日自驾行程",
  subtitle: "香港 ⇄ 乌鲁木齐 · 8月16日–8月30日 · 全自驾 · 2人",
  disclaimer: "本网站所有里程、车程、预约规则、价格均为出行前整理的参考信息，存在多来源冲突或未查实的字段已逐一标注。请出发前用高德/百度地图核实实时路况，并通过官方渠道确认最新预约与门票政策。"
};

const DAYS = [
{
  num: 1, date: "8月16日（周六）", weekday: "六",
  title: "香港 → 乌鲁木齐",
  summary: "红眼航班抵达，深度补觉＋市区人文半日",
  mapPoints: ["Hong Kong International Airport", "Urumqi Diwopu International Airport", "Urumqi, Xinjiang, China"],
  transport: {
    roads: "机场高速",
    distance: "约25 km（机场→市区）",
    duration: "飞行约6小时（01:00香港起飞，约07:00抵乌鲁木齐，两地同时区）；落地后市区车程约30分钟",
    elevation: "香港 ~10m → 乌鲁木齐 ~800m（爬升约790m，飞行途中完成，无自驾爬升）",
    weather: "8月乌鲁木齐日间气温约25-30℃，夜间约15-18℃，晴朗干燥为主",
    reservation: "机票已确认；租车建议提前1-2个月锁定中高端SUV",
    notes: "红眼航班后精神较弱，机场取车时仔细检查车况、油量、备胎，双人共同确认后再签字"
  },
  activities: [
    { name: "深度补觉", duration: "上午-中午", note: "红眼航班后优先休息，不建议安排晨间活动" },
    { name: "新疆维吾尔自治区博物馆", duration: "约2小时", note: "楼兰美女干尸展厅是核心看点，建议提前官网/公众号预约参观名额" },
    { name: "乌鲁木齐大巴扎", duration: "约1.5-2小时", note: "民族风情建筑群+烤肉+干果市集，傍晚人气最旺，注意随身财物" }
  ],
  food: ["大巴扎烤羊肉串、烤包子", "新疆大盘鸡（市区老字号）"],
  hotels: [
    { name: "乌鲁木齐康莱德酒店", loc: "沙依巴克区友好北路669号", why: "2021年开业，希尔顿旗下奢华品牌，评分4.7，市区繁华地段但客房隔音好", price: "价格未查到确切数字，建议携程/Booking查实时价" },
    { name: "乌鲁木齐希尔顿酒店", loc: "米东区红光山路1237号", why: "毗邻红光山4A景区，评分4.7，环境相对安静", price: "同上，建议实时查询" }
  ]
},
{
  num: 2, date: "8月17日（周日）", weekday: "日",
  title: "乌鲁木齐 → 克拉玛依",
  summary: "全程高速，轻松巡航，午后到达石油城",
  mapPoints: ["Urumqi, Xinjiang, China", "Karamay, Xinjiang, China"],
  transport: {
    roads: "乌奎高速（G3013/S40）+ 连霍高速（G30）",
    distance: "约300-320 km",
    duration: "约3.5-4.5小时（全程高速）",
    elevation: "乌鲁木齐 ~800m → 克拉玛依 ~400m（下降约400m，平缓）",
    weather: "8月克拉玛依日间常达30℃以上，干燥少雨，夜间约18-20℃",
    reservation: "自驾，无需预约",
    notes: "全程高速路况好，唯一注意点是戈壁段风大，注意侧风；服务区间隔较长，建议出发前加满油"
  },
  activities: [
    { name: "睡到自然醒，中午出发", duration: "—", note: "第2天，适度放松节奏" },
    { name: "九龙潭公园", duration: "约1小时", note: "克拉玛依市区人工湖景观，傍晚散步" }
  ],
  food: ["椒麻鸡（克拉玛依特色菜）", "手抓饭"],
  hotels: [
    { name: "克拉玛依恒隆国际酒店", loc: "克拉玛依市区（石油大厦店）", why: "商务型高档酒店，隔音好，市区位置驾车方便", price: "未查到确切数字，建议携程查实时价" },
    { name: "龙华大酒店", loc: "克拉玛依西环路店", why: "同级商务酒店选择", price: "建议携程查实时价" }
  ]
},
{
  num: 3, date: "8月18日（周一）", weekday: "一",
  title: "克拉玛依 → 布尔津 → 贾登峪（阿勒泰大本营）",
  summary: "进驻阿勒泰基地，接下来3晚以此为中心",
  mapPoints: ["Karamay, Xinjiang, China", "Burqin, Xinjiang, China", "Jiadengyu, Xinjiang, China"],
  transport: {
    roads: "G217国道（克拉玛依-布尔津段）+ 布尔津-贾登峪山区公路",
    distance: "克拉玛依-布尔津约230-300 km；布尔津-贾登峪约130 km（两段数据来源不一，建议出发前用高德核实实时路况）",
    duration: "约4.5-6.5小时合计（山路弯道多，需专注驾驶）",
    elevation: "克拉玛依 ~400m → 布尔津 ~480m → 贾登峪 ~1350m（后段明显爬升，约900m）",
    weather: "布尔津8月日间约26-30℃，夜间转凉约12-15℃；贾登峪海拔更高，夜间体感更凉",
    reservation: "自驾，无需预约",
    notes: "布尔津-贾登峪段山路弯道多、部分路段限速严格，建议不要在傍晚后行驶此段"
  },
  activities: [
    { name: "布尔津午餐歇脚", duration: "约1小时", note: "县城小憩，为后续山路养精蓄锐" },
    { name: "贾登峪入住办理", duration: "—", note: "办理2晚连住，明日起大件行李可留在此基地" }
  ],
  food: ["布尔津河鲜（额尔齐斯河鱼类）", "俄式风味早餐（贾登峪多家民宿提供）"],
  hotels: [
    { name: "喀纳斯西疆山居（贾登峪店）", loc: "喀纳斯景区贾登峪生活服务区", why: "2021年开业，地处喀纳斯与禾木两景区中心位置，换乘极方便", price: "未查到确切数字，贾登峪住宿普遍偏贵，建议携程查实时价" },
    { name: "喀纳斯鸿福生态度假酒店", loc: "贾登峪生活基地入口区", why: "34栋欧式别墅构成，占地大，环境私密安静", price: "建议携程查实时价" }
  ]
},
{
  num: 4, date: "8月19日（周二）", weekday: "二",
  title: "贾登峪 ⇄ 喀纳斯湖区（0自驾里程）",
  summary: "轻装换乘进核心景区，车留在基地",
  mapPoints: ["Jiadengyu, Xinjiang, China", "Kanas Lake, Xinjiang, China"],
  transport: {
    roads: "换乘区间车（私家车不可驶入）",
    distance: "贾登峪-喀纳斯换乘中心约30km",
    duration: "区间车约1小时；门票+区间车可当日多次进出",
    elevation: "贾登峪 ~1350m → 喀纳斯湖 ~1374m（基本持平，无明显爬升）",
    weather: "湖区8月日间约22-26℃，湖面凉意明显，建议带薄外套",
    reservation: "旺季（5.1-10.15）私家车禁入核心区，需在贾登峪换乘，门票+区间车约¥230/人",
    notes: "无需自驾，但换乘中心步行距离较长，建议穿舒适的鞋"
  },
  activities: [
    { name: "喀纳斯湖畔漫步", duration: "约1.5小时", note: "避开旅行团高峰时段（8-10点、12-14点）" },
    { name: "观鱼台（简版）", duration: "约1小时", note: "推荐区间车至半山腰＋徒步约1068级台阶（45-60分钟），不建议全程徒步版（约5小时/爬升500米，强度偏高）" },
    { name: "神仙湾/月亮湾/卧龙湾", duration: "约1小时", note: "区间车沿途观景点，可下车拍照；网传的\"3km木栈道\"细节未独立核实，建议现场向工作人员确认具体徒步路径" }
  ],
  food: ["贾登峪俄式风味餐厅", "图瓦人家常菜（羊肉烤包子）"],
  hotels: [
    { name: "（同D3，连住第2晚）", loc: "贾登峪", why: "大件行李continua留在房间", price: "—" }
  ]
},
{
  num: 5, date: "8月20日（周三）", weekday: "三",
  title: "贾登峪 → 禾木（轻装夜宿一晚）",
  summary: "大行李寄存基地，轻装赴禾木过夜看晨雾",
  mapPoints: ["Jiadengyu, Xinjiang, China", "Hemu Village, Xinjiang, China"],
  transport: {
    roads: "换乘大巴（私家车不可驶入）",
    distance: "贾登峪-禾木约70-130km（不同路书差异较大）",
    duration: "换乘大巴约1小时；每日仅11:00/16:00两班（对开）",
    elevation: "贾登峪 ~1350m → 禾木村 ~1200m（村落本身在1124-2300m盆地区间内）",
    weather: "禾木8月夜间气温可低至8-12℃，昼夜温差大，务必带保暖衣物",
    reservation: "贾登峪↔禾木门票站班车建议提前一天网上或窗口买票",
    notes: "大件行李寄存贾登峪基地酒店（提前告知前台），仅背双肩包（换洗衣物+保暖冲锋衣）轻装前往"
  },
  activities: [
    { name: "禾木桥、白桦林漫步", duration: "约1.5小时", note: "下午抵达后节奏放松" },
    { name: "悠闲下午茶", duration: "约1小时", note: "村内多家咖啡馆/茶室可选" }
  ],
  food: ["图瓦人家宴（提前预订更佳）", "俄式下午茶点心"],
  hotels: [
    { name: "禾木山庄", loc: "禾木村村口", why: "图瓦人木屋风格，2009年开业，评价较好，控噪佳", price: "未查到确切数字" },
    { name: "禾木安·慢民宿", loc: "禾木村内", why: "更顶级，含管家服务/私享庭院汤池，价格相应更高", price: "未查到确切数字，建议携程查实时价" }
  ]
},
{
  num: 6, date: "8月21日（周四）", weekday: "四",
  title: "禾木 → 贾登峪（取车） → 布尔津",
  summary: "清晨看晨雾，午后取车赶在天黑前抵布尔津",
  mapPoints: ["Hemu Village, Xinjiang, China", "Jiadengyu, Xinjiang, China", "Burqin, Xinjiang, China"],
  transport: {
    roads: "贾登峪↔禾木换乘大巴 + 布尔津方向省道",
    distance: "贾登峪-布尔津约130 km",
    duration: "换乘约1小时＋自驾约2.5-3小时（山路弯道多）",
    elevation: "禾木 ~1200m → 贾登峪 ~1350m → 布尔津 ~480m（净下降约720m）",
    weather: "8月约21点左右天黑，午后出发仍有充裕天光行车",
    reservation: "卡准16:00唯一的禾木下山班车，错过需等次日",
    notes: "17:30取车后山路行驶2.5-3小时，建议全程不超速，弯道多留意对向来车"
  },
  activities: [
    { name: "禾木观景台看晨雾", duration: "06:00-08:30", note: "8月日出约7点，建议提前抵达观景台占位" },
    { name: "悠闲早餐/咖啡", duration: "上午", note: "绝不赶路，充分享受禾木最后的清晨" }
  ],
  food: ["额尔齐斯河特色烤鱼（布尔津晚餐）", "禾木早餐俄式煎饼"],
  hotels: [
    { name: "布尔津童话城堡观景主题民宿", loc: "布尔津县城", why: "已确认起价¥592，评分4.7，主题特色房型", price: "¥592起" }
  ]
},
{
  num: 7, date: "8月22日（周五）", weekday: "五",
  title: "布尔津 → 世界魔鬼城 → 乌尔禾/克拉玛依外围",
  summary: "纯平路好开，傍晚拍雅丹地貌日落",
  mapPoints: ["Burqin, Xinjiang, China", "Urho Ghost City, Xinjiang, China"],
  transport: {
    roads: "G217国道",
    distance: "约220 km",
    duration: "约2.5小时（纯平路）",
    elevation: "布尔津 ~480m → 乌尔禾 ~350-450m（微降，平缓）",
    weather: "戈壁地带8月日间炎热干燥，可达32℃+，傍晚风力较大",
    reservation: "自驾，无需预约；魔鬼城门票建议网上提前购买",
    notes: "戈壁公路笔直单调，注意防止疲劳驾驶；风沙天气可能影响能见度"
  },
  activities: [
    { name: "睡到自然醒，中午出发", duration: "—", note: "节奏放松" },
    { name: "世界魔鬼城（乌尔禾）", duration: "约2-3小时", note: "傍晚时段光线最佳，租景区小交通游览雅丹地貌，注意风大" }
  ],
  food: ["乌尔禾/克拉玛依烤羊排"],
  hotels: [
    { name: "西部乌镇昆漠酒店（世界魔鬼城店）", loc: "乌尔禾区乌鲁木齐路与上海街交汇处", why: "2023年开业，评分4.7，距景区近", price: "未查到确切数字" },
    { name: "西部乌镇达达尼尔酒店", loc: "乌尔禾区杭州路与广东街交叉口", why: "2023年开业，同级选择", price: "建议携程查实时价" }
  ]
},
{
  num: 8, date: "8月23日（周六）", weekday: "六",
  title: "乌尔禾 → 赛里木湖 ⚠ 刚性长途日",
  summary: "全程唯一超长驾驶日，接受它，早发轻松抵达",
  mapPoints: ["Urho Ghost City, Xinjiang, China", "Sayram Lake, Xinjiang, China"],
  transport: {
    roads: "克拉玛依-独山子-精河方向高速",
    distance: "约410 km",
    duration: "约5-5.5小时（纯高速）",
    elevation: "乌尔禾 ~400m → 赛里木湖 ~2073m（爬升约1670m，全程渐进式）",
    weather: "赛里木湖8月日间约18-22℃，夜间可降至5-10℃，昼夜温差大，务必带厚外套",
    reservation: "自驾无需预约；露营/房车营位见住宿栏",
    notes: "建议9:30前出发；高速路段虽好开但时长较久，建议中途休息1-2次防疲劳"
  },
  activities: [
    { name: "环湖自驾", duration: "约1-1.5小时", note: "从东门进入后可自驾环湖，沿途观景点较多" },
    { name: "湖畔日落", duration: "傍晚", note: "入住后即可在营地看日落" }
  ],
  food: ["湖畔烤全羊", "哈萨克奶茶"],
  hotels: [
    { name: "赛里木湖高端星空帐篷营地/房车", loc: "赛里木湖景区内（如\"点将台\"同级）", why: "推窗见湖，可观星", price: "豪华房车均价约¥3000/晚；普通营位费约¥200-400/晚（不含房车本身）" }
  ],
  reservationAlert: "⚠须提前通过\"赛里木湖旅游\"微信小程序预约营位，建议提前2-3周锁定"
},
{
  num: 9, date: "8月24日（周日）", weekday: "日",
  title: "赛里木湖静享（0驾车）",
  summary: "全程唯一\"零驾驶\"休整日，彻底回血",
  mapPoints: ["Sayram Lake, Xinjiang, China"],
  transport: {
    roads: "—", distance: "0 km", duration: "—",
    elevation: "全天停留 ~2073m",
    weather: "同上，日出前气温较低，建议看日出时携带保暖外套",
    reservation: "—",
    notes: "全天不挪车，彻底休整"
  },
  activities: [
    { name: "清晨看日出", duration: "日出前后约1小时", note: "东岸视野较佳" },
    { name: "松树头轻徒步", duration: "约1.5-2小时", note: "低难度步道，俯瞰湖景与松林" },
    { name: "湖畔发呆/观星", duration: "全天弹性", note: "连住第2晚" }
  ],
  food: ["营地自制烧烤", "热奶茶"],
  hotels: [{ name: "（同D8，连住第2晚）", loc: "赛里木湖", why: "—", price: "—" }]
},
{
  num: 10, date: "8月25日（周一）", weekday: "一",
  title: "赛里木湖 → 伊宁（六星街） → 那拉提",
  summary: "果子沟大桥+俄式老街+抵达草原大本营",
  mapPoints: ["Sayram Lake, Xinjiang, China", "Yining, Xinjiang, China", "Nalati Grassland, Xinjiang, China"],
  transport: {
    roads: "果子沟大桥高速 + G218国道",
    distance: "赛里木湖-伊宁约140km；伊宁-那拉提约110-260km（数据来源有出入，建议出发前用导航核实实时路线）",
    duration: "合计约3.5-6小时",
    elevation: "赛里木湖 ~2073m → 伊宁 ~660m → 那拉提 ~1000-2000m（先大幅下降再回升）",
    weather: "伊宁河谷8月日间约28-32℃，那拉提草原相对凉爽约20-25℃",
    reservation: "自驾，无需预约",
    notes: "果子沟大桥路段风景极佳但弯道多，注意观景与驾驶分开，不要边开边拍照"
  },
  activities: [
    { name: "伊宁六星街", duration: "约2小时", note: "俄罗斯/哈萨克/回族多元文化街区，听手风琴、吃手工冰淇淋" },
    { name: "抵达那拉提，办理3晚连住", duration: "—", note: "为后续3天做准备" }
  ],
  food: ["伊宁手工冰淇淋", "俄罗斯族列巴", "那拉提哈萨克烤肉"],
  hotels: [
    { name: "那一叶 Nayiye View Inn 草原·设计师无界美宿", loc: "那拉提草原店", why: "设计感强，安静", price: "未查到确切数字" },
    { name: "那拉提岭上云精品民宿 / 昼夏月精品观景民宿", loc: "那拉提景区西门附近", why: "安静舒适，自驾进景区方便", price: "建议携程查实时价" }
  ]
},
{
  num: 11, date: "8月26日（周二）", weekday: "二",
  title: "那拉提草原深度游 + 傍晚盘龙谷自驾",
  summary: "空中草原轻徒步，傍晚幽静森林公路自驾",
  mapPoints: ["Nalati Grassland, Xinjiang, China"],
  transport: {
    roads: "景区内自驾路线（空中草原-游牧人家、盘龙谷道）",
    distance: "0-1小时（仅景区内挪车）",
    duration: "—",
    elevation: "空中草原核心区约1800-2200m",
    weather: "草原8月日间约22-26℃，夜间转凉约10-14℃",
    reservation: "⚠需通过\"智游那拉提\"小程序实名预约自驾，48小时车票有效，严禁搭载无票乘客；仅限空中草原-游牧人家/河谷草原全线/西盘龙谷道，其余路段单行道禁止驶入",
    notes: "今晚务必在\"游新疆一码游\"小程序预约8/28\"那拉提入口\"独库公路北段通行凭证（全程仅需这一次）"
  },
  activities: [
    { name: "空中草原（天界台等）", duration: "约3-4小时", note: "区间车入园，木栈道轻徒步约1小时，远眺雪山与哈萨克毡房" },
    { name: "盘龙谷道自驾", duration: "傍晚约1小时", note: "单向循环柏油路，两侧雪岭云杉遮天蔽日，体力要求为零，极度幽静" }
  ],
  food: ["草原手抓肉", "酸奶疙瘩"],
  hotels: [{ name: "（同D10，连住第2晚）", loc: "那拉提", why: "—", price: "—" }]
},
{
  num: 12, date: "8月27日（周三）", weekday: "三",
  title: "那拉提 ⇄ 唐布拉核心区（经S316+G218，不经独库公路）",
  summary: "零风险日：山谷公路直达唐布拉，无需任何独库预约",
  mapPoints: ["Nalati Grassland, Xinjiang, China", "Tangbula Grassland, Nilka County, Xinjiang, China"],
  transport: {
    roads: "S316省道 + G218国道（已用高德地图验证，全程不经乔尔玛/独库公路）",
    distance: "约110 km（单程），往返约220-230 km",
    duration: "约1.5-2小时（单程），往返约3-4小时",
    elevation: "那拉提 ~1500m → 唐布拉（黑蜂庄园/小华山一带）约1200-1800m（起伏不大）",
    weather: "喀什河谷8月日间约22-26℃，河谷阴凉处更舒适",
    reservation: "无需任何独库公路预约（此段完全不进入G217管制区）",
    notes: "沿途喀什河谷风光极佳，可随时停车拍照，节奏可以很松弛"
  },
  activities: [
    { name: "唐布拉核心区（黑蜂庄园/小华山）", duration: "约3-4小时", note: "草原/仙女湖轻徒步或骑马；小华山1988级台阶登顶可看日落（体力要求较高的可选项，非必须）" },
    { name: "唐布拉野奢帐篷营地下午茶", duration: "约1小时", note: "喀什河边喝咖啡听流水" }
  ],
  food: ["黑蜂蜂蜜制品", "哈萨克暖锅（晚餐回那拉提享用）"],
  hotels: [{ name: "（同D10，连住第3晚，那拉提最后一晚）", loc: "那拉提", why: "—", price: "—" }]
},
{
  num: 13, date: "8月28日（周四）", weekday: "四",
  title: "那拉提 → 独库公路北段 → 奎屯/独山子 ⚠ 史诗级长途日",
  summary: "全程最震撼的一天：翻越哈希勒根达坂，一日看四季",
  mapPoints: ["Nalati Grassland, Xinjiang, China", "Dushanzi, Karamay, Xinjiang, China"],
  transport: {
    roads: "G217独库公路北段",
    distance: "约260 km",
    duration: "约5-6小时",
    elevation: "那拉提 ~1500m → 哈希勒根达坂 3400m（爬升约1900m）→ 独山子 ~350-450m（再下降近3000m），全天海拔变化全线最大",
    weather: "哈希勒根达坂终年积雪，8月仍有真实下雪+冰雹记录，山顶气温常年0-10℃，与山脚温差可达20℃以上，务必携带保暖衣物（抓绒/薄羽绒/手套）",
    reservation: "⚠凭\"那拉提入口\"预约凭证进入独库公路北段管制区（提前1-7天在\"游新疆一码游\"小程序办理，建议约最早的8:00-10:00时段留足余量；每车每日仅可预约一个入口和一个时段）",
    notes: "8:00-8:30出发；经乔尔玛检查站时不右转、不折返，直接北上，避免二次入段的合规问题；高海拔路段避免剧烈活动，建议备一瓶便携氧气罐"
  },
  activities: [
    { name: "翻越哈希勒根达坂", duration: "沿途", note: "\"一日游四季\"经典体验，短暂停留（1-3小时内）对大部分人风险较低，避免剧烈运动" },
    { name: "独山子大峡谷", duration: "约1.5-2小时", note: "抵达独山子后傍晚游览，就在市区旁边，方便" }
  ],
  food: ["奎屯本地面食（拌面/炒米粉）"],
  hotels: [
    { name: "奎屯豪丰国际大酒店", loc: "喀什东路28幢", why: "2018年开业，四钻商务型", price: "未查到确切数字" },
    { name: "奎屯锦汇国际", loc: "奎屯市区", why: "同级选择", price: "建议携程查实时价" }
  ]
},
{
  num: 14, date: "8月29日（周五）", weekday: "五",
  title: "奎屯 → 天山天池 → 乌鲁木齐机场",
  summary: "最后一站，环湖轻健行后回城备战返程",
  mapPoints: ["Dushanzi, Karamay, Xinjiang, China", "Tianshan Tianchi, Fukang, Xinjiang, China", "Urumqi Diwopu International Airport"],
  transport: {
    roads: "连霍高速（G30）",
    distance: "奎屯-天池约280-320km；天池-机场约85-110km",
    duration: "合计约5小时",
    elevation: "奎屯 ~450m → 天池 ~1910m（爬升约1460m）→ 乌鲁木齐 ~800m（下降）",
    weather: "天池8月日间约18-23℃，山风较大，建议带外套",
    reservation: "天池景区私家车不能直接开到湖边，需在山门换乘区间车（约35km/40分钟，往返¥90/人）；⚠门票建议提前通过\"天山天池\"官方微信公众号/携程/美团实名预约，旺季(4.1-10.31)¥155/人含区间车",
    notes: "这是返程前最后一个长驾驶日，建议早出发，为当晚在机场附近从容安顿留出余量"
  },
  activities: [
    { name: "天池环湖木栈道", duration: "约2-2.5小时", note: "轻健行，远眺博格达峰" },
    { name: "还车、整理行李", duration: "傍晚", note: "抵机场附近后办理" }
  ],
  food: ["天池周边哈萨克风味餐"],
  hotels: [{ name: "乌鲁木齐机场附近高档静音酒店", loc: "地窝堡机场周边", why: "为次日10点航班留出充分缓冲，避免早起赶路", price: "建议携程查实时价" }]
},
{
  num: 15, date: "8月30日（周六）", weekday: "六",
  title: "乌鲁木齐 → 香港",
  summary: "无游玩安排，从容返程",
  mapPoints: ["Urumqi Diwopu International Airport", "Hong Kong International Airport"],
  transport: {
    roads: "—", distance: "—",
    duration: "国泰航空10:00起飞，约16:00抵香港（飞行约6小时）",
    elevation: "—", weather: "—",
    reservation: "机票已确认",
    notes: "早上7:30从容前往机场办理托运登机手续，无游览安排"
  },
  activities: [],
  food: [],
  hotels: []
}
];

module.exports = { TRIP, DAYS };
