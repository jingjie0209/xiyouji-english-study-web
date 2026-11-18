from pathlib import Path
import ast, json, re, sys
from collections import Counter
from functools import lru_cache

BASE = Path(__file__).resolve().parent
DOWNLOADS = BASE.parent
SOURCE_APP = DOWNLOADS / 'kids-song-player/docs/wow/app.js'
SOURCE_LEARNING = DOWNLOADS / 'build_peppa_grammar_doc.py'
OUT_JS = BASE / 'data/peppa.js'

sys.path.insert(0, '/private/tmp/ipa')
try:
    import eng_to_ipa as ipa_lib
except Exception:
    ipa_lib = None

TITLES = {
1:'泥坑',2:'恐龙先生不见了',3:'最好的朋友',4:'波莉鹦鹉',5:'捉迷藏',6:'幼儿园',
7:'猪妈妈在工作',8:'中间的小猪',9:'猪爸爸丢了眼镜',10:'园艺',11:'打嗝',12:'自行车',
13:'秘密',14:'放风筝',15:'野餐',16:'乐器',17:'青蛙、虫子和蝴蝶',18:'装扮游戏',
19:'新鞋子',20:'学校游园会',21:'猪妈妈的生日',22:'牙仙子',23:'新车',24:'寻宝',
25:'不太舒服',26:'雪',27:'风之城堡',28:'我的表姐克洛伊',29:'煎饼',30:'保姆',
31:'芭蕾课',32:'雷暴',33:'洗车',34:'午餐',35:'露营',36:'睡美人',37:'树屋',
38:'化装舞会',39:'博物馆',40:'大热天',41:'克洛伊的木偶戏',42:'猪爸爸健身',
43:'整理房间',44:'游乐场',45:'猪爸爸挂画',46:'在海滩',47:'瘦腿先生',
48:'猪爷爷的船',49:'购物',50:'我的生日派对',51:'猪爸爸的电影摄影机',52:'学校话剧'
}

ENGLISH_TITLES = {
1:'Muddy Puddles',2:'Mr Dinosaur Is Lost',3:'Best Friend',4:'Polly Parrot',5:'Hide and Seek',
6:'The Playgroup',7:'Mummy Pig at Work',8:'Piggy in the Middle',9:'Daddy Loses His Glasses',
10:'Gardening',11:'Hiccups',12:'Bicycles',13:'Secrets',14:'Flying a Kite',15:'Picnic',
16:'Musical Instruments',17:'Frogs, Worms and Butterflies',18:'Dressing Up',19:'New Shoes',
20:'The School Fete',21:'Mummy Pig’s Birthday',22:'Tooth Fairy',23:'The New Car',24:'Treasure Hunt',
25:'Not Very Well',26:'Snow',27:'Windy Castle',28:'My Cousin Chloe',29:'Pancakes',30:'Babysitting',
31:'Ballet Lesson',32:'Thunderstorm',33:'Cleaning the Car',34:'Lunch',35:'Camping',36:'Sleepy Princess',
37:'The Tree House',38:'Fancy Dress Party',39:'The Museum',40:'Very Hot Day',41:'Chloe’s Puppet Show',
42:'Daddy Gets Fit',43:'Tidying Up',44:'The Playground',45:'Daddy Puts Up a Picture',46:'At the Beach',
47:'Mr Skinny Legs',48:'Grandpa Pig’s Boat',49:'Shopping',50:'My Birthday Party',
51:'Daddy’s Movie Camera',52:'The School Play'
}

# Extract the curated learning content already used in the Peppa Word document.
tree = ast.parse(SOURCE_LEARNING.read_text())
wanted = {'grammar', 'grammar_categories', 'grammar_extensions', 'collocations', 'explanation'}
values = {}
for node in tree.body:
    if isinstance(node, ast.Assign) and len(node.targets) == 1 and isinstance(node.targets[0], ast.Name):
        if node.targets[0].id in wanted:
            try:
                values[node.targets[0].id] = ast.literal_eval(node.value)
            except ValueError:
                pass
