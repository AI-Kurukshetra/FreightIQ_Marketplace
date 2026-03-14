"use client";

import { along, length, lineString } from "@turf/turf";
import { startTransition, useEffect, useEffectEvent, useRef, useState } from "react";
import type { MapJourneyFeedItem, MapRouteJourney } from "@/lib/maps/types";

type RealtimeJourneyBoardProps = {
  title: string;
  description: string;
  initialJourneys: MapJourneyFeedItem[];
  refreshUrl: string;
  emptyTitle: string;
  emptyBody: string;
  roleLabel: "shipper" | "carrier";
  prioritizeActiveJourneys?: boolean;
};

type RouteMap = Record<string, MapRouteJourney>;
const ACTIVE_JOURNEY_STATUSES = new Set(["matched", "picked_up", "in_transit"]);

function selectVisibleJourneys(
  journeys: MapJourneyFeedItem[],
  prioritizeActiveJourneys: boolean
) {
  const normalized = Array.isArray(journeys) ? journeys : [];

  if (!prioritizeActiveJourneys) {
    return normalized.slice(0, 8);
  }

  const active = normalized.filter((journey) => ACTIVE_JOURNEY_STATUSES.has(journey.status));
  const preferred = active.length > 0 ? active : normalized;
  return preferred.slice(0, 8);
}

function getLatestTrackingLabel(journey: MapJourneyFeedItem) {
  return journey.trackingUpdates.at(-1)?.label ?? "Awaiting route updates";
}

function getProgress(journey: MapJourneyFeedItem, now: number) {
  switch (journey.status) {
    case "delivered":
      return 1;
    case "cancelled":
      return 0;
    case "matched":
      return 0.16;
    case "picked_up":
      return 0.42;
    case "in_transit": {
      const firstMove =
        journey.trackingUpdates.find((update) => update.status === "picked_up")?.timestamp ??
        journey.trackingUpdates[0]?.timestamp ??
        journey.createdAt;
      const end = journey.estimatedDelivery ?? journey.actualDelivery ?? null;

      if (!firstMove || !end) {
        return 0.7;
      }

      const startMs = new Date(firstMove).getTime();
      const endMs = new Date(end).getTime();

      if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
        return 0.7;
      }

      const ratio = (now - startMs) / (endMs - startMs);
      return Math.max(0.45, Math.min(0.95, ratio));
    }
    default:
      return 0.12;
  }
}

function computeLivePoint(route: MapRouteJourney | undefined, journey: MapJourneyFeedItem, now: number) {
  if (!route || route.routeCoordinates.length < 2) {
    return route?.origin ?? null;
  }

  const progress = getProgress(journey, now);
  const path = lineString(route.routeCoordinates);
  const routeDistance = length(path, { units: "kilometers" });
  const point = along(path, routeDistance * progress, { units: "kilometers" });

  return {
    lat: point.geometry.coordinates[1],
    lng: point.geometry.coordinates[0],
  };
}

