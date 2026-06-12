# Datasheets pendientes — specs estimadas en catálogo mock

Valores marcados como **ESTIMADO** en `lib/cotizador/pricing/mock.ts`. No inventar: buscar en el datasheet oficial de cada fabricante.

## Paneles

| Modelo | Campo | Valor actual | Buscar en datasheet |
|--------|-------|--------------|---------------------|
| LONGi Hi-MO X10 645W N-Type | `vocV` | 49.5 V (ESTIMADO) | Voc a STC (V) — LR7-72HVH o familia Hi-MO X10 645 W |
| LONGi Hi-MO X10 645W N-Type | `vmpV` | 42.0 V (ESTIMADO) | Vmp a STC (V) — mismo modelo |
| Jinko Tiger Neo 725W bifacial | `vocV` | 48.4 V (ESTIMADO) | Voc a STC — JKM710-730N-66HL4M-BDV o Tiger Neo 725 W |
| Jinko Tiger Neo 725W bifacial | `vmpV` | 40.5 V (ESTIMADO) | Vmp a STC — mismo modelo |
| (opcional Sheet) | `beta_voc_pct_c` | default -0.25 | Coef. temp. Voc (%/°C) por modelo |

## Inversores GoodWe 25–60 kW (mpptCount)

| Modelo | Campo | Valor actual | Buscar en datasheet |
|--------|-------|--------------|---------------------|
| GW25K-SDT-C30 AFCI | `mpptCount` | 3 (ESTIMADO) | Número de MPPT / entradas DC |
| GW30K-SDT-C30 AFCI | `mpptCount` | 3 (ESTIMADO) | Idem |
| GW40K-SDT-C30 AFCI | `mpptCount` | 4 (ESTIMADO) | Idem |
| GW50K-SDT AFCI | `mpptCount` | 4 (ESTIMADO) | Idem |
| GW60KS-MT AFCI | `mpptCount` | 4 (ESTIMADO) | Idem |

## Inversores SunGrow

| Modelo | Campo | Valor actual | Buscar en datasheet |
|--------|-------|--------------|---------------------|
| SG75 Trifásico 75kW | `mpptCount` | 6 (ESTIMADO) | MPPT count — SG75CX o equivalente |
| SG333HX 333kW | `mpptCount` | 12 (ESTIMADO) | MPPT count — SG333HX |

Cuando se complete cada dato, actualizar el Sheet de paneles/inversores y quitar `specsEstimadas: true` del mock.
