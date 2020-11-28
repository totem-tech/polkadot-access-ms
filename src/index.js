/*
 * Service to access Polkadot Network
 */
import express from 'express'
import fs from 'fs'
import https from 'https'
import socketIO from 'socket.io'
import uuid from 'uuid'
import PromisE from './utils/PromisE'
import { isFn } from './utils/utils'
import { getConnection, query } from './polkadot'

const expressApp = express()
const cert = fs.readFileSync(process.env.CertPath) || './sslcert/fullchain.pem'
const key = fs.readFileSync(process.env.KeyPath) || './sslcert/privkey.pem'
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL
const DISCORD_WEBHOOK_URL_SUPPORT = process.env.DISCORD_WEBHOOK_URL_SUPPORT
const DISCORD_WEBHOOK_AVATAR_URL = process.env.DISCORD_WEBHOOK_AVATAR_URL
const DISCORD_WEBHOOK_USERNAME = process.env.DISCORD_WEBHOOK_USERNAME
const PORT = process.env.PORT || 3004
const server = https.createServer({ cert, key }, expressApp)
const socket = socketIO.listen(server)

const events = {
    /**
     * @name    query
     * @summary event hander for querying Polkadot network
     * 
     * @param   {String}    func        API function path as a string. Eg: 'api.query.system.account'
     * @param   {Array}     args        arguments to be supplied to @func
     * @param   {Boolean}   print       whether to print the results in the console
     * @param   {Function}  callback    function to invoke once query is successful or failed.
     *                                  Arguments:
     *                                  @err    String
     */
    'query': async (func, args = [], multi = false, callback) => {
        if (!isFn(callback)) return
        try {
            const result = await query(func, args, multi)
            callback(null, result)
        } catch (err) {
            console.log('Request failed \n', JSON.stringify({
                func,
                args,
                error: err,
            }))
            callback(`${err}`)
        }

    },
}
const interceptHandler = (name, handler) => async function (...args) {
    if (!isFn(handler)) return
    const client = this
    if (name === 'message') {
        // pass on extra information along with the client
        client._data = {
            DISCORD_WEBHOOK_URL_SUPPORT,
            DISCORD_WEBHOOK_AVATAR_URL,
            DISCORD_WEBHOOK_USERNAME,
        }
    }
    // last argument is expected to be the function
    const callback = args.slice(-1)[0]
    const hasCallback = isFn(callback)

    try {
        // include the user object if login is required for this event
        await handler.apply(client, args)
    } catch (err) {
        const requestId = uuid.v1()
        hasCallback && callback(`${err}`)

        // Print error meta data
        console.log([
            '', // adds an empty line before
            `RequestID: ${requestId}.`,
            `interceptHandler: uncaught error on event "${name}" handler.`,
            // print the error stack trace
            `Error:`,
        ].join('\n'))
        console.log(err)

        if (!DISCORD_WEBHOOK_URL) return

        // send message to Discord
        const content = '>>> ' + [
            `**RequestID:** ${requestId}`,
            `**Event:** *${name}*`,
            '**Error:** ' + `${err}`.replace('Error:', ''),
        ].join('\n')
        // Testing required
        PromisE
            .fetch(
                DISCORD_WEBHOOK_URL,
                {
                    method: "post",
                    json: true,
                    body: {
                        avatar_url: DISCORD_WEBHOOK_AVATAR_URL,
                        content,
                        username: DISCORD_WEBHOOK_USERNAME || 'Messaging Service Logger'
                    }
                }
            )
            .catch(err => console.log('Discord Webhook: failed to send error message. ', err))
    }
}
// replace handlers with intercepted handler
Object.keys(events).forEach(name => events[name] = interceptHandler(name, events[name]))
// Setup websocket event handlers
socket.on('connection', client => Object.keys(events).forEach(name =>
    client.on(name, events[name])
))
// Start listening
server.listen(PORT, () =>
    console.log(`Totem Polkadot Micro Service started. Websocket listening on port ${PORT} (https)`)
)

// attempt to establish a connection to the Polkadot Network
getConnection()
    // .then(({ api }) => console.log('api.query.balances.freeBalance', api.query.balances))
    .catch(err => {
        console.log('Polkadot: connection failed. Error:\n', err)
        process.exit(1)
    })

// query('api.query.system.account', '', false)

