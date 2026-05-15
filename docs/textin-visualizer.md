> ## Documentation Index
> Fetch the complete documentation index at: https://docs.textin.com/llms.txt
> Use this file to discover all available pages before exploring further.

# 前端可视化

> xParse 提供的开源前端可视化 SDK，用于文档解析、分Chunk等场景结果溯源

[@xparse-kit/visualizer](https://github.com/intsig-textin/xparse-kit/tree/master/packages/visualizer) 是 xParse 提供的开源前端可视化 SDK，用于在浏览器中可视化文档解析、分块等场景的处理结果。通过该 SDK，您可以：

* **可视化文档元素**：在原始文档页面上显示解析出的元素位置和类型
* **结果溯源**：快速定位检索结果在原始文档中的位置
* **交互式浏览**：支持缩放、旋转、页面导航等操作
* **高亮显示**：支持高亮显示选中的元素，便于人工审查

## 快速体验

我们提供了一个可以直接运行的 [demo 示例代码](https://github.com/intsig-textin/xparse-kit/blob/master/packages/visualizer/docs/examples)，您可以根据提示运行 demo，体验可视化的功能和效果。

![可视化 demo](https://static.textin.com/docs/images/pipeline/visualizer-demo.png)

## 快速开始

### 安装

```bash theme={null}
npm install @xparse-kit/visualizer
# 或
pnpm add @xparse-kit/visualizer
# 或
yarn add @xparse-kit/visualizer
```

### 基础示例

```typescript theme={null}
import { createSvgMark } from '@xparse-kit/visualizer';
import type { PageItem } from '@xparse-kit/visualizer';

// 准备页面数据
const pageList: PageItem[] = [
  {
    url: 'https://example.com/page1.jpg', // 页面图片地址
    width: 1225,
    height: 1718,
    angle: 0,
    blockList: [
      {
        id: 'block-1',
        page: 1,
        angle: 0,
        blockStyle: {
          fill: 'rgba(59, 130, 246, 0.15)', // 坐标框填充
          stroke: '#3b82f6', // 坐标框边界线颜色
          'stroke-width': 2.5, // 坐标框边界线宽度
        },
        text: '示例文本',
        position: [0.1, 0.1, 0.5, 0.1, 0.5, 0.3, 0.1, 0.3], // 相对坐标（0-1之间）
        type: 'Title',
        meta: { type: 'Title' },
        attrs: {},
      },
    ],
  },
];

// 创建实例
const instance = createSvgMark({
  container: '#app',
  pageList,
  showTypeTag: true,
});
```

## 使用示例

### 将 xParse 返回数据转换为 SDK 需要的格式

xParse Parse API 返回的数据格式可以直接使用，因为 `coordinates` 字段已经是相对坐标（0-1 之间）。您只需要将 API 返回的元素数据转换为 SDK 所需的 `PageItem` 格式：

```typescript theme={null}
import { createSvgMark } from '@xparse-kit/visualizer';
import type { PageItem, BlockItem } from '@xparse-kit/visualizer';

// xParse Parse API 返回的元素类型
interface XParseElement {
  element_id: string;
  type: string;
  text: string;
  metadata: {
    page_number: number;
    page_width: number;
    page_height: number;
    page_image_url?: string;
    coordinates: number[]; // 相对坐标，已经是 0-1 之间
  };
}

// 将 xParse Pipeline 数据转换为 SDK 格式
function transformXParseDataToSvgMarkData(
  elements: XParseElement[],
  themeStyles?: Record<string, any>
): PageItem[] {
  const pageMap = new Map<number, { pageInfo: any; blocks: BlockItem[] }>();

  // 默认样式主题
  const defaultStyles = {
    Title: {
      fill: 'rgba(59, 130, 246, 0.15)',
      stroke: '#3b82f6',
      'stroke-width': 2.5,
    },
    NarrativeText: {
      fill: 'rgba(34, 197, 94, 0.15)',
      stroke: '#22c55e',
      'stroke-width': 2,
    },
    Table: {
      fill: 'rgba(168, 85, 247, 0.15)',
      stroke: '#a855f7',
      'stroke-width': 2,
    },
    Image: {
      fill: 'rgba(251, 146, 60, 0.15)',
      stroke: '#fb923c',
      'stroke-width': 2,
    },
    default: {
      fill: 'rgba(156, 163, 175, 0.15)',
      stroke: '#9ca3af',
      'stroke-width': 2,
    },
  };

  const styles = themeStyles || defaultStyles;

  elements.forEach((element) => {
    const { metadata, element_id, type, text } = element;
    const pageNumber = metadata.page_number;
    const pageWidth = metadata.page_width;
    const pageHeight = metadata.page_height;
    const url = metadata.page_image_url || '';
    const coordinates = metadata.coordinates || [];

    // 如果坐标数组长度不是 8，跳过该元素
    if (coordinates.length !== 8) {
      console.warn(`元素 ${element_id} 的坐标格式不正确，已跳过`);
      return;
    }

    // 按页码分组
    if (!pageMap.has(pageNumber)) {
      pageMap.set(pageNumber, {
        pageInfo: {
          url,
          angle: 0,
          width: pageWidth,
          height: pageHeight,
        },
        blocks: [],
      });
    }

    const pageData = pageMap.get(pageNumber)!;
    const blockStyle = styles[type] || styles.default;

    const blockItem: BlockItem = {
      id: element_id,
      page: pageNumber,
      angle: 0,
      blockStyle,
      text: text || '',
      position: coordinates, // xParse Pipeline 返回的坐标已经是相对坐标，直接使用
      type,
      meta: {
        element_id,
        type,
        text,
        ...metadata,
      },
      attrs: {},
    };

    pageData.blocks.push(blockItem);
  });

  // 转换为 PageItem 数组
  const pageList = Array.from(pageMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([, { pageInfo, blocks }]) => ({
      ...pageInfo,
      blockList: blocks,
    }));

  return pageList;
}

// 使用示例
async function visualizeXParseResults() {
  // 假设这是从 xParse Parse API 获取的数据
  const xparseElements: XParseElement[] = [
    {
      element_id: 'element-1',
      type: 'Title',
      text: '第一章 简介',
      metadata: {
        page_number: 1,
        page_width: 1191,
        page_height: 1684,
        page_image_url: 'https://example.com/page1.jpg',
        coordinates: [0.1008, 0.1069, 0.8228, 0.1069, 0.8228, 0.1425, 0.1008, 0.1425],
      },
    },
    {
      element_id: 'element-2',
      type: 'NarrativeText',
      text: '这是正文内容...',
      metadata: {
        page_number: 1,
        page_width: 1191,
        page_height: 1684,
        page_image_url: 'https://example.com/page1.jpg',
        coordinates: [0.1822, 0.2316, 0.6717, 0.2316, 0.6717, 0.2732, 0.1822, 0.2732],
      },
    },
  ];

  // 转换为 SDK 格式
  const pageList = transformXParseDataToSvgMarkData(xparseElements);

  // 创建可视化实例
  const instance = createSvgMark({
    container: '#app',
    pageList,
    showTypeTag: true,
    onBlockClick: (block) => {
      console.log('点击了元素:', block.id);
      console.log('元素文本:', block.origin.text);
    },
  });

  return instance;
}
```

### 处理其他数据源的绝对坐标

如果您使用的是其他数据源，且坐标是绝对坐标（像素值），需要先转换为相对坐标：

```typescript theme={null}
/**
 * 将绝对坐标转换为相对坐标
 * @param absolutePosition 绝对坐标数组 [x1, y1, x2, y2, x3, y3, x4, y4]
 * @param imageWidth 图片宽度（像素）
 * @param imageHeight 图片高度（像素）
 * @returns 相对坐标数组（0-1之间）
 */
function convertAbsoluteToRelative(
  absolutePosition: number[],
  imageWidth: number,
  imageHeight: number
): number[] {
  if (absolutePosition.length !== 8) {
    throw new Error('坐标数组长度必须为 8');
  }

  return [
    absolutePosition[0] / imageWidth,  // x1
    absolutePosition[1] / imageHeight, // y1
    absolutePosition[2] / imageWidth,  // x2
    absolutePosition[3] / imageHeight, // y2
    absolutePosition[4] / imageWidth,  // x3
    absolutePosition[5] / imageHeight, // y3
    absolutePosition[6] / imageWidth,  // x4
    absolutePosition[7] / imageHeight, // y4
  ];
}

// 使用示例
const absoluteCoords = [217, 390, 1336, 390, 1336, 460, 217, 460];
const pageWidth = 1225;
const pageHeight = 1718;

const relativeCoords = convertAbsoluteToRelative(absoluteCoords, pageWidth, pageHeight);
// 结果: [0.1771, 0.2270, 1.0906, 0.2270, 1.0906, 0.2677, 0.1771, 0.2677]
```

### React 集成示例

```tsx theme={null}
import React, { useEffect, useRef } from 'react';
import { createSvgMark } from '@xparse-kit/visualizer';
import type { PageItem } from '@xparse-kit/visualizer';

interface VisualizerProps {
  pageList: PageItem[];
}

export const Visualizer: React.FC<VisualizerProps> = ({ pageList }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<ReturnType<typeof createSvgMark> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    instanceRef.current = createSvgMark({
      container: containerRef.current,
      pageList,
      showTypeTag: true,
      onBlockClick: (block) => {
        console.log('点击了元素:', block.id);
      },
      onPageChange: (page) => {
        console.log('当前页面:', page);
      },
    });

    return () => {
      if (instanceRef.current) {
        instanceRef.current.destroy();
      }
    };
  }, [pageList]);

  return <div ref={containerRef} style={{ width: '100%', height: '100vh' }} />;
};
```

### Vue 集成示例

```vue theme={null}
<template>
  <div ref="container" style="width: 100%; height: 100vh;"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { createSvgMark } from '@xparse-kit/visualizer';
import type { PageItem } from '@xparse-kit/visualizer';

const props = defineProps<{
  pageList: PageItem[];
}>();

const container = ref<HTMLDivElement | null>(null);
let instance: ReturnType<typeof createSvgMark> | null = null;

onMounted(() => {
  if (!container.value) return;
  
  instance = createSvgMark({
    container: container.value,
    pageList: props.pageList,
    showTypeTag: true,
    onBlockClick: (block) => {
      console.log('点击了元素:', block.id);
    },
    onPageChange: (page) => {
      console.log('当前页面:', page);
    },
  });
});

watch(() => props.pageList, () => {
  if (instance && container.value) {
    instance.setOptions({ pageList: props.pageList });
  }
});

onBeforeUnmount(() => {
  if (instance) {
    instance.destroy();
  }
});
</script>
```

## 核心功能

### 缩放和旋转

```typescript theme={null}
// 缩放
instance.scaleTo(1.5);  // 放大到 150%
instance.scaleTo(1);     // 恢复到 100%

// 旋转
instance.rotateTo(90);   // 旋转到 90 度
instance.getAngle();     // 获取当前角度
```

### 页面导航

```typescript theme={null}
// 跳转页面
instance.scrollToPage(2);

// 获取当前页面
const currentPage = instance.getCurrentPage();
```

### 标记框管理

```typescript theme={null}
// 高亮显示选中的标记框
instance.setOptions({
  activeBlockIds: ['block-1', 'block-2'],
});

// 添加新的标记框
const newBlock: BlockItem = {
  id: 'new-block',
  page: 1,
  angle: 0,
  blockStyle: {
    fill: 'rgba(255, 0, 0, 0.2)',
    stroke: '#ff0000',
    'stroke-width': 2,
  },
  text: '新标记',
  position: [0.2, 0.2, 0.6, 0.2, 0.6, 0.4, 0.2, 0.4],
  type: 'Custom',
  meta: { type: 'Custom' },
  attrs: {},
};

const blockInstance = instance.addBlock(newBlock);
```

### 事件监听

```typescript theme={null}
const instance = createSvgMark({
  container: '#app',
  pageList,
  onBlockClick: (block) => {
    console.log('点击了标记框:', block.id);
    instance.setOptions({ activeBlockIds: [block.id] });
  },
  onPageChange: (page) => {
    console.log('页面变化:', page);
  },
  onScaleChange: (scale, origin) => {
    console.log('缩放变化:', scale);
  },
});
```

### 性能优化

对于大量页面的场景，可以使用虚拟列表功能：

```typescript theme={null}
const instance = createSvgMark({
  container: '#app',
  pageList, // 假设有 100 页
  virtual: {
    threshold: 3, // 同时加载 3 页
  },
  overscan: 1, // 提前加载 1 页
});
```

## 数据格式说明

### 坐标格式

SDK 使用的 `position` 字段必须是**相对坐标**（0-1 之间），格式为 `[x1, y1, x2, y2, x3, y3, x4, y4]`，表示四边形的四个顶点坐标：

```
坐标数组: [x1, y1, x2, y2, x3, y3, x4, y4]
          ↑左上    ↑右上    ↑右下    ↑左下
```

**重要说明**：

* **xParse Parse API 返回的 `coordinates` 字段已经是相对坐标**，可以直接使用，无需转换
* 如果使用其他数据源且坐标是绝对坐标（像素值），需要先转换为相对坐标

### PageItem 格式

```typescript theme={null}
interface PageItem {
  url: string;              // 页面图片 URL
  width: number;             // 页面宽度（像素）
  height: number;            // 页面高度（像素）
  angle: number;             // 页面旋转角度（0, 90, 180, 270）
  blockList?: BlockItem[];   // 页面中的标记框列表
}
```

### BlockItem 格式

```typescript theme={null}
interface BlockItem {
  id: string;                // 唯一标识
  page: number;              // 页码（从 1 开始）
  angle: number;             // 旋转角度
  blockStyle: BlockStyle;    // 样式配置
  text: string;              // 文本内容
  position: number[];       // 相对坐标数组（0-1之间）
  type?: string;             // 元素类型
  meta: any;                 // 元信息
  attrs: any;                // 自定义属性
}
```

## 参考文档

* [使用指南](https://github.com/intsig-textin/xparse-kit/blob/master/packages/visualizer/docs/guide.md) - 完整的使用指南，包括快速开始、基础使用、核心功能和常见问题
* [API 文档](https://github.com/intsig-textin/xparse-kit/blob/master/packages/visualizer/docs/api.md) - 详细的 API 参考，包括所有类型定义、接口方法和配置选项
* [示例代码](https://github.com/intsig-textin/xparse-kit/blob/master/packages/visualizer/docs/examples/README.md) - 真实可运行的示例代码，包含主题切换、交互控制等功能演示
