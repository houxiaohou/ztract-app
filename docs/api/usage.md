# Usage Records

用户额度使用流水。**append-only** —— 抽取成功时后端写入一条，从不修改或删除（即使删除了项目/文档，快照字段保留可读性）。

主要用途：
- 用户查询自己的消费明细
- 后台做用量统计报表

## GET /usage

分页列出当前用户的使用记录，按时间倒序。

**Query 参数**

| 参数 | 默认 | 说明 |
| ---- | ---- | ---- |
| page | 1 | 页码 |
| size | 20 | 每页条数，最大 100 |

**Response**
```json
{
  "items": [
    {
      "id": "...",
      "project_name": "Demo",
      "document_name": "invoice-2026q1.pdf",
      "project_id": "...",
      "document_id": "...",
      "pages": 3,
      "kind": "extraction",
      "created_at": "2026-05-06T10:00:45Z"
    },
    {
      "id": "...",
      "project_name": "Old Project",
      "document_name": "deleted-doc.pdf",
      "project_id": null,
      "document_id": null,
      "pages": 1,
      "kind": "extraction",
      "created_at": "2026-04-12T08:23:11Z"
    }
  ],
  "page": 1,
  "size": 20,
  "total": 87,
  "total_pages": 215
}
```

### 字段说明

| 字段 | 说明 |
| ---- | ---- |
| `project_name` / `document_name` | **快照**。记录创建时抓取的值，即使原 project / document 后来被删，这里也还在 |
| `project_id` / `document_id` | 还活着时是 UUID，被删后变成 `null` |
| `pages` | 这次抽取消耗的页数 |
| `kind` | 记录类型。目前只有 `"extraction"`，预留未来扩展（如 `schema_generation` / `export` 等计费项） |
| `total` | 当前用户总记录数 |
| `total_pages` | 当前用户历史累计消耗页数（**所有**记录，不受分页影响，便于 UI 展示"总计 XXX pages"） |

## 前端使用建议

- **"我的消费明细"页**：直接渲染 `items[]`，列出日期 / 项目 / 文档 / 页数
- **"当前已用"标签**：用 `total_pages`，不需要再发请求
- **过滤/搜索**：当前没加 `kind` / 时间范围筛选参数 —— 如果后续需要再加
