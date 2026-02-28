import { ComposableMap, Geographies, Geography } from 'react-simple-maps'
import countries from '../../data/countries.json'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

const visitedISOs = new Set(countries.map(c => c.iso))

// ISO 3166-1 alpha-2 to numeric mapping for common countries
// react-simple-maps uses numeric ISO codes internally
const isoAlpha2ToNumeric = {
  US: '840', GB: '826', FR: '250', DE: '276', IT: '380', ES: '724',
  JP: '392', CN: '156', AU: '036', CA: '124', MX: '484', BR: '076',
  IN: '356', ZA: '710', NG: '566', EG: '818', KE: '404', MA: '504',
  AR: '032', CL: '152', CO: '170', PE: '604', NZ: '554', KR: '410',
  TH: '764', VN: '704', ID: '360', PH: '608', MY: '458', SG: '702',
  HK: '344', TW: '158', PT: '620', NL: '528', BE: '056', CH: '756',
  AT: '040', SE: '752', NO: '578', DK: '208', FI: '246', PL: '616',
  CZ: '203', HU: '348', RO: '642', GR: '300', TR: '792', IL: '376',
  SA: '682', AE: '784', QA: '634', KW: '414', JO: '400', LB: '422',
  GH: '288', TZ: '834', UG: '800', ET: '231', SN: '686', CI: '384',
  CR: '188', GT: '320', HN: '340', PA: '591', CU: '192', DO: '214',
  PR: '630', JM: '388', TT: '780', EC: '218', BO: '068', PY: '600',
  UY: '858', VE: '862', PG: '598', FJ: '242',
}

export default function WorldMap() {
  return (
    <div>
      <ComposableMap
        projectionConfig={{ scale: 147 }}
        style={{ width: '100%', height: 'auto' }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => {
              // Check if this geography's numeric ID matches any visited country
              const numericId = geo.id?.toString()
              const isVisited = [...visitedISOs].some(
                iso => isoAlpha2ToNumeric[iso] === numericId
              )
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={isVisited ? '#1A1A1A' : '#E5E5E0'}
                  stroke="#FAFAF8"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: 'none' },
                    hover: { outline: 'none', fill: isVisited ? '#4A4A4A' : '#D0D0C8' },
                    pressed: { outline: 'none' },
                  }}
                />
              )
            })
          }
        </Geographies>
      </ComposableMap>
    </div>
  )
}
