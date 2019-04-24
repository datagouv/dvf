# Fichiers CSV retravaillés par Etalab

Ces fichiers sont proposés pour faciliter la réutilisation des données DVF.

## Améliorations par rapport aux fichiers bruts

- CSV avec séparateur virgule et encodage UTF-8
- Renommage des colonnes pour un traitement informatique plus facile
- Suppression des colonnes non fournies dans la diffusion DVF
- Jointure avec les tables fournies en documentation
- Normalisation des valeurs monétaires (point comme séparateur décimal)
- Normalisation des codes postaux (5 caractères)
- Normalisation des codes INSEE
- Création d'un identifiant de parcelle compatible avec les fichiers cadastraux proposés par Etalab
- Date de mutation au format ISO-8601
- Géocodage latitude/longitude à la parcelle en coordonnées WGS-84
- Fourniture des fichiers au département ou à la commune

## Schéma

Pour la description étendue de la signification des champs, nous vous recommandons de consulter la notice officielle.

| Nom du champ | Commentaire |
| --- | --- |
| `date_mutation` | Date de la mutation au format ISO-8601 (YYYY-MM-DD) |
| `valeur_fonciere` | Valeur foncière (séparateur décimal = point) |
| `adresse_numero` | Numéro de l'adresse |
| `adresse_suffixe` | Suffixe du numéro de l'adresse (B, T, Q) |
| `adresse_nom_voie` | Nom de la voie de l'adresse |
| `code_postal` | Code postal (5 caractères) |
| `code_commune` | Code commune INSEE (5 caractères) |
| `nom_commune` | Nom de la commune (tel que fourni) |
| `code_departement` | Code département INSEE (2 ou 3 caractères) |
| `id_parcelle` | Identifiant de parcelle (14 caractères) |
| `numero_volume` | Numéro de volume |
| `lot_1_numero` | Numéro du lot 1 |
| `lot_1_surface_carrez` | Surface Carrez du lot 1 |
| `lot_2_numero` | Numéro du lot 2 |
| `lot_2_surface_carrez` | Surface Carrez du lot 2 |
| `lot_3_numero` | Numéro du lot 3 |
| `lot_3_surface_carrez` | Surface Carrez du lot 3 |
| `lot_4_numero` | Numéro du lot 4 |
| `lot_4_surface_carrez` | Surface Carrez du lot 4 |
| `lot_5_numero` | Numéro du lot 5 |
| `lot_5_surface_carrez` | Surface Carrez du lot 5 |
| `nombre_lots` | Nombre de lots |
| `code_type_local` | Code de type de local |
| `type_local` | Libellé du type de local |
| `surface_reelle_bati` | Surface réelle du bâti |
| `nombre_pieces_principales` | Nombre de pièces principales |
| `code_nature_culture` | Code de nature de culture |
| `nature_culture` | Libellé de nature de culture |
| `code_nature_culture_speciale` | Code de nature de culture spéciale |
| `nature_culture_speciale` | Libellé de nature de culture spéciale |
| `surface_terrain` | Surface du terrain |
| `longitude` | Longitude du centre de la parcelle concernée (WGS-84) |
| `latitude` | Latitude du centre de la parcelle concernée (WGS-84) |
