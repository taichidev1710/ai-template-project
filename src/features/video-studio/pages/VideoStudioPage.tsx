import { useMemo, useState } from 'react';
import { App, Alert, Badge, Button, Modal, Space, Typography } from 'antd';
import { ThunderboltOutlined, StopOutlined, SettingOutlined, TeamOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { arrayMove } from '@dnd-kit/sortable';
import {
  PROVIDERS,
  buildRunPlan,
  characterKeysInText,
  checkAssets,
  sceneAssets,
  defaultRunConfig,
  estimateRunCost,
  getCapabilities,
  reparseScenes,
  type Asset,
  type AssetKind,
  type PlatformPreset,
  type RunConfig,
  type RunPlanWarningCode,
  type Scene,
} from '@/domain/video';
import { ConfigPanel } from '../components/ConfigPanel';
import { PromptEditor } from '../components/PromptEditor';
import { SceneList } from '../components/SceneList';
import { AssetPanel } from '../components/AssetPanel';
import { VideoGrid } from '../components/VideoGrid';
import { ProjectBar } from '../components/ProjectBar';
import { useVideoRun } from '../hooks/use-video-run';
import { useVideoProjects, useVideoProjectMutations } from '../hooks/use-video-projects';
import type { VideoProjectDto, VideoProjectInput } from '../api/video-projects-api';
import { formatUsd } from '../lib';
import { initialConfig, makeAsset, makeScene, newId } from '../types';

const WARNING_KEY: Record<RunPlanWarningCode, string> = {
  'delay-below-rpm': 'warning.delayBelowRpm',
  'exceeds-max-jobs': 'warning.exceedsMaxJobs',
  'aspect-unsupported': 'warning.aspectUnsupported',
  'aspect-needs-crop': 'warning.aspectNeedsCrop',
  'no-scenes': 'warning.noScenes',
  'no-jobs': 'warning.noJobs',
};

/** Re-number scenes 1..n after any insert/remove/reorder. */
const reindex = (scenes: Scene[]): Scene[] => scenes.map((s, i) => ({ ...s, order: i + 1 }));

/**
 * Normalise the draft into the server's persisted shape (spec §12.1): drops
 * runtime jobs and character image bytes. Used both to build the save payload and
 * to compute a stable snapshot for the dirty check.
 */
function toInput(
  name: string,
  sourcePrompt: string,
  config: RunConfig,
  scenes: Scene[],
  assets: Asset[],
): VideoProjectInput {
  return {
    name: name.trim(),
    sourcePrompt,
    runConfig: config,
    scenes: scenes.map((s) => ({
      id: s.id,
      order: s.order,
      text: s.text,
      ...(s.aspectOverride ? { aspectOverride: s.aspectOverride } : {}),
      ...(s.countOverride !== undefined ? { countOverride: s.countOverride } : {}),
      ...(s.assetIds && s.assetIds.length ? { assetIds: s.assetIds } : {}),
    })),
    // Persisted field name stays `characters`; items are assets of any kind.
    characters: assets.map((a) => ({
      id: a.id,
      kind: a.kind,
      key: a.key,
      displayName: a.displayName,
      color: a.color,
    })),
  };
}

/**
 * Video Studio — the P1 container (spec §13). It OWNS the working draft (prompt,
 * scenes, characters, config) as local state; the domain does the thinking
 * (parse, plan, cost, tag) and `useVideoRun` drives fake jobs. Server state
 * (Project ↔ MongoDB) is P2. This is a "special" feature, so it deviates from the
 * CRUD list/table shape on purpose (spec §13.5).
 */
export function VideoStudioPage() {
  const { t } = useTranslation('video-studio');
  const { modal, message } = App.useApp();

  const [config, setConfig] = useState<RunConfig>(initialConfig);
  const [sourcePrompt, setSourcePrompt] = useState('');
  const [useMarkers, setUseMarkers] = useState(false);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [preset, setPreset] = useState<PlatformPreset | null>(null);
  const [configOpen, setConfigOpen] = useState(false);
  const [charsOpen, setCharsOpen] = useState(false);

  // --- Project persistence (P2): MongoDB via backend, server state → Query ---
  const [projectName, setProjectName] = useState('');
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState<string>(() =>
    JSON.stringify(toInput('', '', initialConfig(), [], [])),
  );
  const projectsQuery = useVideoProjects({ limit: 100, sort: '-updatedAt' });
  const projectMutations = useVideoProjectMutations();

  const caps = getCapabilities(config.providerId);
  const assetKeys = assets.map((a) => a.key).filter(Boolean);
  const keySignature = assetKeys.join('|');

  // Scenes enriched with the asset keys detected in their text (derived, not
  // stored — recomputed whenever a scene's text or the roster changes).
  const viewScenes = useMemo(
    () => scenes.map((s) => ({ ...s, characterKeys: characterKeysInText(s.text, assetKeys) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scenes, keySignature],
  );

  // Usage per asset id = how many scenes reference it (via @key OR assignment).
  const usage = useMemo(() => {
    const u: Record<string, number> = {};
    for (const s of viewScenes) for (const a of sceneAssets(s, assets)) u[a.id] = (u[a.id] ?? 0) + 1;
    return u;
  }, [viewScenes, assets]);

  // assetId → scene ids it is assigned to (for the AssetPanel multi-select value).
  const assignedByAsset = useMemo(() => {
    const m: Record<string, string[]> = {};
    for (const s of scenes) for (const id of s.assetIds ?? []) (m[id] ??= []).push(s.id);
    return m;
  }, [scenes]);

  const issues = useMemo(() => checkAssets(assets, viewScenes), [assets, viewScenes]);

  const cost = useMemo(() => estimateRunCost(viewScenes, config), [viewScenes, config]);
  const plan = useMemo(() => buildRunPlan(viewScenes, config), [viewScenes, config]);

  const run = useVideoRun(viewScenes, config);

  /* ---- project persistence ---- */
  const currentInput = useMemo(
    () => toInput(projectName, sourcePrompt, config, scenes, assets),
    [projectName, sourcePrompt, config, scenes, assets],
  );
  const currentSnapshot = JSON.stringify(currentInput);
  const dirty = currentSnapshot !== savedSnapshot;
  const savingProject = projectMutations.create.isPending || projectMutations.update.isPending;

  const applyProject = (dto: VideoProjectDto) => {
    const loadedScenes: Scene[] = dto.scenes.map((s) => ({
      id: s.id,
      order: s.order,
      text: s.text,
      aspectOverride: s.aspectOverride,
      countOverride: s.countOverride,
      assetIds: s.assetIds ?? [],
      characterKeys: [],
      jobs: [],
    }));
    // Legacy projects saved before kinds default to `character`.
    const loadedAssets: Asset[] = dto.characters.map((c) => ({
      id: c.id,
      kind: c.kind ?? 'character',
      key: c.key,
      displayName: c.displayName,
      color: c.color,
      images: [],
    }));
    setProjectName(dto.name);
    setSourcePrompt(dto.sourcePrompt);
    setConfig(dto.runConfig);
    setScenes(loadedScenes);
    setAssets(loadedAssets);
    setCurrentProjectId(dto.id);
    setPreset(null);
    run.reset();
    setSavedSnapshot(JSON.stringify(toInput(dto.name, dto.sourcePrompt, dto.runConfig, loadedScenes, loadedAssets)));
  };

  const openProject = (id: string) => {
    const dto = projectsQuery.data?.items.find((p) => p.id === id);
    if (dto) applyProject(dto);
  };

  const saveProject = () => {
    if (!projectName.trim()) {
      message.warning(t('project.nameRequired'));
      return;
    }
    const snap = currentSnapshot;
    if (currentProjectId) {
      projectMutations.update.mutate(
        { id: currentProjectId, input: currentInput },
        { onSuccess: () => setSavedSnapshot(snap) },
      );
    } else {
      projectMutations.create.mutate(currentInput, {
        onSuccess: (dto) => {
          setCurrentProjectId(dto.id);
          setSavedSnapshot(snap);
        },
      });
    }
  };

  const newProject = () => {
    const doNew = () => {
      const cfg = initialConfig();
      setProjectName('');
      setSourcePrompt('');
      setScenes([]);
      setAssets([]);
      setConfig(cfg);
      setCurrentProjectId(null);
      setPreset(null);
      run.reset();
      setSavedSnapshot(JSON.stringify(toInput('', '', cfg, [], [])));
    };
    if (dirty) {
      modal.confirm({
        title: t('project.confirmNewTitle'),
        content: t('project.confirmNewBody'),
        okText: t('project.new'),
        onOk: doNew,
      });
    } else {
      doNew();
    }
  };

  /* ---- config ---- */
  const patchConfig = (patch: Partial<RunConfig>) => setConfig((c) => ({ ...c, ...patch }));
  const handleProviderChange = (providerId: string) => {
    setConfig(defaultRunConfig(providerId));
    setPreset(null);
  };

  /* ---- prompt / scenes ---- */
  const handleParse = () => {
    const { scenes: merged, droppedOverrides } = reparseScenes(scenes, sourcePrompt, { markers: useMarkers });
    const next = reindex(
      merged.map((s, i) =>
        'id' in s ? (s as Scene) : makeScene(i + 1, (s as { text: string }).text),
      ),
    );
    setScenes(next);
    if (droppedOverrides > 0) message.warning(t('scene.overridesDropped', { n: droppedOverrides }));
  };

  const patchScene = (id: string, patch: Partial<Scene>) =>
    setScenes((list) => list.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const addScene = () => setScenes((list) => reindex([...list, makeScene(list.length + 1)]));

  const duplicateScene = (id: string) =>
    setScenes((list) => {
      const idx = list.findIndex((s) => s.id === id);
      if (idx < 0) return list;
      const copy: Scene = { ...list[idx]!, id: newId('sc'), jobs: [] };
      return reindex([...list.slice(0, idx + 1), copy, ...list.slice(idx + 1)]);
    });

  const removeScene = (id: string) => setScenes((list) => reindex(list.filter((s) => s.id !== id)));

  const reorderScenes = (activeId: string, overId: string) =>
    setScenes((list) => {
      const from = list.findIndex((s) => s.id === activeId);
      const to = list.findIndex((s) => s.id === overId);
      if (from < 0 || to < 0) return list;
      return reindex(arrayMove(list, from, to));
    });

  /* ---- assets (characters / settings / styles) ---- */
  const addAsset = (kind: AssetKind) => setAssets((list) => [...list, makeAsset(kind, list.length)]);
  const patchAsset = (id: string, patch: Partial<Asset>) =>
    setAssets((list) => list.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  const removeAsset = (id: string) => {
    setAssets((list) => list.filter((a) => a.id !== id));
    // Drop the asset from any scene it was assigned to.
    setScenes((list) =>
      list.map((s) =>
        s.assetIds?.includes(id) ? { ...s, assetIds: s.assetIds.filter((x) => x !== id) } : s,
      ),
    );
  };
  /** Assign (or unassign) one asset across a set of scenes — writes scene.assetIds. */
  const assignAssetToScenes = (assetId: string, sceneIds: string[]) =>
    setScenes((list) =>
      list.map((s) => {
        const shouldHave = sceneIds.includes(s.id);
        const current = s.assetIds ?? [];
        const has = current.includes(assetId);
        if (shouldHave === has) return s;
        const next = shouldHave ? [...current, assetId] : current.filter((x) => x !== assetId);
        return { ...s, assetIds: next };
      }),
    );

  /* ---- run ---- */
  const copyPath = (path: string) => {
    void navigator.clipboard?.writeText(path);
    message.success(t('grid.pathCopied'));
  };

  const confirmRun = () => {
    if (plan.totalJobs === 0) return;
    modal.confirm({
      title: t('run.confirmTitle'),
      content: cost.exceedsCap
        ? t('run.confirmOverCap', { cap: formatUsd(cost.cap ?? 0) })
        : t('run.confirmCost', { n: plan.totalJobs, cost: cost.priced ? formatUsd(cost.total) : t('cost.unpriced') }),
      okText: t('grid.generate'),
      onOk: run.startAll,
    });
  };

  const generateLabel = `${t('run.generateN', { n: plan.totalJobs })}${
    cost.priced ? ` · ${t('run.estimateSuffix', { cost: formatUsd(cost.total) })}` : ''
  }`;

  const done = Object.values(run.jobs).filter((j) => j.status === 'success').length;
  const running = Object.values(run.jobs).filter((j) => j.status === 'processing').length;

  const aspectOptions = caps?.aspects ?? [];

  return (
    <div className="flex flex-col p-4 sm:p-6">
      {/* Header */}
      <div className="mb-4">
        <Typography.Title level={3} className="!mb-1">
          {t('title')}
        </Typography.Title>
        <Typography.Text type="secondary">{t('subtitle')}</Typography.Text>
      </div>

      <ProjectBar
        name={projectName}
        currentId={currentProjectId}
        dirty={dirty}
        saving={savingProject}
        loadingList={projectsQuery.isLoading}
        projects={(projectsQuery.data?.items ?? []).map((p) => ({ id: p.id, name: p.name }))}
        onNameChange={setProjectName}
        onSave={saveProject}
        onNew={newProject}
        onOpen={openProject}
      />

      {config.providerId === 'mock' && (
        <Alert type="info" showIcon className="mb-4" title={t('mockBanner')} />
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2 sm:gap-3">
        <Button icon={<SettingOutlined />} onClick={() => setConfigOpen(true)}>
          {t('config.title')}
        </Button>
        <Badge count={issues.length} size="small">
          <Button icon={<TeamOutlined />} onClick={() => setCharsOpen(true)}>
            {t('asset.title')} ({assets.length})
          </Button>
        </Badge>
        <Button
          type="primary"
          size="large"
          icon={<ThunderboltOutlined />}
          disabled={plan.totalJobs === 0}
          onClick={confirmRun}
        >
          {generateLabel}
        </Button>
        {run.isActive && (
          <>
            <Button icon={<StopOutlined />} danger onClick={run.cancelAll}>
              {t('run.cancelAll')}
            </Button>
            <Typography.Text type="secondary">
              {t('run.summary', { done, total: plan.totalJobs, running })}
            </Typography.Text>
          </>
        )}
      </div>

      {plan.warnings.length > 0 && (
        <Alert
          type="warning"
          showIcon
          className="mb-4"
          title={
            <Space orientation="vertical" size={0}>
              {plan.warnings.map((w, i) => (
                <Typography.Text key={`${w.code}-${i}`} className="text-xs">
                  {t(WARNING_KEY[w.code], w.meta)}
                </Typography.Text>
              ))}
            </Space>
          }
        />
      )}

      {/* Two columns: prompt/scenes (left) + preview (right, wider) */}
      <div className="flex flex-col gap-4 xl:min-h-0 xl:flex-row">
        <section className="flex min-w-0 flex-col gap-4 rounded-app bg-surface p-3 sm:p-4 xl:w-[40%] xl:shrink-0">
          <Typography.Title level={5} className="!mb-0">
            {t('prompt.title')}
          </Typography.Title>
          <PromptEditor
            value={sourcePrompt}
            useMarkers={useMarkers}
            sceneCount={viewScenes.length}
            onChange={setSourcePrompt}
            onMarkersChange={setUseMarkers}
            onParse={handleParse}
          />
          <div className="flex items-center justify-between">
            <Typography.Text strong>{t('scene.title')}</Typography.Text>
            <Button size="small" onClick={addScene}>
              {t('scene.add')}
            </Button>
          </div>
          <SceneList
            scenes={viewScenes}
            characters={assets}
            aspectOptions={aspectOptions}
            defaultAspect={config.aspect}
            defaultCount={config.count}
            onReorder={reorderScenes}
            onSceneChange={patchScene}
            onDuplicate={duplicateScene}
            onRemove={removeScene}
            onGenerate={run.runScene}
          />
        </section>

        <section className="min-w-0 flex-1 rounded-app bg-surface p-3 sm:p-4">
          <Typography.Title level={5} className="!mb-3">
            {t('grid.title')}
          </Typography.Title>
          <VideoGrid
            scenes={viewScenes}
            jobs={run.jobs}
            config={config}
            aspectOptions={aspectOptions}
            onGenerate={run.runScene}
            onRetry={run.retry}
            onCancel={run.cancel}
            onCopyPath={copyPath}
            onSceneChange={patchScene}
          />
        </section>
      </div>

      <Modal
        open={configOpen}
        onCancel={() => setConfigOpen(false)}
        footer={null}
        title={t('config.title')}
        width={440}
        styles={{ body: { maxHeight: '72vh', overflowY: 'auto' } }}
      >
        <ConfigPanel
          config={config}
          caps={caps}
          providers={PROVIDERS}
          preset={preset}
          onChange={patchConfig}
          onProviderChange={handleProviderChange}
          onPresetChange={setPreset}
        />
      </Modal>

      <Modal
        open={charsOpen}
        onCancel={() => setCharsOpen(false)}
        footer={null}
        title={t('asset.title')}
        width={600}
        styles={{ body: { maxHeight: '72vh', overflowY: 'auto' } }}
      >
        <AssetPanel
          assets={assets}
          usage={usage}
          issues={issues}
          scenes={viewScenes.map((s) => ({ id: s.id, order: s.order }))}
          assignedByAsset={assignedByAsset}
          onAdd={addAsset}
          onChange={patchAsset}
          onRemove={removeAsset}
          onAssignScenes={assignAssetToScenes}
        />
      </Modal>
    </div>
  );
}
