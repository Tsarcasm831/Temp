export const DEFAULT_MODEL = {
  "districts": {
    "hyuuga": {
      "id": "hyuuga",
      "name": "Hyuuga District",
      "desc": "Walled compounds and courtyards in the northeast wards.",
      "points": [[60.23,15.46],[58.76,23.15],[60.66,31.07],[67.48,37.06],[80.21,28.62],[74.65,22.93],[70.71,19.6],[65.51,16.79]]
    },
    "district-1": {
      "id": "district-1",
      "name": "Inuzuka District",
      "desc": "Kennels and waterways along the eastern wards.",
      "points": [[71.91,40.16],[82.11,31.43],[84.78,36.39],[85.97,39.72],[87.59,47.93],[76.48,49.26]]
    },
    "Nara": {
      "id": "Nara",
      "name": "Nara District",
      "desc": "Scholarly quarter and archives in the south-east.",
      "points": [[65.58,73.67],[69.59,67.16],[73.46,65.38],[82.39,70.93],[79.36,74.93],[76.76,78.18],[72.61,81.58],[69.59,83.28]]
    },
    "Akimichi": {
      "id": "Akimichi",
      "name": "Akimichi District",
      "desc": "South-east residential and storehouse blocks.",
      "points": [[75.28,56.95],[80.42,57.84],[81.26,65.16],[79.08,68.57],[70.99,63.54]]
    },
    "district-2": {
      "id": "district-2",
      "name": "Uchiha District",
      "desc": "Former police-run clan quarter. Includes Nakano Shrine, training courts, and surviving residences; treat as quiet/solemn post-massacre.",
      "tags": ["clan","historic","security"],
      "points": [[39.25,33.54],[52.18,38.78],[51.87,30.1],[50.31,29.93],[50.31,25.18],[51.71,24.69],[52.02,23.38],[49.84,23.38]]
    },
    "district-3": {
      "id": "district-3",
      "name": "Hokage Administrative Ward",
      "desc": "Hokage Tower, mission assignment desk, council chamber, and civil records counters. Administrative heart of the village.",
      "tags": ["administration","civic"],
      "points": [[41.12,31.03],[39,29.7],[37.2,31.48],[37.52,32.81],[31.49,30.14],[32.34,28.7],[34.03,29.59],[36.04,27.59],[34.77,26.14],[36.88,24.03],[44.29,27.81]]
    },
    "district-4": {
      "id": "district-4",
      "name": "Ninja Academy & Grounds",
      "desc": "Primary shinobi school with classrooms, track, target ranges, and practice yards.",
      "tags": ["education","training"],
      "points": [[53.38,39.71],[65.34,52.06],[62.9,36.04]]
    },
    "district-8": {
      "id": "district-8",
      "name": "ANBU Headquarters",
      "desc": "Covert ops briefing bunker, armory, rooftop ingress. Nondescript exterior; high security.",
      "tags": ["security"],
      "points": [[52.96,40.27],[53.17,47.16],[55.29,47.16],[55.5,50.28],[62.48,50.28]]
    },
    "district-10": {
      "id": "district-10",
      "name": "Military Police Force HQ",
      "desc": "Intake desk, holding cells, and archives. Historic ties to Uchiha; current police garrison.",
      "tags": ["security","administration"],
      "points": [[53.81,53.39],[58.78,61.74],[64.91,53.28]]
    },
    "district-11": {
      "id": "district-11",
      "name": "Library & Archives (Civil)",
      "desc": "Public stacks, reading rooms, and map/archive vault distinct from ninja intel records.",
      "tags": ["civic","education"],
      "points": [[40.9,52.61],[48.41,52.5],[48.52,51.84],[50,51.95],[50.53,50.39],[52.33,49.83],[52.33,40.71]]
    },
    "district-12": {
      "id": "district-12",
      "name": "Medical Research Institute",
      "desc": "Labs for antidotes, poisons, and medical ninjutsu; attached herbarium and cold rooms.",
      "tags": ["medical","research"],
      "points": [[39.11,36.71],[41.01,36.6],[40.69,35.04],[51.27,39.71],[46.09,46.27],[39.85,45.16]]
    },
    "district-13": {
      "id": "district-13",
      "name": "Scientific Ninja Tools Lab",
      "desc": "R&D bays for ninja tech prototypes with fenced test yard and secure storage.",
      "tags": ["research","science","security"],
      "points": [[52.75,23.25],[53.81,22.69],[55.5,24.36],[54.87,25.47],[56.24,28.14],[57.72,26.36],[59.73,28.03],[60.68,31.26],[61.85,32.93],[61.21,33.82],[61.42,35.26],[53.07,39.15]]
    },
    "district-14": {
      "id": "district-14",
      "name": "Restaurant Row (Ichiraku / Yakiniku Q)",
      "desc": "Food district anchored by Ichiraku Ramen and Yakiniku Q; dessert stalls and tea houses nearby.",
      "tags": ["commerce","food","landmark"],
      "points": [[28.53,43.6],[37.94,34.71],[38.89,45.05]]
    },
    "district-15": {
      "id": "district-15",
      "name": "Central Bazaar (Market II)",
      "desc": "Crowded market streets with tool vendors, produce, and festival booths.",
      "tags": ["commerce","market"],
      "points": [[22.08,34.82],[32.65,38.6],[37.84,33.7],[25.14,28.59]]
    },
    "district-16": {
      "id": "district-16",
      "name": "Fire Plaza & Market I",
      "desc": "Civic festival square honoring the Land of Fire; parade route and seasonal stalls.",
      "tags": ["commerce","civic","events"],
      "points": [[21.76,35.71],[19.33,42.27],[27.68,43.49],[30.33,40.71],[28,39.49],[28.11,38.04]]
    },
    "district-17": {
      "id": "district-17",
      "name": "Craftsmen & Weaponers’ Street",
      "desc": "Smithies, armorers, repair shops, and general shinobi-tools retail.",
      "tags": ["commerce","industry"],
      "points": [[19.22,43.27],[18.37,51.95],[26.84,44.27]]
    },
    "district-18": {
      "id": "district-18",
      "name": "Inn & Hot Springs Quarter",
      "desc": "Ryokan, bathhouses, tea gardens; best sited near water feed and outer road.",
      "tags": ["commerce","leisure","hospitality"],
      "points": [[19.22,52.5],[28.11,44.49],[32.97,44.94],[31.38,52.5]]
    },
    "district-19": {
      "id": "district-19",
      "name": "Artisan Row (Calligraphy–Textiles–Ceramics)",
      "desc": "Studios, kilns, dye works, and paper/calligraphy ateliers with service alleys.",
      "tags": ["commerce","arts"],
      "points": [[33.82,45.16],[32.65,52.39],[39.53,52.61],[39.32,48.16],[37.52,47.83],[37.41,45.72]]
    },
    "district-20": {
      "id": "district-20",
      "name": "Jōnin Residential Quarter",
      "desc": "Low-density homes with private dojos, messenger perches, and secure courtyards.",
      "tags": ["residential"],
      "points": [[39.63,45.94],[40.16,51.84],[45.35,46.83]]
    },
    "district-21": {
      "id": "district-21",
      "name": "Chūnin/Genin Housing",
      "desc": "Mid-density housing blocks with shared yards and small practice nooks.",
      "tags": ["residential"],
      "points": [[19.11,53.28],[21.55,53.06],[21.76,54.84],[23.77,54.73],[23.87,53.17],[31.17,53.28],[26.1,60.07]]
    },
    "district-22": {
      "id": "district-22",
      "name": "Civilian North Ward",
      "desc": "Civilian homes, corner shops, and a small elementary school; quiet streets.",
      "tags": ["residential","civic"],
      "points": [[18.59,54.28],[20.91,64.4],[25.25,60.96]]
    },
    "district-23": {
      "id": "district-23",
      "name": "Civilian East Ward",
      "desc": "Civilian neighborhood with pocket parks and local services.",
      "tags": ["residential","civic"],
      "points": [[26.62,60.62],[31.38,65.18],[34.03,60.96],[28.95,57.84]]
    },
    "district-24": {
      "id": "district-24",
      "name": "Civilian South Ward",
      "desc": "Civilian neighborhood near southern arterials; mixed small commerce.",
      "tags": ["residential","civic"],
      "points": [[29.9,56.95],[34.24,59.84],[39,53.28],[32.44,53.5]]
    },
    "district-25": {
      "id": "district-25",
      "name": "Civilian West Ward",
      "desc": "Civilian neighborhood close to forest edge; community garden plots.",
      "tags": ["residential","civic"],
      "points": [[39.85,53.73],[42.28,57.51],[39.21,61.07],[36.78,61.62],[35.4,60.73]]
    },
    "district-27": {
      "id": "district-27",
      "name": "Orphanage & Relief House",
      "desc": "Dormitories, clinic, storerooms; quiet street frontage with guarded play yard.",
      "tags": ["civic","medical","welfare"],
      "points": [[40.9,53.5],[43.23,57.17],[50.74,53.39]]
    },
    "district-28": {
      "id": "district-28",
      "name": "Training Grounds District (3/7/24 Cluster)",
      "desc": "Riverside posts and shaded spar fields used by multiple teams (incl. Team 7 sites).",
      "tags": ["training","park"],
      "points": [[41.96,59.73],[43.12,58.06],[51.27,54.39],[52.54,55.06],[53.17,62.96],[52.43,62.63],[51.9,61.4],[50,60.96],[49.26,59.96],[44.92,58.95]]
    },
    "district-29": {
      "id": "district-29",
      "name": "Forest-of-Death Gate Annex",
      "desc": "Permit office, medical checkpoint, and supply sheds controlling access to Training Ground 44.",
      "tags": ["security","training","restricted"],
      "points": [[53.28,54.73],[53.7,62.85],[58.36,63.96],[58.14,62.07]]
    },
    "district-30": {
      "id": "district-30",
      "name": "Waterworks & Canal Bridges",
      "desc": "Pump houses, sluice controls, and bridge depots managing village waterways.",
      "tags": ["infrastructure"],
      "points": [[37.84,71.75],[45.35,79.09],[52.01,72.41]]
    },
    "district-32": {
      "id": "district-32",
      "name": "Gate Garrison (North)",
      "desc": "Inspection offices, barracks, stables, and courier post at the north gate.",
      "tags": ["security","infrastructure"],
      "points": [[53.81,72.53],[54.02,86.76],[61.74,78.53],[60.26,72.53]]
    },
    "district-33": {
      "id": "district-33",
      "name": "Gate Garrison (East)",
      "desc": "Inspection offices, barracks, stables, and courier post at the east gate.",
      "tags": ["security","infrastructure"],
      "points": [[61.21,71.97],[62.8,78.09],[65.97,75.31],[64.38,75.53],[63.22,74.75],[63.43,73.41],[64.7,72.86],[66.5,71.64]]
    },
    "district-34": {
      "id": "district-34",
      "name": "Gate Garrison (South)",
      "desc": "Inspection offices, barracks, stables, and courier post at the south gate.",
      "tags": ["security","infrastructure"],
      "points": [[54.23,71.52],[66.61,70.63],[67.88,68.97],[64.49,64.74],[59.2,66.41]]
    },
    "district-36": {
      "id": "district-36",
      "name": "Watchtower / Inner Rampart Line",
      "desc": "Linear watchposts and signaling towers tied into patrol routes along main boulevards.",
      "tags": ["security","infrastructure"],
      "points": [[53.49,64.74],[55.92,65.18],[58.46,65.18],[58.36,66.18],[53.91,70.63]]
    },
    "district-37": {
      "id": "district-37",
      "name": "Museum / Memorial Corridor",
      "desc": "Shinobi-history exhibits and small theatre connecting to village memorials.",
      "tags": ["civic","historic","arts"],
      "points": [[65.55,63.96],[68.51,68.41],[69.36,66.63],[72.53,65.07],[70.2,63.4],[74.86,56.84],[76.76,56.62],[76.44,53.62],[69.67,58.4]]
    },
    "district-38": {
      "id": "district-38",
      "name": "Hokage Monument Hillside / Quarry Works",
      "desc": "Maintenance yards, lift access, and sculpting platforms for the Monument; stone quarry remnants.",
      "tags": ["infrastructure","historic"],
      "points": [[77.39,53.39],[77.71,56.62],[80.36,57.17],[81.1,59.29],[87.13,53.17],[83.21,53.39],[83.21,54.73],[81.41,54.95],[80.89,53.5]]
    },
    "district-39": {
      "id": "district-39",
      "name": "Zoo & Aviary",
      "desc": "Small shinobi-creature enclosures and messenger-bird aviary linked to nearby parks.",
      "tags": ["park","civic","education"],
      "points": [[81.52,61.96],[83.38,61.02],[82.79,59.29],[87.34,54.51],[86.39,61.62],[82.67,70.78],[79.72,68.63],[81.94,65.29]],
      "color": "#22d3ee"
    },
    "Yamanaka": {
      "id": "Yamanaka",
      "name": "Yamanaka District",
      "desc": "Florists and family homes near the south gate.",
      "points": [[54.55,87.61],[66.21,76.04],[69.38,83.43],[61.36,86.68]],
      "color": "#22d3ee"
    },
    "Cemetery": {
      "id": "Cemetery",
      "name": "Cemetery District",
      "desc": "Cemetery District",
      "points": [[30.68,78.87],[36.6,71.34],[45,79.99],[39.88,85.47]],
      "color": "#22d3ee"
    },
    "Aburame": {
      "id": "Aburame",
      "name": "Aburame District",
      "desc": "South-west quarter by the canal and gardens.",
      "points": [[21.2,65.38],[26.26,61.11],[28.12,63.44],[32.36,67.43],[36.34,71.34],[30.24,78.59],[25.84,73.52],[22.96,69.67]],
      "color": "#22d3ee"
    },
    "district-5": {
      "id": "district-5",
      "name": "Chūnin Exam Stadium & Arena Ward",
      "desc": "Tournament arena with concourses, warm‑up rings, and crowd logistics; doubles as disaster drill venue.",
      "tags": ["training","events","infrastructure"],
      "points": [[63.54,35.82],[65.13,45.83],[73.27,43.94],[71.68,40.04],[82.4,31.26],[80.81,28.38],[67.77,37.37],[64.7,35.26]]
    },
    "district-7": {
      "id": "district-7",
      "name": "T&I + Intelligence Division",
      "desc": "Interrogation wing, analysis rooms, evidence vaults. Restricted access; pairs with mission intel.",
      "tags": ["security","administration"],
      "points": [[74.01,44.83],[73.06,44.83],[72.09,52.71],[87.9,52.62],[87.85,48.05],[76.87,49.5]],
      "color": "#22d3ee"
    },
    "district-6": {
      "id": "district-6",
      "name": "Konoha Hospital & Medical Corps",
      "desc": "Emergency wards, chakra treatment floors, surgical theatres, blood bank, and rooftop messenger posts.",
      "tags": ["medical"],
      "points": [[65.07,46.61],[65.99,52.76],[71.71,52.83],[72.21,45.05]],
      "color": "#22d3ee"
    },
    "district-9": {
      "id": "district-9",
      "name": "Foundation (Root) Sublevels",
      "desc": "Decommissioned underground training and storage levels once used by Root. Marked restricted/defunct.",
      "tags": ["security","historic","restricted"],
      "points": [[64.91,52.73],[53.91,52.5],[48.21,52.56],[50.23,51.96],[50.65,50.38],[54.51,50.36],[63.12,50.5]],
      "color": "#22d3ee"
    },
    "district-31": {
      "id": "district-31",
      "name": "Storage & Armory Depots",
      "desc": "Sealed arsenals and ration warehouses with messenger-hawk lofts.",
      "tags": ["infrastructure","security"],
      "points": [[40.32,85.68],[53.28,88.38],[53.17,83.76],[51.59,83.54],[51.48,81.31],[52.86,81.09],[52.86,72.75]],
      "color": "#22d3ee"
    },
    "district-35": {
      "id": "district-35",
      "name": "Gate Garrison (West)",
      "desc": "Inspection offices, barracks, stables, and courier post at the west gate.",
      "tags": ["security","infrastructure"],
      "points": [[35.16,69.56],[36.77,71.14],[52.86,71.41],[52.75,64.4],[51.69,64.18],[46.09,64.96],[44.57,67.61]],
      "color": "#22d3ee"
    },
    "residential1": {
      "id": "residential1",
      "name": "residential1",
      "desc": "",
      "points": [[25.96,28.23],[30.54,30.18],[39.46,20.21],[35.22,19.75],[30.87,22.75]]
    },
    "residential2": {
      "id": "residential2",
      "name": "residential2",
      "desc": "",
      "points": [[37.41,23.53],[44.89,27.43],[45.55,26.77],[44.45,25.65],[46.39,23.46],[47.86,24.5],[49.69,23.15],[46.68,22.07],[45.91,22.8],[43.24,21.95],[43.24,19.49],[40.93,19.79],[41,21.3],[39.98,21.84],[38.22,22.34]]
    },
    "residential3": {
      "id": "residential3",
      "name": "residential3",
      "desc": "",
      "points": [[54.46,22.39],[59.59,27.16],[58.53,23.11],[60.02,15.48],[59.04,15.17],[58.79,17.09],[58.32,18.2],[57.9,19.23],[57.09,20.3],[56.24,21.14]]
    },
    "residential4": {
      "id": "residential4",
      "name": "residential4",
      "desc": "",
      "points": [[47.55,19.81],[47.59,21.95],[49.75,22.97],[52.21,23.02],[53.83,22.21],[55.9,20.97],[57.81,18.74],[56.67,18.47],[56.5,17.67],[55.27,17.89],[55.1,18.87],[54.59,19.85],[53.53,20.79],[52.38,21.41],[50.52,21.59],[49.8,20.83]]
    },
    "district-26": {
      "id": "district-26",
      "name": "Barrier Team & Sensor Corps HQ",
      "desc": "Barrier control hall, sensor dojo, and roof pylons for village-wide seals.",
      "tags": ["security","research"],
      "points": [[34.66,61.51],[35.84,62.3],[33.92,64.76],[34.64,69.09],[31.83,65.76]],
      "color": "#22d3ee"
    },
    "residential5": {
      "id": "residential5",
      "name": "residential5",
      "desc": "",
      "points": [[35.74,68.89],[34.5,67.63],[34.12,65.37],[35.26,63.5],[36.46,62.5],[37.66,63.5],[38.09,63.5],[38.28,62.9],[39.28,61.99],[41.34,59.88],[44.88,59.18],[48.99,60.13],[49.9,61.14],[51.82,61.89],[51.53,64.11],[46.08,64.66],[44.35,67.43]]
    },
    "residential6": {
      "id": "residential6",
      "name": "residential6",
      "desc": "",
      "points": [[63.58,62.7],[62.63,62.29],[62.24,61.43],[62.5,60.03],[63.32,57.9],[63.92,56.09],[65.43,54.28],[66.55,53.87],[67.45,54.1],[68.49,54.69],[68.83,55.32],[69.3,55.82],[69.39,56.59],[69.26,57.13],[68.57,57.77],[67.54,57.86],[66.68,58.49],[65.99,58.85],[65.21,61.34],[64.87,62.25],[64.18,62.66]]
    }
  },
  "roads": [
    {"id":"road-1","name":"","type":"street","width":5,"points":[[18.67,52.96],[87.59,52.88]]},
    {"id":"road-2","name":"","type":"street","width":3,"points":[[52.22,23.08],[53.48,87.43]]},
    {"id":"road-3","name":"","type":"street","width":3,"points":[[53.97,87.43],[87.87,53.33]]},
    {"id":"road-4","name":"","type":"street","width":3,"points":[[53.06,87.57],[18.67,53.48]]},
    {"id":"road-5","name":"","type":"street","width":3,"points":[[18.67,52.37],[49.96,23.08]]},
    {"id":"road-6","name":"","type":"street","width":3,"points":[[53.9,22.49],[87.73,52.37]]},
    {"id":"road-7","name":"","type":"street","width":3,"points":[[25.7,28.33],[52.5,39.64]]},
    {"id":"road-8","name":"","type":"street","width":3,"points":[[38.36,34.1],[39.84,52.74]]},
    {"id":"road-9","name":"","type":"street","width":3,"points":[[40.19,52.74],[52.22,40.46]]},
    {"id":"road-10","name":"","type":"street","width":3,"points":[[52.85,39.72],[80.42,28.25]]},
    {"id":"road-11","name":"","type":"street","width":3,"points":[[62.98,35.65],[65.72,52.81]]},
    {"id":"road-12","name":"","type":"street","width":3,"points":[[65.44,52.74],[52.78,39.87]]},
    {"id":"road-13","name":"","type":"street","width":4,"points":[[72.54,44.53],[71.84,52.81]]},
    {"id":"road-14","name":"","type":"street","width":3,"points":[[64.73,46.23],[73.74,44.45]]},
    {"id":"road-15","name":"","type":"street","width":3,"points":[[76.83,53.03],[76.76,53.18],[79.5,75]]},
    {"id":"road-16","name":"","type":"street","width":3,"points":[[58.9,66.12],[53.41,71.6]]},
    {"id":"road-17","name":"","type":"street","width":3,"points":[[58.83,66.27],[58.69,62.43],[53.55,54.14]]},
    {"id":"road-18","name":"","type":"street","width":4,"points":[[58.9,62.28],[65.51,53.03]]},
    {"id":"road-19","name":"","type":"street","width":3,"points":[[59.04,66.2],[64.8,63.83],[69.59,57.99],[76.62,53.25]]},
    {"id":"road-20","name":"","type":"street","width":3,"points":[[39.98,85.43],[52.99,72.19],[37.31,71.45]]},
    {"id":"road-21","name":"","type":"street","width":3,"points":[[30.34,78.85],[36.53,71.52]]},
    {"id":"road-22","name":"","type":"street","width":3,"points":[[20.85,65.09],[25.91,61.02],[31.75,53.18],[33.3,44.75]]},
    {"id":"road-23","name":"","type":"street","width":3,"points":[[18.88,42.6],[45.96,46.67]]},
    {"id":"road-24","name":"","type":"street","width":3,"points":[[21.27,34.99],[32.73,38.98]]},
    {"id":"road-25","name":"","type":"street","width":3,"points":[[85.34,64.57],[79.86,69.08],[66.21,71.52],[53.62,71.97]]},
    {"id":"road-26","name":"","type":"street","width":3,"points":[[60.58,71.89],[62.34,78.4]]},
    {"id":"road-27","name":"","type":"street","width":3,"points":[[38.15,21.89],[30.9,30.25]]},
    {"id":"road-28","name":"","type":"street","width":3,"points":[[44.69,27.66],[36.88,23.74]]},
    {"id":"road-29","name":"","type":"street","width":3,"points":[[59.04,15.61],[76.2,36.02]]}
  ],
  "poi": [
    {"id":"gate-e","name":"East Gate","type":"gate","x":88.86,"y":52.88,"desc":"Eastern entrance."},
    {"id":"gate-s","name":"South Gate","type":"gate","x":53.48,"y":88.83,"desc":"Southern entrance."},
    {"id":"gate-w","name":"West Gate","type":"gate","x":17.75,"y":53.03,"desc":"Western entrance."},
    {"id":"A","name":"A — Fire Plaza / Market I","type":"letter","x":51.58,"y":20.34,"desc":"Civic plaza."},
    {"id":"B","name":"B — Market II (Central)","type":"letter","x":52.92,"y":53.03,"desc":"Central market."},
    {"id":"C2","name":"C — Parklands (East Channel)","type":"park","x":66.63,"y":56.51,"desc":"Riverside paths."},
    {"id":"C3","name":"C — Neighborhood Park (NW)","type":"park","x":38.36,"y":65.24,"desc":"Inner-ward park."},
    {"id":"D","name":"D — Cemetery & Memorial","type":"park","x":35.12,"y":80.4,"desc":"Memorial stone grounds."},
    {"id":"1","name":"Hokage Palace","type":"poi","x":51.37,"y":17.16,"desc":"Konohagakure Hokage Palace"},
    {"id":"3","name":"Root","type":"gate","x":56.15,"y":16.13,"desc":""},
    {"id":"4","name":"Uchiha Lake","type":"gate","x":37.43,"y":20.29,"desc":""},
    {"id":"2","name":"Academy & Training Ground","type":"gate","x":46.17,"y":20.48,"desc":""},
    {"id":"7","name":"Hospital & Greenhouse","type":"gate","x":46.29,"y":25.26,"desc":""},
    {"id":"11","name":"Arena","type":"gate","x":39.32,"y":31.66,"desc":""},
    {"id":"5","name":"Uchiha Training Ground","type":"gate","x":29.58,"y":25.83,"desc":""},
    {"id":"6","name":"Museum | Library","type":"gate","x":34.32,"y":27.9,"desc":""},
    {"id":"12","name":"ANBU Outpost","type":"gate","x":22.91,"y":54.21,"desc":""},
    {"id":"12","name":"ANBU Outpost","type":"gate","x":54.41,"y":48.77,"desc":""},
    {"id":"12","name":"ANBU Outpost","type":"gate","x":82.3,"y":54.42,"desc":""},
    {"id":"12","name":"ANBU Outpost","type":"gate","x":52.28,"y":82.44,"desc":""},
    {"id":"8","name":"Hotel","type":"gate","x":51.66,"y":25.97,"desc":""},
    {"id":"9","name":"ANBU Headquarters","type":"gate","x":51.43,"y":28.14,"desc":""},
    {"id":"10","name":"Research Facility","type":"gate","x":56.21,"y":26.03,"desc":""}
  ],
  "walls": [
    {"id":"wall-1","name":"","desc":"","cx":52.78,"cy":51.04,"r":35.609685480217316,"width":8}
  ],
  "rivers": [
    {
      "id": "river-1",
      "points": [[0.06,86.5],[0.51,86.31],[0.78,86.03],[1.15,85.93],[1.51,85.55],[1.87,85.36],[2.23,85.36],[2.59,85.27],[2.95,85.17],[3.5,85.17],[4.04,85.17],[4.4,85.17],[4.94,84.98],[5.3,84.89],[5.85,84.79],[6.39,84.7],[6.75,84.7],[7.11,84.6],[7.56,84.41],[7.92,84.32],[8.2,83.94],[8.2,83.46],[8.2,82.98],[8.47,82.6],[8.65,82.22],[8.92,81.94],[9.1,81.56],[9.28,81.27],[9.55,80.99],[9.82,80.8],[10,80.42],[10.27,80.13],[10.46,79.75],[10.73,79.47],[11,79.28],[11.36,79.09],[11.63,78.9],[12.17,78.71],[12.81,78.42],[13.08,78.14],[13.44,77.85],[13.71,77.57],[13.98,77.38],[14.25,77.19],[14.43,76.9],[14.7,76.52],[15.06,76.43],[15.61,76.24],[16.15,76.05],[16.51,75.95],[16.96,75.76],[17.42,75.48],[18.05,75],[18.68,74.62],[19.04,74.33],[19.49,73.95],[20.04,73.57],[20.31,73.29],[20.58,73.1],[20.94,73],[21.3,73],[21.66,73],[22.02,73],[22.57,73],[22.93,73],[23.38,73],[23.74,73],[24.19,73],[24.65,73],[25.19,73],[25.73,72.91],[26.27,72.91],[26.82,72.81],[27.18,72.72],[27.54,72.62],[27.9,72.53],[28.26,72.43],[28.98,72.24],[29.35,72.15],[29.98,72.05],[30.43,71.96],[30.88,71.96],[31.24,71.86],[31.7,71.67],[32.15,71.58],[32.51,71.48],[32.87,71.39],[33.14,71.1],[33.59,70.63],[34.05,70.06],[34.23,69.77],[34.32,69.39],[34.59,69.11],[34.68,68.82],[34.86,68.54],[35.13,68.35],[35.4,68.06],[35.76,67.97],[36.13,67.87],[36.49,67.78],[36.94,67.59],[37.48,67.49],[37.93,67.3],[38.2,67.11],[38.57,66.92],[39.11,66.73],[39.47,66.63],[39.83,66.54],[40.28,66.44],[40.74,66.35],[41.1,66.25],[41.46,66.16],[41.82,66.16],[42.27,66.16],[42.72,66.16],[42.9,65.87],[43.09,65.4],[43.36,65.21],[43.54,64.73],[43.72,64.45],[43.9,64.07],[44.17,63.78],[44.35,63.5],[44.62,63.31],[44.98,63.21],[45.35,63.02],[45.89,63.02],[46.25,63.02],[46.61,63.02],[46.97,63.02],[47.42,63.02],[47.97,63.12],[48.51,63.21],[48.87,63.4],[49.32,63.5],[49.68,63.59],[50.05,63.69],[50.41,63.78],[50.86,63.78],[51.4,63.78],[51.85,63.97],[52.3,64.07],[52.76,64.16],[53.12,64.16],[53.75,64.35],[54.11,64.35],[54.47,64.45],[54.93,64.54],[55.38,64.64],[55.83,64.73],[56.19,64.73],[56.82,64.92],[57.19,64.92],[57.55,64.92],[58,65.02],[58.54,65.02],[59.17,65.02],[59.54,65.02],[60.08,65.02],[60.53,65.02],[60.89,64.83],[60.98,64.54],[61.34,64.26],[61.61,63.88],[62.16,63.5],[62.43,63.31],[62.88,63.02],[62.97,62.64],[63.15,62.26],[63.24,61.88],[63.6,61.6],[63.69,61.31],[63.78,60.84],[63.96,60.55],[64.24,60.08],[64.6,59.6],[64.87,59.22],[64.78,58.65],[64.69,58.17],[64.87,57.89],[65.14,57.51],[65.41,57.32],[65.86,57.22],[66.13,56.94],[66.5,56.65],[66.86,56.37],[67.22,56.27],[67.58,56.18],[68.03,56.18],[68.48,56.18],[68.85,56.08],[69.21,56.08],[69.57,55.99],[70.02,55.89],[70.29,55.7],[71.2,55.51],[71.83,55.42],[72.01,55.13],[72.19,54.85],[72.46,54.56],[72.64,54.28],[72.73,53.99],[72.91,53.61],[73.18,53.14],[73.37,52.85],[73.82,52.47],[74.09,52.19],[74.45,52.09],[74.9,52],[75.35,51.71],[75.63,51.52],[75.9,51.24],[76.35,51.24],[76.8,51.05],[77.34,50.95],[77.7,50.95],[78.16,50.76],[78.61,50.48],[78.97,50.19],[79.24,49.9],[79.51,49.71],[79.78,49.43],[80.05,49.05],[80.33,48.67],[80.51,48.38],[80.42,48],[80.42,47.62],[80.42,47.24],[80.6,46.96],[80.96,46.67],[81.32,46.39],[81.59,46.2],[81.68,45.82],[81.77,45.44],[81.86,45.15],[82.04,44.87],[82.04,44.49],[82.22,44.2],[82.4,43.92],[82.4,43.35],[82.4,42.97],[82.4,42.4],[82.4,41.92],[82.4,41.44],[82.4,41.06],[82.13,40.4],[81.86,39.92],[81.86,39.54],[82.13,39.26],[82.4,38.88],[82.77,38.4],[83.04,38.12],[83.22,37.83],[83.58,37.64],[83.85,37.36],[84.21,37.17],[84.57,36.98],[85.03,36.6],[85.3,36.41],[85.57,36.22],[85.93,36.03],[86.38,35.74],[86.56,35.46],[86.92,35.08],[87.1,34.7],[87.38,34.41],[87.74,34.22],[88.1,34.22],[88.46,34.13],[88.82,34.03],[89.27,34.03],[89.64,33.94],[90,33.94],[90.36,33.84],[90.72,33.56],[91.17,33.17],[91.53,32.79],[91.8,32.51],[92.35,31.84],[92.35,31.37],[92.44,30.99],[92.53,30.42],[92.62,30.13],[92.8,29.66],[93.34,29.18],[93.52,28.9],[93.79,28.61],[93.97,28.23],[94.15,27.66],[94.15,27.19],[94.25,26.9],[94.43,26.24],[94.7,25.76],[94.97,25.29],[95.15,24.9],[95.33,24.43],[95.51,24.05],[95.6,23.67],[95.87,23.29],[96.05,22.91],[96.14,22.53],[96.14,22.15],[96.14,21.77],[96.14,21.39],[96.14,21.01],[96.32,20.53],[96.5,20.25],[96.69,19.96],[96.87,19.68],[97.05,19.39],[97.05,19.01],[97.32,18.54],[97.5,18.25],[97.68,17.97],[97.86,17.68],[97.95,17.3],[98.04,16.73],[98.22,16.35],[98.4,15.97],[98.49,15.59],[98.76,15.11],[98.95,14.64],[99.13,14.26],[99.13,13.88],[99.22,13.59],[99.22,13.12],[99.31,12.83],[99.49,12.45],[99.58,11.98],[99.67,11.6],[99.85,11.22],[99.94,10.93]],
      "width": 7
    }
  ],
  "grass": [],
  "forest": [
    {"id":"forest-1","name":"Forest Zone 1","points":[[74.36,11.37],[91.69,25.22],[99.38,8.67],[99.47,0.67],[87.98,0.3],[76.22,6.9]]},
    {"id":"forest-2","name":"Forest Zone 2","points":[[64.72,15.18],[69.85,14.53],[72.59,15.83],[74.62,18.34],[78.78,20.48],[79.58,22.24],[80.9,23.08],[84.08,26.52],[84.08,28.57],[86.83,32.84],[85.41,34.05],[79.66,25.41],[71.88,18.8]]},
    {"id":"forest-3","name":"Forest Zone 3","points":[[99.73,21.78],[96.55,24.2],[94.16,30.71],[94.16,37.03],[97.26,40.38],[97.17,43.17],[95.58,45.58],[97.17,48.37],[99.73,50.7]]},
    {"id":"forest-4","name":"Forest Zone 4","points":[[86.74,36.56],[89.48,36.84],[90.89,39.17],[91.34,41.49],[91.07,42.89],[91.6,44.65],[90.89,45.96],[90.89,47.63],[92.22,49.58],[92.31,50.51],[91.78,51.26],[90.63,51.81],[89.48,51.91],[89.04,46.14],[88.15,41.77]]},
    {"id":"forest-5","name":"Forest Zone 5","points":[[89.3,54.7],[91.25,56.65],[90.98,58.04],[91.6,59.25],[91.07,60.18],[90.98,61.95],[89.92,63.06],[89.57,65.11],[88.42,66.6],[89.21,67.99],[88.77,69.11],[87.44,70.32],[87.71,72.36],[86.91,73.48],[85.68,73.85],[84.62,74.97],[84.17,76.92],[82.94,77.76],[81.96,79.43],[80.19,79.99],[79.93,82.03],[77.98,82.5],[77.45,84.45],[76.39,85.38],[75.69,85.19],[73.03,86.12],[69.58,87.71],[66.93,89.01],[64.99,90.03],[62.78,91.33],[61.54,92.54],[58.97,91.89],[57.47,93.19],[56.15,92.91],[54.91,89.56],[63.93,87.61],[74.18,82.5],[82.94,72.73],[87.18,64.55]]},
    {"id":"forest-6","name":"Forest Zone 6","points":[[99.91,55.16],[98.76,55.53],[98.76,56.56],[97.17,56.93],[96.91,58.51],[97.35,59.53],[96.73,60.46],[96.64,61.95],[97.52,64.27],[97.44,65.3],[96.46,65.76],[96.02,66.78],[94.78,67.71],[94.61,69.39],[92.93,73.66],[92.22,76.73],[92.57,78.13],[91.6,78.13],[91.25,79.62],[89.39,78.5],[87.98,80.92],[84.7,80.64],[83.73,82.41],[79.22,87.33],[76.13,92.17],[71.88,92.35],[70.82,95.33],[65.87,95.24],[64.37,96.54],[59.77,97.47],[57.65,96.35],[55.79,98.49],[54.82,99.7],[99.73,99.79]]},
    {"id":"forest-7","name":"Forest Zone 7","points":[[23.87,74.04],[22.63,75.25],[22.02,77.2],[24.76,79.89],[27.06,82.59],[33.95,86.96],[34.66,89.38],[39.52,89.94],[40.41,89.1],[41.82,89.94],[43.24,89.56],[44.56,91.15],[48.01,92.26],[50.93,92.54],[51.72,91.15],[51.81,89.29],[44.03,88.08],[35.54,84.73],[28.29,79.15]]},
    {"id":"forest-8","name":"Forest Zone 8","points":[[22.46,71.62],[19.19,71.62],[18.57,68.27],[17.15,67.71],[17.24,65.39],[16.27,63.53],[16.45,61.67],[15.74,59.53],[14.15,58.23],[16.8,54.79],[18.3,62.13],[20.42,68.09]]},
    {"id":"forest-9","name":"Forest Zone 9","points":[[51.9,99.89],[50.75,97.65],[46.86,97.38],[45.53,95.42],[43.68,96.72],[42.09,95.52],[41.29,93.56],[38.37,93.94],[37.05,92.45],[34.66,92.73],[33.16,90.96],[30.59,91.05],[29.62,88.91],[27.59,88.26],[26.08,89.19],[25.82,87.98],[24.85,87.8],[24.23,86.87],[23.25,84.73],[21.57,83.99],[20.25,84.64],[20.07,84.08],[19.45,83.99],[19.19,82.59],[17.86,81.85],[17.51,80.92],[15.92,79.43],[14.77,79.8],[13.88,79.24],[11.49,81.85],[9.99,84.26],[9.64,85.47],[4.33,86.78],[3.8,87.8],[2.12,87.05],[0.44,88.17],[0.27,99.61]]},
    {"id":"forest-10","name":"Forest Zone 10","points":[[0.27,84.64],[6.72,82.5],[10.96,76.18],[12.91,74.97],[13.09,72.83],[13.88,70.69],[12.29,66.41],[9.64,61.11],[6.81,54.6],[2.65,52.56],[0.18,52.56]]},
    {"id":"forest-11","name":"Forest Zone 11","points":[[16.71,51.16],[15.38,50.23],[15.12,49.49],[14.41,48.28],[14.77,46.23],[15.3,44.65],[14.5,41.86],[15.92,39.73],[16.89,38.14],[16.89,36.19],[18.21,33.68],[18.92,31.91],[20.78,29.5],[21.31,26.8],[24.23,24.38],[25.73,23.17],[26.08,21.5],[29.44,19.73],[30.24,17.69],[32.54,16.94],[34.39,18.06],[30.33,21.22],[25.64,26.24],[23.08,29.5],[18.92,38.33],[17.33,44.37]]},
    {"id":"forest-12","name":"Forest Zone 12","points":[[0.18,51.16],[7.16,50.51],[10.96,42.61],[13.79,36.66],[14.68,32.38],[23.17,19.08],[21.57,0.76],[0.18,0.49]]}
  ],
  "mountains": []
};