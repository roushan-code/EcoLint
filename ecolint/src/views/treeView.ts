import { TreeItem, TreeDataProvider, EventEmitter, TreeItemCollapsibleState } from 'vscode';

export interface TreeNode {
  label: string;
  description?: string;
  children?: TreeNode[];
}

class TreeDataProviderImpl implements TreeDataProvider<TreeNode> {
  private readonly _onDidChangeTreeData = new EventEmitter<TreeNode | undefined>();
  public readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private data: TreeNode[] = [];

  constructor() {}

  public getTreeItem(element: TreeNode): TreeItem {
    const item = new TreeItem(element.label);
    item.description = element.description;
    item.collapsibleState = element.children?.length
      ? TreeItemCollapsibleState.Expanded
      : TreeItemCollapsibleState.None;
    return item;
  }

  public getChildren(element?: TreeNode): TreeNode[] {
    if (!element) {
      return this.data;
    }
    return element.children || [];
  }

  public setData(data: TreeNode[]): void {
    this.data = data;
    this._onDidChangeTreeData.fire(undefined);
  }
}

let provider: TreeDataProviderImpl | undefined;

export function registerTreeView(): TreeDataProviderImpl {
  if (!provider) {
    provider = new TreeDataProviderImpl();
  }
  return provider;
}

export function updateTreeView(data: TreeNode[]): void {
  if (provider) {
    provider.setData(data);
  }
}