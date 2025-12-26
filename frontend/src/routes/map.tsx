import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Droplets, Filter, Loader, X } from 'lucide-react';
import { useState, type Dispatch, type SetStateAction } from 'react';
import { CircleMarker, MapContainer, TileLayer, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useTranslation } from 'react-i18next';

interface DistrictsResponse {
  _id: string
  crop_name: string
  adm_id: string
  latitude: number
  longitude: number
  region_area: number
  avg_yield: number
}

export const Route = createFileRoute('/map')({
  component: RouteComponent,
});

interface Farm {
  _id: string;
  crop_name: string;
  adm_id: string;
  latitude: number;
  longitude: number;
  region_area: number;
  avg_yield: number;
}

const getStatusLabel = (status: string, t: (key: string) => string) => {
  switch (status) {
    case "good":
      return t("Optimal")
    case "warning":
      return t("Attention Required")
    case "critical":
      return t("Critical")
    default:
      return t("Unknown")
  }
}

interface Variability {
  zone: string
  variability: number
  yield: number
  latitude: number;
  longitude: number;
  adm_id: string;
}

function RouteComponent() {
  const { t } = useTranslation()
  const [selectedCrop, setSelectedCrop] = useState<"wheat" | "maize" | "all">("all")
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null)
  const [showVariability, setShowVariability] = useState(false)
  const [showClaims, setShowClaims] = useState(false)

  const {
    data: cropsData,
    isLoading
  } = useQuery({
    queryKey: ['maps-districts', selectedCrop],
    queryFn: () => axios.get<DistrictsResponse[]>(`http://localhost:8000/maps/districts?crop=${selectedCrop}`)
      .then(res => res.data),
  })

  const {
    data: variabilityData,
    isLoading: variabilityLoading
  } = useQuery({
    queryKey: ['variability', showVariability], // Added showVariability to queryKey
    queryFn: () => axios.get<Variability[]>("http://localhost:8000/maps/variability").then(res => res.data),
    enabled: showVariability
  })

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-background to-card/30">
      <div className="relative space-y-6">
        <FarmDetail selectedFarm={selectedFarm} showClaims={showClaims} showVariability={showVariability} setSelectedFarm={setSelectedFarm} />
        <FarmFilter selectedCrop={selectedCrop} setSelectedCrop={setSelectedCrop} showClaims={showClaims} showVariability={showVariability} setShowVariability={setShowVariability} setShowClaims={setShowClaims} />
        {
          isLoading ? <div>{t('Loading')}</div> :
          cropsData ? 
            <MapContainer center={[cropsData[0].latitude, cropsData[0].longitude]} zoom={10} className="w-full min-h-[calc(93vh)] z-0">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {cropsData.map((el: Farm) => (
                <CircleMarker
                  key={`${el.adm_id}-${el.crop_name}`}
                  eventHandlers={{ click: () => setSelectedFarm(el) }}
                  center={[el.latitude, el.longitude]}
                  radius={Math.round(Math.sqrt(el.region_area / Math.PI))}
                  pathOptions={{
                    color:
                      el.crop_name === "wheat"
                        ? "green"
                        : el.crop_name === "maize"
                          ? "yellow"
                          : "black",
                  }}
                  stroke={true}
                >
                  <Tooltip>
                    {el.adm_id} {t('farming')} {el.crop_name} {t('average yield')} {el.avg_yield || -1000} kg/ha
                  </Tooltip>
                </CircleMarker>
              ))}

              {/* Conditional rendering for variability data */}
              {showVariability && variabilityLoading && (
                <div className="leaflet-top leaflet-right" style={{ pointerEvents: 'none', zIndex: 1000 }}>
                  <div className="leaflet-control p-2 bg-white rounded shadow">
                    <Loader className="mr-2 h-4 w-4 animate-spin inline-block" /> {t('Loading variability data...')}
                  </div>
                </div>
              )}

              {showVariability && variabilityData && !variabilityLoading && (
                variabilityData.map(el => {
                  let color = 'gray';
                  if (el.variability < 0.2) {
                    color = 'green';
                  } else if (el.variability >= 0.2 && el.variability < 0.5) {
                    color = 'orange';
                  } else {
                    color = 'red';
                  }
                  const radius = el.variability * 20;

                  return (
                    <CircleMarker
                      key={`${el.adm_id}-${el.zone}`}
                      center={[el.latitude, el.longitude]}
                      radius={Math.max(5, radius)}
                      pathOptions={{ color: color, fillColor: color, fillOpacity: 0.7 }}
                      stroke={true}
                      weight={1}
                    >
                      <Tooltip>
                        <div>{t('Zone:')} {el.zone}</div>
                        <div>{t('Variability:')} {el.variability != null ? el.variability.toFixed(2) : '--'}</div>
                        <div>{t('Yield:')} {el.yield != null ? el.yield.toFixed(2) : '--'} kg/ha</div>
                      </Tooltip>
                    </CircleMarker>
                  );
                })
              )}
            </MapContainer> : null
        }
      </div >
    </div >
  )
}

interface FarmDetailProps {
  selectedFarm: Farm | null;
  showVariability: boolean;
  showClaims: boolean;
  setSelectedFarm: Dispatch<SetStateAction<Farm | null>>
}

export interface PredictedYieldResponse {
  "Predicted Yield": number
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
  "Average Yield": number
}


