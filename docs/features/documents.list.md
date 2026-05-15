# 关于 Document 的一些修改逻辑

此文档介绍 Project 的 Schema 更新后，对于已抽取数据的 Document 处理逻辑；以及用户上传 Document 时读取 Document 页数传到后端接口。

## 问题提出
- Project 的 Schema 更新后，与已经抽取数据的 Document 的 extract_result 无法匹配上，例如，新的 schema 新增/删除 了字段等。
- TextIn 是根据 Document 的 Page 进行计费的，后端获取 Document 的 Page 数量成本过高，将 Page Count 放在前端进行。

## 解决方案
### 问题 1
- 为了解决上述问题，我们针对 Project、Document 都增加了 schema_version 字段
- 如果已经抽取成功的 Document schema_version 字段与 project 的  schema_version 不符，则提示用户，用户可以重新抽取
### 问题 2
- 前端通过各种库读取本地文件来估算 page_count，具体可以参考 `@docs/api/documents.md` 这个文件中提到的方法

## 具体修改

### Documents 列表页
- 针对 success 的记录，如果 Project 与 Document 的 schema_version 不符，在列表增加一个提示，这个提示可以放在 File ；
- 针对 status=success 的记录，将 Success 文案修改为 -> Parsed；
- 每个 Document 的后面都增加一个重新抽取按钮，点击后弹窗提示，用户是否确认重新抽取，确认后调用相关接口重新抽取；
- Documents 列表的 table 表头精简一下，可以将 Uploaded、Parsed 两个时间放在同一个 Column，Pages、Quota 也合并一下，上下展示，整体字号缩小，最后面有三个点的操作下拉框，点击后有重新抽取、删除文档按钮；
- Documents 顶部增加一个筛选项，可以按照 Status 筛选、以及 Document 抽取的数据是否与 schema 一致的筛选条件，接口中包含相关筛选条件

### Document 的详情 Dialog
- 针对 Document 抽取的数据与 project schema 不符的，需要在弹窗中顶部进行标注出来
- Dialog 顶部需要给出两个操作：重新抽取（不管是否一致），删除 Document（需要二次确认）

### 上传 Document
- 上传 Document 后，根据文件类型调用不同的库来估算文件的页数，通过接口传入到  page_count 字段

## 参考文档
- API 接口 json 文档：`@docs/api.json`
- API 接口详细使用文档：`@docs/api/documents.md`