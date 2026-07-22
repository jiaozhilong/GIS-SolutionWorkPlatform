import {
  CompressOutlined,
  FileAddOutlined,
  FilePdfOutlined,
  FilePptOutlined,
  FileWordOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
  PlusOutlined,
  SaveOutlined,
  ZoomInOutlined,
  ZoomOutOutlined
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Empty, Input, Select, Skeleton, Slider, Space, Tag, Typography, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { generatePptContent, getPptRecord, updatePptRecord } from '../../api/ppt';
import { generateProjectPptOutline, type Project, type PptRecord } from '../../api/projects';

const { TextArea } = Input;

interface PptDeliveryEditorProps {
  project: Project;
  records: PptRecord[];
  latestExecutionId?: string;
  onDirtyChange?: (dirty: boolean) => void;
}

interface SlideViewModel {
  id: string;
  type: string;
  title: string;
  bullets: string[];
  speakerNotes: string;
  imageSuggestion: string;
}

interface ParsedJson<T> {
  value: T | null;
  raw?: string;
  error?: string;
}

interface EditorState {
  title: string;
  subtitle: string;
  layout: string;
  background: string;
  notes: string;
  slides: SlideViewModel[];
}

function defaultTitle(project: Project) {
  return `${project.name} 解决方案汇报`;
}

function fallbackSlides(project: Project): SlideViewModel[] {
  return [
    {
      id: 'cover',
      type: 'cover',
      title: defaultTitle(project),
      bullets: [project.customerName || '客户待补充', project.industry || 'GIS 行业', project.gisDomain || '三维可视化 / 空间分析'],
      speakerNotes: '封面页突出项目名称、客户和汇报主题。',
      imageSuggestion: '建议使用深色 GIS 三维城市、空间网络或项目架构图作为主视觉。'
    },
    {
      id: 'background',
      type: 'content',
      title: '项目背景与建设目标',
      bullets: [project.description || '围绕客户现状、业务痛点和建设目标展开。', '统一沉淀数据、平台、应用和 AI 能力。'],
      speakerNotes: '说明客户为什么需要本次建设，以及本次方案要解决的核心问题。',
      imageSuggestion: '使用现状架构图、业务流程图或地图数据分布图。'
    }
  ];
}

function safeParseJson<T>(text?: string): ParsedJson<T> {
  if (!text || !text.trim()) return { value: null };
  try {
    return { value: JSON.parse(text) as T, raw: text };
  } catch (error) {
    return { value: null, raw: text, error: (error as Error).message };
  }
}

function toTextList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item));
  if (typeof value === 'string' && value.trim()) return value.split('\n').map((item) => item.trim()).filter(Boolean);
  return [];
}

function normalizeSlides(content: unknown, outline: unknown, project: Project): SlideViewModel[] {
  const contentSlides = typeof content === 'object' && content !== null && Array.isArray((content as { slides?: unknown }).slides)
    ? (content as { slides: unknown[] }).slides
    : [];

  if (contentSlides.length > 0) {
    return contentSlides.map((item, index) => {
      const slide = item as Record<string, unknown>;
      return {
        id: String(slide.id || slide.type || `slide-${index + 1}`),
        type: String(slide.type || 'content'),
        title: String(slide.title || `第 ${index + 1} 页`),
        bullets: toTextList(slide.bullets),
        speakerNotes: String(slide.speakerNotes || ''),
        imageSuggestion: String(slide.imageSuggestion || '')
      };
    });
  }

  const outlineItems = Array.isArray(outline) ? outline : [];
  if (outlineItems.length > 0) {
    return outlineItems.map((item, index) => {
      const slide = item as Record<string, unknown>;
      return {
        id: `outline-${index + 1}`,
        type: 'outline',
        title: String(slide.title || `第 ${index + 1} 页`),
        bullets: [String(slide.keyPoint || slide.summary || '待生成内容')],
        speakerNotes: '该页来自 PPT 大纲，生成内容后会补全讲稿和视觉建议。',
        imageSuggestion: '待生成'
      };
    });
  }

  return fallbackSlides(project);
}

function makeEditorState(project: Project, record?: PptRecord | null): { state: EditorState; content: ParsedJson<Record<string, unknown>>; outline: ParsedJson<unknown[]> } {
  const content = safeParseJson<Record<string, unknown>>(record?.contentJson);
  const outline = safeParseJson<unknown[]>(record?.outlineJson);
  const contentValue = content.value || {};
  const slides = normalizeSlides(content.value, outline.value, project);

  return {
    content,
    outline,
    state: {
      title: record?.title || defaultTitle(project),
      subtitle: String(contentValue.subtitle || '从客户需求到 GIS 交付物'),
      layout: String(contentValue.layout || 'enterprise'),
      background: String(contentValue.background || 'dark-gis'),
      notes: String(contentValue.notes || ''),
      slides
    }
  };
}

