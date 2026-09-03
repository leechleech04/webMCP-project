"""Generate the original low-poly GLB catalog assets without external packages."""
from __future__ import annotations

import hashlib
import json
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ASSET_ROOT = ROOT / "public" / "assets"

COLORS = {
    "dark": (0.08, 0.11, 0.16, 1), "metal": (0.34, 0.39, 0.46, 1),
    "light": (0.62, 0.68, 0.74, 1), "green": (0.04, 0.28, 0.16, 1),
    "blue": (0.03, 0.45, 0.75, 1), "cyan": (0.12, 0.78, 0.92, 1),
    "gold": (0.82, 0.58, 0.12, 1), "red": (0.72, 0.08, 0.12, 1),
    "glass": (0.4, 0.65, 0.78, 0.28),
}

def box(center, size, material):
    return (center, size, material)

def frame_case(dual=False):
    shapes = [box((0, -.47, 0), (1, .06, 1), "dark")]
    for x in (-.47, .47):
        for z in (-.47, .47): shapes.append(box((x, 0, z), (.06, 1, .06), "metal"))
    shapes += [box((0, .47, 0), (1, .06, 1), "metal"), box((0, 0, .48), (1, 1, .04), "dark")]
    shapes.append(box((.48, 0, 0), (.04, 1, 1), "glass"))
    if dual: shapes += [box((-.12, 0, 0), (.05, .9, .9), "metal"), box((0, -.32, 0), (.92, .28, .9), "dark")]
    else: shapes += [box((-.32, .08, -.05), (.04, .7, .72), "metal")]
    return shapes

ASSETS = {
    "case-matx-airflow": frame_case(False),
    "case-dual-chamber": frame_case(True),
    "motherboard-family": [box((0,0,0),(1,1,1),"green"), box((-.18,.14,.38),(.34,.34,.2),"metal"), box((.25,.3,.4),(.35,.22,.18),"dark"), box((.22,-.28,.42),(.28,.22,.14),"gold")],
    "cpu-package": [box((0,0,-.15),(1,1,.7),"gold"), box((0,0,.44),(.82,.82,.12),"light")],
    "gpu-dual-fan": [box((0,0,0),(1,1,1),"dark"), box((0,.42,0),(.92,.12,.9),"metal"), box((-.28,-.475,-.2),(.26,.05,.34),"cyan"), box((.28,-.475,.2),(.26,.05,.34),"cyan")],
    "gpu-quad-slot": [box((0,0,0),(1,1,1),"dark"), box((0,.43,0),(.94,.14,.94),"metal"), box((-.3,-.475,-.25),(.22,.05,.28),"red"), box((.3,-.475,.25),(.22,.05,.28),"red")],
    "ram-low-profile": [box((0,0,0),(1,1,1),"dark"), box((0,.45,0),(1,.1,1),"metal"), box((0,-.48,0),(.9,.04,.92),"gold")],
    "storage-sata": [box((0,0,0),(1,1,1),"metal"), box((0,.485,0),(.84,.03,.82),"dark")],
    "storage-hdd": [box((0,0,0),(1,1,1),"metal"), box((0,.485,0),(.82,.03,.78),"light"), box((0,.48,0),(.34,.04,.34),"dark")],
    "psu-atx": [box((0,0,0),(1,1,1),"dark"), box((0,.485,0),(.72,.03,.72),"metal"), box((.35,-.25,.485),(.18,.26,.03),"gold")],
    "fan-140-argb": [box((0,0,0),(1,1,1),"dark"), box((0,0,.49),(.72,.72,.02),"cyan"), box((0,0,.43),(.24,.24,.14),"metal")],
    "cooler-single-tower": [box((0,0,0),(.76,1,.72),"light"), box((0,-.45,0),(1,.1,1),"metal"), box((0,0,.44),(.72,.72,.12),"dark")],
    "cooler-dual-tower": [box((-.25,0,0),(.44,1,.78),"light"), box((.25,0,0),(.44,1,.78),"light"), box((0,-.45,0),(1,.1,1),"metal"), box((0,0,0),(.12,.72,.84),"dark")],
}

FACES = [
    ((0,1,2,3),(0,0,-1)), ((4,7,6,5),(0,0,1)), ((0,4,5,1),(0,-1,0)),
    ((3,2,6,7),(0,1,0)), ((0,3,7,4),(-1,0,0)), ((1,5,6,2),(1,0,0)),
]

