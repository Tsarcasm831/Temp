import os
import json
import re
import hashlib
import zipfile
from typing import Dict, List, Tuple

# Paths inside the workspace
BASE_DIR = os.path.join("FishGame", "assets", "json")
ZIP_OUT = os.path.join("FishGame", "assets", "naruto_spawn_by_location_depth_THEMED.zip")
BASE_URL = "https://www.lordtsarcasm.com/NarutoGame/fishing/json"

# Ensure base dir exists
os.makedirs(BASE_DIR, exist_ok=True)

# 50-fish dataset (compact but faithful to provided structure)
fish_json = r'''
[
  {"name":"Minnow","themeName":"Leafling Minnow","depthRange":"0–10m","description":"Tiny, slender freshwater fish with silver scales and translucent fins.","visualNotes":"gill markings arranged like a tiny leafy swirl; faint green chakra shimmer along the dorsal ridge; fast darting silhouette.","chakraAffinity":"water","clanMarkings":"small leaf-swirl near gill","spawnLocations":["Konoha Riverbank","Hidden Leaf Riverbank","Far Haven Creek"],"rarity":"Common","biomes":["freshwater","river","lake"],"weightKg":{"min":0.01,"max":0.1},"baseValue":{"min":1,"max":3}},
  {"name":"Bluegill","themeName":"Blueguard Sunfish","depthRange":"0–20m","description":"Small round-bodied sunfish with a blue sheen.","visualNotes":"cheek patch like a tiny protective plate (like a shinobi guard); orange belly that pulses when excited.","chakraAffinity":"water","clanMarkings":"single vertical stripe behind pectoral fin","spawnLocations":["Konoha Shrine Pond","Konoha Garden Pools"],"rarity":"Common","biomes":["freshwater","lake","pond"],"weightKg":{"min":0.2,"max":1},"baseValue":{"min":2,"max":5}},
  {"name":"Carp","themeName":"Bronze Koi of the Gate","depthRange":"0–25m","description":"Large-bodied fish with bronze-gold scales.","visualNotes":"long flowing dorsal like a ceremonial sash; barbels end in tiny knot motifs; chest scales engraved with faint seal lines.","chakraAffinity":"earth","clanMarkings":"two parallel crest lines across scales","spawnLocations":["Konoha Shrine Pond","Konoha Shrine Pond"],"rarity":"Common","biomes":["freshwater","river","lake"],"weightKg":{"min":1,"max":15},"baseValue":{"min":3,"max":10}},
  {"name":"Perch","themeName":"Stripeguard Perch","depthRange":"5–30m","description":"Medium fish with green-gold scales and dark vertical bars.","visualNotes":"bars resemble wrapped bandages; spiny dorsal looks like a tiny kunai row; compact combat silhouette.","chakraAffinity":"wind","clanMarkings":"three dark vertical bars","spawnLocations":["River Training Pools","Hidden Leaf Stream"],"rarity":"Common","biomes":["freshwater","river","lake"],"weightKg":{"min":0.2,"max":2},"baseValue":{"min":3,"max":7}},
  {"name":"Bass","themeName":"Oakjaw Bass","depthRange":"5–40m","description":"Robust fish with large mouth and olive-green body.","visualNotes":"broad jaw with subtle carved markings that mimic an armor plate; dark horizontal stripe looks like a headband band.","chakraAffinity":"earth","clanMarkings":"horizontal sash stripe","spawnLocations":["Konoha Riverbank","Hidden Leaf Reservoir"],"rarity":"Common","biomes":["freshwater","lake","river"],"weightKg":{"min":0.5,"max":6},"baseValue":{"min":5,"max":12}},
  {"name":"Trout","themeName":"Streamblade Trout","depthRange":"10–50m","description":"Streamlined fish with spotted scales and a pink streak.","visualNotes":"sleek flow lines down the flank like a blade’s shimmer; spots look like inked hand seals.","chakraAffinity":"water","clanMarkings":"dotted hand-seal pattern along flank","spawnLocations":["Coldwater Rapids","Konoha Upper Stream"],"rarity":"Common","biomes":["freshwater","river","cold_water"],"weightKg":{"min":0.3,"max":5},"baseValue":{"min":4,"max":10}},
  {"name":"Salmon","themeName":"Tidewalker Salmon","depthRange":"0–50m","description":"Sleek silver fish with a hooked jaw.","visualNotes":"glistening scales that refract chakra light; faint migrating band like an expedition sash.","chakraAffinity":"water","clanMarkings":"migration band across midbody","spawnLocations":["Konoha Estuary","Hidden Leaf Estuary","Anadromous Run"],"rarity":"Uncommon","biomes":["anadromous","freshwater","coastal"],"weightKg":{"min":1,"max":15},"baseValue":{"min":8,"max":25}},
  {"name":"Pike","themeName":"Spearjaw Pike","depthRange":"10–60m","description":"Long torpedo predator with sharp teeth.","visualNotes":"pointed snout like a thrown spear; skin mottled like hunter camouflage; fins edged in dark lacquer.","chakraAffinity":"lightning","clanMarkings":"spear-stripe along snout","spawnLocations":["Hidden Leaf Hunting Waters","Marsh Outskirts"],"rarity":"Uncommon","biomes":["freshwater","river","lake"],"weightKg":{"min":1,"max":20},"baseValue":{"min":10,"max":30}},
  {"name":"Catfish","themeName":"Whisker Sentinel","depthRange":"10–100m","description":"Bottom-dweller with whisker-like barbels.","visualNotes":"barbels resemble braided ropes; flat head with low lantern-like pores; armored cheek plates for digging.","chakraAffinity":"earth","clanMarkings":"braided whisker knots","spawnLocations":["Riverbed Channels","Far Haven Mudflats"],"rarity":"Common","biomes":["freshwater","demersal","riverbed"],"weightKg":{"min":1,"max":50},"baseValue":{"min":5,"max":15}},
  {"name":"Tilapia","themeName":"Sunplate Tilapia","depthRange":"0–40m","description":"Rounded freshwater fish with silver-gray scales.","visualNotes":"rounded fins like decorative plates; subtle ring pattern behind head like a clan crest.","chakraAffinity":"yang","clanMarkings":"crescent ring near dorsal","spawnLocations":["Village Ponds","Far Haven Aquaculture"],"rarity":"Common","biomes":["freshwater","lake","pond"],"weightKg":{"min":0.5,"max":3},"baseValue":{"min":3,"max":8}},
  {"name":"Anchovy","themeName":"Fleet Anchovy","depthRange":"0–150m","description":"Tiny silver schooling fish with large eyes.","visualNotes":"school forms tight arrow patterns; each fish has a tiny dark triangular tail mark like a thrown shuriken.","chakraAffinity":"wind","clanMarkings":"tiny tail triangle","spawnLocations":["Coastal Shoals","Open Ocean Schools"],"rarity":"Common","biomes":["pelagic","coastal","open_ocean"],"weightKg":{"min":0.02,"max":0.1},"baseValue":{"min":1,"max":2}},
  {"name":"Snapper","themeName":"Crimson Snapper","depthRange":"10–150m","description":"Red-hued saltwater fish with strong jaws.","visualNotes":"red scales arranged like battle armor plates; jaw with faint tooth-rune motifs.","chakraAffinity":"fire","clanMarkings":"single fin crest with flame curl","spawnLocations":["Reef Outcrops","Sand Shelf Edges"],"rarity":"Uncommon","biomes":["reef","coastal","demersal"],"weightKg":{"min":1,"max":14},"baseValue":{"min":12,"max":35}},
  {"name":"Mackerel","themeName":"Stormstripe Mackerel","depthRange":"10–200m","description":"Fast fish with iridescent blue-green stripes.","visualNotes":"horizontal lightning-like stripes; streamlined for sudden bursts; dorsal fin like a finned blade.","chakraAffinity":"lightning","clanMarkings":"zigzag stripe","spawnLocations":["Open Ocean Currents","Konoha Offshore"],"rarity":"Common","biomes":["pelagic","open_ocean"],"weightKg":{"min":0.2,"max":3},"baseValue":{"min":3,"max":7}},
  {"name":"Sardine","themeName":"Silvercluster Sardine","depthRange":"0–200m","description":"Small schooling fish with shiny silver body.","visualNotes":"reflective flank used to flash signals; schools form spirals like training seals.","chakraAffinity":"water","clanMarkings":"row of micro-scales that glitter","spawnLocations":["Coastal Shoals","Open Ocean Flats"],"rarity":"Common","biomes":["pelagic","coastal"],"weightKg":{"min":0.05,"max":0.2},"baseValue":{"min":1,"max":3}},
  {"name":"Eel","themeName":"Shadowcoil Eel","depthRange":"20–200m","description":"Long, snake-like body with slimy skin.","visualNotes":"skin shimmers with dark ink bands; lateral line glows faintly when charging chakra; body poses like coiled rope.","chakraAffinity":"yin","clanMarkings":"coil pattern along length","spawnLocations":["Rocky Reefs","Cavern Mouths","Konoha Coastal Grotto"],"rarity":"Uncommon","biomes":["coastal","demersal","rocky_reefs"],"weightKg":{"min":0.5,"max":10},"baseValue":{"min":10,"max":25}},
  {"name":"Herring","themeName":"Mirror Herring","depthRange":"0–300m","description":"Shimmering silver schooling fish with large eyes.","visualNotes":"big reflective flanks used by shinobi scouts to flash signals; elliptical school shapes.","chakraAffinity":"wind","clanMarkings":"subtle reflective band","spawnLocations":["Open Ocean","Migratory Lanes"],"rarity":"Common","biomes":["pelagic","coastal","open_ocean"],"weightKg":{"min":0.1,"max":0.5},"baseValue":{"min":2,"max":5}},
  {"name":"Grouper","themeName":"Stoneguard Grouper","depthRange":"20–300m","description":"Massive-bodied fish with mottled brown pattern.","visualNotes":"bulk and stone-like scales; mouth like a cave entrance; markings resemble clan sigils carved into rock.","chakraAffinity":"earth","clanMarkings":"mottled rock sigils","spawnLocations":["Reef Caves","Hidden Stone Shelves"],"rarity":"Uncommon","biomes":["reef","demersal","coastal"],"weightKg":{"min":5,"max":200},"baseValue":{"min":20,"max":80}},
  {"name":"Flounder","themeName":"Camoflat Flounder","depthRange":"20–200m","description":"Flat, camouflaged fish with both eyes on one side.","visualNotes":"sandy mottled skin that takes patterns of nearby seals or scrolls; eye pair looks like a tiny mask.","chakraAffinity":"earth","clanMarkings":"masked eye pattern","spawnLocations":["Sandy Bottoms","Shallow Shelves"],"rarity":"Uncommon","biomes":["demersal","coastal","sandy_bottoms"],"weightKg":{"min":0.5,"max":5},"baseValue":{"min":8,"max":20}},
  {"name":"Red Drum","themeName":"Drumcrest Red","depthRange":"5–60m","description":"Copper-red fish with a black spot near the tail.","visualNotes":"single black 'eye' spot like a guardian sigil; scales flash copper when it drums water for alarms.","chakraAffinity":"fire","clanMarkings":"black tail eye","spawnLocations":["Estuaries","Shallow Shelf"],"rarity":"Uncommon","biomes":["coastal","estuary","shallow_shelf"],"weightKg":{"min":1,"max":20},"baseValue":{"min":12,"max":35}},
  {"name":"Barracuda","themeName":"Bladefang Barracuda","depthRange":"0–100m","description":"Long predator with pointed snout and sharp teeth.","visualNotes":"jagged tooth pattern reminiscent of small shuriken; narrow body with high speed lines; dorsal fin like a blade ridge.","chakraAffinity":"lightning","clanMarkings":"tooth silhouette stripe","spawnLocations":["Reef Edges","Open Water"],"rarity":"Rare","biomes":["coastal","pelagic","reef_edges"],"weightKg":{"min":2,"max":25},"baseValue":{"min":25,"max":70}},
  {"name":"Haddock","themeName":"Ridge Haddock","depthRange":"40–450m","description":"Gray-silver fish with a dark lateral line and black spot.","visualNotes":"dark spot above pectoral looks like a checkpoint mark; neat fin geometry for realistic drawing.","chakraAffinity":"water","clanMarkings":"checkpoint dot","spawnLocations":["Cold Slopes","Continental Shelf"],"rarity":"Uncommon","biomes":["demersal","cold_water","continental_slope"],"weightKg":{"min":1,"max":6},"baseValue":{"min":8,"max":18}},
  {"name":"Cod","themeName":"Boreal Cod","depthRange":"50–400m","description":"Chunky-bodied fish with chin barbel and mottled scales.","visualNotes":"chin barbel looks like a trailing rope talisman; broad fins with notch details.","chakraAffinity":"earth","clanMarkings":"subtle notch marks on fins","spawnLocations":["Cold Shelf","Far Haven Northern Banks"],"rarity":"Uncommon","biomes":["demersal","coastal","cold_water"],"weightKg":{"min":2,"max":40},"baseValue":{"min":12,"max":30}},
  {"name":"Sea Bass","themeName":"Nightguard Bass","depthRange":"40–300m","description":"Dark sleek fish with spiny dorsal fin.","visualNotes":"dark back ideal for nighttime stealth scenes; spiny dorsal draws like armor spikes.","chakraAffinity":"yin","clanMarkings":"spine silhouettes","spawnLocations":["Reef Ledges","Coastal Outposts"],"rarity":"Uncommon","biomes":["reef","coastal","demersal"],"weightKg":{"min":1,"max":10},"baseValue":{"min":10,"max":25}},
  {"name":"Pollock","themeName":"Speckled Pollock","depthRange":"50–300m","description":"Silver-gray fish with elongated body and speckled back.","visualNotes":"speckle pattern useful for rock camouflage; soft jawline for quick sketches.","chakraAffinity":"water","clanMarkings":"speckle rows","spawnLocations":["Open Slope","Mid Shelf"],"rarity":"Common","biomes":["demersal","open_ocean"],"weightKg":{"min":1,"max":20},"baseValue":{"min":5,"max":12}},
  {"name":"Marlin","themeName":"Spearwind Marlin","depthRange":"50–500m","description":"Massive predator with a long spear-like bill.","visualNotes":"long bill tapering into a ceremonial blade; cobalt back with streaks like wind scars.","chakraAffinity":"wind","clanMarkings":"blade streaks","spawnLocations":["Open Ocean Currents","Far Haven Blue"],"rarity":"Rare","biomes":["pelagic","open_ocean","surface_to_midwater"],"weightKg":{"min":50,"max":500},"baseValue":{"min":60,"max":200}},
  {"name":"Tuna","themeName":"Crescent Tuna","depthRange":"0–500m","description":"Bullet-shaped fish with metallic blue body and crescent tail.","visualNotes":"distinct crescent tail and ridged finlets provide silhouette recognition; ideal for dynamic action poses.","chakraAffinity":"yang","clanMarkings":"crescent tail band","spawnLocations":["Open Ocean Schools","Konoha Offshore"],"rarity":"Uncommon","biomes":["pelagic","open_ocean","midwater"],"weightKg":{"min":5,"max":300},"baseValue":{"min":20,"max":60}},
  {"name":"Swordfish","themeName":"Bladecrest Swordfish","depthRange":"200–600m","description":"Large predator with long flat sword-like bill.","visualNotes":"flat bill perfect for slicing volumes in dynamic art; dark back with metallic flanks.","chakraAffinity":"lightning","clanMarkings":"edge band on bill","spawnLocations":["Mid-Deep Currents","Offshore Trenches"],"rarity":"Rare","biomes":["pelagic","open_ocean","mid_to_deep"],"weightKg":{"min":50,"max":650},"baseValue":{"min":70,"max":220}},
  {"name":"Halibut","themeName":"Platehal Halibut","depthRange":"100–700m","description":"Huge flatfish with both eyes on one side.","visualNotes":"large camo flanks that look like carved stone plates; underside pale like scroll paper.","chakraAffinity":"earth","clanMarkings":"plate-like mottling","spawnLocations":["Continental Shelf Flats","Deep Shallows"],"rarity":"Rare","biomes":["demersal","coastal","continental_shelf"],"weightKg":{"min":10,"max":300},"baseValue":{"min":50,"max":150}},
  {"name":"Wahoo","themeName":"Bluebolt Wahoo","depthRange":"0–300m","description":"Slender predator with vertical blue stripes.","visualNotes":"vertical lightning stripes, long jaw; drawn with taut muscles for high-speed scenes.","chakraAffinity":"lightning","clanMarkings":"vertical strike lines","spawnLocations":["Surface Currents","Open Ocean"],"rarity":"Rare","biomes":["pelagic","open_ocean","surface"],"weightKg":{"min":2,"max":30},"baseValue":{"min":25,"max":80}},
  {"name":"Dorado (Mahi-Mahi)","themeName":"Aurablade Dorado","depthRange":"0–150m","description":"Vivid green, blue, and gold scales with blunt head.","visualNotes":"bright color gradients perfect for heroic catches; head appears like a helmet crest.","chakraAffinity":"yang","clanMarkings":"aural streak along back","spawnLocations":["Surface Warm Currents","Open Ocean"],"rarity":"Uncommon","biomes":["pelagic","open_ocean","surface"],"weightKg":{"min":1,"max":20},"baseValue":{"min":12,"max":40}},
  {"name":"Lanternfish","themeName":"Glowling Lantern","depthRange":"200–1000m","description":"Small deep-sea fish with glowing photophores along its body.","visualNotes":"rows of photophores like chakra beads; good reference for biolum color maps.","chakraAffinity":"yin","clanMarkings":"biolume bead rows","spawnLocations":["Mesopelagic Drift","Night Trench"],"rarity":"Common","biomes":["midwater","deepsea","mesopelagic"],"weightKg":{"min":0.02,"max":0.1},"baseValue":{"min":2,"max":5}},
  {"name":"Fangtooth","themeName":"Nightfang","depthRange":"200–1000m","description":"Menacing deep-sea predator with oversized fangs.","visualNotes":"oversized canines and huge head — emphasize silhouette; black matte skin to absorb light.","chakraAffinity":"yin","clanMarkings":"tooth crest","spawnLocations":["Bathypelagic Runs","Deep Trench Gorges"],"rarity":"Rare","biomes":["deepsea","mesopelagic","bathypelagic"],"weightKg":{"min":0.5,"max":1.5},"baseValue":{"min":40,"max":100}},
  {"name":"Oarfish","themeName":"Sky-serpent Oarfish","depthRange":"200–1000m","description":"Elongated ribbon-like fish with silver scales and long dorsal crest.","visualNotes":"ancient serpentine body with flowing red dorsal fins like a ceremonial streamer; perfect 'legend' visual.","chakraAffinity":"void","clanMarkings":"long dorsal streamer","spawnLocations":["Open Deep Pelagic","Ancient Trench"],"rarity":"Legendary","biomes":["pelagic","deepsea","open_ocean"],"weightKg":{"min":50,"max":300},"baseValue":{"min":200,"max":500}},
  {"name":"Dragonfish","themeName":"Nightdrake Dragonfish","depthRange":"300–900m","description":"Slender dark fish with glowing lure under chin.","visualNotes":"lure looks like a tiny flame-scroll; narrow body with translucent fins — great for eerie compositions.","chakraAffinity":"yin","clanMarkings":"lure-scroll glow","spawnLocations":["Bathypelagic Midlanes","Dark Channels"],"rarity":"Rare","biomes":["deepsea","bathypelagic","midwater"],"weightKg":{"min":0.2,"max":1},"baseValue":{"min":35,"max":90}},
  {"name":"Hatchetfish","themeName":"Edgehatchet","depthRange":"300–800m","description":"Tiny, flattened body shaped like a hatchet.","visualNotes":"sharp silhouette resembling a throwing tool; silver sheen with upturned eyes — great for stylized linework.","chakraAffinity":"wind","clanMarkings":"edge silhouette","spawnLocations":["Mesopelagic Scatter","Midwater Drift"],"rarity":"Uncommon","biomes":["midwater","deepsea","mesopelagic"],"weightKg":{"min":0.05,"max":0.2},"baseValue":{"min":10,"max":25}},
  {"name":"Barreleye","themeName":"Glasshelm Barreleye","depthRange":"400–900m","description":"Transparent-headed fish with tubular green eyes pointing upward.","visualNotes":"clear cranial dome with green orb eyes — draw internal organs faintly visible for sci-fi aesthetic.","chakraAffinity":"void","clanMarkings":"dome halo","spawnLocations":["Deep Midwater Dome","Upward Lanes"],"rarity":"Epic","biomes":["deepsea","midwater","bathypelagic"],"weightKg":{"min":0.5,"max":2},"baseValue":{"min":100,"max":200}},
  {"name":"Viperfish","themeName":"Nightneedle Viper","depthRange":"400–1000m","description":"Needle-like predator with long fangs and bioluminescent spots.","visualNotes":"exaggerated fang silhouettes and glowing side spots — great for dramatic low-light renders.","chakraAffinity":"yin","clanMarkings":"biolume speck rows","spawnLocations":["Deepwater Stripes","Bathypelagic Edge"],"rarity":"Epic","biomes":["deepsea","bathypelagic","midwater"],"weightKg":{"min":0.5,"max":2},"baseValue":{"min":120,"max":250}},
  {"name":"Anglerfish","themeName":"Luremaster Angler","depthRange":"500–1000m","description":"Round predator with massive jaws and glowing lure.","visualNotes":"lure shaped like a sealed scroll with rune barbs; grotesque jaw, great for horror-styled character art.","chakraAffinity":"yin","clanMarkings":"lure rune","spawnLocations":["Abyssal Grotto","Deep Trench Ledges"],"rarity":"Epic","biomes":["deepsea","demersal","bathypelagic"],"weightKg":{"min":0.5,"max":5},"baseValue":{"min":150,"max":300}},
  {"name":"Blobfish","themeName":"Gloommote Blob","depthRange":"600–1000m","description":"Soft-bodied fish with gelatinous droopy features.","visualNotes":"gooey sagging forms that compress when surfaced; pallid pink tones for melancholy art beats.","chakraAffinity":"yin","clanMarkings":"none (amorphous)","spawnLocations":["Abyssal Slope","Deep Gloom Basins"],"rarity":"Rare","biomes":["deepsea","demersal","abyssal_slope"],"weightKg":{"min":0.5,"max":2},"baseValue":{"min":40,"max":100}},
  {"name":"Gulper Eel","themeName":"Scrollgorge Gulper","depthRange":"500–1000m","description":"Enormous hinged mouth with eel-like body and bioluminescent tail tip.","visualNotes":"jaw like an unrolled scroll; thin body trailing off into darkness; small tail light like a signal bead.","chakraAffinity":"yin","clanMarkings":"scroll jaw pattern","spawnLocations":["Deep Trench Mouths","Bathypelagic Channels"],"rarity":"Epic","biomes":["deepsea","midwater","bathypelagic"],"weightKg":{"min":1,"max":6},"baseValue":{"min":160,"max":350}},
  {"name":"Cookiecutter Shark","themeName":"Bitebrand Shark","depthRange":"100–1000m","description":"Small shark with cigar-shaped body and glowing belly.","visualNotes":"glowing belly used for luring; mouth ring has serrated pattern like a seal stamp; useful for scars lore.","chakraAffinity":"yin","clanMarkings":"bite ring motif","spawnLocations":["Open Lanes","Deep Pelagic"],"rarity":"Uncommon","biomes":["pelagic","deepsea","open_ocean"],"weightKg":{"min":3,"max":6},"baseValue":{"min":20,"max":50}},
  {"name":"Greenland Shark","themeName":"Frostward Leviathan","depthRange":"200–600m","description":"Huge sluggish shark with dark rough skin.","visualNotes":"pitted skin like weathered armor; slow drifting pose suitable for ominous environmental art.","chakraAffinity":"earth","clanMarkings":"scattered barnacle crests","spawnLocations":["Polar Banks","Cold Deeps"],"rarity":"Rare","biomes":["deepsea","cold_water","demersal"],"weightKg":{"min":100,"max":1000},"baseValue":{"min":120,"max":300}},
  {"name":"Black Dragonfish","themeName":"Umbra Drake","depthRange":"500–1000m","description":"Sleek black body with fanglike teeth and bioluminescent organs.","visualNotes":"slim form with lit organ clusters like armor lights; ideal for silhouette and negative space art.","chakraAffinity":"yin","clanMarkings":"biolume flank lines","spawnLocations":["Dark Trenches","Bathypelagic Flow"],"rarity":"Epic","biomes":["deepsea","bathypelagic"],"weightKg":{"min":0.2,"max":1},"baseValue":{"min":100,"max":250}},
  {"name":"Deep Sea Smelt","themeName":"Pale Needle Smelt","depthRange":"400–800m","description":"Small silver fish with translucent fins and faint glow.","visualNotes":"delicate body, faint biolume — useful for ambient crowding in deepwater scenes.","chakraAffinity":"yin","clanMarkings":"subtle luminescent band","spawnLocations":["Mesopelagic Drift","Deep Midlanes"],"rarity":"Common","biomes":["midwater","deepsea","mesopelagic"],"weightKg":{"min":0.05,"max":0.2},"baseValue":{"min":2,"max":6}},
  {"name":"Bigeye Tuna","themeName":"Mooneye Tuna","depthRange":"100–500m","description":"Large tuna with oversized eyes and metallic blue scales.","visualNotes":"large reflective eyes good for nocturnal designs; ridged finlets for motion blur sketches.","chakraAffinity":"water","clanMarkings":"eye halo","spawnLocations":["Open Currents","Midwater Paths"],"rarity":"Rare","biomes":["pelagic","open_ocean","midwater"],"weightKg":{"min":20,"max":200},"baseValue":{"min":40,"max":120}},
  {"name":"Escolar","themeName":"Oilcoat Escolar","depthRange":"200–900m","description":"Dark brown fish with oily sheen and sharp fins.","visualNotes":"reflective oily skin; deep brown tone good for moody palettes; fin edges sharp like blades.","chakraAffinity":"yin","clanMarkings":"sheen streaks","spawnLocations":["Deep Open Lanes","Cold Midwaters"],"rarity":"Uncommon","biomes":["pelagic","deepsea","open_ocean"],"weightKg":{"min":2,"max":20},"baseValue":{"min":12,"max":35}},
  {"name":"Roughy (Orange)","themeName":"Ember Roughy","depthRange":"200–800m","description":"Bright orange fish with rough scales and large eyes.","visualNotes":"striking orange for contrast against deep blues; rough scale texture for tactile brushwork.","chakraAffinity":"fire","clanMarkings":"eye halo texture","spawnLocations":["Slope Reefs","Deep Shelves"],"rarity":"Rare","biomes":["demersal","deepsea","continental_slope"],"weightKg":{"min":1,"max":7},"baseValue":{"min":30,"max":90}},
  {"name":"Spookfish","themeName":"Wraith Spookfish","depthRange":"600–1000m","description":"Translucent deep-sea fish with long snout.","visualNotes":"ghostly translucence and long needle snout; great for horror composition and rim lighting.","chakraAffinity":"void","clanMarkings":"ghostly veil","spawnLocations":["Abyssal Plains","Deep Offshoots"],"rarity":"Epic","biomes":["deepsea","bathypelagic","mesopelagic"],"weightKg":{"min":0.5,"max":3},"baseValue":{"min":140,"max":280}},
  {"name":"Stoplight Loosejaw","themeName":"Signaljaw Loosejaw","depthRange":"300–1000m","description":"Thin-bodied fish with hinged jaw and bioluminescent red/green lights.","visualNotes":"biolume lights arranged like traffic beads; jaw hinge exaggerated for action reads.","chakraAffinity":"yin","clanMarkings":"biolume paired lights","spawnLocations":["Deep Midlanes","Hidden Channels"],"rarity":"Epic","biomes":["deepsea","midwater","bathypelagic"],"weightKg":{"min":0.2,"max":1},"baseValue":{"min":110,"max":250}},
  {"name":"Tripod Fish","themeName":"Standlight Tripod","depthRange":"700–1000m","description":"Deep-sea fish with long fin rays that extend to form 'legs' resting on the seafloor.","visualNotes":"long pedestal-like fins forming tripods; perfect strange silhouette for mythic captures.","chakraAffinity":"void","clanMarkings":"leg filament tufts","spawnLocations":["Abyssal Flats","Seafloor Monuments"],"rarity":"Legendary","biomes":["deepsea","abyssal","demersal"],"weightKg":{"min":1,"max":5},"baseValue":{"min":250,"max":600}}
]
'''
fish_list = json.loads(fish_json)

