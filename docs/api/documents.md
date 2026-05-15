# Documents

一个 document = 用户上传到某个 project 下的一个文件。上传走 **R2 预签名 PUT**：前端拿到一次性上传链接后直接把文件 PUT 到 R2，不经过后端，后端只登记元信息。

## 支持的文件类型

严格对齐 TextIn 官方文档：`png, jpg, jpeg, pdf, bmp, tiff, webp, doc, docx, html, mhtml, xls, xlsx, csv, ppt, pptx, txt, ofd, rtf`。

| 类别 | 扩展名 | MIME types |
| ---- | ------ | ---------- |
| PDF | `.pdf` | `application/pdf` |
| Word | `.doc` / `.docx` | `application/msword`<br>`application/vnd.openxmlformats-officedocument.wordprocessingml.document` |
| Excel | `.xls` / `.xlsx` | `application/vnd.ms-excel`<br>`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` |
| PowerPoint | `.ppt` / `.pptx` | `application/vnd.ms-powerpoint`<br>`application/vnd.openxmlformats-officedocument.presentationml.presentation` |
| HTML | `.html` | `text/html` |
| MHTML | `.mhtml` | `multipart/related`<br>`message/rfc822`<br>`application/x-mimearchive`（浏览器/系统报的值不统一，三种都接受） |
| 纯文本 | `.txt` | `text/plain` |
| CSV | `.csv` | `text/csv` |
| RTF | `.rtf` | `application/rtf`<br>`text/rtf` |
| OFD | `.ofd` | `application/ofd` |
| 图片 | `.jpg` / `.png` / `.webp` / `.tiff` / `.bmp` | `image/jpeg` / `image/png` / `image/webp` / `image/tiff` / `image/bmp` |

**不支持** `image/gif`（TextIn 不识别）。

前端**必须**传入精确的 MIME type —— `Content-Type` 在 `PUT` R2 时要与 presign 时传的 `mime_type` 完全一致，否则 R2 签名校验失败。

## 大小限制

单文件 ≤ **500 MB**（和 TextIn 一致）。超过会在 presign 阶段 422。

## 图片尺寸限制

TextIn 对图片宽高有规定：
- 长宽比 < 2 时，宽高需在 20–20000 像素之间
- 其他比例的图片，宽高需在 20–10000 像素之间

后端**不做这项校验** —— 一来读图片尺寸需要额外的 IO 或依赖，二来用户感知也不好（文件都传一半了才告诉他尺寸不对）。**前端在选择文件后应提前用 `Image` / `<canvas>` 把图解到内存里校验一次**，不合规的直接在本地拒绝。如果漏校验后续到了 TextIn 那边，抽取会 40304，失败原因会显示在 `Document.error_message` 上。

## 上传流程（3 步）

```
前端                                后端                    R2
 │                                     │                     │
 │  ① POST /presign                    │                     │
 │ ──────────────────────────────────▶ │                     │
 │                                     │   (生成 r2_key      │
 │                                     │    + presign PUT)   │
 │    { upload_url, r2_key }           │                     │
 │ ◀ ────────────────────────────────  │                     │
 │                                     │                     │
 │  ② PUT <upload_url> (raw bytes)                           │
 │ ───────────────────────────────────────────────────────▶ │
 │     200 OK                                                │
 │ ◀ ──────────────────────────────────────────────────────  │
 │                                     │                     │
 │  ③ POST /documents (register)       │                     │
 │    { r2_key, file_name, ...}        │                     │
 │ ──────────────────────────────────▶ │                     │
 │                                     │ (写 DB + file_count+=1)
 │     DocumentRead                    │                     │
 │ ◀ ────────────────────────────────  │                     │
```

如果 ② 失败，前端可以直接重试或换个文件 —— ③ 还没调，DB 里什么都没有，R2 上最多多出一个孤儿对象（可 cron 清理）。

## POST /projects/{project_id}/documents/presign

生成一次性上传链接。返回的 `upload_url` 默认 1 小时内有效。

**Request**
```json
{
  "file_name": "invoice-2026q1.pdf",
  "mime_type": "application/pdf",
  "size_bytes": 1234567
}
```