def geometry(shapes):
    groups = {}
    for center, size, material in shapes:
        positions, normals, indices = groups.setdefault(material, ([], [], []))
        cx,cy,cz=center; sx,sy,sz=(v/2 for v in size)
        corners=[(cx-sx,cy-sy,cz-sz),(cx+sx,cy-sy,cz-sz),(cx+sx,cy+sy,cz-sz),(cx-sx,cy+sy,cz-sz),
                 (cx-sx,cy-sy,cz+sz),(cx+sx,cy-sy,cz+sz),(cx+sx,cy+sy,cz+sz),(cx-sx,cy+sy,cz+sz)]
        for face, normal in FACES:
            base=len(positions)
            positions.extend(corners[i] for i in face); normals.extend([normal]*4)
            indices.extend((base,base+1,base+2,base,base+2,base+3))
    return groups

def make_glb(shapes):
    groups=geometry(shapes); blob=bytearray(); views=[]; accessors=[]; primitives=[]; materials=[]
    def add_view(raw, target):
        while len(blob)%4: blob.append(0)
        offset=len(blob); blob.extend(raw); views.append({"buffer":0,"byteOffset":offset,"byteLength":len(raw),"target":target}); return len(views)-1
    for mat_name,(pos,norm,idx) in groups.items():
        pflat=[v for xyz in pos for v in xyz]; nflat=[v for xyz in norm for v in xyz]
        pv=add_view(struct.pack("<"+"f"*len(pflat),*pflat),34962); nv=add_view(struct.pack("<"+"f"*len(nflat),*nflat),34962)
        iv=add_view(struct.pack("<"+"H"*len(idx),*idx),34963)
        mins=[min(p[i] for p in pos) for i in range(3)]; maxs=[max(p[i] for p in pos) for i in range(3)]
        pa=len(accessors); accessors.append({"bufferView":pv,"componentType":5126,"count":len(pos),"type":"VEC3","min":mins,"max":maxs})
        na=len(accessors); accessors.append({"bufferView":nv,"componentType":5126,"count":len(norm),"type":"VEC3"})
        ia=len(accessors); accessors.append({"bufferView":iv,"componentType":5123,"count":len(idx),"type":"SCALAR"})
        color=COLORS[mat_name]; materials.append({"name":mat_name,"pbrMetallicRoughness":{"baseColorFactor":color,"metallicFactor":.45,"roughnessFactor":.5},"alphaMode":"BLEND" if color[3]<1 else "OPAQUE","doubleSided":True})
        primitives.append({"attributes":{"POSITION":pa,"NORMAL":na},"indices":ia,"material":len(materials)-1})
    doc={"asset":{"version":"2.0","generator":"SyncBuild deterministic stdlib generator"},"scene":0,"scenes":[{"nodes":[0]}],"nodes":[{"mesh":0}],"meshes":[{"primitives":primitives}],"materials":materials,"buffers":[{"byteLength":len(blob)}],"bufferViews":views,"accessors":accessors}
    js=json.dumps(doc,separators=(",",":")).encode(); js+=b" "*((4-len(js)%4)%4); blob+=b"\0"*((4-len(blob)%4)%4)
    total=12+8+len(js)+8+len(blob)
    return struct.pack("<4sII",b"glTF",2,total)+struct.pack("<I4s",len(js),b"JSON")+js+struct.pack("<I4s",len(blob),b"BIN\0")+blob

def main():
    for name, shapes in ASSETS.items():
        folder=ASSET_ROOT/name; folder.mkdir(parents=True,exist_ok=True)
        payload=make_glb(shapes); (folder/"lod0.glb").write_bytes(payload)
        sha=hashlib.sha256(payload).hexdigest()
        manifest={"assetId":name.upper().replace("-","_"),"category":"PC_COMPONENT","productionMethod":"DETERMINISTIC_PROCEDURAL_RECONSTRUCTION","license":"CC0-1.0","coordinateSystem":"GLTF_Y_UP","nativeBounds":[1,1,1],"file":{"url":f"/assets/{name}/lod0.glb","bytes":len(payload),"sha256":sha},"generator":"scripts/generate_catalog_assets.py"}
        (folder/"manifest.json").write_text(json.dumps(manifest,indent=2)+"\n",encoding="utf-8")
        (folder/"ATTRIBUTION.md").write_text(f"# {name}\n\nOriginal deterministic low-poly asset created for SyncBuild. Released under CC0 1.0.\n",encoding="utf-8")
    print(f"Generated {len(ASSETS)} GLB assets in {ASSET_ROOT}")

if __name__ == "__main__": main()
