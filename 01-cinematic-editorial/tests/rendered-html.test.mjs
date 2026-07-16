import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html", host: "localhost" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the finished trip experience", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /California Anniversary Road Trip/i);
  assert.match(html, /From the Golden Gate/i);
  assert.match(html, /17 days/i);
  assert.match(html, /10 bases/i);
  assert.match(html, /california-master-itinerary\.xlsx/i);
  assert.match(html, /og\.png/i);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("keeps workbook invariants and required assets", async () => {
  const [dataText, routeFiles] = await Promise.all([
    readFile(new URL("../app/itinerary-data.json", import.meta.url), "utf8"),
    readdir(new URL("../public/routes/", import.meta.url)),
  ]);
  const data = JSON.parse(dataText);
  const uniqueStops = new Set(data.days.map((day) => day.stop));
  const totalNights = data.days.reduce((total, day) => total + day.nights, 0);

  assert.equal(data.days.length, 17);
  assert.equal(uniqueStops.size, 10);
  assert.equal(totalNights, 16);
  assert.equal(data.days.filter((day) => day.map).length, 10);
  assert.equal(data.budget.length, 6);
  assert.equal(data.rental.vehicles.length, 15);
  assert.equal(data.flights.options.length, 12);
  assert.equal(data.planningGates.length, 9);
  assert.equal(routeFiles.filter((file) => file.endsWith(".jpg")).length, 10);

  await Promise.all([
    access(new URL("../public/overview-poster.png", import.meta.url)),
    access(new URL("../public/og.png", import.meta.url)),
    access(new URL("../public/california-master-itinerary.xlsx", import.meta.url)),
  ]);
});