GRAMMAR = values['grammar']
CATEGORY = values['grammar_categories']
EXTENSIONS = values['grammar_extensions']
COLLOCATIONS = values['collocations']
EXPLANATIONS = values['explanation']
assert len(GRAMMAR) == 28 and len(COLLOCATIONS) == 95
assert all(len(EXTENSIONS[p]) == 10 for p, _, _ in GRAMMAR)

# Regexes are intentionally explicit so each grammar row can point to a real source line.
GRAMMAR_RULES = {
'This is + 名词': r'\bthis\s+is\b',
'It is / It’s + 名词、形容词或状态': r"\bit(?:\s+is|'s|’s)\b",
'I am / I’m + 名词或形容词': r"\bi(?:\s+am|'m|’m)\b",
'主语 + can + 动词原形': r"\bcan\b(?!\s*(?:not|'t|’t))",
'主语 + cannot / can’t + 动词原形': r"\b(?:cannot|can't|can’t)\b",
'主语 + have/has to + 动词原形': r"\b(?:have|has|had)\s+to\b",
'主语 + want/wants to + 动词原形': r"\b(?:want|wants|wanted)\s+to\b",
'主语 + be going to + 动词原形/地点': r"\b(?:am|is|are|'m|'s|'re|’m|’s|’re)\s+going\s+to\b",
'Would you like + 名词/to do?': r'\bwould\s+you\s+like\b',
'Do you like + 名词/doing?': r'\bdo\s+you\s+like\b',
'Let’s + 动词原形': r"\blet(?:'s|’s)\b",
'Please + 请求/邀请': r'\bplease\b',
'Thank you / Thanks': r'\b(?:thank\s+you|thanks)\b',
'主语 + like/likes/love/loves + 名词或 doing': r'\b(?:like|likes|liked|love|loves|loved)\b',
'主语 + do not/does not/don’t/doesn’t + 动词原形': r"\b(?:do|does)\s+not\b|\b(?:don't|doesn't|don’t|doesn’t)\b",
'Don’t + 动词原形（提醒/禁止）': r"^\s*don(?:'t|’t)\b",
'Be + 形容词（状态或提醒）': r'\bbe\s+(?:careful|quiet|good|quick|kind|gentle|brave|patient|helpful)\b',
'There is / There are + 名词': r"\bthere(?:'s|’s|\s+is|\s+are)\b",
'Have you + 过去分词/been doing?': r'\bhave\s+you\b',
'主语 + have/has + 过去分词': r"\b(?:have|has|'ve|'s|’ve|’s)\s+(?:been|found|made|lost|seen|done|gone|had|worn|put|stopped|finished|cleaned|tidied|brushed|washed|played|jumped|watched|looked|come|taken|got|learned|learnt|heard|broken|eaten|fallen|opened|closed|started|helped|grown|made)\b",
'What + 名词 / What do you...?': r'\bwhat\b',
'Where is / are...?': r'\bwhere\b',
'Can I have...?': r'\bcan\s+i\s+have\b',
'Are you...?': r'\bare\s+you\b',
'I think + 句子': r'\bi\s+think\b',
'I know + 句子/状态': r'\bi\s+know\b',
'Oh dear': r'\boh\s*,?\s*dear\b',
'Well done': r'\bwell\s+done\b',
}
assert set(GRAMMAR_RULES) == {p for p, _, _ in GRAMMAR}

