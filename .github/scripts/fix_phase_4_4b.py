from pathlib import Path

def replace_required(text,old,new,label):
    if old not in text:
        raise SystemExit(f'Missing expected text for {label}')
    return text.replace(old,new,1)

path=Path('src/weatherDecisionEngine.js')
text=path.read_text()
text=replace_required(text,"const freshness=weather=>weather?.isStale?'Stale':weather?.freshness||'Unavailable';","const freshness=weather=>weather?.isStale?'Stale':weather?.freshness||(weather&&(weather.currentObservation||weather.forecasts?.length||weather.temperature!==null&&weather.temperature!==undefined||weather.high!==null&&weather.high!==undefined||weather.low!==null&&weather.low!==undefined||Object.keys(weather.signals||{}).length)?'Current':'Unavailable');",'legacy freshness inference')
old="const rows=forecastRows(weather),forecastAmount=rows.slice(0,48).reduce((sum,row)=>sum+forecastAmount(row),0),probability=Math.max(0,...rows.slice(0,48).map(forecastProbability)),observed=number(weather?.recentRain24h)||0"
new="const rows=forecastRows(weather),forecastTotal=rows.slice(0,48).reduce((sum,row)=>sum+forecastAmount(row),0),probability=Math.max(0,...rows.slice(0,48).map(forecastProbability)),observed=number(weather?.recentRain24h)||0"
text=replace_required(text,old,new,'rain total shadowing')
text=text.replace("forecastAmount>=WEATHER_DECISION_THRESHOLDS.forecastHeavyRainIn","forecastTotal>=WEATHER_DECISION_THRESHOLDS.forecastHeavyRainIn",1)
text=text.replace("`${forecastAmount.toFixed(2)} in of rain is forecast", "`${forecastTotal.toFixed(2)} in of rain is forecast",1)
text=text.replace("(heavyObserved?observed:forecastAmount).toFixed(2)","(heavyObserved?observed:forecastTotal).toFixed(2)",1)
text=replace_required(text,"const spaces=spaceMap(garden),plants=activePlants(garden),vulnerable=plants.filter(plant=>{const space=spaces.get(plant.spaceId);return isContainer(space)||isNewPlant(plant)||HEAT_SENSITIVE.has(cropId(plant))}","const spaces=spaceMap(garden),plants=activePlants(garden),vulnerable=plants.filter(plant=>{const space=spaces.get(plant.spaceId);return!isIndoor(space)&&(isContainer(space)||isNewPlant(plant)||HEAT_SENSITIVE.has(cropId(plant))||high>=WEATHER_DECISION_THRESHOLDS.extremeHeatF)}",'extreme heat compatibility')
old="const history=recommendationHistory||garden.weatherRecommendationHistory||[],hasWeather=Boolean(weather&&(weather.currentObservation||weather.forecasts?.length||weather.temperature!==null&&weather.temperature!==undefined)),raw=[];"
new="const history=recommendationHistory||garden.weatherRecommendationHistory||[],hasWeather=Boolean(weather&&(weather.currentObservation||weather.forecasts?.length||weather.temperature!==null&&weather.temperature!==undefined||weather.high!==null&&weather.high!==undefined||weather.low!==null&&weather.low!==undefined||Object.keys(weather.signals||{}).length)),raw=[];"
text=replace_required(text,old,new,'legacy weather presence')
path.write_text(text)

path=Path('src/yearRoundEngine.js')
text=path.read_text()
old="const WEATHER_TASK_CATEGORIES=new Set(['frost','heat','wind','storm','heavy-rain','disease-risk']);\nfunction weatherTasks(weather,date,garden,guidance=null){const decisionSet=guidance||buildWeatherDecisionEngine({garden,weather,now:date.getTime()}),rows=(decisionSet.recommendations||[]).filter(row=>WEATHER_TASK_CATEGORIES.has(row.category)&&row.priority>=65);return rows.map(row=>{const plant=(garden.plants||[]).find(item=>row.affectedPlants?.includes(item.id)),space=(garden.spaces||[]).find(item=>row.affectedGrowingSpaces?.includes(item.id)),alert={id:row.recommendationId,type:row.title,severity:row.priority>=90?'Urgent':row.priority>=70?'High':'Normal',what:row.plainLanguageExplanation,why:row.recommendedAction,when:row.timing,source:row.source};return task({id:row.recommendationId,kind:'weather',taskType:row.category==='disease-risk'?'Inspect For Problems':row.title,plant,space,priority:row.priority,title:row.title,subtitle:row.plainLanguageExplanation,reason:row.recommendedAction,when:row.timing,source:row.source,weatherAlert:alert,weatherDriven:true,action:'Review'},date)})}"
new="const WEATHER_TASK_CATEGORIES=new Set(['frost','heat','wind','storm','heavy-rain','disease-risk']),WEATHER_TASK_TYPES={frost:'Frost Protection',heat:'Heat Protection',wind:'Wind Protection',storm:'Storm Preparation','heavy-rain':'Drainage Check','disease-risk':'Inspect For Problems'};\nfunction weatherTasks(weather,date,garden,guidance=null){const decisionSet=guidance||buildWeatherDecisionEngine({garden,weather,now:date.getTime()}),rows=(decisionSet.recommendations||[]).filter(row=>WEATHER_TASK_CATEGORIES.has(row.category)&&row.priority>=65);return rows.map(row=>{const plant=(garden.plants||[]).find(item=>row.affectedPlants?.includes(item.id)),space=(garden.spaces||[]).find(item=>row.affectedGrowingSpaces?.includes(item.id)),taskType=WEATHER_TASK_TYPES[row.category]||row.title,alert={id:row.recommendationId,type:taskType,severity:row.priority>=90?'Urgent':row.priority>=70?'High':'Normal',what:row.plainLanguageExplanation,why:row.recommendedAction,when:row.timing,source:row.source};return task({id:row.recommendationId,kind:'weather',taskType,plant,space,priority:row.priority,title:row.title,subtitle:row.plainLanguageExplanation,reason:row.recommendedAction,when:row.timing,source:row.source,weatherAlert:alert,weatherDriven:true,action:'Review'},date)})}"
text=replace_required(text,old,new,'canonical weather task types')
path.write_text(text)

path=Path('test/weatherDecisionEngine.test.js')
text=path.read_text()
text=replace_required(text,"observations:patch.observations||current?[current]:[]","observations:patch.observations||(current?[current]:[])",'observation fixture precedence')
text=replace_required(text,"plant('kale','kale','bed',{lastWatered:iso(-2)})","plant('kale','kale','bed','Established',{lastWatered:iso(-2)})",'mild fixture stage')
path.write_text(text)

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
