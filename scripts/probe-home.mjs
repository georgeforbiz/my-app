const res = await fetch("http://127.0.0.1:3000/");
const html = await res.text();
const scripts = [...html.matchAll(/src="(\/_next\/static\/[^"]+)"/g)].map((m) => m[1]);
console.log("status", res.status, "len", html.length, "scripts", scripts.length);
for (const s of scripts.slice(0, 10)) {
  const r = await fetch(`http://127.0.0.1:3000${s}`);
  const body = await r.text();
  console.log(r.status, s.slice(0, 90), "bytes", body.length, body.slice(0, 12));
}
