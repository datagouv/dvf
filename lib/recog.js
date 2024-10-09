const {groupBy, keyBy, maxBy, minBy, uniq, flattenDeep} = require('lodash')
const historiqueCommunes = require('@etalab/decoupage-administratif/data/historique-communes.json')
const communes = require('@etalab/decoupage-administratif/data/communes.json')
const arrondissementsMunicipaux = communes
  .filter(c => c.type === 'arrondissement-municipal')
  .map(c => ({code: c.code, nom: c.nom, type: 'COM'}))

const communes2024 = require('decoupage-admin-2024/data/communes.json')
const comActuelles = communes2024.filter(com => com.type === "commune-actuelle")

const comAndArr = communes2024.filter(com => com.type === "arrondissement-municipal").reduce((acc, curr) => {
    if (!(curr.commune in acc)) {
       acc[curr.commune] = []
    }
    acc[curr.commune].push(curr.code)
    return acc
}, {})

const comAndAssociee = communes2024.filter(com => com.type === "commune-associee").reduce((acc, curr) => {
    if (!(curr.chefLieu in acc)) {
       acc[curr.chefLieu] = []
    }
    acc[curr.chefLieu].push(curr.code)
    return acc
}, {})

const comAndDeleguee = communes2024.filter(com => com.type === "commune-deleguee").reduce((acc, curr) => {
    if (!(curr.chefLieu in acc)) {
       acc[curr.chefLieu] = []
    }
    acc[curr.chefLieu].push(curr.code)
    return acc
}, {})

function connectGraph(historiqueCommunes) {
  const byId = keyBy(historiqueCommunes, 'id')
  historiqueCommunes.forEach(h => {
    if (h.successeur) {
      h.successeur = byId[h.successeur]
    }

    if (h.predecesseur) {
      h.predecesseur = byId[h.predecesseur]
    }

    if (h.pole) {
      h.pole = byId[h.pole]
    }

    if (h.membres) {
      h.membres = h.membres.map(m => byId[m])
    }
  })
}

connectGraph(historiqueCommunes)

const byCodeCommune = groupBy(historiqueCommunes.concat(arrondissementsMunicipaux), h => `${h.type}${h.code}`)

function getCodeDepartement(codeCommune) {
  return codeCommune.startsWith('97') ? codeCommune.substr(0, 3) : codeCommune.substr(0, 2)
}

function isValidAt(communeEntry, dateValeur) {
  return (!communeEntry.dateDebut || communeEntry.dateDebut <= dateValeur) && (!communeEntry.dateFin || communeEntry.dateFin > dateValeur)
}

const COM = {
  97123: {code: '97123', nom: 'Saint-Barthelemy', type: 'COM'},
  97127: {code: '97127', nom: 'Saint-Martin', type: 'COM'}
}

const fixTemp = {
  60694: { code: '60694', nom: 'Les Hauts-Talican', type: 'COM' }
}

function getCodesMembres(commune) {
  return uniq([
    commune.code,
    ...flattenDeep((commune.membres || []).map(getCodesMembres)),
    ...flattenDeep(commune.predecesseur ? getCodesMembres(commune.predecesseur) : [commune.code])
  ])
}

function getCodesMembres1(commune) {
  return [...new Set([
    commune.code,
    commune.code in comAndAssociee ? comAndAssociee[commune.code]: [],
    commune.code in comAndDeleguee ? comAndDeleguee[commune.code]: []
  ].flat(2))]
}

function getCommuneFromCadastre(codeCommune, prefixeSection) {
  if (codeCommune in COM) {
    return COM[codeCommune]
  }
  if (codeCommune in fixTemp) {
    return fixTemp[codeCommune]
  }

  if (prefixeSection === '000') {
    return getOlderCommune(codeCommune)
  }

  const code1 = `${codeCommune.substr(0, 2)}${prefixeSection}`
  const commune1 = getOlderCommune(code1)

  if (commune1) {
    return commune1
  }

  const codes2 = getCodesMembres(getMostRecentCommune(codeCommune))
  return getOlderCommune(codes2.find(c => c.endsWith(prefixeSection)))
}

function getMostRecentCommune(codeCommune) {
  return maxBy(byCodeCommune[`COM${codeCommune}`], c => c.dateFin || '9999-99-99')
}

function getOlderCommune(codeCommune) {
  return minBy(byCodeCommune[`COM${codeCommune}`], c => c.dateDebut || '0000-00-00')
}

function getCommune(codeCommune, dateValeur, types = ['COM', 'COMD', 'COMA', 'COMP']) {
  if (codeCommune in COM) {
    return COM[codeCommune]
  }
  if (codeCommune in fixTemp) {
    return fixTemp[codeCommune]
  }

  if (types.length === 0) {
    throw new Error(`Commune inconnue : ${codeCommune}. Date de valeur : ${dateValeur}`)
  }

  const [type] = types
  const candidates = byCodeCommune[`${type}${codeCommune}`]

  if (!candidates) {
    return getCommune(codeCommune, dateValeur, types.slice(1))
  }

  const commune = dateValeur ?
    candidates.find(c => isValidAt(c, dateValeur)) :
    maxBy(candidates, c => c.dateFin || '9999-99-99')

  if (!commune) {
    // Récupération des communes ayant changé de département
    if (type === 'COM') {
      const plusRecente = maxBy(candidates, 'dateFin')
      if (plusRecente.successeur && plusRecente.successeur.code !== plusRecente.code) {
        return getCommune(plusRecente.successeur.code, dateValeur, ['COM', 'COMD', 'COMA', 'COMP'])
      }
    }

    return getCommune(codeCommune, dateValeur, types.slice(1))
  }

  return commune
}

function getCommuneActuelle(communeEntry, dateValeur) {
  if (isValidAt(communeEntry, dateValeur) && communeEntry.type === 'COM') {
    return communeEntry
  }

  if (isValidAt(communeEntry, dateValeur)) {
    return getCommuneActuelle(communeEntry.pole, dateValeur)
  }

  if (communeEntry.successeur) {
    return getCommuneActuelle(communeEntry.successeur, dateValeur)
  }
}

function getAllCodesCommunes(codeCommune) {
  const commune = getCommune(codeCommune)
  return getCodesMembres(commune)
}

// console.log(getCodesMembres1({code: "05132"}))

module.exports = {getAllCodesCommunes, getCodeDepartement, getCommune, isValidAt, getCommuneActuelle, getCommuneFromCadastre}
