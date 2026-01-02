const isFn = (a) => typeof a === 'function';
const {entries, keys} = Object;

export function splitPlugins(plugins) {
    const fastPlugins = [];
    const restPlugins = [];
    
    for (const current of plugins) {
        const {rule, plugin} = current;
        const names = keys(plugin);
        
        if (names.includes('match')) {
            restPlugins.push(current);
            continue;
        }
        
        if (!names.includes('replace')) {
            restPlugins.push(current);
            continue;
        }
        
        const [is, fastPlugin] = parsePatterns(rule, plugin);
        
        if (!is) {
            restPlugins.push(current);
            continue;
        }
        
        fastPlugins.push(fastPlugin);
    }
    
    return [fastPlugins, restPlugins];
}

function parsePatterns(rule, plugin) {
    if (plugin.report.length)
        return [false];
    
    const result = {
        rule,
        message: plugin.report(),
        patterns: [],
    };
    
    const items = plugin.replace();
    
    for (const [from, to] of entries(items)) {
        if (isFn(to))
            return [false];
        
        const newFrom = replaceTemplateValues(from);
        const newTo = replaceTemplateValues(to);
        
        result.patterns.push([newFrom, newTo]);
    }
    
    return [true, result];
}

function replaceTemplateValues(template) {
    const match = template.match(/__[a-z]/g);
    
    if (!match)
        return template;
    
    for (const current of match) {
        const name = `$${current.at(-1).toUpperCase()}`;
        template = template.replaceAll(current, name);
    }
    
    return template;
}
