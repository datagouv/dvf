const {promisify} = require('util')
const finished = promisify(require('stream').finished)
const {PassThrough} = require('stream')
const {createGzip} = require('zlib')
const {createReadStream, createWriteStream} = require('fs')
const csvParser = require('csv-parser')
const csvWriter = require('csv-write-stream')
const getStream = require('get-stream')
const intoStream = require('into-stream')
const pumpify = require('pumpify')

function readCsv(filePath, options = {}) {
  return getStream.array(pumpify.obj(
    createReadStream(filePath),
    csvParser({separator: options.separator || ','})
  ))
}

function writeCsv(filePath, rows, options = {}) {
  return finished(pumpify(
    intoStream.object(rows),
    csvWriter({separator: options.separator || ','}),
    filePath.endsWith('.gz') ? createGzip() : new PassThrough(),
    createWriteStream(filePath)
  ))
}

module.exports = {readCsv, writeCsv}
