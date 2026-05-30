# Alif — stilize cami modeli + soft ışık + render (headless Blender).
# Çalıştırma: Blender --background --python scripts/blender/mosque.py
# Çıktı: scripts/blender/out/mosque_full.png (şeffaf, 1024)

import bpy
import bmesh
import math
import os

# ---------------------------------------------------------------- yardımcılar
def srgb(hexstr):
    """#RRGGBB sRGB -> linear RGBA (Blender materyal rengi linear bekler)."""
    h = hexstr.lstrip("#")
    out = []
    for i in (0, 2, 4):
        c = int(h[i:i + 2], 16) / 255.0
        c = c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
        out.append(c)
    return (out[0], out[1], out[2], 1.0)

PAL = {
    "wall": srgb("#F4EAD2"),     # krem duvar
    "stone": srgb("#CDBE9C"),    # temel kumtaşı
    "dome": srgb("#2E8B9E"),     # teal kubbe
    "gold": srgb("#F5A524"),     # altın
    "garden": srgb("#6FB36A"),   # mint çalı
    "door": srgb("#9A6B3F"),     # ahşap kapı
}

def mat(name, color, metallic=0.0, rough=0.55):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = rough
    return m

MATS = {
    "wall": mat("wall", PAL["wall"], 0.0, 0.6),
    "stone": mat("stone", PAL["stone"], 0.0, 0.7),
    "dome": mat("dome", PAL["dome"], 0.15, 0.35),
    "gold": mat("gold", PAL["gold"], 0.9, 0.25),
    "garden": mat("garden", PAL["garden"], 0.0, 0.6),
    "door": mat("door", PAL["door"], 0.0, 0.55),
}

def set_mat(obj, key):
    obj.data.materials.clear()
    obj.data.materials.append(MATS[key])

def smooth(obj):
    for p in obj.data.polygons:
        p.use_smooth = True

def cube(name, size, loc, matkey, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.active_object
    o.name = name
    o.scale = (size[0] / 2, size[1] / 2, size[2] / 2) if isinstance(size, (list, tuple)) else (size, size, size)
    o.scale = (o.scale[0] * scale[0], o.scale[1] * scale[1], o.scale[2] * scale[2])
    set_mat(o, matkey)
    return o

def cyl(name, r, depth, loc, matkey, verts=24):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=depth, location=loc, vertices=verts)
    o = bpy.context.active_object
    o.name = name
    set_mat(o, matkey)
    smooth(o)
    return o

def cone(name, r1, r2, depth, loc, matkey, verts=24):
    bpy.ops.mesh.primitive_cone_add(radius1=r1, radius2=r2, depth=depth, location=loc, vertices=verts)
    o = bpy.context.active_object
    o.name = name
    set_mat(o, matkey)
    smooth(o)
    return o

def sphere(name, r, loc, matkey, scale=(1, 1, 1), seg=32, ring=16):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, segments=seg, ring_count=ring)
    o = bpy.context.active_object
    o.name = name
    o.scale = scale
    set_mat(o, matkey)
    smooth(o)
    return o

# ---------------------------------------------------------------- temiz sahne
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete()
for blk in (bpy.data.meshes, bpy.data.materials):
    pass  # materyalleri yeniden yarattık; mesh temizliği gerekmez

# ---------------------------------------------------------------- CAMI
# Temel platform (geniş, alçak)
cube("foundation", (5.0, 5.0, 0.5), (0, 0, 0.25), "stone")
# Ana gövde (duvarlar) — top 2.7
walls = cube("walls", (3.2, 3.2, 2.2), (0, 0, 1.6), "wall")
# Altın çini bandı (duvar üstüne yakın)
cube("tileband", (3.35, 3.35, 0.26), (0, 0, 2.45), "gold")
# Kapı: ahşap blok + ince altın çerçeve (ön yüz -Y)
cube("door_frame", (1.15, 0.10, 1.7), (0, -1.61, 1.35), "gold")
cube("door", (0.92, 0.16, 1.45), (0, -1.63, 1.22), "door")
# Kubbe — KASNAK (drum) üstünde, klasik kubbe hissi
cyl("drum", 1.0, 0.5, (0, 0, 2.95), "wall")
sphere("dome", 1.05, (0, 0, 3.2), "dome", scale=(1, 1, 0.82))
# Minareler — ÖN köşelerde (ince, her ikisi de görünür) + külah + altın top
for sx in (-1.9, 1.9):
    cyl("minaret", 0.2, 3.7, (sx, -1.75, 2.35), "wall")
    cyl("minaret_band", 0.23, 0.18, (sx, -1.75, 3.7), "gold", verts=16)
    cone("minaret_top", 0.3, 0.0, 0.6, (sx, -1.75, 4.5), "dome")
    sphere("minaret_ball", 0.1, (sx, -1.75, 4.86), "gold", seg=16, ring=8)