**Response**
```json
{
  "upload_url": "https://<account>.r2.cloudflarestorage.com/<bucket>/projects/<project_id>/documents/<uuid>.pdf?X-Amz-Signature=...",
  "r2_key": "projects/<project_id>/documents/<uuid>.pdf",
  "expires_in": 3600
}
```

前端用 `fetch(upload_url, { method: 'PUT', body: file, headers: { 'Content-Type': mime_type } })` 直传即可。**Content-Type 必须和 presign 时传的 `mime_type` 一致**，否则 R2 签名校验不过。

**错误**

| HTTP | Code                   | 说明 |
| ---- | ---------------------- | ---- |
| 415  | UNSUPPORTED_MIME_TYPE  | mime_type 不在白名单 |
| 422  | —                      | size_bytes 超过 50 MB 或非正数 |
| 404  | PROJECT_NOT_FOUND      | project 不存在或不属于当前用户 |

## POST /projects/{project_id}/documents

上传完成后登记元信息。原子地把 project 的 `file_count` +1。

**Request**
```json
{
  "r2_key": "projects/<project_id>/documents/<uuid>.pdf",
  "file_name": "invoice-2026q1.pdf",
  "mime_type": "application/pdf",
  "size_bytes": 1234567,
  "page_count": 42
}
```

| 字段 | 必填 | 说明 |
| ---- | ---- | ---- |
| `r2_key` | ✓ | `/presign` 返回的 key |
| `file_name` | ✓ | 原始文件名 |
| `mime_type` | ✓ | 和 presign 时一致 |
| `size_bytes` | ✓ | 文件大小（字节） |
| `page_count` | per_page 模式必填 | **前端估算**的页数，用于 quota preflight 和 per-page 模式下的 extraction 拆分。见下 |

> **per_page 模式：** 如果当前 project 的 `extraction_mode = "per_page"`，`page_count` 必填且必须 ≥ 1。后端在 register 时会创建 `page_count` 条 `DocumentExtraction`，每页一条；缺失会 422 `PAGE_COUNT_REQUIRED`。`extraction_mode = "document"` 时 `page_count` 仅作 preflight 估算，可省略。

### 关于 `page_count`

前端在浏览器里用 pdf.js / pptx-parse / 图片识别等库算好页数，在 register 时连同一起传上来。后端**仅用于 preflight**：抽取前如果预估页数 > 剩余额度，直接把文档标记为 failed（`INSUFFICIENT_QUOTA: need N pages, have M`），不调 TextIn，省一次调用的钱。

**真实扣费永远以 TextIn 返回的 `success_count` 为准** —— 所以前端估算偏了也不会多扣/少扣，只影响"能不能进队列"这一步。

**什么时候可以不传？**
- CSV / TXT / RTF / OFD / MHTML 这些前端不好估算的格式：**省略**。后端退化到旧逻辑：只要 `available > 0` 就放行，TextIn 真实扣费；用户万一超支就变成负 balance，等下次充值。
- 旧前端：省略也能正常工作，行为不变。

**建议的前端估算策略：**
| 格式 | 怎么算 |
| --- | --- |
| PDF | `pdf.js` 读 `numPages` |
| PowerPoint (.pptx) | 解压 + 数 `ppt/slides/*.xml` |
| Excel (.xlsx) | 加载 workbook 数 sheet 数（**注意**：TextIn 会按行数拆分，2000 行以上的 sheet 会算多 page，前端估算**可能偏低**） |
| 图片 | 恒为 `1` |
| Word (.docx) | 读 `<w:lastRenderedPageBreak/>` 或按字数粗估；不确定就省略 |
| 其他 | 省略 |

**Response** — `DocumentRead`（新建时所有 extraction 都是 `pending` → `status = "pending"`，`download_url = null`）。

后续 worker 把每个 `DocumentExtraction` 推进到 `processing → success | failed`。`Document.status` 是从这些 extraction 汇总出来的派生值（见下）。`Document.page_count` 保留前端传的估算值，不会被覆盖。

