import { readFileSync } from "node:fs";
import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
const B="https://tdgamestudio.com", H={"x-hr-key":"Tdgameshr@123"}, J={...H,"content-type":"application/json"};
const APP="9093e7b5-c0c9-4f1c-9698-49221e75718b";
// dọn rác từ lần test hỏng
const s3=new S3Client({region:"auto",endpoint:process.env.R2_ENDPOINT,credentials:{accessKeyId:process.env.R2_ACCESS_KEY_ID,secretAccessKey:process.env.R2_SECRET_ACCESS_KEY}});
await s3.send(new DeleteObjectCommand({Bucket:process.env.R2_BUCKET,Key:"interviews/2026/09/1b1c4d3c-09e9-451c-b078-9aff3c694996-pv-r2test.mp3"}));
let list=await (await fetch(`${B}/api/hr/applications/${APP}/interviews`,{headers:H})).json();
for(const s of (list.sessions??list)) if(String(s.title).startsWith("ZZ TEST")) console.log("dọn session hỏng:",s.id,(await fetch(`${B}/api/hr/interviews/${s.id}`,{method:"DELETE",headers:H})).status);
// chạy lại cho đúng
let r=await fetch(`${B}/api/hr/applications/${APP}/interviews`,{method:"POST",headers:J,body:JSON.stringify({title:"ZZ TEST dọn R2 v2"})});
const j=await r.json(); const sid=j.id??j.session?.id;
console.log("[1] tạo:",r.status,sid);
const fd=new FormData(); fd.append("file",new Blob([new Uint8Array(readFileSync("/tmp/claude-501/pv.mp3"))],{type:"audio/mpeg"}),"pv-r2b.mp3");
const up=await (await fetch(`${B}/api/hr/upload/audio`,{method:"POST",headers:H,body:fd})).json();
r=await fetch(`${B}/api/hr/interviews/${sid}`,{method:"PATCH",headers:J,body:JSON.stringify({audio_url:up.url,audio_key:up.key,audio_bytes:up.bytes})});
console.log("[2] gắn audio:",r.status);
console.log("[3] file trước khi xoá:",(await fetch(`${up.url}?v=b`)).status);
console.log("[4] DELETE vòng PV:",(await fetch(`${B}/api/hr/interviews/${sid}`,{method:"DELETE",headers:H})).status);
await new Promise(s=>setTimeout(s,2000));
const a=(await fetch(`${up.url}?v=a`)).status;
console.log("[5] file sau khi xoá:",a,a===404?"✅ ĐÃ DỌN":"❌ CÒN RÁC");
