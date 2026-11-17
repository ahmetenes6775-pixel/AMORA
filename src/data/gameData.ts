import { VoiceType } from '../audio/soundEngine';
import {
  CACTUS_BOSS_SPRITE,
  KING_BOSS_SPRITE,
  PIRATE_POTATO_BOSS_SPRITE,
  PixelSpriteDef,
  SPIDER_BOSS_SPRITE,
} from '../sprites/pixelSprites';

export type BossId = 'spider' | 'king' | 'cactus' | 'pirate_potato';

export type EndingKind = 'ALL_SPARE' | 'ALL_FIGHT' | 'MIXED' | 'SECRET_PIRATE';

export const ENDING_CATALOG: Array<{
  id: EndingKind;
  shortLabel: string;
  title: string;
}> = [
  { id: 'ALL_SPARE', shortLabel: 'Barış', title: 'Hepsini Bağışla' },
  { id: 'ALL_FIGHT', shortLabel: 'Savaşçı', title: 'Hepsini Yen' },
  { id: 'MIXED', shortLabel: 'Karma', title: 'Karışık Son' },
  { id: 'SECRET_PIRATE', shortLabel: 'Patates', title: 'Gizli AROMA Bossu' },
];

export interface ActOption {
  id: string;
  label: string;
  narratorText: string;
  bossReply: string;
  mercyGain: number;
}

export interface BossConfig {
  id: BossId;
  chapterTitle: string;
  name: string;
  title: string;
  maxHp: number;
  atk: number;
  def: number;
  voice: VoiceType;
  sprite: PixelSpriteDef;
  spriteScale: number;
  accentColor: string;
  soulMode: 'red' | 'purple_web';
  introText: string;
  introBubble: string;
  checkText: string;
  acts: ActOption[];
  spareThreshold: number;
  turnQuotes: string[];
  hurtQuotes: string[];
  spareReadyQuote: string;
  sparedText: string;
  defeatedText: string;
  mercyDisabled?: boolean;
}

export interface GameItem {
  id: string;
  name: string;
  heal: number;
  description: string;
}

export const INITIAL_ITEMS: GameItem[] = [
  {
    id: 'cloud_cake',
    name: 'Bulut Keki',
    heal: 8,
    description: 'Pofuduk gökyüzü kremalı kek. +8 CAN iyileştirir.',
  },
  {
    id: 'star_tea',
    name: 'Yıldız Çayı',
    heal: 10,
    description: 'Ilık ışıkla parlayan çay. +10 CAN iyileştirir.',
  },
  {
    id: 'sky_cookie',
    name: 'Gök Kurabiyesi',
    heal: 7,
    description: 'Çıtır yıldız şekerli kurabiye. +7 CAN iyileştirir.',
  },
];

export const FINAL_BOSS_BONUS_ITEM: GameItem = {
  id: 'rainbow_sherbet',
  name: 'Gökkuşağı Şerbeti',
  heal: 10,
  description: 'Son savaş için ekstra +10 CAN veren gökyüzü nektarı.',
};

export const BONUS_QUEST_ITEM: GameItem = {
  id: 'golden_sky_apple',
  name: 'Altın Gök Elması',
  heal: 16,
  description: 'Bulut Bulmacası ödülü! +16 CAN iyileştirir.',
};

