> ## Documentation Index
> Fetch the complete documentation index at: https://docs.textin.com/llms.txt
> Use this file to discover all available pages before exploring further.

# 快速启动

<Tip>
  本文档基于最新抽取API版本v3 ，如需查看旧版API（包含**Prompt模式**）或在线调试，请移步[Textin文档中心](https://www.textin.com/document/legacy/open_kie_vlm_engine)。
</Tip>

## 概述

TextIn xParse现已推出的全新版本的文档抽取API（v3）。在文档抽取中，您可以自定义抽取配置（JSON schema），指定您要抽取的字段名称、类型和字段描述，系统会根据您定义的配置进行抽取。

通过定义JSON schema，文档抽取兼顾了定义字段的**灵活性**和输出结果的**稳定性**。

您可以从多种样式的表单或文档中提取统一的结构化信息，并根据字段设定的标准类型完成自动格式转换。您可以根据下游系统的字段和结构要求来定义抽取JSON schema，以实现API"即插即用"的效果。例如，当您想要完成文档数据自动化录入系统时，文档抽取可以帮助您快速完成从复杂文档到系统结构化数据的无缝衔接。

<Note>
  新增功能

  1. 支持更灵活的上传文件传参方式，兼容`file_url`和`file_base64`
  2. 支持设定字段类型，包括常见的文本、数字、枚举等格式
  3. 支持抽取多个表格，且限定抽取范围
  4. 支持通过参数开关按需返回坐标信息，提升响应速度
</Note>

## 文档抽取配置

### JSON schema 结构示例

在文档抽取中最核心的配置是JSON schema，其结构示例如下：

```json theme={null}
{
    "type": "object",
    "properties": {
        "field_name": {
            "type": ["string","null"],
            "description": "Field description"
        },
        "table_name": {
            "type": "array",
            "description": "Table description",
            "items": {
                "type": "object",
                "properties": {
                    "name": {
                        "type": ["string","null"],
                        "description": ""
                    },
                    "category": {
                        "type": ["string","null"],
                        "description": ""
                    }
                },
                "required": [
                    "name",
                    "category"
                ]
            }
        }
    },
    "required": [
        "field_name",
        "table_name"
    ]
}
```

### JSON schema 结构说明和抽取指南

我们使用[JSON Schema](https://json-schema.org/)来定义要抽取的数据结构，在遵循 schema 规范的基础上，剔除了一些不必要的字段，文档抽取使用的 schema 字段如下：

* **type**：schema的类型，最外层固定为`object`
* **properties**：抽取字段的集合
  * **\<name>**：要抽取的字段名称，由用户自定义，每个字段包含以下信息：
    * **type**：要抽取的字段类型，参考[支持的字段类型](#json-schema-支持的字段类型)列表
    * **description**：要抽取的字段描述
    * **enum**：当type为`enum`时，该字段表示抽取字段的枚举值列表
    * **items**：当type为`array`时，该字段表示要抽取的列表中的字段集合，与`properties`类似
* **required**：指定抽取必要字段，其顺序表达了抽取输出的字段顺序，仅在type为`object`时需要。

在定义要抽取的数据时，您需要为每个字段提供一个名称，以及确定该字段的类型。您还可以添加可选的字段描述为大模型提供更多的上下文，帮助文档抽取准确了解需要从文档中查找和提取哪些信息。字段名称和描述越具体、表义越明确，文档抽取就越能准确地识别和抽取文档中的正确数据。

### JSON schema 支持的字段类型

* string：字符串
* number：数字
* integer：整数
* enum：枚举
* object：对象，对象内可以包含以下类型：string、number、integer、enum。
* array：数组，数组内可以包含以下类型：string、number、integer、enum、object。

请注意，在JSON schema中array、object类型均支持层级嵌套结构，以便于抽取如表格或者具有多个属性的实体对象。目前文档抽取仅支持最多**不超过3级**的嵌套。
type可以设置为字符串（如`"type": "string"`）或者包含null的数组（如`"type": ["string", "null"]`），即使type不带null，接口底层也会默认带上null，当抽取不到数据时，接口统一返回null值。

### JSON schema 支持的字段数量

为了获得最佳性能，保障抽取的精度和速度，在JSON schema中包含的最低层级（叶子节点）字段数量限制总计应**不超过100个**。

### 更多请求体参数说明

**file**: `object` 必填，传入需要处理的文件内容

* file\_url: `string` 待处理文件的url链接，与file\_base64二选一
* file\_base64: `string` 待处理文件的base64编码，与file\_url二选一
* file\_name: `string` 文件名，可选

如果file\_base64和file\_url同时存在，优先取file\_base64的值。

**parse\_options**: `object` 用于控制文档解析输出的相关参数

* **page\_start**：当上传的是pdf时，page\_start 表示从第几页开始抽取，取值范围从1开始，不传该参数时默认从首页开始。
* **page\_count**：当上传的是pdf时，page\_count 表示要进行抽取的pdf页数。
* **parse\_mode**：文档的解析模式，默认为scan模式。
  * auto 由引擎自动选择，适用范围最广
  * scan 文档统一当成图片解析（如pdf每一页都当成图片解析）
  * lite 轻量版，只输出表格和文字结果
  * parse 仅电子档文字解析，速度最快
  * vlm 视觉语言模型解析模式
* **get\_image**：获取图片，默认为objects。
  * none 不返回任何图像
  * page 返回每一页的整页图像：即pdf页的完整页图片
  * objects 返回页面内的子图像：即pdf页内的各个子图片
  * both 返回整页图像和图像对象
* **crop\_dewarp**：是否进行切边矫正预处理，默认为0，不进行切边矫正。
  * 0 不进行切边矫正
  * 1 进行切边矫正
* **remove\_watermark**：是否进行去水印预处理，默认为0，不去水印。
  * 0 不去水印
  * 1 去水印
* **formula\_level**：公式识别等级，默认为0，全识别。
  * 0 行间公式和行内公式都识别
  * 1 仅识别行间公式，行内公式不识别
  * 2 不识别公式
* **table\_flavor**：markdown里的表格格式，默认为html，按html语法输出表格。
  * md 按md语法输出表格
  * html 按html语法输出表格
  * none 不进行表格识别，把表格图像当成普通文字段落来识别
* **pdf\_pwd**：当pdf为加密文档时，需要提供密码。

**extract\_options**: `object` 用于控制更多抽取的高级功能

* generate\_citations `boolean` 是否生成坐标，默认为`true`
* stamp `boolean` 是否开启印章识别，默认为`true`

## 使用文档抽取 API：快速启动

<Tip>
  推荐使用我们的[在线Web平台](https://www.textin.com/console/recognition/robot_markdown?service=pdf_to_markdown)快速创建和验证 schema 抽取效果，页面使用方式请参考[使用指南](/extract-tutorial-v3)，之后您可以在[**API**](/api-reference/endpoint/extract-v3)调用中直接使用。
</Tip>

您也可以参考以下示例文件和示例代码，快速验证并将文档抽取接入到您的系统和应用流程中。

### 示例文件

<Tip>
  这里为您提供了一份Textin官方示例图片，您可以点击下载使用：[文档抽取png示例.png](https://web-api.textin.com/open/image/download?filename=54efc36a05cf475aa6b39137b0717726)

  <img src="https://mintcdn.com/textin/fw3w19DA3JyRQB2o/images/sample_image.webp?fit=max&auto=format&n=fw3w19DA3JyRQB2o&q=85&s=73884994884356dd6bfe5af24fb193a9" alt="Extract Sample Image" width="1279" height="1706" data-path="images/sample_image.webp" />
</Tip>

### 先决条件：获取API Key

使用文档抽取API处理文档时，您需要先获取[API Key](/xparse/api-key.mdx)。请先登录后前往 [TextIn工作台 - 账号与开发者信息](https://www.textin.com/console/dashboard/setting) 获取您的x-ti-app-id 和 x-ti-secret-code。

<Tip>
  想要快速调试API？请参考[Postman调试教程](/xparse/extract-debug-postman)或[Apifox调试教程](/xparse/extract-debug-apifox)。
</Tip>

### 请求示例

```python theme={null}
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

### 返回示例

```json theme={null}
{
  "code": 200,
  "message": "Success",
  "version": "v3.0.60",
  "duration": 8267,
  "x_request_id": "7596b8c9d2ddbc9924b66651e9efc174",
  "status": "finished",
  "result": {
    "success_count": 1,
    "extracted_schema": {
      "商品": "童装 Looney Tunes UT（短袖T恤）女装SUPIMA COTTON圆领T恤（短袖）",
      "商品列表": [
        {
          "名称": "童装 Looney Tunes UT（短袖T恤）",
          "类型": "童装"
        },
        {
          "名称": "女装SUPIMA COTTON圆领T恤（短袖）",
          "类型": "女装"
        }
      ]
    },
    "citations": {
      "商品": {
        "value": "童装 Looney Tunes UT（短袖T恤）女装SUPIMA COTTON圆领T恤（短袖）",
        "bounding_regions": [
          {
            "page_number": 1,
            "position": [137, 599, 1129, 599, 1129, 625, 182, 625],
            "text": "童装 Looney Tunes UT（短袖T恤）"
          }
        ],
      }
      // 商品列表...
    },
    "pages": [
      {
        "page_number": 1,
        "image_id": "62bfe3c3a8e9c9cf.jpg",
        "height": 1824,
        "width": 600,
        "angle": 0,
        "status": "Success",
        "durations": 930.178466796875
      }
    ]
  }
}
```

## 返回结果说明

### 常规字段说明

* x\_request\_id：该请求的唯一标识
* code：错误码，200表示成功。详情见[错误码说明](/xparse/extract-quickstart-v3#错误码说明)
* message：错误信息，成功时为”Success”
* version：版本号，例如”v3.0.29\_20250819”
* duration：总耗时(毫秒)，例如”8267”
* status：处理状态，例如"finished"

### 主要结果说明：result对象

文档抽取会在返回结果的result对象中包含以下关键信息。

**success\_count**：成功处理的文档页数。

**extracted\_schema**：结构化的抽取结果，以json格式返回，与抽取时传入的schema定义的结构一致。

**citations**：抽取结果的详细信息，包含坐标位置，结构与schema定义一致。

每个抽取字段的详细信息如下：

* **\<name>**：在schema中定义的抽取字段名
  * **value**：该字段的抽取结果
  * **bounding\_regions**：抽取结果value对应的坐标位置
    * **page\_number**：所在页码，从1开始
    * **text**：边界框所在区域内的文本内容
    * **position**：坐标位置，长度为8的数组，表示四个顶点的像素坐标 \[左上x, 左上y, 右上x, 右上y, 右下x, 右下y, 左下x, 左下y]

**stamps**：印章相关信息

* **color**：当前印章颜色，可选值有：红色、蓝色、黑色、其他
* **position**：印章的坐标信息
* **stamp\_shape**：当前印章形状，可选值有：圆章、椭圆章、方章、三角章、菱形章、其他
* **type**：当前印章类型，可选值有：公章、个人章、专用章、其他、合同专用章、财务专用章、发票专用章、业务专用章
* **value**：印章的文本内容

**pages**：文档页面相关信息

* **page\_number**：当前页码
* **image\_id**：当前页面图片id
* **height**：文档页面高度
* **width**：文档页面宽度
* **angle**：页面角度（可选值0, 90, 180, 270）
* **status**：当前页处理状态
* **durations**：当前页处理耗时(毫秒)

### 错误码说明

| **错误码** | **描述**                                             |
| :------ | :------------------------------------------------- |
| 40101   | x-ti-app-id 或 x-ti-secret-code 为空                  |
| 40102   | x-ti-app-id 或 x-ti-secret-code 无效，验证失败             |
| 40103   | 客户端IP不在白名单                                         |
| 40003   | 余额不足，请充值后再使用                                       |
| 40004   | Parameter error (参数错误，请检查入参)                       |
| 40007   | 机器人不存在或未发布                                         |
| 40008   | 机器人未开通，请至市场开通后重试                                   |
| 40301   | 图片类型不支持                                            |
| 40302   | 上传文件大小不符，文件大小不超过 50M                               |
| 40303   | 文件类型不支持，接口会返回实际检测到的文件类型，如“当前文件类型为.gif”             |
| 40304   | 图片尺寸不符，图像宽高须介于 20 和 10000（像素）之间                    |
| 40305   | File not uploaded (识别文件未上传)                        |
| 40306   | qps超过限制                                            |
| 40400   | 无效的请求链接，请检查链接是否正确                                  |
| 40422   | The file is corrupted (文件损坏)                       |
| 40423   | Password required or incorrect password (PDF密码错误)  |
| 40424   | Page number out of range (页面设置超出文件范围)              |
| 40425   | The input file format is not supported (输入文件格式不支持) |
| 40428   | Process office file failed (word和ppt转pdf失败或者超时)    |
| 500     | Engine failed (服务器内部错误)                            |
| 50011   | LLM Connection Failed （访问大模型超时）                    |
| 50012   | LLM Engine Failed (大模型引擎错误)                        |
| 50207   | Partial failed (部分页面解析失败)                          |

## Prompt 模式

目前v3版本仅支持字段模式（JSON Schema ）抽取，Prompt 模式抽取请参考[v2](https://www.textin.com/document/legacy/open_kie_vlm_engine)版本文档。