function stringifySlideContent(project: Project, state: EditorState, previousContent: Record<string, unknown> | null) {
  return JSON.stringify({
    ...(previousContent || {}),
    version: '1.0',
    projectId: project.id,
    title: state.title,
    subtitle: state.subtitle,
    layout: state.layout,
    background: state.background,
    notes: state.notes,
    slides: state.slides.map((slide) => ({
      type: slide.type,
      title: slide.title,
      bullets: slide.bullets,
      speakerNotes: slide.speakerNotes,
      imageSuggestion: slide.imageSuggestion
    }))
  });
}

function stringifyOutline(state: EditorState) {
  return JSON.stringify(state.slides.map((slide, index) => ({
    page: index + 1,
    title: slide.title,
    keyPoint: slide.bullets[0] || ''
  })));
}

export default function PptDeliveryEditor({ project, records, latestExecutionId, onDirtyChange }: PptDeliveryEditorProps) {
  const queryClient = useQueryClient();
  const [selectedRecordId, setSelectedRecordId] = useState<string>();
  const [selectedSlideIndex, setSelectedSlideIndex] = useState(0);
  const [editor, setEditor] = useState<EditorState>(() => makeEditorState(project, records[0]).state);
  const [contentParse, setContentParse] = useState<ParsedJson<Record<string, unknown>>>({ value: null });
  const [outlineParse, setOutlineParse] = useState<ParsedJson<unknown[]>>({ value: null });
  const [jsonRepairEnabled, setJsonRepairEnabled] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [zoom, setZoom] = useState(86);
  const [fitMode, setFitMode] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);

  const selectedRecordQuery = useQuery({
    queryKey: ['ppt-record-detail', selectedRecordId],
    queryFn: () => getPptRecord(selectedRecordId!),
    enabled: !!selectedRecordId
  });

  const currentRecord = selectedRecordQuery.data || records.find((record) => record.id === selectedRecordId) || records[0];
  const selectedSlide = editor.slides[selectedSlideIndex] || editor.slides[0];

  useEffect(() => {
    if (!selectedRecordId && records[0]?.id) {
      setSelectedRecordId(records[0].id);
    }
  }, [records, selectedRecordId]);

  useEffect(() => {
    const snapshot = makeEditorState(project, currentRecord);
    setEditor(snapshot.state);
    setContentParse(snapshot.content);
    setOutlineParse(snapshot.outline);
    setJsonRepairEnabled(false);
    setSelectedSlideIndex(0);
    setDirty(false);
  }, [currentRecord?.id, currentRecord?.updatedAt, project.id]);

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  const recordOptions = useMemo(() => records.map((record) => ({
    label: record.title || `PPT 记录 ${record.id}`,
    value: record.id
  })), [records]);

  const markDirty = (next: EditorState) => {
    setEditor(next);
    setDirty(true);
  };

  const switchRecord = (recordId: string) => {
    if (dirty && !window.confirm('当前 PPT 有未保存修改，切换记录会丢失这些修改，是否继续？')) return;
    setSelectedRecordId(recordId);
  };

  const generateOutlineMutation = useMutation({
    mutationFn: () => generateProjectPptOutline(project.id, editor.title || defaultTitle(project)),
    onSuccess: (record) => {
      message.success('PPT 大纲已生成');
      setSelectedRecordId(record.id);
      queryClient.invalidateQueries({ queryKey: ['project-ppt-records', project.id] });
      queryClient.invalidateQueries({ queryKey: ['ppt-record-detail', record.id] });
    },
    onError: (error) => message.error((error as Error).message)
  });

  const generateContentMutation = useMutation({
    mutationFn: () => generatePptContent({
      projectId: project.id,
      executionId: latestExecutionId,
      title: editor.title || defaultTitle(project)
    }),
    onSuccess: (record) => {
      message.success('PPT 内容已生成');
      setSelectedRecordId(record.id);
      queryClient.invalidateQueries({ queryKey: ['project-ppt-records', project.id] });
      queryClient.invalidateQueries({ queryKey: ['ppt-record-detail', record.id] });
    },
    onError: (error) => message.error((error as Error).message)
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!currentRecord?.id) throw new Error('请先生成或打开一个真实 PPT 记录后再保存');
      const hasBrokenJson = Boolean(contentParse.error || outlineParse.error);
      const contentJson = contentParse.error && !jsonRepairEnabled
        ? currentRecord.contentJson
        : stringifySlideContent(project, editor, contentParse.value);
      const outlineJson = outlineParse.error && !jsonRepairEnabled
        ? currentRecord.outlineJson
        : stringifyOutline(editor);

      if (hasBrokenJson && !jsonRepairEnabled) {
        message.warning('检测到损坏 JSON，本次保存会保留原始 JSON 文本，仅更新标题和状态。点击“修复 JSON 后保存”可重建内容结构。');
      }

      return updatePptRecord(currentRecord.id, {
        title: editor.title || defaultTitle(project),
        outlineJson,
        contentJson,
        status: 'EDITING'
      });
    },
    onSuccess: (record) => {
      message.success('PPT 已保存');
      setDirty(false);
      setJsonRepairEnabled(false);
      setSelectedRecordId(record.id);
      queryClient.invalidateQueries({ queryKey: ['project-ppt-records', project.id] });
      queryClient.invalidateQueries({ queryKey: ['ppt-record-detail', record.id] });
    },
    onError: (error) => message.error((error as Error).message)
  });

  const updateSlide = (patch: Partial<SlideViewModel>) => {
    markDirty({
      ...editor,
      slides: editor.slides.map((slide, index) => index === selectedSlideIndex ? { ...slide, ...patch } : slide)
    });
  };

  const addSlide = () => {
    markDirty({
      ...editor,
      slides: [
        ...editor.slides,
        {
          id: `slide-${Date.now()}`,
          type: 'content',
          title: '新增页面',
          bullets: ['请输入页面要点'],
          speakerNotes: '',
          imageSuggestion: ''
        }
      ]
    });
    setSelectedSlideIndex(editor.slides.length);
  };

  return (
    <section className={`ppt-editor-shell${fullscreen ? ' is-fullscreen' : ''}`}>
      <aside className="ppt-editor-sidebar">
        <div className="ppt-editor-panel-title">
          <strong>交付物</strong>
          <span>Word / PDF / PPT</span>
        </div>
        <button type="button" className="ppt-deliverable-list-item" onClick={() => message.info('Word 交付物预览待接入文档生成接口')}>
          <FileWordOutlined />
          <span><strong>方案文档</strong><small>{project.name}.docx</small></span>
        </button>
        <button type="button" className="ppt-deliverable-list-item" onClick={() => message.info('PDF 交付物预览待接入文档生成接口')}>
          <FilePdfOutlined />
          <span><strong>技术架构</strong><small>{project.gisDomain || 'GIS'} 架构说明.pdf</small></span>
        </button>
        <div className="ppt-record-toolbar">
          <Select
            placeholder="选择 PPT 记录"
            options={recordOptions}
            value={currentRecord?.id}
            onChange={switchRecord}
            notFoundContent="暂无 PPT 记录"
          />
          <Button block icon={<FilePptOutlined />} loading={generateOutlineMutation.isPending} onClick={() => generateOutlineMutation.mutate()}>
            生成大纲
          </Button>
          <Button block type="primary" icon={<FilePptOutlined />} loading={generateContentMutation.isPending} onClick={() => generateContentMutation.mutate()}>
            生成内容
          </Button>
        </div>
        <button type="button" className="ppt-deliverable-list-item is-add" onClick={() => message.info('新增交付物上传接口待接入')}>
          <FileAddOutlined />
          <span><strong>新增交付物</strong><small>上传或关联外部文件</small></span>
        </button>
      </aside>

      <main className="ppt-editor-main">
        {(contentParse.error || outlineParse.error) && (
          <Alert
            type="warning"
            showIcon
            className="ppt-json-alert"
            message="PPT JSON 解析异常"
            description="已保留原始 outlineJson/contentJson 文本，不会自动覆盖为空数组。如需重建结构，请确认后使用修复保存。"
            action={<Button size="small" onClick={() => setJsonRepairEnabled(true)}>修复 JSON 后保存</Button>}
          />
        )}
        {selectedRecordQuery.isError && (
          <Alert type="error" showIcon message="PPT 记录读取失败" description={(selectedRecordQuery.error as Error).message} />
        )}
        {selectedRecordQuery.isLoading && <Skeleton active paragraph={{ rows: 5 }} />}

        <div className="ppt-editor-form-grid">
          <label>
            <span>PPT 标题</span>
            <Input value={editor.title} onChange={(event) => markDirty({ ...editor, title: event.target.value })} />
          </label>
          <label>
            <span>副标题</span>
            <Input value={editor.subtitle} onChange={(event) => markDirty({ ...editor, subtitle: event.target.value })} />
          </label>
          <label>
            <span>版式</span>
            <Select
              value={editor.layout}
              onChange={(value) => markDirty({ ...editor, layout: value })}
              options={[
                { label: '企业汇报', value: 'enterprise' },
                { label: '技术架构', value: 'architecture' },
                { label: '投标演示', value: 'bid' }
              ]}
            />
          </label>
          <label>
            <span>背景</span>
            <Select
              value={editor.background}
              onChange={(value) => markDirty({ ...editor, background: value })}
              options={[
                { label: '深色 GIS 科技', value: 'dark-gis' },
                { label: '浅色企业工作台', value: 'light-enterprise' },
                { label: '三维城市蓝绿', value: 'city-cyan' }
              ]}
            />
          </label>
        </div>

        <div className="ppt-slide-editor-grid">
          <section className="ppt-thumbnail-column">
            <div className="ppt-editor-panel-title">
              <strong>页面缩略图</strong>
              <Button size="small" icon={<PlusOutlined />} onClick={addSlide}>新增</Button>
            </div>
            {editor.slides.length === 0 && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无页面" />}
            {editor.slides.map((slide, index) => (
              <button
                type="button"
                className={`ppt-thumbnail${index === selectedSlideIndex ? ' is-active' : ''}`}
                key={`${slide.id}-${index}`}
                onClick={() => setSelectedSlideIndex(index)}
              >
                <em>{index + 1}</em>
                <strong>{slide.title}</strong>
                <span>{slide.bullets[0] || '暂无要点'}</span>
              </button>
            ))}
          </section>

          <section className="ppt-slide-fields">
            {selectedSlide ? (
              <Space direction="vertical" size={12} className="content-stack">
                <label>
                  <span>当前页标题</span>
                  <Input value={selectedSlide.title} onChange={(event) => updateSlide({ title: event.target.value })} />
                </label>
                <label>
                  <span>页面要点</span>
                  <TextArea rows={5} value={selectedSlide.bullets.join('\n')} onChange={(event) => updateSlide({ bullets: event.target.value.split('\n').map((item) => item.trim()).filter(Boolean) })} />
                </label>
                <label>
                  <span>备注</span>
                  <TextArea rows={4} value={selectedSlide.speakerNotes} onChange={(event) => updateSlide({ speakerNotes: event.target.value })} />
                </label>
                <label>
                  <span>背景/配图建议</span>
                  <TextArea rows={3} value={selectedSlide.imageSuggestion} onChange={(event) => updateSlide({ imageSuggestion: event.target.value })} />
                </label>
                <label>
                  <span>全局备注</span>
                  <TextArea rows={3} value={editor.notes} onChange={(event) => markDirty({ ...editor, notes: event.target.value })} />
                </label>
              </Space>
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="请选择或新增一页幻灯片" />
            )}
          </section>
        </div>
      </main>

      <aside className="ppt-preview-panel">
        <div className="ppt-preview-toolbar">
          <Space>
            <Button icon={<ZoomOutOutlined />} onClick={() => setZoom((value) => Math.max(58, value - 8))} />
            <Slider min={58} max={118} value={zoom} onChange={setZoom} className="ppt-zoom-slider" />
            <Button icon={<ZoomInOutlined />} onClick={() => setZoom((value) => Math.min(118, value + 8))} />
          </Space>
          <Space>
            <Button icon={<CompressOutlined />} type={fitMode ? 'primary' : 'default'} onClick={() => setFitMode((value) => !value)}>适配</Button>
            <Button icon={fullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />} onClick={() => setFullscreen((value) => !value)} />
          </Space>
        </div>

        <div className="ppt-preview-stage">
          {selectedSlide ? (
            <article className={`ppt-preview-slide is-${editor.background}`} style={{ transform: `scale(${fitMode ? 0.86 : zoom / 100})` }}>
              <div className="ppt-preview-brand">GeoAgent Solution Workspace</div>
              <Tag color="green">{selectedSlide.type}</Tag>
              <Typography.Title level={3}>{selectedSlide.title}</Typography.Title>
              <Typography.Text>{editor.subtitle}</Typography.Text>
              <ul>
                {selectedSlide.bullets.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
              </ul>
              <div className="ppt-preview-visual">
                <span />
                <span />
                <span />
              </div>
              <footer>{selectedSlide.imageSuggestion || 'GIS 场景图 / 架构图 / 数据图层预览'}</footer>
            </article>
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无可预览幻灯片" />
          )}
        </div>

        <div className="ppt-editor-savebar">
          <div>
            <strong>{dirty ? '有未保存修改' : '内容已同步'}</strong>
            <span>{currentRecord?.id ? `记录 ID：${currentRecord.id}` : '请先生成或选择 PPT 记录'}</span>
          </div>
          <Button type="primary" icon={<SaveOutlined />} loading={saveMutation.isPending} disabled={!currentRecord?.id} onClick={() => saveMutation.mutate()}>
            保存
          </Button>
        </div>
      </aside>
    </section>
  );
}
