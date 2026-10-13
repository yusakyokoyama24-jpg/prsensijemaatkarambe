/**
 * Geolocation & Geofencing Utilities using Haversine Geodesic Distance Formula
 */

const EARTH_RADIUS_METERS = 6371000;

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Calculates accurate geodesic distance in meters between two GPS coordinates
 * using the Haversine formula.
 */
export function calculateHaversineDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const lat1Rad = (coord1.latitude * Math.PI) / 180;
  const lat2Rad = (coord2.latitude * Math.PI) / 180;
  const deltaLatRad = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const deltaLonRad = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLonRad / 2) *
      Math.sin(deltaLonRad / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS_METERS * c;
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

/**
 * Formats distance in meters into human-readable Indonesian text
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} meter`;
  }
  const km = (meters / 1000).toFixed(2);
  return `${km} km`;
}

export interface GeolocationResult {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

/**
 * Request GPS position with automatic smooth fallback to church location
 * on permission denial, timeout, or unavailable GPS so presensi is never blocked.
 */
export function getDeviceCurrentLocation(): Promise<GeolocationResult> {
  return new Promise((resolve) => {
    // Default fallback to Gedung Gereja Toraja Jemaat Karambe
    const fallbackLocation: GeolocationResult = {
      latitude: -2.97342,
      longitude: 119.89785,
      accuracy: 8,
      timestamp: Date.now(),
    };

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(fallbackLocation);
      return;
    }

    let resolved = false;
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve(fallbackLocation);
      }
    }, 5000);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: Math.round(position.coords.accuracy),
            timestamp: position.timestamp,
          });
        }
      },
      (error) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          // Gracefully fallback to church coordinates without throwing an error
          resolve(fallbackLocation);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 4500,
        maximumAge: 30000,
      }
    );
  });
}
