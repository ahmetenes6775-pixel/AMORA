export type SpritePalette = Record<string, string>;

export interface PixelSpriteDef {
  width: number;
  height: number;
  palette: SpritePalette;
  frames: string[][];
}

// 11x10 Classic Undertale Pixel Heart
export const HEART_SPRITE: PixelSpriteDef = {
  width: 11,
  height: 10,
  palette: {
    R: '#ff1e2d',
    L: '#ff7a85',
    P: '#d946ef',
    Q: '#f5a8ff',
  },
  frames: [
    [
      '..RR...RR..',
      '.RRRR.RRRR.',
      'RRRRRRRRRRR',
      'RLRRRRRRRRR',
      'RRRRRRRRRRR',
      '.RRRRRRRRR.',
      '..RRRRRRR..',
      '...RRRRR...',
      '....RRR....',
      '.....R.....',
    ],
  ],
};

// Purple heart palette override for Spider Web Mode
export const PURPLE_HEART_PALETTE: SpritePalette = {
  R: '#d946ef',
  L: '#f5a8ff',
};

// 16x18 Pixel Sky Traveler (Player in Overworld)
export const PLAYER_SPRITE: PixelSpriteDef = {
  width: 16,
  height: 18,
  palette: {
    H: '#4b2d1f', // hair
    S: '#ffd5b4', // skin
    E: '#1a1025', // eyes
    C: '#3b82f6', // sky tunic
    D: '#1d4ed8', // tunic shade
    Y: '#facc15', // gold scarf
    B: '#78350f', // boots
    W: '#ffffff',
  },
  frames: [
    [
      '.....HHHHHH.....',
      '....HHHHHHHH....',
      '...HHHHHHHHHH...',
      '...HHSSSSSSHH...',
      '...HHSESSESHH...',
      '...HHSSSSSSHH...',
      '....YYYYYYYY....',
      '...YYYYYYYYYY...',
      '...YYCCCCCCYY...',
      '..SSCCCCCCCCSS..',
      '..SSCCCDDDCCSS..',
      '....CCCCCCCC....',
      '....CCCDDDCC....',
      '....DDD..DDD....',
      '....BBB..BBB....',
      '...BBBB..BBBB...',
      '................',
      '................',
    ],
    [
      '.....HHHHHH.....',
      '....HHHHHHHH....',
      '...HHHHHHHHHH...',
      '...HHSSSSSSHH...',
      '...HHSESSESHH...',
      '...HHSSSSSSHH...',
      '....YYYYYYYY....',
      '...YYYYYYYYYY...',
      '...YYCCCCCCYY...',
      '..SSCCCCCCCCSS..',
      '..SSCCCDDDCCSS..',
      '....CCCCCCCC....',
      '....CCCDDDCC....',
      '....DDD..DDD....',
      '...BBBB...BBB...',
      '..BBBB....BBBB..',
      '................',
      '................',
    ],
  ],
};

// 18x18 Sleepy Cloud Guide NPC
export const CLOUD_GUIDE_SPRITE: PixelSpriteDef = {
  width: 18,
  height: 18,
  palette: {
    O: '#1e293b',
    W: '#f8fafc',
    B: '#bae6fd',
    Y: '#facc15',
    E: '#0f172a',
    P: '#f472b6',
  },
  frames: [
    [
      '.......YYYY.......',
      '......YYYYYY......',
      '.....OOOOOOOO.....',
      '....OWWWWWWWWO....',
      '...OWWWWWWWWWWO...',
      '..OWWWWWWWWWWWWO..',
      '.OWWWEWWWWWEWWWWO.',
      '.OWWWPWWWWWPWWWWO.',
      '.OWWWWWWWWWWWWWWO.',
      '.OBBBBBBBBBBBBBBO.',
      '..OBBBBBBBBBBBBO..',
      '...OOOOOOOOOOOO...',
      '....OO......OO....',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
    ],
    [
      '..................',
      '.......YYYY.......',
      '......YYYYYY......',
      '.....OOOOOOOO.....',
      '....OWWWWWWWWO....',
      '...OWWWWWWWWWWO...',
      '..OWWWWWWWWWWWWO..',
      '.OWWWEWWWWWEWWWWO.',
      '.OWWWPWWWWWPWWWWO.',
      '.OWWWWWWWWWWWWWWO.',
      '.OBBBBBBBBBBBBBBO.',
      '..OBBBBBBBBBBBBO..',
      '...OOOOOOOOOOOO...',
      '..................',
      '..................',
      '..................',
      '..................',
      '..................',
    ],
  ],
};

