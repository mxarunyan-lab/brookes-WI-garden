from pathlib import Path


def required_replace(text, old, new, label):
    if old not in text:
        raise SystemExit(f'missing {label}')
    return text.replace(old, new, 1)


path=Path('src/weatherDecisionEngine.js')
text=path.read_text()
text=text.replace('forecastAmount.toFixed(2)','forecastTotal.toFixed(2)')
text=required_replace(text,"maxProbability=Math.max(0,...rows.map(forecastProbability)),expectedAmount=rows.reduce((sum,row)=>sum+forecastAmount(row),0),fresh=freshness(weather)","maxProbability=Math.max(0,...rows.map(forecastProbability)),expectedAmount=rows.reduce((sum,row)=>sum+forecastAmount(row),0),forecastSignal=Boolean(weather?.signals?.rainExpectedSoon?.status),fresh=freshness(weather)",'forecast signal input')
text=required_replace(text,"if(dry&&observedRain<thresholds.meaningfulRainIn&&!(maxProbability>=thresholds.forecastRainProbability&&expectedAmount>=thresholds.forecastRainAmountIn))","if(dry&&observedRain<thresholds.meaningfulRainIn&&!forecastSignal&&!(maxProbability>=thresholds.forecastRainProbability&&expectedAmount>=thresholds.forecastRainAmountIn))",'dry watering safeguard')
text=required_replace(text,"if(observedRain>=thresholds.meaningfulRainIn&&!container)return{actionKey:'no-watering',status:'Recent rainfall likely covered this space',priority:30,explanation:`About ${observedRain.toFixed(2)} in of effective observed rain was credited to this space.","if(observedRain>=thresholds.meaningfulRainIn&&!container)return{actionKey:'check-soil',status:'Recent rainfall likely covered this space',priority:42,explanation:`About ${observedRain.toFixed(2)} in of effective observed rain was credited to this space. Check the root zone before adding more.",'observed rain soil check')
needle="if(maxProbability>=thresholds.forecastRainProbability&&expectedAmount>=thresholds.forecastRainAmountIn)return{actionKey:'delay-watering'"
insert="if(forecastSignal&&observedRain<thresholds.meaningfulRainIn)return{actionKey:'delay-watering',status:'Delay watering and reassess',priority:60,explanation:weather?.signals?.rainExpectedSoon?.reason||'Forecast rain may arrive, but it has not happened yet. Reassess the root zone after the forecast period.',confidence:'Medium',observedRain,expectedAmount,maxProbability};\n "+needle
text=required_replace(text,needle,insert,'forecast signal delay')
if 'forecastAmount.toFixed' in text or "actionKey:'no-watering',status:'Recent rainfall likely covered" in text:
    raise SystemExit('weather decision cleanup incomplete')
path.write_text(text)
print('updated weather decision engine')

path=Path('src/yearRoundEngine.js')
text=path.read_text()
text=required_replace(text,"taskType:'Check Moisture',priority:weather?.signals?.greenhouseOverheatRisk?.status?94:55","taskType:weather?.signals?.greenhouseOverheatRisk?.status?'Greenhouse Ventilation':'Check Moisture',priority:weather?.signals?.greenhouseOverheatRisk?.status?94:55",'greenhouse task type')
path.write_text(text)
print('updated year-round task compatibility')

path=Path('test/weatherDecisionEngine.test.js')
text=path.read_text()
text=required_replace(text,"assert.equal(exposed.actionKey,'no-watering')","assert.equal(exposed.actionKey,'check-soil')",'observed rain scenario expectation')
path.write_text(text)
print('updated observed-rain scenario')

Path('.github/scripts/fix_phase_4_4b.py').unlink()
print('removed temporary patch script')
