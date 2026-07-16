"use client";
/* eslint-disable @next/next/no-img-element -- Local, dimensioned assets avoid Vinext's broken image-optimizer path in preview. */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Map as LeafletMap, Marker, Polyline } from "leaflet";
import {
  BedDouble,
  CalendarDays,
  CarFront,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Compass,
  ExternalLink,
  Heart,
  Hotel,
  Info,
  Map,
  Moon,
  Mountain,
  Navigation,
  Pause,
  Plane,
  Play,
  Printer,
  Route,
  Search,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Sun,
  Users,
  X,
} from "lucide-react";
import tripData from "./itinerary-data.json";

type TripDay = (typeof tripData.days)[number];
type Tone = TripDay["tone"];
type FilterKey = "all" | "drive" | "coast" | "parks" | "culture" | "milestones";
type LodgingTier = "Budget" | "Comfort" | "Premium";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  timeZone: "America/Chicago",
});

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const preciseCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const toneLabels: Record<Tone, string> = {
  city: "City & culture",
  coast: "Pacific coast",
  park: "National park",
  celebration: "Anniversary",
  rest: "Rest day",
  desert: "Desert",
  departure: "Flight home",
};

const filters: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "All 17 days" },
  { key: "drive", label: "Drive days" },
  { key: "coast", label: "Coast" },
  { key: "parks", label: "Parks & desert" },
  { key: "culture", label: "City & culture" },
  { key: "milestones", label: "Milestones" },
];

const routeImageDays = new Set([3, 5, 7, 8, 10, 12, 14, 15, 16, 17]);

function formatDate(date: string) {
  return dateFormatter.format(new Date(`${date}T12:00:00`));
}

function getCountdown() {
  const start = new Date("2026-12-10T00:00:00-06:00").getTime();
  const distance = Math.max(0, start - Date.now());
  return {
    days: Math.floor(distance / 86_400_000),
    hours: Math.floor((distance % 86_400_000) / 3_600_000),
  };
}

function getHighlights(day: TripDay) {
  return day.sections.flatMap((section) => section.items).slice(0, 3);
}

