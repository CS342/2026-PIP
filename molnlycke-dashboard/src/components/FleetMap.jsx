import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import { FaExpand, FaXmark } from "react-icons/fa6";
import { database } from "../data/mockDatabase";
import "leaflet/dist/leaflet.css";
import "../styles/components.css";

function MapUpdater({ selectedClient }) {
  const map = useMap();
  
  useEffect(() => {
    if (selectedClient && selectedClient !== "all") {
      const client = database.clients.find((c) => c.id === selectedClient);
      if (client) {
        map.setView([client.lat, client.lng], 6);
      }
    } else {
      map.setView([39.5, -98.35], 4);
    }
  }, [selectedClient, map]);

  return null;
}

function MapContent({ selectedClient }) {
  return (
    <>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapUpdater selectedClient={selectedClient} />
      {database.clients.map((client) => {
        const bagCount = database.inventory.filter(
          (i) => i.client_id === client.id
        ).length;
        const isHighlighted =
          selectedClient === "all" || selectedClient === client.id;

        return (
          <CircleMarker
            key={client.id}
            center={[client.lat, client.lng]}
            radius={Math.max(10, Math.sqrt(bagCount) * 1.8)}
            pathOptions={{
              fillColor: isHighlighted ? "#00754a" : "#aaa",
              color: "#fff",
              weight: 2,
              fillOpacity: isHighlighted ? 0.85 : 0.35,
            }}
          >
            <Popup>
              <strong>{client.name}</strong>
              <br />
              {bagCount} active positioners
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
}

export default function FleetMap({ selectedClient }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <div className="chart-card">
        <div className="card-header">
          <div className="card-header-left">
            <h3>Fleet Geography</h3>
            <span className="card-subtitle">Active positioners by location</span>
          </div>
          <button className="icon-btn" onClick={() => setExpanded(true)} title="Expand map">
            <FaExpand />
          </button>
        </div>
        <div className="map-container">
          <MapContainer
            center={[39.5, -98.35]}
            zoom={4}
            scrollWheelZoom={false}
            style={{ height: "100%", width: "100%", borderRadius: "8px" }}
          >
            <MapContent selectedClient={selectedClient} />
          </MapContainer>
        </div>
      </div>

      {expanded && (
        <div className="map-modal-overlay" onClick={() => setExpanded(false)}>
          <div className="map-modal" onClick={(e) => e.stopPropagation()}>
            <div className="map-modal-header">
              <div>
                <h3>Fleet Geography</h3>
                <span className="card-subtitle">Active positioners by location</span>
              </div>
              <button className="icon-btn" onClick={() => setExpanded(false)} title="Close">
                <FaXmark />
              </button>
            </div>
            <div className="map-modal-body">
              <MapContainer
                center={[39.5, -98.35]}
                zoom={4}
                scrollWheelZoom={true}
                style={{ height: "100%", width: "100%" }}
              >
                <MapContent selectedClient={selectedClient} />
              </MapContainer>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
