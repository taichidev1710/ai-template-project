import { useEffect, useMemo, useRef, useState } from 'react';
import { App, Badge, Button, Result, Skeleton, Space, Tabs, Tag, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import {
  buildAdjacency,
  edgeWouldViolate,
  effectiveRules,
  generateSample,
  isBaseRelation,
  validate,
  type DiagramEdge,
  type DiagramNode,
  type DiagramVisibility,
  type Violation,
} from '@/domain/diagram';
import { useAllDiagramTypes } from '@/features/diagram-types';
import { paths } from '@/app/router/paths';
import { DiagramCanvas, type DiagramCanvasHandle } from '../components/DiagramCanvas';
import { CanvasToolbar } from '../components/CanvasToolbar';
import { VisibilityPanel } from '../components/VisibilityPanel';
import { ViolationsPanel } from '../components/ViolationsPanel';
import { NodeFormModal, type NodeFormValues } from '../components/NodeFormModal';
import { EdgeFormModal, type EdgeFormValues, type EdgePair } from '../components/EdgeFormModal';
import { EdgeDetailModal, type EdgeDetailValues } from '../components/EdgeDetailModal';
import { useDiagram, useDiagramContentMutation } from '../hooks/use-diagrams';
import type { DiagramContentInput } from '../types';

/** Mock-only id generator; the real backend will own ids. */
const newId = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 8)}`;

/**
 * The canvas editor. The saved diagram comes from Query; the working copy lives
 * in local state (a draft) so drawing never round-trips to the API. Rules are
 * evaluated live against the draft, and illegal links are blocked before they
 * are drawn rather than reported afterwards.
 */
export function DiagramEditorPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { modal, message } = App.useApp();

  const { data: diagram, isLoading, isError } = useDiagram(id);
  const { data: types } = useAllDiagramTypes();
  const save = useDiagramContentMutation(id);

  const canvasRef = useRef<DiagramCanvasHandle>(null);

  const [draft, setDraft] = useState<DiagramContentInput | null>(null);
  const [dirty, setDirty] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addBlockTypeId, setAddBlockTypeId] = useState<string>();
  const [linking, setLinking] = useState(false);
  const [linkSourceId, setLinkSourceId] = useState<string | null>(null);
  const [pendingPair, setPendingPair] = useState<EdgePair | null>(null);
  const [editingNode, setEditingNode] = useState<DiagramNode | null>(null);
  const [editingEdge, setEditingEdge] = useState<DiagramEdge | null>(null);
  const [fitSignal, setFitSignal] = useState(0);

  const type = types?.find((t) => t.id === diagram?.templateId);
  const blockTypes = useMemo(() => type?.blockTypes ?? [], [type]);
  const relations = useMemo(() => type?.relations ?? [], [type]);

  // Seed the draft once per diagram. Keyed on the id, NOT the object, so a
  // background refetch can't wipe unsaved work mid-edit.
  useEffect(() => {
    if (!diagram) return;
    setDraft({
      nodes: structuredClone(diagram.nodes),
      edges: structuredClone(diagram.edges),
      visibility: structuredClone(diagram.visibility),
      localRules: structuredClone(diagram.localRules),
    });
    setDirty(false);
    setSelectedId(null);
    setLinkSourceId(null);
    setLinking(false);
    // A diagram that arrives WITH content was laid out elsewhere (saved earlier,
    // or seeded with sample data), so the default viewport frames none of it —
    // it opens showing a corner. Blocks added by hand land at the viewport
    // centre instead, so an empty canvas needs no fit.
    if (diagram.nodes.length > 0) setFitSignal((t) => t + 1);
  }, [diagram?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!addBlockTypeId && blockTypes[0]) setAddBlockTypeId(blockTypes[0].id);
  }, [blockTypes, addBlockTypeId]);


  /** The draft as a full Diagram — what the pure engine functions expect. */
  const workingDiagram = useMemo(() => (diagram && draft ? { ...diagram, ...draft } : null), [diagram, draft]);

  const rules = useMemo(
    () => (workingDiagram && type ? effectiveRules(workingDiagram, type.ruleSets) : []),
    [workingDiagram, type],
  );

  const violations = useMemo(
    // `relations` is what lets a forbid rule resolve the relation it names.
    () => (workingDiagram ? validate(workingDiagram, rules, relations) : []),
    [workingDiagram, rules, relations],
  );

  const primaryRelation = relations.find((r) => isBaseRelation(r) && r.role === 'primary');

  /** A node can be folded only if it actually has children on the primary relation. */
  const canCollapse = useMemo(() => {
    if (!workingDiagram || !primaryRelation || !selectedId) return false;
    if (!workingDiagram.nodes.some((n) => n.id === selectedId)) return false;
    const adj = buildAdjacency(workingDiagram.nodes, workingDiagram.edges, primaryRelation.id);
    return (adj.children.get(selectedId) ?? []).length > 0;
  }, [workingDiagram, primaryRelation, selectedId]);

  const patch = (next: Partial<DiagramContentInput>) => {
    setDraft((d) => (d ? { ...d, ...next } : d));
    setDirty(true);
  };

  const handleAddNode = () => {
    if (!draft || !addBlockTypeId) return;
    const blockType = blockTypes.find((b) => b.id === addBlockTypeId);
    const centre = canvasRef.current?.viewportCenter() ?? { x: 0, y: 0 };
    // Lay new nodes on a golden-angle spiral around the viewport centre: random
    // scatter overlapped, since nodes are 54px wide and the jitter was smaller.
    const n = draft.nodes.length;
    const angle = n * 2.39996; // golden angle in radians — never repeats a spoke
    const radius = 90 + 16 * n;
    const node: DiagramNode = {
      id: newId('n'),
      blockTypeId: addBlockTypeId,
      label: blockType?.name ?? 'Khối mới',
      pos: {
        x: centre.x + Math.round(Math.cos(angle) * radius),
        y: centre.y + Math.round(Math.sin(angle) * radius),
      },
    };
    patch({ nodes: [...draft.nodes, node] });
    setEditingNode(node);
  };

  const labelOf = (nodeId: string) => draft?.nodes.find((n) => n.id === nodeId)?.label ?? nodeId;

  const handleNodeTap = (nodeId: string) => {
    setSelectedId(nodeId);
    if (!linking || !draft) return;

    if (!linkSourceId) {
      setLinkSourceId(nodeId);
      return;
    }
    if (linkSourceId === nodeId) {
      setLinkSourceId(null); // tapping the source again cancels
      return;
    }
    // Source + target chosen — the relation itself is picked in the modal.
    setPendingPair({
      source: linkSourceId,
      target: nodeId,
      sourceLabel: labelOf(linkSourceId),
      targetLabel: labelOf(nodeId),
    });
  };

  /**
   * Why `relationId` may not join the pending pair.
   *
   * The duplicate check used to live here and compared source→target only, so
   * the reverse of a two-way link sailed straight past it and the pair ended up
   * wearing the same relation twice. `edgeWouldViolate` owns it now — down in
   * the engine, where the catalog says which relations have a direction at all.
   */
  const relationBlockedFor = (relationId: string): string | null => {
    if (!pendingPair || !workingDiagram) return null;
    return edgeWouldViolate(
      workingDiagram,
      rules,
      { relationId, source: pendingPair.source, target: pendingPair.target },
      relations,
    );
  };

  /** What the pending pair already are to each other — stated, never judged. */
  const existingLinks = useMemo(() => {
    if (!pendingPair || !draft) return [];
    const { source, target } = pendingPair;
    return draft.edges
      .filter((e) => (e.source === source && e.target === target) || (e.source === target && e.target === source))
      .map((e) => relations.find((r) => r.id === e.relationId)?.name ?? e.relationId);
  }, [pendingPair, draft, relations]);

  const handleEdgeSubmit = (values: EdgeFormValues) => {
    if (!draft || !pendingPair) return;
    const edge: DiagramEdge = {
      id: newId('e'),
      relationId: values.relationId,
      source: pendingPair.source,
      target: pendingPair.target,
      ...(values.label?.trim() ? { label: values.label.trim() } : {}),
    };
    patch({ edges: [...draft.edges, edge] });
    closeLinking();
  };

  /** Leave link mode entirely — used after a link, a cancel, or a background tap. */
  const closeLinking = () => {
    setPendingPair(null);
    setLinkSourceId(null);
    setLinking(false);
  };

  const handleDeleteSelected = () => {
    if (!draft || !selectedId) return;
    const node = draft.nodes.find((n) => n.id === selectedId);
    if (node) {
      const orphaned = draft.edges.filter((e) => e.source === node.id || e.target === node.id).length;
      modal.confirm({
        title: `Xoá khối “${node.label}”?`,
        content: orphaned > 0 ? `${orphaned} liên kết của khối này cũng bị xoá.` : undefined,
        okText: 'Xoá',
        okButtonProps: { danger: true },
        cancelText: 'Huỷ',
        onOk: () => {
          patch({
            nodes: draft.nodes.filter((n) => n.id !== node.id),
            edges: draft.edges.filter((e) => e.source !== node.id && e.target !== node.id),
          });
          setSelectedId(null);
        },
      });
      return;
    }
    patch({ edges: draft.edges.filter((e) => e.id !== selectedId) });
    setSelectedId(null);
  };

  const handleToggleCollapse = () => {
    if (!draft || !selectedId) return;
    const collapsed = draft.visibility.collapsed.includes(selectedId)
      ? draft.visibility.collapsed.filter((c) => c !== selectedId)
      : [...draft.visibility.collapsed, selectedId];
    patch({ visibility: { ...draft.visibility, collapsed } });
  };

  const handleVisibilityChange = (v: Partial<DiagramVisibility>) => {
    if (!draft) return;
    patch({ visibility: { ...draft.visibility, ...v } });
  };

  const handleEdgeDetailSubmit = (values: EdgeDetailValues) => {
    if (!draft || !editingEdge) return;
    const label = values.label?.trim();
    patch({
      edges: draft.edges.map((e) => {
        if (e.id !== editingEdge.id) return e;
        const next: DiagramEdge = { ...e };
        if (label) next.label = label;
        else delete next.label;
        // `inherit` must REMOVE the key, not store false — false would pin the
        // edge off and stop it following the relation.
        if (values.animated === 'inherit') delete next.animated;
        else next.animated = values.animated === 'on';
        return next;
      }),
    });
    setEditingEdge(null);
  };

  const handleDeleteEdge = () => {
    if (!draft || !editingEdge) return;
    patch({ edges: draft.edges.filter((e) => e.id !== editingEdge.id) });
    setEditingEdge(null);
    setSelectedId(null);
  };

  const handleNodeSubmit = (values: NodeFormValues) => {
    if (!draft || !editingNode) return;
    patch({
      nodes: draft.nodes.map((n) => (n.id === editingNode.id ? { ...n, ...values } : n)),
    });
    setEditingNode(null);
  };

  /** Save the open node, then arm link mode with it already chosen as source. */
  const handleNodeLink = (values: NodeFormValues) => {
    if (!editingNode) return;
    handleNodeSubmit(values);
    setLinking(true);
    setLinkSourceId(editingNode.id);
    setSelectedId(editingNode.id);
  };

  /**
   * Add a child of the open node, joined by the PRIMARY relation — that is what
   * "con" means here (DESIGN §4: primary is the structural backbone).
   *
   * The child's block type is not guessed: each type is probed with the SAME
   * guard the canvas uses, and the first the rules accept wins. On an org chart
   * that turns "Thêm con" on a Phòng ban into a Quản lý, because `chain` allows
   * nothing else — no org-specific code anywhere.
   */
  const handleAddChild = (values: NodeFormValues) => {
    if (!draft || !editingNode || !workingDiagram || !primaryRelation) return;
    const parent = editingNode;
    handleNodeSubmit(values);

    const child: DiagramNode = {
      id: newId('n'),
      blockTypeId: blockTypes[0]?.id ?? parent.blockTypeId,
      label: 'Khối mới',
      pos: { x: parent.pos.x, y: parent.pos.y + 150 },
    };
    // Probe on a copy: `edgeWouldViolate` needs both endpoints to really exist.
    const probeBase = { ...workingDiagram, nodes: [...draft.nodes, child] };
    const legalType = blockTypes.find(
      (bt) =>
        !edgeWouldViolate(
          { ...probeBase, nodes: probeBase.nodes.map((n) => (n.id === child.id ? { ...n, blockTypeId: bt.id } : n)) },
          rules,
          { relationId: primaryRelation.id, source: parent.id, target: child.id },
          relations,
        ),
    );
    if (!legalType) {
      message.warning(`Luật đang áp không cho “${parent.label}” có thêm khối con nào theo quan hệ chính.`);
      return;
    }
    child.blockTypeId = legalType.id;
    child.label = legalType.name;

    patch({
      nodes: [...draft.nodes, child],
      edges: [...draft.edges, { id: newId('e'), relationId: primaryRelation.id, source: parent.id, target: child.id }],
    });
    setSelectedId(child.id);
    setEditingNode(child); // straight into naming it
  };

  /**
   * Fill the canvas with generated data obeying the rule sets this diagram
   * applies — enough blocks, links and depth to exercise every feature at once.
   * It lands in the draft like any other edit, so it is undone by leaving
   * without saving.
   */
  const handleFillSample = () => {
    if (!draft || !type || !diagram) return;
    const fill = () => {
      const { nodes, edges } = generateSample(type, diagram.ruleSetIds);
      patch({
        nodes,
        edges,
        // `collapsed` holds node ids and every old node is going away.
        visibility: { ...draft.visibility, collapsed: [] },
      });
      setSelectedId(null);
      closeLinking();
      setFitSignal((t) => t + 1); // the sample is laid out around the origin, not the current view
    };

    if (draft.nodes.length === 0) {
      fill();
      return;
    }
    modal.confirm({
      title: 'Thay bằng dữ liệu mẫu?',
      content: `${draft.nodes.length} khối và ${draft.edges.length} liên kết đang có sẽ bị thay hết. Chưa bấm Lưu thì bản đã lưu vẫn còn nguyên.`,
      okText: 'Thay',
      okButtonProps: { danger: true },
      cancelText: 'Huỷ',
      onOk: fill,
    });
  };

  const handleSave = () => {
    if (!draft) return;
    save.mutate(draft, { onSuccess: () => setDirty(false) });
  };

  const handleViolationSelect = (v: Violation) => {
    setSelectedId(v.id);
    canvasRef.current?.focus(v.id);
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6">
        <Skeleton active paragraph={{ rows: 6 }} />
      </div>
    );
  }

  if (isError || !diagram) {
    return (
      <Result
        status="404"
        title="Không tìm thấy sơ đồ"
        extra={
          <Button type="primary" onClick={() => navigate(paths.diagrams)}>
            Về danh sách
          </Button>
        }
      />
    );
  }

  if (!type) {
    return (
      <Result
        status="warning"
        title="Loại sơ đồ của sơ đồ này đã bị xoá"
        subTitle="Sơ đồ mượn vốn từ vựng (khối, quan hệ, bộ luật) từ loại của nó, nên không thể mở canvas khi loại không còn."
        extra={
          <Button type="primary" onClick={() => navigate(paths.diagrams)}>
            Về danh sách
          </Button>
        }
      />
    );
  }

  if (!draft || !workingDiagram) return null;

  return (
    // Height is only pinned from `lg` up, where the canvas and the side panel
    // sit side by side and each owns a full-height column. Below that they stack,
    // and pinning the height would squeeze the canvas column to nothing while its
    // min-height pushed the canvas out over the panel. Stacked = page scrolls.
    <div className="flex flex-col p-4 sm:p-6 lg:h-full">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Space wrap>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(paths.diagrams)}>
            Danh sách
          </Button>
          <Typography.Title level={3} className="!mb-0">
            {diagram.name}
          </Typography.Title>
          <Tag>
            {type.icon ?? '📊'} {type.name}
          </Tag>
          {dirty && <Tag color="orange">Chưa lưu</Tag>}
        </Space>
      </div>

      <div className="flex flex-col gap-4 lg:min-h-0 lg:flex-1 lg:flex-row">
        <div className="flex flex-col rounded-app bg-surface p-4 lg:min-h-0 lg:flex-1">
          <CanvasToolbar
            blockTypes={blockTypes}
            nodes={draft.nodes}
            addBlockTypeId={addBlockTypeId}
            linking={linking}
            linkSourceId={linkSourceId}
            selectedId={selectedId}
            canCollapse={canCollapse}
            isCollapsed={Boolean(selectedId && draft.visibility.collapsed.includes(selectedId))}
            dirty={dirty}
            saving={save.isPending}
            onAddBlockTypeChange={setAddBlockTypeId}
            onToggleLinking={() => {
              if (linking) closeLinking();
              else setLinking(true);
            }}
            onAddNode={handleAddNode}
            onDeleteSelected={handleDeleteSelected}
            onToggleCollapse={handleToggleCollapse}
            onFindNode={(nodeId) => {
              setSelectedId(nodeId);
              canvasRef.current?.focus(nodeId);
            }}
            onFit={() => canvasRef.current?.fit()}
            onSave={handleSave}
            onFillSample={handleFillSample}
          />
          {/* Stacked: a fixed slice of the viewport. Side by side: fill the column. */}
          <div className="h-[55vh] min-h-[300px] lg:h-auto lg:min-h-0 lg:flex-1">
            <DiagramCanvas
              ref={canvasRef}
              diagram={workingDiagram}
              blockTypes={blockTypes}
              relations={relations}
              violations={violations}
              linkSourceId={linkSourceId}
              fitSignal={fitSignal}
              onNodeMove={(nodeId, pos) =>
                patch({ nodes: draft.nodes.map((n) => (n.id === nodeId ? { ...n, pos } : n)) })
              }
              onNodeTap={handleNodeTap}
              onNodeDoubleTap={(nodeId) => setEditingNode(draft.nodes.find((n) => n.id === nodeId) ?? null)}
              onEdgeTap={(edgeId) => {
                setSelectedId(edgeId);
                setEditingEdge(draft.edges.find((e) => e.id === edgeId) ?? null);
              }}
              onBackgroundTap={() => {
                setSelectedId(null);
                // Tapping the background cancels link mode, as in the demo.
                if (linking) closeLinking();
              }}
            />
          </div>
        </div>

        {/* Side by side: fixed width, scrolls on its own so a long relation list
            never stretches the row past the viewport. */}
        <div className="w-full rounded-app bg-surface p-4 lg:w-80 lg:shrink-0 lg:overflow-auto">
          <Tabs
            items={[
              {
                key: 'visibility',
                label: 'Hiển thị',
                children: (
                  <VisibilityPanel
                    blockTypes={blockTypes}
                    relations={relations}
                    visibility={draft.visibility}
                    onChange={handleVisibilityChange}
                  />
                ),
              },
              {
                key: 'violations',
                label: (
                  <Badge count={violations.length} size="small" offset={[8, -2]}>
                    Vi phạm
                  </Badge>
                ),
                children: (
                  <ViolationsPanel
                    violations={violations}
                    hasRules={rules.length > 0}
                    onSelect={handleViolationSelect}
                  />
                ),
              },
            ]}
          />
        </div>
      </div>

      <NodeFormModal
        open={Boolean(editingNode)}
        node={editingNode}
        blockTypes={blockTypes}
        addChildBlocked={
          primaryRelation ? null : 'Loại sơ đồ này chưa có quan hệ chính nên chưa xác định được “con” là gì.'
        }
        onLink={handleNodeLink}
        onAddChild={handleAddChild}
        onSubmit={handleNodeSubmit}
        onCancel={() => setEditingNode(null)}
      />

      <EdgeFormModal
        open={Boolean(pendingPair)}
        pair={pendingPair}
        relations={relations}
        blockedByRule={relationBlockedFor}
        existingLinks={existingLinks}
        onSubmit={handleEdgeSubmit}
        onCancel={closeLinking}
      />

      <EdgeDetailModal
        open={Boolean(editingEdge)}
        edge={editingEdge}
        relation={relations.find((r) => r.id === editingEdge?.relationId)}
        sourceLabel={editingEdge ? labelOf(editingEdge.source) : ''}
        targetLabel={editingEdge ? labelOf(editingEdge.target) : ''}
        onSubmit={handleEdgeDetailSubmit}
        onDelete={handleDeleteEdge}
        onCancel={() => setEditingEdge(null)}
      />
    </div>
  );
}
