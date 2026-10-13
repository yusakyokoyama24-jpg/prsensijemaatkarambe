import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

interface ChurchMapProps {
  centerLat: number;
  centerLng: number;
  radiusMeters?: number;
  userCoords?: { latitude: number; longitude: number; accuracy?: number };
  churchName?: string;
  isEditable?: boolean;
  onPositionChange?: (lat: number, lng: number) => void;
  className?: string;
  zoom?: number;
}

export const ChurchMap: React.FC<ChurchMapProps> = ({
  centerLat,
  centerLng,
  radiusMeters = 100,
  userCoords,
  churchName = 'Gedung Gereja',
  isEditable = false,
  onPositionChange,
  className = 'h-64 w-full rounded-xl overflow-hidden',
  zoom = 17,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const churchMarkerRef = useRef<L.Marker | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const userMarkerRef = useRef<L.Marker | L.CircleMarker | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Fix default Leaflet icon assets
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    // Custom church icon
    const churchIcon = L.divIcon({
      html: `
        <div style="background-color: #0f172a; border: 2px solid #f59e0b; border-radius: 50%; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">
          <span style="color: #f59e0b; font-size: 18px; font-weight: bold; line-height: 1;">✝</span>
        </div>
      `,
      className: 'church-map-pin',
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });

    // Initialize Map
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [centerLat, centerLng],
        zoom,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Church marker
      const marker = L.marker([centerLat, centerLng], {
        icon: churchIcon,
        draggable: isEditable,
      }).addTo(map);

      marker.bindPopup(`<b>${churchName}</b><br/>Titik Pusat Presensi`).openPopup();

      if (isEditable && onPositionChange) {
        marker.on('dragend', (e) => {
          const latlng = e.target.getLatLng();
          onPositionChange(latlng.lat, latlng.lng);
        });

        map.on('click', (e) => {
          marker.setLatLng(e.latlng);
          onPositionChange(e.latlng.lat, e.latlng.lng);
        });
      }

      // Geofence Circle
      const circle = L.circle([centerLat, centerLng], {
        radius: radiusMeters,
        color: '#f59e0b',
        fillColor: '#f59e0b',
        fillOpacity: 0.15,
        weight: 2,
        dashArray: '4, 4',
      }).addTo(map);

      churchMarkerRef.current = marker;
      radiusCircleRef.current = circle;
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Sync positions when props change
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (churchMarkerRef.current) {
      churchMarkerRef.current.setLatLng([centerLat, centerLng]);
    }
    if (radiusCircleRef.current) {
      radiusCircleRef.current.setLatLng([centerLat, centerLng]);
      radiusCircleRef.current.setRadius(radiusMeters);
    }

    // Render User Location if provided
    if (userCoords) {
      const userIcon = L.divIcon({
        html: `
          <div style="position: relative; width: 24px; height: 24px;">
            <div style="position: absolute; inset: 0; background: #38bdf8; border-radius: 50%; opacity: 0.4; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: absolute; top: 4px; left: 4px; width: 16px; height: 16px; background: #0284c7; border: 2px solid #ffffff; border-radius: 50%; box-shadow: 0 2px 5px rgba(0,0,0,0.4);"></div>
          </div>
        `,
        className: 'user-pulse-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([userCoords.latitude, userCoords.longitude]);
      } else {
        const uMarker = L.marker([userCoords.latitude, userCoords.longitude], {
          icon: userIcon,
        }).addTo(map);
        uMarker.bindPopup('<b>Lokasi Anda Saat Ini</b>');
        userMarkerRef.current = uMarker;
      }

      // Fit bounds to show both user and church
      const group = L.featureGroup([
        churchMarkerRef.current!,
        userMarkerRef.current,
      ]);
      map.fitBounds(group.getBounds().pad(0.3));
    } else {
      map.setView([centerLat, centerLng], zoom);
    }
  }, [centerLat, centerLng, radiusMeters, userCoords, zoom]);

  return <div ref={mapContainerRef} className={className} />;
};
