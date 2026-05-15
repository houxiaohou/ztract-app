# Parsed Data

项目详情页"Parsed Data"专用接口。汇总项目下**已成功抽取**的 extraction 单元 + 数据，支持时间筛选、分页、导出。

所有接口需要 `Authorization: Bearer <token>`，且只能访问自己项目的数据。

## GET /projects/{project_id}/parsed-data

分页返回项目下所有 `status=success` 的 `DocumentExtraction`，按 `parsed_time`（=`DocumentExtraction.finished_at`）**倒序**排列。

> **一行 ≠ 一个文档。** 当 project 是 `extraction_mode=per_page` 时，一个 3 页的 PDF 会产生 3 行（page_number 分别是 1/2/3），可以共用同一个 `document_id` / `document_name`。`extraction_mode=document` 时每个 document 一行，`page_number` 为 `null`。

**Query 参数**

| 参数 | 默认 | 说明 |
| ---- | ---- | ---- |
| `page` | 1 | 页码 |
| `size` | 20 | 每页条数，最大 100 |
| `parsed_from` | — | 下界（含），`YYYY-MM-DD`，按 UTC |
| `parsed_to` | — | 上界（含），`YYYY-MM-DD`，按 UTC |

**Response**
```json
{
  "items": [
    {
      "extraction_id": "ee71...",
      "document_id": "...",
      "document_name": "invoice-001.pdf",
      "page_number": 2,
      "parsed_time": "2026-05-08T10:00:00Z",
      "page_count": 3,
      "schema_version": 5,
      "is_stale": false,
      "data": {
        "invoice_no": "INV-001",
        "buyer": { "name": "Acme", "tax_id": "12345" },
        "items": [
          { "product": "螺丝", "qty": 100 },
          { "product": "螺母", "qty": 200 }
        ]
      }
    }
  ],
  "page": 1,
  "size": 20,
  "total": 142,
  "current_schema_version": 5,
  "current_schema_fields": [ ... ]
}
```

### 关键字段

- **`extraction_id`**：本行对应的 `DocumentExtraction.id`。前端单击查看高亮框时用这个 id 调 `GET /documents/{document_id}/extractions/{extraction_id}` 拿完整 TextIn 响应。
- **`page_number`**：`null` 表示整个文档一行，整数表示 per-page 模式下的页码（1-indexed）。
- **`data`**：TextIn 响应里的 `result.extracted_schema` **原样**返回。前端按 `current_schema_fields` 渲染列：primitive / enum 直接展示，object 展开，**array / object 在列表里折叠成徽章**（`[12 条 ▸]`），点开弹 popover 看详情。
- **`is_stale`**：`schema_version` 为 null 或 < `current_schema_version` 时为 true。前端挂角标引导重抽，但**不过滤**，用户依然看得到历史数据。
- **`current_schema_fields`**：当前 project schema，一并返回省一次网络往返。

## 导出接口（异步任务）

大量数据同步下载不现实，改为创建**导出任务** → 后台 worker 生成文件 → 上传 R2 → 用户随时下载。

导出任务生命周期：

```
pending  → 排队中
processing → worker 领到了
success  → 文件就绪，可下载
failed   → 生成失败（原因在 error_message）
expired  → 超过 30 天保留期，R2 对象会被后台清理
```

**约束：**
- 每用户**同时最多 3 个** pending/processing 导出，超限 409 `EXPORT_JOB_LIMIT_EXCEEDED`
- 结果保留 **30 天**，之后 `status` 读出来是 `expired`
- 行数硬限制 **200,000 行**（扁平化后的总行数），超了直接 failed
- 支持格式：`xlsx` / `csv` / `json`

### POST /projects/{project_id}/parsed-data/exports

创建导出任务。

**Request**
```json
{
  "format": "xlsx",
  "filter": {
    "parsed_from": "2026-01-01",
    "parsed_to": "2026-03-31"
  }
}
```

`format` 必填（`xlsx` / `csv` / `json`），`filter` 可选（不传则导出全部成功的 document）。

**Response** — `ExportJobRead`，初始 `status=pending`。前端轮询 `GET /exports/{id}` 直到 `success`。

### GET /projects/{project_id}/parsed-data/exports

分页列出该项目下的所有导出任务（包括历史的、失败的、已过期的）。

### GET /projects/{project_id}/parsed-data/exports/{job_id}

查单个任务最新状态。

### GET /projects/{project_id}/parsed-data/exports/{job_id}/download

拿文件下载地址。**只有 `status=success` 能调**，否则 409。

**Response**
```json
{ "download_url": "https://...r2.cloudflarestorage.com/.../file.xlsx?X-Amz-Signature=..." }
```

返回的是**短期（10 分钟）presigned GET URL**。没有 302 重定向是因为浏览器跨域重定向不会带上我们的 Authorization header —— 前端收到地址后 `window.location = url` 或者 fetch 即可。

### DELETE /projects/{project_id}/parsed-data/exports/{job_id}

取消/清理任务。删 DB 行 + best-effort 删 R2 对象。

## 导出文件格式

### json
```json
[
  { "document_id": "...", "invoice_no": "A", "items": [...] },
  { "document_id": "...", "invoice_no": "B", "items": [] }
]
```
**最完整，保留嵌套**。推荐给程序化对接用。

### csv / xlsx

按 **project 当前 schema** 扁平化：
- **object 字段** 用 dot-notation 拉平 → `buyer.name` / `buyer.tax_id` 各自一列
- **顶层第一个 array 字段** 展开为多行：array 外的字段在每行重复，每个元素产生一行
- **顶层第 2+ 个 array 字段** 退化为 JSON 字符串塞在该单元格里（极少见场景，文档化处理）
- 每行最前面有一列 `__document_id` 标记数据来源

**示例**（schema 有 `invoice_no` / `buyer(object)` / `items(array of object)`）：

| `__document_id` | invoice_no | buyer.name | items.product | items.qty |
| -- | -- | -- | -- | -- |
| doc-1 | INV-001 | Acme | 螺丝 | 100 |
| doc-1 | INV-001 | Acme | 螺母 | 200 |
| doc-2 | INV-002 | Beta | 电缆 | 5 |
| doc-3 | INV-003 | Gamma | *(空)* | *(空)* |

一个 document 的 `items` 是空 / 缺失时也占 1 行（保留 scalar 字段），`items.*` 各列为空。

### 关于 Schema 漂移的行为

**json** 导出：保留每个 document 抽取时的原始数据（含可能多出 / 缺失的字段 vs 当前 schema）。
**csv / xlsx** 导出：**按当前 schema 列布局**。抽取时多出来的字段会被丢弃（列里没这字段），抽取时漏掉的字段对应单元格为空。

这意味着 drift 严重的老数据在 xlsx 里看起来"空位多"。如果用户介意，应先对 stale document 做重抽（`POST /projects/{pid}/documents/rerun-stale`）再导出。

## 前端建议轮询策略

创建导出 → 展示 "生成中" loading → 每 3-5 秒轮询 `GET /exports/{id}`：
- `processing` → 继续转圈
- `success` → 自动拉 `/download` 拿 URL → 浏览器下载
- `failed` → 显示 `error_message`

也可以把当前用户所有 pending/processing 任务放到一个全局状态（像 Dropbox 的传输队列），这样用户离开 Parsed Data 页面仍能收到完成提醒。
