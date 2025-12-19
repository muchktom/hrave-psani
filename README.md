# Hravé psaní

Interaktivní webová aplikace pro výuku a procvičování psaní na tabletu se stylusem. Aplikace umožňuje dětem procvičovat psaní písmen, čísel a slov pomocí různých režimů obtížnosti.

## Funkce

- **Nastavení hry**: Rodič může nakonfigurovat hru podle schopností dítěte:
  - **Složitost**: Písmena, slova nebo čísla.
  - **Výběr znaků**: Možnost vybrat konkrétní písmena nebo čísla k procvičování.
  - **Režim psaní**:
    - *Obtahování*: Dítě píše přes zobrazenou šablonu.
    - *Zkouška (naslepo)*: Dítě opisuje vzor, který vidí v rohu, bez podkladové šablony.
  - **Délka hry**: Nastavení počtu úkolů.
  - **Velká písmena**: Volba mezi psaním velkých a malých písmen.

- **Hra**:
  - Psaní na plátno (Canvas) pomocí dotyku nebo stylusu.
  - **Inteligentní vyhodnocování**:
    - Porovnává napsaný tvar s předlohou (používá font Andika vhodný pro výuku).
    - V režimu zkoušky automaticky zarovná a přizpůsobí velikost napsaného znaku pro férové vyhodnocení.
    - Kontroluje přesnost (vybočení z tvaru) a celistvost (dokončení celého tvaru).
  - Vizuální zpětná vazba (konfety, povzbuzení).

- **Vyhodnocení**:
  - Přehled úspěšnosti jednotlivých pokusů.
  - Zobrazení detailů o trvání a počtu pokusů.

## Technologie

- React + TypeScript
- Vite
- Canvas API (kreslení a pixel-based validace)
- Lucide React (ikony)
- Canvas Confetti
- Google Fonts (Andika, Lexend, VT323)

## Spuštění

1. Nainstalujte závislosti:
   ```bash
   npm install
   ```

2. Spusťte vývojový server:
   ```bash
   npm run dev
   ```

3. Otevřete v prohlížeči (obvykle http://localhost:5173). Doporučeno používat na tabletu se stylusem.
