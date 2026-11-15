#!/usr/bin/env python3
"""Packs the four stage GLBs of the "Seed to Tree" Blender asset into the one file the website loads.

Run from this folder (needs Python 3 with numpy, and Node for the compression step):
    python3 build_seed_to_tree.py seed-to-tree-src/Nomad out/seed-to-tree.raw.glb
    npx @gltf-transform/cli meshopt out/seed-to-tree.raw.glb ../../apps/web/public/plant/seed-to-tree.glb
The second step quantises and meshopt-compresses it (about 2.8 MB -> 0.53 MB); the scene loads it with three.js'
MeshoptDecoder. If the Blender file changes, re-export the four GLBs from it first (same names, same mesh names).

The four stages share topology, so they are packed as one file:
  * Seed_*   floating-seed pose, morph target 0 = planted-seed pose
  * Trunk, Filaments, Leaf_A_* (left; _Limb is the branch, _Body the blade, _Lines the lips and veins), Leaf_B_* (sprout's right leaf, the tree's crown): sprout pose, morph target 0 = tree pose
  * Roots (identical in both), Leaf_C_* (the tree's third leaf, tree pose only)
Parts with the same look are merged to keep draw calls low. Everything is moved so the trunk base sits at the origin.
Each leaf node carries extras.pivot (and pivotTree) = where its branch leaves the trunk, used to grow it in the scene.
"""
import json, struct, sys, os
import numpy as np

CT = {5120: 'b', 5121: 'B', 5122: 'h', 5123: 'H', 5125: 'I', 5126: 'f'}
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}
ORIGIN = np.array([1.58, 0.0, -0.03], dtype=np.float32)   # centre of the root flare


def load(path):
    b = open(path, 'rb').read()
    clen = struct.unpack('<I', b[12:16])[0]
    j = json.loads(b[20:20 + clen]); blob = b[20 + clen + 8:]

    def acc(i):
        a = j['accessors'][i]; bv = j['bufferViews'][a['bufferView']]
        n = NC[a['type']]
        return np.frombuffer(blob, dtype='<' + CT[a['componentType']], count=a['count'] * n,
                             offset=bv.get('byteOffset', 0) + a.get('byteOffset', 0)).reshape(a['count'], n)
    out = {}
    for node in j['nodes']:
        if 'mesh' not in node: continue
        pr = j['meshes'][node['mesh']]['primitives'][0]
        name = node['name'].split('.0')[0]
        out[name] = {'p': acc(pr['attributes']['POSITION']) - ORIGIN, 'n': acc(pr['attributes']['NORMAL']),
                     'c': acc(pr['attributes']['COLOR_0'])[:, :3] if 'COLOR_0' in pr['attributes'] else None,
                     'i': acc(pr['indices']).reshape(-1).astype(np.uint32)}
    return out


def merge(src, names, target=None, target_names=None, white=(0.94, 0.91, 1.0), gain=None):
    """Concatenate parts; returns dict(p, n, c, i, tp, tn)."""
    P, N, C, I, TP, TN = [], [], [], [], [], []
    off = 0
    for k, name in enumerate(names):
        m = src[name]
        c = m['c'] if m['c'] is not None else np.tile(np.array(white, dtype=np.float32), (len(m['p']), 1))
        if gain: c = c * gain[k]
        P.append(m['p']); N.append(m['n']); C.append(c); I.append(m['i'] + off); off += len(m['p'])
        if target is not None:
            t = target[(target_names or names)[k]]
            assert len(t['p']) == len(m['p']), name
            TP.append(t['p'] - m['p']); TN.append(t['n'] - m['n'])
    d = {'p': np.vstack(P), 'n': np.vstack(N), 'c': np.vstack(C), 'i': np.concatenate(I)}
    if target is not None: d['tp'] = np.vstack(TP); d['tn'] = np.vstack(TN)
    return d


def ring_centre(mesh, first=True, ring=12):
    return (mesh['p'][:ring] if first else mesh['p'][-ring:]).mean(0)