# Mapping spawn phrases -> location folders
orig_to_folder = {
    "Konoha Riverbank": "konoha_riverbank",
    "Hidden Leaf Riverbank": "konoha_riverbank",
    "Konoha Shrine Pond": "konoha_shrine_pond",
    "Konoha Garden Pools": "konoha_shrine_pond",
    "Konoha Estuary": "konoha_estuary",
    "Hidden Leaf Estuary": "konoha_estuary",
    "Sand Shelf": "suna_dunes_shelf",
    "Sand Shelf Edges": "suna_dunes_shelf",
    "Reef Outcrops": "suna_dunes_shelf",
    "Mistfall Bay": "kiri_mistfall_bay",
    "Open Ocean Currents": "kiri_mistfall_bay",
    "Cloud": "kumo_cloud_gulf",
    "Open Ocean Schools": "kumo_cloud_gulf",
    "Reef Caves": "iwa_stone_caves",
    "Hidden Stone Shelves": "iwa_stone_caves",
    "Far Haven Trench": "otogakure_trench",
    "Night Trench": "otogakure_trench",
    "Whitehorse Shoals": "tenkawa_shoals",
    "Coastal Shoals": "tenkawa_shoals",
    "Mount Myoboku": "myoboku_peak",
    "Abyssal Flats": "myoboku_peak",
}

