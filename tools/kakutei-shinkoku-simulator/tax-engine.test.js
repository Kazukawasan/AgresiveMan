// 計算エンジンのテスト（依存なし）：node --test tools/kakutei-shinkoku-simulator/tax-engine.test.js
// 期待値は、法定の速算式・控除額の表から手計算したもの。法令と照合できていない現行の仕様を
// 固定するテストは、名前に「現行の仕様」と書く。住民税は画面と同じ概算（標準税率の所得割10%を
// 一括で計算し、均等割は1級地）による。
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

// index.html に埋め込んだ計算エンジン（<script id="tax-engine">）を取り出して読み込む
function loadEngine(){
  const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
  const m = html.match(/<script id="tax-engine">\r?\n([\s\S]*?)<\/script>/);
  if (!m) throw new Error('index.html に <script id="tax-engine"> が見つかりません');
  // HTML としてスクリプトの終わりを狂わせる文字列が無いこと
  if (/<!--|<\/?script/i.test(m[1])) throw new Error("計算エンジン部分に <!-- や <script、</script を書かないでください");
  const mod = { exports: {} };
  new Function("module", m[1])(mod);
  return mod.exports;
}
const { RULES, emptyInput, simulate } = loadEngine();

const R7 = RULES.R7;

// 画面の初期表示と同じ記入例（給与550万円・高校生の子1人・生命保険料8万円）
const SAMPLE = {
  kyuyoShunyu: 5500000,
  gensen: 139500,
  shakai: 820000,
  seimei: { ippanShin: 80000 },
  fuyo: { ippan: 1 }
};

// 住民税の所得控除のうち、指定した入力で増えた分
const juminKojoDiff = (input, base = {}) => simulate({ ...base, ...input }).juminzei.kojo - simulate(base).juminzei.kojo;

test("記入例：還付30,800円・住民税237,700円・ふるさと納税の上限6万円", () => {
  const r = simulate(SAMPLE);
  assert.equal(r.shotoku.kyuyoKojo, 1540000);
  assert.equal(r.shotoku.gokei, 3960000);
  assert.equal(r.kojo.kiso, 680000);
  assert.equal(r.kojo.seimei, 40000);
  assert.equal(r.kojo.fuyo, 380000);
  assert.equal(r.kojo.gokei, 1920000);
  assert.equal(r.shotokuzei.kazei, 2040000);
  assert.equal(r.shotokuzei.zeigaku, 106500);
  assert.equal(r.shotokuzei.fukko, 2236);
  assert.equal(r.shotokuzei.nenzei, 108700);
  assert.equal(r.shotokuzei.sashihiki, -30800);
  assert.equal(r.juminzei.kazei, 2352000);
  assert.equal(r.juminzei.chosei, 2500);
  assert.equal(r.juminzei.gokei, 237700);
  assert.equal(r.furusatoJogen, 60000);
});

test("給与900万円：合計所得705万円・基礎控除58万円・年税額631,400円", () => {
  const r = simulate({ ...SAMPLE, kyuyoShunyu: 9000000 });
  assert.equal(r.shotoku.gokei, 7050000);
  assert.equal(r.kojo.kiso, 580000);
  assert.equal(r.shotokuzei.nenzei, 631400);
  assert.equal(r.shotokuzei.sashihiki, 491900);
});

test("給与所得控除：最低保障65万円・区分の境目・上限195万円", () => {
  const cases = [
    [600000, 600000],      // 収入を超えない
    [1900000, 650000],
    [2000000, 680000],
    [3600000, 1160000],
    [5000000, 1440000],
    [6600000, 1760000],
    [8500000, 1950000],
    [20000000, 1950000]
  ];
  for (const [kyuyoShunyu, kojo] of cases) {
    assert.equal(simulate({ kyuyoShunyu }).shotoku.kyuyoKojo, kojo, `給与収入 ${kyuyoShunyu}`);
  }
  assert.equal(simulate({ kyuyoShunyu: 600000 }).shotoku.kyuyo, 0);
});

