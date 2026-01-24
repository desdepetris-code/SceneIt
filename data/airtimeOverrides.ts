/**
 * CineMontauge Owner-Provided Airtime Overrides
 * 
 * This is the source of truth for all manual airtime entries provided via chat.
 * Priorities: 1. Specific Episode Key (e.g. S27E10) | 2. Show Default Time
 */
export const AIRTIME_OVERRIDES: Record<number, { 
    provider: string; 
    time?: string;
    episodes?: Record<string, string>;
}> = {
    // --- BATCH 1 (1-24) ---
    2734: { provider: "NBC", time: "9:00 pm ET / 6:00 pm PT" },
    1416: { provider: "ABC", time: "10:00 pm ET / 7:00 pm PT" },
    549: { provider: "NBC", time: "8:00 pm ET / 5:00 pm PT" },
    62650: { provider: "NBC", time: "8:00 pm ET / 7:00 pm CT" },
    12786: { provider: "CBC / BritBox", time: "8:00 pm ET / 5:00 pm PT" },
    130464: { provider: "Hulu", time: "12:00 am ET / 9:00 pm PT" },
    1667: { provider: "NBC / Peacock", time: "11:29 pm ET / 8:29 pm PT" },
    250307: { provider: "HBO Max", time: "9:00 pm ET / 6:00 pm PT" },
    63770: { provider: "CBS", time: "11:35 pm ET / 10:35 pm CT" },
    61818: { provider: "NBC / Peacock", time: "12:35 am ET / 9:35 pm PT" },
    220150: { provider: "Netflix", time: "3:00 am ET / 12:00 am PT" },
    89456: { provider: "Adult Swim / Max", time: "12:00 am ET / 9:00 pm PT" },
    2224: { provider: "Comedy Central / Paramount+", time: "11:00 pm ET / 8:00 pm PT" },
    58841: { provider: "NBC / Peacock", time: "10:00 pm ET / 7:00 pm PT" },
    22: { provider: "Bravo / Peacock", time: "11:00 pm ET / 8:00 pm PT" },
    75219: { provider: "FOX / Hulu", time: "8:00 pm ET / 5:00 pm PT" },
    72879: { provider: "TF1 / MyTF1", time: "6:00 pm ET / 3:00 pm PT" },
    302463: { provider: "TelevisaUnivision / vIX", time: "7:00 pm ET / 4:00 pm PT" },
    70672: { provider: "KBS / KBS World", time: "8:00 pm ET / 5:00 pm PT" },
    61859: { provider: "AMC / Streaming", time: "9:00 pm ET / 6:00 pm PT" },
    1220: { provider: "BBC One / BritBox", time: "10:00 pm ET / 7:00 pm PT" },
    // Removed duplicate 65701 - consolidated in Batch 8 for Super Wings
    2912: { provider: "Syndication / Hulu", time: "7:00 pm ET / 4:00 pm PT" },
    67063: { provider: "Crunchyroll", time: "12:00 am ET / 9:00 pm PT" },

    // --- BATCH 2 (25-49) ---
    37854: { provider: "Fuji TV", time: "9:30 am JST (Sun)" }, // One Piece
    63926: { provider: "TV Tokyo", time: "1:05 am JST (Tue)" }, // One-Punch Man
    211075: { provider: "tvN", time: "8:50 pm KST (Mon/Tue)" }, // Wedding Impossible
    1414: { provider: "HBO", time: "9:00 pm ET (Sun)" }, // Sex and the City
    95057: { provider: "The CW", time: "8:00 pm ET (Tue)" }, // Superman & Lois
    2322: { provider: "CBS", time: "9:00 pm ET (Wed)" }, // The Nanny
    65494: { provider: "Netflix", time: "3:00 am ET (Drop Day)" }, // The Crown
    77169: { provider: "Netflix", time: "3:00 am ET (Drop Day)" }, // Cobra Kai
    62688: { provider: "CBS", time: "8:00 pm ET (Mon)" }, // Supergirl
    118357: { provider: "Paramount+", time: "3:00 am ET (Weekly)" }, // Mayor of Kingstown
    63639: { provider: "Syfy", time: "10:00 pm ET (Wed)" }, // The Expanse
    13915: { provider: "TV Tokyo", time: "1:30 am JST (Mon)" }, // Natsume's Book of Friends
    254425: { provider: "MBS", time: "5:00 pm JST (Sun)" }, // Gachiakuta
    63333: { provider: "Netflix", time: "3:00 am ET (Drop Day)" }, // The Last Kingdom
    60585: { provider: "Prime Video", time: "3:00 am ET (Drop Day)" }, // Bosch
    62852: { provider: "Showtime", time: "9:00 pm ET (Sun)" }, // Billions
    3822: { provider: "Showtime", time: "10:00 pm ET (Mon)" }, // Weeds
    31362: { provider: "TV Tokyo", time: "7:00 pm JST (Wed)" }, // Inazuma Eleven
    39340: { provider: "FOX", time: "9:00 pm ET (Tue)" }, // New Girl
    1162: { provider: "CBS", time: "10:00 pm ET (Fri)" }, // Dallas
    11130: { provider: "MBC", time: "3:15 pm KST (Sat)" }, // Show! Music Core
    91363: { provider: "Apple TV+", time: "12:00 am ET (Weekly)" }, // Slow Horses
    11366: { provider: "Channel 4", time: "9:00 pm GMT (Fri)" }, // Big Brother

    // --- BATCH 3 (User 1-23) ---
    1045: { provider: "ABC", time: "9:00 pm ET / 6:00 pm PT (Sat)" }, // The Love Boat
    31057: { provider: "Fuji TV", time: "7:00 pm JST (Sat)" }, // Ranma ½
    1982: { provider: "NBC", time: "9:00 pm ET / 6:00 pm PT (Fri)" }, // Miami Vice
    254848: { provider: "Tokyo MX", time: "10:00 pm JST (Sun)" }, // Sentenced to Be a Hero
    48675: { provider: "MBC M", time: "7:30 pm KST (Wed)" }, // Weekly Idol
    125988: { provider: "Apple TV+", time: "12:00 am ET (Fri)" }, // Silo
    76331: { provider: "HBO", time: "9:00 pm ET / 6:00 pm PT (Sun)" }, // Succession
    61304: { provider: "TNT", time: "9:00 pm ET / 6:00 pm PT (Sun)" }, // The Last Ship
    315: { provider: "CBS", time: "10:00 pm ET / 7:00 pm PT (Sun)" }, // Cold Case
    1970: { provider: "FOX", time: "9:00 pm ET / 6:00 pm PT (Thu)" }, // The O.C.
    3144: { provider: "Nickelodeon", time: "7:30 pm ET / 4:30 pm PT (Fri)" }, // The Fairly OddParents
    // Fixed Foundation ID: corrected from 94605 (Arcane collision) to 84958
    84958: { provider: "Apple TV+", time: "12:00 am ET (Fri)" }, // Foundation
    2127: { provider: "ABC", time: "7:30 pm ET / 4:30 pm PT (Thu)" }, // Batman
    457: { provider: "Syfy", time: "10:00 pm ET / 7:00 pm PT (Fri)" }, // Stargate Atlantis
    3505: { provider: "Much", time: "7:00 pm ET / 4:00 pm PT (Sun)" }, // Degrassi
    254820: { provider: "Netflix", time: "3:00 am ET (Drop Day)" }, // Culinary Class Wars
    46909: { provider: "The CW", time: "9:00 pm ET / 6:00 pm PT (Thu)" }, // The Originals
    43339: { provider: "AT-X", time: "11:00 pm JST (Sun)" }, // High School D×D
    114888: { provider: "SBS", time: "10:00 pm KST (Fri)" }, // Taxi Driver
    213233: { provider: "Sky Atlantic", time: "9:00 pm GMT (Fri)" }, // The Day of the Jackal
    10190: { provider: "BS11", time: "11:30 pm JST (Sat)" }, // Monogatari
    246549: { provider: "Rai 1", time: "9:30 pm CET (Mon)" }, // Sandokan
    97727: { provider: "bilibili", time: "10:00 am ET (Sat)" }, // The Daily Life of the Immortal King

    // --- BATCH 4 (52-65 from previous user list) ---
    67198: { provider: "Paramount+", time: "3:00 am ET (Thu)" }, // Star Trek: Discovery
    1568: { provider: "NBC", time: "9:30 pm ET (Thu)" }, // 30 Rock
    4002: { provider: "ABC", time: "8:00 pm ET (Mon)" }, // MacGyver
    4615: { provider: "NBC", time: "8:00 pm ET (Tue)" }, // The A-Team
    61418: { provider: "TNT", time: "8:00 pm ET (Sun)" }, // The Librarians
    42361: { provider: "Cinemax", time: "10:00 pm ET (Fri)" }, // Banshee
    31964: { provider: "MBS", time: "5:00 pm JST (Sun)" }, // Fullmetal Alchemist: Brotherhood
    104699: { provider: "NHK G", time: "10:00 pm JST (Sun)" }, // To Your Eternity
    52: { provider: "FOX", time: "8:00 pm ET (Tue)" }, // That '70s Show
    95: { provider: "The WB", time: "8:00 pm ET (Tue)" }, // Buffy the Vampire Slayer
    15451: { provider: "MTV", time: "8:00 pm ET (Fri)" }, // RuPaul's Drag Race
    33261: { provider: "History", time: "9:00 pm ET (Fri)" }, // Ancient Aliens
    401: { provider: "CBS", time: "8:00 pm ET (Fri)" }, // Ghost Whisperer
    120530: { provider: "Prime Video", time: "3:00 am ET (Fri)" }, // The Summer I Turned Pretty

    // --- BATCH 5 (24-50 from previous user lists) ---
    102903: { provider: "Hulu", time: "12:00 am ET / 9:00 pm PT (Tue)" }, // Only Murders in the Building
    69243: { provider: "Audience", time: "9:00 pm ET / 6:00 pm PT (Wed)" }, // Mr. Mercedes
    66074: { provider: "TV Tokyo", time: "11:30 pm JST (Wed)" }, // Re:ZERO
    67263: { provider: "Prime Video", time: "12:00 am ET / 9:00 pm PT (Drop Day)" }, // The Grand Tour
    15301: { provider: "ABC", time: "8:00 pm ET / 5:00 pm PT (Wed)" }, // The Middle
    3257: { provider: "CBS", time: "9:00 pm ET / 6:00 pm PT (Mon)" }, // M*A*S*H
    39265: { provider: "ABC", time: "9:00 pm ET / 6:00 pm PT (Thu)" }, // Scandal
    59345: { provider: "BBC One", time: "9:00 pm GMT (Wed)" }, // Shetland
    95843: { provider: "Tokyo MX", time: "12:00 am JST (Sun)" }, // Mushoku Tensei
    61571: { provider: "KBS2", time: "9:15 pm KST (Sun)" }, // The Return of Superman
    46114: { provider: "BBC One", time: "2:15 pm GMT (Fri)" }, // Father Brown
    121175: { provider: "Prime Video", time: "12:00 am ET / 9:00 pm PT (Drop Day)" }, // Hazbin Hotel
    62710: { provider: "NBC", time: "10:00 pm ET / 7:00 pm PT (Mon)" }, // Blindspot
    82856: { provider: "Disney+", time: "3:00 am ET / 12:00 am PT (Wed)" }, // The Mandalorian
    14353: { provider: "USA Network", time: "9:00 pm ET / 6:00 pm PT (Tue)" }, // White Collar
    62643: { provider: "The CW", time: "8:00 pm ET / 5:00 pm PT (Wed)" }, // DC's Legends of Tomorrow
    63351: { provider: "Netflix", time: "3:00 am ET / 12:00 am PT (Drop Day)" }, // Narcos
    88427: { provider: "CBS", time: "10:00 pm ET / 7:00 pm PT (Tue)" }, // FBI: Most Wanted
    3968: { provider: "CBC", time: "7:00 pm ET / 4:00 pm PT (Sun)" }, // Heartland
    31056: { provider: "Russia-1", time: "6:00 pm MSK (Sat)" }, // Masha and the Bear
    1972: { provider: "Syfy", time: "10:00 pm ET / 7:00 pm PT (Fri)" }, // Battlestar Galactica
    33: { provider: "HBO", time: "9:00 pm ET / 6:00 pm PT (Sun)" }, // Band of Brothers
    37671: { provider: "NBC", time: "8:00 pm ET / 5:00 pm PT (Mon)" }, // The Voice
    2262: { provider: "NBC", time: "9:00 pm ET / 6:00 pm PT (Fri)" }, // Dateline
    32693: { provider: "TV Tokyo", time: "6:00 pm JST (Fri)" }, // Sgt. Frog
    31: { provider: "CBS", time: "10:00 pm ET / 7:00 pm PT (Fri)" }, // The Twilight Zone
    2315: { provider: "UPN", time: "8:00 pm ET / 5:00 pm PT (Wed)" }, // Star Trek: Enterprise

    // --- BATCH 6 (79-100) - Removed duplicates from previous batches ---
    40075: { provider: "Disney Channel", time: "9:00 pm ET (Fri)" }, // Gravity Falls
    1222: { provider: "ABC", time: "8:30 pm ET (Thu)" }, // Bewitched

    // --- BATCH 7 (77-100 from latest user list) ---
    15260: { provider: "Cartoon Network", time: "7:00 pm ET / 4:00 pm PT (Fri)" }, // The Powerpuff Girls
    1910: { provider: "Discovery", time: "9:00 pm ET / 6:00 pm PT (Wed)" }, // MythBusters
    87834: { provider: "Citytv", time: "8:00 pm ET / 5:00 pm PT (Tue)" }, // Hudson & Rex
    97546: { provider: "Apple TV+", time: "12:00 am ET / 9:00 pm PT (Fri)" }, // Ted Lasso
    153094: { provider: "ABC", time: "8:00 pm ET / 5:00 pm PT (Tue)" }, // Will Trent
    92749: { provider: "Disney+", time: "3:00 am ET / 12:00 am PT (Wed)" }, // Moon Knight
    14272: { provider: "Netflix", time: "3:00 am ET / 12:00 am PT (Drop Day)" }, // House of Cards
    2392: { provider: "FOX", time: "8:00 pm ET / 5:00 pm PT (Thu)" }, // Hell's Kitchen
    4056: { provider: "Showtime", time: "10:30 pm ET / 7:30 pm PT (Sun)" }, // Californication
    62455: { provider: "TV Tokyo", time: "6:00 pm JST (Tue)" }, // Ace of the Diamond
    266491: { provider: "Kanal D", time: "8:00 pm TRT (Mon)" }, // Far Away (Uzak Şehir)
    1145: { provider: "CBS", time: "9:00 pm ET / 6:00 pm PT (Fri)" }, // Falcon Crest
    61852: { provider: "Nickelodeon", time: "8:00 pm ET / 5:00 pm PT (Sat)" }, // Henry Danger
    13936: { provider: "TV Tokyo", time: "6:00 pm JST (Wed)" }, // Yu-Gi-Oh! 5D's
    209706: { provider: "BBC Two", time: "9:00 pm GMT (Mon)" }, // The Boys from Brazil
    226343: { provider: "ABC", time: "8:00 pm ET / 5:00 pm PT (Sun)" }, // Tony Awards
    265: { provider: "NBC", time: "9:00 pm ET / 6:00 pm PT (Thu)" }, // Cheers
    2796: { provider: "ITV1", time: "8:00 pm GMT (Sun)" }, // Agatha Christie's Marple
    71694: { provider: "FX", time: "10:00 pm ET / 7:00 pm PT (Wed)" }, // Snowfall
    29918: { provider: "MBS", time: "1:25 am JST (Fri)" }, // Code Geass
    1928: { provider: "PBS", time: "9:00 pm ET / 6:00 pm PT (Wed)" }, // NOVA
    4344: { provider: "E4", time: "10:00 pm GMT (Thu)" }, // Skins
    10283: { provider: "FX", time: "10:00 pm ET / 7:00 pm PT (Wed)" }, // Archer
    19885: { provider: "BBC One", time: "9:00 pm GMT (Sun)" }, // Sherlock

    // --- BATCH 8 (51-76 from latest user list) ---
    94605: { provider: "Netflix", time: "3:00 am ET / 12:00 am PT (Drop Day)" }, // Arcane
    39352: { provider: "ITV1", time: "9:00 pm GMT / 4:00 pm ET (Sun)" }, // Vera
    4607: { provider: "Nickelodeon", time: "7:00 pm ET / 4:00 pm PT (Fri)" }, // iCarly
    1668: { provider: "Syndication", time: "8:00 pm ET / 5:00 pm PT (Mon)" }, // Xena
    117465: { provider: "HTB", time: "5:00 pm JST (Wed)" }, // BLUE LOCK
    44006: { provider: "TV Tokyo", time: "9:00 am JST (Sat)" }, // Cardfight!! Vanguard
    32692: { provider: "ABC Family", time: "8:00 pm ET / 5:00 pm PT (Tue)" }, // Pretty Little Liars
    79744: { provider: "The CW", time: "9:00 pm ET / 6:00 pm PT (Thu)" }, // Legacies
    157741: { provider: "Prime Video", time: "3:00 am ET / 12:00 am PT (Fri)" }, // Gen V
    136311: { provider: "Netflix", time: "3:00 am ET / 12:00 am PT (Drop Day)" }, // Single's Inferno
    65701: { provider: "iQiyi", time: "8:00 am CST (Sat)" }, // Super Wings
    66802: { provider: "CBS", time: "9:00 pm ET / 6:00 pm PT (Mon)" }, // Bull
    34307: { provider: "TNT", time: "9:00 pm ET / 6:00 pm PT (Sun)" }, // Rizzoli & Isles
    61005: { provider: "FX", time: "10:00 pm ET / 7:00 pm PT (Mon)" }, // The Strain
    1429: { provider: "MBS", time: "1:00 am JST (Sun)" }, // Attack on Titan
    // Fixed What If...? ID: corrected from 84958 (Foundation collision) to 91741
    91741: { provider: "Disney+", time: "3:00 am ET / 12:00 am PT (Wed)" }, // What If...?
    1405: { provider: "NBC", time: "8:00 pm ET / 5:00 pm PT (Thu)" }, // Chuck
    1407: { provider: "HBO", time: "10:00 pm ET / 7:00 pm PT (Sun)" }, // Entourage
    45782: { provider: "Gunma TV", time: "1:00 am JST (Sun)" }, // Sword Art Online
    22980: { provider: "The Family Channel", time: "8:00 pm ET / 5:00 pm PT (Sat)" }, // Zorro (1990)
    // Fixed Little House ID: corrected from 2175 (Bonanza collision) to 2311
    2311: { provider: "NBC", time: "7:00 pm ET / 4:00 pm PT (Sun)" }, // Little House on the Prairie
    112470: { provider: "Apple TV+", time: "3:00 am ET / 12:00 am PT (Thu)" }, // Severance
    90611: { provider: "Paramount+", time: "3:00 am ET / 12:00 am PT (Thu)" }, // Halo
    1421: { provider: "Netflix", time: "3:00 am ET / 12:00 am PT (Drop Day)" }, // Orange Is the New Black
    1419: { provider: "ABC", time: "10:00 pm ET / 7:00 pm PT (Thu)" }, // The Practice
    209867: { provider: "AT-X", time: "11:00 pm JST (Fri)" }, // Chained Soldier

    // --- BATCH 9 (24-50 from latest user list) ---
    2300: { provider: "NBC", time: "10:00 pm ET / 7:00 pm PT (Fri)" }, // Las Vegas
    86848: { provider: "CBS", time: "10:00 pm ET / 7:00 pm PT (Fri)" }, // Evil
    63688: { provider: "Cartoon Network", time: "8:00 am ET / 5:00 am PT (Sat)" }, // New Looney Tunes
    2686: { provider: "ITV1", time: "4:00 pm GMT (Weekdays)" }, // Thomas & Friends
    94796: { provider: "CCTV-8", time: "8:00 pm CST (Fri)" }, // Joy of Life
    4140: { provider: "CBS", time: "7:00 pm ET / 4:00 pm PT (Sun)" }, // Lassie
    1546: { provider: "TV Tokyo", time: "6:00 pm JST (Mon)" }, // Yu-Gi-Oh! GX
    284: { provider: "ABC", time: "8:00 pm ET / 5:00 pm PT (Mon)" }, // Dancing with the Stars
    79696: { provider: "NBC", time: "10:00 pm ET / 7:00 pm PT (Mon)" }, // Manifest
    35166: { provider: "Discovery", time: "9:00 pm ET / 6:00 pm PT (Sun)" }, // Gold Rush
    160: { provider: "HBO", time: "9:00 pm ET / 6:00 pm PT (Sun)" }, // Boardwalk Empire
    69050: { provider: "Netflix", time: "3:00 am ET / 12:00 am PT (Drop Day)" }, // Ozark
    3137: { provider: "TNT", time: "9:00 pm ET / 6:00 pm PT (Fri)" }, // Babylon 5
    62560: { provider: "USA Network", time: "10:00 pm ET / 7:00 pm PT (Wed)" }, // Mr. Robot
    2284: { provider: "MTV", time: "8:00 pm ET / 5:00 pm PT (Wed)" }, // The Challenge
    103516: { provider: "Paramount+", time: "3:00 am ET / 12:00 am PT (Thu)" }, // Star Trek: Strange New Worlds
    112151: { provider: "STARZ", time: "8:00 pm ET / 5:00 pm PT (Fri)" }, // Power Book IV: Force
    89393: { provider: "FOX", time: "9:00 pm ET / 6:00 pm PT (Mon)" }, // 9-1-1: Lone Star
    35503: { provider: "France 3", time: "7:00 pm CET (Sat)" }, // Oggy and the Cockroaches
    38400: { provider: "CBS", time: "8:00 pm ET / 5:00 pm PT (Mon)" }, // 2 Broke Girls
    81356: { provider: "Netflix", time: "3:00 am ET / 12:00 am PT (Drop Day)" }, // Sex Education
    75450: { provider: "DC Universe / Max", time: "12:00 am ET (Thu)" }, // Titans
    14354: { provider: "Syfy", time: "10:00 pm ET / 7:00 pm PT (Fri)" }, // Caprica
    97844: { provider: "MBS", time: "11:30 pm JST (Fri)" }, // Rent-a-Girlfriend
    133276: { provider: "Kanal D", time: "8:00 pm TRT (Mon)" }, // Family Secrets (Yargı)
    60920: { provider: "Cartoon Network", time: "9:00 am ET / 6:00 am PT (Sat)" }, // The Tom and Jerry Show
    4145: { provider: "NBC", time: "9:00 pm ET / 6:00 pm PT (Mon)" }, // Medium

    // --- BATCH 10 (1-23 from latest batch) ---
    71914: { provider: "Prime Video", time: "3:00 am ET / 12:00 am PT (Drop Day)" }, // The Wheel of Time
    96648: { provider: "Netflix", time: "3:00 am ET / 12:00 am PT (Drop Day)" }, // Sweet Home
    8592: { provider: "NBC", time: "8:30 pm ET / 5:30 pm PT (Thu)" }, // Parks and Recreation
    156157: { provider: "Fuji TV", time: "5:00 am ET / 2:00 am PT (Thu)" }, // Urusei Yatsura (2022)
    156093: { provider: "AMC", time: "9:00 pm ET / 6:00 pm PT (Sun)" }, // Daryl Dixon
    80752: { provider: "Apple TV+", time: "3:00 am ET / 12:00 am PT (Fri)" }, // See
    10545: { provider: "HBO", time: "9:00 pm ET / 6:00 pm PT (Sun)" }, // True Blood
    1891: { provider: "NBC", time: "8:00 pm ET / 5:00 pm PT (Thu)" }, // The Cosby Show
    63868: { provider: "HTB", time: "9:30 am ET / 6:30 am PT (Fri)" }, // Mr. Osomatsu
    2301: { provider: "CBS", time: "8:30 pm ET / 5:30 pm PT (Fri)" }, // The King of Queens
    13930: { provider: "Fuji TV", time: "5:00 am ET / 2:00 am PT (Tue)" }, // Yu Yu Hakusho
    4381: { provider: "ABC", time: "4:00 pm ET / 1:00 pm PT (Weekdays)" }, // Dark Shadows
    1610: { provider: "FOX", time: "8:00 pm ET / 5:00 pm PT (Fri)" }, // Cops
    42444: { provider: "NHK G", time: "5:00 am ET / 2:00 am PT (Fri)" }, // Kingdom
    12154: { provider: "Syndication", time: "7:00 pm ET / 4:00 pm PT (Weekdays)" }, // TMZ
    2314: { provider: "ABC", time: "10:00 pm ET / 7:00 pm PT (Thu)" }, // Boston Legal
    206411: { provider: "Syndication", time: "10:00 am ET / 7:00 am PT (Weekdays)" }, // Jennifer Hudson
    2426: { provider: "The WB", time: "9:00 pm ET / 6:00 pm PT (Mon)" }, // Angel
    44023: { provider: "Nippon TV", time: "8:00 am ET / 5:00 am PT (Sat)" }, // Chihayafuru
    257745: { provider: "Globoplay", time: "3:00 am ET / 12:00 am PT (Weekly)" }, // Leyla
    2320: { provider: "CBS", time: "9:00 pm ET / 6:00 pm PT (Fri)" }, // Magnum, P.I. (1980)
    90802: { provider: "Netflix", time: "3:00 am ET / 12:00 am PT (Fri)" }, // The Sandman
    60625: { provider: "MBS", time: "3:00 am ET / 12:00 am PT (Fri)" }, // Haikyu!!

    // --- BATCH 11 (52-79) ---
    67260: { provider: "Telemundo", time: "9:00 pm ET (Mon)" }, // Sin senos sí hay paraíso
    228: { provider: "CBS", time: "8:30 pm ET (Thu)" }, // The Andy Griffith Show
    62967: { provider: "Cartoon Network", time: "7:00 pm ET (Fri)" }, // We Bare Bears
    104253: { provider: "Channel 5", time: "8:00 pm GMT (Sun)" }, // All Creatures Great & Small
    66288: { provider: "CCTV-8", time: "8:00 pm CST (Weekdays)" }, // Ode to Joy
    87108: { provider: "HBO", time: "9:00 pm ET (Sun)" }, // Chernobyl
    262335: { provider: "Viva One", time: "12:00 am ET (Weekly)" }, // The Jewel of Section E
    110: { provider: "CBS", time: "10:00 am ET (Sat)" }, // Teenage Mutant Ninja Turtles
    236402: { provider: "Netflix", time: "3:00 am ET (Drop Day)" }, // Love Through a Prism
    70685: { provider: "Star TV", time: "8:00 pm TRT (Mon)" }, // Istanbullu Gelin
    310: { provider: "CBS", time: "10:00 pm ET (Fri)" }, // Numb3rs
    104542: { provider: "HBO", time: "9:00 pm ET (Sun)" }, // Industry
    2611: { provider: "NBC", time: "8:00 pm ET (Sat)" }, // Baywatch
    2516: { provider: "CBS", time: "10:00 pm ET (Wed)" }, // Without a Trace
    113919: { provider: "Tencent Video", time: "9:00 pm CST (Weekly)" }, // Swallowed Star
    2321: { provider: "NBC", time: "10:00 pm ET (Tue)" }, // Homicide: Life on the Street
    2005: { provider: "Disney Channel", time: "9:00 am ET (Sat)" }, // Mickey Mouse Clubhouse
    114695: { provider: "FX", time: "10:00 pm ET (Fri)" }, // Alien: Earth
    1965: { provider: "NBC", time: "9:00 pm ET (Mon)" }, // Quantum Leap
    213713: { provider: "TV Tokyo", time: "5:30 pm JST (Sun)" }, // Kaiju No. 8
    33217: { provider: "Cartoon Network", time: "7:00 pm ET (Wed)" }, // Young Justice
    232: { provider: "CBS", time: "8:00 pm ET (Mon)" }, // Green Acres
    89433: { provider: "YouTube", time: "11:00 am ET (Weekly)" }, // Hot Ones
    105823: { provider: "FOX Turkey", time: "9:00 pm ET (Mon)" }, // Love Is in the Air
    61056: { provider: "ABC", time: "10:00 pm ET (Thu)" }, // How to Get Away with Murder
    4402: { provider: "PBS", time: "9:00 pm ET (Sun)" }, // Great Performances
    250325: { provider: "Prime Video", time: "3:00 am ET (Drop Day)" }, // House of David
    233: { provider: "CBS", time: "8:00 pm ET (Wed)" }, // Diagnosis: Murder

    // --- BATCH 12 (80-101) ---
    2615: { provider: "Cartoon Network", time: "7:30 pm ET (Mon)" }, // Dexter's Laboratory
    1205: { provider: "ABC", time: "8:00 pm ET (Fri)" }, // According to Jim
    2011: { provider: "Cartoon Network", time: "7:00 pm ET (Wed)" }, // Billy and Mandy
    132415: { provider: "Paramount+", time: "9:00 pm ET (Sun)" }, // 1923
    46162: { provider: "Cartoon Network", time: "7:30 pm ET (Fri)" }, // Steven Universe
    5354: { provider: "ITV1", time: "3:00 pm ET (Sun)" }, // Foyle's War
    245084: { provider: "Tokyo MX", time: "10:30 am ET (Sun)" }, // Jack-of-All-Trades
    1534: { provider: "Showtime", time: "10:00 pm ET (Sun)" }, // The Tudors
    44955: { provider: "Telemundo", time: "10:00 pm ET (Mon)" }, // El Señor de los Cielos
    43929: { provider: "NBC", time: "10:00 pm ET (Thu)" }, // Hannibal
    32801: { provider: "Nippon TV", time: "4:30 am ET (Fri)" }, // Fighting Spirit
    18347: { provider: "NBC", time: "8:00 pm ET (Thu)" }, // Community
    5410: { provider: "Network 10", time: "6:30 am ET (Sun)" }, // Prisoner
    88329: { provider: "Disney+", time: "12:00 am ET (Wed)" }, // Hawkeye
    79697: { provider: "NBC", time: "9:00 pm ET (Fri)" }, // Magnum P.I. (2018)
    2302: { provider: "CBS", time: "8:00 pm ET (Wed)" }, // Big Brother
    32690: { provider: "Nippon TV", time: "5:30 am ET (Wed)" }, // City Hunter
    135157: { provider: "tvN", time: "7:00 am ET (Fri)" }, // Alchemy of Souls
    49009: { provider: "ABC", time: "8:00 pm ET (Wed)" }, // The Goldbergs
    2316: { provider: "Adult Swim", time: "11:00 pm ET (Sun)" }, // Robot Chicken
    1318: { provider: "CBS", time: "8:00 pm ET (Sun)" }, // The Waltons
    1111: { provider: "BBC Two", time: "5:00 pm ET (Thu)" } // QI
};