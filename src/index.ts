import request from 'request';
import {
  DocumentUpdateResponse,
  SendToInboxParameters,
  DynalistDocument,
  DynalistNode,
  DocumentLevelChangeParameters,
  DynalistNodeTree,
  CheckForUpdatesResponse,
  UploadFileResponse,
  FileListResponse,
  GetPreferenceResponse,
  FileLevelChangeParameters,
  FileUpdateResponse,
  NodeCreationOptions,
} from './types';
import { ExtendedDynalistDocument } from './document';
import { ExtendedDynalistNode } from './node';

export class DynalistApi {
  constructor(public dynalistApiKey: string, public requestDelay: number = 1000) {}

  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public async getPostResponse(url: string, json: object) {
    await this.delay(this.requestDelay); //rate limited on requests (one every second);

    return new Promise((resolve, reject) => {
      request.post(
        {
          url: url,
          json: json,
        },
        (error: any, res: any, body: any) => {
          if (!error && res.statusCode == 200) {
            // Check for application-level errors from Dynalist (e.g. _code: "InvalidToken")
            if (body && body._code && body._code !== 'Ok') {
              reject(new Error(`Dynalist API Error: ${body._code} - ${body._msg}`));
            } else {
              resolve(body);
            }
          } else {
            reject(error || new Error(`HTTP Error: ${res ? res.statusCode : 'Unknown'}`));
          }
        }
      );
    });
  }

  public async updateFile(changes: FileLevelChangeParameters[]): Promise<FileUpdateResponse> {
    return (await this.getPostResponse('https://dynalist.io/api/v1/file/edit', {
      token: this.dynalistApiKey,
      changes: changes,
    })) as FileUpdateResponse;
  }

  public async createFile(
    parentId: string,
    type: 'document' | 'folder',
    title: string,
    index = 0
  ) {
    return await this.updateFile([
      {
        action: 'create',
        type: type,
        parent_id: parentId,
        index: index,
        title: title,
      },
    ]);
  }

  public async editFile(fileId: string, type: 'document' | 'folder', title: string) {
    return await this.updateFile([
      {
        action: 'edit',
        type: type,
        file_id: fileId,
        title: title,
      },
    ]);
  }

  public async moveFile(
    fileId: string,
    type: 'document' | 'folder',
    parentId: string,
    index: number
  ) {
    return await this.updateFile([
      {
        action: 'move',
        type: type,
        file_id: fileId,
        parent_id: parentId,
        index: index,
      },
    ]);
  }

  public async updateDocument(
    documentId: string,
    changes: DocumentLevelChangeParameters[]
  ): Promise<DocumentUpdateResponse> {
    return (await this.getPostResponse('https://dynalist.io/api/v1/doc/edit', {
      token: this.dynalistApiKey,
      file_id: documentId,
      changes: changes,
    })) as DocumentUpdateResponse;
  }

  public async getDynalistDocument(id: string) {
    const document = await this.getPostResponse('https://dynalist.io/api/v1/doc/read', {
      token: this.dynalistApiKey,
      file_id: id,
    });
    return document as DynalistDocument;
  }

  public getSubTreesOrNull(item: DynalistNode, nodes: DynalistNode[], includeItemTest = (_: DynalistNode) => true) {
    const subTrees: DynalistNodeTree[] = [];
    if (item.children) {
      const childrenItems = nodes.filter((node) => item.children.includes(node.id));
      childrenItems.forEach((childItem) => {
        const childAsSubtrees = this.getSubTreesOrNull(childItem, nodes);
        if (childAsSubtrees != null) {
          subTrees.push(childAsSubtrees);
        }
      });
    }
    if (includeItemTest(item) || subTrees.length) {
      return {
        id: item.id,
        content: item.content,
        checked: item.checked || false,
        children: subTrees,
      } as DynalistNodeTree;
    }
    return null;
  }

