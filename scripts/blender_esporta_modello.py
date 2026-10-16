# Eseguito da Blender: importa il .glb (anche con Draco) ed esporta triangoli,
# normali e colore base dei materiali in un JSON compatto.
import bpy, bmesh, json, sys
argv = sys.argv[sys.argv.index('--') + 1:]
src, dst = argv[0], argv[1]
# Terzo argomento facoltativo: quota di triangoli da tenere (Decimate), es. 0.33.
riduci = float(argv[2]) if len(argv) > 2 else 1.0
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
if riduci < 1.0:
    for ob in bpy.context.scene.objects:
        if ob.type == 'MESH':
            m = ob.modifiers.new('riduci', 'DECIMATE')
            m.ratio = riduci
dg = bpy.context.evaluated_depsgraph_get()
pos, nor, col = [], [], []
materiali = set()
for ob in bpy.context.scene.objects:
    if ob.type != 'MESH':
        continue
    ev = ob.evaluated_get(dg)
    me = ev.to_mesh()
    bm = bmesh.new(); bm.from_mesh(me); bmesh.ops.triangulate(bm, faces=bm.faces[:]); bm.to_mesh(me); bm.free()
    me.calc_normals_split() if hasattr(me, 'calc_normals_split') else None
    M = ob.matrix_world
    N = M.to_3x3().inverted().transposed()
    for poly in me.polygons:
        mat = ob.material_slots[poly.material_index].material if ob.material_slots else None
        c = (0.7, 0.7, 0.7)
        if mat:
            materiali.add(mat.name)
            if mat.use_nodes:
                bsdf = next((n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
                if bsdf:
                    v = bsdf.inputs['Base Color'].default_value
                    c = (v[0], v[1], v[2])
            else:
                c = tuple(mat.diffuse_color[:3])
        for li in poly.loop_indices:
            lo = me.loops[li]
            p = M @ me.vertices[lo.vertex_index].co
            n = (N @ (lo.normal if hasattr(lo, 'normal') else poly.normal)).normalized()
            pos += [p.x, p.y, p.z]; nor += [n.x, n.y, n.z]; col += list(c)
    ev.to_mesh_clear()
json.dump({'pos': pos, 'nor': nor, 'col': col, 'materiali': sorted(materiali)}, open(dst, 'w'))
print('TRIANGOLI', len(pos) // 9, 'MATERIALI', sorted(materiali))
