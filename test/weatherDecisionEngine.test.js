import test from'node:test';
import assert from'node:assert/strict';
import{buildWeatherDecisionEngine,createWeatherRecommendationDecision,wateringDecisionForPlant,WEATHER_DECISION_THRESHOLDS}from'../src/weatherDecisionEngine.js';

const NOW=Date.now(),iso=hours=>new Date(NOW+hours*3600000).toISOString();
const spaces={bed:{id:'bed',name:'Raised Bed',type:'black-square-bed'},container:{id:'container',name:'Patio Pot',type:'container'},covered:{id:'covered',name:'Covered Pot',type:'container',weatherExposure:'fully-rain-protected'},inside:{id:'inside',name:'Indoor Shelf',type:'indoor'},greenhouse:{id:'greenhouse',name:'Greenhouse',type:'greenhouse'}};
const plant=(id,cropId,spaceId,stage='Established',extra={})=>({id,name:id,cropId,spaceId,stage,lastWatered:iso(-72),lastSoilCheck:iso(-72),moisture:'unknown',...extra});
const garden=(plants=[plant('tomato','tomato','bed')],selectedSpaces=Object.values(spaces),history=[])=>({plants,spaces:selectedSpaces,weatherRecommendationHistory:history,taskHistory:[],profile:{gardenerName:'Brooke'}});
const observation=(patch={})=>({record_id:`obs-${Math.random()}`,source_type:'observed',source_name:'NWS KGRB',source_provider:'National Weather Service',source_station_id:'KGRB',observed_at:iso(-.1),received_at:iso(-.05),temperature:70,humidity:55,wind_speed:5,wind_gust:8,precipitation_amount:0,...patch});
const forecast=(hours,patch={})=>({record_id:`forecast-${hours}-${Math.random()}`,source_type:'forecast',source_name:'NWS forecast',source_provider:'National Weather Service',forecast_for:iso(hours),expires_at:iso(hours+2),temperature:70,minimum_temperature:null,maximum_temperature:null,wind_speed:5,wind_gust:8,precipitation_amount:0,precipitation_probability:0,...patch});
const weather=(patch={})=>{const current=patch.currentObservation===undefined?observation():patch.currentObservation,forecasts=patch.forecasts||[forecast(3)],recentRain24h=patch.recentRain24h??0;return{currentObservation:current,observations:patch.observations||current?[current]:[],forecasts,temperature:patch.temperature??current?.temperature??null,humidity:patch.humidity??current?.humidity??null,high:patch.high??75,low:patch.low??55,wind:patch.wind??current?.wind_speed??5,windGust:patch.windGust??current?.wind_gust??8,recentRain24h,rainCreditBySpace:patch.rainCreditBySpace||Object.fromEntries(Object.values(spaces).map(space=>[space.id,{amount:['covered','inside','greenhouse'].includes(space.id)?0:recentRain24h,factor:['covered','inside','greenhouse'].includes(space.id)?0:1,exposure:space.type}])),activeAlerts:patch.activeAlerts||[],isStormingNow:Boolean(patch.isStormingNow),freshness:patch.freshness||'Current',confidence:patch.confidence||'High',isStale:Boolean(patch.isStale),provider:patch.provider||'National Weather Service',...patch};};
const actions=result=>result.recommendations.map(row=>row.actionKey);

// 1
test('mild day produces a calm no-action brief',()=>{const result=buildWeatherDecisionEngine({weather:weather(),garden:garden([plant('kale','kale','bed',{lastWatered:iso(-2)})]),now:NOW});assert.equal(result.brief[0].actionKey,'calm-weather')});

// 2
test('recent observed rain covers exposed bed without pretending protected spaces were watered',()=>{const w=weather({recentRain24h:.56});const exposed=wateringDecisionForPlant({plant:plant('tomato','tomato','bed'),space:spaces.bed,weather:w,now:NOW});const protectedDecision=wateringDecisionForPlant({plant:plant('pepper','bell-pepper','covered'),space:spaces.covered,weather:w,now:NOW});assert.equal(exposed.actionKey,'no-watering');assert.equal(protectedDecision.actionKey,'check-soil');assert.match(protectedDecision.explanation,/protected/i)});

// 3
test('forecast rain that has not happened delays rather than completes watering',()=>{const w=weather({forecasts:[forecast(4,{precipitation_probability:85,precipitation_amount:.35})],recentRain24h:0});const decision=wateringDecisionForPlant({plant:plant('tomato','tomato','bed'),space:spaces.bed,weather:w,now:NOW});assert.equal(decision.actionKey,'delay-watering');assert.equal(decision.observedRain,0)});