// BOSS 1: 28x24 Sky Spider (Arakna)
export const SPIDER_BOSS_SPRITE: PixelSpriteDef = {
  width: 28,
  height: 24,
  palette: {
    S: '#e2e8f0', // silk thread
    O: '#1e1035', // dark outline
    P: '#7e22ce', // spider purple
    L: '#c084fc', // highlight lavender
    W: '#ffffff', // white
    E: '#f472b6', // pink ribbon / eyes
    G: '#fde047', // golden eye glint
    B: '#11071f', // deep body
  },
  frames: [
    // Frame 0: Idle dangling
    [
      '.............SS.............',
      '.............SS.............',
      '..........EEEEEE............',
      '.........EEEEEEEE...........',
      '..........OOOOOO............',
      '.........OPPPPPPO...........',
      '........OPLLLLLPPO..........',
      '..OO...OPPPWEWPPPPO...OO....',
      '.OPLO..OPPEWEWEPPPO..OLPO...',
      'OPL.OO.OPPPPPPPPPPO.OO.LPO..',
      'OP...OO.OPWWPPWWPO.OO...PO..',
      '.O....OOOBBBBBBBBOOO....O...',
      '..OO...OBBWWWWWWBBO...OO....',
      '.OPLO..OBBWBBBBWBBO..OLPO...',
      'OP..OO.OBBBBBBBBBBO.OO..PO..',
      'O....OO.OBBBBBBBBO.OO....O..',
      '......O..OOOOOOOO..O........',
      '.....O...O..OO..O...O.......',
      '....O...O........O...O......',
      '....O...O........O...O......',
      '........O........O..........',
      '............................',
      '............................',
      '............................',
    ],
    // Frame 1: Legs bobbing
    [
      '.............SS.............',
      '.............SS.............',
      '.............SS.............',
      '..........EEEEEE............',
      '.........EEEEEEEE...........',
      '..........OOOOOO............',
      '.........OPPPPPPO...........',
      '.OO.....OPLLLLLPPO.....OO...',
      'OPLO...OPPPWEWPPPPO...OLPO..',
      'OP.OO..OPPEWEWEPPPO..OO.PO..',
      '.O..OO.OPPPPPPPPPPO.OO..O...',
      '.....OO.OPWWPPWWPO.OO.......',
      '..OO..OOOBBBBBBBBOOO..OO....',
      '.OPLO..OBBWWWWWWBBO..OLPO...',
      'OP..OO.OBBWBBBBWBBO.OO..PO..',
      'O....OOOBBBBBBBBBBOOO....O..',
      '......O..OOOOOOOO..O........',
      '.....O...O..OO..O...O.......',
      '.....O..O........O..O.......',
      '........O........O..........',
      '............................',
      '............................',
      '............................',
      '............................',
    ],
  ],
};

