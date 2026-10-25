"""Pack known FFDec exports. Requires Pillow; run after tools/inspect.sh exports."""
from pathlib import Path
import json, shutil, xml.etree.ElementTree as ET
from PIL import Image
out=Path('public/art');out.mkdir(parents=True,exist_ok=True)
shutil.copyfile('reference/world-export/DefineSprite_1979_WorldMap/1.png',out/'world.png')
shutil.copyfile('reference/assets/images/1417.jpg',out/'battle.jpg')
sets={'sword':range(1,31,3),'bow':range(171,211,4),'run':range(496,526,3),'die':range(826,855,3)}
sheet=Image.new('RGBA',(1280,640))
for row,seq in enumerate(sets.values()):
    for column,n in enumerate(seq):
        frame=Image.open(f'reference/body/DefineSprite_543/{n}.png').crop((170,170,390,410))
        frame.thumbnail((120,150))
        sheet.alpha_composite(frame,(column*128+(128-frame.width)//2,row*160+160-frame.height))
sheet.save(out/'warrior.png')
root=ET.parse('reference/feudalism.xml').getroot()
world=next(t for t in root.iter('item') if t.get('type')=='DefineSpriteTag' and t.get('spriteId')=='1979')
positions={}
for t in world.iter('item'):
    name=t.get('name');matrix=t.find('matrix')
    if name and matrix is not None:
        positions[name]=[int(matrix.get('translateX','0'))/20,int(matrix.get('translateY','0'))/20]
Path('src/map-positions.json').write_text(json.dumps(positions,indent=2)+'\n')
print('Packed original map, default animation samples, terrain and world positions.')
