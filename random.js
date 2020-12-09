/*
인증에 필요한 사용자의 JWT 토큰
var string = "#안녕하세요. 오늘 {{#}}에서 진료 받고 왔는데요. 아주 서비스가 좋더라구요. 앞으로 자주 가려고요. 저는 {{#}}치료, 딸은 {{#}}했어요.";
var objs = [
  { category: "clinic", id: 34, isNew: false, isTag: true },
  { category: "treatment", id: 1, isNew: false, isTag: true },
  { category: "treatment", id: 2, isNew: false, isTag: true },
];
var splitStr = string.split("{{#}}");
console.log(splitStr);
var pos = string.indexOf("{#}");
var idxList = [];
idxList.push(pos);
while (pos !== -1) {
  pos = string.indexOf("#", pos + 1); // 첫 번째 e 이후의 인덱스부터 e를 찾습니다.
  if (pos !== -1) idxList.push(pos);
}
console.log(idxList);
*/
/*
var splitStr = string.split("#");
console.log(splitStr);
const len = splitStr.length;
var parse = [];
for (let i = 0; i < len; i++) {
  parse.push(splitStr[i]);
  if (objs.length > 0) {
    const obj = objs.shift();
    if (obj.isTag === false) {
      parse.push(`#${obj.name}`);
    } else {
      parse.push(obj);
    }
  }
}
console.log(JSON.stringify(parse));

const data = [
  {
    category: "clinic",
    data: {
      id: 12,
      name: "운정연세치과",
    },
  },
];
const str1 =
  '[{"category": "clinic", "id": 43, "isNew": false, "isTag": true} ,{"category": "treatment", "id": 3, "isNew": false, "isTag": true },{"category": "treatment", "id": 4, "isNew": false, "isTag": true}]';
console.log(JSON.parse(str1));
삭제할 수 있는 게시글이 없을 경우 발생하는 애러코드 입니다.

const str = `안녕하세요. 오늘 {{C,43}}에서 진료 받고 왔는데요. 아주 서비스가 좋더라구요. 앞으로 자주 가려고요. 저는 {{T,충치}}치료를 했고, 딸은 {{S,이시림}}에 대해 상담을 받았어요.`;
var hashtags = [];
const regex = /\{\{(C|T|S|G),[가-힣|ㄱ-ㅎ|ㅏ-ㅣ|0-9|a-zA-Z]+\}\}/gm;
let m;
while ((m = regex.exec(str)) !== null) {
  // This is necessary to avoid infinite loops with zero-width matches
  if (m.index === regex.lastIndex) {
    regex.lastIndex++;
  }
  // The result can be accessed through the `m`-variable.
  m.forEach((match, groupIndex) => {
    if (groupIndex === 0) {
      match = match.replace(/\{/g, "");
      match = match.replace(/\}/g, "");
      match = match.split(",");
      hashtags.push(match);
      console.log(`Found match, group ${groupIndex}: ${match}`);
    }
  });
}
console.log(JSON.stringify(hashtags));

console.log(new Date("10:00:00"));
*/
