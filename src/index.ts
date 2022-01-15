import request from 'request';

export class DynalistApi{

    constructor(private dynalistApiKey: string, private requestDelay: number = 1000){}

    private delay(ms: number){
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    private async getPostResponse(url: string, json: object){
        await this.delay(this.requestDelay);//rate limited on requests (one every second);
    
        return new Promise((resolve, reject) => {
            request.post(
                {
                    url: url,
                    json: json
                },
                (error, res, body) => {
                    if (!error && res.statusCode == 200) {
                        resolve(body);
                    } else {
                        reject(error);
                    }
                }
            );
        });
    }
    
    public async updateDocument(documentId: string, changes: object){
        return await this.getPostResponse('https://dynalist.io/api/v1/doc/edit',
            {
                token: this.dynalistApiKey,
                file_id: documentId,
                changes: changes
            });
    }
    
    public async getDocument(id: string) {
        const document = await this.getPostResponse('https://dynalist.io/api/v1/doc/read',
            {
                token: this.dynalistApiKey,
                file_id: id
            });
        return document;
    }
    
    public getSubTreesOrNull(item: any, nodes: any[], includeItemTest = (_: any) => true) {
        const subTrees: any[] = [];
        if (item.children) {
            const childrenItems = nodes.filter(node => item.children.includes(node.id))
            childrenItems.forEach(childItem => {
                const childAsSubtrees = this.getSubTreesOrNull(childItem, nodes);
                if (childAsSubtrees != null) {
                    subTrees.push(childAsSubtrees)
                }
            });
        }
        if (includeItemTest(item) || subTrees.length) {
            return {
                id: item.id,
                content: item.content,
                checked: item.checked || false,
                children: subTrees
            };
        }
        return null;
    }
    
    public getCheckedItemsSubTreesOrNull(item: any, nodes: any, ancestorChecked = false){
        const subTrees: any[] = [];
        const isItemChecked = item.checked || false;
        if (item.children) {
            const childrenItems = nodes.filter((node: any) => item.children.includes(node.id))
            childrenItems.forEach((childItem: any) => {
                const childAsSubtrees = this.getCheckedItemsSubTreesOrNull(childItem, nodes, isItemChecked || ancestorChecked);
                if (childAsSubtrees != null) {
                    subTrees.push(childAsSubtrees)
                }
            });
        }
        if (isItemChecked || ancestorChecked || subTrees.length) {
            return {
                id: item.id,
                content: item.content,
                checked: isItemChecked,
                children: subTrees
            };
        }
        return null;
    }
    
    public async deleteNodes(documentId: string, nodes: any[]){
        const toDeleteChanges = nodes.map(node => {
            return {
                "action": "delete",
                "node_id": node.id,
            }
        });
        await this.updateDocument(documentId, toDeleteChanges);
    }
    
    public async getNodeByHashTag(documentId: string, hashTag: string){
        const document = await this.getDocument(documentId) as any;
        const nodes = document.nodes;
        return nodes.find((node: any) => node.content.includes(hashTag));
    }
    
    public async copySubTrees(subTrees: any[], parentId: string, documentId: string, includeChecked: boolean){
        if (!subTrees || !subTrees.length) {
            return [];
        }
        var copiedIds: string[] = [];
        var changes: object[] = [];
        subTrees.forEach((item, i) => {
            var change = {
                "action": "insert",
                "parent_id": parentId,
                "index": i,
                "content": item.content
            } as any;
            if(includeChecked){
                change = { 
                    ...change, 
                    "checkbox": true,
                    "checked": item.checked || false,
                };
            }
            changes.push(change);
            copiedIds.push(item.id);
            if(item.id === undefined){
                console.log(item);
            }
        });
        var result = await this.updateDocument(documentId, changes) as any;
        var newIds = result.new_node_ids || [];
        //Assumption is that everything is in the same order as what they were passed in as
        //If not it's really annoying
        for (var i = 0; i < subTrees.length; i++) {
            const copiedChildIds = await this.copySubTrees(subTrees[i].children || [], newIds[i], documentId, includeChecked);
            copiedIds = copiedIds.concat(copiedChildIds);
        }
        return copiedIds;
    }
    
    public async moveNodesToDifferentDocument(nodes: any[], sourceDocumentId: string, destinationDocumentId: string, toMoveUnderNodeId = 'root', includeChecked = true) {
        const insertChanges: any[] = [];
        const deleteChanges: any[] = [];
        var positionIndex = 0;
        console.log(destinationDocumentId);
        nodes.forEach(node => {
            let insertChange = {
                "action": "insert",
                "parent_id": toMoveUnderNodeId || 'root',
                "index": positionIndex,
                "content": node.content,
                "note": node.note,
                "heading": node.heading,
                "color": node.color
            } as any
            if(includeChecked){
                insertChange = { 
                    ...insertChange, 
                    "checkbox": true,
                    "checked": node.checked || false,
                };
            }
            insertChanges.push(insertChange);
            const deleteChange = {
                "action": "delete",
                "node_id": node.id
            }
            deleteChanges.push(deleteChange);
            positionIndex = positionIndex + 1;
        });
        const insertResult = await this.updateDocument(destinationDocumentId, insertChanges);
        const deleteResult = await this.updateDocument(sourceDocumentId, deleteChanges);
        return [insertResult, deleteResult];
    }
    
    public async moveNodes(nodes: any[], sourceDocumentId: string, toMoveUnderNodeId: string, includeChecked = true){
    
        var changes: any[] = [];
    
        var positionIndex = 0;
        nodes.forEach(node => {
    
            var change = {
                "action": "move",
                "node_id": node.id,
                "parent_id": toMoveUnderNodeId,
                "index": positionIndex
            } as any;
            if(includeChecked){
                change = { 
                    ...change, 
                    "checkbox": true,
                    "checked": node.checked || false,
                };
            }
            changes.push(change);
            positionIndex = positionIndex + 1;
        });
        console.log(changes);
    
        await this.updateDocument(sourceDocumentId, changes);
    }
    
    public async moveNodeIds(nodeIds: string[], parentId: string, documentId: string){
        var changes: any[] = [];
    
        var positionIndex = 0;
        nodeIds.forEach(nodeId => {
            console.log(nodeId);
            changes.push({
                "action": "move",
                "node_id": nodeId,
                "parent_id": parentId,
                "index": positionIndex
            });
            positionIndex = positionIndex + 1;
        });
    
        await this.updateDocument(documentId, changes);
    }
    
    public async uncheckNodes(nodes: any[], documentId: string){
        const changes: any[] = [];
        nodes.forEach(node => {
            changes.push({
                "action": "edit",
                "node_id": node.id,
                "checked": false,
            });
        });
        await this.updateDocument(documentId, changes);
    }
    
    public async createNewEntry(fileId: string, parentId: string, content: string, index = 0){
        return await this.updateDocument(fileId, [{
            "action": "insert",
            "parent_id": parentId,
            "index": index,
            "content": content
        }]);
    }
    
    public async filterNodesByContent(document: any, filterString: string){
        return document.nodes.filter((n: any) => n.content.includes(filterString));
    }

    public async sendToInbox(content: string, index=0, additionalParameters?: SendToInboxParameters){
        let parameters = {
            token: this.dynalistApiKey,
            index: index,
            content: content
        } as SendToInboxParameters;

        if(additionalParameters){
            parameters = {...additionalParameters, ...parameters} as SendToInboxParameters;
        }
        return await this.getPostResponse('https://dynalist.io/api/v1/inbox/add', additionalParameters as object);
    }
}

export interface SendToInboxParameters{
    token?: string,
    content?: string,
    index?: number,
    note?: string, 
    checked?: string, 
    checkbox?: string, 
    heading?: string,
    color?: string
}

