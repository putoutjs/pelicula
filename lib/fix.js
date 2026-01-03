export function applyFix({from, to, node}) {
    const templateVariables = getTemplateVariables(from);
    const text = node.text();
    let result = maybeAddSemi(to, text);
    
    for (const name of templateVariables
        .sort()
        .reverse()) {
        if (name === 'ARGS') {
            const value = node
                .getMultipleMatches('ARGS')
                .map((a) => a.text())
                .join('')
                .replace(',', ', ');
            
            result = result.replace(`$$$ARGS`, value);
        } else {
            const match = node.getMatch(name);
            const value = match.text();
            
            result = result.replace(`$${name}`, value);
        }
    }
    
    return result;
}

function maybeAddSemi(to, text) {
    if (text.endsWith(';') && to)
        return `${to};`;
    
    return to;
}

const rm$ = (a) => {
    while (a.startsWith('$'))
        a = a.slice(1);
    
    return a;
};

function getTemplateVariables(str) {
    const variables = str.match(/(\${3}ARGS|\$[A-Z])/g);
    
    if (!variables)
        return [];
    
    return variables.map(rm$);
}
