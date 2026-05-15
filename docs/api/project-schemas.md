# Project Schemas

每个 project 关联一份 schema（抽取字段定义）。schema 是**版本化**的：每次 PUT 都写入新版本，旧版本保留作为历史。

当前使用的 schema = 该 project 下 `version` 最大的那条记录。

## Schema 字段结构

每个 Field 有以下键：

| 键 | 必填 | 说明 |
| --- | --- | --- |
| `name` | ✓ | 字段名（对应到 TextIn JSON schema 的 property 名，可用中文/英文） |
| `type` | ✓ | `string` / `number` / `integer` / `enum` / `object` / `array` |
| `description` |  | 告诉 AI 从文档中抽什么，越具体越准 |
| `required` |  | 默认 `false` |
| `enum` | ✓ when type=`enum` | 枚举值列表（非空字符串数组） |
| `attributes` | ✓ when type=`object` | 子字段数组，结构与 Field 相同（递归） |
| `items` | ✓ when type=`array` | 数组元素的 Field 定义（单个对象，非数组） |

### Object / Array 嵌套限制（对齐 TextIn）

TextIn v3 对嵌套有硬限制，我们在 PUT 阶段就会校验：

- **object 的 `attributes` 只能是** `string` / `number` / `integer` / `enum`
  —— 不能再套 object 或 array。
- **array 的 `items` 可以是** `string` / `number` / `integer` / `enum` / `object`
  —— 不能是 array（没有数组套数组）。
- 整体嵌套深度 ≤ **3 层**。合法的最深结构是 `array → object → primitive`。
- 叶子字段（所有 primitive + enum）总数 ≤ **100**。

### 示例

**Primitive + enum 组合**

```json
{
  "fields": [
    { "name": "invoice_no", "type": "string", "description": "发票号", "required": true },
    { "name": "amount",     "type": "number", "description": "金额",   "required": true },
    {
      "name": "status",
      "type": "enum",
      "enum": ["pending", "paid", "cancelled"],
      "required": false
    }
  ]
}
```

**Object（购买方信息）**

```json
{
  "fields": [
    {
      "name": "buyer",
      "type": "object",
      "description": "购买方信息",
      "attributes": [
        { "name": "name",   "type": "string", "required": true },
        { "name": "tax_id", "type": "string" }
      ]
    }
  ]
}
```

**Array 套 object（商品明细表 — 最深的 3 层结构）**

```json
{
  "fields": [
    {
      "name": "line_items",
      "type": "array",
      "description": "发票明细行",
      "items": {
        "name": "line_item",
        "type": "object",
        "attributes": [
          { "name": "product",  "type": "string",  "required": true },
          { "name": "quantity", "type": "integer", "required": true },
          { "name": "subtotal", "type": "number",  "required": true }
        ]
      }
    }
  ]
}
```

## GET /projects/{project_id}/schema

获取当前 project 的最新 schema。

**Response**
```json
{
  "id": "...",
  "version": 3,
  "fields": [ /* 见上 */ ],
  "created_at": "2026-05-06T..."
}
```

**错误**

| HTTP | Code              | 说明 |
| ---- | ----------------- | ---- |
| 404  | PROJECT_NOT_FOUND | project 不存在或不属于当前用户 |
| 404  | SCHEMA_NOT_FOUND  | project 存在但从未配置过 schema |

## PUT /projects/{project_id}/schema

替换当前 schema。写入新版本（`version = 旧最大 + 1`），旧版本保留作为历史。

**Request**：`{ "fields": [...], "extraction_mode": "per_page" }`，每个 field 满足上面"Schema 字段结构"章节的约束。`extraction_mode` 可选，省略时不动 project 现有模式；如果不同于当前模式，会**清空并重建项目下所有 document 的 `DocumentExtraction` 行**（同 `PATCH /projects/{id}` 改 `extraction_mode` 的行为）。

> 推荐流程：`draft-from-sample` 时用户选择模式，然后 `PUT /schema` 把模式和 fields 一并写下。前端可以直接把 `draft-from-sample` 响应里的 `chosen_extraction_mode` 透传给 `PUT`。

**Response** —— 新版本的 `SchemaRead`，`version` 已自增。

**常见 422 失败原因**

| 触发条件 | 说明 |
| --- | --- |
| 顶层 field 重名 | 全局唯一 |
| object 内 attribute 重名 | 各 object 内部唯一 |
| object 的 attribute 是 object 或 array | TextIn 不允许 |
| array 的 items 是 array | 没有数组套数组 |
| 缺 `enum` / `attributes` / `items` | 对应类型必填项漏了 |
| 在非对应类型上加了 `enum` / `attributes` / `items` | 例如 primitive 带了 `enum` |
| type 是已废弃值（如 `date` / `boolean`） | 只接受 TextIn 支持的 6 种 |
| 叶子字段总数 > 100 | TextIn 硬限制 |
| 嵌套深度 > 3 | TextIn 硬限制 |

