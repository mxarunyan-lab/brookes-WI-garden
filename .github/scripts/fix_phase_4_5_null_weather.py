from pathlib import Path

path=Path('src/weatherPresentation.js')
text=path.read_text()
old="const numeric=value=>Number.isFinite(Number(value))?Number(value):null;"
new="const numeric=value=>value===null||value===undefined||value===''?null:Number.isFinite(Number(value))?Number(value):null;"
if old not in text: raise SystemExit('numeric helper not found')
path.write_text(text.replace(old,new,1))

path=Path('test/weatherPresentation.test.js')
text=path.read_text()
text += "\ntest('explicit null weather values remain unavailable instead of becoming zero',()=>{assert.equal(roundWeatherValue(null,{suffix:'°'}),'');assert.equal(hasUsableWeather({temperature:null,high:null,low:null,condition:'Current conditions unavailable'}),false);const day=normalizeForecastDays([{forecast_for:'2026-07-18T12:00:00Z',maximum_temperature:null,minimum_temperature:null,temperature:null}])[0];assert.equal(day.temperatureLabel,'Temperature details unavailable')});\n"
path.write_text(text)
print('fixed explicit null weather normalization')
