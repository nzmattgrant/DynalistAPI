const {DynalistApi} = require('dynalist-api');
const config = require('./config.json');

const documentId = config.testDocumentId;

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