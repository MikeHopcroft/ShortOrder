function combine(left: string, right: string) {
    if (left.length === 0) {
        return right;
    }
    else if (right.length === 0) {
        return left;
    }
    else {
        return left + ' ' + right;
    }
}

function* generateAliasesHelper(prefix:string, options:string[][]):IterableIterator<string> {
    if (options.length > 0) {
        for (const option of options[0]) {
            yield* generateAliasesHelper(combine(prefix, option), options.slice(1));
        }    
    }
    else {
        yield prefix;
    }
}

export function* generateAliases(query:string) {
    const m = /(\[[^\]]*\])|(\([^\)]*\))|([^\[^\()]*)/g;

    // Remove leading, trailing, and consecutive spaces.
    const query2 = query.replace(/\s+/g,' ').trim();

    // Throw on comma before ] and ).
    if (query2.search(/(,\])|(,\))/g) !== -1) {
        throw TypeError(`generateAliases: illegal trailing comma in "${query}".`);
    }

    const matches = query2.match(m);

    if (matches !== null) {
        const options = matches.map(match => {
            if (match.startsWith('[')) {
                // Selects an option or leaves blank
                return [...match.slice(1, -1).split(','), ''];
            }
            else if (match.startsWith('(')) {
                // Must select from one of the options
                return match.slice(1, -1).split(',');
            }
            else {
                return [match.trim()];
            }
        }).filter(match => match[0].length > 0);
        yield* generateAliasesHelper('', options);
    }
}