## GET /projects/{project_id}/schema/versions

列出该 project 全部 schema 版本（按 version 倒序）。用于"查看历史 / 回退"功能。

**Response**
```json
{
  "items": [
    { "id": "...", "version": 3, "fields": [...], "created_at": "..." },
    { "id": "...", "version": 2, "fields": [...], "created_at": "..." },
    { "id": "...", "version": 1, "fields": [...], "created_at": "..." }
  ],
  "total": 3
}
```

> **回退到旧版本**：调一次 `PUT /projects/{id}/schema` 把旧版本的 `fields` 原样贴回去 —— 会写入一个新版本号，内容相同。DB 里不会"丢失"已有历史。

## Schema 草稿生成（AI 辅助）

创建 project 后，用户往往不想从零开始搭 schema。下面两个接口会**返回一个草稿**（符合 `SchemaReplaceRequest` 形状），前端把草稿加载进编辑器让用户过一眼、改一改，然后走标准的 `PUT /projects/{id}/schema` 保存。

**草稿不入库**，不会自动变成一个 schema 版本 —— 只有用户点"保存"后才真正落表。这保证版本号 == 用户明确确认的次数，不会被 AI 噪音污染。

> 相关接口：[schema-templates.md](./schema-templates.md) 里的模板库是第三条起步路径（纯代码常量，零 AI）。

### POST /projects/{project_id}/schema/draft-from-prompt

用户用自然语言描述要抽什么，后端调 OpenAI 生成结构化 schema 草稿。

**Request**
```json
{ "prompt": "我要从发票里抽发票号、开票日期、金额、买卖方名称，以及商品明细行" }
```

**Response** —— `SchemaDraftResponse`，结构就是 `{ "fields": [...] }`：

```json
{
  "fields": [
    { "name": "invoice_number", "type": "string", "description": "发票号码", "required": true },
    { "name": "issue_date",     "type": "string", "description": "开票日期（YYYY-MM-DD）", "required": true },
    {
      "name": "line_items",
      "type": "array",
      "items": {
        "name": "line_item",
        "type": "object",
        "attributes": [
          { "name": "product", "type": "string", "description": "商品名称" },
          { "name": "amount",  "type": "number", "description": "金额" }
        ]
      }
    }
  ]
}
```

**错误**

| HTTP | Code                      | 说明 |
| ---- | ------------------------- | ---- |
| 404  | PROJECT_NOT_FOUND         | project 不存在或不属于当前用户 |
| 502  | SCHEMA_GENERATION_FAILED  | OpenAI 调用失败（网络 / key 无效 / 限流） |
| 502  | SCHEMA_GENERATION_INVALID | LLM 返回的 JSON 没过我们的结构校验，建议前端让用户重试或换描述 |

### 样本文件 → 草稿（两步）

样本文件是**一次性**的：用户用它建 schema，建完就丢。所以它**不会**变成 project 的 Document，也不进任何列表。整个流程是上传 → 抽 schema → 后端最后 best-effort 删 R2 对象。

#### POST /projects/{project_id}/schema/sample-upload-presign

类似 `/documents/presign`，但返回的 `r2_key` 在 `samples/{project_id}/<uuid>.<ext>` 路径下，不会被任何文档级接口看到。`upload_url` 默认 30 分钟有效。

**Request**
```json
{ "file_name": "demo.pdf", "mime_type": "application/pdf", "size_bytes": 4096 }
```

**Response**
```json
{
  "upload_url": "https://<account>.r2.cloudflarestorage.com/.../samples/<project_id>/<uuid>.pdf?X-Amz-Signature=...",
  "r2_key": "samples/<project_id>/<uuid>.pdf",
  "expires_in": 1800
}
```

#### POST /projects/{project_id}/schema/draft-from-sample

用上一步拿到的 `r2_key` 触发：R2 GET → TextIn OCR → OpenAI → 草稿。OCR 完成后**后端会立刻 best-effort 删除 R2 上的样本对象**（失败只记日志）。

