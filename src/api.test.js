const { DynalistApi } = require('dynalist-api');
const config = require('./config.json');

const documentId = config.testDocumentId;

jest.setTimeout(10000);

const node1Name = "test_node_1";
const node2Name = "test_node_2";

const createStandardSubtrees = async () => {
  const api = new DynalistApi(config.testApiKey);
  const document = await api.getDocument(documentId);
  const node1Tree = {
    content: node1Name,
    checked: false,
    children: [
      {
        content: 'subtree1',
        checked: false,
        children: [
          {
            content: 'child1',
            checked: false,
            children: [],
          },
          {
            content: 'child2',
            checked: false,
            children: [],
          },
        ],
      },
    ],
  };
  const node2Tree = {
    content: node2Name,
    checked: false,
    children: [
      {
        content: 'subtree2',
        checked: false,
        children: [
          {
            content: 'child3',
            checked: false,
            children: [],
          },
          {
            content: 'child4',
            checked: false,
            children: [],
          },
        ],
      },
    ],
  };
  await document.createNodeTree(node1Tree);
  await document.createNodeTree(node2Tree);
};

const deleteStandardSubtrees = async () => {
  const api = new DynalistApi(config.testApiKey);
  const document = await api.getDocument(documentId);
  const node1 = await document.getNodeByQuery((n) => n.content.includes(node1Name));
  const node2 = await document.getNodeByQuery((n) => n.content.includes(node2Name));
  await api.deleteNodes(document.id, [node1, node2]);
};

beforeAll(() => {
  createStandardSubtrees();
});

afterAll(() => {
  deleteStandardSubtrees();
});

test('expect document to be loaded', async () => {
  const api = new DynalistApi(config.testApiKey);
  const document = await api.getDocument(documentId);
  console.log(document.id);
  expect(document.id).toBe(documentId);
});

test('expect node to be loaded', async () => {
  const api = new DynalistApi(config.testApiKey);
  const document = await api.getDocument(documentId);
  const node1 = await document.getNodeByQuery((n) => n.content.includes(node1Name));
  expect(node1.content).toBe(node1Name);
});

test('expect child node to be created', async () => {
  const api = new DynalistApi(config.testApiKey);
  const document = await api.getDocument(documentId);
  const node1 = await document.getNodeByQuery((n) => n.content.includes(node1Name));
  const content = 'Test title';
  const childNode = await node1.createChild(content);
  expect(!!childNode.id).toBe(true);
  expect(childNode.content).toBe(content);
});

test('expect child node to be deleted', async () => {
  const api = new DynalistApi(config.testApiKey);
  const document = await api.getDocument(documentId);
  const node1 = await document.getNodeByQuery((n) => n.content.includes(node1Name));
  const content = 'To Delete';
  let childNode = await node1.createChild(content);
  const id = childNode.id;
  await childNode.delete();
  childNode = await document.getNodeById(id);
  expect(!!childNode).toBe(false);
});

test('expect node to be moved', async () => {
  const api = new DynalistApi(config.testApiKey);
  const document = await api.getDocument(documentId);
  const node1 = await document.getNodeByQuery(n => n.content === node1Name);
  let node2 = node1.children.find(n => n.content === node2Name);
  expect(!!node2).toBe(false);
  node2 = await document.getNodeByQuery(n => n.content === node2Name);
  expect(!!node2).toBe(true);
  await node1.moveNodeUnder(node2);
  await node1.loadCurrentData();
  node2 = node1.children.find(n => n.content === node2Name);
  expect(!!node2).toBe(true);
});
