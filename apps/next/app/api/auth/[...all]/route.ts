const { auth } = require('../../../../lib/auth')
const { toNextJsHandler } = require('better-auth/next-js')

const { POST, GET } = toNextJsHandler(auth)
module.exports = { POST, GET }