test("基礎控除：合計所得金額の区分の境目（令和7年分の上乗せ特例）", () => {
  const cases = [
    [1320000, 950000], [1320001, 880000],
    [3360000, 880000], [3360001, 680000],
    [4890000, 680000], [4890001, 630000],
    [6550000, 630000], [6550001, 580000],
    [23500000, 580000], [23500001, 480000],
    [24000001, 320000], [24500001, 160000], [25000001, 0]
  ];
  for (const [zatsu, kiso] of cases) {
    assert.equal(simulate({ zatsu }).kojo.kiso, kiso, `合計所得 ${zatsu}`);
  }
});

test("住民税の基礎控除は43万円のまま", () => {
  assert.equal(simulate({ zatsu: 3000000 }).juminzei.kojo, 430000);
  assert.equal(simulate({ zatsu: 24000001 }).juminzei.kojo, 290000);
  assert.equal(simulate({ zatsu: 25000001 }).juminzei.kojo, 0);
});

test("給与90万円：所得税・住民税ともにかからず、源泉徴収税額が全額戻る", () => {
  const r = simulate({ kyuyoShunyu: 900000, gensen: 12000 });
  assert.equal(r.shotoku.gokei, 250000);
  assert.equal(r.kojo.kiso, 950000);
  assert.equal(r.shotokuzei.nenzei, 0);
  assert.equal(r.shotokuzei.sashihiki, -12000);
  assert.equal(r.juminzei.gokei, 0);
});

test("事業所得と不動産所得：青色申告特別控除と、赤字の給与との損益通算", () => {
  assert.equal(simulate({ jigyoShunyu: 3000000, jigyoKeihi: 1000000, aoiro: 650000 }).shotoku.jigyo, 1350000);
  assert.equal(simulate({ jigyoShunyu: 300000, fudosanShunyu: 1000000, fudosanKeihi: 200000, aoiro: 650000 }).shotoku.jigyo, 450000);
  assert.equal(simulate({ jigyoShunyu: 400000, aoiro: 650000 }).shotoku.jigyo, 0);
  const aka = simulate({ kyuyoShunyu: 5000000, jigyoShunyu: 1000000, jigyoKeihi: 1500000, aoiro: 650000 });
  assert.equal(aka.shotoku.jigyo, -500000);
  assert.equal(aka.shotoku.gokei, 3060000);
});

test("配偶者控除と配偶者特別控除の境目", () => {
  const base = { kyuyoShunyu: 5000000 };
  const haigu = (shotoku, extra = {}) => simulate({ ...base, haigu: { ari: true, shotoku, ...extra } }).kojo;
  assert.deepEqual([haigu(580000).haigu, haigu(580000).haiguTokubetsu], [380000, false]);
  assert.deepEqual([haigu(580001).haigu, haigu(580001).haiguTokubetsu], [380000, true]);
  assert.equal(haigu(950001).haigu, 360000);
  assert.equal(haigu(1330000).haigu, 30000);
  assert.equal(haigu(1330001).haigu, 0);
  assert.equal(haigu(0, { rojin: true }).haigu, 480000);
  assert.equal(juminKojoDiff({ haigu: { ari: true, rojin: true } }, base), 380000);
  assert.equal(simulate({ zatsu: 9000001, haigu: { ari: true, rojin: true } }).kojo.haigu, 320000);
  assert.equal(juminKojoDiff({ haigu: { ari: true, rojin: true } }, { zatsu: 9000001 }), 260000);
  assert.equal(simulate({ haigu: { ari: false, shotoku: 0 } }).kojo.haigu, 0);
});