function displayText(value: string) {
  return value
    .replace(/[\u2600-\u27BF\u{1F300}-\u{1FAFF}\uFE0F]/gu, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

const artworkDayByDay: Record<number, number> = {
  1: 3,
  2: 3,
  3: 3,
  4: 3,
  5: 5,
  6: 5,
  7: 7,
  8: 8,
  9: 8,
  10: 10,
  11: 10,
  12: 12,
  13: 12,
  14: 14,
  15: 15,
  16: 16,
  17: 17,
};

function getResourceCategory(label: string, url: string) {
  const text = `${label} ${url}`.toLowerCase();
  if (text.includes("book") || text.includes("ticket") || text.includes("tour")) return "Reservations";
  if (text.includes("condition") || text.includes("tide") || text.includes("chain") || text.includes("quickmap") || text.includes("safety")) return "Road & weather";
  if (text.includes("nps.gov") || text.includes("parks.ca.gov")) return "Parks";
  if (text.includes("rental") || text.includes("yarts") || text.includes("sfmta")) return "Transportation";
  return "Culture";
}

function SectionHeading({ eyebrow, title, copy }: { eyebrow: string; title: string; copy?: string }) {
  return (
    <div className="section-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {copy ? <p className="section-copy">{copy}</p> : null}
    </div>
  );
}

function RouteMap({ activeDay, onSelect }: { activeDay: number; onSelect: (day: number) => void }) {
  const mapNode = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<LeafletMap | null>(null);
  const markers = useRef<Array<{ stop: number; marker: Marker }>>([]);
  const progressLine = useRef<Polyline | null>(null);

  const stops = useMemo(() => {
    const seen = new Set<number>();
    return tripData.days.filter((day) => {
      if (seen.has(day.stop)) return false;
      seen.add(day.stop);
      return true;
    });
  }, []);

  useEffect(() => {
    if (!mapNode.current || mapInstance.current) return;
    let cancelled = false;

    void import("leaflet").then((L) => {
      if (cancelled || !mapNode.current) return;
      const map = L.map(mapNode.current, {
        zoomControl: false,
        scrollWheelZoom: false,
        attributionControl: true,
      });
      mapInstance.current = map;
      L.control.zoom({ position: "bottomleft" }).addTo(map);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: "&copy; OpenStreetMap &copy; CARTO",
        subdomains: "abcd",
        maxZoom: 20,
      }).addTo(map);

      const points = stops.map((day) => [day.coordinates[1], day.coordinates[0]] as [number, number]);
      L.polyline(points, { color: "#000d1f", weight: 13, opacity: 0.72, lineCap: "round" }).addTo(map);
      L.polyline(points, { color: "#1587ff", weight: 8, opacity: 0.28, lineCap: "round" }).addTo(map);
      L.polyline(points, { color: "#35a0ff", weight: 3.5, opacity: 0.9, lineCap: "round" }).addTo(map);
      progressLine.current = L.polyline([points[0]], { color: "#79c7ff", weight: 4.5, opacity: 1, lineCap: "round" }).addTo(map);

      markers.current = stops.map((day) => {
        const marker = L.marker([day.coordinates[1], day.coordinates[0]], {
          keyboard: true,
          title: `${day.stop}. ${day.base}`,
          icon: L.divIcon({
            className: "route-marker-shell",
            html: `<span class="route-marker"><span>${day.day}</span></span>`,
            iconSize: [38, 38],
            iconAnchor: [19, 19],
          }),
        }).addTo(map);
        marker.bindTooltip(day.base, {
          className: "atlas-stop-label",
          direction: "right",
          offset: [15, 0],
          opacity: 1,
          permanent: true,
        });
        marker.on("click", () => onSelect(day.day));
        return { stop: day.stop, marker };
      });

      map.fitBounds(L.latLngBounds(points), { paddingTopLeft: [72, 82], paddingBottomRight: [90, 180] });
    });

    return () => {
      cancelled = true;
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, [onSelect, stops]);

  useEffect(() => {
    const active = tripData.days.find((day) => day.day === activeDay);
    if (!active) return;
    markers.current.forEach(({ stop, marker }) => marker.getElement()?.classList.toggle("is-active", stop === active.stop));
    const selectedStops = stops.filter((stop) => stop.stop <= active.stop);
    progressLine.current?.setLatLngs(selectedStops.map((stop) => [stop.coordinates[1], stop.coordinates[0]]));
    const activeMarker = markers.current.find((entry) => entry.stop === active.stop)?.marker;
    if (activeMarker && mapInstance.current) {
      mapInstance.current.panTo(activeMarker.getLatLng(), { animate: true, duration: 0.55 });
    }
  }, [activeDay, stops]);

  return <div ref={mapNode} className="route-map" role="region" aria-label="Interactive road-trip map" />;
}

export default function ItineraryExperience() {
  const [activeDay, setActiveDay] = useState(7);
  const [expandedDay, setExpandedDay] = useState(7);
  const [storyPlaying, setStoryPlaying] = useState(false);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [lodgingTier, setLodgingTier] = useState<LodgingTier>("Budget");
  const [budgetMode, setBudgetMode] = useState<"low" | "high">("low");
  const [logisticsTab, setLogisticsTab] = useState<"flights" | "suv">("flights");
  const [rentalVendor, setRentalVendor] = useState("Enterprise");
  const [resourceSearch, setResourceSearch] = useState("");
  const [resourceCategory, setResourceCategory] = useState("All");
  const [readyChecks, setReadyChecks] = useState<string[]>([]);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [countdown, setCountdown] = useState(getCountdown());
  const [scrollProgress, setScrollProgress] = useState(0);
  const [toast, setToast] = useState("");

  const active = tripData.days[activeDay - 1];
  const stops = useMemo(() => {
    const seen = new Set<number>();
    return tripData.days.filter((day) => {
      if (seen.has(day.stop)) return false;
      seen.add(day.stop);
      return true;
    });
  }, []);

  const lodgingDays = useMemo(() => tripData.days.filter((day) => day.lodgings.length > 0), []);
  const resources = useMemo(() => {
    const itineraryResources = tripData.days.flatMap((day) => day.resources.map((resource) => ({ ...resource, day: day.day, type: getResourceCategory(resource.label, resource.url) })));
    const mapResources = tripData.days.filter((day) => day.map).map((day) => ({ label: `Google Maps · Day ${day.day} route`, url: day.map!.url, city: day.city, day: day.day, type: "Google Maps" }));
    const flightResources = tripData.flights.links.map((link) => ({ label: link.label, url: link.url, city: "Flight search", day: 0, type: "Flights" }));
    return [...itineraryResources, ...mapResources, ...flightResources];
  }, []);

  const selectDay = useCallback((day: number, scroll = false) => {
    setActiveDay(day);
    if (scroll) {
      setExpandedDay(day);
      requestAnimationFrame(() => document.getElementById(`day-${day}`)?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const savedTheme = window.localStorage.getItem("california-trip-theme");
      const nextTheme = savedTheme === "dark" ? "dark" : "light";
      setTheme(nextTheme);
      document.documentElement.dataset.theme = nextTheme;
      const savedChecks = window.localStorage.getItem("california-trip-checks");
      if (savedChecks) {
        try {
          setReadyChecks(JSON.parse(savedChecks));
        } catch {
          window.localStorage.removeItem("california-trip-checks");
        }
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("california-trip-theme", theme);
  }, [theme]);

  useEffect(() => {
    const timer = window.setInterval(() => setCountdown(getCountdown()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!storyPlaying) return;
    const timer = window.setInterval(() => {
      setActiveDay((current) => (current >= 17 ? 1 : current + 1));
    }, 4_800);
    return () => window.clearInterval(timer);
  }, [storyPlaying]);

  useEffect(() => {
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(max > 0 ? (window.scrollY / max) * 100 : 0);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.key === "ArrowRight") setActiveDay((day) => Math.min(17, day + 1));
      if (event.key === "ArrowLeft") setActiveDay((day) => Math.max(1, day - 1));
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filteredDays = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tripData.days.filter((day) => {
      const categoryMatch =
        filter === "all" ||
        (filter === "drive" && day.isDrivingDay) ||
        (filter === "coast" && day.categories.includes("coast")) ||
        (filter === "parks" && (day.categories.includes("park") || day.categories.includes("desert"))) ||
        (filter === "culture" && (day.categories.includes("city") || day.categories.includes("culture"))) ||
        (filter === "milestones" && day.categories.some((category) => ["anniversary", "highway-1", "tide", "christmas", "christmas-eve"].includes(category)));
      if (!categoryMatch) return false;
      if (!query) return true;
      const haystack = [day.city, day.theme, day.drive, ...day.sections.flatMap((section) => [section.heading, ...section.items])].join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }, [filter, search]);

  const filteredResources = useMemo(() => {
    const query = resourceSearch.trim().toLowerCase();
    return resources.filter((resource) => {
      const categoryMatch = resourceCategory === "All" || resource.type === resourceCategory;
      const textMatch = !query || `${resource.label} ${resource.city}`.toLowerCase().includes(query);
      return categoryMatch && textMatch;
    });
  }, [resourceCategory, resourceSearch, resources]);

  const toggleCheck = (area: string) => {
    setReadyChecks((current) => {
      const next = current.includes(area) ? current.filter((item) => item !== area) : [...current, area];
      window.localStorage.setItem("california-trip-checks", JSON.stringify(next));
      return next;
    });
  };

  const shareTrip = async () => {
    const payload = { title: tripData.meta.title, text: tripData.meta.subtitle, url: window.location.href };
    try {
      if (navigator.share) await navigator.share(payload);
      else {
        await navigator.clipboard.writeText(window.location.href);
        setToast("Trip link copied");
      }
    } catch {
      // A dismissed native share sheet needs no follow-up.
    }
  };

  const primaryGates = ["Yosemite in December", "Big Sur / Highway 1", "Cabrillo tidepools"].map((name) => tripData.planningGates.find((gate) => gate.area === name)!).filter(Boolean);
  const selectedRentalVehicles = tripData.rental.vehicles.filter((vehicle) => vehicle.vendor === rentalVendor);
  const totalBudget = budgetMode === "low" ? tripData.meta.budgetLow : tripData.meta.budgetHigh;

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">Skip to trip</a>
      <div className="scroll-progress" style={{ width: `${scrollProgress}%` }} />

      <main id="main-content">
        <section className="atlas-stage" id="top" aria-label="Interactive California road atlas">
          <aside className="atlas-sidebar">
            <a className="atlas-brand" href="#top" aria-label="California road trip home">
              <b>CALIFORNIA / 26</b>
              <small>17-day road trip</small>
            </a>
            <nav aria-label="Trip sections">
              <a className="is-active" href="#top"><Route size={23} /><span>Route</span></a>
              <a href="#itinerary"><CalendarDays size={23} /><span>Itinerary</span></a>
              <a href="#stays"><Hotel size={23} /><span>Stays</span></a>
              <a href="#checks"><ShieldCheck size={23} /><span>Trip checks</span></a>
              <a href="#budget"><CircleDollarSign size={23} /><span>Budget</span></a>
              <a href="#directory"><Info size={23} /><span>Notes</span></a>
            </nav>
            <div className="atlas-sidebar-tools" aria-label="Trip utilities">
              <button type="button" onClick={() => setTheme(theme === "light" ? "dark" : "light")} aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}>
                {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
              </button>
              <button type="button" onClick={shareTrip} aria-label="Share trip"><Share2 size={18} /></button>
              <button className="print-button" type="button" onClick={() => window.print()} aria-label="Print itinerary"><Printer size={18} /></button>
            </div>
            <div className="atlas-sidebar-meta">
              <span>JULY 12, 2026</span>
              <small>Trip planning</small>
              <em>{countdown.days} days to departure</em>
            </div>
          </aside>

          <div className="atlas-map-shell">
            <div className="atlas-map-heading">
              <span>THE ROAD ATLAS</span>
              <b>{tripData.meta.mappedMiles.toLocaleString()} mapped miles · {stops.length} overnight bases</b>
            </div>
            <RouteMap activeDay={activeDay} onSelect={selectDay} />
            <div className="atlas-map-facts" aria-label="Trip facts">
              <span><Mountain size={16} /> {tripData.meta.nationalParks} national parks</span>
              <span><Heart size={16} /> Dec 15 anniversary</span>
              <span><Users size={16} /> {tripData.meta.travelers} travelers</span>
            </div>
          </div>

          <article className="atlas-narrative" aria-live="polite">
            <div className="atlas-narrative-topline">
              <span>Day {active.day} of {tripData.meta.days}</span>
              <button type="button" onClick={() => setStoryPlaying(!storyPlaying)} aria-pressed={storyPlaying}>
                {storyPlaying ? <Pause size={15} /> : <Play size={15} />}
                {storyPlaying ? "Pause" : "Play route"}
              </button>
            </div>
            <h1>{displayText(active.city)}</h1>
            <p className="atlas-day-meta">{formatDate(active.date)} · {active.nights ? `${active.nights} night${active.nights > 1 ? "s" : ""}` : `sleep in ${active.base}`}</p>
            <figure className="atlas-story-image">
              <img src={`/routes/day-${artworkDayByDay[active.day]}.jpg`} alt={`Workbook route view for ${displayText(active.city)}`} width="1728" height="873" />
              <figcaption>Workbook route view · {active.base}</figcaption>
            </figure>
            <div className="atlas-story-copy">
              <span>{toneLabels[active.tone]}</span>
              <h2>{displayText(active.theme)}</h2>
              <ul>
                {getHighlights(active).map((highlight) => <li key={highlight}><Check size={14} />{displayText(highlight)}</li>)}
              </ul>
            </div>
            <div className="atlas-drive-line">
              {active.isDrivingDay ? <CarFront size={18} /> : <BedDouble size={18} />}
              <span>{active.isDrivingDay ? active.drive : `No major transfer · sleep in ${active.base}`}</span>
            </div>
            <div className="atlas-story-links">
              {active.map ? <a href={active.map.url} target="_blank" rel="noreferrer"><Navigation size={16} /> Open in Google Maps <ExternalLink size={13} /></a> : null}
              <button type="button" onClick={() => selectDay(active.day, true)}>Open full day <ChevronDown size={16} /></button>
            </div>
            <div className="atlas-story-nav">
              <button type="button" onClick={() => setActiveDay(Math.max(1, activeDay - 1))} disabled={activeDay === 1}><ChevronLeft size={17} /> Previous</button>
              <button type="button" onClick={() => setActiveDay(Math.min(17, activeDay + 1))} disabled={activeDay === 17}>Next <ChevronRight size={17} /></button>
            </div>
          </article>

          <div className="atlas-timeline" aria-label="Seventeen-day trip timeline">
            <button className="atlas-timeline-arrow" type="button" onClick={() => setActiveDay(Math.max(1, activeDay - 1))} disabled={activeDay === 1} aria-label="Previous day"><ChevronLeft size={23} /></button>
            <div className="atlas-timeline-track">
              {tripData.days.map((day) => (
                <button type="button" className={active.day === day.day ? "is-active" : active.day > day.day ? "is-past" : ""} key={day.day} onClick={() => selectDay(day.day)} aria-pressed={active.day === day.day}>
                  <span>{day.day}</span>
                  <small>{formatDate(day.date).replace(/^[^,]+,\s*/, "")}</small>
                  <b>{day.base}</b>
                </button>
              ))}
            </div>
            <button className="atlas-timeline-arrow" type="button" onClick={() => setActiveDay(Math.min(17, activeDay + 1))} disabled={activeDay === 17} aria-label="Next day"><ChevronRight size={23} /></button>
            <div className="atlas-timeline-range"><i />{tripData.meta.dateRange}<i /></div>
          </div>
        </section>

        <section className="itinerary-section section-pad" id="itinerary">
          <SectionHeading eyebrow="02 · Day by day" title="The full itinerary, without the spreadsheet feeling." copy="Filter the trip, search any activity, and open a day for the exact morning-to-evening plan from the workbook." />
          <div className="itinerary-tools">
            <div className="filter-row" role="group" aria-label="Filter itinerary">
              {filters.map((item) => <button key={item.key} type="button" className={filter === item.key ? "is-active" : ""} onClick={() => setFilter(item.key)} aria-pressed={filter === item.key}>{item.label}</button>)}
            </div>
            <label className="search-field"><Search size={17} /><span className="sr-only">Search itinerary</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search places, activities, times…" />{search ? <button type="button" onClick={() => setSearch("")} aria-label="Clear search"><X size={15} /></button> : null}</label>
          </div>
          <p className="result-count">Showing {filteredDays.length} of 17 days</p>
          <div className="day-list">
            {filteredDays.map((day) => {
              const isExpanded = expandedDay === day.day;
              return (
                <article className={`day-card tone-${day.tone} ${isExpanded ? "is-expanded" : ""}`} id={`day-${day.day}`} key={day.day}>
                  <button className="day-summary" type="button" onClick={() => { setExpandedDay(isExpanded ? 0 : day.day); setActiveDay(day.day); }} aria-expanded={isExpanded} aria-controls={`day-body-${day.day}`}>
                    <span className="day-number">{String(day.day).padStart(2, "0")}</span>
                    <span className="day-title"><small>{formatDate(day.date)} · {toneLabels[day.tone]}</small><b>{displayText(day.city)}</b><em>{displayText(day.theme)}</em></span>
                    <span className="day-drive">{day.isDrivingDay ? <><CarFront size={17} />{day.drive}</> : <><BedDouble size={17} />No major transfer</>}</span>
                    <ChevronDown className="expand-icon" size={21} />
                  </button>
                  <div className="day-body" id={`day-body-${day.day}`}>
                    {routeImageDays.has(day.day) ? <figure className="route-shot"><img src={`/routes/day-${day.day}.jpg`} alt={`Google Maps route preview for day ${day.day}`} width="1728" height="873" /><figcaption>{day.map?.note ?? "Workbook route snapshot"}</figcaption></figure> : null}
                    <div className="plan-grid">
                      {day.sections.map((section) => <div className="plan-period" key={`${day.day}-${section.heading}`}><h4>{displayText(section.heading)}</h4><ul>{section.items.map((item) => <li key={item}>{displayText(item)}</li>)}</ul></div>)}
                    </div>
                    <div className="day-footer">
                      <div><span>Sleep</span><b>{day.nights ? `${day.base} · ${day.nights} night${day.nights > 1 ? "s" : ""}` : day.base}</b></div>
                      <div><span>Resources</span><div className="inline-links">{day.resources.length ? day.resources.map((resource) => <a href={resource.url} target="_blank" rel="noreferrer" key={resource.url}>{resource.label}<ExternalLink size={12} /></a>) : <small>No advance link required</small>}</div></div>
                      {day.map ? <a className="button compact" href={day.map.url} target="_blank" rel="noreferrer"><Map size={16} /> Google Maps</a> : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="stays-section section-pad" id="stays">
          <SectionHeading eyebrow="03 · Where we sleep" title="Ten bases, three comfort levels." copy="Browse the dated lodging options saved in the workbook. Budget-tier picks total $2,060.94 for all 16 nights; every price remains a planning snapshot." />
          <div className="segmented" role="group" aria-label="Lodging tier">
            {(["Budget", "Comfort", "Premium"] as LodgingTier[]).map((tier) => <button type="button" className={lodgingTier === tier ? "is-active" : ""} key={tier} onClick={() => setLodgingTier(tier)} aria-pressed={lodgingTier === tier}>{tier}{tier === "Budget" ? " · workbook plan" : ""}</button>)}
          </div>
          <div className="stay-grid">
            {lodgingDays.map((day) => {
              const stay = day.lodgings.find((option) => option.tier === lodgingTier) ?? day.lodgings[0];
              return (
                <article className="stay-card" key={day.day}>
                  <div className="stay-top"><span className="stop-index">{day.stop}</span><div><small>{formatDate(day.date)} · {day.nights} night{day.nights > 1 ? "s" : ""}</small><h3>{day.base}</h3></div></div>
                  <div className="stay-choice"><span>{stay.tier}</span><b>{stay.name}</b><p>{stay.detail}</p></div>
                  <div className="stay-footer"><small>{day.platform}</small>{stay.url ? <a href={stay.url} target="_blank" rel="noreferrer">Check this option <ExternalLink size={14} /></a> : <span>Recheck availability</span>}</div>
                </article>
              );
            })}
          </div>
          <div className="snapshot-note"><Info size={18} /><p><b>Before paying:</b> confirm the property identity, final taxes, parking, cancellation rules and live inventory. The Ahwahnee had no full-stay inventory when checked; “Premium” is a browsing tier, not a guaranteed upgrade.</p></div>
        </section>

        <section className="budget-section section-pad" id="budget">
          <div className="budget-intro">
            <SectionHeading eyebrow="04 · Budget" title="A realistic range for two." copy="Switch between the lean plan and the higher planning allowance. Lodging is tied to the exact budget picks; everything else should be updated as bookings lock in." />
            <div className="budget-total"><span>{budgetMode === "low" ? "Lean plan" : "Higher allowance"}</span><strong>{currency.format(totalBudget)}</strong><small>for 2 travelers · 17 days</small></div>
          </div>
          <div className="segmented budget-toggle" role="group" aria-label="Budget scenario"><button type="button" className={budgetMode === "low" ? "is-active" : ""} onClick={() => setBudgetMode("low")}>Lean</button><button type="button" className={budgetMode === "high" ? "is-active" : ""} onClick={() => setBudgetMode("high")}>Higher allowance</button></div>
          <div className="budget-grid">
            {tripData.budget.map((item) => {
              const value = budgetMode === "low" ? item.low : item.high;
              const width = Math.max(6, (value / 3800) * 100);
              return <article className="budget-row" key={item.category}><div><b>{item.category}</b><strong>{preciseCurrency.format(value)}</strong></div><div className="budget-track"><span style={{ width: `${width}%` }} /></div><p>{item.notes}</p></article>;
            })}
          </div>
          <div className="budget-caveat"><CircleDollarSign size={19} /><span>Excludes optional rental protection, fuel/tolls beyond the allowance, and still-TBD hotel parking.</span></div>
        </section>

        <section className="book-section section-pad" id="book">
          <SectionHeading eyebrow="05 · Flights & SUV" title="The two bookings that shape every other day." copy="The flight choice protects the first San Francisco day. The vehicle choice protects Yosemite and the long desert transfers." />
          <div className="logistics-tabs" role="tablist" aria-label="Booking options">
            <button type="button" role="tab" aria-selected={logisticsTab === "flights"} className={logisticsTab === "flights" ? "is-active" : ""} onClick={() => setLogisticsTab("flights")}><Plane size={18} /> Flights</button>
            <button type="button" role="tab" aria-selected={logisticsTab === "suv"} className={logisticsTab === "suv" ? "is-active" : ""} onClick={() => setLogisticsTab("suv")}><CarFront size={18} /> Airport SUV</button>
          </div>
          {logisticsTab === "flights" ? (
            <div className="flight-panel" role="tabpanel">
              <div className="booking-hero"><div className="booking-icon"><Plane size={26} /></div><div><span>WORKBOOK PICK</span><h3>{tripData.flights.pick}</h3><p>{tripData.flights.realisticTotal}</p></div></div>
              <div className="flight-columns">
                {["Dec 10 · CHI→SFO", "Dec 26 · LAS→CHI"].map((leg) => <div key={leg}><h3>{leg.includes("Dec 10") ? "Protect the first day" : "Choose the final morning"}</h3><p className="column-note">{leg.includes("Dec 10") ? "The 6:00 AM United flight preserves the Golden Gate sunset window." : "The cheapest option means leaving the Strip around 3:45 AM."}</p><div className="option-stack">{tripData.flights.options.filter((flight) => flight.leg === leg).map((flight) => <article className={flight.fare.startsWith("United") && flight.schedule.startsWith(leg.includes("Dec 10") ? "6:00" : "7:00") ? "is-pick" : ""} key={`${flight.platform}-${flight.fare}-${flight.schedule}`}><div><span>{flight.platform} · #{flight.rank}</span><b>{flight.fare}</b><small>{flight.route} · {flight.schedule} · {flight.duration}</small></div><strong>{preciseCurrency.format(flight.total)}</strong><p>{flight.baggage}</p></article>)}</div></div>)}
              </div>
              <div className="booking-links">{tripData.flights.links.map((link) => <a className="button secondary compact" href={link.url} target="_blank" rel="noreferrer" key={link.url}>{link.label.replace(/^\d · /, "")} <ExternalLink size={14} /></a>)}</div>
            </div>
          ) : (
            <div className="rental-panel" role="tabpanel">
              <div className="booking-hero rental-hero"><div className="booking-icon"><CarFront size={26} /></div><div><span>BEST FIT · SFO AIRPORT → LAS AIRPORT</span><h3>{tripData.rental.bestFit}</h3><p>Dec 12, 8:00 AM → Dec 26, 2:00 PM · {tripData.rental.guidance}</p></div></div>
              <div className="rental-layout">
                <div><h3>Choose a trusted counter</h3><div className="vendor-tabs" role="group" aria-label="Rental vendor">{tripData.rental.vendors.map((vendor) => <button type="button" className={rentalVendor === vendor.vendor ? "is-active" : ""} onClick={() => setRentalVendor(vendor.vendor)} key={vendor.vendor} aria-pressed={rentalVendor === vendor.vendor}>{vendor.vendor}</button>)}</div><div className="vehicle-stack">{selectedRentalVehicles.map((vehicle) => <article key={`${vehicle.vendor}-${vehicle.rank}`}><span>Choice {vehicle.rank}</span><h4>{vehicle.vehicle}</h4><p>{vehicle.take}</p><div><b>{vehicle.cost}</b><small>{vehicle.awd}</small><a href={vehicle.url} target="_blank" rel="noreferrer">Quote {vehicle.vendor}<ExternalLink size={13} /></a></div></article>)}</div></div>
                <aside className="pickup-checklist"><h3><ShieldCheck size={20} /> Pickup checklist</h3><p>More important than the badge on the hood.</p><ol>{tripData.rental.checklist.map((item) => <li key={item}>{item}</li>)}</ol></aside>
              </div>
            </div>
          )}
        </section>

        <section className="checks-section section-pad" id="checks">
          <SectionHeading eyebrow="06 · Trip checks" title="Three decisions protect the whole journey." copy="Mark each gate ready as you verify it. Your checks are saved only on this device; they do not change the workbook or make a reservation." />
          <div className="gate-grid">
            {primaryGates.map((gate, index) => {
              const checked = readyChecks.includes(gate.area);
              return <article className={checked ? "is-ready" : ""} key={gate.area}><div className="gate-number">0{index + 1}</div><span>{gate.decision}</span><h3>{gate.area}</h3><p>{gate.guardrail}</p><small><Clock3 size={14} /> {gate.timing}</small><div className="gate-actions"><button type="button" onClick={() => toggleCheck(gate.area)} aria-pressed={checked}>{checked ? <CheckCircle2 size={18} /> : <ShieldAlert size={18} />}{checked ? "Ready" : "Mark ready"}</button><a href={gate.url} target="_blank" rel="noreferrer">Official check <ExternalLink size={14} /></a></div></article>;
            })}
          </div>
          <div className="secondary-gates">
            {tripData.planningGates.filter((gate) => !primaryGates.some((primary) => primary.area === gate.area)).map((gate) => <label key={gate.area}><input type="checkbox" checked={readyChecks.includes(gate.area)} onChange={() => toggleCheck(gate.area)} /><span><b>{gate.area}</b><small>{gate.guardrail}</small></span></label>)}
          </div>
        </section>

        <section className="directory-section section-pad" id="directory">
          <SectionHeading eyebrow="07 · Booking & conditions directory" title="Every useful link, in one place." copy="Search the workbook’s activity, road-condition, park, Google Maps and flight-search links without hunting through cells." />
          <div className="directory-tools">
            <label className="search-field"><Search size={17} /><span className="sr-only">Search links</span><input value={resourceSearch} onChange={(event) => setResourceSearch(event.target.value)} placeholder="Search links…" />{resourceSearch ? <button type="button" onClick={() => setResourceSearch("")} aria-label="Clear link search"><X size={15} /></button> : null}</label>
            <div className="category-select"><label htmlFor="resource-category">Show</label><select id="resource-category" value={resourceCategory} onChange={(event) => setResourceCategory(event.target.value)}><option>All</option><option>Reservations</option><option>Road & weather</option><option>Parks</option><option>Transportation</option><option>Culture</option><option>Google Maps</option><option>Flights</option></select></div>
          </div>
          <div className="resource-grid">
            {filteredResources.map((resource) => <a href={resource.url} target="_blank" rel="noreferrer" key={`${resource.day}-${resource.url}`}><span>{resource.type}</span><b>{resource.label}</b><small>{resource.day ? `Day ${resource.day} · ` : ""}{resource.city}</small><ExternalLink size={16} /></a>)}
          </div>
          {!filteredResources.length ? <div className="empty-state"><Search size={22} /><p>No links match that search.</p></div> : null}
        </section>

        <section className="poster-section section-pad" aria-label="Printable trip poster">
          <div><p className="eyebrow">PRINTABLE OVERVIEW</p><h2>The whole journey on one page.</h2><p>The route poster from the Excel Overview sheet is included for sharing at home or printing before departure.</p><button className="button primary" type="button" onClick={() => window.print()}><Printer size={18} /> Print the trip</button></div>
          <img src="/overview-poster.png" alt="Static one-page California road-trip overview" width="1400" height="1190" />
        </section>
      </main>

      <footer>
        <div className="footer-brand"><span className="brand-mark"><Compass size={19} /></span><div><b>California Anniversary Road Trip</b><small>{tripData.meta.route}</small></div></div>
        <p>{tripData.meta.dataNote} Confirm live prices, conditions, baggage and cancellation terms before paying.</p>
        <div><a href="#top">Back to top</a><a href="/california-master-itinerary.xlsx" download>Download Excel</a></div>
      </footer>

      <div className="mobile-day-nav"><button type="button" onClick={() => setActiveDay(Math.max(1, activeDay - 1))} disabled={activeDay === 1} aria-label="Previous day"><ChevronLeft /></button><button type="button" onClick={() => selectDay(activeDay, true)}><span>Day {activeDay}</span><b>{active.base}</b></button><button type="button" onClick={() => setActiveDay(Math.min(17, activeDay + 1))} disabled={activeDay === 17} aria-label="Next day"><ChevronRight /></button></div>
      {toast ? <div className="toast" role="status"><CheckCircle2 size={17} />{toast}</div> : null}
    </div>
  );
}
