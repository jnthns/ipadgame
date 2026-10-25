#!/usr/bin/env bash
set -euo pipefail
# Run from the repository root. Supply an official FFDec 26.4.0 JAR path.
ffdec_jar_path="${1:?Usage: bash tools/inspect.sh /absolute/path/to/ffdec.jar}"
node tools/acquire.mjs
java -jar "$ffdec_jar_path" -cli -export script reference/decompiled reference/feudalism.swf
java -jar "$ffdec_jar_path" -cli -export image,shape reference/assets reference/feudalism.swf
java -jar "$ffdec_jar_path" -cli -selectid 1979 -export sprite reference/world-export reference/feudalism.swf
java -jar "$ffdec_jar_path" -cli -selectid 543 -export sprite reference/body reference/feudalism.swf
java -jar "$ffdec_jar_path" -cli -swf2xml reference/feudalism.swf reference/feudalism.xml
node tools/extract-data.mjs
python3 tools/export-assets.py
