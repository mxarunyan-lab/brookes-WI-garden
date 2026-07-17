import test from'node:test';
import assert from'node:assert/strict';
import{classifyPersistenceError,estimateJsonBytes}from'../src/gardenPersistence.js';

test('quota errors become plain storage guidance',()=>{const error=Object.assign(new Error('Quota exceeded'),{name:'QuotaExceededError'}),result=classifyPersistenceError(error);assert.equal(result.kind,'storage');assert.match(result.message,/draft and photos are still here/i)});
test('serialization errors are distinguished',()=>{const result=classifyPersistenceError(new Error('Converting circular structure to JSON'));assert.equal(result.kind,'serialization');assert.match(result.message,/could not prepare/i)});
test('unknown storage failure still provides recovery wording',()=>{const result=classifyPersistenceError(new Error('Unknown write failure'));assert.match(result.message,/still on screen/i)});
test('JSON storage estimate is finite for packet data',()=>{const bytes=estimateJsonBytes({seedPackets:[{name:'Basil',frontPhoto:'data:image/jpeg;base64,abc'}]});assert.ok(Number.isFinite(bytes));assert.ok(bytes>0)});
test('circular data reports an infinite estimate rather than throwing',()=>{const value={};value.self=value;assert.equal(estimateJsonBytes(value),Infinity)});
