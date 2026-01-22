/**
 * CineMontauge Owner-Provided Airtime Overrides
 * 
 * This is the source of truth for all manual airtime entries provided via chat.
 * Format:
 * [tmdbId]: { 
 *    provider: "Platform Name",
 *    time?: "HH:mm", // Default local time (24h) if episode not specific
 *    episodes: {
 *       "S1E1": "Time String", // e.g. "9:00 pm ET 6:00 pm PT"
 *    }
 * }
 */
export const AIRTIME_OVERRIDES: Record<number, { 
    provider: string; 
    time?: string;
    episodes: Record<string, string>;
}> = {
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
    }
};