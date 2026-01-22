/**
 * CineMontauge Owner-Provided Airtime Overrides
 * 
 * This is the source of truth for all manual airtime entries provided via chat.
 */
export const AIRTIME_OVERRIDES: Record<number, { 
    provider: string; 
    time?: string;
    episodes: Record<string, string>;
}> = {
    // The Late Show with Stephen Colbert
    63770: {
        provider: "CBS",
        episodes: {
            "S11E62": "11:35 pm ET 10:35 pm CT",
            "S11E63": "11:35 pm ET 10:35 pm CT",
            "S11E64": "11:35 pm ET 10:35 pm CT"
        }
    },
    // Late Night with Seth Meyers
    61818: {
        provider: "NBC",
        episodes: {
            "S14E54": "12:35 am ET 11:35 pm CT"
        }
    },
    // Chicago Med
    62650: {
        provider: "NBC",
        episodes: {
            "S11E10": "8:00 pm ET 7:00 pm CT",
            "S11E11": "8:00 pm ET 7:00 pm CT"
        }
    },
    // Bridgerton
    91239: {
        provider: "Netflix",
        episodes: {
            "S4E1": "3:00 am ET 12:00 am PT",
            "S4E2": "3:00 am ET 12:00 am PT",
            "S4E3": "3:00 am ET 12:00 am PT",
            "S4E4": "3:00 am ET 12:00 am PT"
        }
    },
    // The Night Manager
    61859: {
        provider: "Prime Video (US) / BBC One (UK)",
        episodes: {
            "S2E4": "3:00 am ET 12:00 am PT",
            "S2E5": "3:00 am ET 12:00 am PT"
        }
    },
    // Detective Conan
    30983: {
        provider: "Japanese TV & International Streaming",
        episodes: {
            "S1E1189": "6:00 pm JST",
            "S1E1190": "6:00 pm JST"
        }
    },
    // Running Man
    33238: {
        provider: "SBS / Korean Streaming",
        episodes: {
            "S1E786": "5:00 pm KST",
            "S1E787": "5:00 pm KST"
        }
    },
    // Men on a Mission
    70672: {
        provider: "JTBC / Netflix",
        episodes: {
            "S1E514": "8:40 pm KST",
            "S1E515": "8:40 pm KST"
        }
    },
    // Hijack
    198102: {
        provider: "Apple TV+",
        episodes: {
            "S2E2": "9:00 pm ET / 6:00 pm PT",
            "S2E3": "9:00 pm ET / 6:00 pm PT"
        }
    },
    // Scene of the Crime
    3034: {
        provider: "Local Broadcast",
        episodes: {
            "S1E4": "Late Evening Local",
            "S1E5": "Late Evening Local"
        }
    },
    // High Potential
    226637: {
        provider: "ABC",
        episodes: {
            "S1E10": "10:00 pm ET / 9:00 pm CT",
            "S1E11": "10:00 pm ET / 9:00 pm CT"
        }
    },
    // Radio Star
    65270: {
        provider: "MBC",
        episodes: {
            "S1E949": "10:30 pm KST"
        }
    },
    // Home Alone
    65282: {
        provider: "MBC",
        episodes: {
            "S1E630": "11:00 pm KST",
            "S1E631": "11:00 pm KST"
        }
    },
    // The Graham Norton Show
    1220: {
        provider: "BBC One",
        episodes: {
            "S32E14": "10:30 pm GMT",
            "S32E15": "10:30 pm GMT"
        }
    },
    // A Knight of the Seven Kingdoms
    224372: { 
        provider: "HBO / HBO Max",
        episodes: {
            "S1E1": "10:00 pm ET 7:00 pm PT",
            "S1E2": "10:00 pm ET 7:00 pm PT"
        }
    },
    // The Rookie
    79744: { 
        provider: "ABC",
        episodes: {
            "S8E3": "10:00 pm ET 7:00 pm PT",
            "S8E4": "10:00 pm ET 7:00 pm PT"
        }
    },
    // Law & Order: Special Victims Unit
    2734: { 
        provider: "NBC",
        episodes: {
            "S27E10": "9:00 pm ET 6:00 pm PT",
            "S27E11": "9:00 pm ET 6:00 pm PT",
            "S27E12": "9:00 pm ET / 6:00 pm PT"
        }
    },
    // Jujutsu Kaisen
    95479: { 
        provider: "Crunchyroll",
        episodes: {
            "S1E50": "12:00 pm ET 9:00 am PT",
            "S1E51": "12:00 pm ET 9:00 am PT"
        }
    },
    // Grey's Anatomy
    1416: { 
        provider: "ABC",
        episodes: {
            "S22E8": "10:00 pm ET 7:00 pm PT",
            "S22E9": "10:00 pm ET 7:00 pm PT",
            "S22E10": "10:00 pm ET / 7:00 pm PT"
        }
    },
    // The Pendragon Cycle – Rise of the Merlin
    23: {
        provider: "DailyWire+",
        episodes: {
            "S1E1": "8:00 pm ET / 5:00 pm PT",
            "S1E2": "8:00 pm ET / 5:00 pm PT"
        }
    },
    // Spartacus – House of Ashur
    240459: {
        provider: "Starz",
        episodes: {
            "S1E8": "9:00 pm ET 6:00 pm PT"
        }
    },
    // Fallout
    106379: {
        provider: "Prime Video",
        episodes: {
            "S2E6": "3:00 am ET 12:00 am PT",
            "S2E7": "3:00 am ET 12:00 am PT"
        }
    },
    // Landman
    157741: {
        provider: "Paramount+",
        episodes: {
            "S2E10": "3:00 am ET 12:00 am PT"
        }
    },
    // Frieren – Beyond Journey’s End
    209867: {
        provider: "Crunchyroll",
        episodes: {
            "S1E29": "10:00 am ET 7:00 am PT",
            "S1E30": "10:00 am ET 7:00 am PT"
        }
    },
    // Law & Order
    549: {
        provider: "NBC",
        episodes: {
            "S25E10": "8:00 pm ET 5:00 pm PT",
            "S25E11": "8:00 pm ET 5:00 pm PT",
            "S25E12": "8:00 pm ET / 5:00 pm PT"
        }
    },
    // The Pitt
    250307: {
        provider: "HBO Max",
        episodes: {
            "S2E2": "9:00 pm ET 6:00 pm PT",
            "S2E3": "9:00 pm ET 6:00 pm PT",
            "S2E4": "9:00 pm ET / 6:00 pm PT"
        }
    },
    // The Queen of Flow
    80240: {
        provider: "Prime Video",
        episodes: {
            "S3E3": "3:00 am ET 12:00 am PT",
            "S3E4": "3:00 am ET 12:00 am PT",
            "S3E5": "3:00 am ET 12:00 am PT",
            "S3E6": "3:00 am ET 12:00 am PT",
            "S3E7": "3:00 am ET 12:00 am PT",
            "S3E8": "3:00 am ET 12:00 am PT",
            "S3E9": "3:00 am ET 12:00 am PT",
            "S3E10": "3:00 am ET 12:00 am PT",
            "S3E11": "3:00 am ET 12:00 am PT",
            "S3E12": "3:00 am ET 12:00 am PT",
            "S3E13": "3:00 am ET / 12:00 am PT"
        }
    },
    // Star Trek – Starfleet Academy
    223530: {
        provider: "Paramount+",
        episodes: {
            "S1E1": "3:00 am ET 12:00 am PT",
            "S1E2": "3:00 am ET 12:00 am PT",
            "S1E3": "3:00 am ET 12:00 am PT",
            "S1E4": "3:00 am ET / 12:00 am PT"
        }
    },
    // Esref’s Dream
    283123: {
        provider: "Prime Video",
        episodes: {
            "S2E16": "3:00 am ET 12:00 am PT",
            "S2E17": "3:00 am ET 12:00 am PT"
        }
    },
    // Državni posao
    46831: {
        provider: "RTS (Serbian TV)",
        episodes: {
            "S14E86": "8:00 pm ET 5:00 pm PT",
            "S14E87": "8:00 pm ET 5:00 pm PT",
            "S14E88": "8:00 pm ET / 5:00 pm PT",
            "S14E89": "8:00 pm ET / 5:00 pm PT",
            "S14E90": "8:00 pm ET / 5:00 pm PT"
        }
    },
    // Hell’s Paradise
    117465: {
        provider: "Crunchyroll",
        episodes: {
            "S1E15": "12:00 pm ET 9:00 am PT",
            "S1E16": "12:00 pm ET 9:00 am PT"
        }
    },
    // Kamen Rider
    2661: {
        provider: "Crunchyroll",
        episodes: {
            "S36E18": "12:00 pm ET 9:00 am PT",
            "S36E19": "12:00 pm ET 9:00 am PT"
        }
    },
    // Secret Lives
    14610: {
        provider: "RTS (Serbian TV)",
        episodes: {
            "S28E87": "8:00 pm ET 5:00 pm PT",
            "S28E88": "8:00 pm ET 5:00 pm PT",
            "S28E89": "8:00 pm ET 5:00 pm PT",
            "S28E90": "8:00 pm ET 5:00 pm PT",
            "S28E91": "8:00 pm ET 5:00 pm PT",
            "S28E92": "8:00 pm ET 5:00 pm PT",
            "S28E93": "8:00 pm ET 5:00 pm PT",
            "S28E94": "8:00 pm ET 5:00 pm PT"
        }
    },
    // Tomorrow Is Ours
    72879: {
        provider: "TF1 / France TV",
        episodes: {
            "S2E99": "8:00 pm ET 5:00 pm PT",
            "S2E100": "8:00 pm ET 5:00 pm PT",
            "S2E101": "8:00 pm ET 5:00 pm PT",
            "S2E102": "8:00 pm ET 5:00 pm PT",
            "S2E103": "8:00 pm ET 5:00 pm PT",
            "S2E104": "8:00 pm ET 5:00 pm PT",
            "S2E105": "8:00 pm ET 5:00 pm PT"
        }
    },
    // The Tonight Show Starring Jimmy Fallon
    599: {
        provider: "NBC",
        episodes: {
            "S14E8": "11:35 pm ET 10:35 pm PT"
        }
    },
    // The Daily Show
    2224: {
        provider: "Comedy Central",
        episodes: {
            "S31E8": "11:00 pm ET 10:00 pm PT",
            "S31E9": "11:00 pm ET 10:00 pm PT",
            "S31E10": "11:00 pm ET 10:00 pm PT",
            "S31E11": "11:00 pm ET 10:00 pm PT",
            "S31E12": "11:00 pm ET 10:00 pm PT",
            "S31E13": "11:00 pm ET 10:00 pm PT",
            "S31E14": "11:00 pm ET 10:00 pm PT",
            "S31E15": "11:00 PM ET / 10:00 PM PT"
        }
    },
    // Chicago Fire
    44006: {
        provider: "NBC",
        episodes: {
            "S14E10": "9:00 pm ET 8:00 pm CT 6:00 pm PT",
            "S14E11": "9:00 pm ET 8:00 pm CT 6:00 pm PT"
        }
    },
    // Chicago P.D.
    58841: {
        provider: "NBC",
        episodes: {
            "S13E10": "10:00 PM ET / 7:00 PM PT",
            "S13E11": "10:00 PM ET / 7:00 PM PT"
        }
    },
    // RAW
    4656: {
        provider: "USA Network",
        episodes: {
            "S34E3": "8:00 PM ET / 5:00 PM PT",
            "S34E4": "8:00 PM ET / 5:00 PM PT"
        }
    },
    // 9-1-1
    75219: {
        provider: "ABC",
        episodes: {
            "S9E9": "8:00 PM ET / 5:00 PM PT",
            "S9E10": "8:00 PM ET / 5:00 PM PT"
        }
    },
    // Dinastía Casillas
    302463: {
        provider: "Prime Video",
        episodes: {
            "S1E68": "3:00 AM ET / 12:00 AM PT",
            "S1E69": "3:00 AM ET / 12:00 AM PT",
            "S1E70": "3:00 AM ET / 12:00 AM PT",
            "S1E71": "3:00 AM ET / 12:00 AM PT",
            "S1E72": "3:00 AM ET / 12:00 AM PT",
            "S1E73": "3:00 AM ET / 12:00 AM PT"
        }
    },
    // Watch What Happens Live with Andy Cohen
    22: {
        provider: "Bravo",
        episodes: {
            "S23E10": "10:00 PM ET / 7:00 PM PT",
            "S23E11": "10:00 PM ET / 7:00 PM PT",
            "S23E12": "10:00 PM ET / 7:00 PM PT",
            "S23E13": "10:00 PM ET / 7:00 PM PT",
            "S23E14": "10:00 PM ET / 7:00 PM PT",
            "S23E15": "10:00 PM ET / 7:00 PM PT"
        }
    },
    // Only You
    199332: {
        provider: "Prime Video",
        episodes: {
            "S17E5": "3:00 AM ET / 12:00 AM PT",
            "S17E6": "3:00 AM ET / 12:00 AM PT",
            "S17E7": "3:00 AM ET / 12:00 AM PT",
            "S17E8": "3:00 AM ET / 12:00 AM PT"
        }
    },
    // Phineas and Ferb
    1877: {
        provider: "Disney Channel / Disney+",
        episodes: {
            "S1E36": "8:00 pm ET / 5:00 pm PT",
            "S1E37": "8:00 pm ET / 5:00 pm PT",
            "S1E38": "8:00 pm ET / 5:00 pm PT"
        }
    },
    // Spring Fever
    280948: {
        provider: "Streaming / Netflix",
        episodes: {
            "S1E5": "12:00 am ET / 9:00 pm PT",
            "S1E6": "12:00 am ET / 9:00 pm PT",
            "S1E7": "12:00 am ET / 9:00 pm PT",
            "S1E8": "12:00 am ET / 9:00 pm PT"
        }
    },
    // Fights Break Sphere
    79481: {
        provider: "Streaming / Bilibili",
        episodes: {
            "S1E182": "12:00 am ET / 9:00 pm PT",
            "S1E183": "12:00 am ET / 9:00 pm PT"
        }
    },
    // Good Mythical Morning
    65701: {
        provider: "YouTube",
        episodes: {
            "S1E10": "6:00 am ET / 3:00 am PT",
            "S1E11": "6:00 am ET / 3:00 am PT",
            "S1E12": "6:00 am ET / 3:00 am PT",
            "S1E13": "6:00 am ET / 3:00 am PT",
            "S1E14": "6:00 am ET / 3:00 am PT",
            "S1E15": "6:00 am ET / 3:00 am PT"
        }
    },
    // Sentenced to be a Hero
    249907: {
        provider: "Streaming / Crunchyroll",
        episodes: {
            "S1E3": "12:00 am ET / 9:00 pm PT",
            "S1E4": "12:00 am ET / 9:00 pm PT",
            "S1E26": "12:00 am ET / 9:00 pm PT",
            "S1E27": "12:00 am ET / 9:00 pm PT"
        }
    },
    // RuPaul's Drag Race
    8514: {
        provider: "MTV / Paramount+",
        episodes: {
            "S18E3": "8:00 pm ET / 5:00 pm PT",
            "S18E4": "8:00 pm ET / 5:00 pm PT"
        }
    },
    // Jeopardy!
    2912: {
        provider: "Local Affiliate / Peacock",
        episodes: {
            "S42E95": "7:30 pm ET / 4:30 pm PT",
            "S42E96": "7:30 pm ET / 4:30 pm PT",
            "S42E97": "7:30 pm ET / 4:30 pm PT",
            "S42E98": "7:30 pm ET / 4:30 pm PT",
            "S42E99": "7:30 pm ET / 4:30 pm PT",
            "S42E100": "7:30 pm ET / 4:30 pm PT",
            "S42E101": "7:30 pm ET / 4:30 pm PT",
            "S42E102": "7:30 pm ET / 4:30 pm PT",
            "S42E103": "7:30 pm ET / 4:30 pm PT",
            "S42E104": "7:30 pm ET / 4:30 pm PT"
        }
    },
    // Renegade Immortal
    223911: {
        provider: "Tencent Video / Crunchyroll",
        episodes: {
            "S1E124": "5:00 am ET / 2:00 am PT",
            "S1E125": "5:00 am ET / 2:00 am PT"
        }
    },
    // Saturday Night Live
    1667: {
        provider: "NBC / Peacock",
        episodes: {
            "S51E10": "11:29 pm ET / 8:29 pm PT",
            "S51E11": "11:29 pm ET / 8:29 pm PT"
        }
    },
    // Call the Midwife
    39793: {
        provider: "BBC One / BBC iPlayer",
        episodes: {
            "S15E2": "8:00 pm GMT / 3:00 pm ET",
            "S15E3": "8:00 pm GMT / 3:00 pm ET"
        }
    }
};