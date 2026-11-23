"use client";

// ============================================================================
// TIZGIN — Module 2: Live Interactive Incident & Pipeline Map (OpenStreetMap + Leaflet)
// Displays colored status markers:
//   RED (#EF4444): Newly reported (REPORTED)
//   YELLOW (#F59E0B): Under investigation (RECEIVED / ASSIGNED / INSPECTION)
//   BLUE (#0877C9): Repair in progress (REPAIRING)
//   GREEN (#16A34A): Resolved (COMPLETED / VERIFIED)
//   GRAY (#64748B): Rejected or closed (CLOSED / REJECTED)
// Also supports interactive GPS pin picking for Module 1 reporting & Pipeline overlays.
// ============================================================================

import React, { useEffect, useRef } from "react";
import { useI18n } from "@/lib/i18n";

export interface MapIncident {
  id: number;
  incident_number: string;
  category: string;
  description: string;
  latitude: number;
  longitude: number;
  address: string;
  status: string;
  priority: string;
  department_name?: string;
  employee_name?: string;
  estimated_completion?: string | null;
  is_overdue?: boolean;
}

export interface MapPipeline {
  id: number;
  pipeline_code: string;
  address: string;
  latitude: number;
  longitude: number;
  pipeline_type: string;
  diameter_mm: number;
  installation_year: number;
  technical_condition: string;
}

export function getMarkerColor(status: string): { hex: string; labelKey: string } {
  switch (status) {
    case "REPORTED":
      return { hex: "#EF4444", labelKey: "map.legendNew" }; // RED
    case "RECEIVED":
    case "ASSIGNED":
    case "INSPECTION":
      return { hex: "#F59E0B", labelKey: "map.legendInvestigation" }; // YELLOW
    case "REPAIRING":
      return { hex: "#0877C9", labelKey: "map.legendRepairing" }; // BLUE
    case "COMPLETED":
    case "VERIFIED":
      return { hex: "#16A34A", labelKey: "map.legendResolved" }; // GREEN
    case "CLOSED":
    case "REJECTED":
    default:
      return { hex: "#64748B", labelKey: "map.legendClosed" }; // GRAY
  }
}

