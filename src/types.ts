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
    children: string[]
}

export interface DynalistDocument {
    file_id: string;
    title: string;
    version: number
    nodes: DynalistNode[]
}