// BOSS 2: 32x32 Sky King Aether (Asgore-like)
export const KING_BOSS_SPRITE: PixelSpriteDef = {
  width: 32,
  height: 32,
  palette: {
    Y: '#facc15', // gold crown / trident / horns
    G: '#fef08a', // bright gold
    W: '#f8fafc', // white mane/beard
    B: '#cbd5e1', // beard shadow
    O: '#0f172a', // dark outline
    R: '#dc2626', // royal crimson cape
    D: '#7f1d1d', // dark crimson
    A: '#64748b', // silver armor
    K: '#334155', // dark armor
    E: '#38bdf8', // sky glowing eyes
  },
  frames: [
    [
      '.....YY................YY.....G.',
      '....YGGY....YYYYYY....YGGY...GGG',
      '....YGGY...YGGGGGGY...YGGY...GYG',
      '.....YYO..OYYYYYYYYO..OYY....GYG',
      '......OOOOOWWWWWWWWOOOOO.....GYG',
      '......OWWWWWWWWWWWWWWWWO......Y.',
      '.....OWWWOOOWWWWWWOOWWWWO.....Y.',
      '.....OWWOEEOWWWWWWOEEOWWO.....Y.',
      '.....OWWWWWWWWWWWWWWWWWWO.....Y.',
      '....OWWWBBBBWWWWWWBBBBWWWO....Y.',
      '....OWWBBBBBBBBBBBBBBBBWWO....Y.',
      '...OOOWWBBBBBBBBBBBBBBWWOOO...Y.',
      '..ORROOAAYYYYYYYYYYYYAAOORRO..Y.',
      '.ORRRROAAKKKKKKKKKKKKAAORRRRO.Y.',
      '.ORRRROAAKKYYYYYYYYKKAAORRRRO.Y.',
      'ORRRRROAAKKKKKKKKKKKKAAORRRRROY.',
      'ORRRRROAAKKKKYYYYKKKKAAORRRRRGY.',
      'ORRDDROAAKKKKKKKKKKKKAAORRDDROY.',
      'ORRDDRO.AKKKKKKKKKKKKA.ORRDDROY.',
      '.ORDDRO.AKKKKKKKKKKKKA.ORDDRO.Y.',
      '.ORDDR..OKKKKKKKKKKKKO..RDDR..Y.',
      '..ODDR..OKKKKOOOOOKKKO..RDDO..Y.',
      '..ODDR..OKKKO....OKKKO..RDDO..Y.',
      '...OO...OKKKO....OKKKO...OO...Y.',
      '........OKKKO....OKKKO........Y.',
      '........OAAAO....OAAAO........Y.',
      '........OOOOO....OOOOO........Y.',
      '..............................Y.',
      '................................',
      '................................',
      '................................',
      '................................',
    ],
    [
      '..............................G.',
      '.....YY................YY....GGG',
      '....YGGY....YYYYYY....YGGY...GYG',
      '....YGGY...YGGGGGGY...YGGY...GYG',
      '.....YYO..OYYYYYYYYO..OYY....GYG',
      '......OOOOOWWWWWWWWOOOOO......Y.',
      '......OWWWWWWWWWWWWWWWWO......Y.',
      '.....OWWWOOOWWWWWWOOWWWWO.....Y.',
      '.....OWWOEEOWWWWWWOEEOWWO.....Y.',
      '.....OWWWWWWWWWWWWWWWWWWO.....Y.',
      '....OWWWBBBBWWWWWWBBBBWWWO....Y.',
      '....OWWBBBBBBBBBBBBBBBBWWO....Y.',
      '...OOOWWBBBBBBBBBBBBBBWWOOO...Y.',
      '..ORROOAAYYYYYYYYYYYYAAOORRO..Y.',
      '.ORRRROAAKKKKKKKKKKKKAAORRRRO.Y.',
      '.ORRRROAAKKYYYYYYYYKKAAORRRRO.Y.',
      'ORRRRROAAKKKKKKKKKKKKAAORRRRROY.',
      'ORRRRROAAKKKKYYYYKKKKAAORRRRRGY.',
      'ORRDDROAAKKKKKKKKKKKKAAORRDDROY.',
      'ORRDDRO.AKKKKKKKKKKKKA.ORRDDROY.',
      '.ORDDRO.AKKKKKKKKKKKKA.ORDDRO.Y.',
      '..ODDRO.OKKKKKKKKKKKKO.ODDRO..Y.',
      '..ODDR..OKKKKOOOOOKKKO..RDDO..Y.',
      '...OO...OKKKO....OKKKO...OO...Y.',
      '........OKKKO....OKKKO........Y.',
      '........OAAAO....OAAAO........Y.',
      '........OOOOO....OOOOO........Y.',
      '..............................Y.',
      '..............................Y.',
      '................................',
      '................................',
      '................................',
    ],
  ],
};

