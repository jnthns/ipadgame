#!/usr/bin/env python3
"""Recover Feudalism's static collision cells from its SWF display list.

This intentionally does NOT infer collision from bitmap/sprite bounds. Tree.init
marks one cell at the placed MovieClip's origin. All blockers in battle frames
are placed directly on the root timeline; nested asset catalog sprite 929 is
present only on nonbattle frame 2. No JPEXS executable or third-party packages
are required after the source scripts have been exported for class provenance.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import math
from pathlib import Path
import re
import struct
import zlib

EXPECTED_SWF_SHA256 = "31b2a89a748d415b249e7efbf41b2c960e6fc1f5f4e07d4b33505192363609ca"


class Bits:
    def __init__(self, data: bytes, offset: int = 0):
        self.data = data
        self.bit = offset * 8

    def unsigned(self, length: int) -> int:
        value = 0
        for _ in range(length):
            value = (value << 1) | ((self.data[self.bit // 8] >> (7 - self.bit % 8)) & 1)
            self.bit += 1
        return value

    def signed(self, length: int) -> int:
        value = self.unsigned(length)
        return value - (1 << length) if length and value & (1 << (length - 1)) else value

    @property
    def end(self) -> int:
        return (self.bit + 7) // 8


def matrix(data: bytes, offset: int) -> dict:
    bits = Bits(data, offset)
    a = d = 1.0
    b = c = 0.0
    if bits.unsigned(1):
        length = bits.unsigned(5)
        a, d = bits.signed(length) / 65536, bits.signed(length) / 65536
    if bits.unsigned(1):
        length = bits.unsigned(5)
        b, c = bits.signed(length) / 65536, bits.signed(length) / 65536
    length = bits.unsigned(5)
    tx, ty = bits.signed(length), bits.signed(length)
    return {"a": a, "b": b, "c": c, "d": d, "tx": tx, "ty": ty}


def tags(data: bytes, offset: int = 0):
    while offset + 2 <= len(data):
        tag_offset = offset
        header = struct.unpack_from("<H", data, offset)[0]
        offset += 2
        code, length = header >> 6, header & 63
        if length == 63:
            length = struct.unpack_from("<I", data, offset)[0]
            offset += 4
        if offset + length > len(data):
            raise ValueError("Truncated SWF tag")
        yield code, data[offset:offset + length], tag_offset
        offset += length
        if code == 0:
            break


def swf_tags(raw: bytes):
    signature = raw[:3]
    if signature == b"CWS":
        data = raw[:8] + zlib.decompress(raw[8:])
    elif signature == b"FWS":
        data = raw
    else:
        raise ValueError("Only uncompressed/ZLIB SWF files are supported")
    if len(data) != struct.unpack_from("<I", raw, 4)[0]:
        raise ValueError("SWF declared length does not match decompressed bytes")
    rect_bits = data[8] >> 3
    offset = 8 + (5 + rect_bits * 4 + 7) // 8
    fps_raw, frame_count = struct.unpack_from("<HH", data, offset)
    return list(tags(data, offset + 4)), {"version": raw[3], "fps": fps_raw / 256, "rootFrameCount": frame_count}


def exports_and_sprites(root_tags):
    exports = {}
    sprites = {}
    for code, payload, _ in root_tags:
        if code == 56:
            count = struct.unpack_from("<H", payload)[0]
            offset = 2
            for _ in range(count):
                character_id = struct.unpack_from("<H", payload, offset)[0]
                offset += 2
                end = payload.index(0, offset)
                exports[character_id] = payload[offset:end].decode("utf-8")
                offset = end + 1
        elif code == 39:
            character_id, frame_count = struct.unpack_from("<HH", payload)
            sprites[character_id] = {"frameCount": frame_count, "tags": list(tags(payload, 4))}
    return exports, sprites


def update_display(display: dict, code: int, payload: bytes, tag_offset: int):
    if code in (26, 70):  # PlaceObject2/3; this SWF's root uses only version 2.
        flags = payload[0]
        extra_flags = payload[1] if code == 70 else 0
        depth_offset = 2 if code == 70 else 1
        depth = struct.unpack_from("<H", payload, depth_offset)[0]
        offset = depth_offset + 2
        class_name = None
        if code == 70 and (extra_flags & 8 or extra_flags & 16 and flags & 2):
            end = payload.index(0, offset)
            class_name = payload[offset:end].decode("utf-8")
            offset = end + 1
        move = bool(flags & 1)
        state = dict(display.get(depth, {})) if move else {}
        if flags & 2:
            state["characterId"] = struct.unpack_from("<H", payload, offset)[0]
            offset += 2
        if flags & 4:
            state["matrix"] = matrix(payload, offset)
        elif "matrix" not in state:
            state["matrix"] = {"a": 1, "b": 0, "c": 0, "d": 1, "tx": 0, "ty": 0}
        state["tagOffset"] = tag_offset
        if class_name is not None:
            state["className"] = class_name
        display[depth] = state
    elif code == 4:  # Older PlaceObject format, supported defensively.
        character_id, depth = struct.unpack_from("<HH", payload)
        display[depth] = {"characterId": character_id, "matrix": matrix(payload, 4), "tagOffset": tag_offset}
    elif code == 28:
        display.pop(struct.unpack_from("<H", payload)[0], None)
    elif code == 5:
        display.pop(struct.unpack_from("<H", payload, 2)[0], None)


def display_frames(timeline):
    display = {}
    frame = 1
    for code, payload, offset in timeline:
        update_display(display, code, payload, offset)
        if code == 1:
            yield frame, {depth: dict(state) for depth, state in display.items()}
            frame += 1


def constant(source: str, name: str) -> int:
    found = re.search(r"_global\." + re.escape(name) + r"\s*=\s*(\d+)\s*;", source)
    if not found:
        raise ValueError(f"Missing source constant {name}")
    return int(found.group(1))


def extract(swf_path: Path, scripts: Path) -> dict:
    raw = swf_path.read_bytes()
    sha = hashlib.sha256(raw).hexdigest()
    if sha != EXPECTED_SWF_SHA256:
        raise ValueError(f"Unexpected SWF SHA-256 {sha}; review this build before extracting")
    root_source = (scripts / "frame_1/DoAction.as").read_text()
    tree_source = (scripts / "__Packages/Tree.as").read_text()
    cage_source = (scripts / "__Packages/Cage.as").read_text()
    # Fail loudly if the source no longer expresses the verified cell-origin rule.
    for literal in ["_root.getX(this._x)", "_root.getY(this._y)", "].free = false", "].who = this"]:
        if literal not in tree_source:
            raise ValueError("Tree.init collision rule changed")
    if "hitTest" in tree_source or "this.free = true" not in cage_source:
        raise ValueError("Collision model requires fresh review")
    for pattern in [r"Math\.floor\(xx / CAGE_W\)", r"Math\.floor\(\(yy - SKY_HEIGHT\) / CAGE_H\)"]:
        if not re.search(pattern, root_source):
            raise ValueError("Coordinate-to-cell rule changed")
    grid = {"width": constant(root_source, "F_WIDTH"), "height": constant(root_source, "F_HEIGHT"), "cellWidth": constant(root_source, "CAGE_W"), "cellHeight": constant(root_source, "CAGE_H"), "skyHeight": constant(root_source, "SKY_HEIGHT")}
    offset_match = re.search(r"_root\.gotoAndStop\(map \+ (\d+)\)", root_source)
    if not offset_match:
        raise ValueError("Missing loadMap root-frame offset")
    map_frame_offset = int(offset_match.group(1))
    root_tags, swf_metadata = swf_tags(raw)
    exports, sprites = exports_and_sprites(root_tags)
    tree_names = {}
    for path in sorted(scripts.glob("*.as")):
        found = re.search(r'Object\.registerClass\("([^"\n]+)",Tree\)', path.read_text())
        if found:
            tree_names[found.group(1)] = path.relative_to(scripts).as_posix()
    tree_ids = {cid: name for cid, name in exports.items() if name in tree_names}
    if len(tree_ids) != len(tree_names):
        raise ValueError("One or more Tree registration names do not resolve through ExportAssets")
    blocking_types = []
    for cid, name in sorted(tree_ids.items()):
        init_path = scripts / f"DefineSprite_{cid}_{name}/frame_1/DoAction.as"
        if not init_path.is_file() or init_path.read_text().strip() != "this.init();":
            raise ValueError(f"Unreviewed obstacle initializer {init_path}")
        blocking_types.append({"characterId": cid, "name": name, "registration": tree_names[name], "initializer": init_path.relative_to(scripts).as_posix()})
    spawn_types = {}
    for path in scripts.glob("DefineSprite_*/frame_1/DoAction.as"):
        source = path.read_text()
        if "_root.addUnit(this._x,this._y,_global[arr].shift(),tm)" in source:
            cid = int(re.match(r"DefineSprite_(\d+)", path.parent.parent.name).group(1))
            spawn_types[cid] = {"hero": False, "source": path.relative_to(scripts).as_posix()}
        elif "_root.addHero(this._x,this._y,_global.MAIN_HERO,0)" in source:
            cid = int(re.match(r"DefineSprite_(\d+)", path.parent.parent.name).group(1))
            spawn_types[cid] = {"hero": True, "source": path.relative_to(scripts).as_posix()}
    spawn_constructs = {}
    for path in scripts.glob("frame_*/PlaceObject2_*/*construct*.as"):
        match = re.match(r"PlaceObject2_(\d+)_(\d+)", path.parent.name)
        if not match or int(match.group(1)) not in spawn_types:
            continue
        cid, depth = int(match.group(1)), int(match.group(2))
        source = path.read_text()
        if spawn_types[cid]["hero"]:
            values = {"team": 0, "queue": None, "queueOrdinalHint": None}
        else:
            values = {"team": int(re.search(r"tm = (\d+)", source).group(1)), "queue": re.search(r'arr = "(\w+)"', source).group(1), "queueOrdinalHint": int(re.search(r"num = (\d+)", source).group(1))}
        spawn_constructs[(cid, depth)] = {**values, "constructSource": path.relative_to(scripts).as_posix()}
    frame_labels = {}
    frame = 1
    for code, payload, _ in root_tags:
        if code == 43:
            frame_labels[payload.split(b"\0", 1)[0].decode()] = frame
        elif code == 1:
            frame += 1
    last_map_frame = frame_labels["TOWN_SCREEN"] - 1
    maps = {}
    nested_blocker_catalogs = {}
    for cid, sprite in sprites.items():
        direct = {state["characterId"] for _, display in display_frames(sprite["tags"]) for state in display.values() if state.get("characterId") in tree_ids}
        if direct:
            nested_blocker_catalogs[cid] = sorted(direct)
    nested_catalog_frames = {str(cid): [] for cid in nested_blocker_catalogs}
    for frame, display in display_frames(root_tags):
        for cid in nested_blocker_catalogs:
            if any(state.get("characterId") == cid for state in display.values()):
                nested_catalog_frames[str(cid)].append(frame)
        if not map_frame_offset < frame <= last_map_frame:
            continue
        obstacles = []
        initial_spawns = []
        for depth, state in sorted(display.items()):
            cid = state.get("characterId")
            if cid in nested_blocker_catalogs:
                raise ValueError("Nested blocker timeline in a battle map needs runtime frame selection review")
            if cid in spawn_types:
                construct = spawn_constructs.get((cid, depth))
                if construct is None:
                    raise ValueError("Spawn marker lacks audited construct properties")
                transform = state["matrix"]
                sx, sy = transform["tx"] / 20, transform["ty"] / 20
                cell = [math.floor(sx / grid["cellWidth"]), math.floor((sy - grid["skyHeight"]) / grid["cellHeight"])]
                initial_spawns.append({"depth": depth, "characterId": cid, **spawn_types[cid], **construct, "originTwips": [transform["tx"], transform["ty"]], "originPixels": [sx, sy], "cell": cell, "placementTagOffset": state["tagOffset"]})
            if cid not in tree_ids:
                continue
            transform = state["matrix"]
            x, y = transform["tx"] / 20, transform["ty"] / 20
            cell = [math.floor(x / grid["cellWidth"]), math.floor((y - grid["skyHeight"]) / grid["cellHeight"])]
            inside = 0 <= cell[0] < grid["width"] and 0 <= cell[1] < grid["height"]
            obstacles.append({"depth": depth, "characterId": cid, "name": tree_ids[cid], "originTwips": [transform["tx"], transform["ty"]], "originPixels": [x, y], "cell": cell, "insideGrid": inside, "placementTagOffset": state["tagOffset"]})
        cells = sorted({tuple(o["cell"]) for o in obstacles if o["insideGrid"]}, key=lambda c: (c[1], c[0]))
        overlaps = [{"cell": spawn["cell"], "spawnDepth": spawn["depth"], "obstacleDepths": [o["depth"] for o in obstacles if o["cell"] == spawn["cell"]]} for spawn in initial_spawns if tuple(spawn["cell"]) in cells]
        maps[str(frame - map_frame_offset)] = {"rootFrame": frame, "blockedCells": [list(c) for c in cells], "obstacles": obstacles, "initialSpawns": initial_spawns, "spawnTerrainOverlaps": overlaps}
    return {
        "schemaVersion": 1,
        "provenance": {"sourceUrl": "https://cache.armorgames.com/files/games/feudalism-433.swf", "swfSha256": sha, "swfBytes": len(raw), **swf_metadata, "extraction": "SWF root display-list PlaceObject2 MATRIX translations + exported AS2 Tree registration and init rules", "treeSource": "__Packages/Tree.as", "treeSourceSha256": hashlib.sha256(tree_source.encode()).hexdigest(), "coordinateSource": "frame_1/DoAction.as: getX/getY and loadMap", "mapFrameOffset": map_frame_offset, "firstNonBattleFrame": frame_labels["TOWN_SCREEN"], "collisionModel": "one blocked grid cell at each Tree-derived MovieClip origin; no hitTest or sprite-bound inference", "nestedObstacleCatalogFrames": nested_catalog_frames, "spawnOrder": "initialSpawns are listed by source display-list depth; AVM1 child frame-script execution order has not been replay-verified; num is an unused construct property, not a queue index", "limitations": ["Static source extraction; not a recorded Flash runtime replay.", "Only in-grid cells enter blockedCells; any out-of-grid obstacle origins remain in obstacles for audit.", "Dynamic field.empty reservations, actors, arrows and animation timing are not terrain data."]},
        "grid": grid,
        "blockingTypes": blocking_types,
        "maps": maps,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--swf", type=Path, default=Path("reference/feudalism.swf"))
    parser.add_argument("--scripts", type=Path, default=Path("reference/decompiled/scripts"))
    parser.add_argument("--output", type=Path, default=Path("src/battle-terrain.json"))
    args = parser.parse_args()
    result = extract(args.swf, args.scripts)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2) + "\n")
    cells = sum(len(m["blockedCells"]) for m in result["maps"].values())
    out_of_bounds = sum(not o["insideGrid"] for m in result["maps"].values() for o in m["obstacles"])
    print(f"Extracted {len(result['maps'])} battle maps, {cells} blocked-cell entries, {len(result['blockingTypes'])} Tree-derived types, {out_of_bounds} out-of-grid placements.")


if __name__ == "__main__":
    main()
