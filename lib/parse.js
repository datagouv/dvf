function getCodeCommune(row) {
  const rowCodeDepartement = row['Code departement']
  const rowCodeCommune = row['Code commune']
  const codeDepartement = rowCodeDepartement.startsWith('97') ? rowCodeDepartement : rowCodeDepartement.padStart(2, '0')
  const codeCommuneSeule = rowCodeDepartement.startsWith('97') ? rowCodeCommune.padStart(2, '0') : rowCodeCommune.padStart(3, '0')
  return codeDepartement + codeCommuneSeule
}

function getDateMutation(row) {
  const rawDateMutation = row['Date mutation']
  return `${rawDateMutation.substr(6, 4)}-${rawDateMutation.substr(3, 2)}-${rawDateMutation.substr(0, 2)}`
}

function getIdParcelle(row) {
  const codeCommune = getCodeCommune(row)
  const codePrefixeSection = row['Prefixe de section'] ? row['Prefixe de section'].padStart(3, '0') : '000'
  const codeSection = row['Section'].padStart(2, '0')
  const numeroParcelle = row['No plan'].padStart(4, '0')
  return codeCommune + codePrefixeSection + codeSection + numeroParcelle
}

function getCodePostal(row) {
  if (row['Code postal']) {
    return row['Code postal'].padStart(5, '0')
  }
}

function parseFloat(value) {
  if (value) {
    return Number.parseFloat(value.replace(',', '.'))
  }
}

module.exports = {getDateMutation, getCodeCommune, getIdParcelle, getCodePostal, parseFloat}
