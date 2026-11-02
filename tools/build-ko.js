// index.html(영어) → ko/index.html(한국어) 생성기
// 페이지 안의 번역 사전(const KO)을 그대로 써서, 글자를 미리 한국어로 바꿔 둔 페이지를 만든다.
// 검색엔진이 한국어 페이지를 따로 읽을 수 있게 하기 위함. 사용법: node tools/build-ko.js
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

// 번역 사전 꺼내기
const start = html.indexOf('const KO = {');
const end = html.indexOf('\n  };', start);
const KO = new Function('return {' + html.slice(start + 'const KO = {'.length, end) + '\n};')();

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const attr = s => esc(s).replace(/"/g, '&quot;');
const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// 글자만 들어 있는 태그를 한국어로 바꾸고, 원래 영어는 data-en에 남김 (언어 버튼이 그대로 동작하도록)
let count = 0;
const body = html.indexOf('<body>');
let head = html.slice(0, body);
let page = html.slice(body);
const script = page.indexOf('<script');
let markup = page.slice(0, script);
const tail = page.slice(script);
for (const [en, ko] of Object.entries(KO).sort((a, b) => b[0].length - a[0].length)) {
  const re = new RegExp('<([a-z0-9]+)((?:\\s[^<>]*)?)>' + reEsc(esc(en)) + '</\\1>', 'g');
  markup = markup.replace(re, (m, tag, attrs) => {
    if (/\sdata-en=/.test(attrs) || /class="[^"]*\bkeep\b/.test(attrs)) return m;
    count++;
    return `<${tag}${attrs} data-en="${attr(en)}">${esc(ko)}</${tag}>`;
  });
}

const descKo = 'MTL Studio(미트림): 마인크래프트 리소스 외주와 판매 팩. 아이템에더용 칭호·아이콘·음식 픽셀아트(도트) 팩, 블록벤치 아이템 모델링, Skript 서버 스크립트를 제작합니다.';
head = head
  .replace('<html lang="en">', '<html lang="ko">')
  .replace(/<title>[^<]*<\/title>/, '<title>MTL Studio | 마인크래프트 리소스 외주 · 픽셀아트 · 모델링 · 스크립트</title>')
  .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${descKo}">`)
  .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${descKo}">`)
  .replace('<link rel="canonical" href="https://mitlim.github.io/">', '<link rel="canonical" href="https://mitlim.github.io/ko/">')
  .replace('<meta property="og:url" content="https://mitlim.github.io/">', '<meta property="og:url" content="https://mitlim.github.io/ko/">')
  .replace('<meta property="og:locale" content="en_US">', '<meta property="og:locale" content="ko_KR">')
  .replace('<meta property="og:locale:alternate" content="ko_KR">', '<meta property="og:locale:alternate" content="en_US">')
  .replace(/"description":"[^"]*"/, `"description":"${descKo}"`)
  .replace(/"url":"https:\/\/mitlim\.github\.io\/"/, '"url":"https://mitlim.github.io/ko/"');

// 한 단계 아래 폴더라 assets 경로를 ../assets 로
const fixPaths = s => s.replace(/(["';|(])assets\//g, '$1../assets/');
const out = fixPaths(head) + fixPaths(markup) + fixPaths(tail)
  .replace('<button type="button" data-lang="en" aria-pressed="true">', '<button type="button" data-lang="en" aria-pressed="false">');
const outFixed = out
  .replace('<button type="button" data-lang="en" aria-pressed="true">EN</button>', '<button type="button" data-lang="en" aria-pressed="false">EN</button>')
  .replace('<button type="button" data-lang="ko" aria-pressed="false" lang="ko">', '<button type="button" data-lang="ko" aria-pressed="true" lang="ko">');

fs.mkdirSync(path.join(root, 'ko'), { recursive: true });
fs.writeFileSync(path.join(root, 'ko', 'index.html'), outFixed);
console.log(`ko/index.html: ${count} text blocks translated`);