## GET /projects/{project_id}/documents

分页列出 project 下的文件（按创建时间倒序）。列表里**不**包含 `download_url`，避免为每一行都 presign 一次 R2 URL（贵且多余）；要下载就拉单个 `GET /documents/{id}`。

**Query 参数**

| 参数 | 默认 | 说明 |
| ---- | ---- | ---- |
| `page` | 1 | 页码 |
| `size` | 20 | 每页条数，最大 100 |
| `status` | — | 按状态筛选；可重复传多个做 OR，如 `?status=pending&status=processing`。值必须是 `pending` / `processing` / `success` / `failed` 之一，否则 422 |
| `stale` | — | 三态筛选：`true` 仅陈旧（`schema_version` 为 null 或落后于 `project.schema_version`，也就是 `rerun-stale` 会处理的那一批）；`false` 仅最新；省略不筛 |

**举例**

```
GET /projects/.../documents?status=failed               # 失败的文档（想重抽）
GET /projects/.../documents?stale=true                  # 需要重抽的文档
GET /projects/.../documents?status=success&stale=false  # 已成功且最新的"绿色"文档
GET /projects/.../documents?status=pending&status=processing  # 队列中的
```

`stale=true` + project 无 schema 时，后端短路返回空结果集（不查数据库）—— 没 schema 就谈不上"陈旧"。

## GET /projects/{project_id}/documents/{document_id}

单个 document 详情。**会**附带一个短时有效（默认 15 分钟）的 `download_url`：

- 若 `.env` 配了 `R2_PUBLIC_URL`（bucket 开了公开访问），直接拼 `{R2_PUBLIC_URL}/{r2_key}`，永久有效。
- 否则返回一个 presigned GET URL。

**Response**
```json
{
  "id": "...",
  "project_id": "...",
  "file_name": "invoice-2026q1.pdf",
  "mime_type": "application/pdf",
  "size_bytes": 1234567,
  "page_count": 3,
  "extraction_mode": "per_page",
  "status": "processing",
  "extractions_summary": {
    "pending": 0, "processing": 1, "success": 2, "failed": 0, "total": 3
  },
  "created_at": "...",
  "updated_at": "...",
  "download_url": "https://.../projects/<project_id>/documents/<uuid>.pdf?X-Amz-Signature=..."
}
```

### `status` 是派生值

`Document.status` 不存数据库，而是按 `extractions_summary` 实时汇总出来：

| 规则（按优先级） | `status` |
| --- | --- |
| 有任何 `pending` | `pending` |
| 有任何 `processing` | `processing` |
| 既有 `success` 又有 `failed` | `partial` |
| 全部 `success` | `success` |
| 全部 `failed` | `failed` |

前端用 `extractions_summary` 渲染进度条（如 "3/5 success, 1 failed, 1 pending"），用 `status` 决定行的颜色 / 是否能 rerun。`document` 模式下只有一条 extraction，`status` 直接等于那条的状态；不会出现 `partial`。

## Extractions 子资源

每个 document 下挂若干 `DocumentExtraction`。在 `document` 模式下是一条（page_number 为 null），在 `per_page` 模式下是 N 条（page_number 1..N）。重抽时 worker 复用同一条 row。

### GET /projects/{project_id}/documents/{document_id}/extractions

分页列出当前 document 的 extraction 单元。`result` 字段在列表里**不**返回（payload 太大）；要看 TextIn 完整响应去拿单条。

**Query 参数**

| 参数 | 默认 | 说明 |
| ---- | ---- | ---- |
| `page` | 1 | 页码 |
| `size` | 50 | 每页条数，最大 200 |

排序为 `page_number ASC NULLS FIRST` —— per_page 模式下用户看到的是页码 1, 2, 3…的自然顺序。

### GET /projects/{project_id}/documents/{document_id}/extractions/{extraction_id}

单条 extraction，**包含完整 TextIn 响应**（`result` 字段）。前端 visualizer 用 `result.citations` + `result.pages` 渲染高亮框。