# IPA overrides for names, function words and Peppa-specific spellings.
IPA_OVERRIDES = {
'peppa':'ˈpepə', "peppa's":'ˈpepəz', 'george':'dʒɔːdʒ', 'mummy':'ˈmʌmi',
'daddy':'ˈdædi', 'muddy':'ˈmʌdi', 'puddle':'ˈpʌdl', 'puddles':'ˈpʌdlz',
'dinosaur':'ˈdaɪnəsɔː', 'cannot':'ˈkænɒt', "can't":'kɑːnt', 'can’t':'kɑːnt',
'outside':'ˌaʊtˈsaɪd', 'today':'təˈdeɪ', 'a':'ə', 'the':'ðə', 'to':'tə',
'and':'ənd', 'of':'əv', 'for':'fə', 'your':'jɔː', 'you':'juː', 'i':'aɪ',
"i'm":'aɪm', 'i’m':'aɪm', "it's":'ɪts', 'it’s':'ɪts', "let's":'lets',
"don't":'dəʊnt', 'don’t':'ˈdəʊnt', "doesn't":'ˈdʌzənt', 'doesn’t':'ˈdʌzənt',
'playgroup':'ˈpleɪɡruːp', 'skinnylegs':'ˈskɪni leɡz', 'aunty':'ˈɑːnti',
'tidying':'ˈtaɪdiɪŋ', 'tidied':'ˈtaɪdid', 'tidies':'ˈtaɪdiz', 'wriggly':'ˈrɪɡli',
'froggy':'ˈfrɒɡi', 'froggies':'ˈfrɒɡiz', 'dollies':'ˈdɒliz', 'piggies':'ˈpɪɡiz',
'hearties':'ˈhɑːtiz', 'teatime':'ˈtiːtaɪm', 'suppertime':'ˈsʌpətaɪm',
'flowerbed':'ˈflaʊəbed', 'flowerpots':'ˈflaʊəpɒts', 'sunshade':'ˈsʌnʃeɪd',
'sandcastle':'ˈsændkɑːsəl', 'pedalling':'ˈpedəlɪŋ', 'hiccupping':'ˈhɪkʌpɪŋ',
'beakers':'ˈbiːkəz', 'crisps':'krɪsps', 'unlocks':'ʌnˈlɒks', 'diy':'ˌdiː aɪ ˈwaɪ',
'mysterio':'mɪˈstɪəriəʊ', 'gentiemen':'ˈdʒentəlmən', 'gentlemen':'ˈdʒentəlmən',
'gavesgate':'ɡeɪvz ɡeɪt', 'yourseives':'jɔːˈselvz', 'herseif':'hɜːˈself',
'himseif':'hɪmˈself', 'myseif':'maɪˈself', 'everyway':'ˈevriweɪ', 'mazy':'ˈmeɪzi',
'jete':'ʒəˈteɪ', 'splish':'splɪʃ', 'splosh':'splɒʃ',
}
# Common interjections/onomatopoeia not in the pronunciation dictionary.
for word in ['hmmm','mmmmmm','mmmmm','mmm','mm','shush','shhh','shhhhh','hmmmm']:
    IPA_OVERRIDES[word] = 'm̩' if set(word) == {'m'} else 'ʃʊʃ'
for word in ['whooooaaa','woah','whoaao','whoaaa']:
    IPA_OVERRIDES[word] = 'wəʊ'
for word in ['wahhh','waaaaaaaaaaaa','whaaaaaaaaa','whaaaaaaaaaa','ahhhh','ahhh','aaaah','aaaaah','ahh','ohhh','ooooh','ohhhhhhhhh','ooo','ooooo','ooofff']:
    IPA_OVERRIDES[word] = 'əʊ' if word.startswith('o') else 'ɑː'
for word in ['grrrrrrrr','grrrr','grrrrrrr','grrrrrrrrr','grrrrrrrrrrr','grrrrrrrrrrrrrr','grrr','errrgh','eeuuurgh','arrgh','arrrgh']:
    IPA_OVERRIDES[word] = 'ɡrː' if word.startswith('g') or word.startswith('e') else 'ɑː'
for word in ['baaa','baaaa','neigh']:
    IPA_OVERRIDES[word] = 'neɪ' if word == 'neigh' else 'bɑː'
for word in ['weeee','wheee','yipee','dabra']:
    IPA_OVERRIDES[word] = {'weeee':'wiː','wheee':'wiː','yipee':'jɪˈpiː','dabra':'ˈdɑːbrə'}[word]
