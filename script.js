/*--------------------
--------Change--------
--------------------*/

// Can add other key-value pairs, make sure to double back-slash
const specialCharMap = {
    'é': `{\\'e}`,
    'á': `{\\'a}`,
    'í': `{\\'i}`,
    'ó': `{\\'o}`,
    'ú': `{\\'u}`,
    'ä': `{\\"a}`,
    'ë': `{\\"e}`,
    'ö': `{\\"o}`,
    'ü': `{\\"u}`,
    'ñ': `{\\~n}`,
    'ø': `{\\o}`,
    'å': `{\\aa}`,
    'Å': `{\\AA}`,
    'à': '{\\`a}',
    'è': '{\\`e}',
    'ì': '{\\`i}',
    'ò': '{\\`o}',
    'ù': '{\\`u}',
    'č': '{\\v{c}}',
    'ç': '{\\c{c}}',
    'ğ': '{\\u{g}}',
    'š': '{\\v{s}}',
    'ž': '{\\v{z}}',
    '&': '\\&',
};

// Add other names, capitalization doesn't matter.
const propernouns = ['bloch', 'bragg', 'brillouin', 'dirac', 'fano', 'fermi', 'hall', 'hofstadter', 'hove', 'hubbard', 'kondo', 'landau', 'majorana', 'mott', 'rashba', 'van hove', 'waals', 'weyl'];

// Other things that should be surrounded with braces.
const needsbraces = ["1D", "2D", "3D", "Q"];

// Un-abbreviate journal names
const journalAbbrevMap = {
    'Phys. Rev.': 'Physical Review',
    'Lett.': 'Letters',
    'Rev. Mod. Phys.': 'Reviews of Modern Physics',
    'Rev. Sci. Inst.': 'Review of Scientific Instruments',
    'J. Vac. Sci. Technol.': 'Journal of Vacuum Science \\& Technology',
};

/*--------------------
--Maybe don't change--
--------------------*/

function produceGoodRef() {
    badref = document.getElementById("badref");
    newref = convertRef(badref.value);
    goodref = document.getElementById("goodref");
    errorlog = document.getElementById("errorlog");
    goodref.value = newref.res || "Bib file invalid.";
    errorlog.value = newref.err;
}

