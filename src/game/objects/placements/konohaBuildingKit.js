import * as THREE from 'three';

export function createKonohaBuildingKit(settings) {
  const KPalette = {
    plaster: 0xe8efc9,
    trim: 0xb7c097,
    skirt: 0x66705d,
    wood: 0x6d5433,
    frame: 0x3b3f45,
    glass: 0x8db1c6,
    roofRed: 0xd7413a,
    roofBlue: 0x5570b7,
    roofYellow: 0xd6c14e,
    roofGreen: 0x3e8048,
    roofDark: 0x2f3338
  };

  const KMats = {
    plaster: new THREE.MeshStandardMaterial({ color: KPalette.plaster, roughness: 0.95, metalness: 0.02 }),
    trim:    new THREE.MeshStandardMaterial({ color: KPalette.trim,    roughness: 0.95, metalness: 0.02 }),
    skirt:   new THREE.MeshStandardMaterial({ color: KPalette.skirt,   roughness: 0.95, metalness: 0.02 }),
    wood:    new THREE.MeshStandardMaterial({ color: KPalette.wood,    roughness: 0.9,  metalness: 0.03 }),
    frame:   new THREE.MeshStandardMaterial({ color: KPalette.frame,   roughness: 0.9,  metalness: 0.02 }),
    glass:   new THREE.MeshStandardMaterial({ color: KPalette.glass,   roughness: 0.2,  metalness: 0.02, emissive: 0x111111 }),
    roof: (c) => new THREE.MeshStandardMaterial({
      color: c, roughness: 0.9, metalness: 0.02,
      polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1
    })
  };

  const box = (w,h,d,mat) => { const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat); m.castShadow=m.receiveShadow=!!settings.shadows; return m; };
  const cylinder = (r,h,mat,radial=24) => { const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,radial), mat); m.castShadow=m.receiveShadow=!!settings.shadows; return m; };
  const cone = (r,h,mat,radial=24) => { const m=new THREE.Mesh(new THREE.ConeGeometry(r,h,radial), mat); m.castShadow=m.receiveShadow=!!settings.shadows; return m; };

  function makeWindow(w=12,h=10,depth=1.2) {
    const g = new THREE.Group();
    const frame = box(w, h, depth, KMats.frame); frame.position.y = h/2; g.add(frame);
    const glass = box(w-2, h-2, depth-0.6, KMats.glass); glass.position.y = h/2; glass.position.z = 0.3; g.add(glass);
    return g;
  }
  function makeDoor(w=12,h=18,depth=1.6) {
    const g = new THREE.Group();
    const frame = box(w, h, depth, KMats.frame); frame.position.y = h/2; g.add(frame);
    const panel = box(w-2, h-2, depth-0.6, KMats.wood); panel.position.y = h/2; panel.position.z = 0.4; g.add(panel);
    return g;
  }
  function makeBalcony(w=30,d=10,h=3) {
    const g = new THREE.Group();
    const floor = box(w, 2, d, KMats.wood); floor.position.y = 1; g.add(floor);
    const rail = box(w, h, 1.2, KMats.frame); rail.position.set(0, h/2+2, d/2-0.6); g.add(rail);
    const count = Math.floor((w-4)/3);
    for (let i=0;i<count;i++) {
      const x = -w/2 + 2 + i*3;
      const pk = box(0.6, h-0.8, 1.0, KMats.frame);
      pk.position.set(x, h/2+2, d/2-0.6); g.add(pk);
    }
    return g;
  }
  function makeSign(w=22,h=6) {
    const g = new THREE.Group();
    const slab = box(w, 2, h, KMats.wood); slab.position.set(0, 1, 0); g.add(slab);
    const plate = box(w-2, 1.2, h-1.6, KMats.frame); plate.position.set(0, 1.2, 0.1); g.add(plate);
    return g;
  }

  function makeGableRoof(w,d,thickness,color) {
    const grp = new THREE.Group();
    const t = thickness ?? 2;
    const slopeH = Math.max(w,d) * 0.18;
    const baseY = t/2;
    const s1 = box(w, t, d/2, KMats.roof(color)); s1.position.set(0, baseY, -d/4);
    const s2 = box(w, t, d/2, KMats.roof(color)); s2.position.set(0, baseY,  d/4);
    const ang = Math.atan2(slopeH, d/2);
    s1.rotation.x =  ang; s2.rotation.x = -ang;
    const ridge = box(w + 1.0, t*0.8, 1.4, KMats.roof(KPalette.roofDark));
    ridge.position.set(0, baseY + Math.sin(ang)*(d/2), 0);
    grp.add(s1,s2,ridge);
    return grp;
  }
  function makeHipRoof(w,d,t,color) {
    const grp = new THREE.Group();
    const base = box(w, t ?? 2, d, KMats.roof(color)); base.position.y = (t ?? 2)/2; grp.add(base);
    const cap = box(Math.max(6, w*0.18), 1.6, Math.max(6,d*0.18), KMats.roof(KPalette.roofDark));
    cap.position.y = (t ?? 2)/2 + Math.max(w,d)*0.22 + 0.2; grp.add(cap);
    return grp;
  }
  function makeFlatRoof(w,d,t=2,color=KPalette.roofDark) { const slab = box(w, t, d, KMats.roof(color)); return slab; }
  function makeDomeRoof(radius,color) {
    const grp = new THREE.Group();
    const drum = cylinder(radius*0.95, 10, KMats.roof(KPalette.roofDark), 36); drum.position.y = 5; grp.add(drum);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(radius, 36, 24, 0, Math.PI*2, 0, Math.PI/2), KMats.roof(color));
    dome.position.y = 5; dome.castShadow=dome.receiveShadow=!!settings.shadows; grp.add(dome);
    const cap = cone(radius*0.18, 8, KMats.roof(KPalette.roofDark), 24); cap.position.y = 5 + radius*0.98; grp.add(cap);
    return grp;
  }
  function makeConeRoof(radius,color) {
    const grp = new THREE.Group();
    const eave = cylinder(radius*1.05, 3, KMats.roof(KPalette.roofDark), 32); eave.position.y = 1.5; grp.add(eave);
    const con = cone(radius, radius*1.2, KMats.roof(color), 32); con.position.y = 1.5 + radius*0.6; grp.add(con);
    return grp;
  }

  function makeLevel({ w=60,d=40,h=24, withSkirt=true }={}) {
    const grp = new THREE.Group();
    const body = box(w,h,d,KMats.plaster); body.position.y = h/2; grp.add(body);
    const t = 2.2;
    const corners = [
      [-w/2 + t/2, h/2, -d/2 + t/2], [ w/2 - t/2, h/2, -d/2 + t/2],
      [-w/2 + t/2, h/2,  d/2 - t/2], [ w/2 - t/2, h/2,  d/2 - t/2]
    ];
    corners.forEach(p => { const c = box(t, h, t, KMats.trim); c.position.set(...p); grp.add(c); });
    if (withSkirt) { const sk = box(w+2, 6, d+2, KMats.skirt); sk.position.y = 3; grp.add(sk); }
    return grp;
  }
  function addWindowsRect(grp, { w,d, h, y=10, inset=1.6, gap=12, size=[10,8] }) {
    const [ww,hh] = size;
    const countX = Math.floor((w-16)/gap);
    for (let i=0;i<countX;i++) {
      const x = -w/2 + 8 + i*gap;
      const W1 = makeWindow(ww,hh,inset); W1.position.set(x, y,  d/2 + 0.6); W1.rotation.y = Math.PI; grp.add(W1);
      const W2 = makeWindow(ww,hh,inset); W2.position.set(x, y, -d/2 - 0.6);                grp.add(W2);
    }
    const countZ = Math.floor((d-16)/gap);
    for (let i=0;i<countZ;i++) {
      const z = -d/2 + 8 + i*gap;
      const W1 = makeWindow(ww,hh,inset); W1.position.set( w/2 + 0.6, y, z); W1.rotation.y = -Math.PI/2; grp.add(W1);
      const W2 = makeWindow(ww,hh,inset); W2.position.set(-w/2 - 0.6, y, z); W2.rotation.y =  Math.PI/2; grp.add(W2);
    }
  }

  function makeBuilding(opts) {
    const {
      name="bldg",
      w=60, d=40, floors=2, floorH=24,
      roofType="hip", roofColor=KPalette.roofBlue,
      balcony=false, sign=false, door=true,
      round=false, cone=false,
      position=[0,0,0], rotationY=0
    } = opts;

    const B = new THREE.Group(); B.name = name;
    const levels = new THREE.Group(); B.add(levels);
    const roof = new THREE.Group(); B.add(roof);
    const details = new THREE.Group(); B.add(details);

    if (!round) {
      for (let f=0; f<floors; f++) {
        const L = makeLevel({ w, d, h: floorH });
        L.position.y = f*floorH;
        levels.add(L);
        addWindowsRect(L, { w, d, h: floorH, y: floorH*0.55 });
        if (f === 0 && door) {
          const Dr = makeDoor(14, 20, 2);
          Dr.position.set(0, 10, d/2 + 1.1); Dr.rotation.y = Math.PI;
          L.add(Dr);
        }
        if (f === 1 && balcony) {
          const Bc = makeBalcony(Math.min(36, w-12), 10, 6);
          Bc.position.set(0, floorH + 2, d/2 + 5.6); L.add(Bc);
        }
      }
      const topY = floors * floorH;
      let roofMesh;
      if (roofType === 'gable') roofMesh = makeGableRoof(w-2, d-2, 2, roofColor);
      else if (roofType === 'flat') roofMesh = makeFlatRoof(w-6, d-6, 2.2, KPalette.roofDark);
      else roofMesh = makeHipRoof(w-2, d-2, 2, roofColor);
      roofMesh.position.y = topY + 1.4;
      roof.add(roofMesh);
      if (sign) {
        const s = makeSign(24, 6);
        s.position.set(-w/2 - 2, floorH*0.9, 0);
        s.rotation.y = Math.PI/2;
        details.add(s);
      }
    } else {
      const radius = Math.max(w, d) * 0.45;
      for (let f=0; f<floors; f++) {
        const drum = cylinder(radius * (1 - f*0.05), floorH, KMats.plaster, 32);
        drum.position.y = floorH/2 + f*floorH;
        levels.add(drum);
        for (let i=0;i<8;i++) {
          const ang = (i/8)*Math.PI*2;
          const col = box(2.2, floorH, 2.2, KMats.trim);
          col.position.set(Math.cos(ang)*radius*0.98, floorH/2 + f*floorH, Math.sin(ang)*radius*0.98);
          levels.add(col);
        }
        for (let i=0;i<6;i++) {
          const ang = (i/6)*Math.PI*2;
          const W = makeWindow(10, 9, 1.2);
          W.position.set(Math.cos(ang)*radius*0.98, floorH*0.55 + f*floorH, Math.sin(ang)*radius*0.98);
          W.lookAt(0, W.position.y, 0);
          levels.add(W);
        }
      }
      const topY = floors * floorH;
      const cap = cone ? makeConeRoof(radius*0.95, roofColor) : makeDomeRoof(radius*0.95, roofColor);
      cap.position.y = topY + 2; roof.add(cap);
      // Mark as round and store collider radius for placement
      B.userData.round = true;
      B.userData.roundRadius = radius;
    }

    B.position.set(...position);
    B.rotation.y = rotationY;
    B.traverse(n => { if (n.isMesh) { n.castShadow = !!settings.shadows; n.receiveShadow = !!settings.shadows; }});
    return B;
  }

  return { THREE, Palette: KPalette, M: KMats, makeBuilding };
}
