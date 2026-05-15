# Document Extraction

文档上传后会自动进入抽取队列 —— 后端调 TextIn v3 `/entity_extraction`，把抽取结果整体存到 `documents.extract_result` JSONB 字段里，按页扣用户 quota。

## 触发时机

```
 用户创建 project
      ↓
 上传 document (POST /documents)
      ↓
 Document 状态 = pending
      ↓              (后端 worker 每 2 秒轮询一次)
 project 有 schema?
 ├── 有 → worker 立即领走 → status=processing → 调 TextIn → status=success/failed
 └── 没有 → document 继续躺在 pending，直到用户 PUT /schema，下次轮询时被领走
```

一次只处理一篇文档（sequential queue）。多个 uvicorn 进程同时跑也安全 —— worker 用 Postgres `FOR UPDATE SKIP LOCKED` 抢占式消费队列。

## 状态机

```
 pending  ← 新上传 / schema 还没配好
   ↓          worker 领走
 processing
   ↓
 success  ← extract_result 就绪，quota 已扣，usage_records 已写
 failed   ← error_message 里写了原因，quota 不扣
```

失败原因可能是：配额不足、R2 / TextIn 调用失败、schema 非法等。错误信息都挂在 `Document.error_message` 上，前端可以直接展示给用户。

## GET /projects/{project_id}/documents/{document_id}/extraction

拉取文档的完整抽取结果 —— visualizer 用的就是这个接口。需要鉴权。

**Response**
```json
{
  "document_id": "...",
  "status": "success",
  "page_count": 3,
  "error_message": null,
  "started_at": "2026-05-06T10:00:00Z",
  "finished_at": "2026-05-06T10:00:45Z",
  "result": {
    "code": 200,
    "message": "Success",
    "result": {
      "extracted_schema": { "invoice_no": "ABC-123", "amount": 99.5 },
      "citations": {
        "invoice_no": {
          "value": "ABC-123",
          "bounding_regions": [
            {
              "page_number": 1,
              "position": [137, 599, 1129, 599, 1129, 625, 182, 625],
              "text": "ABC-123"
            }
          ]
        }
      },
      "pages": [
        {
          "page_number": 1,
          "image_id": "62bfe3c3a8e9c9cf.jpg",
          "width": 600,
          "height": 1824,
          "angle": 0,
          "status": "Success"
        }
      ]
    }
  }
}
```

前端**轮询**这个接口（每 2-5 秒一次）直到 `status` 变为 `success` 或 `failed`。

`result` 字段是 TextIn v3 原始响应**一字未改**保存下来的。前端转换 `result.result.citations` + `result.result.pages` 为 `@xparse-kit/visualizer` 的 `PageItem[]` 即可（坐标除以 page 宽/高变成相对坐标）。

## GET /projects/{project_id}/documents/{document_id}/pages/{page_number}/image

代理 TextIn 的 `image_id` 图片下载。需要鉴权。

TextIn 的图片 URL 需要携带 `x-ti-app-id` / `x-ti-secret-code` 才能下载 —— 这俩**绝对不能**暴露给前端。本接口的作用：
1. 验证用户对该文档的访问权限
2. 从 `document.extract_result.result.pages` 里按 `page_number` 找到对应 `image_id`
3. 用后端存的 TextIn 凭证去 TextIn 下载
4. 以原样 `Content-Type`（通常 `image/jpeg`）把字节流回给前端

**Response**：图片二进制流，`Cache-Control: private, max-age=3600`（一小时缓存）。

前端给 `@xparse-kit/visualizer` 的 `PageItem.url` 填这个接口地址即可：

```ts
pageList = extract.result.result.pages.map(p => ({
  url: `/projects/${projectId}/documents/${documentId}/pages/${p.page_number}/image`,
  width: p.width,
  height: p.height,
  angle: p.angle,
  blockList: buildBlocksFromCitations(extract.result.result.citations, p),
}));
```

**错误**

| HTTP | Code | 说明 |
| ---- | ---- | ---- |
| 404 | PROJECT_NOT_FOUND / DOCUMENT_NOT_FOUND | 越权 或 ID 不存在 |
| 404 | PAGE_IMAGE_NOT_FOUND | 该 `page_number` 在 extract_result 里没找到（文档还在 pending，或页数超出） |

## 扣费与使用记录

每次抽取成功后：
- 按 TextIn 返回的 `pages.length` 扣 quota（图片 1 页，PDF 每页 1 页）
- 扣费顺序：**最快过期的 quota pack 先扣**（避免过期浪费）
- 同步写一条 `UsageRecord`（append-only），snapshot 当时的 `project_name` / `document_name`，即使后续 project / document 被删了也能还原历史

`UsageRecord.user` CASCADE（用户被删则记录一并删），`project` / `document` `SET NULL`（被删则保留快照字段）。

## 并发模型

- **单 uvicorn 进程**：1 个 asyncio worker 在 lifespan 里跑，2 秒空闲轮询
- **多 uvicorn 进程**：各自起一个 worker；`FOR UPDATE SKIP LOCKED` 保证同一条 pending document 只会被一个 worker 领走
- **用户体验延迟**：从上传 / schema save 到 worker 开始处理最多延迟 2 秒；TextIn 抽取本身 30-120 秒

如果未来流量大了需要独立 worker 进程，就把 `run_extraction_worker` 拆出来做 `python -m app.workers.extraction` 即可，业务代码不用改。
