from pathlib import Path
from pypdf import PdfReader
import json, re, unicodedata

PDF = Path('/Users/jingjie/Downloads/西游记.pdf')
OUT = Path(__file__).parent / 'data' / 'episodes_raw.json'
CACHE = Path(__file__).parent / 'data' / 'pages.jsonl'
HEADING_RE = re.compile(r'^第\s*(\d+)\s*[-–—]\s*(\d+)\s*集\s*[-–—]\s*(\d+)\s*[-–—]\s*(.+?)\s*$')
PAGE_NO_RE = re.compile(r'^\d+\s*/\s*\d+$')
# PDF extraction sometimes returns CJK radicals/compatibility ideographs
# (for example U+2ED4 "⻔") instead of their normal Chinese characters.
CJK_COMPAT = str.maketrans({
    '⻔':'门', '⻅':'见', '⻝':'食', '⻓':'长', '⻘':'青', '⻬':'齐',
    '⻜':'飞', '⺠':'民', '⻰':'龙', '⻥':'鱼', '⻤':'鬼', '⻚':'页',
    '⻢':'马', '⻛':'风', '⻁':'虎', '⻩':'黄', '⻣':'骨', '⻆':'角',
    '⻉':'贝', '⻦':'鸟', '⻮':'齿', '⻋':'车',
})

def norm(s):
    s = unicodedata.normalize('NFKC', s)
    s = s.translate(CJK_COMPAT)
    s = s.replace('\ufb02', 'fl').replace('\ufb01', 'fi')
    return re.sub(r'\s+', ' ', s).strip()


def load_pages():
    if CACHE.exists():
        return [json.loads(x) for x in CACHE.read_text(encoding='utf-8').splitlines()]
    reader = PdfReader(str(PDF))
    pages=[]
    with CACHE.open('w',encoding='utf-8') as f:
        for i,p in enumerate(reader.pages,1):
            text=p.extract_text() or ''
            row={'page':i,'text':text}
            pages.append(row); f.write(json.dumps(row,ensure_ascii=False)+'\n')
            if i%100==0: print('extracted',i)
    return pages


def split_episodes(pages):
    episodes=[]; current=None
    for page in pages:
        for raw in page['text'].splitlines():
            line=norm(raw)
            if not line or PAGE_NO_RE.fullmatch(line):
                continue
            if line.startswith('西游记(第') and '部分)' in line:
                continue
            m=HEADING_RE.match(line)
            if m:
                if current: episodes.append(current)
                current={
                    'episode':int(m.group(3)),
                    'range':f'{m.group(1)}-{m.group(2)}',
                    'titleZh':m.group(4).strip(),
                    'startPage':page['page'],
                    'lines':[]
                }
                continue
            if current:
                current['lines'].append({'page':page['page'],'text':line})
    if current: episodes.append(current)
    return episodes


def extract_title_en(lines):
    chunks=[]
    for item in lines[:12]:
        x=item['text']
        if re.search(r'[\u3400-\u9fff]',x):
            if chunks: break
            continue
        if x.lower().startswith('journey to the west'):
            chunks=[x.split('[',1)[0].strip()]
            if '[' in x: break
            continue
        if chunks:
            chunks.append(x.split('[',1)[0].strip())
            if '[' in x: break
    return norm(' '.join(chunks))


def parse_entries(lines):
    entries=[]; en=[]; ipa=[]; zh=[]; state='en'
    def has_zh(s): return bool(re.search(r'[\u3400-\u9fff]',s))
    def finish():
        nonlocal en,ipa,zh,state
        if en and ipa and zh:
            e=norm(' '.join(en)); p=norm(' '.join(ipa)); c=norm(''.join(zh))
            # Exclude the episode title triplet.
            if not e.lower().startswith('journey to the west'):
                entries.append({'en':e,'ipa':p,'zh':c})
        en=[];ipa=[];zh=[];state='en'

    for item in lines:
        x=item['text']
        # Section labels such as 西游记 第一回... are not dialogue rows.
        if has_zh(x):
            if state=='zh': zh.append(x)
            continue
        if state=='zh': finish()
        if '[' in x:
            before, after=x.split('[',1)
            if before.strip(): en.append(before.strip())
            if ']' in after:
                p,_=after.split(']',1); ipa.append(p.strip()); state='zh'
            else:
                ipa.append(after.strip()); state='ipa'
        elif state=='ipa':
            if ']' in x:
                p,_=x.split(']',1); ipa.append(p.strip()); state='zh'
            else: ipa.append(x)
        else:
            en.append(x)
    finish()
    return entries


def main():
    eps=split_episodes(load_pages())
    assert len(eps)==108, len(eps)
    for i,e in enumerate(eps):
        e['endPage']=(eps[i+1]['startPage'] if i+1<len(eps) else 1356)
        e['titleEn']=extract_title_en(e['lines'])
        e['dialogue']=parse_entries(e.pop('lines'))
        e['lineCount']=len(e['dialogue'])
    OUT.write_text(json.dumps(eps,ensure_ascii=False,indent=2),encoding='utf-8')
    print('episodes',len(eps),'dialogue',sum(e['lineCount'] for e in eps),'min',min(e['lineCount'] for e in eps),'max',max(e['lineCount'] for e in eps))
    for e in eps[:5]: print(e['episode'],e['titleZh'],e['startPage'],e['lineCount'])
    for e in eps[-5:]: print(e['episode'],e['titleZh'],e['startPage'],e['lineCount'])

if __name__=='__main__': main()