  public getCheckedItemsSubTreesOrNull(item: DynalistNode, nodes: DynalistNode[], ancestorChecked = false) {
    const subTrees: DynalistNodeTree[] = [];
    const isItemChecked = item.checked || false;
    if (item.children) {
      const childrenItems = nodes.filter((node: DynalistNode) => item.children.includes(node.id));
      childrenItems.forEach((childItem: any) => {
        const childAsSubtrees = this.getCheckedItemsSubTreesOrNull(childItem, nodes, isItemChecked || ancestorChecked);
        if (childAsSubtrees != null) {
          subTrees.push(childAsSubtrees);
        }
      });
    }
    if (isItemChecked || ancestorChecked || subTrees.length) {
      return {
        id: item.id,
        content: item.content,
        checked: isItemChecked,
        children: subTrees,
      } as DynalistNodeTree;
    }
    return null;
  }

  public async deleteNodes(documentId: string, nodes: (DynalistNode | DynalistNodeTree)[]) {
    const toDeleteChanges = nodes.map((node) => {
      return {
        action: 'delete',
        node_id: node.id,
      };
    });
    await this.updateDocument(documentId, toDeleteChanges);
  }

  public async getNodeByHashTag(documentId: string, hashTag: string) {
    const document = (await this.getDocument(documentId)) as any;
    const nodes = document.nodes;
    return nodes.find((node: any) => node.content.includes(hashTag));
  }

  public async copySubTrees(subTrees: DynalistNodeTree[], parentId: string, documentId: string, includeChecked: boolean) {
    if (!subTrees || !subTrees.length) {
      return [];
    }
    var copiedIds: string[] = [];
    var changes: DocumentLevelChangeParameters[] = [];
    subTrees.forEach((item, i) => {
      var change = {
        action: 'insert',
        parent_id: parentId,
        index: i,
        content: item.content,
      } as any;
      if (includeChecked) {
        change = {
          ...change,
          checkbox: true,
          checked: item.checked || false,
        };
      }
      changes.push(change);
      copiedIds.push(item.id);
      if (item.id === undefined) {
        console.log(item);
      }
    });
    var result = (await this.updateDocument(documentId, changes)) as any;
    var newIds = result.new_node_ids || [];
    //Assumption is that everything is in the same order as what they were passed in as
    //If not it's really annoying
    for (var i = 0; i < subTrees.length; i++) {
      const copiedChildIds = await this.copySubTrees(subTrees[i].children || [], newIds[i], documentId, includeChecked);
      copiedIds = copiedIds.concat(copiedChildIds);
    }
    return copiedIds;
  }

  public async moveNodesToDifferentDocument(
    nodes: DynalistNode[],
    sourceDocumentId: string,
    destinationDocumentId: string,
    toMoveUnderNodeId = 'root',
    includeChecked = true
  ) {
    const insertChanges: any[] = [];
    const deleteChanges: any[] = [];
    var positionIndex = 0;
    nodes.forEach((node) => {
      let insertChange = {
        action: 'insert',
        parent_id: toMoveUnderNodeId || 'root',
        index: positionIndex,
        content: node.content,
        note: node.note,
        heading: node.heading,
        color: node.color,
      } as any;
      if (includeChecked) {
        insertChange = {
          ...insertChange,
          checkbox: true,
          checked: node.checked || false,
        };
      }
      insertChanges.push(insertChange);
      const deleteChange = {
        action: 'delete',
        node_id: node.id,
      };
      deleteChanges.push(deleteChange);
      positionIndex = positionIndex + 1;
    });
    const insertResult = await this.updateDocument(destinationDocumentId, insertChanges);
    const deleteResult = await this.updateDocument(sourceDocumentId, deleteChanges);
    return [insertResult, deleteResult];
  }

  public async moveNodes(nodes: any[], sourceDocumentId: string, toMoveUnderNodeId: string, includeChecked = true) {
    var changes: any[] = [];

    var positionIndex = 0;
    nodes.forEach((node) => {
      var change = {
        action: 'move',
        node_id: node.id,
        parent_id: toMoveUnderNodeId,
        index: positionIndex,
      } as any;
      if (includeChecked) {
        change = {
          ...change,
          checkbox: true,
          checked: node.checked || false,
        };
      }
      changes.push(change);
      positionIndex = positionIndex + 1;
    });

    await this.updateDocument(sourceDocumentId, changes);
  }

  public async moveNodeIds(nodeIds: string[], parentId: string, documentId: string) {
    var changes: any[] = [];

    var positionIndex = 0;
    nodeIds.forEach((nodeId) => {
      changes.push({
        action: 'move',
        node_id: nodeId,
        parent_id: parentId,
        index: positionIndex,
      });
      positionIndex = positionIndex + 1;
    });

    await this.updateDocument(documentId, changes);
  }

