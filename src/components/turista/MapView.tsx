import React, { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useApp } from '@/context/AppContext';
import { Info, ExternalLink, Navigation as NavigationIcon, Heart } from 'lucide-react';
import { Category } from '@/types';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

// Fix for default marker icon in Leaflet + Vite
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom SVG Marker Icon Creator with Name Label
const createCustomIcon = (name: string) => L.divIcon({
  className: 'custom-div-icon',
  html: `
    <div class="marker-pin"></div>
    <div class="marker-dot"></div>
    <div class="marker-label">${name}</div>
  `,
  iconSize: [30, 42],
  iconAnchor: [15, 42],
  popupAnchor: [0, -40]
});

// Component to handle map auto-focus (FitBounds) and size validation
const MapController = ({ partners }: { partners: any[] }) => {
  const map = useMap();
  
  useEffect(() => {
    // Force map to recalculate its container size
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);

    if (partners.length > 0) {
      const validPartners = partners.filter(p => 
        p.latitude !== undefined && p.longitude !== undefined && 
        !isNaN(Number(p.latitude)) && !isNaN(Number(p.longitude)) &&
        (Number(p.latitude) !== 0 || Number(p.longitude) !== 0)
      );

      if (validPartners.length > 0) {
        const bounds = L.latLngBounds(validPartners.map(p => [Number(p.latitude), Number(p.longitude)]));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      } else {
        map.setView([-9.6659, -35.7350], 11);
      }
    } else {
      // Default view if no partners (Alagoas/Maceió)
      map.setView([-9.6659, -35.7350], 11);
    }
    return () => clearTimeout(timer);
  }, [partners, map]);
  
  return null;
};

const MapView: React.FC = () => {
  const { partners, toggleFavorite, isFavorite } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<Category | 'Todos'>('Todos');
  const [mapKey, setMapKey] = useState(0);

  useEffect(() => {
    // Force a re-render after mount to ensure leaflet calculates size correctly
    const timer = setTimeout(() => {
      setMapKey(prev => prev + 1);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const categories: (Category | 'Todos')[] = ['Todos', 'Praias', 'Hotéis', 'Restaurantes', 'Passeios', 'Vida Noturna'];

  const filteredPartners = useMemo(() => {
    return partners.filter(p => {
      const hasCoords = p.latitude !== undefined && p.longitude !== undefined && 
                        !isNaN(Number(p.latitude)) && !isNaN(Number(p.longitude)) &&
                        (Number(p.latitude) !== 0 || Number(p.longitude) !== 0);
      if (!hasCoords) return false;
      if (selectedCategory === 'Todos') return true;
      return p.category === selectedCategory;
    });
  }, [partners, selectedCategory]);

  return (
    <div className="h-[calc(100vh-80px)] w-full relative bg-gray-100 overflow-hidden">
      <MapContainer 
        key={mapKey}
        center={[-9.6659, -35.7350]} 
        zoom={11} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        {/* Satellite Layer */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution='Tiles &copy; Esri &mdash; Source: Esri'
        />
        {/* Labels Layer (Hybrid effect) */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
          attribution='Labels &copy; Esri'
        />
        
        <MapController partners={filteredPartners} />
        
        {filteredPartners.map((partner) => (
          <Marker 
            key={partner.id} 
            position={[Number(partner.latitude), Number(partner.longitude)]}
            icon={createCustomIcon(partner.name)}
          >
            <Popup className="partner-popup">
              <div className="p-0 min-w-[200px]">
                {partner.image && (
                  <img 
                    src={partner.image} 
                    alt={partner.name} 
                    className="w-full h-28 object-cover rounded-t-lg"
                  />
                )}
                <div className="p-3">
                  <h3 className="font-bold text-gray-900 leading-tight mb-1">{partner.name}</h3>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant={partner.isPremium ? "default" : "secondary"} className="text-[10px] bg-ocean/10 text-ocean border-none">
                      {partner.category}
                    </Badge>
                    {partner.isPremium && (
                      <Badge className="text-[10px] bg-amber-500 text-white border-none">
                        Premium
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {partner.google_maps_link && partner.google_maps_link.startsWith('https://') && (
                      <a 
                        href={partner.google_maps_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex-1 bg-ocean text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-ocean-deep transition-colors"
                      >
                        <NavigationIcon size={14} />
                        Como Chegar
                      </a>
                    )}
                    <button 
                      onClick={() => toggleFavorite(partner.id)}
                      className={`p-2 rounded-xl transition-all shadow-sm ${
                        isFavorite(partner.id) ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      <Heart size={14} className={isFavorite(partner.id) ? 'fill-current' : ''} />
                    </button>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Floating UI - Category Filters */}
      <div className="absolute top-12 left-0 right-0 z-[1000] px-6 overflow-x-auto hide-scrollbar flex gap-2">
        {categories.map((cat) => (
          <button 
            key={cat} 
            onClick={() => setSelectedCategory(cat)}
            className={`px-6 py-3 rounded-2xl shadow-lg font-bold text-sm whitespace-nowrap border transition-all ${
              selectedCategory === cat 
                ? 'bg-ocean text-white border-ocean scale-105' 
                : 'bg-white/90 backdrop-blur-md text-gray-700 border-white/20 hover:bg-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Stats Counter */}
      <div className="absolute bottom-24 left-6 z-[1000]">
        <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg border border-white/20 flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs font-bold text-gray-700">
            {filteredPartners.length} {filteredPartners.length === 1 ? 'Parceiro encontrado' : 'Parceiros encontrados'}
          </span>
        </div>
      </div>

      
      <style>{`
        .leaflet-popup-content-wrapper {
          border-radius: 20px;
          padding: 0;
          overflow: hidden;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
        }
        .leaflet-popup-content {
          margin: 0 !important;
          width: 200px !important;
        }
        .partner-popup .leaflet-popup-tip {
          background: white;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
      `}</style>

    </div>
  );
};

export default MapView;