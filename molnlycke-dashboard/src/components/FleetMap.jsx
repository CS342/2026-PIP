import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
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

export default function FleetMap({ selectedClient }) {
  return (
    <div className="chart-card">
      <div className="card-header">
        <div className="card-header-left">
          <h3>Fleet Geography</h3>
          <span className="card-subtitle">Active positioners by location</span>
        </div>
      </div>
      <div className="map-container">
        <MapContainer
          center={[39.5, -98.35]}
          zoom={4}
          scrollWheelZoom={false}
          style={{ height: "100%", width: "100%", borderRadius: "8px" }}
        >
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
        </MapContainer>
      </div>
    </div>
  );
}