**Response（节选）**
```json
{
  "id": "...",
  "document_id": "...",
  "page_number": 2,
  "status": "success",
  "schema_version": 1,
  "started_at": "...",
  "finished_at": "...",
  "result": { "code": 200, "result": { "extracted_schema": {...}, "citations": {...}, "pages": [...] } }
}
```

## DELETE /projects/{project_id}/documents/{document_id}

删除 document。顺序：先事务里删 DB 行 + `file_count-=1`，提交后再 best-effort 删 R2 对象。R2 删除失败不会 500 —— 只记 warning，孤儿对象可后续扫除。

**Response**
```json
{ "deleted": true }
```

> **UsageRecord 不会被级联删除。** `usage_records.document_id` FK 用的是 `ON DELETE SET NULL`，所以删 document 时对应的使用记录会保留（`document_id` 置 null，`document_name` 快照保持原值），用户在 `GET /usage` 里依然能看到"某次抽取消耗了多少页"。Append-only 审计语义不受文档生命周期影响。

## Schema 漂移 & 重抽

`DocumentExtraction.schema_version` 记录抽取时用的 schema 版本，`Project.schema_version` 记录当前最新的 schema 版本。两者不一致时该抽取结果"陈旧"，前端应当引导用户重抽。

**前端判断陈旧：**
```ts
const isStale =
  extraction.schema_version == null ||
  (project.schema_version != null && extraction.schema_version < project.schema_version);
```

每次重抽 = 一次新的 TextIn 调用 = **重新扣一次 quota**。在 per-page 模式下，document 级 rerun 会重跑该文档下所有 page 的抽取（N 次调用）。前端在点按钮前应用 `GET /stale-count` 预估消耗并弹窗确认。

### GET /projects/{project_id}/documents/stale-count

预估批量重抽的规模。

**Response**
```json
{ "stale_documents": 12, "estimated_pages": 35 }
```

- `stale_documents`：有多少文档至少包含一条陈旧的 extraction
- `estimated_pages`：每条 per-page extraction 算 1，每条 document-mode extraction 按对应 `Document.page_count` 估算。document 没记录页数时贡献 0，**实际扣费可能更高**

### POST /projects/{project_id}/documents/rerun-stale

批量把陈旧 extraction 重置成 `pending`，worker 会逐一重抽。

**Response**
```json
{ "queued": 12, "skipped_in_flight": 1 }
```

- `queued`：本次重置的 extraction 行数
- `skipped_in_flight`：项目里已经处于 pending/processing 的 extraction 数（不会被动到，避免和队列里正在跑的冲突）

### POST /projects/{project_id}/documents/{document_id}/rerun

单条 document 重抽：重置该 document 下所有 `DocumentExtraction` 为 `pending`。

**Response**：更新后的 `DocumentRead`（`status = "pending"`、summary 全清）。

**错误**

| HTTP | Code | 说明 |
| ---- | ---- | ---- |
| 404 | DOCUMENT_NOT_FOUND | 文档不存在或不属于当前用户 |
| 409 | DOCUMENT_IN_FLIGHT | 文档下任意 extraction 处于 `pending` / `processing`，等队列跑完再重试 |

## curl 全流程示例

```bash
TOKEN=<jwt>
BASE=http://localhost:8000

# 1. 建 project
PROJECT_ID=$(curl -s -X POST $BASE/projects \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"demo"}' | jq -r .id)

# 2. 要一个 presign URL
RESP=$(curl -s -X POST $BASE/projects/$PROJECT_ID/documents/presign \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"file_name":"x.pdf","mime_type":"application/pdf","size_bytes":123456}')
UPLOAD_URL=$(echo $RESP | jq -r .upload_url)
R2_KEY=$(echo $RESP | jq -r .r2_key)

# 3. 直传 R2
curl -X PUT "$UPLOAD_URL" -H "Content-Type: application/pdf" --data-binary @./x.pdf

# 4. 登记
curl -X POST $BASE/projects/$PROJECT_ID/documents \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"r2_key\":\"$R2_KEY\",\"file_name\":\"x.pdf\",\"mime_type\":\"application/pdf\",\"size_bytes\":123456}"
```
