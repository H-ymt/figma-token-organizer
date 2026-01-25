export function findNodeById(id: string): BaseNode | null {
  return figma.getNodeById(id);
}

export function getSelectedNodes(): readonly SceneNode[] {
  return figma.currentPage.selection;
}

export function selectNodes(nodes: SceneNode[]): void {
  figma.currentPage.selection = nodes;
}
