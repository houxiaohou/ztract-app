import { useEffect, useImperativeHandle, useRef } from 'react';
import type { Ref } from 'react';
import { createSvgMark } from '@xparse-kit/visualizer';

import { fetchDocumentPageImage } from '@/features/documents/api';

type SvgMark = ReturnType<typeof createSvgMark>;

type PageItem = Parameters<typeof createSvgMark>[0]['pageList'] extends
  | Array<infer T>
  | undefined
  ? T
  : never;

export interface VisualizerHandle {
  scrollToPage: (page: number) => void;
  scrollToBlock: (blockId: string) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  rotateCw: () => void;
  reset: () => void;
}

interface DocumentVisualizerProps {
  projectId: string;
  documentId: string;
  pageList: PageItem[];
  activeBlockIds: string[];
  onBlockClick?: (blockId: string) => void;
  onPageChange?: (page: number) => void;
  handleRef?: Ref<VisualizerHandle | null>;
}

const MIN_SCALE = 0.5;
const MAX_SCALE = 5;
const ZOOM_STEP = 0.25;

function clampScale(scale: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

export function DocumentVisualizer({
  projectId,
  documentId,
  pageList,
  activeBlockIds,
  onBlockClick,
  onPageChange,
  handleRef,
}: DocumentVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<SvgMark | null>(null);
  const rotationRef = useRef(0);
  const onBlockClickRef = useRef(onBlockClick);
  const onPageChangeRef = useRef(onPageChange);

  useEffect(() => {
    onBlockClickRef.current = onBlockClick;
  }, [onBlockClick]);

  useEffect(() => {
    onPageChangeRef.current = onPageChange;
  }, [onPageChange]);

  useImperativeHandle(
    handleRef,
    () => ({
      scrollToPage: (page: number) => {
        instanceRef.current?.scrollToPage(page);
      },
      scrollToBlock: (blockId: string) => {
        instanceRef.current?.scrollToBlock(`#${CSS.escape(blockId)}`);
      },
      zoomIn: () => {
        const instance = instanceRef.current;
        if (!instance) return;
        instance.scaleTo(clampScale(instance.getScale() + ZOOM_STEP));
      },
      zoomOut: () => {
        const instance = instanceRef.current;
        if (!instance) return;
        instance.scaleTo(clampScale(instance.getScale() - ZOOM_STEP));
      },
      rotateCw: () => {
        const instance = instanceRef.current;
        if (!instance) return;
        rotationRef.current = (rotationRef.current + 90) % 360;
        instance.rotate(rotationRef.current);
      },
      reset: () => {
        const instance = instanceRef.current;
        if (!instance) return;
        rotationRef.current = 0;
        instance.scaleTo(1);
        instance.rotate(0);
      },
    }),
    [],
  );

  useEffect(() => {
    if (!containerRef.current) return;
    rotationRef.current = 0;
    const instance = createSvgMark({
      container: containerRef.current,
      pageList,
      showTypeTag: false,
      activeBlockIds,
      imageFetch: async (image, { signal }) => {
        return fetchDocumentPageImage(projectId, documentId, image.page, signal);
      },
      onBlockClick: (block) => {
        onBlockClickRef.current?.(block.id);
      },
      onPageChange: (page) => {
        onPageChangeRef.current?.(page);
      },
    });
    instanceRef.current = instance;
    return () => {
      instance.destroy();
      instanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, documentId]);

  useEffect(() => {
    const instance = instanceRef.current;
    if (!instance) return;
    instance.setOptions({ pageList });
    instance.rerender();
  }, [pageList]);

  useEffect(() => {
    const instance = instanceRef.current;
    if (!instance) return;
    instance.setOptions({ activeBlockIds });
  }, [activeBlockIds]);

  return <div ref={containerRef} className="h-full w-full overflow-auto" />;
}
