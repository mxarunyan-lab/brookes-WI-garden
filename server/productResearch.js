const providers=[];
export function registerProductResearchProvider(provider){providers.push(provider)}
export async function researchExactSeedProduct(identity,{signal}={}){for(const provider of providers){try{const result=await provider.find(identity,{signal});if(result?.exact)return result}catch{}}return{exact:false,candidate:null,sources:[],checkedAt:new Date().toISOString(),reason:'No configured trusted provider returned an exact product.'}}
export function configuredResearchProviders(){return providers.map(p=>p.name||'unnamed-provider')}
