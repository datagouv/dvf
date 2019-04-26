#!/usr/bin/env node --max-old-space-size=8192
/* eslint camelcase: off */
require('dotenv').config()

const {join} = require('path')
const {createReadStream} = require('fs')
const {Transform} = require('stream')
const bluebird = require('bluebird')
const {ensureDir} = require('fs-extra')
const csvParser = require('csv-parser')
const {createGunzip} = require('gunzip-stream')
const {groupBy} = require('lodash')
const pumpify = require('pumpify').obj
const getStream = require('get-stream')
const centroid = require('@turf/centroid').default
const truncate = require('@turf/truncate').default
const {writeCsv} = require('./lib/csv')
const {getCulturesMap, getCulturesSpecialesMap} = require('./lib/cultures')
const {getDateMutation, getIdParcelle, getCodeCommune, getPrefixeSection, getCodePostal, parseFloat} = require('./lib/parse')
const {getParcellesCommune} = require('./lib/parcelles')
const {getCommune, getCommuneActuelle, getCodeDepartement, getCommuneFromCadastre} = require('./lib/recog')

const DATE_ALIGNEMENT = '2019-01-01'
const DATE_ALIGNEMENT_CADASTRE = '2018-01-01'

function convertRow(row, {culturesMap, culturesSpecialesMap}) {
  const dateMutation = getDateMutation(row)
  const codeCommune = getCodeCommune(row)
  const commune = getCommune(codeCommune, dateMutation)
  const communeActuelle = getCommuneActuelle(commune, DATE_ALIGNEMENT) || (console.log(`Probable dé-fusion : ${commune.nom}`) || commune)
  const idParcelle = getIdParcelle(row)

  const converted = {
    id_mutation: '',
    date_mutation: dateMutation,
    numero_disposition: row['No disposition'],
    nature_mutation: row['Nature mutation'],
    valeur_fonciere: parseFloat(row['Valeur fonciere']) || '',
    adresse_numero: row['No voie'],
    adresse_suffixe: row['B/T/Q'],
    adresse_nom_voie: [row['Type de voie'], row.Voie].filter(Boolean).join(' '),
    adresse_code_voie: row['Code voie'] ? row['Code voie'].padStart(4, '0') : '',
    code_postal: getCodePostal(row) || '',
    code_commune: communeActuelle.code,
    nom_commune: communeActuelle.nom,
    code_departement: getCodeDepartement(communeActuelle.code),
    ancien_code_commune: '',
    ancien_nom_commune: '',
    id_parcelle: idParcelle,
    ancien_id_parcelle: '',
    numero_volume: row['No Volume'],
    lot1_numero: row['1er lot'],
    lot1_surface_carrez: parseFloat(row['Surface Carrez du 1er lot']) || '',
    lot2_numero: row['2eme lot'],
    lot2_surface_carrez: parseFloat(row['Surface Carrez du 2eme lot']) || '',
    lot3_numero: row['3eme lot'],
    lot3_surface_carrez: parseFloat(row['Surface Carrez du 3eme lot']) || '',
    lot4_numero: row['4eme lot'],
    lot4_surface_carrez: parseFloat(row['Surface Carrez du 4eme lot']) || '',
    lot5_numero: row['5eme lot'],
    lot5_surface_carrez: parseFloat(row['Surface Carrez du 5eme lot']) || '',
    nombre_lots: row['Nombre de lots'],
    code_type_local: row['Code type local'],
    type_local: row['Type local'],
    surface_reelle_bati: parseFloat(row['Surface reelle bati']) || '',
    nombre_pieces_principales: row['Nombre pieces principales'],
    code_nature_culture: row['Nature culture'],
    nature_culture: row['Nature culture'] in culturesMap ? culturesMap[row['Nature culture']] : '',
    code_nature_culture_speciale: row['Nature culture speciale'],
    nature_culture_speciale: row['Nature culture speciale'] in culturesSpecialesMap ? culturesSpecialesMap[row['Nature culture speciale']] : '',
    surface_terrain: parseFloat(row['Surface terrain']) || '',
    longitude: '',
    latitude: ''
  }

  if (commune !== communeActuelle) {
    converted.ancien_code_commune = commune.code
    converted.ancien_nom_commune = commune.nom
  }

  if (commune.code !== communeActuelle.code) {
    const ancienneCommune = getCommuneFromCadastre(codeCommune, getPrefixeSection(row))
    const communeActuelleCadastre = getCommuneActuelle(ancienneCommune, DATE_ALIGNEMENT_CADASTRE)

    if (commune.code !== communeActuelleCadastre.code) {
      converted.ancien_id_parcelle = idParcelle
      converted.id_parcelle = `${communeActuelle.code}${commune.code.substr(2, 3)}${idParcelle.substr(8)}`
    }
  }

  return converted
}

