import fs from "fs";
const h = fs.readFileSync("tmp-upsellp9.html", "utf8");
const re = /src="(https:\/\/assets\.checkoutchamp\.com[^"]+)"/g;
const set = new Set();
let m;
while ((m = re.exec(h)) !== null) {
  const u = m[1];
  if (/\.(png|webp|jpe?g|jpeg)(\?|$)/i.test(u)) set.add(u);
}
[...set].forEach((u) => console.log(u));
