from pathlib import Path

path=Path('src/seedPacketIntelligence.js')
text=path.read_text()
old="const found=(text,regex,index=1)=>asText(text.match(regex)?.[index]);"
new="const found=(text,regex,index=1)=>asText(text.match(regex)?.[index]);\nconst dimension=(text,regex)=>{const match=text.match(regex);return match?`${match[1]} ${match[2]}`.replace(/\\s+/g,' ').trim():''};"
if old not in text: raise SystemExit('missing found helper')
text=text.replace(old,new,1)
replacements={
"const depth=found(text,/(?:plant|sow)(?:\\s+seed)?\\s*(?:at|about|depth|:)??\\s*((?:\\d+\\s+)?\\d+\\/\\d+|\\d+(?:\\.\\d+)?)\\s*(inches?|in\\.?|cm)\\b/i);":"const depth=dimension(text,/(?:plant|sow)(?:\\s+seed)?\\s*(?:at|about|depth|:)??\\s*((?:\\d+\\s+)?\\d+\\/\\d+|\\d+(?:\\.\\d+)?)\\s*(inch(?:es)?|in\\.?|cm)\\b/i);",
"const thin=found(text,/(?:thin(?:ning)?\\s+(?:to|spacing)?|thin plants to)\\s*[:.]?\\s*((?:\\d+\\s+)?\\d+\\/\\d+|\\d+(?:\\.\\d+)?)\\s*(inches?|in\\.?|cm)\\b/i);":"const thin=dimension(text,/(?:thin(?:ning)?\\s+(?:to|spacing)?|thin plants to)\\s*[:.]?\\s*((?:\\d+\\s+)?\\d+\\/\\d+|\\d+(?:\\.\\d+)?)\\s*(inch(?:es)?|in\\.?|cm)\\b/i);",
"const row=found(text,/(?:row\\s+spacing|rows?\\s+apart)\\s*[:.]?\\s*((?:\\d+\\s+)?\\d+\\/\\d+|\\d+(?:\\.\\d+)?)\\s*(inches?|in\\.?|cm|feet|ft\\.?)\\b/i);":"const row=dimension(text,/(?:row\\s+spacing|rows?\\s+apart)\\s*[:.]?\\s*((?:\\d+\\s+)?\\d+\\/\\d+|\\d+(?:\\.\\d+)?)\\s*(inch(?:es)?|in\\.?|cm|feet|foot|ft\\.?)\\b/i);",
"const spacing=found(text,/(?:plant\\s+spacing|spacing|space\\s+plants?)\\s*[:.]?\\s*((?:\\d+\\s+)?\\d+\\/\\d+|\\d+(?:\\.\\d+)?)\\s*(inches?|in\\.?|cm|feet|ft\\.?)\\b/i);":"const spacing=dimension(text,/(?:plant\\s+spacing|spacing|space\\s+plants?)\\s*[:.]?\\s*((?:\\d+\\s+)?\\d+\\/\\d+|\\d+(?:\\.\\d+)?)\\s*(inch(?:es)?|in\\.?|cm|feet|foot|ft\\.?)\\b/i);"
}
for old,new in replacements.items():
    if old not in text: raise SystemExit(f'missing dimension parser: {old[:30]}')
    text=text.replace(old,new,1)
path.write_text(text)

path=Path('test/seedPacketIntelligence.test.js')
text=path.read_text()
text=text.replace("assert.equal(result.fields.depth.value,'1/4');assert.equal(result.fields.spacing.value,'18');","assert.equal(result.fields.depth.value,'1/4 inch');assert.equal(result.fields.spacing.value,'18 inches');",1)
text=text.replace("assert.equal(result.fields.spacing.value,'18')","assert.equal(result.fields.spacing.value,'18 inches')",1)
path.write_text(text)
print('fixed singular packet dimensions and preserved units')