test("配偶者控除は本人の合計所得金額で減り、1,000万円超で受けられない", () => {
  const haigu = (zatsu) => simulate({ zatsu, haigu: { ari: true } }).kojo.haigu;
  assert.equal(haigu(9000000), 380000);
  assert.equal(haigu(9000001), 260000);
  assert.equal(haigu(9500001), 130000);
  assert.equal(haigu(10000001), 0);
});

test("特定親族特別控除：58万円超123万円以下で段階的に減る", () => {
  const base = { zatsu: 3000000 };
  const cases = [
    [580000, 0, 0], [580001, 630000, 450000], [850000, 630000, 450000],
    [850001, 610000, 450000], [950001, 410000, 410000],
    [1230000, 30000, 30000], [1230001, 0, 0]
  ];
  for (const [s, shotokuzei, juminzei] of cases) {
    assert.equal(simulate({ ...base, tokuteiShinzoku: [s] }).kojo.tokuteiShinzoku, shotokuzei, `所得税 ${s}`);
    assert.equal(juminKojoDiff({ tokuteiShinzoku: [s] }, base), juminzei, `住民税 ${s}`);
  }
});

test("障害者控除・寡婦控除・ひとり親控除・勤労学生控除（所得税／住民税）", () => {
  const base = { kyuyoShunyu: 1400000 };   // 給与所得75万円だけ（勤労学生の所得要件を満たす）
  const cases = [
    [{ shogai: { ippan: 1, tokubetsu: 1, dokyo: 1 } }, 1420000, 1090000],
    [{ hitori: "hitorioya" }, 350000, 300000],
    [{ hitori: "kafu" }, 270000, 260000],
    [{ kinro: true }, 270000, 260000]
  ];
  for (const [input, shotokuzei, juminzei] of cases) {
    assert.equal(simulate({ ...base, ...input }).kojo.sonota, shotokuzei, JSON.stringify(input));
    assert.equal(juminKojoDiff(input, base), juminzei, JSON.stringify(input));
  }
});

test("生命保険料控除：新旧の併用と、所得税12万円・住民税7万円の上限", () => {
  assert.equal(simulate({ seimei: { ippanShin: 50000, ippanKyu: 100000 } }).kojo.seimei, 50000);  // 旧だけ（5万円）の方が有利
  assert.equal(simulate({ seimei: { ippanShin: 30000, ippanKyu: 10000 } }).kojo.seimei, 35000);   // 新旧合計の方が有利
  const max = { seimei: { ippanKyu: 100000, kaigo: 80000, nenkinKyu: 100000 } };
  assert.equal(simulate(max).kojo.seimei, 120000);
  assert.equal(juminKojoDiff(max), 70000);
});

test("地震保険料控除：旧長期損害保険料との合計の上限", () => {
  assert.equal(simulate({ jishin: 30000, choki: 15000 }).kojo.jishin, 42500);
  assert.equal(juminKojoDiff({ jishin: 30000, choki: 15000 }), 25000);
  assert.equal(simulate({ jishin: 80000 }).kojo.jishin, 50000);
  assert.equal(juminKojoDiff({ jishin: 80000 }), 25000);
});

test("寄附金控除：総所得金額等の40%が上限、2,000円を差し引く", () => {
  assert.equal(simulate({ zatsu: 1000000, sonotaKifu: 600000 }).kojo.kifu, 398000);
  assert.equal(simulate({ zatsu: 5000000, furusato: 30000, sonotaKifu: 10000 }).kojo.kifu, 38000);
});

test("一時所得：50万円の特別控除のあと、1/2が合計所得に入る", () => {
  const r = simulate({ ichijiShunyu: 1500000, ichijiShishutsu: 200000 });
  assert.equal(r.shotoku.ichiji, 400000);
  assert.equal(r.shotoku.gokei, 400000);
  assert.equal(simulate({ ichijiShunyu: 600000, ichijiShishutsu: 200000 }).shotoku.ichiji, 0);
});

