const {join} = require('path')
const {readCsv} = require('./csv')

async function getCulturesMap() {
  const rows = await readCsv(join(__dirname, '..', 'table-cultures.csv'))
  return rows.slice(1).reduce((acc, item) => {
    acc[item['Code Nature de Culture']] = item['Libellé Nature de Culture']
    return acc
  }, {})
}

async function getCulturesSpecialesMap() {
  const rows = await readCsv(join(__dirname, '..', 'table-cultures-speciales.csv'))
  return rows.slice(1).reduce((acc, item) => {
    acc[item['Code Nature Culture Spéciale']] = item['Libellé Nature Culture Spéciale']
    return acc
  }, {})
}

module.exports = {getCulturesMap, getCulturesSpecialesMap}
