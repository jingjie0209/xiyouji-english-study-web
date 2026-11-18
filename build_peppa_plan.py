from pathlib import Path
import json,re
from docx import Document

BASE=Path(__file__).resolve().parent
DOC=BASE.parent/'小猪佩奇第一季_语法原句与固定搭配统计.docx'
OUT=BASE/'data/peppa-plan.js'

doc=Document(str(DOC))
grammar_table, colloc_table = doc.tables[:2]
ipa_re=re.compile(r'\s*/[^/]+/\s*')

grammar=[]
for row in grammar_table.rows[1:]:
    cells=[c.text.strip() for c in row.cells]
    grammar.append({
        'type':cells[1],
        'pattern':ipa_re.sub(' ',cells[2]).strip(),
        'description':cells[3],
        'count':int(cells[4]) if cells[4].isdigit() else 0,
        'source':[x.strip() for x in cells[5].splitlines() if x.strip()],
        'extensions':[x.strip() for x in cells[6].splitlines() if x.strip()]
    })

collocations=[]
for row in colloc_table.rows[1:]:
    cells=[c.text.strip() for c in row.cells]
    phrase_lines=[x.strip() for x in cells[1].splitlines() if x.strip()]
    phrase=phrase_lines[0] if phrase_lines else ''
    ipa=phrase_lines[1].strip('/') if len(phrase_lines)>1 else ''
    collocations.append({
        'phrase':phrase,
        'ipa':ipa,
        'zh':cells[2],
        'count':int(cells[3]) if cells[3].isdigit() else 0,
        'context':cells[4]
    })

payload={
    'source':'小猪佩奇第一季_语法原句与固定搭配统计.docx',
    'summaryFile':'assets/peppa-season1-summary.docx',
    'grammar':grammar,
    'collocations':collocations
}
OUT.write_text('window.PEPPA_PLAN_DATA='+json.dumps(payload,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
print('grammar',len(grammar),'collocations',len(collocations),'bytes',OUT.stat().st_size)
