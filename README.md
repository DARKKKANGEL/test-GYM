# 求是知新 · 发展对象闭卷练习工作台

116 道固定知识练习：47 道填空、41 道多选、28 道单选。按「党章与党员基础 → 基本理论框架 → 组织生活与纪律 → 时事政治 → 校史校情」复习。

支持逐题校验、交卷后评分、随机组题、只练填空、错题重练、收藏和刷新续练。每题附标准答案、解析与来源，综合成绩等权折算为 100 分。

## 在 Mac 上开始

打开终端，执行：

```sh
git clone https://github.com/DARKKKANGEL/test-GYM.git
cd test-GYM
bash start.command
```

然后在浏览器打开 **http://127.0.0.1:8765**。保持终端窗口打开，结束时按 `Ctrl+C`。

启动脚本优先使用 Node.js，也可使用 Python 3。无需 `npm install`、构建、账号或 API 密钥。若没有 Git，也可以从 GitHub 的 **Code → Download ZIP** 下载解压，在解压目录中运行 `bash start.command`。

如果没有 Node.js 或 Python 3，直接用浏览器打开仓库中的 **offline.html**，仍可练习全部题目。

### 其他启动方式

已有 Node.js 18 或更高版本：

```sh
npm start
```

或使用 Python 3：

```sh
python3 -m http.server 8765 --bind 127.0.0.1 --directory dist
```

如果默认端口被占用，Node.js 启动方式可用 `PORT=8766 npm start`，然后打开 `http://127.0.0.1:8766`。

以后更新题库或页面：先停止服务，再运行 `git pull --ff-only`，然后重新运行 `bash start.command`，刷新浏览器。

## 建议练法

1. 按首页五个模块顺序练习，每题先回忆，再校验。
2. 进入「错题重练」，集中复习漏记或混淆的知识。
3. 在首页选择「只练填空」和「闭卷自测」，交卷后统一核对。

多选须选全且没有错选；填空所有空正确才计为答对，忽略空格、全半角差异和常见中文标点。查看答案、答错或未答完整会加入待复习，连续两轮独立答对后移出。自动判分以收录的标准表述为准，未收录的同义表达可能判错。

## 进度与资料

- 进度存储在当前浏览器，不会随 Git 上传或在电脑之间同步。换到 Mac 后从新的记录开始。
- 请保持使用相同浏览器、地址和端口。`localhost`、`127.0.0.1`、不同端口和离线文件各自拥有独立记录。
- 题库由《入党发展对象笔试重点》与 2026 年 3 月版《浙江大学党校学生发展对象培训班辅导教材》整理，近期时政与校情核对至 2026 年 10 月 29 日。教材页码指印刷页码，PDF 页序通常再加 2。
- 此项目用于记忆训练，非官方试题。正式笔试还包含简答与论述，练习题型与分值不等同于正式考试。

## 项目结构与维护

```text
dist/                 可直接运行的网页、样式、交互与题库
server.mjs            仅监听本机的静态服务，无第三方依赖
start.command         Mac 启动脚本，自动选择 Node.js / Python 3
offline.html          单文件离线版
build_questions.py    基础题库生成脚本
extra-questions.json  时政与校史补充题
finalize.py           从 dist 生成 offline.html
check.cjs             判分、考试与复习流程检查
check-server.mjs      HTTP 服务检查
```

正常复习无需运行生成脚本。修改题库后可执行：

```sh
python3 build_questions.py
python3 finalize.py
npm test
```

前端源码直接在 `dist/` 中维护，已提交到仓库，无需构建。原始 Word、PDF 与本地练习记录不属于运行依赖。