// BOSS 3: 20x22 Tiny Sky Cactus (Piko)
export const CACTUS_BOSS_SPRITE: PixelSpriteDef = {
  width: 20,
  height: 22,
  palette: {
    O: '#0f172a', // dark outline
    P: '#f472b6', // pink flower
    Y: '#fde047', // flower center
    G: '#22c55e', // cactus green
    L: '#86efac', // cactus highlight
    D: '#15803d', // cactus dark
    W: '#ffffff', // eye shine / spikes
    E: '#090d16', // eyes
    T: '#ea580c', // clay pot
    B: '#9a3412', // pot shadow
  },
  frames: [
    // Frame 0: Cute tiny cactus
    [
      '........PPPP........',
      '.......PPYYPP.......',
      '........PPPP........',
      '.......OOOOOO.......',
      '......OGGGGGGO......',
      '.....OGLLGGDGGO.....',
      '.OO..OGGGGGGGGO..OO.',
      'OGGO.OGEGGGGGEGOOGGO',
      'OGGOOOGWGGGGGWGOOGGO',
      '.OGGGGGGGGGGGGGGGGO.',
      '..OOOOGGGGGGGGOOOO..',
      '.....OGGLGGDGGO.....',
      '.....OGGGGGGGGO.....',
      '.....OGGGGGGGGO.....',
      '....OOOOOOOOOOOO....',
      '....OTTTTTTTTTTO....',
      '....OBBBBBBBBBBO....',
      '.....OTTTTTTTTO.....',
      '.....OTTTTTTTTO.....',
      '......OBBBBBBO......',
      '......OOOOOOOO......',
      '....................',
    ],
    // Frame 1: Bouncing tiny cactus
    [
      '....................',
      '........PPPP........',
      '.......PPYYPP.......',
      '........PPPP........',
      '.......OOOOOO.......',
      '......OGGGGGGO......',
      '.OO..OGLLGGDGGO..OO.',
      'OGGO.OGGGGGGGGO.OGGO',
      'OGGOOOGEGGGGGEGOOGGO',
      '.OGGGOGWGGGGGWGOOGGO',
      '..OOOOGGGGGGGGOOOO..',
      '.....OGGGGGGGGO.....',
      '.....OGGLGGDGGO.....',
      '.....OGGGGGGGGO.....',
      '....OOOOOOOOOOOO....',
      '....OTTTTTTTTTTO....',
      '....OBBBBBBBBBBO....',
      '.....OTTTTTTTTO.....',
      '.....OTTTTTTTTO.....',
      '......OBBBBBBO......',
      '......OOOOOOOO......',
      '....................',
    ],
  ],
};

