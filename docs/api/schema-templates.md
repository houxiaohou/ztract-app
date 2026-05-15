# Schema Templates

内置的 schema 模板库，给用户"创建 project 后要配 schema"时一个起步起点。模板在后端代码里维护（`app/schema_templates.py`），改完重启生效，不走数据库。

所有接口需要 `Authorization: Bearer <token>`。

## 当前内置模板

| `key` | 适用 |
| --- | --- |
| `invoice_cn` | 中国增值税发票（含商品明细表） |
| `bank_receipt_cn` | 银行回单 / 电子回单 |
| `contract_cn` | 商务合同（含甲乙方 object） |
| `resume` | 简历（含教育、工作经历 array） |
| `shipping_label` | 快递面单 / 运单 |
| `business_card` | 名片 |

## GET /schema-templates

列出全部模板的**元信息**（不含字段列表）。用于前端模板选择器的卡片列表。

**Response**
```json
[
  {
    "key": "invoice_cn",
    "display_name": "中国增值税发票",
    "description": "适用于普通 / 专用增值税发票，支持多行商品明细"
  },
  {
    "key": "bank_receipt_cn",
    "display_name": "银行回单 / 电子回单",
    "description": "适用于银行转账回单、电子回单"
  }
]
```

## GET /schema-templates/{key}

拉取单个模板的**完整字段定义**。用户点了"用这个模板"以后调用，把 `fields` 丢进 schema 编辑器作为草稿即可，结构 100% 兼容 `PUT /projects/{id}/schema` 的请求体。

**Response**
```json
{
  "key": "invoice_cn",
  "display_name": "中国增值税发票",
  "description": "适用于普通 / 专用增值税发票，支持多行商品明细",
  "fields": [
    { "name": "invoice_number", "type": "string", "description": "发票号码", "required": true },
    { "name": "issue_date",     "type": "string", "description": "开票日期，格式 YYYY-MM-DD", "required": true },
    {
      "name": "line_items",
      "type": "array",
      "description": "发票明细行",
      "items": {
        "name": "line_item",
        "type": "object",
        "attributes": [
          { "name": "product",  "type": "string", "description": "商品名称 / 服务名称" },
          { "name": "quantity", "type": "number", "description": "数量" }
        ]
      }
    }
  ]
}
```

**错误**

| HTTP | Code | 说明 |
| --- | --- | --- |
| 404 | TEMPLATE_NOT_FOUND | `key` 不是当前内置列表里任何一个 |

## 典型前端流程

```ts
// 1. 用户进入"选择 schema"页面
const templates = await fetch('/schema-templates', { headers: authHeader });

// 2. 用户点某张卡片
const tmpl = await fetch(`/schema-templates/${key}`, { headers: authHeader });

// 3. 把 tmpl.fields 放进编辑器作为草稿，用户可以继续改
editor.loadDraft(tmpl.fields);

// 4. 用户点"保存"
await fetch(`/projects/${projectId}/schema`, {
  method: 'PUT',
  headers: { ...authHeader, 'Content-Type': 'application/json' },
  body: JSON.stringify({ fields: editor.getState() }),
});
```
