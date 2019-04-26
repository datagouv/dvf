const {promisify} = require('util')
const {join} = require('path')
const gunzip = promisify(require('zlib').gunzip)
const {readFile, pathExists} = require('fs-extra')
const {keyBy} = require('lodash')
const {getCodeDepartement} = require('./recog')

const communesPath = process.env.CADASTRE_COMMUNES_PATH

async function getParcellesCommune(codeCommune) {
  const filePath = join(communesPath, getCodeDepartement(codeCommune), codeCommune, `cadastre-${codeCommune}-parcelles.json.gz`)

  if (!(await pathExists(filePath))) {
    return
  }

  const gzippedFileContent = await readFile(filePath)
  const fileContent = await gunzip(gzippedFileContent)
  const featureCollection = JSON.parse(fileContent)

  return keyBy(featureCollection.features, 'properties.id')
}

module.exports = {getParcellesCommune}
