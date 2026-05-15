# Projects

一个 project 是若干文件 + 一套抽取 schema 的逻辑分组。所有接口都需要 `Authorization: Bearer <token>`。

## GET /projects

分页列出当前用户的所有 project。

**Query 参数**

| 参数 | 默认 | 说明 |
| ---- | ---- | ---- |
| page | 1    | 页码，从 1 开始 |
| size | 20   | 每页条数，最大 100 |
| q    | —    | 按名称子串匹配（大小写不敏感） |
| sort | `created_at_desc` | 排序：`created_at_desc` / `created_at_asc` / `updated_at_desc` / `updated_at_asc` / `name_asc` / `name_desc` |

**Response**
```json
{
  "items": [
    {
      "id": "...",
      "name": "招行回单抽取",
      "description": null,
      "file_count": 3,
      "schema_version": 5,
      "extraction_mode": "document",
      "created_at": "2026-04-28T...",
      "updated_at": "2026-04-28T..."
    }
  ],
  "page": 1,
  "size": 20,
  "total": 42
}
```

> `schema_version` 是当前项目最新的 schema 版本号。`null` 表示项目还没配过 schema。与 `DocumentExtraction.schema_version` 比对即可判断某个抽取结果是否"陈旧"（见 [documents.md](./documents.md) 末尾的重抽章节）。
>
> `extraction_mode` 决定每个文件如何调用 TextIn：
> - `document`（默认）— 整个文件作为一次抽取，返回一个 `extracted_schema`
> - `per_page` — 每一页一次抽取，一个 N 页 PDF 产生 N 条 `DocumentExtraction`
>
> 一般在创建 project → 用 sample 文件生成 schema 时由用户选定，提交 `PUT /schema` 时一并写入。后续可改（见 PATCH）。

## POST /projects

创建新 project。

**Request**
```json
{ "name": "招行回单抽取", "description": "2025Q2 财报用" }
```

**Response** — 见 `ProjectRead` 结构。

## GET /projects/{project_id}

单个 project 详情。

**错误**

| HTTP | Code              | 说明                               |
| ---- | ----------------- | ---------------------------------- |
| 404  | PROJECT_NOT_FOUND | id 不存在，或不属于当前用户（防越权） |

## PATCH /projects/{project_id}

部分更新。仅传要改的字段。

**Request**
```json
{ "name": "新名字", "extraction_mode": "per_page" }
```

> ⚠️ 把 `extraction_mode` 改成另一个值（document ↔ per_page）会**清空并重建项目下所有 document 的 `DocumentExtraction` 行**：
> - 旧的 extraction 结果**全部丢弃**，包括成功的；
> - 所有 document 重新进 worker 排队，等同 rerun-stale 但范围更大；
> - 旧模式下 per-page 拆出来的多行会合并回 1 行（per_page → document），或者反过来按 `page_count` 重新拆开（document → per_page）。
>
> 前端应在用户改这个字段时弹确认框，说明"会消耗 quota 重抽全部文件"。

## DELETE /projects/{project_id}

删除 project。级联删除它所有 document、schema 历史版本。R2 上的原始文件也会尽力删除；删除失败只记日志不报错。

**Response**
```json
{ "deleted": true }
```