// 4
test('low rain probability does not cancel watering',()=>{const w=weather({forecasts:[forecast(4,{precipitation_probability:25,precipitation_amount:.4})]});const dry=plant('tomato','tomato','bed','Established',{moisture:'dry'});assert.equal(wateringDecisionForPlant({plant:dry,space:spaces.bed,weather:w,now:NOW}).actionKey,'water-now')});

// 5
test('heavy rain forecast creates one preparation recommendation',()=>{const result=buildWeatherDecisionEngine({weather:weather({forecasts:[forecast(8,{precipitation_probability:90,precipitation_amount:.8})]}),garden:garden(),now:NOW});assert.equal(result.recommendations.filter(row=>row.actionKey==='prepare-heavy-rain').length,1)});

// 6
test('exposed container during heat and wind is prioritized separately',()=>{const p=plant('pepper','bell-pepper','container');const result=buildWeatherDecisionEngine({weather:weather({high:94,wind:22,windGust:34,forecasts:[forecast(4,{maximum_temperature:94,wind_speed:22,wind_gust:34})]}),garden:garden([p],[spaces.container]),now:NOW});assert.ok(result.recommendations.some(row=>row.category==='heat'&&row.affectedPlants.includes(p.id)));assert.ok(result.recommendations.some(row=>row.category==='wind'&&row.affectedPlants.includes(p.id)));assert.ok(result.recommendations.some(row=>row.category==='watering'&&row.actionKey==='check-soil'))});

// 7
test('covered container receives no outdoor rainfall credit',()=>{const p=plant('covered-pepper','bell-pepper','covered');const result=buildWeatherDecisionEngine({weather:weather({recentRain24h:1}),garden:garden([p],[spaces.covered]),now:NOW});const row=result.recommendations.find(item=>item.category==='watering');assert.ok(row);assert.match(row.plainLanguageExplanation,/protected/i)});

// 8
test('indoor plants never receive outdoor frost action',()=>{const p=plant('indoor-basil','basil','inside','Seedling');const result=buildWeatherDecisionEngine({weather:weather({low:30,forecasts:[forecast(8,{minimum_temperature:30})]}),garden:garden([p],[spaces.inside]),now:NOW});assert.equal(result.recommendations.some(row=>row.category==='frost'&&row.affectedPlants.includes(p.id)),false)});

// 9
test('frost-sensitive outdoor plant near threshold receives cautious protection guidance',()=>{const p=plant('pepper','bell-pepper','bed','Transplanted');const result=buildWeatherDecisionEngine({weather:weather({low:35,forecasts:[forecast(8,{minimum_temperature:35})]}),garden:garden([p],[spaces.bed]),now:NOW});const row=result.recommendations.find(item=>item.category==='frost');assert.ok(row);assert.equal(row.actionKey,'protect-frost');assert.equal(row.sourceType,'forecast')});

// 10
test('established cold-tolerant plant does not receive frost protection action',()=>{const p=plant('kale','kale','bed','Established');const result=buildWeatherDecisionEngine({weather:weather({low:35,forecasts:[forecast(8,{minimum_temperature:35})]}),garden:garden([p],[spaces.bed]),now:NOW});assert.equal(result.recommendations.some(row=>['protect-frost','protect-freeze'].includes(row.actionKey)),false)});

// 11
test('newly transplanted plant during strong wind receives securing guidance',()=>{const p=plant('tomato','tomato','bed','Transplanted');const result=buildWeatherDecisionEngine({weather:weather({windGust:38,forecasts:[forecast(5,{wind_gust:38})]}),garden:garden([p],[spaces.bed]),now:NOW});assert.ok(result.recommendations.some(row=>row.category==='wind'&&row.affectedPlants.includes(p.id)))});

// 12
test('high humidity and repeated rainfall creates a cautious disease-risk signal',()=>{const p=plant('tomato','tomato','bed');const result=buildWeatherDecisionEngine({weather:weather({humidity:88,recentRain24h:.4,forecasts:[forecast(4,{precipitation_probability:70,precipitation_amount:.1}),forecast(12,{precipitation_probability:75,precipitation_amount:.1})]}),garden:garden([p],[spaces.bed]),now:NOW});const row=result.recommendations.find(item=>item.category==='disease-risk');assert.ok(row);assert.match(row.plainLanguageExplanation,/not a diagnosis/i)});

