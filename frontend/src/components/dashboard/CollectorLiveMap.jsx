import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const collectorIcon = L.divIcon({
  className: 'collector-marker',
  html: '<span>🚛</span>',
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

const destinationIcon = L.divIcon({
  className: 'destination-marker',
  html: '<span>🗑️</span>',
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

const FitRouteBounds = ({ points }) => {
  const map = useMap();

  useEffect(() => {
    if (!points?.length) return;
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [30, 30] });
  }, [map, points]);

  return null;
};

const CollectorLiveMap = ({ destination, currentPosition }) => {
  const [routePoints, setRoutePoints] = useState([]);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState('');

  const hasLivePosition = Boolean(currentPosition?.lat && currentPosition?.lng);

  const mapCenter = useMemo(() => {
    if (hasLivePosition) {
      return [currentPosition.lat, currentPosition.lng];
    }
    return [destination.lat, destination.lng];
  }, [hasLivePosition, currentPosition, destination]);

  useEffect(() => {
    const fetchRoute = async () => {
      if (!hasLivePosition) {
        setRoutePoints([]);
        setRouteError('Live position not available yet. Start tracking to draw route.');
        return;
      }

      setRouteLoading(true);
      setRouteError('');

      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${currentPosition.lng},${currentPosition.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
        const response = await fetch(url);
        const data = await response.json();

        if (!data.routes?.length) {
          setRoutePoints([]);
          setRouteError('No drivable route found.');
          return;
        }

        const coordinates = data.routes[0].geometry.coordinates.map((point) => [point[1], point[0]]);
        setRoutePoints(coordinates);
      } catch (error) {
        setRoutePoints([]);
        setRouteError('Failed to load route path. Please try again.');
      } finally {
        setRouteLoading(false);
      }
    };

    fetchRoute();
  }, [destination.lat, destination.lng, currentPosition, hasLivePosition]);

  const boundsPoints = routePoints.length
    ? routePoints
    : [
        [destination.lat, destination.lng],
        hasLivePosition ? [currentPosition.lat, currentPosition.lng] : [destination.lat, destination.lng]
      ];

  return (
    <div className="live-map-shell">
      {(routeLoading || routeError) && (
        <div className="map-status-banner">
          {routeLoading ? 'Updating route...' : routeError}
        </div>
      )}

      <MapContainer center={mapCenter} zoom={14} scrollWheelZoom className="navigation-map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker position={[destination.lat, destination.lng]} icon={destinationIcon}>
          <Popup>Waste request location</Popup>
        </Marker>

        {hasLivePosition && (
          <Marker position={[currentPosition.lat, currentPosition.lng]} icon={collectorIcon}>
            <Popup>Your live position</Popup>
          </Marker>
        )}

        {routePoints.length > 0 && <Polyline positions={routePoints} color="#22c55e" weight={5} opacity={0.85} />}

        <FitRouteBounds points={boundsPoints} />
      </MapContainer>
    </div>
  );
};

export default CollectorLiveMap;
