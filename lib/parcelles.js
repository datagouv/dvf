const {promisify} = require('util')
const gunzip = promisify(require('zlib').gunzip)
const got = require('got')
const {chain} = require('lodash')
const {getCodeDepartement, getAllCodesCommunes} = require('./recog')

function getParcellesUrl(codeCommune) {
  return `https://cadastre.data.gouv.fr/data/etalab-cadastre/${process.env.CADASTRE_MILLESIME}/geojson/communes/${getCodeDepartement(codeCommune)}/${codeCommune}/cadastre-${codeCommune}-parcelles.json.gz`
}

async function getParcelles(codeCommune) {
  try {
    const response = await got(getParcellesUrl(codeCommune), {responseType: 'buffer'})
    return JSON.parse(await gunzip(response.body)).features
  } catch {
    console.log(`Parcelles non trouvées pour la commune ${codeCommune} sur l'URL ${getParcellesUrl(codeCommune)}`)
  }
}

async function getParcellesCommune(codeCommune) {
  const codesCommunes = getAllCodesCommunes(codeCommune)

  return chain(await Promise.all(codesCommunes.map(getParcelles)))
    .compact()
    .flatten()
    .keyBy('properties.id')
    .value()
}

module.exports = {getParcellesCommune}