# --- Fork repair -----------------------------------------------------------------------------------------------------
# In the source models each branch is a separate tube that is thicker than the trunk where it starts, so the joins read
# as loose sleeves and the trunk looks spindly. reconnect() thickens the trunk, then rebuilds every branch so it starts
# on the trunk's centre line, inside the trunk and travelling in the trunk's direction, and peels away in one smooth
# curve to the base of its leaf. The crown branch continues from the very top of the trunk. Vertex counts are unchanged,
# and each branch starts at the same trunk ring in the sprout and the tree, so the morph between them stays joined.
WHITE = (0.94, 0.91, 1.0)                         # tint used for parts that carry no colour of their own
RING = 18                                         # vertices in each trunk ring
BRANCH_RING = 12                                  # vertices in each branch ring
TRUNK_EXTRA = {'sprout': (0.014, 0.012), 'tree': (0.03, 0.03)}   # added trunk radius above the root flare: (throughout, more toward the top)
TIP_RADIUS = 0.024                                # branch radius where it meets the leaf


def _sstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0.0, 1.0)
    return t * t * (3 - 2 * t)


def _unit(v):
    return v / np.linalg.norm(v)


def _trunk_rings(trunk):
    rings = trunk['p'].reshape(-1, RING, 3)
    centres = rings.mean(1)
    radius = np.linalg.norm(rings - centres[:, None, :], axis=2).mean(1)
    return rings, centres, radius


def _thicken_trunk(src, pose):
    """Scale each trunk ring about its centre, and push the spiral filaments out with the surface they sit on."""
    trunk = src['Trunk | sculpted stem']
    rings, centres, radius = _trunk_rings(trunk)
    t = np.linspace(0, 1, len(centres))
    base, rise = TRUNK_EXTRA[pose]
    new_radius = radius + _sstep(0.02, 0.22, t) * (base + rise * t)
    factor = new_radius / radius
    trunk['p'] = (centres[:, None, :] + (rings - centres[:, None, :]) * factor[:, None, None]).reshape(-1, 3).astype(np.float32)
    ys = centres[:, 1]
    for name, m in src.items():
        if 'spiral filament' not in name: continue
        y = m['p'][:, 1]
        c = np.stack([np.interp(y, ys, centres[:, k]) for k in range(3)], axis=1)
        m['p'] = (c + (m['p'] - c) * np.interp(y, ys, factor)[:, None]).astype(np.float32)
    return centres, new_radius


def _rebuild_branch(branch, start, start_dir, start_radius, start_colour):
    """A tube along a cubic Hermite curve from the trunk to the leaf base (the branch's existing last ring)."""
    old = branch['p'].reshape(-1, BRANCH_RING, 3)
    n = len(old)
    centres_old = old.mean(1)
    end = centres_old[-1]
    end_dir = _unit(centres_old[-1] - centres_old[-5])
    reach = np.linalg.norm(end - start)
    # Leave the trunk gently when the leaf lies ahead, and turn tightly when it lies off to the side (no looping hook).
    ahead = max(0.0, float(np.dot(start_dir, (end - start) / reach)))
    m0, m1 = start_dir * reach * (0.3 + 0.65 * ahead), end_dir * reach * 0.8
    s = np.linspace(0, 1, n)[:, None]
    h00, h10, h01, h11 = 2 * s**3 - 3 * s**2 + 1, s**3 - 2 * s**2 + s, -2 * s**3 + 3 * s**2, s**3 - s**2
    centres = h00 * start + h10 * m0 + h01 * end + h11 * m1
    tangents = np.gradient(centres, axis=0)
    tangents /= np.linalg.norm(tangents, axis=1)[:, None]
    # An even taper for a full, organic limb, then a quick narrowing so it flows into the leaf's midrib.
    radius = (start_radius + (TIP_RADIUS - start_radius) * s[:, 0]) * (1 - 0.5 * _sstep(0.8, 1.0, s[:, 0]))
    # Parallel-transport frame, seeded the same way in every pose so the sprout-to-tree morph does not twist.
    normal = _unit(np.cross(tangents[0], np.array([0.0, 0.0, 1.0])))
    theta = np.linspace(0, 2 * np.pi, BRANCH_RING, endpoint=False)
    P, N = [], []
    for k in range(n):
        tk = tangents[k]
        normal = _unit(normal - tk * np.dot(normal, tk))
        binormal = np.cross(tk, normal)
        radial = np.cos(theta)[:, None] * normal + np.sin(theta)[:, None] * binormal
        P.append(centres[k] + radius[k] * radial); N.append(radial)
    branch['p'] = np.vstack(P).astype(np.float32); branch['n'] = np.vstack(N).astype(np.float32)
    # Take the trunk's colour at the fork and ease into the branch's own tint, so there is no band at the join.
    own = branch['c'] if branch['c'] is not None else np.tile(np.array(WHITE, dtype=np.float32), (len(branch['p']), 1))
    w = np.repeat(_sstep(0.0, 0.4, s[:, 0]), BRANCH_RING)[:, None]
    branch['c'] = (start_colour * (1 - w) + own * w).astype(np.float32)


