import fs from "fs";
import path from "path";

const pairs = [
  [
    "https://assets.checkoutchamp.com/Funnel/assets/images/47b52b00-26e8-470a-9fc8-bee3121f4fe5/f57bf90a-2a8c-414e-b873-ebd444a6c929/1745513835-badge.png?versionId=T3vhQH3CtVj5BEbmDY_kM_HE4JnNIQ9a",
    "upsellp9-badge.png",
  ],
  [
    "https://assets.checkoutchamp.com/40470084-d785-48df-a9f5-d696557365b2/1765974534113_Ferti_Bloom_1_.png",
    "upsellp9-product.png",
  ],
  [
    "https://assets.checkoutchamp.com/50edf561-e788-4f15-9b51-d4522e585029/1762474586407_1749631317_Untitled_design_54_.webp",
    "upsellp9-trust.webp",
  ],
];

const outDir = path.join(process.cwd(), "public", "images");
fs.mkdirSync(outDir, { recursive: true });

for (const [url, name] of pairs) {
  const dest = path.join(outDir, name);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
  console.log(name, buf.length);
}