// 22x26 Wise Bearded Wizard (Mor & Lacivert cübbeli, büyücü şapkalı, uzun beyaz sakallı bilge adam)
export const WIZARD_SPRITE: PixelSpriteDef = {
  width: 22,
  height: 26,
  palette: {
    O: '#090d16', // dark outline
    N: '#1e3a8a', // lacivert (navy)
    D: '#172554', // deep navy
    P: '#7e22ce', // mor (purple)
    L: '#a855f7', // bright purple
    Y: '#facc15', // gold star/trim
    S: '#ffd5b4', // skin
    W: '#f8fafc', // long white beard
    B: '#cbd5e1', // beard shadow
    E: '#38bdf8', // wise glowing eyes
    T: '#78350f', // wooden staff
  },
  frames: [
    [
      '..........OO..........',
      '.........ONNO.........',
      '........ONPPNO........',
      '.......ONPPPNO........',
      '......ONNPPPPNO.......',
      '......ONYYYYYNO.......',
      '....OONNNNNNNNNOO.....',
      '...ONPPPPPPPPPPPNO....',
      '....OOSSSSSSSSSOO.....',
      '.....OSSEOOOSSESO.....',
      '.....OSSWWWWWWSSO.....',
      '.....OWWWWWWWWWWO..YY.',
      '....OWWWBBBBBBWWWOYGGY',
      '...ONPWWBBBBBBWWPNOYY.',
      '..ONPPWWBBBBBBWWPPNOT.',
      '..ONPPWWWWWWWWWWPPNOT.',
      '..ODNPPPWWWWWWPPPNDDT.',
      '..ODNNPPPPPPPPPPNNDDT.',
      '..ODNNNNPPPPPPNNNNDDT.',
      '..ODNNNNNYYYYNNNNNDDT.',
      '...ODNNNNPPPPNNNNDD.T.',
      '...ODNNNNPPPPNNNNDD.T.',
      '....ODDDDDDDDDDDDD..T.',
      '.....OOOO....OOOO...T.',
      '....................T.',
      '......................',
    ],
    [
      '..........OO..........',
      '.........ONNO.........',
      '........ONPPNO........',
      '.......ONPPPNO........',
      '......ONNPPPPNO.......',
      '......ONYYYYYNO.......',
      '....OONNNNNNNNNOO.....',
      '...ONPPPPPPPPPPPNO....',
      '....OOSSSSSSSSSOO.....',
      '.....OSSEOOOSSESO.....',
      '.....OSSWWWWWWSSO.....',
      '.....OWWWWWWWWWWO..GG.',
      '....OWWWBBBBBBWWWOGYYG',
      '...ONPWWBBBBBBWWPNOGG.',
      '..ONPPWWBBBBBBWWPPNOT.',
      '..ONPPWWWWWWWWWWPPNOT.',
      '..ODNPPPWWWWWWPPPNDDT.',
      '..ODNNPPPPPPPPPPNNDDT.',
      '..ODNNNNPPPPPPNNNNDDT.',
      '..ODNNNNNYYYYNNNNNDDT.',
      '...ODNNNNPPPPNNNNDD.T.',
      '...ODNNNNPPPPNNNNDD.T.',
      '....ODDDDDDDDDDDDD..T.',
      '.....OOOO....OOOO...T.',
      '....................T.',
      '......................',
    ],
  ],
};

