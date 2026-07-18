from pathlib import Path


def replace_required(text,old,new,label):
    if old not in text: raise SystemExit(f'missing {label}')
    return text.replace(old,new,1)

path=Path('src/weatherPresentation.js')
text=path.read_text()
anchor="export function roundWeatherValue(value,{digits=0,suffix=''}={}){const number=numeric(value);if(number===null)return'';return`${Number(number.toFixed(digits))}${suffix}`}"
insert="export function hasUsableWeather(weather){return Boolean(numeric(weather?.temperature)!==null||numeric(weather?.high)!==null||numeric(weather?.low)!==null||(weather?.condition&&!/unavailable/i.test(String(weather.condition))))}\n"+anchor
text=replace_required(text,anchor,insert,'usable weather helper')
path.write_text(text)

path=Path('src/WorkspaceScreens.jsx')
text=path.read_text()
text=replace_required(text,"import{formatRainAmount,groupWeatherImpacts,roundWeatherValue}from'./weatherPresentation.js';","import{formatRainAmount,groupWeatherImpacts,hasUsableWeather,roundWeatherValue}from'./weatherPresentation.js';",'weather helper import')
text=replace_required(text,"usableWeather=Boolean(temperature||(weather?.condition&&!/unavailable/i.test(weather.condition)))","usableWeather=hasUsableWeather(weather)",'weather line helper')
text=replace_required(text,"function GardenWeatherBrief({guidance,onDecision,navigate}){\n const groups=groupWeatherImpacts(guidance?.recommendations||guidance?.brief||[],3);if(!groups.length)return null;","function GardenWeatherBrief({guidance,onDecision,navigate,weather}){\n if(!hasUsableWeather(weather))return null;const groups=groupWeatherImpacts(guidance?.recommendations||guidance?.brief||[],3);if(!groups.length)return null;",'hide unsupported impacts')
text=replace_required(text,"<GardenWeatherBrief guidance={weatherGuidance} onDecision={onWeatherDecision} navigate={navigate}/>","<GardenWeatherBrief guidance={weatherGuidance} onDecision={onWeatherDecision} navigate={navigate} weather={weatherState.weather}/>",'weather brief prop')
path.write_text(text)

path=Path('test/weatherPresentation.test.js')
text=path.read_text()
text=text.replace("import{bestWeatherTimestamp,formatRainAmount,groupWeatherImpacts,normalizeForecastDays,roundWeatherValue}from'../src/weatherPresentation.js';","import{bestWeatherTimestamp,formatRainAmount,groupWeatherImpacts,hasUsableWeather,normalizeForecastDays,roundWeatherValue}from'../src/weatherPresentation.js';",1)
text += "\ntest('weather impacts wait for a usable reading or forecast summary',()=>{assert.equal(hasUsableWeather(null),false);assert.equal(hasUsableWeather({condition:'Current conditions unavailable'}),false);assert.equal(hasUsableWeather({high:82}),true);assert.equal(hasUsableWeather({temperature:71,condition:'Clear'}),true)});\n"
path.write_text(text)
print('aligned loading and unavailable weather presentation')
