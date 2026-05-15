# API Overview

ztract 后端 API 概览。除 `/billing/webhook` 外，所有业务接口都需要在请求头中携带 JWT：

```
Authorization: Bearer <token>
```

## 模块

- [projects.md](./projects.md) — project CRUD、分页搜索、`extraction_mode` 设置
- [project-schemas.md](./project-schemas.md) — schema 字段定义 + 版本化历史 + AI 草稿生成 + 样本文件预签名
- [schema-templates.md](./schema-templates.md) — 内置 schema 模板
- [documents.md](./documents.md) — R2 预签名上传 + document 登记/列表/下载 + `extractions` 子资源 + 重抽
- [parsed-data.md](./parsed-data.md) — 已抽取数据列表 + 导出
- [usage.md](./usage.md) — 用户额度使用记录

## 通用错误响应

所有错误响应体为：

```json
{
  "detail": {
    "code": "PROJECT_NOT_FOUND",
    "message": "Project not found"
  }
}
```

常见错误码：

| HTTP | Code                      | 说明                                |
| ---- | ------------------------- | ----------------------------------- |
| 401  | UNAUTHORIZED              | 未登录或 token 无效                 |
| 402  | INSUFFICIENT_QUOTA        | 可用额度不足                        |
| 404  | PROJECT_NOT_FOUND         | project 不存在或非本人所有          |
| 404  | SCHEMA_NOT_FOUND          | project 还未配置 schema             |
| 404  | DOCUMENT_NOT_FOUND        | document 不存在或非本人所有         |
| 404  | EXTRACTION_NOT_FOUND      | extraction 不存在或不属于该 document |
| 409  | DOCUMENT_IN_FLIGHT        | document 下还有 extraction 处于 pending/processing，不允许重抽 |
| 415  | UNSUPPORTED_MIME_TYPE     | 上传文件类型不在白名单              |
| 422  | PAGE_COUNT_REQUIRED       | per_page 模式下 register 文档时缺 `page_count` |
| 422  | —                         | 请求体校验失败（Pydantic validation） |