function FarmDetail({ selectedFarm, setSelectedFarm }: FarmDetailProps) {
  const { t } = useTranslation()
  const [isPredicting, setIsPredicting] = useState(false)

  const {
    data: predictionData,
  } = useQuery({
    queryKey: ['predict-', selectedFarm?.adm_id, selectedFarm?.crop_name],
    queryFn: () => axios.post<PredictedYieldResponse>(`http://localhost:8000/predict/year?lat=${selectedFarm?.latitude}&lon=${selectedFarm?.longitude}&harvest_area=${selectedFarm?.region_area}&harvest_year=${2020}&adm_id=${selectedFarm?.adm_id}&crop_name=${selectedFarm?.crop_name}`)
      .then(res => { setIsPredicting(false); return res.data }).catch(() => setIsPredicting(false)),
    enabled: isPredicting
  })

  if (!selectedFarm) {
    return null
  }

  return (
    <div className="absolute top-24 left-2 z-[1000] h-fit">
      <Card className="bg-card border-border">
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className="text-lg">{selectedFarm.adm_id}</CardTitle>
              <div className="flex item-center space-x-4 text-xs text-muted-foreground">
                <div>{t('Lat:')} {selectedFarm.latitude.toFixed(4)}</div>
                <div>{t('Lng:')} {selectedFarm.longitude.toFixed(4)}</div>
              </div>
            </div>
            <Button variant="outline" size="icon" aria-label="Submit" onClick={() => setSelectedFarm(null)}>
              <X />
            </Button>
          </div>
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium text-white w-fit"
            style={{ backgroundColor: "#22c55e" }}
          >
            {getStatusLabel("good", t)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Crop Info */}
          <div>
            <div className="text-sm text-muted-foreground mb-1">{t('Crop Name')}</div>
            <div className="text-lg font-semibold text-foreground capitalize">{selectedFarm.crop_name}</div>
          </div>

          {/* Yield */}
          <div>
            <div className="text-sm text-muted-foreground mb-1">{t('Previous years yield (avg.)')}</div>
            <div className="text-2xl font-bold text-primary">{selectedFarm.avg_yield != null ? selectedFarm.avg_yield.toFixed(2) : '--'} kg/ha</div>
          </div>

          {
            predictionData ?
              <div>
                <div className="text-sm text-muted-foreground mb-1">{t('Predicted Yield (approx.)')}</div>
                <div className="text-2xl font-bold text-primary">{predictionData["Predicted Yield"] != null ? predictionData["Predicted Yield"].toFixed(2) : '--'} kg/ha</div>
              </div>
              : null
          }

          {/* Variability */}

          {predictionData ?
            <Table className='h-8'>
              <TableHeader>
                <TableRow className='font-bold'>
                  <TableCell>{t('Data')}</TableCell>
                  <TableCell>{t('Info')}</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className='max-h-32'>
                {
                  Object.entries(predictionData).map(el => {
                    return (
                      <TableRow>
                        <TableCell>{t(el[0])}</TableCell>
                        <TableCell>{typeof el[1] === 'number' ? el[1].toFixed(2) : el[1]}</TableCell>
                      </TableRow>
                    )
                  })
                }
              </TableBody>
            </Table>
            :
            <Button className='w-full' onClick={() => setIsPredicting(true)}>{t('Predict')} {isPredicting ? <Loader className='animate-spin' /> : null}</Button>
          }
        </CardContent>
      </Card>
    </div >
  )
}

interface FarmFilterProps {
  selectedCrop: "wheat" | "maize" | "all";
  setSelectedCrop: Dispatch<SetStateAction<"wheat" | "maize" | "all">>;
  showVariability: boolean;
  setShowVariability: Dispatch<SetStateAction<boolean>>;
  showClaims: boolean;
  setShowClaims: Dispatch<SetStateAction<boolean>>;
}

function FarmFilter(props: FarmFilterProps) {
  const { t } = useTranslation()

  const {
    selectedCrop,
    setSelectedCrop,
    setShowClaims,
    setShowVariability,
    showClaims,
    showVariability
  } = props

  const [isFilterHidden, setIsFilterHidden] = useState(false)

  return (
    <>
      <Button className='absolute top-2 right-2 z-[1000]' variant={'outline'} size={'icon-lg'} onClick={() => setIsFilterHidden(false)}>
        <Filter />
      </Button>
      <Card className={`absolute top-2 right-2 z-[1000] ${isFilterHidden ? 'hidden' : 'block'} lg:w-fit h-fit`}>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <CardTitle className="text-lg">{t('Map Controls & Filters')}</CardTitle>
            <Button variant="outline" size="icon" aria-label="Submit" onClick={() => setIsFilterHidden(true)}>
              <X />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Crop Selection */}
            <div>
              <label className="text-sm font-medium text-foreground block mb-3">{t('Select Crop Type')}</label>
              <div className="flex flex-wrap gap-2">
                {(["all", "wheat", "maize"] as const).map((crop) => (
                  <Button
                    key={crop}
                    variant={selectedCrop === crop ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCrop(crop)}
                    className="capitalize"
                  >
                    {t(crop)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Display Options */}
            <div>
              <label className="text-sm font-medium text-foreground block mb-3">{t('Display Overlays')}</label>
              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showVariability}
                    onChange={(e) => setShowVariability(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-foreground">{t('Variability Hotspots')}</span>
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