def reconnect(src, pose, forks):
    """forks: {side: (trunk ring the branch starts at, start radius as a share of the trunk's radius there)}."""
    centres, radius = _thicken_trunk(src, pose)
    tangents = np.gradient(centres, axis=0)
    tc = src['Trunk | sculpted stem']['c']
    colour = lambda ring: tc.reshape(-1, RING, 3)[ring].mean(0) if tc is not None else np.array(WHITE, dtype=np.float32)
    for side, (ring, share) in forks.items():
        _rebuild_branch(src[f'{side} | branch'], centres[ring], _unit(tangents[ring]), radius[ring] * share, colour(ring))
    return centres


LEFT_LEAF_RING = 70                               # trunk ring the left leaf forks from, just under the top
THIRD_LEAF_RING = 60                              # trunk ring the tree's third leaf forks from


def main(src_dir, out_path):
    f = lambda n: load(os.path.join(src_dir, n))
    s1, s2, s3, s4 = f('01_Floating_Seed.glb'), f('02_Planted_Seed.glb'), f('03_Two-leaf_Sprout.glb'), f('04_Three-leaf_Tree.glb')
    # The left branch forks at the same trunk ring in both poses; the sprout's right leaf and the tree's crown carry on from the top.
    sprout_trunk = reconnect(s3, 'sprout', {'Left': (LEFT_LEAF_RING, 0.7), 'Right': (80, 1.03)})
    reconnect(s4, 'tree', {'Left': (LEFT_LEAF_RING, 0.7), 'Crown': (80, 1.03), 'Right': (THIRD_LEAF_RING, 0.82)})
    seams = [f'Seed | luminous seam {i}' for i in range(1, 6)]
    lines = lambda side: [f'{side} | warm lip', f'{side} | pearl lip', f'{side} | central vein', f'{side} | lower vein']
    body = lambda side: [f'{side} | leaf blade']
    limb = lambda side: [f'{side} | branch']      # kept apart from the blade: limbs are solid pearl like the trunk, blades are glass
    fil = [f'Trunk | spiral filament {i}' for i in range(1, 5)]
    roots = [f'Root | flare {i}' for i in range(1, 7)]

    nodes = []   # (name, mesh dict, extras)
    nodes.append(('Seed_Shell', merge(s1, ['Seed | upper porcelain shell', 'Seed | lower porcelain shell'], s2), None))
    nodes.append(('Seed_Body', merge(s1, ['Seed | opalescent inner body'], s2), None))
    nodes.append(('Seed_Lines', merge(s1, seams, s2), None))
    nodes.append(('Trunk', merge(s3, ['Trunk | sculpted stem'], s4), None))
    nodes.append(('Filaments', merge(s3, fil, s4), None))
    nodes.append(('Roots', merge(s3, roots), None))
    piv = lambda m, side: [round(float(x), 4) for x in ring_centre(m[f'{side} | branch'])]
    tip = lambda m, side: [round(float(x), 4) for x in ring_centre(m[f'{side} | branch'], first=False)]
    ex_a = {'pivot': piv(s3, 'Left'), 'pivotTree': piv(s4, 'Left'), 'tip': tip(s3, 'Left'), 'tipTree': tip(s4, 'Left')}
    ex_b = {'pivot': piv(s3, 'Right'), 'pivotTree': piv(s4, 'Crown'), 'tip': tip(s3, 'Right'), 'tipTree': tip(s4, 'Crown')}
    ex_c = {'pivot': [round(float(x), 4) for x in sprout_trunk[THIRD_LEAF_RING]], 'pivotTree': piv(s4, 'Right'), 'tip': tip(s4, 'Right'), 'tipTree': tip(s4, 'Right')}
    nodes.append(('Leaf_A_Limb', merge(s3, limb('Left'), s4), ex_a))
    nodes.append(('Leaf_A_Body', merge(s3, body('Left'), s4), ex_a))
    nodes.append(('Leaf_A_Lines', merge(s3, lines('Left'), s4), ex_a))
    nodes.append(('Leaf_B_Limb', merge(s3, limb('Right'), s4, limb('Crown')), ex_b))
    nodes.append(('Leaf_B_Body', merge(s3, body('Right'), s4, body('Crown')), ex_b))
    nodes.append(('Leaf_B_Lines', merge(s3, lines('Right'), s4, lines('Crown')), ex_b))
    nodes.append(('Leaf_C_Limb', merge(s4, limb('Right')), ex_c))
    nodes.append(('Leaf_C_Body', merge(s4, body('Right')), ex_c))
    nodes.append(('Leaf_C_Lines', merge(s4, lines('Right')), ex_c))

    blob = bytearray(); views = []; accs = []
    def add(arr, target=None, minmax=False, ctype=5126, typ='VEC3'):
        arr = np.ascontiguousarray(arr)
        while len(blob) % 4: blob.append(0)
        v = {'buffer': 0, 'byteOffset': len(blob), 'byteLength': arr.nbytes}
        if target: v['target'] = target
        blob.extend(arr.tobytes()); views.append(v)
        a = {'bufferView': len(views) - 1, 'componentType': ctype, 'count': len(arr), 'type': typ}
        if minmax: a['min'] = [float(x) for x in arr.min(0)]; a['max'] = [float(x) for x in arr.max(0)]
        accs.append(a); return len(accs) - 1

    gl_nodes, gl_meshes = [], []
    for name, m, extras in nodes:
        assert len(m['p']) < 65536
        prim = {'attributes': {'POSITION': add(m['p'].astype('<f4'), 34962, True), 'NORMAL': add(m['n'].astype('<f4'), 34962),
                               'COLOR_0': add(m['c'].astype('<f4'), 34962)},
                'indices': add(m['i'].astype('<u2'), 34963, ctype=5123, typ='SCALAR'), 'material': 0}
        mesh = {'name': name, 'primitives': [prim]}
        if 'tp' in m:
            prim['targets'] = [{'POSITION': add(m['tp'].astype('<f4'), 34962, True), 'NORMAL': add(m['tn'].astype('<f4'), 34962)}]
            mesh['weights'] = [0.0]; mesh['extras'] = {'targetNames': ['next']}
        node = {'name': name, 'mesh': len(gl_meshes)}
        if extras: node['extras'] = extras
        gl_meshes.append(mesh); gl_nodes.append(node)

    doc = {'asset': {'version': '2.0', 'generator': 'AiMoneyPrinter build_seed_to_tree.py'},
           'scene': 0, 'scenes': [{'name': 'Seed to Tree', 'nodes': list(range(len(gl_nodes)))}],
           'nodes': gl_nodes, 'meshes': gl_meshes,
           'materials': [{'name': 'Placeholder', 'doubleSided': True, 'pbrMetallicRoughness': {'roughnessFactor': 0.3, 'metallicFactor': 0}}],
           'accessors': accs, 'bufferViews': views, 'buffers': [{'byteLength': len(blob)}]}
    js = json.dumps(doc, separators=(',', ':')).encode()
    js += b' ' * (-len(js) % 4)
    while len(blob) % 4: blob.append(0)
    with open(out_path, 'wb') as o:
        o.write(struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(blob)))
        o.write(struct.pack('<II', len(js), 0x4E4F534A)); o.write(js)
        o.write(struct.pack('<II', len(blob), 0x004E4942)); o.write(blob)
    print(out_path, os.path.getsize(out_path), 'bytes;', sum(len(m['p']) for _, m, _ in nodes), 'vertices;', len(nodes), 'meshes')
    for name, m, e in nodes: print(f'  {name:14s} v={len(m["p"]):5d} tris={len(m["i"]) // 3:5d} morph={"tp" in m} {e or ""}')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
