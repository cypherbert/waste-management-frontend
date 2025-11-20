// frontend/src/components/BinLocator.tsx
import { useState, useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type {
  Coordinates,
  Bin,
  BinFilter,
} from '@/features/waste-management/types';
import { fetchNearbyBins } from '@/features/waste-management/api/bin.api';
import {
  RecenterMap,
  MapClickHandler,
} from '@/features/waste-management/components';
import { NearestBinCard } from '@/features/waste-management/components';
import { LocationsSideBar } from '@/features/waste-management/components';

// Fix Leaflet default icon
const icon = new URL(
  'leaflet/dist/images/marker-icon.png',
  import.meta.url
).toString();
const iconShadow = new URL(
  'leaflet/dist/images/marker-shadow.png',
  import.meta.url
).toString();

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

export function BinLocator() {
  const [userLocation, setUserLocation] = useState<Coordinates>({
    lat: 51.505,
    lng: -0.09,
  });
  const [bins, setBins] = useState<Bin[]>([]);
  const [selectedBinId, setSelectedBinId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTypeFilter, setActiveTypeFilter] = useState<BinFilter>('All');
  const mapRef = useRef<L.Map | null>(null);

  // Fetch bins from API
  useEffect(() => {
    async function loadBins() {
      try {
        const data = await fetchNearbyBins(
          userLocation.lat,
          userLocation.lng,
          activeTypeFilter === 'All' ? 'All' : activeTypeFilter,
          searchQuery
        );
        setBins(data);

        // Auto-select nearest bin on first load
        if (data.length > 0 && selectedBinId === null) {
          setSelectedBinId(data[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch bins:', error);
      }
    }

    loadBins();
  }, [userLocation, activeTypeFilter, searchQuery]);

  const nearestBin = bins.length > 0 ? bins[0] : null;

  function handleSelectBin(binId: number) {
    const target = bins.find((bin) => bin.id === binId);
    if (!target) return;

    setSelectedBinId(binId);
    if (mapRef.current) {
      mapRef.current.flyTo([target.lat, target.lng], 15, {
        animate: true,
        duration: 1,
      });
    }
  }

  function handleMapClick(coords: Coordinates) {
    setUserLocation(coords);
    setSelectedBinId(null);
  }

  function handleLocateUser() {
    setLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position: GeolocationPosition) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setSelectedBinId(null);
          setLoading(false);
        },
        (error: GeolocationPositionError) => {
          console.error(error);
          alert('Could not access location.');
          setLoading(false);
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
      setLoading(false);
    }
  }

  const mapWrapperStyle: CSSProperties = {
    position: 'relative',
    width: '100%',
    minHeight: 520,
    borderRadius: 24,
    overflow: 'hidden',
    border: '1px solid #e5e7eb',
    backgroundColor: '#fff',
    boxShadow: '0 15px 45px rgba(15, 23, 42, 0.12)',
  };

  const mapContainerStyle: CSSProperties = {
    height: '100%',
    minHeight: 520,
    width: '100%',
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-50 p-4">
      <h1 className="mb-6 text-2xl font-bold text-gray-800">
        CityHub Waste Map
      </h1>
      <p className="mb-8 max-w-3xl text-center text-gray-500">
        Explore recycling and disposal sites across the city. Use the filters to
        view different bin types, select a location from the list, or click
        anywhere on the map to update your position and refresh the nearest
        results.
      </p>

      <div className="grid w-full max-w-6xl gap-6 md:grid-cols-[2fr,1fr]">
        {/* Map Wrapper */}
        <div
          className="relative h-[520px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
          style={mapWrapperStyle}
        >
          <NearestBinCard bin={nearestBin} />

          <MapContainer
            center={[userLocation.lat, userLocation.lng]}
            zoom={13}
            className="z-0 h-full w-full"
            scrollWheelZoom
            ref={mapRef}
            style={mapContainerStyle}
          >
            <RecenterMap lat={userLocation.lat} lng={userLocation.lng} />
            <MapClickHandler onSelect={handleMapClick} />

            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* User Location Marker */}
            <Marker position={[userLocation.lat, userLocation.lng]}>
              <Popup className="font-sans">You are here</Popup>
            </Marker>

            {/* Bin Markers */}
            {bins.map((bin) => (
              <Marker
                key={bin.id}
                position={[bin.lat, bin.lng]}
                opacity={selectedBinId === bin.id ? 1 : 0.75}
                eventHandlers={{
                  click: () => handleSelectBin(bin.id),
                }}
              >
                <Popup>
                  <div className="space-y-1 text-center">
                    <h3 className="text-sm font-bold">{bin.name}</h3>
                    <span className="text-xs text-gray-500">{bin.type}</span>
                    <p className="text-xs font-semibold text-blue-600">
                      Distance: {bin.distance ?? 'Not calculated'}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Locations Sidebar */}
        <LocationsSideBar
          bins={bins}
          selectedBinId={selectedBinId}
          searchQuery={searchQuery}
          activeTypeFilter={activeTypeFilter}
          loading={loading}
          onSearchChange={setSearchQuery}
          onFilterChange={setActiveTypeFilter}
          onBinSelect={handleSelectBin}
          onLocateUser={handleLocateUser}
        />
      </div>
    </div>
  );
}
