const {DynalistApi} = require('dynalist-api');
const config = require('./config.json');

const documentId = config.testDocumentId;

jest.setTimeout(10000);

test('expect document to be loaded', async () => {
    const api = new DynalistApi(config.testApiKey);
    const document = await api.getDocument(documentId);
    console.log(document.id);
    expect(document.id).toBe(documentId);
});

test('expect node to be loaded', async () => {
    const api = new DynalistApi(config.testApiKey);
    const document = await api.getDocument(documentId);
    const node1 = await document.getNodeById(config.node1Id);
    console.log(node1.id);
    expect(node1.id).toBe(config.node1Id);
});


test('expect child node to be created', async () => {
    const api = new DynalistApi(config.testApiKey);
    const document = await api.getDocument(documentId);
    const node1 = await document.getNodeById(config.node1Id);
    const content = "Test title";
    const childNode = await node1.createChild(content);
    console.log(childNode.id);
    expect(!!childNode.id).toBe(true);
    expect(childNode.content).toBe(content);
});


test('expect child node to be deleted', async () => {
    const api = new DynalistApi(config.testApiKey);
    const document = await api.getDocument(documentId);
    const node1 = await document.getNodeById(config.node1Id);
    const content = "To Delete";
    let childNode = await node1.createChild(content);
    const id = childNode.id;
    await childNode.delete();
    childNode = await document.getNodeById(id);
    expect(!!childNode).toBe(false);
});