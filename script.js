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
    'ö': `{\\"o}`,
    'ü': `{\\"u}`,
    'ñ': `{\\~n}`,
    'ø': `{\\o}`,
    'å': `{\\aa}`,
    'Å': `{\\AA}`,
    'à': '{\\`a}',
    'è': '\\`e',
    'ì': '\\`i',
    'ò': '\\`o',
    'ù': '\\`u',
    'č': '\\v{c}',
    'š': '\\v{s}',
    'ž': '\\v{z}',
    '&': '\\&',
};

// Add other names, capitalization doesn't matter.
const propernouns = ["dirac", "landau", "hall", "waals", "weyl", "rashba", "brillouin", "fano", "hubbard", "van hove", "hove"];

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
    let finalstring = ""
    // For each reference, extract the useful fields
    for (let source of bibs) {
        if (/book\{/i.test(source) || /misc\{/i.test(source)) {
            finalstring += "@" + source + "\n";
            continue;
        }
        if (!/article\{/i.test(source)) {
            continue;
        }
        let cerror = [];
        let cnotes = "";
        let ctag = source.slice(source.indexOf("{")+1,source.indexOf(","));
        let ctitle, cauthor, cyear, cjournal, cvolume, cpages, cdoi;
        try {
            ctitle = untilClosed(source.split(/title\s*=\s*\{/)[1]);
        } catch {
            cerror.push("title");
        }
        try {
            cauthor = untilClosed(source.split(/author\s*=\s*\{/)[1]);
        } catch {
            cerror.push("author");
        }
        try {
            cyear = untilClosed(source.split(/year\s*=\s*\{/)[1]);
        } catch {
            cerror.push("year");
        }
        try {
            cjournal = untilClosed(source.split(/journal\s*=\s*\{/)[1]);
        } catch {
            cerror.push("journal");
        }
        try {
            cvolume = untilClosed(source.split(/volume\s*=\s*\{/)[1]);
        } catch {
            cerror.push("volume");
        }
        try {
            cpages = untilClosed(source.split(/pages\s*=\s*\{/)[1]);
        } catch {
            cerror.push("pages");
        }
        try {
            cdoi = untilClosed(source.split(/doi\s*=\s*\{/)[1]);
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
            // Fix chemical formulae
            ctitle = ctitle.replace(/(?<!\$)_(\d)/g, "$_$1$");
            ctitle = ctitle.replace(/(?<!\$)\^(\d)/g, "$^$1$");

            // Fix proper nouns in titles
            for (let noun of propernouns) {
                reg = new RegExp(noun, "gi");
                ctitle = ctitle.replace(reg, `{${noun[0].toUpperCase()}}${noun.slice(1).toLowerCase()}`);
            }

            // Fix greek letters in titles (credit to ChatGPT)
            
            ctitle = ctitle.replace(/[Α-Ωα-ω]/g, match => greekMap[match] || match);

            // Replace special characters for title
            ctitle = ctitle.replace(/(?<!\\)./g, char => specialCharMap[char] || char);
        }
        
        if (cauthor) {
            // Replace special characters for authors
            cauthor = cauthor.replace(/(?<!\\)./g, char => specialCharMap[char] || char);
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
    a = a.author.replace(/^[^a-zA-Z]+/, "");
    b = b.author.replace(/^[^a-zA-Z]+/, "");
    return a.localeCompare(b);
}