function convertRef(text) {
    // Split references
    const bibs = text.split("@");
    let bibsinfo = [];
    let finalstring = "";
    // For each reference, extract the useful fields
    for (let source of bibs) {
        if (/book\s*\{/i.test(source) || /misc\s*\{/i.test(source)) {
            finalstring += "@" + source + "\n";
            continue;
        }
        if (!/article\s*\{/i.test(source)) {
            continue;
        }
        let cerror = [];
        let cnotes = "";
        let ctag = source.slice(source.indexOf("{")+1,source.indexOf(","));
        let ctitle, cauthor, cyear, cjournal, cvolume, cpages, cdoi;
        try {
            ctitle = untilClosed(source.split(/title\s*=\s*\{/i)[1]);
        } catch {
            cerror.push("title");
        }
        try {
            cauthor = untilClosed(source.split(/author\s*=\s*\{/i)[1]);
        } catch {
            cerror.push("author");
        }
        try {
            cyear = untilClosed(source.split(/year\s*=\s*\{/i)[1]);
        } catch {
            cerror.push("year");
        }
        try {
            cjournal = untilClosed(source.split(/journal\s*=\s*\{/i)[1]);
        } catch {
            cerror.push("journal");
        }
        try {
            cvolume = untilClosed(source.split(/volume\s*=\s*\{/i)[1]);
        } catch {
            cerror.push("volume");
        }
        try {
            cpages = untilClosed(source.split(/pages\s*=\s*\{/i)[1]);
        } catch {
            cerror.push("pages");
        }
        try {
            cdoi = untilClosed(source.split(/doi\s*=\s*\{/i)[1]);
        } catch {
            cerror.push("doi");
        }
        // Complain if tag has no year
        if (!/\d/.test(ctag)) {
            cnotes += `Add year to tag for '${ctag}'. `;
        }
        
        // Don't change
        const greekMap = {
            'Α': '\\Alpha', 'Β': '\\Beta', 'Γ': '\\Gamma', 'Δ': '\\Delta', 'Ε': '\\Epsilon',
            'Ζ': '\\Zeta', 'Η': '\\Eta', 'Θ': '\\Theta', 'Ι': '\\Iota', 'Κ': '\\Kappa',
            'Λ': '\\Lambda', 'Μ': '\\Mu', 'Ν': '\\Nu', 'Ξ': '\\Xi', 'Ο': '\\Omicron',
            'Π': '\\Pi', 'Ρ': '\\Rho', 'Σ': '\\Sigma', 'Τ': '\\Tau', 'Υ': '\\Upsilon',
            'Φ': '\\Phi', 'Χ': '\\Chi', 'Ψ': '\\Psi', 'Ω': '\\Omega',
            'α': '\\alpha', 'β': '\\beta', 'γ': '\\gamma', 'δ': '\\delta', 'ε': '\\epsilon',
            'ζ': '\\zeta', 'η': '\\eta', 'θ': '\\theta', 'ι': '\\iota', 'κ': '\\kappa',
            'λ': '\\lambda', 'μ': '\\mu', 'ν': '\\nu', 'ξ': '\\xi', 'ο': '\\omicron',
            'π': '\\pi', 'ρ': '\\rho', 'σ': '\\sigma', 'τ': '\\tau', 'υ': '\\upsilon',
            'φ': '\\phi', 'χ': '\\chi', 'ψ': '\\psi', 'ω': '\\omega'
        };

        if (ctitle) {
            // Strip outer braces
            ctitle = ctitle.replace(/^\{(.*)\}$/, "$1");

            // Detect chemical formula (words starting with a letter including a number)
            const formulaWord = /\b(?=[A-Za-z0-9]*[A-Za-z])(?=[A-Za-z0-9]*\d)[A-Za-z0-9]+\b/g;            
            if (formulaWord.test(ctitle)) {
              ctitle = ctitle.replace(formulaWord, (token) => {
                // Step 1: convert digits to LaTeX subscripts
                const latex = token.replace(/([A-Za-z])(\d+)/g, "$1$_{$2}$");
            
                // Step 2: wrap only if not already wrapped
                if (/^\{.*\}$/.test(latex)) {
                  return latex;
                } else {
                  return `{${latex}}`;
                }
              });
            
              cnotes += `Chemical formula detected for ${ctag}. `;
            }
         
            // Fix proper nouns in titles
            for (let noun of propernouns) {
                reg = new RegExp(noun, "gi");
                ctitle = ctitle.replace(reg, `{${noun[0].toUpperCase()}}${noun.slice(1).toLowerCase()}`);
            }

            // Fix greek letters in titles (credit to ChatGPT)            
            ctitle = ctitle.replace(/[Α-Ωα-ω]/g, match => greekMap[match] || match);

            // Replace special characters for title
            ctitle = ctitle.replace(/(?<!\\)./g, char => specialCharMap[char] || char);

            // Add braces for things like 3D
            for (let tooth of needsbraces) {
                reg = new RegExp("(?<![a-zA-Z])"+tooth+"(?![a-zA-Z])", "g");
                ctitle = ctitle.replace(reg, match => "{" + match + "}");
            }
            
        }
        
        if (cauthor) {
            // Replace special characters for authors
            cauthor = cauthor.replace(/(?<!\\)./g, char => specialCharMap[char] || char);

            // Flag equals signs
            if (cauthor.includes("=")) {
                cnotes += `Authors includes '=' for ${ctag}. `;
            };

            // Bracket multi-word names
            let names = cauthor.split(/\s+and\s+/);
            for (let name of names) {
                name = name.split(/\s*,\s*/)[0];
                if (name.includes(" ")) {
                    cauthor = cauthor.replace(name, `{${name}}`);
                }
            }
        }

        if (cjournal) {
            // Replace abbreviated journal titles
            reg = new RegExp(`(${Object.keys(journalAbbrevMap).join('|')})`, 'g');
            cjournal = cjournal.replace(reg, match => journalAbbrevMap[match] || match);
        }
        
        if (cpages) {
            // Replace weird hyphen with correct dash so that page numbers appear correctly
            cpages = cpages.replace(/–/g,'-');
        }
        
        bibsinfo.push({
            tag: ctag,
            title: ctitle,
            author: cauthor,
            year: cyear,
            journal: cjournal,
            volume: cvolume,
            pages: cpages,
            doi: cdoi,
            error: cerror,
            notes: cnotes
        });
    }

    // Remove duplicate dois
    let dois = {};
    let extras = [];
    for (let obj of bibsinfo) {
        if (!obj.doi) {
            extras.push(obj);
            continue;
        }
        d = obj.doi.toLowerCase();
        if (d in dois) {
            dois[d].push(obj);
        } else {
            dois[d] = [obj];
        }
    }
    bibsinfo = extras;
    for (let d in dois) {
        let ctag, ctitle, cauthor, cyear, cjournal, cvolume, cpages;
        let cerror = [];
        let cnotes = "";
        for (let obj of dois[d]) {
            ctag = ctag || obj.tag;
            ctitle = ctitle || obj.title;
            cauthor = cauthor || obj.author;
            cyear = cyear || obj.year;
            cvolume = cvolume || obj.volume;
            cjournal = cjournal || obj.journal;
            cpages = cpages || obj.pages;
            cerror = cerror.filter(item => obj.error.includes(item));
            cnotes = cnotes + obj.notes;
        }
        bibsinfo.push({
            tag: ctag,
            title: ctitle,
            author: cauthor,
            year: cyear,
            journal: cjournal,
            volume: cvolume,
            pages: cpages,
            doi: d,
            error: cerror,
            notes: cnotes
        });
    }

    // Sort by first author last name
    bibsinfo.sort(compareAuthors);

    // Produce new BibTeX
    let errorstring = "You need to fix:\n";
    for (let obj of bibsinfo) {
        if (obj.error.length > 0) {
            errorstring += `The reference '${obj.tag}' is missing: ${obj.error}\n`
        }
        finalstring += `@article{${obj.tag},
    title = {${obj.title||"[PLACEHOLDER]"}},
    author = {${obj.author||"[PLACEHOLDER]"}},
    year = {${obj.year||"[PLACEHOLDER]"}},
    journal = {${obj.journal||"[PLACEHOLDER]"}},
    volume = {${obj.volume||"[PLACEHOLDER]"}},
    pages = {${obj.pages||"[PLACEHOLDER]"}},
    doi = {${obj.doi||"[PLACEHOLDER]"}}\n}\n\n`;
    }
    if (errorstring.length == 17) errorstring += "Nothing";
    // Include recommendations
    errorstring += "\nSuggestions:\n";
    for (let obj of bibsinfo) {
        if (obj.notes.length > 0) {
            errorstring += obj.notes + "\n";
        }
    }
    if (errorstring.slice(-13) == "Suggestions:\n") errorstring += "Nothing";

    return {res: finalstring, err: errorstring};
}

function untilClosed(text) {
    // Slice until unmatched right brace
    let empty = "";
    let count = 0
    for (let i=0; i<text.length; i++) {
        if (text[i] == "{") count++;
        if (text[i] == "}") count--;
        if (count < 0) break;
        empty += text[i];
    }
    return empty;
}

function compareAuthors(a,b) {
    // Strip leading special characters
    try {
        a = a.author.replace(/^[^a-zA-Z]+/, "");
    } catch {
        a = "zzz";
    }
    try {
        b = b.author.replace(/^[^a-zA-Z]+/, "");
    } catch {
        b = "zzz";
    }
    
    return a.localeCompare(b);
}



