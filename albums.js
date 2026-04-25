// Mr. Children (ミスターチルドレン) Complete Studio Album Discography
// Compiled for karaoke tracking website
// Note: Album artwork not available due to copyright — use placeholder colored images.
//
// CORRECTION NOTE: The user's list named album #17 as "重力と息吹 (2017)".
// The actual title is "重力と呼吸" and was released on October 3, 2018, not 2017.

const ALBUMS = [
  {
    id: "everything",
    title: "Everything",
    titleJa: "Everything",
    year: 1992,
    color: "#4A90D9",
    artwork: "artwork not available",
    tracks: [
      "ロード・アイ・ミス・ユー",
      "Mr.Shining Moon",
      "君がいた夏",
      "風 ～The wind knows how I feel～",
      "ためいきの日曜日",
      "友達のままで",
      "CHILDREN'S WORLD"
    ]
  },
  {
    id: "kind-of-love",
    title: "Kind of Love",
    titleJa: "Kind of Love",
    year: 1992,
    color: "#E8A0BF",
    artwork: "artwork not available",
    tracks: [
      "虹の彼方へ",
      "All by myself",
      "BLUE",
      "抱きしめたい",
      "グッバイ・マイ・グルーミーデイズ",
      "Distance",
      "車の中でかくれてキスをしよう",
      "思春期の夏～君との恋が今も牧場に～",
      "星になれたら",
      "ティーンエイジ・ドリーム（I～II）",
      "いつの日にか二人で"
    ]
  },
  {
    id: "versus",
    title: "Versus",
    titleJa: "Versus",
    year: 1993,
    color: "#2C3E50",
    artwork: "artwork not available",
    tracks: [
      "Another Mind",
      "メインストリートに行こう",
      "and I close to you",
      "Replay",
      "マーマレード・キッス",
      "蜃気楼",
      "逃亡者",
      "LOVE",
      "さよならは夢の中へ",
      "my life"
    ]
  },
  {
    id: "atomic-heart",
    title: "Atomic Heart",
    titleJa: "Atomic Heart",
    year: 1994,
    color: "#E74C3C",
    artwork: "artwork not available",
    tracks: [
      "Printing",
      "Dance Dance Dance",
      "ラヴ コネクション",
      "Innocent World",
      "クラスメイト",
      "Cross Road",
      "ジェラシー",
      "Asia",
      "Rain",
      "雨のち晴れ",
      "Round About ～孤独の肖像～",
      "Over"
    ]
  },
  {
    id: "shinkai",
    title: "深海",
    titleJa: "深海",
    year: 1996,
    color: "#1A5276",
    artwork: "artwork not available",
    tracks: [
      "Dive",
      "シーラカンス",
      "手紙",
      "ありふれたLove Story ～男女問題はいつも面倒だ～",
      "Mirror",
      "Making Songs",
      "名もなき詩",
      "So Let's Get Truth",
      "臨時ニュース",
      "マシンガンをぶっ放せ",
      "ゆりかごのある丘から",
      "虜",
      "花 -Memento-Mori-",
      "深海"
    ]
  },
  {
    id: "bolero",
    title: "bolero",
    titleJa: "bolero",
    year: 1997,
    color: "#8E44AD",
    artwork: "artwork not available",
    tracks: [
      "Prologue",
      "Everything (It's you)",
      "タイムマシーンに乗って",
      "Brandnew my lover",
      "[es] ～Theme of es～",
      "シーソーゲーム ～勇敢な恋の歌～",
      "傘の下の君に告ぐ",
      "ALIVE",
      "幸せのカテゴリー",
      "everybody goes ～秩序のない現代にドロップキック～",
      "ボレロ",
      "Tomorrow never knows (remix)"
    ]
  },
  {
    id: "discovery",
    title: "Discovery",
    titleJa: "Discovery",
    year: 1999,
    color: "#27AE60",
    artwork: "artwork not available",
    tracks: [
      "DISCOVERY",
      "光の射す方へ",
      "Prism",
      "アンダーシャツ",
      "ニシエヒガシエ",
      "Simple",
      "I'LL BE",
      "#2601",
      "ラララ",
      "終わりなき旅",
      "Image"
    ]
  },
  {
    id: "q",
    title: "Q",
    titleJa: "Q",
    year: 2000,
    color: "#F39C12",
    artwork: "artwork not available",
    tracks: [
      "CENTER OF UNIVERSE",
      "その向こうへ行こう",
      "NOT FOUND",
      "スロースターター",
      "Surrender",
      "つよがり",
      "十二月のセントラルパークブルース",
      "友とコーヒーと嘘と胃袋",
      "ロードムービー",
      "Everything is made from a dream",
      "口笛",
      "Hallelujah",
      "安らげる場所"
    ]
  },
  {
    id: "its-a-wonderful-world",
    title: "It's a Wonderful World",
    titleJa: "It's a Wonderful World",
    year: 2002,
    color: "#16A085",
    artwork: "artwork not available",
    tracks: [
      "overture",
      "蘇生",
      "Dear wonderful world",
      "one two three",
      "渇いたkiss",
      "youthful days",
      "ファスナー",
      "Bird Cage",
      "LOVE はじめました",
      "UFO",
      "Drawing",
      "君が好き",
      "いつでも微笑みを",
      "優しい歌",
      "It's a Wonderful World"
    ]
  },
  {
    id: "shifukunooto",
    title: "シフクノオト",
    titleJa: "シフクノオト",
    year: 2004,
    color: "#D4AC0D",
    artwork: "artwork not available",
    tracks: [
      "言わせてみてぇもんだ",
      "PADDLE",
      "掌",
      "くるみ",
      "花言葉",
      "Pink～奇妙な夢",
      "血の管",
      "空風の帰り道",
      "Any",
      "天頂バス",
      "タガタメ",
      "HERO"
    ]
  },
  {
    id: "i-love-u",
    title: "I ♥ U",
    titleJa: "I ♥ U",
    year: 2005,
    color: "#C0392B",
    artwork: "artwork not available",
    tracks: [
      "Worlds end",
      "Monster",
      "未来",
      "僕らの音",
      "and I love you",
      "靴ひも",
      "CANDY",
      "ランニングハイ",
      "Sign",
      "Door",
      "跳べ",
      "隔たり",
      "潜水"
    ]
  },
  {
    id: "home",
    title: "HOME",
    titleJa: "HOME",
    year: 2007,
    color: "#6D4C41",
    artwork: "artwork not available",
    tracks: [
      "叫び 祈り",
      "Wake me up!",
      "彩り",
      "箒星",
      "Another Story",
      "PIANO MAN",
      "もっと",
      "やわらかい風",
      "フェイク",
      "ポケット カスタネット",
      "SUNRISE",
      "しるし",
      "通り雨",
      "あんまり覚えてないや"
    ]
  },
  {
    id: "supermarket-fantasy",
    title: "SUPERMARKET FANTASY",
    titleJa: "SUPERMARKET FANTASY",
    year: 2008,
    color: "#E67E22",
    artwork: "artwork not available",
    tracks: [
      "終末のコンフィデンスソング",
      "HANABI",
      "エソラ",
      "声",
      "少年",
      "旅立ちの唄",
      "口がすべって",
      "水上バス",
      "東京",
      "ロックンロール",
      "羊、吠える",
      "風と星とメビウスの輪",
      "GIFT",
      "花の匂い"
    ]
  },
  {
    id: "sense",
    title: "SENSE",
    titleJa: "SENSE",
    year: 2010,
    color: "#1F618D",
    artwork: "artwork not available",
    tracks: [
      "I",
      "擬態",
      "HOWL",
      "I'm talking about Lovin'",
      "365日",
      "ロックンロールは生きている",
      "ロザリータ",
      "蒼",
      "fanfare",
      "ハル",
      "Prelude",
      "Forever"
    ]
  },
  {
    id: "an-imitation-blood-orange",
    title: "[(an imitation) blood orange]",
    titleJa: "[(an imitation) blood orange]",
    year: 2012,
    color: "#E8450A",
    artwork: "artwork not available",
    tracks: [
      "Hypnosis",
      "Marshmallow Day",
      "End of the Day",
      "常套句",
      "Pieces",
      "イミテーションの木",
      "かぞえうた",
      "インマイタウン",
      "過去と未来と交信する男",
      "Happy Song",
      "祈り ～涙の軌道"
    ]
  },
  {
    id: "reflection-naked",
    title: "REFLECTION {Naked}",
    titleJa: "REFLECTION {Naked}",
    year: 2015,
    color: "#2E4057",
    artwork: "artwork not available",
    tracks: [
      "fantasy",
      "FIGHT CLUB",
      "斜陽",
      "Melody",
      "蜘蛛の糸",
      "I Can Make It",
      "ROLLIN' ROLLING ～一見は百聞に如かず",
      "放たれる",
      "街の風景",
      "運命",
      "足音 ～Be Strong",
      "忘れ得ぬ人",
      "You make me happy",
      "Jewelry",
      "REM",
      "WALTZ",
      "進化論",
      "幻聴",
      "Reflection",
      "遠くへと",
      "I wanna be there",
      "Starting Over",
      "未完"
    ]
  },
  {
    id: "juryoku-to-kokyu",
    title: "重力と呼吸",
    titleJa: "重力と呼吸",
    // NOTE: The user's list says "重力と息吹 (2017)" — the correct title is
    // "重力と呼吸" (Juuryoku to Kokyuu) released on October 3, 2018.
    year: 2018,
    color: "#566573",
    artwork: "artwork not available",
    tracks: [
      "Your Song",
      "海にて、心は裸になりたがる",
      "SINGLES",
      "here comes my love",
      "箱庭",
      "addiction",
      "day by day（愛犬クルの物語）",
      "秋がくれた切符",
      "himawari",
      "皮膚呼吸"
    ]
  },
  {
    id: "soundtracks",
    title: "SOUNDTRACKS",
    titleJa: "SOUNDTRACKS",
    year: 2020,
    color: "#1ABC9C",
    artwork: "artwork not available",
    tracks: [
      "DANCING SHOES",
      "Brand new planet",
      "turn over?",
      "君と重ねたモノローグ",
      "losstime",
      "Documentary film",
      "Birthday",
      "others",
      "The song of praise",
      "memories"
    ]
  },
  {
    id: "miss-you",
    title: "miss you",
    titleJa: "miss you",
    year: 2023,
    color: "#7D6608",
    artwork: "artwork not available",
    tracks: [
      "I MISS YOU",
      "Fifty's map ～おとなの地図",
      "青いリンゴ",
      "Are you sleeping well without me?",
      "LOST",
      "アート=神の見えざる手",
      "雨の日のパレード",
      "Party is over",
      "We have no time",
      "ケモノミチ",
      "黄昏と積み木",
      "deja-vu",
      "おはよう"
    ]
  }
];

// Helper: total track count across all albums
const totalTracks = ALBUMS.reduce((sum, album) => sum + album.tracks.length, 0);

module.exports = { ALBUMS, totalTracks };