// 20x24 Mustached Corn Mentor (Usta Koçan)
export const CORN_MENTOR_SPRITE: PixelSpriteDef = {
  width: 20,
  height: 24,
  palette: {
    O: '#0f172a', // dark outline
    T: '#fde047', // corn silk tuft
    Y: '#facc15', // golden kernels
    G: '#fef08a', // bright kernel highlight
    A: '#eab308', // kernel shade
    E: '#090d16', // eyes
    W: '#ffffff', // eye shine
    P: '#fb923c', // warm cheeks
    M: '#451a03', // dark mustache
    H: '#78350f', // mustache highlight
    L: '#22c55e', // green husk leaf
    K: '#86efac', // leaf highlight
    V: '#15803d', // dark leaf
  },
  frames: [
    // Frame 0: Standing proud with curled mustache
    [
      '........TTTT........',
      '.......TTGGTT.......',
      '.......OOOOOO.......',
      '......OYGYYGYO......',
      '.....OYYGYYGYYO.....',
      '....OYAYYYYYYAYO....',
      '....OYEWYYYYEWYO....',
      '....OYEEYYYYEEYO....',
      '....OPYMMMMMMYPO....',
      '...OMMMHHHHHHMMMO...',
      '..OMMYYMMMMMMYYMMO..',
      '..OOOYGYYYYYYGYOOO..',
      '.OLKOYYYYAAYYYYOKLO.',
      '.OLLKOYYGYYGYYOKLLO.',
      '.OVLLKOOYYYYOOKLLVO.',
      '..OVLLKOOYYOOKLLVO..',
      '...OVLLLKKKKLLLVO...',
      '...OOVVVLLLLVVVOO...',
      '....OOVVVVVVVVOO....',
      '.....OOVVVVVVOO.....',
      '......OOVVVVOO......',
      '.......OO..OO.......',
      '......OOO..OOO......',
      '....................',
    ],
    // Frame 1: Gentle bob & leaf/tuft wiggle
    [
      '....................',
      '.......TTTTTT.......',
      '.......OOOOOO.......',
      '......OYGYYGYO......',
      '.....OYYGYYGYYO.....',
      '....OYAYYYYYYAYO....',
      '....OYEWYYYYEWYO....',
      '....OYEEYYYYEEYO....',
      '....OPYMMMMMMYPO....',
      '...OMMMHHHHHHMMMO...',
      '..OMMYYMMMMMMYYMMO..',
      '.OLKOYGYYYYYYGYOKLO.',
      '.OLLKOYYYAAYYYYOLLO.',
      '.OVLLKOYYGYYGYOLLVO.',
      '..OVLLKOOYYYYOKLLVO.',
      '..OOVLLKOOYYOKLLVOO.',
      '...OVLLLKKKKLLLVO...',
      '...OOVVVLLLLVVVOO...',
      '....OOVVVVVVVVOO....',
      '.....OOVVVVVVOO.....',
      '......OOVVVVOO......',
      '.......OO..OO.......',
      '......OOO..OOO......',
      '....................',
    ],
  ],
};

