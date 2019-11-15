const {promisify} = require('util')
const {join} = require('path')
const gunzip = promisify(require('zlib').gunzip)
const {readFile, pathExists} = require('fs-extra')
const {keyBy} = require('lodash')
const {getCodeDepartement, getAllCodesCommunes} = require('./recog')

const communesPath = process.env.CADASTRE_COMMUNES_PATH

async function getParcellesCommune(codeCommune) {
  const codesCommunes = getAllCodesCommunes(codeCommune)
  const parcelles = []

  await Promise.all(codesCommunes.map(async code => {
    const filePath = join(communesPath, getCodeDepartement(code), code, `cadastre-${code}-parcelles.json.gz`)

    if (!(await pathExists(filePath))) {
      return
    }

    const gzippedFileContent = await readFile(filePath)
    const fileContent = await gunzip(gzippedFileContent)
    const featureCollection = JSON.parse(fileContent)

    parcelles.push(...featureCollection.features)
  }))

  return keyBy(parcelles, 'properties.id')
}

module.exports = {getParcellesCommune}