  public async uncheckNodes(nodes: any[], documentId: string) {
    const changes: any[] = [];
    nodes.forEach((node) => {
      changes.push({
        action: 'edit',
        node_id: node.id,
        checked: false,
      });
    });
    await this.updateDocument(documentId, changes);
  }

  public async editNode(
    documentId: string,
    nodeId: string,
    changes: {
      content?: string;
      note?: string;
      checked?: boolean;
      checkbox?: boolean;
      heading?: number;
      color?: number;
    }
  ) {
    return await this.updateDocument(documentId, [
      {
        action: 'edit',
        node_id: nodeId,
        ...changes,
      },
    ]);
  }

  public async createNewEntry(
    fileId: string,
    parentId: string,
    content: string,
    index = 0,
    options: NodeCreationOptions = {}
  ): Promise<DocumentUpdateResponse> {
    return await this.updateDocument(fileId, [
      {
        action: 'insert',
        parent_id: parentId,
        index: index,
        content: content,
        ...options,
      },
    ]);
  }

  public async createNodes(
    documentId: string,
    parentId: string,
    nodes: { content: string; index?: number; options?: NodeCreationOptions }[]
  ): Promise<DocumentUpdateResponse> {
    let currentAutoIndex = 0;
    
    // Determine starting index if strict ordering is implied by the first element and none provided
    if (nodes.length > 0 && nodes[0].index === undefined) {
         // If we had a way to fetch the parent's current child count easily we would, 
         // but '0' or '-1' (end) are common defaults. 
         // Here we rely on user providing index or defaulting to 0 for the batch.
    }

    const changes = nodes.map((node) => {
      const idx = node.index !== undefined ? node.index : currentAutoIndex++;
      return {
        action: 'insert',
        parent_id: parentId,
        index: idx,
        content: node.content,
        ...node.options,
      };
    });

    return await this.updateDocument(documentId, changes as any);
  }

  public async filterNodesByContent(document: any, filterString: string) {
    return document.nodes.filter((n: any) => n.content.includes(filterString));
  }

  public async sendToInbox(content: string, index = 0, additionalParameters?: SendToInboxParameters) {
    let parameters = {
      token: this.dynalistApiKey,
      index: index,
      content: content,
    } as SendToInboxParameters;

    if (additionalParameters) {
      parameters = { ...additionalParameters, ...parameters } as SendToInboxParameters;
    }
    return await this.getPostResponse('https://dynalist.io/api/v1/inbox/add', parameters as object);
  }

  public async listFiles(): Promise<FileListResponse> {
    return (await this.getPostResponse('https://dynalist.io/api/v1/file/list', {
      token: this.dynalistApiKey,
    })) as FileListResponse;
  }

  public async checkForUpdates(fileIds: string[]): Promise<CheckForUpdatesResponse> {
    return (await this.getPostResponse('https://dynalist.io/api/v1/doc/check_for_updates', {
      token: this.dynalistApiKey,
      file_ids: fileIds,
    })) as CheckForUpdatesResponse;
  }

  public async uploadFile(
    filename: string,
    contentType: string,
    data: string
  ): Promise<UploadFileResponse> {
    return (await this.getPostResponse('https://dynalist.io/api/v1/upload', {
      token: this.dynalistApiKey,
      filename: filename,
      content_type: contentType,
      data: data,
    })) as UploadFileResponse;
  }

  public async getPreference(key: string): Promise<GetPreferenceResponse> {
    return (await this.getPostResponse('https://dynalist.io/api/v1/pref/get', {
      token: this.dynalistApiKey,
      key: key,
    })) as GetPreferenceResponse;
  }

  public async setPreference(key: string, value: string): Promise<void> {
    await this.getPostResponse('https://dynalist.io/api/v1/pref/set', {
      token: this.dynalistApiKey,
      key: key,
      value: value,
    });
  }

  public async getDocument(id: string): Promise<ExtendedDynalistDocument> {
    const document = new ExtendedDynalistDocument(id, this);
    await document.loadCurrentData();
    return document;
  }

  public async deleteNode(node: ExtendedDynalistNode) {
    await node.delete();
  }
}
