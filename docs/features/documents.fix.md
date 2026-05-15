# 文档解析方式需求修改


## 需求描述

下面的这段内容是我在 ztract api 接口项目中提供的需求文档

```markdown

## 文档解析方式需求修改

此文档介绍了解析用户上传 PDF 文件解析方式变动的具体需求。

### 具体问题
用户上传的 PDF 有多页，从用户意图需求出发，用户可能是想要按照整个 PDF Document 来解析，也有可能是每一页做一次解析。

因此衍生出了以下几个问题：
1. 在上传 sample document AI 自动生成 schema 时，多 page 的 PDF 会影响生成解析结果。
2. 用户上传要解析的 document 时可能是想以整个 document、或者单个 page 的维度进行解析。

### 解决方案
为了应对以上问题，我考虑用如下方案进行解决：
- 上传 sample document 让 AI 生成 schema 时，如果 PDF 有多页，需要让用户手动选择是用单个 page 进行解析还是按照整个 document 进行解析；
- 如果用户选择单个 page，用户需要输入页码，指定用哪一页进行生成；
- 生成 schema 时将用户的选择保存到 project 的 setting 中，这个 setting 代表是每页都解析还是按照整个 document 进行解析；
- 如果是每页都解析，调用 TextIn 的相关接口时，需要传入抽取的页面配置，这个 TextIn 接口提供了这个参数；
- 后面用户可以在 project 的 setting 中修改这些设置项。

### 由此引发的其他问题
- 如果 document 抽取是以 page 为单位抽取的，一个 document 就对应很多抽取结果，数据库需要做改动；
- 用户端用了 @xparse-kit/visualizer (你不需要研究这个库) 这个开源库展示解析出的数据与元是文档的位置对照，高亮框出，之前的接口需要修改成我们现在的方式；
```

后端已经根据此需求完成了代码编写，具体参考生成的 api 接口文档以及说明文档：

- `@docs/api.json`
- `@docs/api/documents.md`
- `@docs/api/project-schemas.md`
- `@docs/api/projects.md`

## 你的任务
根据业务需求的调整完成前端代码的修改，需要调整的位置比较多，我觉得起码包含以下方面：
1. 上传 sample document 如果是 PDF 多页，要让用户选择是整个文档抽取还是输入某个页面 page_number；
2. 前端展示 document 详情需要根据页码来显示；
还有其他的，你看一下