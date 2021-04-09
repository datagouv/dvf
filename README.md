# DVF

Ce dépôt contient le traitement permettant de produire la [version géolocalisée des fichiers DVF](https://www.data.gouv.fr/fr/datasets/demandes-de-valeurs-foncieres-geolocalisees/).

## Pré-requis

- [Node.js](https://nodejs.org) version 12 ou supérieure
- yarn (ou à défaut npm)

## Installation

Cloner le présent dépôt de code, puis installer les dépendances :

```bash
yarn # (ou npm install)
```

## Mise en place des données sources

Les [données sources produites par la DGFiP](https://www.data.gouv.fr/datasets/5c4ae55a634f4117716d5656) doivent être placées dans le dossier `/data`.
Ces fichiers doivent avoir la forme `valeursfoncieres-YYYY.txt.gz` avec YYYY correspondant à l'année des données. Si le fichier récupéré n'est pas compressé, utilisez la commande `gzip`.

## Configuration du script

Pour configurer le script vous devez créer un fichier `.env` à la racine du dossier.

```
CADASTRE_MILLESIME=2020-01-01
COG_MILLESIME=2019-01-01
ANNEES=2014,2015,2016,2017,2018,2019,2020
```

`CADASTRE_MILLESIME` correspond au millésime du plan cadastral à utiliser
`COG_MILLESIME` correspond au millésime du code officiel géographique à utiliser
`ANNEES` est la liste des années à lire dans le dossier `/data`

## Lancement du traitement

```
yarn improve-csv
```

Le traitement dure plusieurs dizaines de minutes et écrit les résultats dans le dossier `/dist`.

## Licence

MIT
