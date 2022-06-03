import { DynalistApi } from './index';
import { Node } from './node';
import { DynalistDocument, DynalistNode } from './types';

export class Document implements DynalistDocument {

    public id: string;
    private api: DynalistApi;
    public file_id: string = "";
    public title: string = "";
    public version: number = -1;
    public nodes: DynalistNode[] = [];

    constructor(id: string, api: DynalistApi){
        this.id = id;
        this.api = api;
    }

    //need a load and reload method or should this just be hidden?
    public async loadCurrentData(){
        const document = await this.api.getPostResponse('https://dynalist.io/api/v1/doc/read',
        {
            token: this.api.dynalistApiKey,
            file_id: this.id
        }) as DynalistDocument;

        this.file_id = document.file_id;
        this.title = document.title;
        this.version = document.version;
        this.nodes = document.nodes;        
    }

    public async getNodeById(id: string, reloadData = false) : Promise<Node | null> {
        if(!this.nodes.find(n => n.id === id)){
            return null;
        }
        const node = new Node(id, this, this.api);
        if(reloadData){
            await node.loadCurrentData();
        }
        return node;
    }

    public async getNodeByQuery(query: (node: DynalistNode) => boolean, reloadData = false) : Promise<Node | null> {
        const node = this.nodes.find(query);
        if(!node){
            return null;
        }
        return await this.getNodeById(node.id, reloadData);
    }
}