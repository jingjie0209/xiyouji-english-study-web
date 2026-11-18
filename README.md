# 西游记 108 集英文学习整理网页

## 本地预览

```bash
cd /Users/jingjie/Documents/ChatGPT/下载/xiyouji-episode-study-web
python3 -m http.server 8765
```

然后打开 <http://localhost:8765>。

## 数据生成

- `parse_pdf.py`：读取 `/Users/jingjie/Downloads/西游记.pdf`，识别 PDF 中的“第 1-36 集 - 2 - 水帘洞”这类集数标识，并提取每集英文、音标、中文。
- `build_data.py`：根据每集台词匹配语法句型和固定搭配，生成 `data/episodes.json` 与网页使用的 `data/episodes.js`。
- `index.html`、`styles.css`、`app.js`：网页界面、搜索、三段范围筛选、集数切换、随机一集、打印当前集。

数据范围：108 集，共 11,380 组台词。扩展例句是学习练习，不是 PDF 原文。