IPA_OVERRIDES.update({'lf':'ɪf','geroge':'dʒɔːdʒ','ganggy':'ˈɡræni','ig':'aɪ',
 'iove':'lʌv','andprincess':'ənd ˈprɪnses','ghe':'ɡə','tti':'tiː','lg':'el dʒiː',
 'coookies':'ˈkʊkiz','dinedine':'ˈdaɪn daɪn','sawsaw':'sɔː sɔː','dinesaw':'ˈdaɪn sɔː',
 'puppet\'s':'ˈpʌpɪts','snowman\'s':'ˈsnəʊmənz','rabbit\'s':'ˈræbɪts','flower\'s':'ˈflaʊəz'})
for suffix in ["'s", '’s']:
    pass


@lru_cache(maxsize=None)
def token_ipa(word):
    key = word.lower().replace('’', "'")
    if key in IPA_OVERRIDES:
        return IPA_OVERRIDES[key]
    if re.fullmatch(r'gr+', key):
        return 'ɡrː'
    if key.endswith("'s"):
        base = key[:-2]
        base_values = ipa_lib.ipa_list(base) if ipa_lib else []
        value = IPA_OVERRIDES.get(base) or (base_values[0][0] if base_values and base_values[0] else '')
        return value + 'z' if value else ''
    if not ipa_lib:
        return ''
    values = ipa_lib.ipa_list(key)
    if values and values[0]:
        value = values[0][0]
        if '*' not in value:
            return value.strip('.,!?;:')
    return ''


def text_ipa(text):
    parts = []
    for token in re.findall(r"[A-Za-z]+(?:['’][A-Za-z]+)?", text):
        value = token_ipa(token)
        if value:
            parts.append(value)
    return ' '.join(parts).strip()


def clean_match(text):
    return re.sub(r'\s+', ' ', text).strip()


def colloc_regex(label):
    if label == 'What a...':
        return re.compile(r'\bwhat\s+a\b', re.I)
    if label == 'show somebody':
        return re.compile(r'\bshow(?:s|ed|ing)?\s+(?:daddy|mummy|george|peppa|him|her|them|everyone|someone)\b', re.I)
    if label == 'help somebody':
        return re.compile(r'\bhelp(?:s|ed|ing)?\s+(?:daddy|mummy|george|peppa|him|her|them|everyone|someone)\b', re.I)
    if label == 'wear boots':
        return re.compile(r'\b(?:wear|wears|wearing|wore|worn)\s+(?:your|their|his|her|my|our)\s+boots\b', re.I)
    if label == "now it's my turn":
        return re.compile(r"\bnow\s+it(?:'s|’s)\s+my\s+turn\b", re.I)
    if label == 'Mr. Dinosaur':
        return re.compile(r'\bmr\.?\s+dinosaur\b', re.I)
    if label == 'ready, steady, go':
        return re.compile(r'\bready\s*,?\s*steady\s*,?\s*go\b', re.I)
    if label == "I'm sorry":
        return re.compile(r"\b(?:i\s+am|i'm|i’m)\s+sorry\b", re.I)
    escaped = re.escape(label).replace(r'\ ', r'\s+').replace('’', "['’]")
    first = label.split(' ', 1)[0]
    variants = {
      'come':r'(?:come|comes|came|coming)','go':r'(?:go|goes|went|going|gone)',
      'play':r'(?:play|plays|played|playing)','jump':r'(?:jump|jumps|jumped|jumping)',
      'look':r'(?:look|looks|looked|looking)','help':r'(?:help|helps|helped|helping)',
      'make':r'(?:make|makes|made|making)','clean':r'(?:clean|cleans|cleaned|cleaning)',
      'carry':r'(?:carry|carries|carried|carrying)','put':r'(?:put|puts|putting)',
      'take':r'(?:take|takes|took|taken|taking)','tidy':r'(?:tidy|tidies|tidied|tidying)',
      'wake':r'(?:wake|wakes|woke|woken|waking)','watch':r'(?:watch|watches|watched|watching)',
      'wear':r'(?:wear|wears|wore|worn|wearing)','show':r'(?:show|shows|showed|shown|showing)',
      'sit':r'(?:sit|sits|sat|sitting)','pick':r'(?:pick|picks|picked|picking)',
      'grow':r'(?:grow|grows|grew|grown|growing)','stop':r'(?:stop|stops|stopped|stopping)',
      'wear':r'(?:wear|wears|wore|worn|wearing)','play':r'(?:play|plays|played|playing)',
    }
    if first in variants:
        escaped = variants[first] + (r'\s+' + re.escape(label.split(' ',1)[1]).replace(r'\ ',r'\s+') if ' ' in label else '')
    return re.compile(r'\b' + escaped + r'\b', re.I)


