export interface SendToInboxParameters {
    token?: string,
    content?: string,
    index?: number,
    note?: string, 
    checked?: string, 
    checkbox?: string, 
    heading?: string,
    color?: string
}

export interface CreateNodeParameters {
    action: string;
    type: string;
    parent_id: string;
    index: number;
    title?: string;
}

export interface EditNodeParameters {
    action: string;
    type: string;
    file_id: string;
    title: string;
}

export interface DocumentUpdateResponse {
    _code: string; // succeeded, an error code will be returned otherwise
    _msg: string;
    new_node_ids: string[]
}

export interface DynalistNode {
    id: string;
    content: string;
    note: string;
    created: number, // timestamp in milliseconds of the creation time
    modified: number, // timestamp in milliseconds of the last modified time
    children: string[],
    checkbox?: boolean,
    checked?: boolean,
    color?: number,// color label, 0~6
    heading?: number,// heading level, 0~3
    collapsed?: boolean
}

export interface DynalistDocument {
    file_id: string;
    title: string;
    version: number
    nodes: DynalistNode[]
}

export interface DynalistNodeTree {
    id: string,
    content: string,
    checked: boolean,
    children: DynalistNodeTree[]
}

export interface FileLevelChangeParameters {
    
    action: string,//edit/move/create
    type: string,//document/folder
    file_id: string,
    title?: string,
    parent_id?: string,
    index?: number
}

export interface DocumentLevelChangeParameters {
    action: string,//insert/edit/move/delete
    node_id?: string, 
    parent_id?: string,
    index?: number
    content?: string,
    note?: string,
    checked?: string,
}