export function InteractiveIncidentMap({
  incidents,
  pipelines = [],
  showPipelines = true,
  selectedPin,
  onPickLocation,
  onSelectIncident,
  height = "460px"
}: {
  incidents: MapIncident[];
  pipelines?: MapPipeline[];
  showPipelines?: boolean;
  selectedPin?: { lat: number; lng: number } | null;
  onPickLocation?: (lat: number, lng: number) => void;
  onSelectIncident?: (inc: MapIncident) => void;
  height?: string;
}) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<unknown>(null);
  const markersLayerRef = useRef<unknown>(null);
  const { t } = useI18n();

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current) return;
      const L = (await import("leaflet")).default;

      if (!isMounted || !mapContainerRef.current) return;

      if (!leafletMapRef.current) {
        const defaultCenter: [number, number] = selectedPin
          ? [selectedPin.lat, selectedPin.lng]
          : incidents.length > 0
          ? [Number(incidents[0].latitude), Number(incidents[0].longitude)]
          : [42.4602, 59.6156]; // Nukus center default

        const map = L.map(mapContainerRef.current, {
          center: defaultCenter,
          zoom: selectedPin ? 14 : 6,
          scrollWheelZoom: true
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> • TIZGIN GIS'
        }).addTo(map);

        const layerGroup = L.layerGroup().addTo(map);
        leafletMapRef.current = map;
        markersLayerRef.current = layerGroup;

        if (onPickLocation) {
          map.on("click", (e: { latlng: { lat: number; lng: number } }) => {
            onPickLocation(
              Math.round(e.latlng.lat * 100000) / 100000,
              Math.round(e.latlng.lng * 100000) / 100000
            );
          });
        }
      }

      // Refresh markers
      const LLib = (await import("leaflet")).default;
      const map = leafletMapRef.current as { setView: (c: [number, number], z: number) => void };
      const layerGroup = markersLayerRef.current as { clearLayers: () => void };

      if (!layerGroup) return;
      layerGroup.clearLayers();

      // Render Incident Markers
      for (const inc of incidents) {
        const { hex } = getMarkerColor(inc.status);
        const isOverdue = inc.is_overdue;

        const iconHtml = `
          <div style="
            position: relative;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            background: ${hex};
            border: 3px solid #ffffff;
            box-shadow: 0 4px 10px rgba(0,0,0,0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-weight: 800;
            font-size: 12px;
          ">
            💧
            ${
              isOverdue
                ? `<span style="position:absolute;top:-6px;right:-6px;background:#EF4444;color:#fff;font-size:9px;padding:1px 4px;border-radius:99px;border:1.5px solid #fff;">!</span>`
                : ""
            }
          </div>
        `;

        const customIcon = LLib.divIcon({
          html: iconHtml,
          className: "tizgin-map-marker",
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });

        const marker = LLib.marker([Number(inc.latitude), Number(inc.longitude)], { icon: customIcon });
        const popupHtml = `
          <div style="min-width:220px;font-family:sans-serif;">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:4px;">
              <strong style="color:#082B55;font-size:13px;">#${inc.incident_number}</strong>
              <span style="background:${hex};color:#fff;font-size:10px;font-weight:700;padding:2px 6px;border-radius:4px;">
                ${inc.status}
              </span>
            </div>
            <div style="font-size:12px;font-weight:600;color:#1e293b;margin-bottom:4px;">${inc.address}</div>
            <div style="font-size:11px;color:#475569;margin-bottom:6px;">${inc.description.slice(0, 110)}...</div>
            <div style="font-size:10px;color:#64748b;border-top:1px solid #e2e8f0;padding-top:4px;">
              <div><strong>GPS:</strong> ${inc.latitude.toFixed(4)}, ${inc.longitude.toFixed(4)}</div>
              ${inc.department_name ? `<div><strong>Bo'lim:</strong> ${inc.department_name}</div>` : ""}
              ${inc.estimated_completion ? `<div><strong>Muddat:</strong> ${inc.estimated_completion.slice(0, 16).replace("T", " ")}</div>` : ""}
            </div>
          </div>
        `;
        marker.bindPopup(popupHtml);
        if (onSelectIncident) {
          marker.on("click", () => onSelectIncident(inc));
        }
        marker.addTo(layerGroup as unknown as L.LayerGroup);
      }

      // Render Pipeline Passport markers if enabled
      if (showPipelines && pipelines.length > 0) {
        for (const pipe of pipelines) {
          const condColor =
            pipe.technical_condition === "OPTIMAL"
              ? "#35C759"
              : pipe.technical_condition === "SATISFACTORY"
              ? "#0877C9"
              : pipe.technical_condition === "NEEDS_REPAIR"
              ? "#F59E0B"
              : "#EF4444";

          const pipeIcon = LLib.divIcon({
            html: `<div style="padding:2px 6px;border-radius:6px;background:#082B55;color:#fff;border:2px solid ${condColor};font-size:10px;font-weight:700;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.3);">🛠️ ${pipe.pipeline_code}</div>`,
            className: "tizgin-pipeline-marker",
            iconSize: [95, 24],
            iconAnchor: [47, 12]
          });

          const pm = LLib.marker([Number(pipe.latitude), Number(pipe.longitude)], { icon: pipeIcon });
          pm.bindPopup(`
            <div style="min-width:200px;font-family:sans-serif;">
              <strong style="color:#082B55;font-size:13px;">Quvur Pasporti: ${pipe.pipeline_code}</strong>
              <div style="font-size:11px;margin-top:4px;color:#334155;">${pipe.address}</div>
              <div style="font-size:11px;margin-top:4px;color:#475569;">
                • Material: ${pipe.pipeline_type}<br/>
                • Diametr: ${pipe.diameter_mm} mm | Yili: ${pipe.installation_year}<br/>
                • Holati: <strong style="color:${condColor}">${pipe.technical_condition}</strong>
              </div>
            </div>
          `);
          pm.addTo(layerGroup as unknown as L.LayerGroup);
        }
      }

      // Render Selected GPS Pin for Reporting
      if (selectedPin) {
        const pinIcon = LLib.divIcon({
          html: `<div style="width:36px;height:36px;border-radius:50%;background:#35C759;border:3px solid #082B55;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 0 0 6px rgba(53,199,89,0.28);">📍</div>`,
          className: "tizgin-picked-pin",
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        });
        LLib.marker([selectedPin.lat, selectedPin.lng], { icon: pinIcon })
          .bindPopup(`<strong>Tanlangan GPS nuqta:</strong><br/>${selectedPin.lat}, ${selectedPin.lng}`)
          .addTo(layerGroup as unknown as L.LayerGroup);
        map.setView([selectedPin.lat, selectedPin.lng], 14);
      }
    }

    initMap();

    return () => {
      isMounted = false;
    };
  }, [incidents, pipelines, showPipelines, selectedPin, onPickLocation, onSelectIncident]);

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-slate-100 dark:bg-slate-900">
      {/* Map Color Legend Bar */}
      <div className="px-4 py-2.5 bg-white dark:bg-[#082B55]/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200">
            <span className="w-3 h-3 rounded-full bg-[#EF4444] inline-block" />
            {t("map.legendNew")}
          </span>
          <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200">
            <span className="w-3 h-3 rounded-full bg-[#F59E0B] inline-block" />
            {t("map.legendInvestigation")}
          </span>
          <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200">
            <span className="w-3 h-3 rounded-full bg-[#0877C9] inline-block" />
            {t("map.legendRepairing")}
          </span>
          <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200">
            <span className="w-3 h-3 rounded-full bg-[#16A34A] inline-block" />
            {t("map.legendResolved")}
          </span>
          <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200">
            <span className="w-3 h-3 rounded-full bg-[#64748B] inline-block" />
            {t("map.legendClosed")}
          </span>
        </div>
        <span className="text-[11px] text-slate-500 dark:text-slate-300 font-medium">
          🔒 {t("map.privacyNotice")}
        </span>
      </div>

      {/* Map Canvas */}
      <div ref={mapContainerRef} style={{ height, width: "100%" }} className="z-10" />
    </div>
  );
}
