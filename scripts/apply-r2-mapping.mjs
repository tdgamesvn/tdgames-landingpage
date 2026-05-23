/**
 * apply-r2-mapping.mjs
 *
 * Self-contained: mapping hardcoded from DB (fetched via MCP Supabase).
 * Expands ${CONST}/path template literals → R2 URL (if in DB) or full Behance URL.
 * Removes unused const lines afterwards.
 *
 * Usage:
 *   node scripts/apply-r2-mapping.mjs           # dry-run
 *   node scripts/apply-r2-mapping.mjs --apply   # write files
 */

import fs from "node:fs/promises";
import { globSync } from "glob";

const APPLY = process.argv.includes("--apply");

// ── Mapping: original Behance URL → R2 URL (from DB via MCP) ─────────────────
const DB_MAP = new Map([
  ["https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/05548b104755019.5f90538c3f95e.png","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/be2b611fda4a9621.png"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/1309dd65344203.5f702ed1b2050.png","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/1c27f626497209a5.png"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/138272104755019.5f90538c3f1c4.png","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/be2b611fda4a9621.png"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/13c8a965344203.5f702ed1b1519.png","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/c32a1c7ed523f594.png"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/1ba1b5112053013.600da2b40745a.png","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/c4f544c3bca1d3e0.png"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/1f7d58104755019.5f99928290551.png","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/b0d9634774d8123d.png"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/2b2045104755019.5f99a65e7bb2e.png","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/aa2fca14802f8aad.png"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/2bd1c365344203.5f702ed1b2566.png","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/landing/behance/52c6beca311ad4e9.png"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/351f0d104755019.5f9a40c89c946.png","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/14d2572dd60dd943.png"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/38623b112053013.600ebd86476f0.png","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/c4f544c3bca1d3e0.png"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/3b20ee104755019.5f99afb45afec.png","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/7af148f4da079814.png"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/3dceb8104755019.5f9992828ee00.png","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/a0bb9d0d8a43ea56.png"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/421297112053013.600da2b406e26.png","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/c4f544c3bca1d3e0.png"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/5ce913104755019.5f90538c412ef.png","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/be2b611fda4a9621.png"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/5dff53112053013.600ebd8647d06.png","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/c4f544c3bca1d3e0.png"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/6d9140104755019.5f90538c41d3e.png","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/be2b611fda4a9621.png"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/7b73df104755019.5f9a40c89ce0b.png","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/14d2572dd60dd943.png"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/904756112053013.600ebd8646fcc.png","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/c4f544c3bca1d3e0.png"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/97f4b0112053013.600ebd864627e.png","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/c4f544c3bca1d3e0.png"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/9fdece104755019.5f9a40c89dd30.png","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/14d2572dd60dd943.png"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/a2de1f104755019.5f99ae451f454.png","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/c15f04daa42e0341.png"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/a4c031104755019.5f90538c42df2.png","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/be2b611fda4a9621.png"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/a5159465344203.5f702ed1b1aa9.png","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/fb7c2b25f6fca594.png"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/a6b7ac104755019.5f8db8ffafc04.png","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/be2b611fda4a9621.png"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/a8642c104755019.5f9992828fd87.png","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/d5462666a53b8816.png"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/ad5b07104755019.5f99928290bee.png","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/c826e696a5c40358.png"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/aeac85104755019.5f99928291233.png","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/459a09baa1d71f17.png"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/b7594f104755019.5f999f71b77aa.png","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/a6d2a909275849d8.png"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/b95998104755019.5f9a40c89d88c.png","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/14d2572dd60dd943.png"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/c812ff104755019.5f9a40c89e623.png","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/14d2572dd60dd943.png"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/c93a5b67614633.5fbd2e1664ce9.png","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/landing/behance/0658c26a43e63dc4.png"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/cd91a9112053013.600da2b407e4c.png","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/c4f544c3bca1d3e0.png"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/cdbbf6112053013.600da2b408828.png","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/c4f544c3bca1d3e0.png"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/d4a408104755019.5f9b97c0a0f8a.png","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/landing/behance/1a2bf9c55f457909.png"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/d53694104755019.5f9992828f605.png","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/3e878f8a07dc2bfb.png"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/d9eb2e104755019.5f9a40c89d357.png","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/14d2572dd60dd943.png"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/f7f4c1112053013.600ee941bbde7.png","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/7be1c929387344e1.png"],
  // 1400
  ["https://mir-s3-cdn-cf.behance.net/project_modules/1400/1e081567614633.5fbd2e1664099.gif","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/ca575c9ff27edbf6.gif"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/1400/510c0a104755019.5f984b849cf7f.gif","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/8e3b7915de0c075b.gif"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/1400/71996467614633.5fbd2e1666aae.gif","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/1cdf92e397fb9ab2.gif"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/1400/7ea70b67614633.5fbd2e1662059.gif","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/ae8666d3edccf0d1.gif"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/1400/90ff3f104755019.5f984b849b747.gif","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/9ce3089eec2f8216.gif"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/1400/96425a67614633.5fbd2e1662a6d.gif","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/c616af44787d814c.gif"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/1400/98ce16104755019.5f984b849cafd.gif","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/0630f7f03357233a.gif"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/1400/a86186104755019.5f984b849ae07.gif","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/089cfaa0e23a921c.gif"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/1400/a8f280104755019.5f99a65e7b3cc.gif","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/4f899418d731127d.gif"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/1400/a92d65104755019.5f984b849d401.gif","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/2bd0b034cc702650.gif"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/1400/b8312567614633.5fbd2e166721b.gif","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/4cbeae6956d68586.gif"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/1400/bf345a104755019.5f984b849be5d.gif","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/9336907e206163df.gif"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/1400/cbb08a67614633.5fbd2e1661937.gif","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/40b55d20223e14fc.gif"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/1400/ec79f9104755019.5f984b849b2ab.gif","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/489bdd3ca9c98f14.gif"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/1400/ec8f0f104755019.5f9bd4472aa2c.gif","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/87db4e70311ed748.gif"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/1400/fa5e1067614633.5fbd2e16632b3.gif","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/86d4a31151121f93.gif"],
  // disp
  ["https://mir-s3-cdn-cf.behance.net/project_modules/disp/0574ad104755019.5f9b921fe3217.gif","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/2144000a913e01e7.gif"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/disp/0f3505112053013.600da2b393c42.gif","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/886cdb0e0cd67309.gif"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/disp/0f653a104755019.5f9b921cd33d1.gif","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/a975e03f7df629c5.gif"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/disp/1116fb112053013.600ebd84edcfe.gif","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/caba6aa6de22d63a.gif"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/disp/15baae104755019.5f9b921fe37b4.gif","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/2d794a10f09767a4.gif"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/disp/163211104755019.5f9b921bc2cc5.gif","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/170b6a9f29b47ea0.gif"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/disp/3418e8104755019.5f9b922077c04.gif","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/7526707eef2b0021.gif"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/disp/38cf7765344203.5af1516cee55a.gif","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/7d04b1d659a5d728.gif"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/disp/39eba165344203.5af1516cedec1.gif","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/c5486f3565bac197.gif"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/disp/3aa341104755019.5f9b922078555.gif","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/19365834450c09f0.gif"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/disp/66f7a565344203.5f702ed174490.gif","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/1780e345d1845238.gif"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/disp/70df63112053013.600da2b2b1531.gif","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/542c64f1e55c771c.gif"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/disp/730148112053013.600da2b2611dc.gif","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/6a566ab48bcb4809.gif"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/disp/733bd8104755019.5f9b921cd3a91.gif","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/041855753462bed2.gif"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/disp/888d70112053013.600da2b1df5ce.gif","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/728e2b4bd0ee1812.gif"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/disp/a6c9c2112053013.600ebd8548772.gif","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/4d89acbb15424e64.gif"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/disp/ae50e5112053013.600da2b30c391.gif","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/8d6c7382a60e4c7b.gif"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/disp/aea1f4112053013.600ebd84966f1.gif","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/44a5819fe5bf0ab6.gif"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/disp/c33317104755019.5f9b95e8bad86.gif","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/8a3bbd468ad25036.gif"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/disp/c9e1e4112053013.600ebd85c8f67.gif","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/71b3c5bb1d896037.gif"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/disp/d4993f104755019.5f9b921a298ee.gif","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/21fda68d76487f85.gif"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/disp/daa6bf104755019.5f9b95e85c1b2.gif","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/da0d0be19681bb8d.gif"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/disp/e0a3a6104755019.5f9acc0570867.gif","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/24aed1fa087e7082.gif"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/disp/f25a0765344203.5f702ed173f7f.gif","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/d266f5fd986bf2fd.gif"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/disp/f4e5a3104755019.5f9b921bc26b7.gif","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/200dcf272e654ef0.gif"],
  // hd
  ["https://mir-s3-cdn-cf.behance.net/project_modules/hd/04b04567614633.5fbd2e1665e99.gif","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/6b2ac3972fe981e8.gif"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/hd/294bc567614633.5fbd2e1665952.gif","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/7741aa930b977aea.gif"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/hd/47661867614633.5fbd2e1665283.gif","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/65513b96d4eeb59d.gif"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/hd/a7aa3067614633.5fbd2e166479a.gif","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/178fd1acf0fb915b.gif"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/hd/ec138c67614633.5fbd2e16663c5.gif","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/3fd13caec1338033.gif"],
  // max_1200
  ["https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/2bd1c365344203.5f702ed1b2566.png","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/landing/behance/87a63a36f47dc948.png"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/368e6d65344203.5af1516cef172.gif","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/06d1ed2ad3e442e2.gif"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/64f49f65344203.5af1516ceea6b.gif","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/252ad2550b085a28.gif"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/81246f65344203.5af1516c10977.gif","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/11499d8ec89b2a22.gif"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/9eb29065344203.5af1516cef83f.gif","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/97b85bf54d89eadc.gif"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/b9682465344203.5af1516c11e2e.gif","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/b30ab9f5655e133c.gif"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/c590be65344203.5af1516c115dc.gif","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/tdgames-landingpage/landing/behance/d9c2593a3acbbfb0.gif"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/c93a5b67614633.5fbd2e1664ce9.png","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/landing/behance/117d6d679a7a6ef1.png"],
  ["https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/d4a408104755019.5f9b97c0a0f8a.png","https://pub-642ba1c41caae845c62667d7810b4eb9.r2.dev/landing/behance/91159095f0bb0ce0.png"],
]);

console.log(`\n📦 Mapping loaded: ${DB_MAP.size} entries\n`);

// ── Process files ─────────────────────────────────────────────────────────────
const files = globSync("src/app/portfolio/*/project-data.ts", { nodir: true });
const targets = files.filter(f => {
  const s = fs.readFileSync ? null : null; // just signal async below
  return true; // filter async below
});

let totalReplaced = 0;
let totalExpanded = 0; // expanded to full Behance URL (no R2 mapping)
let totalFiles = 0;

for (const file of files) {
  let src = await fs.readFile(file, "utf8");
  if (!src.includes("mir-s3-cdn-cf")) continue;

  const lines = src.split("\n");

  // Parse const declarations
  const consts = new Map();
  for (const line of lines) {
    const m = line.match(/^const\s+(\w+)\s*=\s*"(https:\/\/mir-s3-cdn-cf[^"]+)"/);
    if (m) consts.set(m[1], m[2]);
  }
  if (consts.size === 0) continue;

  let next = src;
  let replaced = 0;
  let expanded = 0;

  for (const [name, base] of consts) {
    const pattern = new RegExp(`\`\\$\\{${name}\\}([^\`]+)\``, "g");
    next = next.replace(pattern, (_, suffix) => {
      const fullUrl = base + suffix;
      const r2 = DB_MAP.get(fullUrl);
      if (r2) {
        replaced++;
        return `"${r2}"`;
      } else {
        // Expand to full Behance URL — no mapping yet, needs separate R2 migration
        expanded++;
        return `"${fullUrl}"`;
      }
    });
  }

  // Remove const lines that are no longer referenced as template bases
  const usedConsts = new Set(
    [...consts.keys()].filter(name =>
      new RegExp(`\\$\\{${name}\\}`).test(next)
    )
  );
  next = next.split("\n").filter(line => {
    const m = line.match(/^const\s+(\w+)\s*=\s*"(https:\/\/mir-s3-cdn-cf[^"]+)"/);
    return !m || usedConsts.has(m[1]);
  }).join("\n");

  const changed = next !== src;
  const label = file.replace("src/app/portfolio/", "").replace("/project-data.ts", "");
  console.log(
    `${changed ? "✏️ " : "✅"} ${label}\n` +
    `   → ${replaced} → R2, ${expanded} expanded (no mapping), consts left: ${usedConsts.size}`
  );

  totalReplaced += replaced;
  totalExpanded += expanded;
  if (changed) totalFiles++;

  if (APPLY && changed) {
    await fs.writeFile(file, next, "utf8");
  }
}

console.log(`\n${"─".repeat(55)}`);
console.log(`✅ Replaced → R2 : ${totalReplaced}`);
console.log(`⚠️  Expanded (Behance, no R2 yet): ${totalExpanded}`);
console.log(`📝 Files changed : ${totalFiles}`);
if (!APPLY) console.log(`\n▶  Re-run with --apply to write changes`);
else console.log(`\n✅ Files written!`);