test("所得金額調整控除：給与1,000万円で15万円、給与と年金の併給で10万円", () => {
  assert.equal(simulate({ kyuyoShunyu: 10000000, choseiYoken: true }).shotoku.chosei, 150000);
  assert.equal(simulate({ kyuyoShunyu: 10000000 }).shotoku.chosei, 0);
  const r = simulate({ kyuyoShunyu: 2000000, nenkinShunyu: 2000000 });
  assert.equal(r.shotoku.nenkin, 1225000);
  assert.equal(r.shotoku.chosei, 100000);
  assert.equal(r.shotoku.kyuyo, 1220000);
  assert.equal(r.shotoku.gokei, 2445000);
});

test("公的年金等控除：65歳以上の最低保障110万円と、他の所得による減額", () => {
  assert.equal(simulate({ nenkinShunyu: 3300000, over65: true }).shotoku.nenkin, 2200000);
  assert.equal(simulate({ nenkinShunyu: 1300000 }).shotoku.nenkin, 700000);
  assert.equal(simulate({ nenkinShunyu: 1000000, over65: true }).shotoku.nenkin, 0);
  assert.equal(simulate({ nenkinShunyu: 2000000, zatsu: 15000000 }).shotoku.nenkin, 1325000);   // 他の所得1,000万円超：10万円減
  assert.equal(simulate({ nenkinShunyu: 2000000, zatsu: 25000000 }).shotoku.nenkin, 1425000);   // 2,000万円超：20万円減
  assert.equal(simulate({ nenkinShunyu: 1500000, over65: true, zatsu: 15000000 }).shotoku.nenkin, 500000);
});

test("医療費控除とセルフメディケーション税制", () => {
  assert.equal(simulate({ ...SAMPLE, iryo: { shiharai: 300000, hoten: 50000 } }).kojo.iryo, 150000);
  assert.equal(simulate({ zatsu: 1000000, iryo: { shiharai: 100000 } }).kojo.iryo, 50000);   // 足切りは合計所得の5%（5万円）
  assert.equal(simulate({ ...SAMPLE, iryo: { self: true, otc: 50000 } }).kojo.iryo, 38000);
  assert.equal(simulate({ ...SAMPLE, iryo: { self: true, otc: 200000 } }).kojo.iryo, 88000);
});

test("住民税の調整控除：合計課税所得金額200万円以下と超", () => {
  const ika = simulate({ kyuyoShunyu: 3000000, shakai: 450000 });
  assert.equal(ika.juminzei.kazei, 1140000);
  assert.equal(ika.juminzei.chosei, 2500);
  assert.equal(ika.juminzei.gokei, 116500);
  // 人的控除差28万円（基礎5万＋配偶者5万＋特定扶養18万）、課税所得208万円
  const cho = simulate({ kyuyoShunyu: 5600000, shakai: 750000, haigu: { ari: true }, fuyo: { tokutei: 1 } });
  assert.equal(cho.juminzei.kazei, 2080000);
  assert.equal(cho.juminzei.chosei, 10000);
  assert.equal(cho.juminzei.gokei, 203000);
});

test("現行の仕様（法令の人的控除差の表とは未照合）：配偶者特別控除・特定親族は所得95万円以下で人的控除差を数える", () => {
  // 地方税法の調整控除の人的控除差は固定の表で決まり、配偶者特別控除で差が出るのはごく狭い所得帯だけのはず。
  // このテストは振る舞いを変えないための固定で、法令との照合と修正は BACKLOG の CHECK-1 で行う。
  const chosei = (input) => simulate({ kyuyoShunyu: 3000000, shakai: 450000, ...input }).juminzei.chosei;
  // 課税所得81万円。現行は配偶者特別控除の人的控除差を5万円と数え、基礎5万円と合わせた10万円の5%
  assert.equal(chosei({ haigu: { ari: true, shotoku: 900000 } }), 5000);
  assert.equal(chosei({ haigu: { ari: true, shotoku: 960000 } }), 2500);
  // 課税所得69万円。現行は特定親族の人的控除差を18万円と数え、基礎5万円と合わせた23万円の5%
  assert.equal(chosei({ tokuteiShinzoku: [900000] }), 11500);
  assert.equal(chosei({ tokuteiShinzoku: [960000] }), 2500);
});