COLLOC_REGEXES = [(label, zh, colloc_regex(label)) for label, zh, _ in COLLOCATIONS]


def select_grammar(lines):
    out = []
    for pattern, _, _ in GRAMMAR:
        rx = re.compile(GRAMMAR_RULES[pattern], re.I)
        hits = [line for line in lines if rx.search(line)]
        if not hits:
            continue
        out.append({
            'type': CATEGORY[pattern], 'pattern': pattern,
            'description': EXPLANATIONS.get(pattern, ''), 'source': hits[0], 'sourceCount': len(hits),
            'examples': EXTENSIONS[pattern]
        })
    return out[:16]


def select_collocations(lines):
    out = []
    seen = set()
    for line in lines:
        for label, zh, rx in COLLOC_REGEXES:
            if label in seen:
                continue
            match = rx.search(line)
            if not match:
                continue
            phrase = clean_match(match.group(0))
            out.append({
                'phrase': phrase, 'ipa': text_ipa(phrase), 'zh': zh,
                'context': line, 'base': label
            })
            seen.add(label)
    return out[:36]


def main():
    source = SOURCE_APP.read_text()
    start = source.index('const PEPPA_EPISODE_DETAILS_DATA = {')
    end = source.index('};', start) + 2
    raw = json.loads(source[start:end].split('=', 1)[1].strip().rstrip(';'))
    episodes = []
    for key, value in raw.items():
        number = int(key.rsplit('-', 1)[1])
        pairs = value.get('pairs', [])
        dialogue = []
        for pair in pairs:
            en = clean_match(pair.get('en', ''))
            zh = clean_match(pair.get('zh', ''))
            if not en:
                continue
            dialogue.append({'en': en, 'ipa': text_ipa(en), 'zh': zh})
        lines = [row['en'] for row in dialogue]
        grammar = select_grammar(lines)
        collocations = select_collocations(lines)
        episodes.append({
            'episode': number, 'range': '1-52',
            'titleZh': TITLES[number], 'titleEn': f'Peppa Pig S1E{number:02d}: {ENGLISH_TITLES[number]}',
            'source': '中英台词依据小猪佩奇第一季 52 集资料整理；音标为英式 IPA 近似标注。',
            'dialogue': dialogue, 'grammar': grammar, 'collocations': collocations,
            'lineCount': len(dialogue), 'grammarCount': len(grammar),
            'collocationCount': len(collocations)
        })
    episodes.sort(key=lambda item: item['episode'])
    OUT_JS.write_text('window.PEPPA_EPISODES=' + json.dumps(episodes, ensure_ascii=False, separators=(',', ':')) + ';\n')
    print('episodes', len(episodes), 'dialogue', sum(e['lineCount'] for e in episodes))
    print('grammar min/max/avg', min(e['grammarCount'] for e in episodes), max(e['grammarCount'] for e in episodes), round(sum(e['grammarCount'] for e in episodes)/len(episodes), 1))
    print('colloc min/max/avg', min(e['collocationCount'] for e in episodes), max(e['collocationCount'] for e in episodes), round(sum(e['collocationCount'] for e in episodes)/len(episodes), 1))
    missing = [e['episode'] for e in episodes if not e['grammar']]
    print('episodes without grammar', missing)


if __name__ == '__main__':
    main()
