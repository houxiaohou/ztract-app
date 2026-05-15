# 项目编辑 schema 功能需求

此文档描述了如何编辑项目的 schema，接口文档参考 `@docs/api.json` 中关于 schema 的相关接口。
此文档仅描述手动编辑 schema 的相关功能，后续会增加 prompt 自动解析为 schema、上传示例文档自动解析为 schema 的功能。
schema 是从文档中抽取结构化数据的描述 json。

## 关于 Schema
Schema 的 Field 包括如下字段：
- Field Type: 单选项，可选项为 String, Number, Integer, Enum, Object, Array，必选
- Filed Name: 字段名称，必填
- Description: 告诉 AI 从文档中抽取的信息是什么

Object 是对象，如果选择了 Object，则可以在此 Object 下面添加 Object Attributes，可以添加多个，Object Attribute 与上述 Filed 一致。
你可以理解为是嵌套。
Array 是数组，可以是上述任何类型的数组（除了 Array），因此如果 Filed 如果选择为 Array，需要

为了便于你理解这几个字段类型，我将 TextIn 官方文档相关的描述粘贴过来：
```text
JSON schema 支持的字段类型
string：字符串
number：数字
integer：整数
enum：枚举
object：对象，对象内可以包含以下类型：string、number、integer、enum。
array：数组，数组内可以包含以下类型：string、number、integer、enum、object。
请注意，在JSON schema中array、object类型均支持层级嵌套结构，以便于抽取如表格或者具有多个属性的实体对象。目前文档抽取仅支持最多不超过3级的嵌套。 type可以设置为字符串（如"type": "string"）或者包含null的数组（如"type": ["string", "null"]），即使type不带null，接口底层也会默认带上null，当抽取不到数据时，接口统一返回null值。
```
下面这段代码是 TextIn 的示例代码：
```python
import requests

url = "https://api.textin.com/ai/service/v3/entity_extraction"

payload = {
    # 您要抽取的文件
    "file": {
        "file_url": "https://web-api.textin.com/open/image/download?filename=54efc36a05cf475aa6b39137b0717726"
    },
    # 定义抽取的schema
    "schema": {
        "type": "object",
        "properties": {
            "商品": {
                "type": ["string","null"],
                "description": ""
            },
            "商品列表": {
                "type": "array",
                "description": "",
                "items": {
                    "type": "object",
                    "properties": {
                        "名称": {
                            "type": ["string","null"],
                            "description": ""
                        },
                        "类型": {
                            "type": ["string","null"],
                            "description": ""
                        }
                    },
                    "required": ["名称","类型"]
                }
            }
        },
        "required": [
            "商品",
            "商品列表"
        ]
    },
    # 解析相关参数
    "parse_options":{
        "crop_dewarp":1,
        "get_image":"both"
    },
    # 抽取高级配置
    "extract_options":{
        "generate_citations": True,
        "stamp": True
    }
}

# 设置API key
headers = {
    "x-ti-app-id": "<api-key>",    #需替换为你的x-ti-app-id
    "x-ti-secret-code": "<api-key>",    #需替换为你的x-ti-secret-code
    "Content-Type": "application/json"
}

response = requests.post(url, json=payload, headers=headers)

print(response.json())
```

## 注意事项

我们这里的 schema 与 TextIn 的 schema 的有区别，我们保存到数据库的是数组，后面调用 TextIn 转换时，会增加一个转换方法。
将我们自己的 schema 转换为 TextIn 需要的格式。

## 页面布局

- 这个页面在 Extraction Schema，路径是：/project/:uuid/schema
- 顶部是按钮栏，包括：Add Field、Save Schema
- 中间是 Schema 的 table 展示，展示 Field Name、Field Type、Description
- Filed 可以多选，选择后，Add Field 按钮旁出现 Delete Selected
- 所有的编辑操作点击 Save Schema 才会生效，编辑后，即在 Save Schema 旁边出现 "Unsaved Changes" 提示
- 参考我给你的这两个截图：`@docs/features/project-schema.png`、`@docs/features/project-schema-dialog.png`
- 截图只是形式参考

## 你的任务

- 完成 schema 编辑页面以及接口调用。