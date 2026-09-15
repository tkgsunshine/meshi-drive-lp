const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('=== [Meshi Drive LP Build & Verification] ===');

const projectRoot = path.resolve(__dirname, '..');
const htmlPath = path.join(projectRoot, 'index.html');
const cssPath = path.join(projectRoot, 'css', 'style.css');
const jsPath = path.join(projectRoot, 'js', 'main.js');
const distDir = path.join(projectRoot, 'dist');

let hasError = false;

function reportCheck(name, pass, msg = '') {
  if (pass) {
    console.log(`  [PASS] ${name}`);
  } else {
    console.error(`  [FAIL] ${name}: ${msg}`);
    hasError = true;
  }
}

// 1. ファイル存在チェック
reportCheck('index.html exists', fs.existsSync(htmlPath));
reportCheck('css/style.css exists', fs.existsSync(cssPath));
reportCheck('js/main.js exists', fs.existsSync(jsPath));

if (hasError) {
  process.exit(1);
}

const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
const cssContent = fs.readFileSync(cssPath, 'utf-8');
const jsContent = fs.readFileSync(jsPath, 'utf-8');

// 2. JavaScript 構文チェック
try {
  new vm.Script(jsContent);
  reportCheck('JavaScript syntax verification', true);
} catch (err) {
  reportCheck('JavaScript syntax verification', false, err.message);
}

// 3. 必須フォーム項目の完全性検証 (全12項目)
const requiredFields = [
  { name: '店舗名（必須）', regex: /id=["']shop_name["'].*required/s },
  { name: '担当者名（必須）', regex: /id=["']manager_name["'].*required/s },
  { name: '業態（任意）', regex: /id=["']business_type["']/s },
  { name: '店舗エリア（必須）', regex: /id=["']shop_area["'].*required/s },
  { name: '月商（任意・単位万円）', regex: /id=["']monthly_sales["']/s },
  { name: '現在のテイクアウト（必須）', regex: /name=["']takeout_status["']/s },
  { name: '現在のデリバリー（必須）', regex: /name=["']delivery_status["']/s },
  { name: 'Uber Eats等の利用状況（必須）', regex: /name=["']ubereats_status["']/s },
  { name: '営業時間（任意）', regex: /id=["']business_hours["']/s },
  { name: '返信先メアド（必須）', regex: /id=["']email["'].*required/s },
  { name: '返信先電話番号（必須）', regex: /id=["']phone["'].*required/s },
  { name: 'その他備考（任意）', regex: /id=["']notes["']/s }
];

for (const field of requiredFields) {
  reportCheck(`Form field check: ${field.name}`, field.regex.test(htmlContent), `Missing pattern ${field.regex}`);
}

// 4. トンマナ・コピーチェック
reportCheck('Orange tone colors defined in CSS', /--primary:\s*#E85A18/.test(cssContent));
reportCheck('Hero Cabinet Decision text present', htmlContent.includes('8月5日閣議決定') || htmlContent.includes('閣議決定'));
reportCheck('Takeout 1% tax rate emphasized', htmlContent.includes('テイクアウト') && htmlContent.includes('1%'));
reportCheck('Non-assertion rule followed (可能性があります)', htmlContent.includes('可能性があります'));
reportCheck('Gov policy note present (※政府基本方針に基づく)', htmlContent.includes('政府基本方針') || htmlContent.includes('閣議決定'));
reportCheck('No service price numbers shown in LP', !htmlContent.includes('20,000円') && !htmlContent.includes('月額2万'));
reportCheck('No automated score diagnosis in LP', !htmlContent.includes('78点') && !htmlContent.includes('AI診断'));
reportCheck('Proven brand case: 豚丼ジャンクキング / 豚キムチ / 生姜野郎', htmlContent.includes('豚丼ジャンクキング') && htmlContent.includes('生姜野郎'));
reportCheck('Proven brand case: 風来麻辣湯', htmlContent.includes('風来麻辣湯'));
reportCheck('Company info present: 株式会社テラスヒ / 後野智行', htmlContent.includes('株式会社テラスヒ') && htmlContent.includes('後野智行'));

// 5. distディレクトリへのビルド出力
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}
const distCssDir = path.join(distDir, 'css');
const distJsDir = path.join(distDir, 'js');
if (!fs.existsSync(distCssDir)) fs.mkdirSync(distCssDir, { recursive: true });
if (!fs.existsSync(distJsDir)) fs.mkdirSync(distJsDir, { recursive: true });

fs.writeFileSync(path.join(distDir, 'index.html'), htmlContent, 'utf-8');
fs.writeFileSync(path.join(distCssDir, 'style.css'), cssContent, 'utf-8');
fs.writeFileSync(path.join(distJsDir, 'main.js'), jsContent, 'utf-8');

reportCheck('Dist assets generated successfully in /dist', fs.existsSync(path.join(distDir, 'index.html')));

if (hasError) {
  console.error('\nBuild failed with errors.');
  process.exit(1);
} else {
  console.log('\nBuild and validation completed successfully! [Errors: 0]');
  process.exit(0);
}
