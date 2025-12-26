import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { LatLngExpression } from 'leaflet'
import { Loader, Thermometer, CloudRain, Leaf, Droplets, Scaling, Trophy } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { useTranslation } from 'react-i18next'

export const Route = createFileRoute('/predict')({
  component: RouteComponent,
})

export interface PredictionData {
  predicted_yield: number
  "Available Water Capacity": number
  "Bulk Density": number
  "Drainage Class": number
  "Surface Soil Moisture": number
  "Root Zone Soil Moisture": number
  NDVI: number
  "Minimum Temperature": number
  "Maximum Temperature": number
  Precipitation: number
  "Solar Radiation": number
  "Average Temperature": number
  "Reference Evapotranspiration": number
  "Vapour Pressure Deficit": number
  "Climatic Water Balance": number
  FPAR: number
  "Harvest Area": number
  "District Id": string
  "Harvest Year": number
  "Crop Area Percentage": number
}

const PredictionDetails = ({ data }: { data: PredictionData }) => {
  const { t } = useTranslation()
  if (!data) return null;

  const { predicted_yield } = data;

  const detailsToShow: { label: string; unit?: string; value: string | number | undefined; icon: React.ReactNode }[] = [
      { label: t('Harvest Area'), unit: 'acres', value: data["Harvest Year"], icon: <Scaling className="h-5 w-5 text-primary" /> },
      { label: t('Avg Temp'), unit: '°C', value: data["Average Temperature"], icon: <Thermometer className="h-5 w-5 text-primary" /> },
      { label: t('Precipitation'), unit: 'mm', value: data["Precipitation"], icon: <CloudRain className="h-5 w-5 text-primary" /> },
      { label: t('NDVI'), value: data["NDVI"], icon: <Leaf className="h-5 w-5 text-primary" /> },
      { label: t('Soil Moisture'), value: data["Surface Soil Moisture"], icon: <Droplets className="h-5 w-5 text-primary" /> },
  ]

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>{t('Prediction Details')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl text-center">
            <Trophy className="h-10 w-10 text-yellow-500 mb-2" />
            <p className="text-sm font-medium text-muted-foreground">{t('Predicted Yield')}</p>
            <p className="text-5xl font-extrabold text-primary tracking-tight">
                {predicted_yield.toFixed(2)}
                <span className="text-xl font-medium text-muted-foreground ml-1">kg/ha</span>
            </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {detailsToShow.map(({ label, value, unit, icon }) => (
             value !== undefined && (
                <div key={label} className="flex items-center space-x-3 p-2 bg-background rounded-lg border">
                  <div className="p-2 bg-primary/10 rounded-md">
                    {icon}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">{label}</p>
                    <p className="font-bold text-base">
                        {typeof value === 'string' ? value.toString().charAt(0).toUpperCase() + value.slice(1) : typeof value === 'number' ? value.toFixed(2) : value}
                        {unit && <span className="text-xs font-normal text-muted-foreground ml-1">{unit}</span>}
                    </p>
                  </div>
                </div>
            )
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

function ChangeView({ center, zoom }: { center: LatLngExpression, zoom: number }) {
  const map = useMap();
  map.flyTo(center, zoom);
  return null;
}

function MapClickHandler({ setPosition }: { setPosition: (position: LatLngExpression) => void }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

function RouteComponent() {
  const { t } = useTranslation()
  const [crop, setCrop] = useState('wheat')
  const [position, setPosition] = useState<LatLngExpression | null>(null)
  const [isPositionLoading, setIsPositionLoading] = useState(false)
  const [harvestArea, setHarvestArea] = useState<number | ''>('')
  const [predictionData, setPredictionData] = useState<PredictionData | null>(null)
  const [analysis, setAnalysis] = useState('')
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false)
  const [showAnalysis, setShowAnalysis] = useState(false)

  const analysisMutation = useMutation({
    mutationFn: async (data: { lat: number; lon: number; crop_name: string; predicted_yield: number }) => {
      setIsAnalysisLoading(true);
      setShowAnalysis(true);
      setAnalysis('');
      const response = await fetch(`http://localhost:8000/llm/analysis?lat=${data.lat}&lon=${data.lon}&crop_name=${data.crop_name}&predicted_yield=${data.predicted_yield}`);
      if (!response.body) {
        throw new Error('No response body');
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        setAnalysis((prev) => prev + decoder.decode(value, { stream: true }));
      }
      setIsAnalysisLoading(false);
    },
    onError: (error) => {
      console.error('Error fetching analysis:', error);
      setIsAnalysisLoading(false);
      alert(t('Failed to get AI analysis.'));
    }
  });

  const mutation = useMutation({
    mutationFn: () => {
      if (!position || !Array.isArray(position)) {
        throw new Error('Location not set or invalid');
      }
      return axios.post(`http://localhost:8000/predict/my-field?lat=${position[0]}&lon=${position[1]}&harvest_area=${harvestArea}&crop_name=${crop}`)
        .then(res => res.data)
    },
    onSuccess: (data: PredictionData) => {
      setPredictionData(data);
      if (position && Array.isArray(position)) {
        analysisMutation.mutate({
          lat: position[0],
          lon: position[1],
          crop_name: crop,
          predicted_yield: data.predicted_yield,
        });
      }
    },
    onError: (error) => {
      console.error('Error submitting form:', error)
      alert(t('Failed to get prediction.'))
    }
  })

  const handleGetLocation = () => {
    setIsPositionLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setPosition([latitude, longitude])
        setIsPositionLoading(false)
      },
      (error) => {
        console.error(error)
        setIsPositionLoading(false)
        alert(t('Could not get your location.'))
      }
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!position) {
      alert(t('Please get your location first.'))
      return
    }
    if (harvestArea === '') {
      alert(t('Please enter harvest area.'))
      return
    }
    setPredictionData(null);
    setAnalysis('');
    setShowAnalysis(false);
    mutation.mutate()
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-background to-card/30 p-4 sm:p-6 lg:p-8'>
      <div className='max-w-7xl mx-auto'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-2'>
          <Card className={`w-full transition-all duration-300 ${showAnalysis ? 'md:col-span-2' : 'col-span-4'}`}>
            <CardContent className='p-6 w-full'>
              <form onSubmit={handleSubmit} className='space-y-6'>
                <div className='space-y-2'>
                  <label htmlFor='crop-select' className='text-sm font-medium'>
                    {t('Select Crop')}
                  </label>
                  <select
                    id='crop-select'
                    value={crop}
                    onChange={(e) => setCrop(e.target.value)}
                    className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
                  >
                    <option value='wheat'>{t('Wheat')}</option>
                    <option value='maize'>{t('Maize')}</option>
                  </select>
                </div>

                {/* New input field for Harvest Area */}
                <div className='space-y-2'>
                  <label htmlFor='harvest-area' className='text-sm font-medium'>
                    {t('Harvest Area (in acres)')}
                  </label>
                  <input
                    id='harvest-area'
                    type='number'
                    value={harvestArea}
                    onChange={(e) => setHarvestArea(Number(e.target.value))}
                    placeholder={t('Enter harvest area')}
                    className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
                    min='0'
                  />
                </div>

                <Card className='w-full p-0'>
                  <CardContent className='h-96 p-0 w-full'>
                    <MapContainer
                      center={position || [20.5937, 78.9629]}
                      zoom={position ? 13 : 5}
                      className='z-0'
                      scrollWheelZoom={false}
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                      />
                      <MapClickHandler setPosition={setPosition} />
                      {position && (
                        <>
                          <Marker position={position}>
                            <Popup>{t('Your current location.')}</Popup>
                          </Marker>
                          <ChangeView center={position} zoom={13} />
                        </>
                      )}
                    </MapContainer>
                  </CardContent>
                </Card>

                <Button
                  type='button'
                  onClick={handleGetLocation}
                  className='w-full'
                  disabled={isPositionLoading}
                >
                  {isPositionLoading ? (
                    <Loader className='mr-2 h-4 w-4 animate-spin' />
                  ) : null}
                  {isPositionLoading ? t('Getting Location...') : t('Get My Location')}
                </Button>

                <Button type='submit' className='w-full' disabled={!position || harvestArea === '' || mutation.isPending}>
                  {mutation.isPending ? (
                    <Loader className='mr-2 h-4 w-4 animate-spin' />
                  ) : null}
                  {mutation.isPending ? t('Predicting...') : t('Predict')}
                </Button>
              </form>
            </CardContent>
          </Card>

          {showAnalysis && (
            <div className='md:col-span-2 space-y-2 animate-in fade-in-0 slide-in-from-top-4 duration-500'>
              {predictionData && <PredictionDetails data={predictionData} />}
              <Card>
                <CardHeader>
                  <CardTitle>{t('AI Analysis')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {isAnalysisLoading && (
                    <div className='flex items-center space-x-2'>
                      <Loader className='mr-2 h-4 w-4 animate-spin' />
                      <span>{t('Generating analysis...')}</span>
                    </div>
                  )}
                  <div className='prose prose-sm max-w-none'>
                    {analysis}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

        </div>
      </div>

    </div>
  )
}