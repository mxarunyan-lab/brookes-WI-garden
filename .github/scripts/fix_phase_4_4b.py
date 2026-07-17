from pathlib import Path

path=Path('src/App.jsx')
text=path.read_text()
old=",actor):plant:current.plants,activity=activityEntry"
new=",actor):plant):current.plants,activity=activityEntry"
if old not in text:
    raise SystemExit('weather decision plant-map syntax target not found')
text=text.replace(old,new,1)
if new not in text:
    raise SystemExit('weather decision plant-map syntax fix did not apply')
path.write_text(text)
print('fixed weather decision persistence callback syntax')
Path('.github/scripts/fix_phase_4_4b.py').unlink()
print('removed temporary patch script')
