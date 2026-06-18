import type { ProjectsPersistedState } from '../types/kanban';
import type { KanbanStore } from '../store/kanbanStore';
import { buildWorkspaceSnapshot } from '../store/kanbanStore';
import type { ShareScope } from './types';

export function resolveShareProjectIds(state: KanbanStore, scope: ShareScope): string[] {
  if (scope.mode === 'all') {
    return state.projectOrder.filter((id) => state.projects[id]);
  }

  if (scope.mode === 'current') {
    const id = scope.projectIds[0] ?? state.activeProjectId;
    return state.projects[id] ? [id] : [];
  }

  return scope.projectIds.filter((id) => state.projects[id]);
}

export function buildWorkspaceSnapshotForShare(
  state: KanbanStore,
  scope: ShareScope,
): ProjectsPersistedState {
  const full = buildWorkspaceSnapshot(state);
  let ids = resolveShareProjectIds(state, scope);

  if (ids.length === 0 && state.projects[state.activeProjectId]) {
    ids = [state.activeProjectId];
  }

  const projects: ProjectsPersistedState['projects'] = {};
  for (const id of ids) {
    const project = full.projects[id];
    if (project) projects[id] = project;
  }

  const projectOrder = full.projectOrder.filter((id) => projects[id]);
  for (const id of ids) {
    if (projects[id] && !projectOrder.includes(id)) {
      projectOrder.push(id);
    }
  }

  const activeProjectId = projects[state.activeProjectId]
    ? state.activeProjectId
    : projectOrder[0];

  return {
    version: 2,
    activeProjectId,
    projectOrder,
    projects,
  };
}

export function describeShareScope(state: KanbanStore, scope: ShareScope): string {
  const ids = resolveShareProjectIds(state, scope);

  if (scope.mode === 'all') {
    const count = state.projectOrder.filter((id) => state.projects[id]).length;
    return count === 1 ? '1 board (all)' : `${count} boards (all)`;
  }

  if (scope.mode === 'current') {
    const id = ids[0];
    const name = id ? state.projects[id]?.name : undefined;
    return name ? `"${name}" only` : '1 board';
  }

  if (ids.length === 1) {
    return `"${state.projects[ids[0]]?.name ?? 'Board'}"`;
  }

  return `${ids.length} boards`;
}

export function defaultShareScope(state: KanbanStore): ShareScope {
  return {
    mode: 'all',
    projectIds: state.projectOrder.filter((id) => state.projects[id]),
  };
}