// SECRET BOSS: 34x34 Giant Depressive Pirate Potato with Somber Blood-Stained Sword
export const PIRATE_POTATO_BOSS_SPRITE: PixelSpriteDef = {
  width: 34,
  height: 34,
  palette: {
    O: '#090d16', // deep dark outline
    K: '#1e293b', // charcoal pirate hat & eyepatch
    H: '#0f172a', // dark hat trim
    W: '#f8fafc', // skull & eye white
    G: '#eab308', // weathered gold hat/guard
    Y: '#f59e0b', // warm potato highlight
    T: '#d97706', // main potato skin
    B: '#92400e', // earthy potato shade
    D: '#78350f', // deep potato shadow / boots
    S: '#475569', // sad heavy eyelid & eye bag
    E: '#020617', // pupil
    C: '#38bdf8', // depressive tear
    L: '#bae6fd', // tear glint
    I: '#94a3b8', // somber steel blade highlight
    M: '#334155', // somber steel dark
    R: '#dc2626', // blood stain on sword
    V: '#991b1b', // deep blood clot
  },
  frames: [
    // Frame 0: Standing gloomy with bloody sword raised
    [
      '...........OOOOOOOOOOOO...........',
      '.........OOKKKKKKKKKKKKOO.........',
      '........OKKKKKKWWWWKKKKKKO........',
      '.......OKKKKKKWWKKWWKKKKKKO.......',
      '......OKKKKKKKKWWWWKKKKKKKKO......',
      '.....OOGGGGGGGGGGGGGGGGGGGGOO.....',
      '....OHHHHHHHHHHHHHHHHHHHHHHHHO.OO.',
      '.....OOOOOOOTTTTTTTTOOOOOOOO..OIIO',
      '.......OOTYYYYYYYYYYYYYTOO....OIRO',
      '......OTYYYYYYYTTTYYYYYYYTO...OIMO',
      '.....OTYYKKKKKYYYYYYYYYYYTO...ORMO',
      '....OTYYKKKKKKKYYYSSSSSYYTO...ORIO',
      '....OTYYKKKKKKKYYYEWWWSYYTO...OIRO',
      '....OTYYKKKKKKKYYYSCCSSYYTO...OIMO',
      '....OTTTYYKKKYYYYYSLCLLYYTO...ORMO',
      '....OTTTTYYYYYYBBBYYCCYYYTO...OVRO',
      '....OTTTYYYYOOOOOOOOYYYYYTO...OIMO',
      '....OTTYYYYOOYYYYYYOOYYYYTO...ORIO',
      '....OTTTYYOYYBBBBBBYYOYYYTO...OIMO',
      '....OBTTTYYYYBBBBBBYYYYTTBO...OIMO',
      '....OBTTTTYYYYYYYYYYYYTTTBOOOOOOGG',
      '.....OBTTTTTYYYYYYYYTTTTTBOOOTYYOO',
      '.....OOBBBTTTTTTTTTTTTBBBOO.OOGGOO',
      '......OOBBBBBBBBBBBBBBBBOO....OO..',
      '.......OOBBBBBBBBBBBBBBOO.........',
      '........OODDDDDDDDDDDDOO..........',
      '.........OOOOOOOOOOOOOO...........',
      '..........OOO......OOO............',
      '.........OOOO......OOOO...........',
      '..................................',
      '..................................',
      '..................................',
      '..................................',
      '..................................',
    ],
    // Frame 1: Heavy depressive sigh & dripping bloody blade
    [
      '..................................',
      '...........OOOOOOOOOOOO...........',
      '.........OOKKKKKKKKKKKKOO.........',
      '........OKKKKKKWWWWKKKKKKO........',
      '.......OKKKKKKWWKKWWKKKKKKO.......',
      '......OKKKKKKKKWWWWKKKKKKKKO......',
      '.....OOGGGGGGGGGGGGGGGGGGGGOO..OO.',
      '....OHHHHHHHHHHHHHHHHHHHHHHHHOOIIO',
      '.....OOOOOOOTTTTTTTTOOOOOOOO..OIRO',
      '.......OOTYYYYYYYYYYYYYTOO....OIMO',
      '......OTYYKKKKKYYYYYYYYYYTO...ORMO',
      '.....OTYYKKKKKKKYYYSSSSSYYTO..ORIO',
      '....OTYYKKKKKKKYYYEWWWSYYTO...OIRO',
      '....OTYYKKKKKKKYYYSCCSSYYTO...OIMO',
      '....OTTTYYKKKYYYYYSCCLLYYTO...ORMO',
      '....OTTTTYYYYYYBBBYYLCYYYTO...OVRO',
      '....OTTTYYYYOOOOOOOOYYYYYTO...OIMO',
      '....OTTYYYYOOYYYYYYOOYYYYTO...ORIO',
      '....OTTTYYOYYBBBBBBYYOYYYTO...OIMO',
      '....OBTTTYYYYBBBBBBYYYYTTBO...OIMO',
      '....OBTTTTYYYYYYYYYYYYTTTBOOOOOOGG',
      '.....OBTTTTTYYYYYYYYTTTTTBOOOTYYOO',
      '.....OOBBBTTTTTTTTTTTTBBBOO.OOGGOO',
      '......OOBBBBBBBBBBBBBBBBOO..R.OO..',
      '.......OOBBBBBBBBBBBBBBOO.........',
      '........OODDDDDDDDDDDDOO..........',
      '.........OOOOOOOOOOOOOO...........',
      '..........OOO......OOO............',
      '.........OOOO......OOOO...........',
      '..................................',
      '..................................',
      '..................................',
      '..................................',
      '..................................',
    ],
  ],
};

export type BossMood = 'happy' | 'bruised_happy' | 'bruised_sad';

/**
 * Draws crisp pixel-level bruises, band-aids, tears, and smiles onto boss sprites
 * on the Victory Screen depending on which ending the player earned.
 */