**Request**
```json
{
  "r2_key": "samples/<project_id>/<uuid>.pdf",
  "mime_type": "application/pdf",
  "extraction_mode": "per_page",
  "page_number": 1,
  "prompt": "只关注发票头部信息"
}
```

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `r2_key` | ✓ | 必须以 `samples/{project_id}/` 开头，否则 400。防止用户拿其他 project 或 documents/ 下的 key 来调本接口 |
| `mime_type` | ✓ | TextIn 支持的 MIME，参考 [documents.md](./documents.md) |
| `extraction_mode` | ✓ | `document` 或 `per_page`。生成的草稿会按选择的模式建模（per_page 时只看一页内容，schema 不会跨页"求和") |
| `page_number` | per_page 时必填，否则必须省略 | 1-indexed。per_page 模式下 OCR 只跑这一页，避免多页 PDF 把 LLM 带歪 |
| `prompt` |  | 用户用自然语言额外引导 |

**Response** —— 同 `draft-from-prompt`，外加 `chosen_extraction_mode` 字段（值就是请求里的 `extraction_mode`），方便前端直接透传给 `PUT /schema`：

```json
{
  "fields": [ /* ... */ ],
  "chosen_extraction_mode": "per_page"
}
```

**错误**

| HTTP | Code                      | 说明 |
| ---- | ------------------------- | ---- |
| 404  | PROJECT_NOT_FOUND         | project 不存在或不属于当前用户 |
| 415  | UNSUPPORTED_MIME_TYPE     | mime_type 不在白名单 |
| 400  | INVALID_SAMPLE_KEY        | `r2_key` 不以 `samples/{project_id}/` 开头 |
| 422  | —                         | `extraction_mode=per_page` 但缺 `page_number`（或反之多传） |
| 422  | OCR_EMPTY                 | OCR 跑完结果是空的（文件损坏、低分辨率图片等） |
| 502  | FILE_PRESIGN_FAILED       | R2 生成预签名 GET URL 失败 |
| 502  | OCR_FAILED                | TextIn 调用失败 |
| 502  | SCHEMA_GENERATION_FAILED  | OpenAI 调用失败 |
| 502  | SCHEMA_GENERATION_INVALID | LLM 返回 JSON 不合法 |

### 前端典型流程

```ts
// 路径 A：自然语言
const { fields } = await fetch(
  `/projects/${projectId}/schema/draft-from-prompt`,
  { method: 'POST', body: JSON.stringify({ prompt: userInput }), headers }
).then(r => r.json());
editor.loadDraft(fields, 'document');  // mode 默认 document

// 路径 B：样本文件（两步）
//   B1. 拿一次性上传链接
const { upload_url, r2_key } = await fetch(
  `/projects/${projectId}/schema/sample-upload-presign`,
  { method: 'POST', body: JSON.stringify({ file_name, mime_type, size_bytes }), headers }
).then(r => r.json());

//   B2. 直传 R2
await fetch(upload_url, { method: 'PUT', body: file, headers: { 'Content-Type': mime_type } });

//   B3. 让用户选模式（如果是多页 PDF，弹个 dialog 选 document 还是 per_page；后者还要选页码）
const mode = await askUserMode();  // 'document' | 'per_page'
const page = mode === 'per_page' ? await askUserPage() : null;

//   B4. 触发 OCR + LLM
const { fields, chosen_extraction_mode } = await fetch(
  `/projects/${projectId}/schema/draft-from-sample`,
  {
    method: 'POST',
    body: JSON.stringify({ r2_key, mime_type, extraction_mode: mode, page_number: page }),
    headers,
  }
).then(r => r.json());
editor.loadDraft(fields, chosen_extraction_mode);

// 路径 C：模板（见 schema-templates.md）
const tmpl = await fetch(`/schema-templates/invoice_cn`, { headers }).then(r => r.json());
editor.loadDraft(tmpl.fields, 'document');

// 不管哪条路径，最后都是：用户改完 → 保存（一并写入 extraction_mode）
await fetch(`/projects/${projectId}/schema`, {
  method: 'PUT',
  headers: { ...headers, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fields: editor.getState(),
    extraction_mode: editor.getMode(),  // 'document' 或 'per_page'
  }),
});
```

### 注意事项

- 三条草稿生成路径**不扣 user quota**；schema 设置期应该免费。防滥用靠 rate limit（目前还没加，有需要再加）。
- `draft-from-sample` 调用 OCR + LLM，总耗时通常 5 - 20 秒；前端要给 loading 状态。
- 样本文件建议清晰的 PDF / 高分辨率图片。扫描件 / 低分辨率图片 OCR 结果差，LLM 推出来的 schema 质量也会差。
- 样本上传**不会**出现在 `GET /projects/{id}/documents` 列表里 —— 它走的是独立的 R2 命名空间，并且 draft-from-sample 跑完会被删除。
