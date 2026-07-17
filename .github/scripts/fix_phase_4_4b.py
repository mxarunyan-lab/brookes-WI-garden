from pathlib import Path


def save(path, text):
    Path(path).write_text(text)
    print(f'updated {path}')


path='src/weatherDecisionEngine.js'
text=Path(path).read_text()
text=text.replace("const freshness=weather=>weather?.isStale?'Stale':weather?.freshness||'Unavailable';","const freshness=weather=>weather?.isStale?'Stale':weather?.freshness||(weather&&(weather.currentObservation||weather.forecasts?.length||weather.temperature!==null&&weather.temperature!==undefined||weather.high!==null&&weather.high!==undefined||weather.low!==null&&weather.low!==undefined||Object.keys(weather.signals||{}).length)?'Current':'Unavailable');")
text=text.replace("forecastAmount=rows.slice(0,48).reduce((sum,row)=>sum+forecastAmount(row),0)","forecastTotal=rows.slice(0,48).reduce((sum,row)=>sum+forecastAmount(row),0)")
text=text.replace("forecastAmount>=WEATHER_DECISION_THRESHOLDS.forecastHeavyRainIn","forecastTotal>=WEATHER_DECISION_THRESHOLDS.forecastHeavyRainIn",1)
text=text.replace("`${forecastAmount.toFixed(2)} in of rain is forecast","`${forecastTotal.toFixed(2)} in of rain is forecast",1)
text=text.replace("(heavyObserved?observed:forecastAmount).toFixed(2)","(heavyObserved?observed:forecastTotal).toFixed(2)",1)
text=text.replace("return isContainer(space)||isNewPlant(plant)||HEAT_SENSITIVE.has(cropId(plant))","return!isIndoor(space)&&(isContainer(space)||isNewPlant(plant)||HEAT_SENSITIVE.has(cropId(plant))||high>=WEATHER_DECISION_THRESHOLDS.extremeHeatF)",1)
text=text.replace("weather.temperature!==null&&weather.temperature!==undefined)),raw=[];","weather.temperature!==null&&weather.temperature!==undefined||weather.high!==null&&weather.high!==undefined||weather.low!==null&&weather.low!==undefined||Object.keys(weather.signals||{}).length)),raw=[];",1)
checks={
 'freshness compatibility':"Object.keys(weather.signals||{}).length)?'Current':'Unavailable'" in text,
 'rain total rename':'forecastTotal=rows.slice(0,48)' in text and 'const rows=forecastRows(weather),forecastAmount=' not in text,
 'extreme heat compatibility':'high>=WEATHER_DECISION_THRESHOLDS.extremeHeatF)' in text,
 'legacy weather presence':'||Object.keys(weather.signals||{}).length)),raw=[];' in text,
}
if not all(checks.values()):
    raise SystemExit(f'weather engine checks failed: {checks}')
save(path,text)

path='src/yearRoundEngine.js'
text=Path(path).read_text()
text=text.replace("const WEATHER_TASK_CATEGORIES=new Set(['frost','heat','wind','storm','heavy-rain','disease-risk']);","const WEATHER_TASK_CATEGORIES=new Set(['frost','heat','wind','storm','heavy-rain','disease-risk']),WEATHER_TASK_TYPES={frost:'Frost Protection',heat:'Heat Protection',wind:'Wind Protection',storm:'Storm Preparation','heavy-rain':'Drainage Check','disease-risk':'Inspect For Problems'};",1)
text=text.replace("space=(garden.spaces||[]).find(item=>row.affectedGrowingSpaces?.includes(item.id)),alert=","space=(garden.spaces||[]).find(item=>row.affectedGrowingSpaces?.includes(item.id)),taskType=WEATHER_TASK_TYPES[row.category]||row.title,alert=",1)
text=text.replace("alert={id:row.recommendationId,type:row.title,","alert={id:row.recommendationId,type:taskType,",1)
text=text.replace("taskType:row.category==='disease-risk'?'Inspect For Problems':row.title,plant","taskType,plant",1)
if "WEATHER_TASK_TYPES={frost:'Frost Protection',heat:'Heat Protection'" not in text or "taskType,plant,space" not in text:
    raise SystemExit('canonical weather task type patch failed')
save(path,text)

path='test/weatherDecisionEngine.test.js'
text=Path(path).read_text()
text=text.replace("observations:patch.observations||current?[current]:[]","observations:patch.observations||(current?[current]:[])",1)
text=text.replace("plant('kale','kale','bed',{lastWatered:iso(-2)})","plant('kale','kale','bed','Established',{lastWatered:iso(-2)})",1)
if "observations:patch.observations||(current?[current]:[])" not in text or "'bed','Established',{lastWatered" not in text:
    raise SystemExit('weather scenario fixture patch failed')
save(path,text)

normal_validate="""name: Validate Garden App

on:
  push:
    branches: [main]
  pull_request:

permissions:
  contents: read

jobs:
  test-and-build:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - name: Check out repository
        uses: actions/checkout@v4
      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
      - name: Install dependencies
        run: npm install
      - name: Run environmental and weather-decision tests
        id: tests
        continue-on-error: true
        run: npm test > test.log 2>&1
      - name: Upload test log
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: garden-test-log
          path: test.log
          retention-days: 2
      - name: Stop when tests failed
        if: steps.tests.outcome == 'failure'
        run: exit 1
      - name: Build production app
        id: production_build
        continue-on-error: true
        run: npm run build > build.log 2>&1
      - name: Upload build log
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: production-build-log
          path: build.log
          retention-days: 2
      - name: Upload compiled app
        if: steps.production_build.outcome == 'success'
        uses: actions/upload-artifact@v4
        with:
          name: compiled-garden-app
          path: dist
          retention-days: 2
      - name: Fail when production build failed
        if: steps.production_build.outcome == 'failure'
        run: exit 1
"""
Path('.github/workflows/validate.yml').write_text(normal_validate)
Path('.github/scripts/fix_phase_4_4b.py').unlink()
print('restored validation workflow and removed temporary patch script')
