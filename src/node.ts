import { DynalistApi } from './index';
import { Document } from './document';
import { DynalistNode } from './types';

export class Node implements DynalistNode {

    public id: string;
    private api: DynalistApi;
    private document: Document;

    //dynalist api properties
    public content: string = "";
    public note: string = "";
    public created: number = -1;
    public modified: number = -1;
    public children: string[] = [];

    constructor(id: string, document: Document, api: DynalistApi){
        this.id = id;
        this.api = api;
        this.document = document;
        this.readDataFromDocument();
    }

    public async loadCurrentData() {
        await this.document.loadCurrentData();
        this.readDataFromDocument();
    }

    private readDataFromDocument(){
        const dynalistNode = this.document.nodes.find(n => n.id === this.id);
        if(dynalistNode){
            this.content = dynalistNode.content;
            this.note = dynalistNode.note;
            this.created = dynalistNode.created;
            this.modified = dynalistNode.modified;
            this.children = dynalistNode.children;
        }
    }

    public moveChildrenTo(node: Node){

    }
}