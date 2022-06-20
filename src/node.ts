import { DynalistApi } from './index';
import { ExtendedDynalistDocument } from './document';
import { DynalistNode } from './types';

export class ExtendedDynalistNode implements DynalistNode {
  public id: string;
  private api: DynalistApi;
  private document: ExtendedDynalistDocument;

  //dynalist api properties
  public content: string = '';
  public note: string = '';
  public created: number = -1;
  public modified: number = -1;
  public children: string[] = [];
  public checked?: boolean = false;
  public checkbox?: boolean;
  public color?: number;
  public heading?: number;
  public collapsed?: boolean;

  constructor(id: string, document: ExtendedDynalistDocument, api: DynalistApi) {
    this.id = id;
    this.api = api;
    this.document = document;
    this.readDataFromDocument();
  }

  public clearData() {
    this.content = '';
    this.note = '';
    this.created = -1;
    this.modified = -1;
    this.children = [];
    this.checked = undefined;
    this.checkbox = undefined;
    this.color = undefined;
    this.heading = undefined;
    this.collapsed = undefined;
  }

  public async loadCurrentData() {
    await this.document.loadCurrentData();
    this.readDataFromDocument();
  }

  public fillDataFromDynalistNode(dynalistNode: DynalistNode) {
    this.content = dynalistNode.content;
    this.note = dynalistNode.note;
    this.created = dynalistNode.created;
    this.modified = dynalistNode.modified;
    this.children = dynalistNode.children;
    this.checked = dynalistNode.checked;
    this.checkbox = dynalistNode.checkbox;
    this.color = dynalistNode.color;
    this.heading = dynalistNode.heading;
    this.collapsed = dynalistNode.collapsed;
  }

  private readDataFromDocument() {
    const dynalistNode = this.document.nodes.find((n) => n.id === this.id);
    if (!dynalistNode) {
      //   throw Error(
      //     `Node ${this.id} does not exist on the document, the document may need to be reloaded or the node could have been deleted`
      //   );
      this.clearData();
      return;
    }
    this.fillDataFromDynalistNode(dynalistNode);
  }

  public async delete() {
    await this.document.deleteNode(this);
    this.clearData();
  }

  public async moveChildrenTo(node: ExtendedDynalistNode) {
    const subtrees = this.api.getSubTreesOrNull(this, this.document.nodes);
    if (subtrees) {
      await this.api.copySubTrees(subtrees.children, node.id, node.document.id, true);
      await this.api.deleteNodes(this.document.id, subtrees.children || []);
    }
  }

  public async moveNodeUnder(node: ExtendedDynalistNode): Promise<void> {
    if(this.document.id === node.document.id){
      await this.api.moveNodes([node], this.document.id, this.id);
      return;
    }
    const subtrees = await this.api.getSubTreesOrNull(this, this.document.nodes) as any;
    if (subtrees) {
      await this.api.copySubTrees([subtrees], node.id, node.document.id, true);
      await this.api.deleteNodes(this.document.id, [subtrees]);
    }
    return;
  }

  public async copyChildrenTo(node: ExtendedDynalistNode) {
    const subtrees = await this.api.getSubTreesOrNull(this, this.document.nodes) as any;
    if (subtrees) {
      await this.api.copySubTrees(subtrees.children, node.id, node.document.id, true);
    }
  }

  public async copyNodeUnder(node: ExtendedDynalistNode) {
    const subtrees = await this.api.getSubTreesOrNull(this, this.document.nodes) as any;
    if (subtrees) {
      await this.api.copySubTrees([subtrees], node.id, node.document.id, true);
    }
  }

  public async createChild(content: string, index = 0) {
    const result = await this.api.createNewEntry(this.document.id, this.id, content, index);
    var newIds = result.new_node_ids || [];
    await this.loadCurrentData(); //refresh
    const newDynalistNode = this.document.nodes.find((n) => newIds.includes(n.id)) as DynalistNode;
    const newNode = new ExtendedDynalistNode(newDynalistNode.id, this.document, this.api);
    newNode.fillDataFromDynalistNode(newDynalistNode);
    return newNode;
  }
}
