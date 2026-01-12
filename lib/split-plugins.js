const isFn = (a) => typeof a === 'function';
const {entries, keys} = Object;
import nano from 'nano-memoize';
const {nanomemoize = nano} = nano;

const EXCLUDE = new Set([
    'match',
    'filter',
    'include',
]);

const INCLUDE = new Set(['replace']);

export const originalPluginSymbol = Symbol('original-plugin');

export const splitPlugins = nanomemoize((plugins) => {
    const fastPlugins = [];
    const restPlugins = [];
    const mapOfPlugins = new Map();
    
    for (const current of plugins) {
        const {rule, plugin} = current;
        const names = new Set(keys(plugin));
        
        if (names.intersection(EXCLUDE).size) {
            restPlugins.push(current);
            continue;
        }
        
        if (!names.intersection(INCLUDE).size) {
            restPlugins.push(current);
            continue;
        }
        
        const [is, fastPlugin] = parsePatterns(rule, plugin);
        
        if (!is) {
            restPlugins.push(current);
            continue;
        }
        
        fastPlugins.push(fastPlugin);
        mapOfPlugins.set(fastPlugin, current);
    }
    
    return [
        fastPlugins,
        restPlugins,
        mapOfPlugins,
    ];
});

function parsePatterns(rule, plugin) {
    const {
        report,
        replace,
        exclude,
    } = plugin;
    
    if (report.length)
        return [false];
    
    if (replace.length)
        return [false];
    
    const result = {
        rule,
        message: report(),
        patterns: [],
    };
    
    const items = replace();
    
    for (const [from, to] of entries(items)) {
        if (isFn(to))
            return [false];
        
        const newFrom = replaceTemplateValues(from);
        const newTo = replaceTemplateValues(to);
        
        result.patterns.push([newFrom, newTo]);
    }
    
    if (!exclude)
        return [true, result];
    
    result.exclude = [];
    for (const from of exclude()) {
        const newFrom = replaceTemplateValues(from);
        
        result.exclude.push(newFrom);
    }
    
    return [true, result];
}

function replaceTemplateValues(template) {
    const match = template.match(/__(args|[a-z])/g);
    
    if (!match)
        return template;
    
    const reversed = match
        .sort()
        .reverse();
    
    for (const current of reversed) {
        if (current === '__args') {
            template = template.replaceAll(current, '$$$$$$ARGS');
            
            continue;
        }
        
        const upperName = current
            .at(-1)
            .toUpperCase();
        
        const name = `$${upperName}`;
        
        template = template.replaceAll(current, name);
    }
    
    return template;
};