// 13
test('stale weather never creates high-confidence advice',()=>{const result=buildWeatherDecisionEngine({weather:weather({freshness:'Stale',isStale:true,confidence:'High'}),garden:garden(),now:NOW});assert.equal(result.recommendations.some(row=>row.confidence==='High'),false);assert.ok(result.recommendations.some(row=>row.category==='watering'&&row.actionKey==='check-soil'))});

// 14
test('total provider failure preserves a compact unavailable recommendation',()=>{const result=buildWeatherDecisionEngine({weather:null,garden:garden(),now:NOW});assert.equal(result.brief[0].category,'unavailable');assert.equal(result.brief[0].confidence,'Low')});

// 15
test('partial provider failure can still use forecast data with labels',()=>{const w=weather({currentObservation:null,observations:[],temperature:null,forecasts:[forecast(6,{minimum_temperature:34})],confidence:'Medium'});const result=buildWeatherDecisionEngine({weather:w,garden:garden([plant('pepper','bell-pepper','bed','Transplanted')],[spaces.bed]),now:NOW});assert.notEqual(result.brief[0].category,'unavailable');assert.ok(result.recommendations.some(row=>row.sourceType==='forecast'))});

// 16
test('materially conflicting observation sources lower confidence',()=>{const a=observation({source_provider:'National Weather Service',temperature:70}),b=observation({source_provider:'Regional model',source_name:'Regional model',temperature:82});const result=buildWeatherDecisionEngine({weather:weather({currentObservation:a,observations:[a,b],high:94,forecasts:[forecast(3,{maximum_temperature:94})]}),garden:garden([plant('pepper','bell-pepper','container')],[spaces.container]),now:NOW});assert.ok(result.recommendations.length);assert.equal(result.recommendations.some(row=>row.confidence==='High'),false)});

// 17
test('dismissed recommendation stays suppressed while conditions are unchanged',()=>{const w=weather({high:94,forecasts:[forecast(3,{maximum_temperature:94})]});const g=garden([plant('pepper','bell-pepper','container')],[spaces.container]);const first=buildWeatherDecisionEngine({weather:w,garden:g,now:NOW}),target=first.recommendations.find(row=>row.category==='heat'),decision=createWeatherRecommendationDecision(target,'dismissed','Brooke',new Date(NOW));const second=buildWeatherDecisionEngine({weather:w,garden:{...g,weatherRecommendationHistory:[decision]},now:NOW+60000});assert.equal(second.recommendations.some(row=>row.recommendationId===target.recommendationId),false)});

// 18
test('completed watering reduces duplicate watering prompts',()=>{const p=plant('pepper','bell-pepper','container','Established',{lastWatered:iso(-2),moisture:'unknown'});const result=buildWeatherDecisionEngine({weather:weather({high:92}),garden:garden([p],[spaces.container]),now:NOW});assert.equal(result.recommendations.some(row=>row.category==='watering'&&['water-now','check-soil'].includes(row.actionKey)),false)});

// 19
test('recommendations remain deduplicated across one calculation',()=>{const result=buildWeatherDecisionEngine({weather:weather({high:95,windGust:38,forecasts:[forecast(3,{maximum_temperature:95,wind_gust:38}),forecast(4,{maximum_temperature:95,wind_gust:38})]}),garden:garden([plant('tomato','tomato','container','Transplanted')],[spaces.container]),now:NOW});const ids=result.recommendations.map(row=>row.recommendationId);assert.equal(new Set(ids).size,ids.length)});

// 20
test('material forecast change creates a new fingerprint and allows guidance to return',()=>{const g=garden([plant('pepper','bell-pepper','container')],[spaces.container]),firstWeather=weather({high:90,forecasts:[forecast(3,{maximum_temperature:90})]}),first=buildWeatherDecisionEngine({weather:firstWeather,garden:g,now:NOW}),target=first.recommendations.find(row=>row.category==='heat'),decision=createWeatherRecommendationDecision(target,'dismissed','Brooke',new Date(NOW)),changed=buildWeatherDecisionEngine({weather:weather({high:99,forecasts:[forecast(3,{maximum_temperature:99})]}),garden:{...g,weatherRecommendationHistory:[decision]},now:NOW+60000}),returned=changed.recommendations.find(row=>row.category==='heat');assert.ok(returned);assert.notEqual(returned.conditionFingerprint,target.conditionFingerprint)});

test('thresholds remain explicit and testable',()=>{assert.equal(WEATHER_DECISION_THRESHOLDS.freezeF,32);assert.equal(WEATHER_DECISION_THRESHOLDS.forecastRainProbability,70);assert.equal(WEATHER_DECISION_THRESHOLDS.strongWindGustMph,35)});