test("住宅ローン控除：所得税から引ききれない分を住民税へ（課税所得の5%・9.75万円まで）", () => {
  const r = simulate({ kyuyoShunyu: 3000000, shakai: 450000, jutaku: 200000 });
  assert.equal(r.shotokuzei.zeigaku, 34500);
  assert.equal(r.shotokuzei.zeigakuKojo, 34500);
  assert.equal(r.shotokuzei.nenzei, 0);
  assert.equal(r.juminzei.jutaku, 34500);
  assert.equal(r.juminzei.gokei, 82000);
  const cap = simulate({ zatsu: 2880000, jutaku: 300000 });
  assert.equal(cap.shotokuzei.kazei, 2000000);
  assert.equal(cap.juminzei.jutaku, 97500);
  assert.equal(cap.juminzei.gokei, 150000);
  // その他の税額控除（配当控除など）を先に当て、住宅ローン控除の残りが住民税へ回る（外国税額控除の順序は未対応）
  assert.equal(simulate({ kyuyoShunyu: 3000000, shakai: 450000, zeigakuKojo: 20000, jutaku: 30000 }).juminzei.jutaku, 15500);
});

test("住民税の均等割：非課税限度額（単身45万円、同一生計配偶者ありは101万円）", () => {
  const kinto = (input) => simulate(input).juminzei.kintowari;
  assert.equal(kinto({ zatsu: 450000 }), 0);
  assert.equal(kinto({ zatsu: 450001 }), 5000);
  assert.equal(kinto({ zatsu: 1010000, haigu: { ari: true } }), 0);
  assert.equal(kinto({ zatsu: 1010001, haigu: { ari: true } }), 5000);
  assert.equal(kinto({ zatsu: 1010000, haigu: { ari: true, shotoku: 600000 } }), 5000);   // 所得58万円超の配偶者は数えない
});

test("ふるさと納税の住民税控除：基本分は総所得金額等の30%まで、特例分は所得割の20%まで", () => {
  // 合計所得100万円・寄附40万円：基本分 (30万−2,000)×10%＝29,800円、特例分は所得割54,500円の20%＝10,900円で頭打ち
  assert.equal(Math.round(simulate({ zatsu: 1000000, furusato: 400000 }).juminzei.kifu), 40700);
});

test("ふるさと納税：上限目安までなら自己負担は約2,000円、超えると負担が増える", () => {
  const scenarios = [
    SAMPLE,
    { ...SAMPLE, kyuyoShunyu: 9000000 },
    { kyuyoShunyu: 15000000, shakai: 1500000, haigu: { ari: true } }
  ];
  for (const base of scenarios) {
    const zei = (furusato) => {
      const r = simulate({ ...base, furusato });
      return r.shotokuzei.nenzei + r.juminzei.gokei;
    };
    const futan = (furusato) => furusato - (zei(0) - zei(furusato));
    const jogen = simulate(base).furusatoJogen;
    assert.ok(jogen > 0);
    // 年税額・住民税の100円未満切り捨てと課税所得の1,000円未満切り捨ての分だけずれる
    assert.ok(Math.abs(futan(jogen) - 2000) <= 300, `上限 ${jogen} で自己負担 ${futan(jogen)}`);
    assert.ok(futan(jogen + 50000) - futan(jogen) > 20000, `上限を5万円超えたときの負担増 ${futan(jogen + 50000) - futan(jogen)}`);
  }
});