# Bahçe çalıları (temel kenarlarında, otururlar)
for (bx, by) in [(-2.2, -2.2), (2.2, -2.2), (-2.2, 2.2), (2.2, 2.2), (0, 2.3)]:
    sphere("bush", 0.4, (bx, by, 0.7), "garden", scale=(1, 1, 0.8), seg=16, ring=10)
# Tepe finali: altın direk + top + hilal (torus)
bpy.ops.mesh.primitive_cylinder_add(radius=0.045, depth=0.55, location=(0, 0, 4.05))
pole = bpy.context.active_object
pole.name = "finial_pole"
set_mat(pole, "gold")
sphere("finial_ball", 0.12, (0, 0, 4.35), "gold", seg=16, ring=8)
bpy.ops.mesh.primitive_torus_add(major_radius=0.2, minor_radius=0.05, location=(0, 0, 4.7), major_segments=24, minor_segments=10)
cres = bpy.context.active_object
cres.name = "finial_crescent"
cres.rotation_euler = (math.radians(90), 0, 0)
set_mat(cres, "gold")
smooth(cres)

# ---------------------------------------------------------------- IŞIK (soft 3-nokta)
def add_light(name, ltype, energy, loc, size=5.0):
    ld = bpy.data.lights.new(name, ltype)
    ld.energy = energy
    if ltype == "AREA":
        ld.size = size
    lo = bpy.data.objects.new(name, ld)
    lo.location = loc
    bpy.context.collection.objects.link(lo)
    return lo

key = add_light("key", "AREA", 1200, (5, -6, 8), size=8)
fill = add_light("fill", "AREA", 350, (-6, -3, 4), size=10)
rim = add_light("rim", "AREA", 500, (-2, 6, 6), size=6)
for L in (key, fill, rim):
    d = (-L.location[0], -L.location[1], 1.5 - L.location[2])
    L.rotation_euler = (math.atan2(math.hypot(d[0], d[1]), -d[2]) if False else 0, 0, 0)
# basit yönlendirme: hepsi merkeze baksın (track-to)
target = bpy.data.objects.new("target", None)
target.location = (0, 0, 2.1)
bpy.context.collection.objects.link(target)
for L in (key, fill, rim):
    c = L.constraints.new("TRACK_TO")
    c.target = target
    c.track_axis = "TRACK_NEGATIVE_Z"
    c.up_axis = "UP_Y"

# Yumuşak gökyüzü ışığı (world)
world = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
bpy.context.scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes.get("Background")
bg.inputs["Color"].default_value = srgb("#BFE3FF")
bg.inputs["Strength"].default_value = 0.6

# ---------------------------------------------------------------- KAMERA (izometrik 3/4, ortho)
cam_data = bpy.data.cameras.new("cam")
cam_data.type = "ORTHO"
cam_data.ortho_scale = 7.2
cam = bpy.data.objects.new("cam", cam_data)
cam.location = (8, -8, 5.6)
bpy.context.collection.objects.link(cam)
cc = cam.constraints.new("TRACK_TO")
cc.target = target
cc.track_axis = "TRACK_NEGATIVE_Z"
cc.up_axis = "UP_Y"
bpy.context.scene.camera = cam

# ---------------------------------------------------------------- RENDER
scene = bpy.context.scene
for eng in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE", "CYCLES"):
    try:
        scene.render.engine = eng
        break
    except TypeError:
        continue
print("ENGINE:", scene.render.engine)

scene.render.film_transparent = True
scene.render.resolution_x = 1024
scene.render.resolution_y = 1024
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGBA"
try:
    scene.eevee.taa_render_samples = 64
except Exception:
    pass

out_dir = os.path.join(os.path.dirname(__file__), "out")
os.makedirs(out_dir, exist_ok=True)
scene.render.filepath = os.path.join(out_dir, "mosque_full.png")
bpy.ops.render.render(write_still=True)
print("RENDERED:", scene.render.filepath)