folders = [
    "konoha_riverbank",
    "konoha_shrine_pond",
    "konoha_estuary",
    "suna_dunes_shelf",
    "kiri_mistfall_bay",
    "kumo_cloud_gulf",
    "iwa_stone_caves",
    "otogakure_trench",
    "tenkawa_shoals",
    "myoboku_peak",
]

# 100m bins
bins: List[Tuple[int, int, str]] = []
bins.append((0, 100, "0-100m.json"))
cur = 101
while cur <= 1000:
    hi = min(((cur // 100) * 100), 1000)
    if hi < cur:
        hi = cur + 99
    if hi > 1000:
        hi = 1000
    bins.append((cur, hi, f"{cur}-{hi}m.json"))
    cur = hi + 1

THEMES = {
  "konoha_riverbank": {
    "prefix": "Leaf Country riverbank setting",
    "env": "clear freshwater edged by cedar bridges and mossy stones; dappled forest sunlight and drifting leaf litter",
    "motifs": "leaf-swirls, paper seals, wooden talismans carved with simple crests",
    "palette": "fresh greens, river-silver, warm wood tones",
    "chakra": "soft green chakra tint along the dorsal line"
  },
  "konoha_shrine_pond": {
    "prefix": "Leaf Country shrine-pond setting",
    "env": "still ceremonial pond beneath a red torii; lotus pads and lantern reflections on mirror water",
    "motifs": "lacquer gloss, carved clan crests, prayer ribbons tied to reeds",
    "palette": "jade, gold, lacquer black, lotus pink",
    "chakra": "calm jade chakra glow at the gill line"
  },
  "konoha_estuary": {
    "prefix": "Leaf Country estuary setting",
    "env": "brackish river-meets-sea current with reed beds and weathered fishing posts",
    "motifs": "braided ropes, migration tags, water-worn wood grain",
    "palette": "turquoise, reed green, silt tan",
    "chakra": "subtle turquoise chakra ripple along the flank"
  },
  "suna_dunes_shelf": {
    "prefix": "Sand Country dune-shelf setting",
    "env": "pale reef ledges dusted with ochre sand; heat shimmer and wind-etched ripples",
    "motifs": "gourd sigils, glassy silica specks, sandblasted edges",
    "palette": "desert tans, rust red, sun-bleached bone",
    "chakra": "ember-orange chakra flecks around fins"
  },
  "kiri_mistfall_bay": {
    "prefix": "Mist Country bay setting",
    "env": "cold gray-blue water under low fog; drifting drizzle beads on scales",
    "motifs": "mist veils, blurred silhouettes, lacquered edges beaded with moisture",
    "palette": "sea-glass green, lead gray, pale steel",
    "chakra": "pale blue chakra haze trailing in the wake"
  },
  "kumo_cloud_gulf": {
    "prefix": "Cloud Country gulf setting",
    "env": "storm-tossed open ocean under thunderheads; rain streaks and whitecaps",
    "motifs": "lightning scars, drumline ripples, wind-sheared fins",
    "palette": "cobalt, slate, storm white",
    "chakra": "electric blue chakra arcing along finlets"
  },
  "iwa_stone_caves": {
    "prefix": "Stone Country reef-cave setting",
    "env": "basalt arches and granite shelves with faint lichen glow",
    "motifs": "chiseled glyph textures, fracture lines, rock-dust frosting on scales",
    "palette": "basalt black, iron gray, ochre lichen",
    "chakra": "earthen gold chakra seam near the lateral line"
  },
  "otogakure_trench": {
    "prefix": "Sound Country trench setting",
    "env": "abyssal drop-offs and pressure shimmer; distant sonar-like pulses in the dark",
    "motifs": "waveform ripples, tuning-fork fin struts, resonance bands",
    "palette": "black-violet, oil blue, signal red",
    "chakra": "pulsing red-green chakra nodes that beat like a metronome"
  },
  "tenkawa_shoals": {
    "prefix": "Tenkawa sunlit shoals setting",
    "env": "clear knee-deep water over white sand and seafoam; shrine ropes on driftwood buoys",
    "motifs": "spiral eddies, braided straw charms, bright specular highlights",
    "palette": "aquamarine, pearl, sun-gold",
    "chakra": "bright cyan chakra sparkle along the spine"
  },
  "myoboku_peak": {
    "prefix": "Mount Myōboku highland spring setting",
    "env": "mossy stones, oversized lily pads, and faint sage mist rising from terraces",
    "motifs": "scroll-seal whorls, toad-shrine talismans, speckled 'warty' microtextures",
    "palette": "moss green, amber, soft cream",
    "chakra": "sage-green chakra dew beading at fin edges"
  }
}

def themed(desc: str, loc_key: str) -> str:
    t = THEMES[loc_key]
    desc = (desc or "").strip()
    if desc and not desc.endswith('.'):
        desc += '.'
    return (
        f"{desc} {t['prefix']} — {t['env']}. "
        f"Motifs: {t['motifs']}. Palette: {t['palette']}. "
        f"Chakra cue: {t['chakra']}."
    ).strip()


def loc_label_from_key(k: str) -> str:
    return k.replace('_', ' ').title()


def build_ai_image_prompt(f: dict, loc_key: str, lo: int, hi: int) -> str:
    """Compose a self-contained, image-gen prompt using fish + location theme."""
    t = THEMES[loc_key]
    loc_label = loc_label_from_key(loc_key)
    name = f.get("name") or "Fish"
    theme_name = f.get("themeName") or name
    visual = (f.get("visualNotes") or "distinctive fins and scale texture").strip()
    markings = (f.get("clanMarkings") or "subtle natural markings").strip()
    chakra = f.get("chakraAffinity") or "neutral"
    biomes = ", ".join(f.get("biomes", [])) if isinstance(f.get("biomes"), list) else str(f.get("biomes") or "")
    rarity = f.get("rarity") or "Common"
    depth_str = f"{lo}-{hi}m"

    parts = [
        f"{theme_name}, a {name.lower()} from {loc_label}.",
        f"Environment: {t['prefix']}. {t['env']}",
        f"Motifs: {t['motifs']}. Palette: {t['palette']}.",
        f"Markings: {markings}. Features: {visual}.",
        f"Chakra: {chakra}; cue: {t['chakra']}.",
        f"Depth: {depth_str}; Biomes: {biomes}; Rarity: {rarity}.",
        "Close-up, crisp detail, cinematic lighting, 3/4 view, realistic water caustics, single subject."
    ]
    return " ".join(p for p in parts if p and isinstance(p, str)).strip()


def parse_depth_range(s: str) -> Tuple[int, int]:
    s2 = str(s).replace('–', '-').replace('—', '-').replace('m', '')
    m = re.match(r"\s*(\d+)\s*-\s*(\d+)\s*", s2)
    if m:
        a, b = int(m.group(1)), int(m.group(2))
        return (a, b) if a <= b else (b, a)
    m2 = re.match(r"\s*(\d+)\s*", s2)
    if m2:
        v = int(m2.group(1))
        return v, v
    return 0, 0


def pick_primary_bin(dmin: int, dmax: int) -> str:
    mid = max(0, min(1000, (dmin + dmax) // 2))
    for lo, hi, fn in bins:
        if lo <= mid <= hi:
            return fn
    # fallback
    return bins[0][2]


def choose_folder(spawn_list: List[str]) -> str:
    # Collect all candidate folders by substring match; select by longest pattern then fixed priority
    candidates: List[Tuple[int, str]] = []  # (pattern_len, folder)
    s_join = " | ".join([str(s) for s in (spawn_list or [])]).lower()
    for pat, folder in orig_to_folder.items():
        if pat.lower() in s_join:
            candidates.append((len(pat), folder))
    if not candidates:
        return "tenkawa_shoals"
    candidates.sort(key=lambda x: (-x[0], x[1]))
    return candidates[0][1]


def clean_location_jsons():
    # Remove old JSONs inside each location folder (but keep base manifest at root untouched until rebuilt)
    for loc in folders:
        loc_dir = os.path.join(BASE_DIR, loc)
        if not os.path.isdir(loc_dir):
            os.makedirs(loc_dir, exist_ok=True)
        for fname in os.listdir(loc_dir):
            if fname.endswith('.json'):
                try:
                    os.remove(os.path.join(loc_dir, fname))
                except Exception:
                    pass


def rebuild():
    clean_location_jsons()

    # Initialize per-location bins
    per_loc: Dict[str, Dict[str, List[dict]]] = {
        loc: {fn: [] for _, _, fn in bins} for loc in folders
    }

    assigned_once: Dict[str, str] = {}  # fish key -> folder (to enforce unique across lands)

    for f in fish_list:
        key = f"{f.get('name')}|{f.get('themeName')}"
        folder = choose_folder(f.get("spawnLocations", []))
        if key in assigned_once:
            # already assigned to a land; skip to keep unique-per-land
            continue
        assigned_once[key] = folder
        dmin, dmax = parse_depth_range(f.get("depthRange", "0-0"))
        bin_name = pick_primary_bin(dmin, dmax)
        f2 = dict(f)
        f2["description"] = themed(f2.get("description", ""), folder)
        per_loc[folder][bin_name].append(f2)

    # Helper: create readable label for spawnLocations and variant tags
    def loc_label_from_key(k: str) -> str:
        return k.replace('_', ' ').title()

    # Helper: make a variant entry for a given template to fill targets
    def make_variant(template: dict, loc: str, lo: int, hi: int, index: int) -> dict:
        loc_label = loc_label_from_key(loc)
        tname = template.get("themeName") or template.get("name") or "Fish"
        base_desc = (template.get("description") or "").strip()
        if base_desc and not base_desc.endswith('.'):
            base_desc += '.'
        variant_line = f" Variant tuned for {lo}-{hi}m in {loc_label}."
        desc = themed(base_desc + variant_line, loc)
        variant = dict(template)
        variant["depthRange"] = f"{lo}–{hi}m"
        variant["spawnLocations"] = [loc_label]
        variant["themeName"] = f"{tname} ({loc_label} {lo}-{hi}m v{index})"
        # Ensure name is present and stable
        variant["name"] = template.get("name") or tname
        # Nudge notes to indicate small visual shift
        vn = variant.get("visualNotes")
        extra_note = f" variant markings adjusted for {loc_label} {lo}-{hi}m"
        variant["visualNotes"] = (vn + ";" + extra_note) if isinstance(vn, str) and vn else extra_note
        variant["description"] = desc
        variant["aiImagePrompt"] = build_ai_image_prompt(variant, loc, lo, hi)
        return variant

    # Accumulate stats per location
    per_loc_stats: Dict[str, Dict[str, dict]] = {loc: {} for loc in folders}
    per_loc_bins: Dict[str, Dict[str, List[str]]] = {loc: {} for loc in folders}

    # Write JSON files (ensure exactly 10 items per bin)
    for loc, bins_map in per_loc.items():
        loc_dir = os.path.join(BASE_DIR, loc)
        os.makedirs(loc_dir, exist_ok=True)
        # Build templates from already assigned fish in this location, or fallback to global fish_list
        templates: List[dict] = []
        for _lo, _hi, _fn in bins:
            for it in bins_map[_fn]:
                templates.append(it)
        if not templates:
            templates = [dict(x) for x in fish_list]

        tcount = max(1, len(templates))
        template_cursor = 0

        for (lo, hi, fn) in bins:
            items = list(bins_map[fn])
            # Deduplicate within file by (name, themeName, description)
            seen = set()
            unique_items = []
            for it in items:
                k = (it.get("name"), it.get("themeName"), it.get("description"))
                if k in seen:
                    continue
                seen.add(k)
                unique_items.append(it)

            # Trim if over 10
            if len(unique_items) > 10:
                unique_items = unique_items[:10]

            # Expand with themed variants if under 10
            variant_index = 1
            while len(unique_items) < 10:
                template = templates[template_cursor % tcount]
                template_cursor += 1
                variant = make_variant(template, loc, lo, hi, variant_index)
                variant_index += 1
                k = (variant.get("name"), variant.get("themeName"), variant.get("description"))
                if k in seen:
                    continue
                seen.add(k)
                unique_items.append(variant)

            # Ensure aiImagePrompt present and updated for this bin
            for i in range(len(unique_items)):
                item = unique_items[i]
                if not isinstance(item, dict):
                    continue
                item["aiImagePrompt"] = build_ai_image_prompt(item, loc, lo, hi)

            # Create minimal entries and record heavy fields in stats
            def make_id(entry: dict) -> str:
                base = f"{loc}|{fn}|{entry.get('name')}|{entry.get('themeName')}"
                import hashlib as _h
                return _h.sha256(base.encode('utf-8')).hexdigest()[:12]

            minimal_items: List[dict] = []
            id_list: List[str] = []
            for it in unique_items:
                fid = make_id(it)
                id_list.append(fid)
                # Save heavy fields into per-location stats
                heavy = {
                    k: it.get(k)
                    for k in [
                        "name","themeName","depthRange","description","visualNotes",
                        "chakraAffinity","clanMarkings","spawnLocations","rarity",
                        "biomes","weightKg","baseValue","aiImagePrompt"
                    ]
                }
                per_loc_stats[loc][fid] = heavy
                # Minimal entry for the lightweight 100m bin file
                minimal_items.append({
                    "id": fid,
                    "name": it.get("name"),
                    "themeName": it.get("themeName"),
                    "rarity": it.get("rarity")
                })

            # Track bin to ids mapping for stats
            per_loc_bins[loc][fn] = id_list

            # Minified JSON to keep files small
            with open(os.path.join(loc_dir, fn), "w", encoding="utf-8") as fp:
                json.dump(minimal_items, fp, ensure_ascii=False, separators=(",", ":"))

    # Write per-location stats.json files
    for loc in folders:
        loc_dir = os.path.join(BASE_DIR, loc)
        stats_payload = {
            "location": loc_label_from_key(loc),
            "bins": per_loc_bins[loc],
            "fish": per_loc_stats[loc],
        }
        with open(os.path.join(loc_dir, "stats.json"), "w", encoding="utf-8") as fp:
            json.dump(stats_payload, fp, indent=2, ensure_ascii=False)


def build_manifest_and_zip():
    # Collect JSON files and compute hashes
    entries: List[dict] = []
    for root, _dirs, files in os.walk(BASE_DIR):
        for fname in files:
            if not fname.endswith('.json'):
                continue
            full = os.path.join(root, fname)
            rel = os.path.relpath(full, BASE_DIR).replace(os.sep, "/")
            with open(full, 'rb') as fh:
                data = fh.read()
            entries.append({
                "asset_path": f"assets/json/{rel}",
                "relative_path": rel,
                "filename": fname,
                "location_folder": os.path.dirname(rel),
                "sha256": hashlib.sha256(data).hexdigest(),
                "size_bytes": len(data),
                "url": f"{BASE_URL}/{rel}",
            })

    manifest = {
        "generated_by": "rebuild_assets_100m_unique.py",
        "note": "Unique-per-land fish; single best-fit 100m bin per fish; themed descriptions per location.",
        "files_count": len(entries),
        "files": entries,
    }
    manifest_path = os.path.join(BASE_DIR, "manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as fp:
        json.dump(manifest, fp, indent=2, ensure_ascii=False)

    # Build ZIP with assets/json tree plus manifest at assets/manifest.json
    with zipfile.ZipFile(ZIP_OUT, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for e in entries:
            full = os.path.join(BASE_DIR, e["relative_path"].replace("/", os.sep))
            arcname = os.path.join("assets", "json", e["relative_path"].replace("/", os.sep))
            zf.write(full, arcname=arcname)
        zf.write(manifest_path, arcname=os.path.join("assets", "manifest.json"))


def main():
    rebuild()
    build_manifest_and_zip()
    # Print a short summary
    summary: Dict[str, Dict[str, int]] = {}
    for loc in folders:
        loc_dir = os.path.join(BASE_DIR, loc)
        summary[loc] = {}
        for _lo, _hi, fn in bins:
            fpath = os.path.join(loc_dir, fn)
            try:
                with open(fpath, "r", encoding="utf-8") as f:
                    data = json.load(f)
            except Exception:
                data = []
            summary[loc][fn] = len(data) if isinstance(data, list) else 0
    print(json.dumps({
        "zip": ZIP_OUT,
        "manifest": os.path.join(BASE_DIR, "manifest.json"),
        "counts": summary
    }, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
