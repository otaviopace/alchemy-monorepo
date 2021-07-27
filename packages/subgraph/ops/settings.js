const path = require('path')
require('dotenv').config();

const migrationFileLocation = require.resolve(`@daostack/migration/migration.json`)
const network = process.env.network || 'mainnet'
const graphNode = process.env.graph_node || 'http://127.0.0.1:8020/'
const ipfsNode = process.env.ipfs_node || 'http://127.0.0.1:5001'
const ethereumNode = process.env.ethereum_node || 'https://eth-mainnet.alchemyapi.io/v2/mWSH9YlhpXfXymzLxptC1TE2CIy2QuMA'
const subgraphName = process.env.subgraph || 'daostack'
const postgresPassword = process.env.postgres_password || 'letmein'
const startBlock = parseInt(process.env.start_block) || 0
module.exports = {
  migrationFileLocation,
  network,
  graphNode,
  ipfsNode,
  ethereumNode,
  subgraphName,
  postgresPassword,
  startBlock
}