const millesimes = ['2018', '2017', '2016', '2015', '2014']

async function main() {
  const culturesMap = await getCulturesMap()
  const culturesSpecialesMap = await getCulturesSpecialesMap()

  await bluebird.each(millesimes, async millesime => {
    console.log(`Millésime ${millesime}`)

    console.log('Chargement des données')

    let valeurFonciere
    let dateMutation
    let idMutationSeq = 0

    const rows = await getStream.array(pumpify(
      createReadStream(join(__dirname, 'data', `valeursfoncieres-${millesime}.txt.gz`)),
      createGunzip(),
      csvParser({separator: '|'}),
      new Transform({objectMode: true, transform(row, enc, cb) {
        const converted = convertRow(row, {culturesMap, culturesSpecialesMap})

        if (converted.valeur_fonciere !== valeurFonciere || converted.date_mutation !== dateMutation) {
          idMutationSeq++
          valeurFonciere = converted.valeur_fonciere
          dateMutation = converted.date_mutation
        }

        converted.id_mutation = `${millesime}-${idMutationSeq}`

        cb(null, converted)
      }})
    ))

    /* Géocodage à la parcelle */

    if (process.env.DISABLE_GEOCODING !== '1') {
      console.log('Géocodage à la parcelle')

      const communesRows = groupBy(rows, r => r.id_parcelle.substr(0, 5))
      await bluebird.map(Object.keys(communesRows), async codeCommune => {
        const communeRows = communesRows[codeCommune]
        const parcelles = await getParcellesCommune(codeCommune)

        communeRows.forEach(row => {
          if (parcelles && row.id_parcelle in parcelles) {
            const parcelle = parcelles[row.id_parcelle]
            const [lon, lat] = truncate(centroid(parcelle), {precision: 6}).geometry.coordinates
            row.longitude = lon
            row.latitude = lat
          }
        })
      }, {concurrency: 8})
    }

    /* Export des données à la commune */

    console.log('Export des données à la commune')

    const communesGroupedRows = groupBy(rows, 'code_commune')

    await bluebird.map(Object.keys(communesGroupedRows), async codeCommune => {
      const communeRows = communesGroupedRows[codeCommune]
      const codeDepartement = getCodeDepartement(codeCommune)
      const departementPath = join(__dirname, 'dist', millesime, 'communes', codeDepartement)
      await ensureDir(departementPath)
      await writeCsv(join(departementPath, `${codeCommune}.csv`), communeRows)
    }, {concurrency: 8})

    /* Export des données au département */

    console.log('Export des données au département')

    const departementsGroupedRows = groupBy(rows, 'code_departement')

    await bluebird.map(Object.keys(departementsGroupedRows), async codeDepartement => {
      const departementRows = departementsGroupedRows[codeDepartement]
      const departementsPath = join(__dirname, 'dist', millesime, 'departements')
      await ensureDir(departementsPath)
      await writeCsv(join(departementsPath, `${codeDepartement}.csv.gz`), departementRows)
    }, {concurrency: 8})

    /* Export des données complet */

    console.log('Export complet des données')

    const millesimePath = join(__dirname, 'dist', millesime)
    await ensureDir(millesimePath)
    await writeCsv(join(millesimePath, 'full.csv.gz'), rows)
  })
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