export function RealtimeJourneyBoard({
  title,
  description,
  initialJourneys,
  refreshUrl,
  emptyTitle,
  emptyBody,
  roleLabel,
  prioritizeActiveJourneys = false,
}: RealtimeJourneyBoardProps) {
  const initialVisibleJourneys = selectVisibleJourneys(initialJourneys, prioritizeActiveJourneys);
  const [journeys, setJourneys] = useState(initialVisibleJourneys);
  const [routes, setRoutes] = useState<RouteMap>({});
  const [selectedJourneyId, setSelectedJourneyId] = useState(initialVisibleJourneys[0]?.id ?? null);
  const [clock, setClock] = useState(() => Date.now());
  const [mapReady, setMapReady] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const layerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);

  const fetchJourneys = useEffectEvent(async (signal?: AbortSignal) => {
    try {
      const response = await fetch(refreshUrl, {
        cache: "no-store",
        credentials: "include",
        signal,
      });

      if (!response.ok) {
        setRefreshError(`Live shipment refresh is unavailable right now (${response.status}).`);
        return;
      }

      const payload = (await response.json()) as { data?: MapJourneyFeedItem[] };
      const nextJourneys = selectVisibleJourneys(payload.data ?? [], prioritizeActiveJourneys);

      startTransition(() => {
        setJourneys(nextJourneys);
        setSelectedJourneyId((current) => {
          if (current && nextJourneys.some((journey) => journey.id === current)) {
            return current;
          }

          return nextJourneys[0]?.id ?? null;
        });
        setRefreshError(null);
      });
    } catch (error) {
      if (signal?.aborted) {
        return;
      }

      setRefreshError(error instanceof Error ? error.message : "Live shipment refresh failed.");
    }
  });

  useEffect(() => {
    const nextJourneys = selectVisibleJourneys(initialJourneys, prioritizeActiveJourneys);
    setJourneys(nextJourneys);
    setSelectedJourneyId((current) => {
      if (current && nextJourneys.some((journey) => journey.id === current)) {
        return current;
      }

      return nextJourneys[0]?.id ?? null;
    });
  }, [initialJourneys, prioritizeActiveJourneys]);

  useEffect(() => {
    let cancelled = false;

    import("leaflet").then((leaflet) => {
      if (cancelled || !mapElementRef.current || mapRef.current) {
        return;
      }

      leafletRef.current = leaflet;

      const map = leaflet.map(mapElementRef.current, {
        attributionControl: false,
        zoomControl: false,
        scrollWheelZoom: true,
      });

      const tileLayer = leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap contributors',
      });

      tileLayer.on("tileerror", () => {
        setMapError("Map tiles are unavailable. Check network access to OpenStreetMap.");
      });

      tileLayer.on("load", () => {
        setMapError(null);
      });

      tileLayer.addTo(map);

      leaflet.control
        .zoom({
          position: "bottomright",
        })
        .addTo(map);

      leaflet.control
        .attribution({
          position: "bottomleft",
          prefix: false,
        })
        .addAttribution("FreightIQ live network")
        .addTo(map);

      mapRef.current = map;
      layerRef.current = leaflet.layerGroup().addTo(map);
      setMapReady(true);
    });

    return () => {
      cancelled = true;
      layerRef.current?.clearLayers();
      mapRef.current?.remove();
      layerRef.current = null;
      mapRef.current = null;
      leafletRef.current = null;
      setMapReady(false);
      setMapError(null);
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current) {
      return;
    }

    const map = mapRef.current;
    const rootElement = mapElementRef.current;
    const raf = window.requestAnimationFrame(() => map.invalidateSize());
    const delayed = window.setTimeout(() => map.invalidateSize(), 300);
    const handleResize = () => map.invalidateSize();
    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            map.invalidateSize();
          })
        : null;

    if (resizeObserver && rootElement) {
      resizeObserver.observe(rootElement);
      if (rootElement.parentElement) {
        resizeObserver.observe(rootElement.parentElement);
      }
    }

    window.addEventListener("resize", handleResize);
    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(delayed);
      window.removeEventListener("resize", handleResize);
      resizeObserver?.disconnect();
    };
  }, [mapReady, selectedJourneyId, journeys.length]);

  useEffect(() => {
    const controller = new AbortController();
    fetchJourneys(controller.signal);

    const interval = window.setInterval(() => {
      const pollController = new AbortController();
      fetchJourneys(pollController.signal);

      window.setTimeout(() => {
        pollController.abort();
      }, 15000);
    }, 20000);

    return () => {
      controller.abort();
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const visibleJourneys = journeys.slice(0, 8);

    if (visibleJourneys.length === 0) {
      setRoutes({});
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const loadRoutes = async () => {
      try {
        const response = await fetch("/api/maps/routes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ journeys: visibleJourneys }),
          signal: controller.signal,
        });

        if (!response.ok || cancelled) {
          return;
        }

        const payload = (await response.json()) as { data?: MapRouteJourney[] };
        const nextRoutes = Object.fromEntries((payload.data ?? []).map((route) => [route.id, route]));

        startTransition(() => {
          setRoutes(nextRoutes);
        });
      } catch {
        if (controller.signal.aborted || cancelled) {
          return;
        }
      }
    };

    loadRoutes();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [journeys]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setClock(Date.now());
    }, 10000);

    return () => window.clearInterval(interval);
  }, []);

  const selectedJourney = journeys.find((journey) => journey.id === selectedJourneyId) ?? journeys[0] ?? null;

  useEffect(() => {
    if (!mapReady || !leafletRef.current || !mapRef.current || !layerRef.current) {
      return;
    }

    const leaflet = leafletRef.current;
    const layerGroup = layerRef.current;

    layerGroup.clearLayers();

    if (!selectedJourney) {
      mapRef.current.setView([20.5937, 78.9629], 4);
      return;
    }

    const activeRoute = routes[selectedJourney.id];
    if (!activeRoute || activeRoute.routeCoordinates.length < 2 || !activeRoute.origin || !activeRoute.destination) {
      mapRef.current.setView([20.5937, 78.9629], 4);
      return;
    }

    const latLngs = activeRoute.routeCoordinates.map(([lng, lat]) => [lat, lng] as [number, number]);
    const line = leaflet.polyline(latLngs, {
      color: selectedJourney.status === "delivered" ? "#55d977" : "#19e619",
      weight: 5,
      opacity: 0.9,
      dashArray: selectedJourney.status === "matched" ? "10 10" : undefined,
      lineCap: "round",
    }).addTo(layerGroup);

    const livePoint = computeLivePoint(activeRoute, selectedJourney, clock);
    const startIcon = leaflet.divIcon({
      className: "fi-map-pin fi-map-pin--start",
      html: '<span class="fi-map-pin__inner"></span>',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
    const endIcon = leaflet.divIcon({
      className: "fi-map-pin fi-map-pin--end",
      html: '<span class="fi-map-pin__inner"></span>',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
    const liveIcon = leaflet.divIcon({
      className: "fi-map-live-marker",
      html: '<span class="fi-map-live-marker__pulse"></span><span class="fi-map-live-marker__core"></span>',
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    });

    leaflet
      .marker([activeRoute.origin.lat, activeRoute.origin.lng], { icon: startIcon })
      .bindTooltip(`Origin: ${activeRoute.origin.address}`, { direction: "top" })
      .addTo(layerGroup);

    leaflet
      .marker([activeRoute.destination.lat, activeRoute.destination.lng], { icon: endIcon })
      .bindTooltip(`Destination: ${activeRoute.destination.address}`, { direction: "top" })
      .addTo(layerGroup);

    if (livePoint) {
      leaflet
        .marker([livePoint.lat, livePoint.lng], { icon: liveIcon })
        .bindTooltip(`${selectedJourney.loadTitle} • ${selectedJourney.status.replaceAll("_", " ")}`, {
          direction: "top",
        })
        .addTo(layerGroup);
    }

    mapRef.current.fitBounds(line.getBounds().pad(0.18));
  }, [clock, mapReady, routes, selectedJourney]);

  if (journeys.length === 0) {
    return (
      <section className="rounded-[28px] border border-[var(--brand)]/10 bg-slate-900/45 p-6">
        <div className="max-w-xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--brand)]">Live Route Map</p>
          <h3 className="mt-3 text-2xl font-bold text-white">{emptyTitle}</h3>
          <p className="mt-2 text-sm text-slate-400">{emptyBody}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[28px] border border-[var(--brand)]/10 bg-slate-900/45 p-5 shadow-[0_30px_90px_rgba(6,14,8,0.35)]">
      <div className="grid items-start gap-5 xl:grid-cols-[1.45fr_0.95fr]">
        <div className="overflow-hidden rounded-[24px] border border-white/8 bg-[#08110a]">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/8 px-5 py-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--brand)]">Live Route Map</p>
              <h3 className="mt-2 text-2xl font-bold text-white">{title}</h3>
              <p className="mt-1 text-sm text-slate-400">{description}</p>
            </div>
            <div className="rounded-full border border-[var(--brand)]/20 bg-[var(--brand)]/8 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--brand)]">
              {roleLabel} view
            </div>
          </div>

          <div className="relative h-[320px] sm:h-[420px] lg:h-[520px] overflow-hidden">
            <div className="fi-map-shell" ref={mapElementRef} />
            {selectedJourney ? (
              <div className="pointer-events-none absolute left-4 top-4 rounded-2xl border border-black/10 bg-black/45 px-4 py-3 backdrop-blur-md">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--brand)]">
                  {selectedJourney.transportMode}
                </p>
                <p className="mt-1 text-sm font-semibold text-white">{selectedJourney.loadTitle}</p>
                <p className="mt-1 text-xs text-slate-300">{getLatestTrackingLabel(selectedJourney)}</p>
              </div>
            ) : null}
            {refreshError ? (
              <div className="pointer-events-none absolute bottom-4 left-4 max-w-sm rounded-2xl border border-amber-300/20 bg-black/55 px-4 py-3 text-xs text-amber-100 backdrop-blur-md">
                {refreshError}
              </div>
            ) : null}
            {mapError ? (
              <div className="pointer-events-none absolute bottom-4 right-4 max-w-sm rounded-2xl border border-amber-300/20 bg-black/55 px-4 py-3 text-xs text-amber-100 backdrop-blur-md">
                {mapError}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex h-[320px] flex-col rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(12,24,13,0.92),rgba(8,14,10,0.92))] p-4 sm:h-[420px] lg:h-[520px]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Tracked Journeys</p>
              <p className="text-xs text-slate-500">Polls every 20 seconds for fresh status updates.</p>
            </div>
            <div className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
              {journeys.length} active
            </div>
          </div>

          <div className="fi-journey-scroll flex-1 space-y-3 overflow-y-auto pr-1">
            {journeys.map((journey) => {
              const route = routes[journey.id];
              const progress = Math.round(getProgress(journey, clock) * 100);
              const active = selectedJourney?.id === journey.id;

              return (
                <button
                  key={journey.id}
                  type="button"
                  onClick={() => setSelectedJourneyId(journey.id)}
                  className={`w-full rounded-[20px] border px-4 py-4 text-left transition ${
                    active
                      ? "border-[var(--brand)]/40 bg-[var(--brand)]/10 shadow-[0_12px_35px_rgba(25,230,25,0.12)]"
                      : "border-white/8 bg-white/[0.03] hover:border-[var(--brand)]/20 hover:bg-white/[0.05]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{journey.loadTitle}</p>
                      <p className="mt-1 text-xs text-slate-400">{journey.routeLabel}</p>
                    </div>
                    <span className="rounded-full bg-black/25 px-2 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--brand)]">
                      {journey.status.replaceAll("_", " ")}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-slate-500">
                      <span>Route progress</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/8">
                      <div
                        className="h-full rounded-full bg-[linear-gradient(90deg,#19e619,#78f078)] transition-[width] duration-700"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 text-xs text-slate-300 sm:grid-cols-2">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Last update</p>
                      <p className="mt-1">{getLatestTrackingLabel(journey)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Distance</p>
                      <p className="mt-1">
                        {route?.distanceKm ?? journey.distanceKm ?? null
                          ? `${route?.distanceKm ?? journey.distanceKm} km`
                          : "Resolving route"}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