test("入力：知らない項目や型の違う値はエラーにし、入力そのものは書き換えない", () => {
  assert.throws(() => simulate({ kyouyo: 1 }), /kyouyo/);
  assert.throws(() => simulate({ seimei: { ippan: 1 } }), /seimei\.ippan/);
  assert.throws(() => simulate({ kyuyoShunyu: "5500000" }), /kyuyoShunyu/);
  assert.throws(() => simulate({ shakai: NaN }), /shakai/);
  assert.throws(() => simulate({ haigu: { ari: "yes" } }), /haigu\.ari/);
  assert.throws(() => simulate({ hitori: 1 }), /hitori/);
  assert.throws(() => simulate({ tokuteiShinzoku: ["800000"] }), /tokuteiShinzoku/);
  const input = { ...emptyInput(), kyuyoShunyu: 5000000, tokuteiShinzoku: [800000] };
  const copy = structuredClone(input);
  simulate(input);
  assert.deepEqual(input, copy);
});

test("ルールの表：上限が昇順で、速算式が区分の境目でつながっている", () => {
  const ascending = (table, name) => {
    for (let i = 1; i < table.length; i++) {
      assert.ok(table[i - 1][0] < table[i][0], `${name} の ${i} 行目`);
    }
  };
  // [上限, 率, 加算額] の表は、境目で両側の式が同じ値になる
  const continuous = (table, name, fn = (row, x) => x * row[1] + row[2]) => {
    ascending(table, name);
    for (let i = 0; i < table.length - 1; i++) {
      const x = table[i][0];
      assert.ok(Math.abs(fn(table[i], x) - fn(table[i + 1], x)) < 1e-6, `${name} の境目 ${x}`);
    }
  };
  for (const [nenbun, R] of Object.entries(RULES)) {
    continuous(R.kyuyoKojo, `${nenbun} 給与所得控除`);
    continuous(R.nenkinKojo.sokusan, `${nenbun} 公的年金等控除`);
    for (const zei of ["shotokuzei", "juminzei"]) {
      continuous(R.seimei[zei].shin, `${nenbun} 生命保険料（新・${zei}）`);
      continuous(R.seimei[zei].kyu, `${nenbun} 生命保険料（旧・${zei}）`);
      continuous(R.jishin[zei].choki, `${nenbun} 旧長期損害保険料（${zei}）`);
    }
    continuous(R.zeiritsu, `${nenbun} 所得税の速算表`, (row, x) => x * row[1] - row[2]);
    ascending(R.kiso, `${nenbun} 基礎控除`);
    ascending(R.jumin.kiso, `${nenbun} 住民税の基礎控除`);
    ascending(R.haigu.tokubetsu, `${nenbun} 配偶者特別控除`);
    ascending(R.tokuteiShinzoku.hyo, `${nenbun} 特定親族特別控除`);
    // 公的年金等控除の最低保障は、速算式に切り替わる収入でちょうどつながる
    for (const age of ["under65", "over65"]) {
      const { saitei, saiteiMade } = R.nenkinKojo[age];
      const row = R.nenkinKojo.sokusan.find((r) => saiteiMade <= r[0]);
      assert.equal(saiteiMade * row[1] + row[2], saitei, `${nenbun} ${age}`);
    }
    // 人数で数える控除は、入力と同じ区分を持つ
    assert.deepEqual(Object.keys(R.fuyo), Object.keys(emptyInput().fuyo), `${nenbun} 扶養控除の区分`);
    assert.deepEqual(Object.keys(R.shogai), Object.keys(emptyInput().shogai), `${nenbun} 障害者控除の区分`);
    // 特例分の「所得税率×1.021」は復興特別所得税率と整合する
    assert.ok(Math.abs(R.jumin.furusato.fukkoBairitsu - (1 + R.fukkoRitsu)) < 1e-12, `${nenbun} 復興特別所得税率`);
  }
});

test("ルールは変更できない", () => {
  assert.ok(Object.isFrozen(R7));
  assert.ok(Object.isFrozen(R7.kiso[0]));
  assert.ok(Object.isFrozen(R7.fuyo.ippan));
});