export function drawBossMoodOverlay(
  ctx: CanvasRenderingContext2D,
  bossId: 'spider' | 'king' | 'cactus',
  scale: number,
  mood: BossMood
): void {
  const px = (x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(x * scale, y * scale, w * scale, h * scale);
  };

  if (bossId === 'spider') {
    if (mood === 'bruised_happy' || mood === 'bruised_sad') {
      // Purple bruise + white cross bandage on Spider forehead/cheek
      px(10, 8, 2, 2, '#6b21a8');
      px(14, 5, 4, 2, '#fef3c7');
      px(15, 5, 2, 2, '#f8fafc');
    }
    if (mood === 'bruised_sad') {
      // Streaming pixel tears & frown
      px(11, 9, 1, 3, '#38bdf8');
      px(16, 9, 1, 3, '#38bdf8');
      px(12, 11, 4, 1, '#090d16');
    } else {
      // Warm cheerful smile & rosy cheeks
      px(10, 9, 2, 1, '#fb7185');
      px(16, 9, 2, 1, '#fb7185');
      px(12, 10, 1, 1, '#ffffff');
      px(13, 11, 2, 1, '#ffffff');
      px(15, 10, 1, 1, '#ffffff');
    }
    return;
  }

  if (bossId === 'king') {
    if (mood === 'bruised_happy' || mood === 'bruised_sad') {
      // Bruise on cheek + bandage on forehead
      px(8, 8, 2, 2, '#7e22ce');
      px(17, 5, 4, 2, '#fef3c7');
      px(18, 5, 2, 2, '#ffffff');
    }
    if (mood === 'bruised_sad') {
      // Tears from sky eyes & sad mouth
      px(11, 8, 2, 3, '#38bdf8');
      px(19, 8, 2, 3, '#38bdf8');
      px(14, 10, 4, 1, '#0f172a');
      px(13, 11, 1, 1, '#0f172a');
      px(18, 11, 1, 1, '#0f172a');
    } else {
      // Joyful warm smile in white beard
      px(13, 9, 1, 1, '#0f172a');
      px(14, 10, 4, 1, '#0f172a');
      px(18, 9, 1, 1, '#0f172a');
      px(10, 9, 2, 1, '#fda4af');
      px(20, 9, 2, 1, '#fda4af');
    }
    return;
  }

  // Cactus Piko
  if (mood === 'bruised_happy' || mood === 'bruised_sad') {
    px(5, 9, 2, 2, '#7e22ce');
    px(10, 4, 4, 2, '#fef3c7');
    px(11, 4, 2, 2, '#ffffff');
  }
  if (mood === 'bruised_sad') {
    px(7, 9, 1, 3, '#38bdf8');
    px(12, 9, 1, 3, '#38bdf8');
    px(8, 11, 4, 1, '#090d16');
    px(7, 12, 1, 1, '#090d16');
    px(12, 12, 1, 1, '#090d16');
  } else {
    px(6, 10, 2, 1, '#f472b6');
    px(12, 10, 2, 1, '#f472b6');
    px(8, 10, 1, 1, '#090d16');
    px(9, 11, 2, 1, '#090d16');
    px(11, 10, 1, 1, '#090d16');
  }
}

export function drawPixelSprite(
  ctx: CanvasRenderingContext2D,
  sprite: PixelSpriteDef,
  x: number,
  y: number,
  scale: number,
  frameIdx = 0,
  paletteOverride?: SpritePalette
): void {
  const frame = sprite.frames[frameIdx % sprite.frames.length];
  const pal = paletteOverride ? { ...sprite.palette, ...paletteOverride } : sprite.palette;
  const rx = Math.round(x);
  const ry = Math.round(y);

  for (let row = 0; row < frame.length; row++) {
    const line = frame[row];
    for (let col = 0; col < line.length; col++) {
      const ch = line[col];
      if (ch === '.') continue;
      const color = pal[ch];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(rx + col * scale, ry + row * scale, scale, scale);
    }
  }
}
