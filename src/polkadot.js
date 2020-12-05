/*
 * Connection to Polkadot network
 */
import { ApiPromise, WsProvider } from '@polkadot/api';
import { query as queryHelper } from './utils/polkadotHelper'
import PromisE from './utils/PromisE';
// import types from '@polkadot/types'

const Node_URL = 'wss://rpc.polkadot.io'
const connection = {
    api: null,
    provider: null,
}
let connectionPromsie

/**
 * @name            getConnection
 * @summary         connection to Blockchain
 * @param {String}  nodeUrl 
 * 
 * @returns {Object} an object with the following properties: api, provider
 */
export const getConnection = async (nodeUrl = Node_URL) => {
    if (connection.provider) {
        if (!connection.provider.isConnected) {
            console.log('Provider diconnected. Attempting to reconnect....')
            // provider somehow got disconnected. attempt to reconnect
            connection.provider.connect()
            // wait 5 seconds for reconnection
            await PromisE.delay(5000)
            console.log('Provider reconnected', connection.provider.isConnected)
        }
        return connection
    }
    if (connectionPromsie) {
        await connectionPromsie
        return connection
    }

    console.log('Connecting to Polkadot Network', nodeUrl)
    const provider = new WsProvider(nodeUrl, true);
    connectionPromsie = ApiPromise.create({ provider });
    const api = await connectionPromsie

    console.log('Connected to Polkadot Network')
    connection.api = api
    connection.provider = provider
    return connection
}

/**
 * @name    getBalance
 * @summary get free balance of an identity
 * 
 * @param   {String} address
 * 
 * @returns {Number}
 */
export const getBalance = async (address) => query('api.query.system.account', [address])

/**
 * @name query
 * @summary retrieve data from Blockchain storage using PolkadotJS API. All values returned will be sanitised.
 *
 * @param {Function}    func    string: path to the PolkadotJS API function as a string. Eg: 'api.rpc.system.health'
 * @param {Array}       args    array: arguments to be supplied when invoking the API function.
 *                                  To subscribe to the API supply a callback function as the last item in the array.
 * @param {Boolean}            print   boolean: if true, will print the result of the query
 *
 * @returns {Function|*}        Function/Result: If callback is supplied in @args, will return the unsubscribe function.
 *                              Otherwise, sanitised value of the query will be returned.
 */
export const query = async (func, args = [], multi = false, print = true) => {
    const { api, provider } = await getConnection()
    if (!provider.isConnected) throw 'Disconnected from Polkadot network!'

    return await queryHelper( api, func, args, multi, print)
}

// setTimeout(async () => {
//     const { api, provider } = await getConnection()
//     console.log('----balance', await getBalance('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY')) 
//     setTimeout(() => {
//         console.log('----disconnect', provider.isConnected)
//         provider.disconnect()
//         setTimeout(() => {
//             console.log('----after disconnect',provider.isConnected)
//             provider.connect()
//             setTimeout(() => console.log('----after reconnect', provider.isConnected), 5000)
//         }, 10000)
//     }, 5000)
// })