export const BOSSES: Record<BossId, BossConfig> = {
  spider: {
    id: 'spider',
    chapterTitle: 'BÖLÜM 1 · İPEK BULUTLARI',
    name: 'Arakna',
    title: 'Bulutların İpek Dokuyucusu',
    maxHp: 90,
    atk: 4,
    def: 2,
    voice: 'spider',
    sprite: SPIDER_BOSS_SPRITE,
    spriteScale: 6,
    accentColor: '#c084fc',
    soulMode: 'purple_web',
    introText: '* İpek Bulutlarının örümceği Arakna gökten ağlarıyla indi!',
    introBubble: 'Ahuhu~ Gökyüzü çay partime izinsiz mi geldin küçük yolcu?',
    checkText: '* ARAKNA - SALDIRI 4  SAVUNMA 2\n* Yıldız ipekleriyle bulutları birbirine bağlar. Çay ve övgüyü sever.',
    spareThreshold: 3,
    acts: [
      {
        id: 'praise',
        label: 'Ağını Öv',
        narratorText: '* Arakna\'nın yıldız ipeğinden ördüğü desenlere hayran kaldığını söyledin.',
        bossReply: 'Ahuhu! Demek sanatımı anlıyorsun? Belki o kadar da kaba değilsin~',
        mercyGain: 1,
      },
      {
        id: 'dance',
        label: 'Ağda Dans Et',
        narratorText: '* Mor iplerin üzerinde ritimle zıplamaya başladın!',
        bossReply: 'Vay canına, ayakların ipeklerime tam uyum sağladı! Eğlenceli!',
        mercyGain: 1,
      },
      {
        id: 'tea',
        label: 'Çay İste',
        narratorText: '* Kibar bir şekilde bir fincan bulut çayı rica ettin.',
        bossReply: 'Bir misafir nezaket kurallarını biliyormuş! Bir fincan hak ettin~',
        mercyGain: 1,
      },
    ],
    turnQuotes: [
      'Ağlarımda sıkışmak aslında çok rahattır, ahuhu~',
      'İpeklerim rüzgardan bile güçlüdür, dikkat et!',
      'Altı bacakla dans etmek senin iki ayağından kolay!',
      'Yıldız tozu biraz yapışkan olabilir, kusura bakma~',
    ],
    hurtQuotes: [
      'Hey! Yeni ütülediğim ipek pelerinimi yırttın!',
      'Ahuhu... hiç kibar değilmişsin!',
    ],
    spareReadyQuote: 'Biliyor musun? Çok tatlı bir misafirsin. Geçebilirsin~',
    sparedText: '* Arakna gülümseyerek yıldız ipeklerini kenara çekti! (BAĞIŞLANDI)',
    defeatedText: '* Arakna ağlarını toplayıp karanlık bulutların ardına çekildi...',
  },
  king: {
    id: 'king',
    chapterTitle: 'BÖLÜM 2 · ALTIN TAHT',
    name: 'Kral Aether',
    title: 'Gök Krallığının Hükümdarı',
    maxHp: 140,
    atk: 6,
    def: 4,
    voice: 'king',
    sprite: KING_BOSS_SPRITE,
    spriteScale: 6,
    accentColor: '#facc15',
    soulMode: 'red',
    introText: '* Gök Kralı Aether altın mızrağını kavradı! Taht odasında rüzgar uğulduyor.',
    introBubble: 'Küçük gezgin... Gök Kapısını korumak benim görevim. Hazır mısın?',
    checkText: '* KRAL AETHER - SALDIRI 6  SAVUNMA 4\n* Yıllardır sönen yıldızların yasını tutan merhametli ama kararlı bir kral.',
    spareThreshold: 3,
    acts: [
      {
        id: 'bow',
        label: 'Saygıyla Eğil',
        narratorText: '* Gök Kralı\'nın önünde saygıyla eğildin. Kötü bir niyetin olmadığını gösterdin.',
        bossReply: '...Gözlerinde kötülük görmüyorum evlat. Ama yine de test edilmelisin.',
        mercyGain: 1,
      },
      {
        id: 'talk',
        label: 'Yıldızlardan Bahset',
        narratorText: '* Sönen yıldızları geri getirmek istediğini, gökyüzünü sevdiğini anlattın.',
        bossReply: 'Eskiden bu bulutlar şarkılarla doluydu... Sesin bana eski dostlarımı hatırlattı.',
        mercyGain: 1,
      },
      {
        id: 'mercy_plea',
        label: 'Barış İste',
        narratorText: '* Savaşmak istemediğini, sadece eve giden yolu aradığını söyledin.',
        bossReply: 'Ah... Mızrağım bugün çok ağır geliyor. Belki de kapıyı açma vakti gelmiştir.',
        mercyGain: 2,
      },
    ],
    turnQuotes: [
      'Affet beni... Gök yasaları bunu gerektiriyor.',
      'Altın mızrağın ışığından kaçabilecek misin?',
      'Gökyüzü hala umudunu kaybetmedi!',
      'Yüreğin tıpkı eski yıldızlar gibi parlıyor.',
    ],
    hurtQuotes: [
      'Güçlü bir darbeydi... ama kral diz çökmez!',
      'Demek seçimin savaşmak... Öyleyse tüm gücümle!',
    ],
    spareReadyQuote: 'Yeterince cesaret gösterdin gezgin. Seni durdurmayacağım.',
    sparedText: '* Kral Aether altın mızrağını indirdi ve sıcakça gülümsedi! (BAĞIŞLANDI)',
    defeatedText: '* Kral Aether tacı düşerken son bir kez gökyüzüne baktı...',
  },
  cactus: {
    id: 'cactus',
    chapterTitle: 'FİNAL BÖLÜMÜ · KÜÇÜK ZİRVE',
    name: 'Minik Kaktüs Piko',
    title: 'Gök Kapısının En Güçlü Son Muhafızı',
    maxHp: 185,
    atk: 8,
    def: 4,
    voice: 'cactus',
    sprite: CACTUS_BOSS_SPRITE,
    spriteScale: 6,
    accentColor: '#4ade80',
    soulMode: 'red',
    introText: '* İnanılmaz bir enerji yükseliyor! Karşındaki minik kaktüs aslında krallığın EN GÜÇLÜ son bossu!',
    introBubble: 'Demek Kral Aether\'i bile geçtin! Ama buradaki en güçlü güç benim! Boyuma aldanma!',
    checkText: '* MİNİK KAKTÜS PİKO (SON BOSS) - SALDIRI 8  SAVUNMA 4\n* Ufak boyutuna gizlenmiş devasa gökyüzü gücü! Ama kalbinde hala bir damla suya zaafı var.',
    spareThreshold: 4,
    acts: [
      {
        id: 'water',
        label: 'Su Ver',
        narratorText: '* Piko\'nun kurumuş saksısına birkaç damla serin bulut suyu döktün.',
        bossReply: 'B-bu çok serin! Ama hala çok tehlikeliyim, tamam mı?!',
        mercyGain: 1,
      },
      {
        id: 'compliment',
        label: 'Çok Korkunçsun De',
        narratorText: '* "Vay canına, ne kadar da devasa ve korkutucu bir kaktüssün!" dedin.',
        bossReply: 'Heh! Tabii ki öyleyim! Sonunda ciddiyetimi anlayan biri çıktı!',
        mercyGain: 1,
      },
      {
        id: 'sing',
        label: 'Ninni Söyle',
        narratorText: '* Ufak kaktüse tatlı bir gökyüzü melodisi mırıldandın.',
        bossReply: 'Bip... dikenlerim yumuşuyor... Hayır, uykum gelmedi... belki azıcık...',
        mercyGain: 2,
      },
    ],
    turnQuotes: [
      'Diken fırtınama hazır ol dev insan!!',
      'Kral Aether beni özellikle seçti! Yani... ben gönüllü oldum!',
      'Tepemdeki çiçek sadece süs değil, lazer anteni! (Şaka)',
      'Zıplama vaktiiiii! Piko saldırısı!',
    ],
    hurtQuotes: [
      'Ayy! Saksımı çatlatacaktın neredeyse!',
      'Beni hafife alma! Çok fena batabilirim!',
    ],
    spareReadyQuote: 'Tamam tamam, iyi birisin. Çiçeğim sana gülümsedi bile!',
    sparedText: '* Minik Kaktüs Piko tepesindeki pembe çiçeği sallayarak yolunu açtı! (BAĞIŞLANDI)',
    defeatedText: '* Minik Kaktüs Piko saksısının içine saklandı ve yapraklarını kapattı...',
  },
  pirate_potato: {
    id: 'pirate_potato',
    chapterTitle: 'GİZLİ BÖLÜM · KARANLIK GÜVERTE',
    name: 'Kaptan Patates',
    title: 'Dev Depresif Korsan Patates',
    maxHp: 300,
    atk: 6,
    def: 5,
    voice: 'pirate_potato',
    sprite: PIRATE_POTATO_BOSS_SPRITE,
    spriteScale: 6,
    accentColor: '#dc2626',
    soulMode: 'red',
    mercyDisabled: true,
    introText: '* Devasa, kasvetli bir gölge güverteyi sardı! Karşındaki kaktüsten bile güçlü: DEV DEPRESİF KORSAN PATATES!',
    introBubble: '...aroma kodunu mu çözdün? boşuna geldin. bu denizde ne neşe kaldı ne de merhamet.',
    checkText: '* KAPTAN PATATES (GİZLİ BOSS) - SALDIRI 6  SAVUNMA 5  CAN 300\n* Her bir parçacığı 6 hasar vurur. Kasvetli ve kanlı kılıcıyla BAĞIŞLA seçeneğini yok eder.',
    spareThreshold: 99,
    acts: [
      {
        id: 'console',
        label: 'Teselli Et',
        narratorText: '* Dev patatese hala umut olduğunu söylemeye çalıştın.',
        bossReply: '...umut mu? çuvalın dibinde çürüyen bir masal sadece. kılıcım konuşacak.',
        mercyGain: 0,
      },
      {
        id: 'salute',
        label: 'Korsan Selamı Ver',
        narratorText: '* Saygıyla korsan selamı verdin.',
        bossReply: '...hmm. en azından terbiyeli bir rakipsin. ama merhamet yok!',
        mercyGain: 0,
      },
      {
        id: 'sword',
        label: 'Kılıca Bak',
        narratorText: '* Kasvetli ve kanlı kılıcından gözyaşları süzülüyor gibi görünüyor.',
        bossReply: 'bu kılıç çok savaş gördü... bırak da son dansımız çalsın.',
        mercyGain: 0,
      },
    ],
    turnQuotes: [
      '...dalgalar bile benden sıkıldı, yine de düşmeyeceğim.',
      'tek gözüm karanlığı, diğer gözüm gözyaşını görür...',
      'kanlı kılıcım paslandı sanma küçük gezgin!',
      'üç yüz canlık yalnızlığımı aşabilecek misin?',
    ],
    hurtQuotes: [
      '...ahh. kabuğum serttir ama acı hala aynı...',
      'güzel vuruş... ama bir korsan kolay devrilmez!',
    ],
    spareReadyQuote: '...merhamet bu gemide yok.',
    sparedText: '* ...',
    defeatedText: '* Dev Korsan Patates diz çöktü, kanlı kılıcını indirdi ve ilk kez hafifçe gülümsedi...',
  },
};

export const STORY_SLIDES = [
  {
    title: 'EFSANE',
    text: 'Çok uzun zaman önce, gökyüzünün en yüksek bulutlarının üstünde AMORA adında bir krallık vardı.',
    accent: '#facc15',
  },
  {
    title: 'SÖNEN YILDIZLAR',
    text: 'Bir gece göğün ışıkları soldu. Büyük rüzgar seni bulutların arasındaki unutulmuş adalara savurdu.',
    accent: '#38bdf8',
  },
  {
    title: 'GÖK KAPISI',
    text: 'Eve dönebilmek için Üç Gök Muhafızını aşmalı ve Gök Kapısını açmalısın. Ama unutma: Her kalp kılıçla değil, şefkatle de kazanılır.',
    accent: '#f472b6',
  },
];
